// routes/accountSettingsRoutes.js
const express = require('express');
const router = express.Router();
const { getUserAccount, updateUserAccount, changePassword } = require('../controllers/accountSettingsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/account - Get current user's account details
router.get('/', getUserAccount);

// PUT /api/account - Update user account details
router.put('/', updateUserAccount);

// PUT /api/account/password - Change password (separate endpoint for security)
router.put('/password', changePassword);

module.exports = router;