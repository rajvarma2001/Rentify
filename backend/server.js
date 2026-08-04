const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rent-management-system';
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    // Seed initial demo data
    seedDatabase();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  
  res.json({
    status: 'success',
    message: 'Express server is running',
    database: statusMap[dbState] || 'Unknown',
  });
});

// Auto-Seeding logic to provide interactive mock data
const seedDatabase = async () => {
  try {
    const User = require('./models/User');
    const Property = require('./models/Property');
    const Payment = require('./models/Payment');
    const Maintenance = require('./models/Maintenance');
    const bcrypt = require('bcryptjs');

        await Property.deleteMany({});
    await Payment.deleteMany({});
    await Maintenance.deleteMany({});

    console.log('Seeding initial demo data...');

    // Create landlord user if not exists
    let landlord = await User.findOne({ email: 'landlord@example.com' });
    if (!landlord) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      landlord = new User({
        name: 'Demo Landlord',
        email: 'landlord@example.com',
        password: hashedPassword,
        role: 'landlord'
      });
      await landlord.save();
    }

    // Create tenant user if not exists
    let tenant = await User.findOne({ email: 'tenant@example.com' });
    if (!tenant) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      tenant = new User({
        name: 'Demo Tenant',
        email: 'tenant@example.com',
        password: hashedPassword,
        role: 'tenant'
      });
      await tenant.save();
    }

    // Seed Properties
    const prop1 = new Property({
      name: 'Sunset Heights Apartments - 104',
      address: '742 Evergreen Terrace, Springfield',
      rentAmount: 1200,
      type: 'Apartment',
      landlord: landlord._id,
      description: 'Beautiful sunny suite with private balcony, hardwood flooring, and recently upgraded kitchen appliances.',
      rooms: [
        { roomNumber: '104-A', status: 'Occupied', size: '12x15' },
        { roomNumber: '104-B', status: 'Vacant', size: '10x12' }
      ],
      assignedTenant: tenant._id,
      leaseStart: new Date('2026-01-01'),
      leaseEnd: new Date('2026-12-31'),
      documents: ['lease_agreement_sunset_104.pdf', 'renters_insurance_receipt.pdf']
    });
    await prop1.save();

    const prop2 = new Property({
      name: 'Pacific Breeze Villa - Unit A',
      address: '101 Ocean Drive, Malibu',
      rentAmount: 2500,
      type: 'House',
      landlord: landlord._id,
      description: 'High-end beachfront villa featuring panoramic ocean views, private patio deck, and pool access.',
      rooms: [
        { roomNumber: 'Master-1', status: 'Vacant', size: '20x25' },
        { roomNumber: 'Guest-2', status: 'Vacant', size: '14x16' }
      ],
      documents: ['property_insurance_villa.pdf', 'hoa_guidelines.pdf']
    });
    await prop2.save();

    const prop3 = new Property({
      name: 'Downtown Tech Loft',
      address: '500 Innovation Way, San Francisco',
      rentAmount: 1800,
      type: 'Studio',
      landlord: landlord._id,
      description: 'Modern industrial style studio loft with high ceilings, exposed brick walls, and central heating.',
      rooms: [
        { roomNumber: 'Loft-Main', status: 'Occupied', size: '22x30' }
      ],
      assignedTenant: tenant._id,
      leaseStart: new Date('2026-06-01'),
      leaseEnd: new Date('2027-05-31'),
      documents: ['lease_agreement_tech_loft.pdf']
    });
    await prop3.save();

    // Seed Payments
    const pay1 = new Payment({
      property: prop1._id,
      tenant: tenant._id,
      amount: 1200,
      status: 'paid',
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      paidAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    });
    await pay1.save();

    const pay2 = new Payment({
      property: prop1._id,
      tenant: tenant._id,
      amount: 1200,
      status: 'due',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // due in 5 days
    });
    await pay2.save();

    const pay3 = new Payment({
      property: prop3._id,
      tenant: tenant._id,
      amount: 1800,
      status: 'overdue',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // overdue by 5 days
    });
    await pay3.save();

    // Seed Maintenance Requests
    const maint1 = new Maintenance({
      property: prop1._id,
      tenant: tenant._id,
      title: 'Kitchen Sink Leaking',
      description: 'The pipes under the kitchen sink are leaking slow drips. Water is building up inside the cabinet.',
      status: 'pending',
      priority: 'medium'
    });
    await maint1.save();

    const maint2 = new Maintenance({
      property: prop1._id,
      tenant: tenant._id,
      title: 'AC Unit Air Flow Issue',
      description: 'The air conditioner is not cooling the bedroom efficiently. Filters might need replacement.',
      status: 'in-progress',
      priority: 'high'
    });
    await maint2.save();

    console.log('🎉 Database seeding completed successfully.');

  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// Start Server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
