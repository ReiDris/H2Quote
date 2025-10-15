const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

router.get('/', notificationController.getUserNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;