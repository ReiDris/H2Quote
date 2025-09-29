const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: userResults, error: userError } = await supabase.rpc(
      'get_user_with_company',
      { user_email: req.user.email }
    );

    if (userError || !userResults || userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResults[0];

    const accountData = {
      id: user.user_id,
      name: `${user.first_name} ${user.last_name}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      contactNo: user.phone, 
      userType: user.user_type,
      companyId: user.company_id,
      companyName: user.company_name,
      profilePicture: user.profile_picture,
      department: user.department,
      lastLogin: user.last_login
    };

    res.json({
      success: true,
      message: 'Account details retrieved successfully',
      data: accountData
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve account details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, contactNo, password, firstName, lastName } = req.body;

    if (!name && !email && !contactNo && !password && !firstName && !lastName) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const userCheckQuery = 'SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $1';
      const userCheckResult = await client.query(userCheckQuery, [userId]);

      if (userCheckResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const currentUser = userCheckResult.rows[0];

      if (email && email !== currentUser.email) {
        const emailCheckQuery = 'SELECT user_id FROM users WHERE email = $1 AND user_id != $2';
        const emailCheckResult = await client.query(emailCheckQuery, [email, userId]);

        if (emailCheckResult.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email address is already in use'
          });
        }
      }

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (name && !firstName && !lastName) {
        const nameParts = name.trim().split(' ');
        const first = nameParts[0] || '';
        const last = nameParts.slice(1).join(' ') || '';
        
        updateFields.push(`first_name = $${paramCount++}`);
        updateValues.push(first);
        updateFields.push(`last_name = $${paramCount++}`);
        updateValues.push(last);
      } else {

        if (firstName !== undefined) {
          updateFields.push(`first_name = $${paramCount++}`);
          updateValues.push(firstName.trim());
        }
        if (lastName !== undefined) {
          updateFields.push(`last_name = $${paramCount++}`);
          updateValues.push(lastName.trim());
        }
      }

      if (email) {
        updateFields.push(`email = $${paramCount++}`);
        updateValues.push(email.toLowerCase().trim());
      }

      if (contactNo !== undefined) {
        updateFields.push(`phone = $${paramCount++}`);
        updateValues.push(contactNo.trim());
      }

      if (password && password !== '************') {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
          });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields.push(`password_hash = $${paramCount++}`);
        updateValues.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateFields.push(`updated_at = $${paramCount++}`);
      updateValues.push(new Date());

      updateValues.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE user_id = $${paramCount}
        RETURNING user_id, first_name, last_name, email, phone
      `;

      const updateResult = await client.query(updateQuery, updateValues);
      const updatedUser = updateResult.rows[0];

      await client.query('COMMIT');

      try {
        const auditData = {};
        if (firstName !== undefined || lastName !== undefined || name) auditData.name_updated = true;
        if (email) auditData.email = email;
        if (contactNo !== undefined) auditData.contact_updated = true;
        if (password && password !== '************') auditData.password_updated = true;

        await supabase.from('audit_log').insert({
          table_name: 'users',
          record_id: userId,
          action: 'UPDATE',
          new_values: auditData,
          changed_by: req.user.email,
          change_reason: 'Account settings update',
          ip_address: req.ip || req.connection.remoteAddress,
        });
      } catch (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }

      const responseData = {
        id: updatedUser.user_id,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim(),
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        contactNo: updatedUser.phone 
      };

      res.json({
        success: true,
        message: 'Account updated successfully',
        data: responseData
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const client = await pool.connect();
    
    try {
      const userQuery = 'SELECT user_id, email, password_hash FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = $2 
        WHERE user_id = $3
      `;

      await client.query(updateQuery, [hashedNewPassword, new Date(), userId]);

      try {
        await supabase.from('audit_log').insert({
          table_name: 'users',
          record_id: userId,
          action: 'UPDATE',
          new_values: { password_changed: true },
          changed_by: user.email,
          change_reason: 'Password change',
          ip_address: req.ip || req.connection.remoteAddress,
        });
      } catch (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserAccount,
  updateUserAccount,
  changePassword
};