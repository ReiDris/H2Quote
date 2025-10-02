const express = require('express');
const router = express.Router();
const { getUserAccount, updateUserAccount, changePassword } = require('../controllers/accountSettingsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getUserAccount);

router.put('/', updateUserAccount);

router.put('/password', changePassword);

module.exports = router;