// routes/messages.js - Simplified messaging routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const messagingController = require('../controllers/simplifiedMessagingController');

// Apply authentication to all routes
router.use(authenticateToken);

// Message routes that match your frontend structure
router.get('/inbox', messagingController.getInboxMessages);          
router.get('/sent', messagingController.getSentMessages);            
router.get('/unread-count', messagingController.getUnreadCount);     

// Individual message operations
router.get('/:messageId', messagingController.getMessageDetails);    
router.post('/', messagingController.sendMessage);                   
router.post('/:messageId/reply', messagingController.replyToMessage); 

// Bulk operations
router.put('/mark-read', messagingController.markAsRead);            
router.delete('/', messagingController.deleteMessages);             

// Utility routes
router.get('/users/messageable', messagingController.getMessageableUsers); 

module.exports = router;