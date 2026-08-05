const mongoose = require('mongoose');
const Payment = require('../models/Payment');

// GET single Payment Invoice Details
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

// Pay Rent (mark status as paid)
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

// CREATE Rent Invoice (Landlord Action)
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
