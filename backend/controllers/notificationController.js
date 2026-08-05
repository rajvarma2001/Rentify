const mongoose = require('mongoose');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const Lease = require('../models/Lease');

exports.getNotifications = async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId || !role) {
      return res.status(400).json({ status: 'error', message: 'User ID and Role are required' });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const notifications = [];

    // Date calculations for lease expiration
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();

    if (role === 'landlord') {
      // 1. Fetch landlord properties
      const properties = await Property.find({ landlord: userObjId });
      const propertyIds = properties.map(p => p._id);

      // 2. RENT DUE
      const duePayments = await Payment.find({
        property: { $in: propertyIds },
        status: { $in: ['due', 'overdue'] }
      }).populate('tenant', 'name').populate('property', 'name');

      duePayments.forEach(p => {
        const isOverdue = new Date(p.dueDate) < today;
        notifications.push({
          id: `rent-due-${p._id}`,
          category: 'rent-due',
          type: isOverdue ? 'error' : 'warning',
          text: `Outstanding invoice: $${p.amount} due from tenant ${p.tenant?.name || 'N/A'} for ${p.property?.name || 'Property'} on ${new Date(p.dueDate).toLocaleDateString()}.`,
          time: isOverdue ? 'Overdue' : 'Due Soon'
        });
      });

      // 3. PAYMENT RECEIVED
      const receivedPayments = await Payment.find({
        property: { $in: propertyIds },
        status: 'paid'
      }).populate('tenant', 'name').populate('property', 'name').sort({ paidAt: -1 }).limit(10);

      receivedPayments.forEach(p => {
        notifications.push({
          id: `payment-rcvd-${p._id}`,
          category: 'payment-received',
          type: 'success',
          text: `Collected rent payment of $${p.amount} from ${p.tenant?.name || 'Tenant'} for ${p.property?.name || 'Property'}.`,
          time: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Settled'
        });
      });

      // 4. LEASE EXPIRY
      const activeLeases = await Lease.find({
        property: { $in: propertyIds },
        status: { $nin: ['Terminated'] }
      }).populate('tenant', 'name').populate('property', 'name');

      activeLeases.forEach(l => {
        const end = new Date(l.endDate);
        if (end <= thirtyDaysFromNow) {
          const isExpired = end < today;
          notifications.push({
            id: `lease-exp-${l._id}`,
            category: 'lease-expiry',
            type: isExpired ? 'error' : 'warning',
            text: `Lease contract for ${l.property?.name || 'Property'} (Tenant: ${l.tenant?.name || 'N/A'}) ${isExpired ? 'expired on' : 'expires on'} ${end.toLocaleDateString()}.`,
            time: isExpired ? 'Expired' : 'Expiring'
          });
        }
      });

      // 5. MAINTENANCE UPDATE
      const maintenanceTickets = await Maintenance.find({
        property: { $in: propertyIds }
      }).populate('tenant', 'name').populate('property', 'name').sort({ createdAt: -1 });

      maintenanceTickets.forEach(m => {
        if (m.status === 'pending') {
          notifications.push({
            id: `maint-upd-${m._id}`,
            category: 'maintenance-update',
            type: 'warning',
            text: `New maintenance request ticket "${m.title}" filed by tenant ${m.tenant?.name || 'N/A'} for ${m.property?.name || 'Property'}.`,
            time: 'Action Required'
          });
        } else {
          notifications.push({
            id: `maint-upd-${m._id}`,
            category: 'maintenance-update',
            type: 'info',
            text: `Maintenance ticket "${m.title}" status is currently: ${m.status.toUpperCase()} (Worker: ${m.assignedWorker || 'Unassigned'}).`,
            time: 'Update'
          });
        }
      });

      // 6. SYSTEM NOTIFICATIONS
      notifications.push({
        id: 'sys-welcome',
        category: 'system-notifications',
        type: 'info',
        text: `Welcome to Rentify Dashboard! You have ${properties.length} active registered properties under management.`,
        time: 'System'
      });

    } else {
      // TENANT NOTIFICATIONS
      // Find tenant payments
      const tenantPayments = await Payment.find({ tenant: userObjId })
        .populate('property', 'name');

      // 2. RENT DUE (Tenant perspective)
      const duePayments = tenantPayments.filter(p => p.status === 'due' || p.status === 'overdue');
      duePayments.forEach(p => {
        const isOverdue = new Date(p.dueDate) < today;
        notifications.push({
          id: `rent-due-${p._id}`,
          category: 'rent-due',
          type: isOverdue ? 'error' : 'warning',
          text: `Your rent payment of $${p.amount} for ${p.property?.name || 'Property'} is ${isOverdue ? 'OVERDUE' : 'due'} on ${new Date(p.dueDate).toLocaleDateString()}.`,
          time: isOverdue ? 'Overdue' : 'Due'
        });
      });

      // 3. PAYMENT RECEIVED (Tenant perspective)
      const paidPayments = tenantPayments.filter(p => p.status === 'paid').sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
      paidPayments.forEach(p => {
        notifications.push({
          id: `payment-rcvd-${p._id}`,
          category: 'payment-received',
          type: 'success',
          text: `Your rent payment of $${p.amount} for ${p.property?.name || 'Property'} was successfully settled on ${new Date(p.paidAt).toLocaleDateString()}.`,
          time: 'Settled'
        });
      });

      // 4. LEASE EXPIRY (Tenant perspective)
      const tenantLeases = await Lease.find({ tenant: userObjId, status: { $nin: ['Terminated'] } }).populate('property', 'name');
      tenantLeases.forEach(l => {
        const end = new Date(l.endDate);
        if (end <= thirtyDaysFromNow) {
          const isExpired = end < today;
          notifications.push({
            id: `lease-exp-${l._id}`,
            category: 'lease-expiry',
            type: isExpired ? 'error' : 'warning',
            text: `Your lease agreement for ${l.property?.name || 'Property'} ${isExpired ? 'expired on' : 'expires on'} ${end.toLocaleDateString()}. Please review options.`,
            time: isExpired ? 'Expired' : 'Expires'
          });
        }
      });

      // 5. MAINTENANCE UPDATE (Tenant perspective)
      const tenantMaint = await Maintenance.find({ tenant: userObjId }).populate('property', 'name').sort({ createdAt: -1 });
      tenantMaint.forEach(m => {
        notifications.push({
          id: `maint-upd-${m._id}`,
          category: 'maintenance-update',
          type: m.status === 'resolved' ? 'success' : 'info',
          text: `Your maintenance ticket "${m.title}" status is updated to: ${m.status.toUpperCase()} (Worker: ${m.assignedWorker || 'Awaiting Scheduling'}).`,
          time: 'Ticket Update'
        });
      });

      // 6. SYSTEM NOTIFICATIONS (Tenant perspective)
      notifications.push({
        id: 'sys-welcome',
        category: 'system-notifications',
        type: 'info',
        text: 'Welcome to your Rentify Tenant Portal! Review payments and log maintenance tickets directly.',
        time: 'System'
      });
    }

    res.json({ status: 'success', notifications });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ status: 'error', message: 'Error compiling notifications ledger' });
  }
};
