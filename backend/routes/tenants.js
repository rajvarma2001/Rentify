const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// GET all Tenants (role: tenant)
router.get('/', tenantController.getTenants);

// CREATE Tenant (registers new User)
router.post('/', tenantController.createTenant);

// GET Tenant details by ID (including payments, maintenance and assigned property)
router.get('/:id', tenantController.getTenantById);

// EDIT Tenant details (PUT)
router.put('/:id', tenantController.updateTenant);

// DELETE Tenant (removes account and unassigns from properties)
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;
