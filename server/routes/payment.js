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

// ✅ CORRECTED: Use the exported middleware from controller
router.post('/:paymentId/upload-proof', 
  paymentController.paymentUpload,       // ✅ This is now exported
  paymentController.uploadPaymentProof
);

router.get('/:paymentId/proof', paymentController.viewPaymentProof);
router.delete('/:paymentId/proof', paymentController.deletePaymentProof);
router.put('/:paymentId/status', requireAdminOrStaff, paymentController.updatePaymentStatus);

module.exports = router;