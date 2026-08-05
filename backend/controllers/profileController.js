const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 1. GET user profile details
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid User ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }

    res.json({
      status: 'success',
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        notificationSettings: user.notificationSettings || {
          rentDue: true,
          paymentReceived: true,
          leaseExpiry: true,
          maintenanceUpdate: true,
          systemNotif: true
        }
      }
    });
  } catch (err) {
    console.error('Fetch profile details error:', err);
    res.status(500).json({ status: 'error', message: 'Error retrieving profile' });
  }
};

// 2. EDIT personal profile details
exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, email, phone } = req.body;
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }

    if (name) user.name = name;
    if (email) {
      // Check if email already registered by someone else
      const exists = await User.findOne({ email, _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ status: 'error', message: 'Email address already in use' });
      }
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;

    const saved = await user.save();
    res.json({
      status: 'success',
      message: 'Profile details successfully updated',
      profile: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone || '',
        role: saved.role,
        notificationSettings: saved.notificationSettings
      }
    });
  } catch (err) {
    console.error('Update profile details error:', err);
    res.status(500).json({ status: 'error', message: 'Error updating details' });
  }
};

// 3. CHANGE password (with verification)
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Missing parameters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Match old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Current password does not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ status: 'success', message: 'Password successfully changed' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ status: 'error', message: 'Error changing password' });
  }
};

// 4. UPDATE notifications preferences
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { userId, settings } = req.body;
    if (!userId || !settings) {
      return res.status(400).json({ status: 'error', message: 'Missing settings details' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    user.notificationSettings = {
      rentDue: settings.rentDue !== undefined ? settings.rentDue : true,
      paymentReceived: settings.paymentReceived !== undefined ? settings.paymentReceived : true,
      leaseExpiry: settings.leaseExpiry !== undefined ? settings.leaseExpiry : true,
      maintenanceUpdate: settings.maintenanceUpdate !== undefined ? settings.maintenanceUpdate : true,
      systemNotif: settings.systemNotif !== undefined ? settings.systemNotif : true
    };

    await user.save();
    res.json({
      status: 'success',
      message: 'Notification settings successfully saved',
      settings: user.notificationSettings
    });
  } catch (err) {
    console.error('Update notification settings error:', err);
    res.status(500).json({ status: 'error', message: 'Error saving preferences' });
  }
};
