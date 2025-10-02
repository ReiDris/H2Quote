const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { sendAccountApprovalEmail } = require('../emailServices/emailService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getPendingUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        user_id, first_name, last_name, email, phone, 
        verification_file_original_name, verification_file_path, created_at,
        companies (company_name, phone, email)
      `)
      .eq('status', 'Inactive')
      .eq('user_type', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending users'
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'staff', 'client'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required (admin, staff, or client)'
      });
    }

    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select(`
        first_name, last_name, email, company_id, is_primary_contact,
        companies (company_name)
      `)
      .eq('user_id', userId)
      .single();

    if (getUserError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data based on role
    const updateData = {
      status: 'Active',
      user_type: role,
      updated_at: new Date().toISOString()
    };

    // If changing to staff or admin, set company_id to NULL (required by constraint)
    if (role === 'staff' || role === 'admin') {
      updateData.company_id = null;
      updateData.is_primary_contact = false;
    }

    const { error: userError } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId);

    if (userError) {
      throw userError;
    }

    // Only update company status if user is approved as client and is primary contact
    if (role === 'client' && userData.is_primary_contact && userData.company_id) {
      await supabase
        .from('companies')
        .update({ 
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('company_id', userData.company_id);
    }

    await supabase
      .from('audit_log')
      .insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        new_values: { status: 'Active', user_type: role },
        changed_by: req.user.email,
        change_reason: `User approved by admin with role: ${role}`,
        ip_address: req.ip || req.connection.remoteAddress
      });

    try {
      const customerName = `${userData.first_name} ${userData.last_name}`;
      const companyName = userData.companies?.company_name || 'Your Company';
      
      const emailSent = await sendAccountApprovalEmail(
        customerName,
        companyName,
        userData.email
      );

      if (emailSent) {
        console.log('Approval email sent successfully to:', userData.email);
      } else {
        console.error('Failed to send approval email to:', userData.email);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    res.json({
      success: true,
      message: `User approved successfully as ${role} and notification email sent`
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('users')
      .update({ 
        status: 'Rejected',
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    await supabase
      .from('audit_log')
      .insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        new_values: { status: 'Rejected', rejection_reason: reason },
        changed_by: req.user.email,
        change_reason: 'User rejected by admin',
        ip_address: req.ip || req.connection.remoteAddress
      });

    res.json({
      success: true,
      message: 'User rejected successfully'
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user'
    });
  }
};

const serveVerificationFile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get token from query parameter for iframe access
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user is admin
      if (decoded.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('verification_file_path, verification_file_original_name')
      .eq('user_id', userId)
      .single();
    
    if (error || !user || !user.verification_file_path) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const filePath = user.verification_file_path;
    const originalName = user.verification_file_original_name;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for inline viewing
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      res.setHeader('Content-Type', `image/${ext.substring(1)}`);
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    }
    
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve file'
    });
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  serveVerificationFile
};