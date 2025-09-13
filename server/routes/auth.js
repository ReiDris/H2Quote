// routes/auth.js
const express = require('express');
const router = express.Router();
const { uploadVerificationFile, handleUploadError } = require('../middleware/fileUpload');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validateSignup } = require('../middleware/validation');


// Existing signup route
router.post('/signup',
  validateSignup, 
  uploadVerificationFile,
  handleUploadError,
  authController.signup
);

// New login routes
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;