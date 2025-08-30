const mongoose = require('mongoose');

const screenshotUploadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Assuming you have a User model
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order', // Assuming you have an Order model
    },
    screenshot: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ScreenshotUpload', screenshotUploadSchema);
