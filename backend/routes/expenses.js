const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// GET all Expenses (Landlord only)
router.get('/', expenseController.getExpenses);

// CREATE Expense (Landlord only)
router.post('/', expenseController.createExpense);

// GET Single Expense Details
router.get('/:id', expenseController.getExpenseById);

// EDIT Expense Details (PUT)
router.put('/:id', expenseController.updateExpense);

// DELETE Expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
