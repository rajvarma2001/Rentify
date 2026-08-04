const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');

// Helper to get stats for Landlords and Tenants
router.get('/stats', async (req, res) => {
  try {
    const { userId, role } = req.query;

    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid User ID format' });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    if (role === 'landlord') {
      // 1. Properties Overview
      const properties = await Property.find({ landlord: userObjId });
      const propertyIds = properties.map(p => p._id);

      // 2. Rent Due Summary (due and overdue payments for landlord's properties)
      const duePayments = await Payment.find({
        property: { $in: propertyIds },
        status: { $in: ['due', 'overdue'] }
      }).populate('tenant', 'name email');

      const totalDuesAmount = duePayments.reduce((acc, curr) => acc + curr.amount, 0);

      // 3. Recent Payments (paid logs)
      const recentPayments = await Payment.find({
        property: { $in: propertyIds },
        status: 'paid'
      })
      .populate('tenant', 'name email')
      .populate('property', 'name address')
      .sort({ paidAt: -1 })
      .limit(5);

      // 4. Maintenance Requests
      const maintenanceRequests = await Maintenance.find({
        property: { $in: propertyIds }
      })
      .populate('tenant', 'name')
      .populate('property', 'name')
      .sort({ createdAt: -1 });

      // 5. Notifications List
      const notifications = [];
      
      // Add alerts based on recent activities
      if (maintenanceRequests.some(r => r.status === 'pending')) {
        const pendingCount = maintenanceRequests.filter(r => r.status === 'pending').length;
        notifications.push({
          id: 'notif-1',
          type: 'warning',
          text: `You have ${pendingCount} unresolved maintenance request(s).`,
          time: 'Just now'
        });
      }
      
      recentPayments.slice(0, 2).forEach((p, idx) => {
        notifications.push({
          id: `notif-p-${idx}`,
          type: 'success',
          text: `Received payment of $${p.amount} from ${p.tenant?.name || 'Tenant'}.`,
          time: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Recently'
        });
      });

      if (notifications.length === 0) {
        notifications.push({
          id: 'notif-empty',
          type: 'info',
          text: 'No new activity reports.',
          time: 'Today'
        });
      }

      return res.json({
        status: 'success',
        properties,
        dueSummary: {
          count: duePayments.length,
          totalAmount: totalDuesAmount,
          items: duePayments
        },
        recentPayments,
        maintenanceRequests,
        notifications
      });

    } else {
      // Tenant view stats
      // Find the lease of this tenant (linked via payments)
      const tenantPayments = await Payment.find({ tenant: userObjId })
        .populate('property');
      
      const properties = tenantPayments.map(p => p.property).filter((p, index, self) =>
        p && self.findIndex(t => t._id.toString() === p._id.toString()) === index
      );

      // 2. Rent Due Summary for this tenant
      const duePayments = tenantPayments.filter(p => p.status === 'due' || p.status === 'overdue');
      const totalDuesAmount = duePayments.reduce((acc, curr) => acc + curr.amount, 0);

      // 3. Recent Payments
      const recentPayments = tenantPayments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
        .slice(0, 5);

      // 4. Maintenance Requests created by tenant
      const maintenanceRequests = await Maintenance.find({ tenant: userObjId })
        .populate('property', 'name')
        .sort({ createdAt: -1 });

      // 5. Notifications
      const notifications = [];
      if (duePayments.length > 0) {
        notifications.push({
          id: 'notif-t-1',
          type: 'warning',
          text: `You have ${duePayments.length} outstanding rent invoice(s). Total: $${totalDuesAmount}.`,
          time: 'Due soon'
        });
      }

      maintenanceRequests.slice(0, 2).forEach((r, idx) => {
        if (r.status !== 'pending') {
          notifications.push({
            id: `notif-mr-${idx}`,
            type: 'info',
            text: `Maintenance request "${r.title}" status updated to: ${r.status}.`,
            time: 'Recently'
          });
        }
      });

      if (notifications.length === 0) {
        notifications.push({
          id: 'notif-empty',
          type: 'info',
          text: 'All rent payments are current. No pending notifications.',
          time: 'Today'
        });
      }

      return res.json({
        status: 'success',
        properties,
        dueSummary: {
          count: duePayments.length,
          totalAmount: totalDuesAmount,
          items: duePayments
        },
        recentPayments,
        maintenanceRequests,
        notifications
      });
    }

  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error fetching stats' });
  }
});

// Create property (Landlord only)
router.post('/properties', async (req, res) => {
  try {
    const { name, address, rentAmount, type, landlordId } = req.body;

    if (!name || !address || !rentAmount || !landlordId) {
      return res.status(400).json({ status: 'error', message: 'Missing required property details' });
    }

    const newProperty = new Property({
      name,
      address,
      rentAmount,
      type: type || 'Apartment',
      landlord: landlordId
    });

    const saved = await newProperty.save();
    res.status(201).json({ status: 'success', property: saved });
  } catch (err) {
    console.error('Create property error:', err);
    res.status(500).json({ status: 'error', message: 'Error adding property' });
  }
});

// Create Maintenance Request (Tenant only)
router.post('/maintenance', async (req, res) => {
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
});

// Pay Rent (mark status as paid)
router.post('/payments/:id/pay', async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment invoice not found' });
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    res.json({ status: 'success', message: 'Payment successfully processed', payment });
  } catch (err) {
    console.error('Process payment error:', err);
    res.status(500).json({ status: 'error', message: 'Error processing rent payment' });
  }
});

// CREATE Rent Invoice (Landlord Action)
router.post('/payments', async (req, res) => {
  try {
    const { tenantId, propertyId, amount, dueDate } = req.body;

    if (!tenantId || !propertyId || !amount || !dueDate) {
      return res.status(400).json({ status: 'error', message: 'Missing required billing details' });
    }

    const newPayment = new Payment({
      tenant: tenantId,
      property: propertyId,
      amount,
      dueDate,
      status: 'due'
    });

    const saved = await newPayment.save();
    res.status(201).json({ status: 'success', payment: saved });
  } catch (err) {
    console.error('Create payment invoice error:', err);
    res.status(500).json({ status: 'error', message: 'Error issuing rent invoice' });
  }
});

router.get('/properties/:id', async (req, res) => {
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
});

// EDIT Property Details (PUT)
router.put('/properties/:id', async (req, res) => {
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
});

// DELETE Property
router.delete('/properties/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Property ID format' });
    }

    const deleted = await Property.findByIdAndDelete(propertyId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Property not found' });
    }

    // Optional: Delete related payments and maintenance logs
    await Payment.deleteMany({ property: propertyId });
    await Maintenance.deleteMany({ property: propertyId });

    res.json({ status: 'success', message: 'Property and its associated logs successfully deleted' });
  } catch (err) {
    console.error('Delete property error:', err);
    res.status(500).json({ status: 'error', message: 'Error deleting property' });
  }
});

// GET all Tenants (role: tenant)
router.get('/tenants', async (req, res) => {
  try {
    const User = require('../models/User');
    const tenants = await User.find({ role: 'tenant' }).sort({ createdAt: -1 });
    res.json({ status: 'success', tenants });
  } catch (err) {
    console.error('Fetch tenants error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving tenants' });
  }
});

// CREATE Tenant (registers new User)
router.post('/tenants', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
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
});

// GET Tenant details by ID (including payments, maintenance and assigned property)
router.get('/tenants/:id', async (req, res) => {
  try {
    const User = require('../models/User');
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
});

// EDIT Tenant details (PUT)
router.put('/tenants/:id', async (req, res) => {
  try {
    const User = require('../models/User');
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
});

// DELETE Tenant (removes account and unassigns from properties)
router.delete('/tenants/:id', async (req, res) => {
  try {
    const User = require('../models/User');
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
});

module.exports = router;
