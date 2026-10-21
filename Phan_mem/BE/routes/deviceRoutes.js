const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authOptional } = require('../middleware/auth');

router.get('/', deviceController.getAll);
router.get('/:id', deviceController.getById);
router.post('/:id/command', authOptional, deviceController.sendCommand);

module.exports = router;
