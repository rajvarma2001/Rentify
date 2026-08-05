const express = require('express');
const router = express.Router();

// Sub-routers
const statsRoutes = require('./stats');
const propertyRoutes = require('./properties');
const tenantRoutes = require('./tenants');
const leaseRoutes = require('./leases');
const paymentRoutes = require('./payments');
const expenseRoutes = require('./expenses');
const maintenanceRoutes = require('./maintenance');
const reportRoutes = require('./reports');
const notificationRoutes = require('./notifications');

// Delegate sub-routes
router.use('/', statsRoutes); // matches /stats
router.use('/properties', propertyRoutes);
router.use('/tenants', tenantRoutes);
router.use('/leases', leaseRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
