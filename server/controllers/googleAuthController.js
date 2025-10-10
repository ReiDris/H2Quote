const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const googleAuth = async (req, res) => {
  try {
    console.log('🔍 Google Auth Request Body:', req.body);
    
    const { credential, code, redirect_uri } = req.body;
    
    console.log('📝 Received:', { 
      hasCredential: !!credential, 
      hasCode: !!code, 
      redirect_uri 
    });

    let googleUser;
    
    if (credential) {
      console.log('🔐 Using credential method');
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      googleUser = await response.json();

      if (googleUser.error) {
        console.log('Credential validation error:', googleUser.error);
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token'
        });
      }
    } else if (code && redirect_uri) {
      console.log('🔐 Using authorization code method');
      console.log('📍 Redirect URI:', redirect_uri);
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirect_uri
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('🎫 Token response:', tokenData.error ? tokenData : 'Token received successfully');

      if (tokenData.error) {
        console.log('❌ Token exchange error:', tokenData.error, tokenData.error_description);
        return res.status(400).json({
          success: false,
          message: 'Failed to exchange authorization code: ' + tokenData.error_description || tokenData.error
        });
      }

      const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);
      googleUser = await userInfoResponse.json();

      if (googleUser.error) {
        console.log('❌ User info error:', googleUser.error);
        return res.status(400).json({
          success: false,
          message: 'Failed to get user info: ' + googleUser.error
        });
      }
      
      console.log('✅ User info retrieved:', { email: googleUser.email, name: googleUser.name });
    } else {
      console.log('❌ Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'Either Google credential or authorization code with redirect_uri is required'
      });
    }

    const { email, name, given_name, family_name, picture } = googleUser;

    if (!email) {
      console.log('❌ No email provided by Google');
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google'
      });
    }

    console.log('👤 Looking up user:', email);

    const { data: userResults, error: userError } = await supabase.rpc(
      'get_user_with_company',
      { user_email: email }
    );

    let user;

    if (userError || !userResults || userResults.length === 0) {
      console.log('➕ Creating new user');
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        const insertCompanyQuery = `
          INSERT INTO companies 
          (company_name, email, status, created_at, updated_at) 
          VALUES ($1, $2, 'Active', NOW(), NOW())
          RETURNING company_id
        `;
        const companyResult = await client.query(insertCompanyQuery, [
          `${given_name || name || 'User'}'s Company`,
          email
        ]);
        const companyId = companyResult.rows[0].company_id;

        const insertUserQuery = `
          INSERT INTO users 
          (company_id, first_name, last_name, email, user_type, 
           is_primary_contact, status, google_id, profile_picture, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, 'client', true, 'Active', $5, $6, NOW(), NOW())
          RETURNING user_id
        `;
        
        const userResult = await client.query(insertUserQuery, [
          companyId,
          given_name || (name ? name.split(' ')[0] : 'User'),
          family_name || (name ? name.split(' ').slice(1).join(' ') : ''),
          email,
          googleUser.id || googleUser.sub, 
          picture
        ]);

        await client.query('COMMIT');

        const { data: newUserResults } = await supabase.rpc(
          'get_user_with_company',
          { user_email: email }
        );
        
        user = newUserResults[0];
        console.log('✅ New user created:', user.user_id);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log('❌ User creation error:', error);
        throw error;
      } finally {
        client.release();
      }
    } else {
      console.log('✅ Existing user found:', userResults[0].user_id);
      user = userResults[0];

      if (user.user_status !== 'Active') {
        console.log('❌ User account not active:', user.user_status);
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact support.',
          accountStatus: user.user_status
        });
      }

      const updateData = { last_login: new Date().toISOString() };
      if (picture) {
        updateData.profile_picture = picture;
      }
      
      await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', user.user_id);
    }

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
      profilePicture: user.profile_picture || picture,
    };

    try {
      await supabase.from('audit_log').insert({
        table_name: 'users',
        record_id: user.user_id,
        action: 'UPDATE',
        new_values: { 
          last_login: new Date().toISOString(), 
          login_method: credential ? 'google_jwt' : 'google_oauth'
        },
        changed_by: user.email,
        change_reason: 'Google OAuth login',
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    console.log('✅ Google login successful for:', email);

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        token: token,
        user: userData,
      },
    });

  } catch (error) {
    console.error('❌ Google auth error:', error);
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