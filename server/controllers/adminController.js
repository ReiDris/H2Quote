const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get all pending users for admin approval
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

// Approve a user
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

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

    // Also activate the company if this is the primary contact
    const { data: user } = await supabase
      .from('users')
      .select('company_id, is_primary_contact')
      .eq('user_id', userId)
      .single();

    if (user && user.is_primary_contact) {
      await supabase
        .from('companies')
        .update({ 
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('company_id', user.company_id);
    }

    // Log audit entry
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

    res.json({
      success: true,
      message: 'User approved successfully'
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  }
};

// Reject a user
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Update user status to Rejected
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

    // Log audit entry
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

// Serve verification files
const serveVerificationFile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get file path from database
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
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Set proper headers
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