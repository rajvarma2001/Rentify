const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Authenticate user
router.post('/login', authController.login);

// Forgot password reset sequence
router.post('/forgot-password', authController.forgotPassword);

// Get list of registered tenants
router.get('/tenants', authController.getTenantsList);

module.exports = router;
