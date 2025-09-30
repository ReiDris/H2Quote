const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Apply authentication to most routes (but not all)
router.get('/pending-users', authenticateToken, requireAdmin, adminController.getPendingUsers);
router.post('/approve-user/:userId', authenticateToken, requireAdmin, adminController.approveUser);
router.post('/reject-user/:userId', authenticateToken, requireAdmin, adminController.rejectUser);

// This route handles its own authentication internally (via query parameter token)
router.get('/verification-file/:userId', adminController.serveVerificationFile);

module.exports = router;