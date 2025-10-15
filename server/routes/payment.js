const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configure multer for payment proof uploads directly in route file
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp_payments';
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  }
}).single('paymentProof');

// Route definitions - fixed parameter syntax
router.post('/:paymentId/upload-proof', 
  paymentUpload, 
  paymentController.uploadPaymentProof
);

router.get('/:paymentId/proof', paymentController.viewPaymentProof);

router.delete('/:paymentId/proof', paymentController.deletePaymentProof);

router.put('/:paymentId/status', requireAdminOrStaff, paymentController.updatePaymentStatus);

module.exports = router;