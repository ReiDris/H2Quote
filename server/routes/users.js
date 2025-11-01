const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Apply authentication to all routes
router.use(authenticateToken);

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE parameterized routes!
// Otherwise /users/archived will match /users/:userId with userId="archived"

// Get all active users (Admin only)
router.get('/', requireAdmin, userController.getAllUsers);

// Get all archived users (Admin only) - MUST be before /:userId routes
router.get('/archived', requireAdmin, userController.getArchivedUsers);

// Update user (Admin only)
router.put('/:userId', requireAdmin, userController.updateUser);

// Archive user (Admin only)
router.put('/:userId/archive', requireAdmin, userController.archiveUser);

// Restore user (Admin only)
router.put('/:userId/restore', requireAdmin, userController.restoreUser);

module.exports = router;