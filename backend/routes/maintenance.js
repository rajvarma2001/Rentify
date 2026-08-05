const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

// Create Maintenance Request (Tenant only)
router.post('/', maintenanceController.createMaintenanceRequest);

// GET all Maintenance Requests
router.get('/', maintenanceController.getMaintenanceRequests);

// GET Single Maintenance Request details
router.get('/:id', maintenanceController.getMaintenanceById);

// UPDATE Maintenance Request details (PUT)
router.put('/:id', maintenanceController.updateMaintenanceRequest);

module.exports = router;
