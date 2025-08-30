const express = require('express');
const inquiryController = require('../controllers/inquiryController.js');

const router = express.Router();

// POST /api/inquiry - Create a new inquiry
router.post('/', inquiryController.createInquiry);

// GET /api/inquiry - Get all inquiries
router.get('/', inquiryController.getAllInquiries);

module.exports = router;
