const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  subject: { type: String, required: true },
  service: { type: String, required: true },
  contactMethod: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const InquiryModel = mongoose.model('Inquiry', inquirySchema);

module.exports = InquiryModel;
