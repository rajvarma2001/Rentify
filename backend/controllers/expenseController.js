const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// GET all Expenses (Landlord only)
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

// CREATE Expense (Landlord only)
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

// GET Single Expense Details
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

// EDIT Expense Details (PUT)
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

// DELETE Expense
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
