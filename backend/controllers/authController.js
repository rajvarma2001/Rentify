const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'tenant'
    });

    const savedUser = await newUser.save();
    
    // Response (exclude password)
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ status: 'error', message: 'Server error during registration' });
  }
};

// Authenticate user and get session details
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Check password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    res.json({
      status: 'success',
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: 'Server error during authentication' });
  }
};

// Mock password reset sequence
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Please provide your email address' });
    }

    // Verify user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'No account found with this email' });
    }

    // Mock response success
    res.json({
      status: 'success',
      message: `A password reset link has been successfully dispatched to ${email}. (Simulated Flow)`
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ status: 'error', message: 'Server error during forgot password process' });
  }
};

// GET List of all Tenants (for property assignment dropdown)
exports.getTenantsList = async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' }, 'name email');
    res.json({ status: 'success', tenants });
  } catch (err) {
    console.error('Fetch tenants error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving tenants list' });
  }
};
