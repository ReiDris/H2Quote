const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.use(authenticateToken);
router.use(requireAdmin);

const getPendingUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone,
             u.verification_file_original_name, u.created_at,
             c.company_name, c.phone as company_phone, c.email as company_email
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.company_id
      WHERE u.status = 'Inactive' AND u.user_type = 'client'
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { userId } = req.params;

    await client.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE user_id = $2',
      ['Active', userId]
    );

    const userResult = await client.query(
      'SELECT company_id, is_primary_contact FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].is_primary_contact) {
      await client.query(
        'UPDATE companies SET status = $1, updated_at = NOW() WHERE company_id = $2',
        ['Active', userResult.rows[0].company_id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User approved successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  } finally {
    client.release();
  }
};

// Reject a user
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await pool.query(
      'UPDATE users SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE user_id = $3',
      ['Rejected', reason || 'No reason provided', userId]
    );

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

    const query = 'SELECT verification_file_path, verification_file_original_name FROM users WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0 || !result.rows[0].verification_file_path) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const filePath = result.rows[0].verification_file_path;
    const originalName = result.rows[0].verification_file_original_name;

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

router.get('/pending-users', getPendingUsers);
router.post('/approve-user/:userId', approveUser);
router.post('/reject-user/:userId', rejectUser);
router.get('/verification-file/:userId', serveVerificationFile);

module.exports = router;