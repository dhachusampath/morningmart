const express = require('express');
const { 
  createOrder, 
  getOrders, 
  getOrderById,
  cancelOrder 
} = require('../controllers/checkoutController');
const { protect } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .post(validateOrder, createOrder)
  .get(getOrders);

router.route('/:id')
  .get(getOrderById)
  .patch(cancelOrder); // For cancelling orders

module.exports = router;