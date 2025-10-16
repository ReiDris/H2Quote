const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all clients (Admin/Staff only)
router.get('/', clientController.getAllClients);

module.exports = router;