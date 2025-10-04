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

router.use(authenticateToken);

// Customer routes
router.post('/:paymentId/upload-proof', paymentController.paymentUpload, paymentController.uploadPaymentProof);
router.delete('/:paymentId/proof', paymentController.deletePaymentProof);

// Admin/Staff routes
router.get('/:paymentId/proof', requireAdminOrStaff, paymentController.viewPaymentProof);
router.put('/:paymentId/status', requireAdminOrStaff, paymentController.updatePaymentStatus);  // ✅ New route

module.exports = router;