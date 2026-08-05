const mongoose = require('mongoose');
const Lease = require('../models/Lease');
const Property = require('../models/Property');

// GET all Leases
exports.getLeases = async (req, res) => {
  try {
    const leases = await Lease.find({})
      .populate('property', 'name address type')
      .populate('tenant', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', leases });
  } catch (err) {
    console.error('Fetch leases error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving leases' });
  }
};

// CREATE Lease (sets occupancy in property as well)
exports.createLease = async (req, res) => {
  try {
    const { propertyId, tenantId, startDate, endDate, monthlyRent, terms } = req.body;

    if (!propertyId || !tenantId || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ status: 'error', message: 'Missing lease parameters' });
    }

    // Verify property exists
    const propertyObj = await Property.findById(propertyId);
    if (!propertyObj) {
      return res.status(404).json({ status: 'error', message: 'Property not found' });
    }

    const newLease = new Lease({
      property: propertyId,
      tenant: tenantId,
      startDate,
      endDate,
      monthlyRent: Number(monthlyRent),
      terms: terms || '',
      status: 'Active'
    });

    const saved = await newLease.save();

    // Synchronize Property schema state
    propertyObj.assignedTenant = tenantId;
    propertyObj.leaseStart = startDate;
    propertyObj.leaseEnd = endDate;
    await propertyObj.save();

    res.status(201).json({ status: 'success', lease: saved });
  } catch (err) {
    console.error('Create lease error:', err);
    res.status(500).json({ status: 'error', message: 'Error creating lease' });
  }
};

// GET Single Lease Details
exports.getLeaseById = async (req, res) => {
  try {
    const leaseId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(leaseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Lease ID format' });
    }

    const lease = await Lease.findById(leaseId)
      .populate('property', 'name address type description rooms documents')
      .populate('tenant', 'name email phone status');

    if (!lease) {
      return res.status(404).json({ status: 'error', message: 'Lease not found' });
    }

    res.json({ status: 'success', lease });
  } catch (err) {
    console.error('Fetch lease details error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving lease details' });
  }
};

// EDIT Lease (PUT)
exports.updateLease = async (req, res) => {
  try {
    const leaseId = req.params.id;
    const { monthlyRent, terms, startDate, endDate, documents } = req.body;

    if (!mongoose.Types.ObjectId.isValid(leaseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Lease ID format' });
    }

    const lease = await Lease.findById(leaseId);
    if (!lease) {
      return res.status(404).json({ status: 'error', message: 'Lease not found' });
    }

    if (monthlyRent) lease.monthlyRent = Number(monthlyRent);
    if (terms !== undefined) lease.terms = terms;
    if (startDate) lease.startDate = startDate;
    if (endDate) lease.endDate = endDate;
    if (documents) lease.documents = documents;

    await lease.save();

    // Synchronize Property fields
    await Property.findByIdAndUpdate(lease.property, {
      leaseStart: lease.startDate,
      leaseEnd: lease.endDate
    });

    res.json({ status: 'success', lease });
  } catch (err) {
    console.error('Edit lease error:', err);
    res.status(500).json({ status: 'error', message: 'Error editing lease details' });
  }
};

// RENEW Lease (POST)
exports.renewLease = async (req, res) => {
  try {
    const leaseId = req.params.id;
    const { newEndDate } = req.body;

    if (!newEndDate) {
      return res.status(400).json({ status: 'error', message: 'Missing renewal end date' });
    }

    const lease = await Lease.findById(leaseId);
    if (!lease) {
      return res.status(404).json({ status: 'error', message: 'Lease not found' });
    }

    lease.endDate = newEndDate;
    lease.status = 'Renewed';
    await lease.save();

    // Synchronize Property
    await Property.findByIdAndUpdate(lease.property, {
      leaseEnd: newEndDate
    });

    res.json({ status: 'success', message: 'Lease renewed successfully', lease });
  } catch (err) {
    console.error('Renew lease error:', err);
    res.status(500).json({ status: 'error', message: 'Error renewing lease' });
  }
};

// TERMINATE Lease (POST)
exports.terminateLease = async (req, res) => {
  try {
    const leaseId = req.params.id;

    const lease = await Lease.findById(leaseId);
    if (!lease) {
      return res.status(404).json({ status: 'error', message: 'Lease not found' });
    }

    lease.status = 'Terminated';
    await lease.save();

    // Clears assignedTenant, lease dates on corresponding Property
    await Property.findByIdAndUpdate(lease.property, {
      assignedTenant: null,
      leaseStart: null,
      leaseEnd: null
    });

    res.json({ status: 'success', message: 'Lease terminated, property is now vacant', lease });
  } catch (err) {
    console.error('Terminate lease error:', err);
    res.status(500).json({ status: 'error', message: 'Error terminating lease' });
  }
};
