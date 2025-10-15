const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const requireAdminOrStaff = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or staff access required'
    });
  }
  next();
};

// All routes require authentication
router.use(authenticateToken);

// Upload payment proof (customer)
router.post('/:paymentId/upload-proof', 
  paymentController.paymentUpload, 
  paymentController.uploadPaymentProof
);

// View payment proof (customer/admin/staff)
router.get('/:paymentId/proof', paymentController.viewPaymentProof);

// Delete payment proof (customer)
router.delete('/:paymentId/proof', paymentController.deletePaymentProof);

// Update payment status (admin/staff only)
router.put('/:paymentId/status', requireAdminOrStaff, paymentController.updatePaymentStatus);

module.exports = router;