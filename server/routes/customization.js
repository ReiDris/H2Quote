const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const customizationController = require('../controllers/customizationController');

// All routes require admin access
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// ============================================
// SERVICES ROUTES
// ============================================
router.get('/services', customizationController.getAllServices);
router.get('/services/categories', customizationController.getServiceCategories);
router.post('/services', customizationController.createService);
router.put('/services/:serviceId', customizationController.updateService);
router.delete('/services/:serviceId', customizationController.deleteService);

// ============================================
// CHEMICALS ROUTES
// ============================================
router.get('/chemicals', customizationController.getAllChemicals);
router.post('/chemicals', customizationController.createChemical);
router.put('/chemicals/:chemicalId', customizationController.updateChemical);
router.delete('/chemicals/:chemicalId', customizationController.deleteChemical);


// ============================================
// REFRIGERANTS ROUTES
// ============================================
router.get('/refrigerants', customizationController.getAllRefrigerants);
router.post('/refrigerants', customizationController.createRefrigerant);
router.put('/refrigerants/:refrigerantId', customizationController.updateRefrigerant);
router.delete('/refrigerants/:refrigerantId', customizationController.deleteRefrigerant);

// ============================================
// CHATBOT ROUTES
// ============================================
router.get('/chatbot/intents', customizationController.getChatIntents);
router.post('/chatbot/intents', customizationController.createChatIntent);
router.put('/chatbot/intents/:intentId', customizationController.updateChatIntent);
router.delete('/chatbot/intents/:intentId', customizationController.deleteChatIntent);

router.get('/chatbot/quick-actions', customizationController.getQuickActions);
router.post('/chatbot/quick-actions', customizationController.createQuickAction);
router.put('/chatbot/quick-actions/:actionId', customizationController.updateQuickAction);
router.delete('/chatbot/quick-actions/:actionId', customizationController.deleteQuickAction);

module.exports = router;

