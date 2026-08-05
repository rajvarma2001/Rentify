const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// GET user profile
router.get('/', profileController.getProfile);

// EDIT profile details
router.put('/', profileController.updateProfile);

// CHANGE password
router.post('/password', profileController.changePassword);

// UPDATE notifications preferences
router.post('/notifications', profileController.updateNotificationSettings);

module.exports = router;
