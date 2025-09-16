const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const { sendAccountApprovalEmail } = require('../services/emailService');

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
        verification_file_original_name, created_at,
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

    // First get user details before updating
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

    // Update user status to Active
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        status: 'Active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (userError) {
      throw userError;
    }

    // Update company status if user is primary contact
    if (userData.is_primary_contact) {
      await supabase
        .from('companies')
        .update({ 
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('company_id', userData.company_id);
    }

    // Add audit log
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        new_values: { status: 'Active' },
        changed_by: req.user.email,
        change_reason: 'User approved by admin',
        ip_address: req.ip || req.connection.remoteAddress
      });

    // Send approval email
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
      // Don't fail the approval if email fails
    }

    res.json({
      success: true,
      message: 'User approved successfully and notification email sent'
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

    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
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