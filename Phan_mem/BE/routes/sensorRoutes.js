const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/', sensorController.getAll);
router.get('/:id', sensorController.getById);

module.exports = router;
