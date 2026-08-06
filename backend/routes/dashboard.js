const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Apply auth middleware to protect all sub-routes
router.use(auth);

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
const profileRoutes = require('./profile');

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
router.use('/profile', profileRoutes);

module.exports = router;
