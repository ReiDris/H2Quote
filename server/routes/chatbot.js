const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const chatbotController = require('../controllers/chatbotController');

router.post('/start-session', chatbotController.startChatSession);
router.post('/send-message', chatbotController.sendMessage);
router.get('/quick-actions', chatbotController.getQuickActions);
router.get('/chat-history/:sessionId', chatbotController.getChatHistory);
router.post('/end-session/:sessionId', chatbotController.endChatSession);

const requireAdmin = (req, res, next) => {
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.get('/analytics', authenticateToken, requireAdmin, chatbotController.getChatAnalytics);
router.put('/intents/:intentId', authenticateToken, requireAdmin, chatbotController.updateChatIntent);

module.exports = router;