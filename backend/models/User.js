const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['tenant', 'landlord'],
    default: 'tenant'
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active'
  },
  notificationSettings: {
    rentDue: { type: Boolean, default: true },
    paymentReceived: { type: Boolean, default: true },
    leaseExpiry: { type: Boolean, default: true },
    maintenanceUpdate: { type: Boolean, default: true },
    systemNotif: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
