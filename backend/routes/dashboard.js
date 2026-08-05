const express = require('express');
const router = express.Router();

// Controllers
const dashboardController = require('../controllers/dashboardController');
const propertyController = require('../controllers/propertyController');
const tenantController = require('../controllers/tenantController');
const leaseController = require('../controllers/leaseController');
const paymentController = require('../controllers/paymentController');
const expenseController = require('../controllers/expenseController');
const maintenanceController = require('../controllers/maintenanceController');

// Helper to get stats for Landlords and Tenants
router.get('/stats', dashboardController.getStats);

// Create property (Landlord only)
router.post('/properties', propertyController.createProperty);

// Create Maintenance Request (Tenant only)
router.post('/maintenance', maintenanceController.createMaintenanceRequest);

// GET single Payment Invoice Details
router.get('/payments/:id', paymentController.getPaymentById);

// Pay Rent (mark status as paid)
router.post('/payments/:id/pay', paymentController.payRent);

// CREATE Rent Invoice (Landlord Action)
router.post('/payments', paymentController.createInvoice);

// GET Single Property Details
router.get('/properties/:id', propertyController.getPropertyById);

// EDIT Property Details (PUT)
router.put('/properties/:id', propertyController.updateProperty);

// DELETE Property
router.delete('/properties/:id', propertyController.deleteProperty);

// GET all Tenants (role: tenant)
router.get('/tenants', tenantController.getTenants);

// CREATE Tenant (registers new User)
router.post('/tenants', tenantController.createTenant);

// GET Tenant details by ID (including payments, maintenance and assigned property)
router.get('/tenants/:id', tenantController.getTenantById);

// EDIT Tenant details (PUT)
router.put('/tenants/:id', tenantController.updateTenant);

// DELETE Tenant (removes account and unassigns from properties)
router.delete('/tenants/:id', tenantController.deleteTenant);

// GET all Leases
router.get('/leases', leaseController.getLeases);

// CREATE Lease (sets occupancy in property as well)
router.post('/leases', leaseController.createLease);

// GET Single Lease Details
router.get('/leases/:id', leaseController.getLeaseById);

// EDIT Lease (PUT)
router.put('/leases/:id', leaseController.updateLease);

// RENEW Lease (POST)
router.post('/leases/:id/renew', leaseController.renewLease);

// TERMINATE Lease (POST)
router.post('/leases/:id/terminate', leaseController.terminateLease);

// GET all Expenses (Landlord only)
router.get('/expenses', expenseController.getExpenses);

// CREATE Expense (Landlord only)
router.post('/expenses', expenseController.createExpense);

// GET Single Expense Details
router.get('/expenses/:id', expenseController.getExpenseById);

// EDIT Expense Details (PUT)
router.put('/expenses/:id', expenseController.updateExpense);

// DELETE Expense
router.delete('/expenses/:id', expenseController.deleteExpense);

// GET all Maintenance Requests
router.get('/maintenance', maintenanceController.getMaintenanceRequests);

// GET Single Maintenance Request details
router.get('/maintenance/:id', maintenanceController.getMaintenanceById);

// UPDATE Maintenance Request details (PUT)
router.put('/maintenance/:id', maintenanceController.updateMaintenanceRequest);

module.exports = router;
