const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance');
const Property = require('../models/Property');

// Create Maintenance Request (Tenant only)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const { title, description, propertyId, tenantId, priority } = req.body;

    if (!title || !description || !propertyId || !tenantId) {
      return res.status(400).json({ status: 'error', message: 'Missing required maintenance details' });
    }

    const newRequest = new Maintenance({
      title,
      description,
      property: propertyId,
      tenant: tenantId,
      priority: priority || 'medium'
    });

    const saved = await newRequest.save();
    res.status(201).json({ status: 'success', request: saved });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ status: 'error', message: 'Error submitting request' });
  }
};

// GET all Maintenance Requests
exports.getMaintenanceRequests = async (req, res) => {
  try {
    const { landlordId, tenantId } = req.query;
    let filter = {};

    if (landlordId) {
      if (!mongoose.Types.ObjectId.isValid(landlordId)) {
        return res.status(400).json({ status: 'error', message: 'Invalid landlord ID format' });
      }
      const properties = await Property.find({ landlord: new mongoose.Types.ObjectId(landlordId) });
      const propertyIds = properties.map(p => p._id);
      filter = { property: { $in: propertyIds } };
    } else if (tenantId) {
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ status: 'error', message: 'Invalid tenant ID format' });
      }
      filter = { tenant: new mongoose.Types.ObjectId(tenantId) };
    }

    const requests = await Maintenance.find(filter)
      .populate('property', 'name address')
      .populate('tenant', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', requests });
  } catch (err) {
    console.error('Fetch maintenance requests error:', err);
    res.status(500).json({ status: 'error', message: 'Error fetching maintenance list' });
  }
};

// GET Single Maintenance Request details
exports.getMaintenanceById = async (req, res) => {
  try {
    const reqId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reqId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid request ID format' });
    }
    const request = await Maintenance.findById(reqId)
      .populate('property', 'name address type')
      .populate('tenant', 'name email phone');

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Maintenance request not found' });
    }
    res.json({ status: 'success', request });
  } catch (err) {
    console.error('Fetch single maintenance error:', err);
    res.status(500).json({ status: 'error', message: 'Error fetching request details' });
  }
};

// UPDATE Maintenance Request (e.g. status, priority, assignedWorker)
exports.updateMaintenanceRequest = async (req, res) => {
  try {
    const reqId = req.params.id;
    const { status, priority, assignedWorker, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reqId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid request ID format' });
    }

    const request = await Maintenance.findById(reqId);
    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Maintenance request not found' });
    }

    if (status !== undefined) request.status = status;
    if (priority !== undefined) request.priority = priority;
    if (assignedWorker !== undefined) request.assignedWorker = assignedWorker;
    if (description !== undefined) request.description = description;

    const saved = await request.save();
    res.json({ status: 'success', request: saved });
  } catch (err) {
    console.error('Update maintenance request error:', err);
    res.status(500).json({ status: 'error', message: 'Error updating maintenance request' });
  }
};
