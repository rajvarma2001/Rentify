const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// GET single Payment Invoice Details
router.get('/:id', paymentController.getPaymentById);

// Pay Rent (mark status as paid)
router.post('/:id/pay', paymentController.payRent);

// CREATE Rent Invoice (Landlord Action)
router.post('/', paymentController.createInvoice);

module.exports = router;
