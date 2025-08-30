const express = require('express');
const { createOrder, getOrders } = require('../controllers/orderController.js');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the folder to store images
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/create', upload.single('paymentScreenshot'), createOrder);
router.get('/:userId', getOrders);

module.exports = router;
