const InquiryModel = require('../models/InquiryModel.js');
const nodemailer = require('nodemailer');

const createInquiry = async (req, res) => {
  const { name, email, message, subject, service, contactMethod } = req.body;

  try {
    // Save the inquiry to the database
    const newInquiry = new InquiryModel({
      name,
      email,
      message,
      subject,
      service,
      contactMethod,
    });
    await newInquiry.save();

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USERR, // your email (for SMTP authentication)
        pass: process.env.EMAIL_PASSS, // your email password
      },
    });

    // Email options
    const mailOptions = {
      from: email, // use the email from the form
      to: 'lecotrus2019@gmail.com', // replace with the company's email
      subject: `New Inquiry from ${name}`,
      text: `
        You have received a new inquiry:

        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Service: ${service}
        Preferred Contact Method: ${contactMethod}
        Message: ${message}

        -- End of message --
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Inquiry sent successfully!' });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ message: 'Failed to send inquiry.' });
  }
};

// Fetch all inquiries
const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await InquiryModel.find();
    res.status(200).json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries.' });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
};
