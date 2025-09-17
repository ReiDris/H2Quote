// controllers/googleAuthController.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify Google JWT token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const googleUser = await response.json();

    if (googleUser.error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const { email, name, given_name, family_name, picture } = googleUser;

    // Check if user exists in database
    const { data: userResults, error: userError } = await supabase.rpc(
      'get_user_with_company',
      { user_email: email }
    );

    let user;

    if (userError || !userResults || userResults.length === 0) {
      // User doesn't exist, create new user
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Create a default company for Google users (you might want to modify this)
        const insertCompanyQuery = `
          INSERT INTO companies 
          (company_name, email, status, created_at, updated_at) 
          VALUES ($1, $2, 'Active', NOW(), NOW())
          RETURNING company_id
        `;
        const companyResult = await client.query(insertCompanyQuery, [
          `${given_name || name}'s Company`,
          email
        ]);
        const companyId = companyResult.rows[0].company_id;

        // Create user
        const insertUserQuery = `
          INSERT INTO users 
          (company_id, first_name, last_name, email, user_type, 
           is_primary_contact, status, google_id, profile_picture, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, 'client', true, 'Active', $5, $6, NOW(), NOW())
          RETURNING user_id
        `;
        
        const userResult = await client.query(insertUserQuery, [
          companyId,
          given_name || name.split(' ')[0] || 'User',
          family_name || name.split(' ').slice(1).join(' ') || '',
          email,
          googleUser.sub, // Google user ID
          picture
        ]);

        await client.query('COMMIT');

        // Fetch the newly created user with company info
        const { data: newUserResults } = await supabase.rpc(
          'get_user_with_company',
          { user_email: email }
        );
        
        user = newUserResults[0];
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      user = userResults[0];

      // Check if user account is active
      if (user.user_status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact support.',
          accountStatus: user.user_status
        });
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.user_id);
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
      companyId: user.company_id,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Map user type to role
    let role;
    switch (user.user_type) {
      case 'admin':
        role = 'admin';
        break;
      case 'staff':
        role = 'staff';
        break;
      case 'client':
        role = 'customer';
        break;
      default:
        role = 'customer';
    }

    const userData = {
      id: user.user_id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      role: role,
      department: user.department,
      companyId: user.company_id,
      companyName: user.company_name,
      isPrimaryContact: user.is_primary_contact,
      permissions: user.permissions,
      lastLogin: user.last_login,
      profilePicture: user.profile_picture,
    };

    // Log audit entry
    try {
      await supabase.from('audit_log').insert({
        table_name: 'users',
        record_id: user.user_id,
        action: 'UPDATE',
        new_values: { last_login: new Date().toISOString(), login_method: 'google' },
        changed_by: user.email,
        change_reason: 'Google OAuth login',
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        token: token,
        user: userData,
      },
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  googleAuth
};