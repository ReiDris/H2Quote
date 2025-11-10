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

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/pending-users', adminController.getPendingUsers);
router.post('/approve-user/:userId', adminController.approveUser);
router.post('/reject-user/:userId', adminController.rejectUser);
router.get('/verification-file/:userId', adminController.serveVerificationFile);

module.exports = router;