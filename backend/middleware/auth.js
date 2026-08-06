const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.header('Authorization');
    
    // Check if token exists in the header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'No token, authorization denied' });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentify_jwt_secret_token_key_2026_xYz');

    // Attach user object to req.user (excluding password field)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found, authorization denied' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    res.status(401).json({ status: 'error', message: 'Token is not valid' });
  }
};
