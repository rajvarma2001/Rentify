const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Property address is required'],
    trim: true
  },
  rentAmount: {
    type: Number,
    required: [true, 'Monthly rent amount is required']
  },
  type: {
    type: String,
    enum: ['Apartment', 'House', 'Studio', 'Office'],
    default: 'Apartment'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  rooms: [{
    roomNumber: String,
    status: {
      type: String,
      enum: ['Occupied', 'Vacant'],
      default: 'Vacant'
    },
    size: String
  }],
  assignedTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  leaseStart: Date,
  leaseEnd: Date,
  documents: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Property', PropertySchema);
