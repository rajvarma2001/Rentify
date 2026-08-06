const mongoose = require('mongoose');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const Lease = require('../models/Lease');

// Create property (Landlord only)
exports.createProperty = async (req, res) => {
  try {
    const { name, address, rentAmount, type, description, rooms, landlordId } = req.body;

    if (!name || !address || !rentAmount || !landlordId) {
      return res.status(400).json({ status: 'error', message: 'Missing required property details' });
    }

    const newProperty = new Property({
      name,
      address,
      rentAmount,
      type: type || 'Apartment',
      description: description || '',
      rooms: rooms || [],
      landlord: landlordId
    });

    const saved = await newProperty.save();
    res.status(201).json({ status: 'success', property: saved });
  } catch (err) {
    console.error('Create property error:', err);
    res.status(500).json({ status: 'error', message: 'Error adding property' });
  }
};

// GET Single Property Details
exports.getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Property ID format' });
    }

    const property = await Property.findById(propertyId)
      .populate('assignedTenant', 'name email');

    if (!property) {
      return res.status(404).json({ status: 'error', message: 'Property not found' });
    }

    // Fetch payments associated with this property
    const payments = await Payment.find({ property: propertyId })
      .populate('tenant', 'name email')
      .sort({ dueDate: -1 });

    // Fetch maintenance logs associated with this property
    const maintenance = await Maintenance.find({ property: propertyId })
      .populate('tenant', 'name')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      property,
      payments,
      maintenance
    });
  } catch (err) {
    console.error('Fetch property details error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving property details' });
  }
};

// EDIT Property Details (PUT)
exports.updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { name, address, rentAmount, type, description, rooms, assignedTenant, leaseStart, leaseEnd, documents } = req.body;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Property ID format' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ status: 'error', message: 'Property not found' });
    }

    // Update fields
    if (name) property.name = name;
    if (address) property.address = address;
    if (rentAmount !== undefined) property.rentAmount = rentAmount;
    if (type) property.type = type;
    if (description !== undefined) property.description = description;
    if (rooms) property.rooms = rooms;
    
    // Assign tenant and dates
    if (assignedTenant !== undefined) {
      property.assignedTenant = assignedTenant === '' ? null : assignedTenant;
    }
    if (leaseStart !== undefined) property.leaseStart = leaseStart === '' ? null : leaseStart;
    if (leaseEnd !== undefined) property.leaseEnd = leaseEnd === '' ? null : leaseEnd;
    if (documents) property.documents = documents;

    const saved = await property.save();
    res.json({ status: 'success', property: saved });
  } catch (err) {
    console.error('Edit property error:', err);
    res.status(500).json({ status: 'error', message: 'Error updating property details' });
  }
};

// DELETE Property
exports.deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Property ID format' });
    }

    const deleted = await Property.findByIdAndDelete(propertyId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Property not found' });
    }

    // Delete related payments, maintenance logs, and leases
    await Payment.deleteMany({ property: propertyId });
    await Maintenance.deleteMany({ property: propertyId });
    await Lease.deleteMany({ property: propertyId });

    res.json({ status: 'success', message: 'Property and its associated logs successfully deleted' });
  } catch (err) {
    console.error('Delete property error:', err);
    res.status(500).json({ status: 'error', message: 'Error deleting property' });
  }
};
