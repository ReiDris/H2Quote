const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

router.use(authenticateToken);

router.get('/', clientController.getAllClients);

module.exports = router;