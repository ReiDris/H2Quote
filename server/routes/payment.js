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

router.post('/:paymentId/upload-proof', 
  paymentController.paymentUpload,       
  paymentController.uploadPaymentProof
);

router.get('/:paymentId/proof', paymentController.viewPaymentProof);
router.delete('/:paymentId/proof', paymentController.deletePaymentProof);
router.put('/:paymentId/status', requireAdminOrStaff, paymentController.updatePaymentStatus);

module.exports = router;