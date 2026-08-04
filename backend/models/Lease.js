const mongoose = require('mongoose');

const LeaseSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property is required']
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tenant is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Lease start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Lease end date is required']
  },
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required']
  },
  terms: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Renewed', 'Terminated', 'Expired'],
    default: 'Active'
  },
  documents: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Lease', LeaseSchema);
