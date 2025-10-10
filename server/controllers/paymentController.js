const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for payment proof uploads
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payment_proofs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `payment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const paymentUpload = multer({
  storage: paymentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  }
}).single('paymentProof');

// Upload payment proof
const uploadPaymentProof = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Verify payment belongs to user's request
    const paymentCheck = await client.query(`
      SELECT p.payment_id, p.request_id, sr.requested_by_user_id
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.payment_id = $1
    `, [paymentId]);

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentCheck.rows[0];

    // Check if user owns this request
    if (payment.requested_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to upload proof for this payment'
      });
    }

    // Update payment with proof file
    const updateQuery = `
      UPDATE payments 
      SET proof_of_payment_file = $1,
          updated_at = NOW()
      WHERE payment_id = $2
      RETURNING payment_id, proof_of_payment_file
    `;

    const result = await client.query(updateQuery, [req.file.path, paymentId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        paymentId: result.rows[0].payment_id,
        fileName: path.basename(result.rows[0].proof_of_payment_file)
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload payment proof'
    });
  } finally {
    client.release();
  }
};

// View payment proof (for admin/staff)
const viewPaymentProof = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const query = `
      SELECT proof_of_payment_file 
      FROM payments 
      WHERE payment_id = $1
    `;

    const result = await pool.query(query, [paymentId]);

    if (result.rows.length === 0 || !result.rows[0].proof_of_payment_file) {
      return res.status(404).json({
        success: false,
        message: 'Payment proof not found'
      });
    }

    const filePath = result.rows[0].proof_of_payment_file;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(path.resolve(filePath));

  } catch (error) {
    console.error('View payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment proof'
    });
  }
};

// Delete payment proof
const deletePaymentProof = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const userId = req.user.id;

    // Get payment and verify ownership
    const paymentCheck = await client.query(`
      SELECT p.payment_id, p.proof_of_payment_file, sr.requested_by_user_id
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.payment_id = $1
    `, [paymentId]);

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentCheck.rows[0];

    if (payment.requested_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this payment proof'
      });
    }

    // Delete file from disk
    if (payment.proof_of_payment_file && fs.existsSync(payment.proof_of_payment_file)) {
      fs.unlinkSync(payment.proof_of_payment_file);
    }

    // Update database
    await client.query(`
      UPDATE payments 
      SET proof_of_payment_file = NULL,
          updated_at = NOW()
      WHERE payment_id = $1
    `, [paymentId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment proof deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment proof'
    });
  } finally {
    client.release();
  }
};

const { createNotification } = require('./notificationController');

// Update payment status (admin/staff only)
const updatePaymentStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { status } = req.body; // 'Paid', 'Pending', 'Overdue', 'Cancelled'

    if (!status || !['Paid', 'Pending', 'Overdue', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    // Get payment and request details
    const paymentQuery = `
      SELECT p.payment_id, p.payment_phase, p.amount, p.status as current_status,
             sr.request_id, sr.request_number, sr.requested_by_user_id,
             u.email as customer_email, u.first_name as customer_first_name
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      WHERE p.payment_id = $1
    `;
    
    const paymentResult = await client.query(paymentQuery, [paymentId]);

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentResult.rows[0];

    // Update payment status
    const updateQuery = `
      UPDATE payments 
      SET status = $1,
          paid_on = CASE WHEN $1 = 'Paid' THEN NOW() ELSE paid_on END,
          updated_at = NOW()
      WHERE payment_id = $2
      RETURNING *
    `;

    await client.query(updateQuery, [status, paymentId]);

    // Update overall service request payment status
    const requestPaymentsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_count
      FROM payments
      WHERE request_id = $1
    `;
    
    const statusResult = await client.query(requestPaymentsQuery, [payment.request_id]);
    const { total_payments, paid_count } = statusResult.rows[0];

    let overallStatus = 'Pending';
    if (paid_count === parseInt(total_payments)) {
      overallStatus = 'Paid';
    } else if (paid_count > 0) {
      overallStatus = 'Partial';
    }

    await client.query(`
      UPDATE service_requests 
      SET payment_status = $1
      WHERE request_id = $2
    `, [overallStatus, payment.request_id]);

    await client.query('COMMIT');

    // ✅ SEND NOTIFICATIONS
    try {
      // Notify customer about payment status change
      if (status !== payment.current_status) {
        await createNotification(
          payment.requested_by_user_id,
          'Payment',
          `Payment ${status}`,
          `Your ${payment.payment_phase} payment for service request #${payment.request_number} has been marked as ${status}.`,
          payment.customer_email
        );
        console.log(`Payment notification sent to customer ${payment.customer_email}`);
      }

      // If payment is confirmed as Paid, notify admin
      if (status === 'Paid') {
        const adminQuery = `SELECT user_id, email FROM users WHERE user_type = 'admin' AND status = 'Active'`;
        const admins = await client.query(adminQuery);
        
        for (const admin of admins.rows) {
          await createNotification(
            admin.user_id,
            'Payment',
            'Payment Received',
            `${payment.payment_phase} payment received for service request #${payment.request_number}. Amount: ₱${parseFloat(payment.amount).toLocaleString()}`,
            admin.email
          );
        }
        console.log('Payment notifications sent to admins');
      }
    } catch (notifError) {
      console.error('Failed to create payment notifications:', notifError);
      // Don't fail the update if notifications fail
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        paymentId: paymentId,
        status: status,
        overallPaymentStatus: overallStatus
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  } finally {
    client.release();
  }
};


module.exports = {
  paymentUpload,
  uploadPaymentProof,
  viewPaymentProof,
  deletePaymentProof,
  updatePaymentStatus
};