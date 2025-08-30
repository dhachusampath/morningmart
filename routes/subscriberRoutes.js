const express = require('express');
const { getSubscribers, addSubscriber, removeSubscriber } = require('../controllers/subscriberController.js');

const router = express.Router();

// Get all subscribers
router.get('/', getSubscribers);

// Add a new subscriber
router.post('/', addSubscriber);

// Remove a subscriber
router.delete('/:id', removeSubscriber);

module.exports = router;
