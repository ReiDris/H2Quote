const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(authenticateToken);

router.get('/', notificationController.getUserNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.delete('/clear-read', notificationController.clearReadNotifications); 

module.exports = router;