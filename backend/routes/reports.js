const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET all Reports data
router.get('/', reportController.getReports);

module.exports = router;
