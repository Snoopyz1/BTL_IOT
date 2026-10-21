const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authRequired } = require('../middleware/auth');

router.get('/', authRequired, profileController.getProfile);
router.put('/', authRequired, profileController.updateProfile);

module.exports = router;
