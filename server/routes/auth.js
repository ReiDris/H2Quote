const express = require('express');
const router = express.Router();
const { uploadVerificationFile, handleUploadError } = require('../middleware/fileUpload');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validateSignup } = require('../middleware/validation');

// FIXED: File upload middleware should come BEFORE validation
// This allows multer to parse the multipart form data first
router.post('/signup',
  uploadVerificationFile,      // Parse multipart form data first
  handleUploadError,          // Handle any upload errors
  validateSignup,             // Then validate the parsed body
  authController.signup       // Finally process the signup
);

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/validate-reset-token', authController.validateResetToken);

module.exports = router;