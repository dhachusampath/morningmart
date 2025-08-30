const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'smtp.example.com'
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS  // Your email password or app-specific password
  }
});

// POST route for contact form submission
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const mailOptions = {
    from: email,
    to: process.env.CONTACT_EMAIL, // Preferred email address
    subject: `Contact Us: ${subject}`,
    text: `Message from ${name} (${email}):\n\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;
