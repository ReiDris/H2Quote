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

// Get all users (Admin only)
router.get('/', requireAdmin, userController.getAllUsers);

// Update user (Admin only)
router.put('/:userId', requireAdmin, userController.updateUser);

module.exports = router;