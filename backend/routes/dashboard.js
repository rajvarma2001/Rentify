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

module.exports = router;
