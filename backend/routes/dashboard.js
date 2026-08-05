const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Helper to get stats for Landlords and Tenants
router.get('/stats', dashboardController.getStats);

// Create property (Landlord only)
router.post('/properties', dashboardController.createProperty);

// Create Maintenance Request (Tenant only)
router.post('/maintenance', dashboardController.createMaintenanceRequest);

// GET single Payment Invoice Details
router.get('/payments/:id', dashboardController.getPaymentById);

// Pay Rent (mark status as paid)
router.post('/payments/:id/pay', dashboardController.payRent);

// CREATE Rent Invoice (Landlord Action)
router.post('/payments', dashboardController.createInvoice);

// GET Single Property Details
router.get('/properties/:id', dashboardController.getPropertyById);

// EDIT Property Details (PUT)
router.put('/properties/:id', dashboardController.updateProperty);

// DELETE Property
router.delete('/properties/:id', dashboardController.deleteProperty);

// GET all Tenants (role: tenant)
router.get('/tenants', dashboardController.getTenants);

// CREATE Tenant (registers new User)
router.post('/tenants', dashboardController.createTenant);

// GET Tenant details by ID (including payments, maintenance and assigned property)
router.get('/tenants/:id', dashboardController.getTenantById);

// EDIT Tenant details (PUT)
router.put('/tenants/:id', dashboardController.updateTenant);

// DELETE Tenant (removes account and unassigns from properties)
router.delete('/tenants/:id', dashboardController.deleteTenant);

// GET all Leases
router.get('/leases', dashboardController.getLeases);

// CREATE Lease (sets occupancy in property as well)
router.post('/leases', dashboardController.createLease);

// GET Single Lease Details
router.get('/leases/:id', dashboardController.getLeaseById);

// EDIT Lease (PUT)
router.put('/leases/:id', dashboardController.updateLease);

// RENEW Lease (POST)
router.post('/leases/:id/renew', dashboardController.renewLease);

// TERMINATE Lease (POST)
router.post('/leases/:id/terminate', dashboardController.terminateLease);

// GET all Expenses (Landlord only)
router.get('/expenses', dashboardController.getExpenses);

// CREATE Expense (Landlord only)
router.post('/expenses', dashboardController.createExpense);

// GET Single Expense Details
router.get('/expenses/:id', dashboardController.getExpenseById);

// EDIT Expense Details (PUT)
router.put('/expenses/:id', dashboardController.updateExpense);

// DELETE Expense
router.delete('/expenses/:id', dashboardController.deleteExpense);

// GET all Maintenance Requests
router.get('/maintenance', dashboardController.getMaintenanceRequests);

// GET Single Maintenance Request details
router.get('/maintenance/:id', dashboardController.getMaintenanceById);

// UPDATE Maintenance Request details (PUT)
router.put('/maintenance/:id', dashboardController.updateMaintenanceRequest);

module.exports = router;
