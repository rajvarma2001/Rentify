const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const bcrypt = require('bcryptjs');

// GET all Tenants (role: tenant)
exports.getTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' }).sort({ createdAt: -1 });
    res.json({ status: 'success', tenants });
  } catch (err) {
    console.error('Fetch tenants error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving tenants' });
  }
};

// CREATE Tenant (registers new User)
exports.createTenant = async (req, res) => {
  try {
    const { name, email, password, phone, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Missing name or email' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    // Default password to password123 if not provided
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const newTenant = new User({
      name,
      email,
      password: hashedPassword,
      role: 'tenant',
      phone: phone || '',
      status: status || 'Active'
    });

    const saved = await newTenant.save();
    res.status(201).json({
      status: 'success',
      tenant: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        status: saved.status,
        createdAt: saved.createdAt
      }
    });
  } catch (err) {
    console.error('Create tenant error:', err);
    res.status(500).json({ status: 'error', message: 'Error creating tenant user account' });
  }
};

// GET Tenant details by ID (including payments, maintenance and assigned property)
exports.getTenantById = async (req, res) => {
  try {
    const tenantId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Tenant ID format' });
    }

    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    // Find the property where assignedTenant = tenantId
    const property = await Property.findOne({ assignedTenant: tenantId });

    // Fetch payments associated with this tenant
    const payments = await Payment.find({ tenant: tenantId })
      .populate('property', 'name address')
      .sort({ dueDate: -1 });

    // Fetch maintenance requests raised by this tenant
    const maintenance = await Maintenance.find({ tenant: tenantId })
      .populate('property', 'name')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        status: tenant.status,
        createdAt: tenant.createdAt
      },
      property,
      payments,
      maintenance
    });
  } catch (err) {
    console.error('Fetch tenant details error:', err);
    res.status(500).json({ status: 'error', message: 'Error fetching tenant details' });
  }
};

// EDIT Tenant details (PUT)
exports.updateTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { name, email, phone, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Tenant ID format' });
    }

    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    if (name) tenant.name = name;
    if (email) tenant.email = email;
    if (phone !== undefined) tenant.phone = phone;
    if (status) tenant.status = status;

    await tenant.save();
    res.json({
      status: 'success',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        status: tenant.status
      }
    });
  } catch (err) {
    console.error('Edit tenant error:', err);
    res.status(500).json({ status: 'error', message: 'Error editing tenant account' });
  }
};

// DELETE Tenant (removes account and unassigns from properties)
exports.deleteTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Tenant ID format' });
    }

    const deleted = await User.findByIdAndDelete(tenantId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    // Reset assigned properties to null
    await Property.updateMany({ assignedTenant: tenantId }, { $set: { assignedTenant: null } });

    res.json({ status: 'success', message: 'Tenant successfully deleted' });
  } catch (err) {
    console.error('Delete tenant error:', err);
    res.status(500).json({ status: 'error', message: 'Error deleting tenant account' });
  }
};
