const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Apply authentication to all routes
router.use(authenticateToken);

// Customer routes - upload and delete payment proof
router.post('/:paymentId/upload-proof', 
  (req, res, next) => {
    paymentController.paymentUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  paymentController.uploadPaymentProof
);

router.delete('/:paymentId/proof', paymentController.deletePaymentProof);

// View payment proof (accessible by customer who owns it, or admin/staff)
router.get('/:paymentId/proof', paymentController.viewPaymentProof);

module.exports = router;

// Add to server.js:
// const paymentRoutes = require('./routes/payments');
// app.use('/api/payments', paymentRoutes);