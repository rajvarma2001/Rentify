const mongoose = require('mongoose');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const Lease = require('../models/Lease');
const User = require('../models/User');
const Expense = require('../models/Expense');
const bcrypt = require('bcryptjs');

// 1. GET Helper to fetch stats for Landlords and Tenants
exports.getStats = async (req, res) => {
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
};

// 2. Create property (Landlord only)
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

// 3. Create Maintenance Request (Tenant only)
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

// 4. GET single Payment Invoice Details
exports.getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Payment ID format' });
    }

    const payment = await Payment.findById(paymentId)
      .populate('property', 'name address type description')
      .populate('tenant', 'name email phone');

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment record not found' });
    }

    res.json({ status: 'success', payment });
  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving payment details' });
  }
};

// 5. Pay Rent (mark status as paid)
exports.payRent = async (req, res) => {
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
};

// 6. CREATE Rent Invoice (Landlord Action)
exports.createInvoice = async (req, res) => {
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
};

// 7. GET Single Property Details
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

// 8. EDIT Property Details (PUT)
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

// 9. DELETE Property
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

    // Delete related payments and maintenance logs
    await Payment.deleteMany({ property: propertyId });
    await Maintenance.deleteMany({ property: propertyId });

    res.json({ status: 'success', message: 'Property and its associated logs successfully deleted' });
  } catch (err) {
    console.error('Delete property error:', err);
    res.status(500).json({ status: 'error', message: 'Error deleting property' });
  }
};

// 10. GET all Tenants (role: tenant)
exports.getTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' }).sort({ createdAt: -1 });
    res.json({ status: 'success', tenants });
  } catch (err) {
    console.error('Fetch tenants error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving tenants' });
  }
};

// 11. CREATE Tenant (registers new User)
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

// 12. GET Tenant details by ID (including payments, maintenance and assigned property)
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

// 13. EDIT Tenant details (PUT)
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

// 14. DELETE Tenant (removes account and unassigns from properties)
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

// 15. GET all Leases
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

// 16. CREATE Lease (sets occupancy in property as well)
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

// 17. GET Single Lease Details
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

// 18. EDIT Lease (PUT)
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

// 19. RENEW Lease (POST)
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

// 20. TERMINATE Lease (POST)
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

// 21. GET all Expenses (Landlord only)
exports.getExpenses = async (req, res) => {
  try {
    const { landlordId } = req.query;
    if (!landlordId) {
      return res.status(400).json({ status: 'error', message: 'Landlord ID is required' });
    }
    const expenses = await Expense.find({ landlord: landlordId })
      .populate('property', 'name address type')
      .sort({ date: -1 });
    res.json({ status: 'success', expenses });
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving expenses ledger' });
  }
};

// 22. CREATE Expense (Landlord only)
exports.createExpense = async (req, res) => {
  try {
    const { propertyId, amount, category, description, date, landlordId } = req.body;
    if (!propertyId || !amount || !category || !date || !landlordId) {
      return res.status(400).json({ status: 'error', message: 'Missing required expense details' });
    }
    const newExpense = new Expense({
      property: propertyId,
      amount: Number(amount),
      category,
      description: description || '',
      date,
      landlord: landlordId
    });
    const saved = await newExpense.save();
    res.status(201).json({ status: 'success', expense: saved });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ status: 'error', message: 'Error recording expense' });
  }
};

// 23. GET Single Expense Details
exports.getExpenseById = async (req, res) => {
  try {
    const expenseId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Expense ID format' });
    }
    const expense = await Expense.findById(expenseId)
      .populate('property', 'name address type landlord');
    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense record not found' });
    }
    res.json({ status: 'success', expense });
  } catch (err) {
    console.error('Fetch expense error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving expense details' });
  }
};

// 24. EDIT Expense Details (PUT)
exports.updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { propertyId, amount, category, description, date } = req.body;
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Expense ID format' });
    }
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ status: 'error', message: 'Expense record not found' });
    }
    if (propertyId) expense.property = propertyId;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date) expense.date = date;
    const saved = await expense.save();
    res.json({ status: 'success', expense: saved });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ status: 'error', message: 'Error updating expense details' });
  }
};

// 25. DELETE Expense
exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Expense ID format' });
    }
    const deleted = await Expense.findByIdAndDelete(expenseId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Expense record not found' });
    }
    res.json({ status: 'success', message: 'Expense record successfully deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ status: 'error', message: 'Error deleting expense' });
  }
};

// 26. GET all Maintenance Requests
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

// 27. GET Single Maintenance Request details
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

// 28. UPDATE Maintenance Request (e.g. status, priority, assignedWorker)
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

