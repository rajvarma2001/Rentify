const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Create property (Landlord only)
router.post('/', propertyController.createProperty);

// GET Single Property Details
router.get('/:id', propertyController.getPropertyById);

// EDIT Property Details (PUT)
router.put('/:id', propertyController.updateProperty);

// DELETE Property
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
