const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const messagingController = require('../controllers/messagingController');

router.use(authenticateToken);

// Specific routes FIRST (before parameterized routes)
router.get('/inbox', messagingController.getInboxMessages);          
router.get('/sent', messagingController.getSentMessages);            
router.get('/unread-count', messagingController.getUnreadCount);     
router.get('/users/messageable', messagingController.getMessageableUsers);

router.post('/', messagingController.sendMessage);                   
router.put('/mark-read', messagingController.markAsRead);            
router.delete('/', messagingController.deleteMessages);             

// Parameterized routes LAST
router.get('/:messageId', messagingController.getMessageDetails);    
router.post('/:messageId/reply', messagingController.replyToMessage); 

module.exports = router;