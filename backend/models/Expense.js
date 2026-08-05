const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property is required']
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required']
  },
  category: {
    type: String,
    enum: ['Maintenance', 'Taxes', 'Insurance', 'Utilities', 'Management', 'Other'],
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required']
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Landlord reference is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
