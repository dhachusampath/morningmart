const express = require('express');
const multer = require('multer');
const path = require('path');
const ScreenshotUpload = require('../models/ScreenshotUploadModel');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where files will be stored
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname); // Generate unique filename
        cb(null, uniqueName); // Store only the filename
    },
});

const upload = multer({ storage });

router.post('/upload', upload.single('screenshot'), async (req, res) => {
    try {
        const { userId, orderId } = req.body; // Get userId and orderId from the request body
        const screenshot = req.file.filename; // Get the filename (not the full path)

        if (!userId || !orderId) {
            return res.status(400).json({ message: 'User ID and Order ID are required.' });
        }

        // Create a new screenshot upload
        const newUpload = new ScreenshotUpload({
            userId,
            orderId, // Save the orderId
            screenshot, // Save only the filename
        });

        await newUpload.save();
        res.status(201).json({ message: 'Screenshot uploaded successfully!', upload: newUpload });
    } catch (error) {
        console.error('Screenshot upload failed:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to get screenshots based on user ID
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params; // Get user ID from request parameters

    try {
        // Find all screenshots for the specified user ID
        const screenshots = await ScreenshotUpload.find({ userId });

        if (!screenshots || screenshots.length === 0) {
            return res.status(404).json({ message: 'No screenshots found for this user.' });
        }

        res.status(200).json({ screenshots });
    } catch (error) {
        console.error('Error fetching screenshots:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
