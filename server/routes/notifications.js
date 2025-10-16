const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// ✅ FIXED: Specific routes FIRST, parameterized routes LAST
router.get('/', notificationController.getUserNotifications);
router.put('/read-all', notificationController.markAllAsRead); 
router.put('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
