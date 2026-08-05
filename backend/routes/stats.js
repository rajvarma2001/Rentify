const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Helper to get stats for Landlords and Tenants
router.get('/stats', dashboardController.getStats);

module.exports = router;
