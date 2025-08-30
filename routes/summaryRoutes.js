const express = require('express');
const { getSummary } = require('../controllers/summaryController.js');

const router = express.Router();

router.get('/', getSummary);

module.exports = router;
