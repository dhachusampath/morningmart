const { body, validationResult } = require('express-validator');

// Validate order data
const validateOrder = [
  body('orderItems').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('orderItems.*.product').isMongoId().withMessage('Invalid product ID'),
  body('orderItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('orderItems.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone number is required'),
  body('paymentMethod').isIn(['credit-card', 'paypal', 'upi']).withMessage('Invalid payment method'),
  body('itemsPrice').isFloat({ min: 0 }).withMessage('Items price must be a positive number'),
  body('taxPrice').isFloat({ min: 0 }).withMessage('Tax price must be a positive number'),
  body('shippingPrice').isFloat({ min: 0 }).withMessage('Shipping price must be a positive number'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validate address data
const validateAddress = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('street').notEmpty().withMessage('Street address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zipCode').notEmpty().withMessage('ZIP code is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('country').optional().notEmpty().withMessage('Country is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateOrder,
  validateAddress
};