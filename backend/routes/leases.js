const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/leaseController');

// GET all Leases
router.get('/', leaseController.getLeases);

// CREATE Lease (sets occupancy in property as well)
router.post('/', leaseController.createLease);

// GET Single Lease Details
router.get('/:id', leaseController.getLeaseById);

// EDIT Lease (PUT)
router.put('/:id', leaseController.updateLease);

// RENEW Lease (POST)
router.post('/:id/renew', leaseController.renewLease);

// TERMINATE Lease (POST)
router.post('/:id/terminate', leaseController.terminateLease);

module.exports = router;
