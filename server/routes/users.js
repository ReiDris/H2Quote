const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authenticateToken);

const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.get('/', requireAdmin, userController.getAllUsers);

router.get('/archived', requireAdmin, userController.getArchivedUsers);

router.put('/:userId', requireAdmin, userController.updateUser);

router.put('/:userId/archive', requireAdmin, userController.archiveUser);

router.put('/:userId/restore', requireAdmin, userController.restoreUser);

module.exports = router;