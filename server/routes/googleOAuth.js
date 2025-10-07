console.log('🔥 Loading googleOAuth routes file');
const express = require('express');
const router = express.Router();
const { uploadVerificationFile, handleUploadError } = require('../middleware/supabaseFileUpload');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const { validateSignup } = require('../middleware/validation');

router.post('/signup',
  uploadVerificationFile,      
  handleUploadError,        
  validateSignup,             
  authController.signup       
);

router.post('/login', authController.login);
router.post('/google-auth', googleAuthController.googleAuth); 
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/validate-reset-token', authController.validateResetToken);

console.log('📋 Routes in this router:');
router.stack.forEach((r) => {
  if (r.route) {
    console.log(`  ${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});


console.log('✅ googleOAuth routes loaded successfully');

module.exports = router;