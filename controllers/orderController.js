// const OrderModel = require('../models/OrderModel.js');
// const CartModel = require('../models/CartModel.js');

// // Create a new order
// const createOrder = async (req, res) => {
//   const { userId, items, subtotal, total, shippingDetails, paymentMethod, paymentDetails, transactionId } = req.body;

//   try {
//     // Validate the presence of required fields
//     if (!shippingDetails.phone) {
//       return res.status(400).json({ error: 'Phone number is required for shipping details' });
//     }
    
//     // Validate payment details based on the payment method
//     if (paymentMethod === 'UPI' && !paymentDetails.upiId) {
//       return res.status(400).json({ error: 'UPI ID is required for UPI payments' });
//     }
//     if (paymentMethod === 'Bank' && (!paymentDetails.bankDetails || !paymentDetails.bankDetails.accountNumber)) {
//       return res.status(400).json({ error: 'Bank details are required for Bank payments' });
//     }

//     // Create a new order
//     const newOrder = new OrderModel({
//       userId,
//       items,
//       subtotal,
//       total,
//       shippingDetails,
//       paymentMethod,
//       paymentDetails,
//       transactionId,
//     });

//     const savedOrder = await newOrder.save();

//     // Clear the cart after order is placed
//     await CartModel.findOneAndUpdate({ userId }, { items: [] }); // Update to clear items from cart

//     res.status(201).json(savedOrder);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Get orders by user
// const getOrders = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     // Find orders by userId and populate userId with name and items.productId with product details
//     const orders = await OrderModel.find({ userId })
//       .populate('userId', 'name') // Populate the userId with only the name field
//       .populate('items.productId'); // Populate the productId in items

//     res.status(200).json(orders);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// module.exports = {
//   createOrder,
//   getOrders,
// };
const OrderModel = require('../models/OrderModel.js');
const CartModel = require('../models/CartModel.js');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create a new order
const createOrder = async (req, res) => {
  const { userId, items, subtotal, total, shippingDetails, paymentMethod, paymentDetails, transactionId } = req.body;

  // Assuming screenshot file is uploaded using multer
  const screenshot = req.file ? req.file.path : null;

  try {
    // Validate shipping details and payment details based on the payment method
    if (!shippingDetails.email) {
      return res.status(400).json({ error: 'Buyer email is required in shipping details.' });
    }

    // Create a new order
    const newOrder = new OrderModel({
      userId,
      items,
      subtotal,
      total,
      shippingDetails,
      paymentMethod,
      paymentDetails: {
        screenshot // Include the screenshot file path
      },
      transactionId
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    // Populate the product details in items
    const populatedOrder = await OrderModel.findById(savedOrder._id)
      .populate('items.productId', 'name images price'); // Populate product details

    // Clear the cart after order is placed
    await CartModel.findOneAndUpdate({ userId }, { items: [] });

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: "lecotrus2019@gmail.com",
        pass: "ubrv oyyg jqlm xoka", // Make sure to use environment variables for sensitive data
      },
    });

    // Buyer email template
    const buyerEmailTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p style="font-size: 16px;">Thank you for your order! Your order ID is <strong>${populatedOrder._id}</strong>.</p>
        <p style="font-size: 16px;">We will notify you once it ships.</p>

        <h3 style="color: #333;">Order Details</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${populatedOrder.items.map(item => `
            <li style="background-color: #fff; margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
              <div style="display: flex; align-items: center;">
                <img src="https://lecotrus.com/api/images/${item.productId.images[0]}" alt="${item.productId.name}" style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px; border-radius: 5px;" />
                <div>
                  <p style="margin: 0; font-weight: bold;">${item.productId.name}</p>
                  <p style="margin: 5px 0;">Quantity: ${item.quantity}</p>
                  <p style="margin: 5px 0;">Price: ₹${item.productId.price.toFixed(2)}</p>
                </div>
              </div>
            </li>
          `).join('')}
        </ul>

        <h3 style="color: #333;">Total: ₹${total.toFixed(2)}</h3>
        <p style="font-size: 16px;">Your order will be processed shortly. You can track the status of your order in your account.</p>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://yourstore.com/account/orders" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Visit Your Account
          </a>
          <p style="margin-top: 10px; font-size: 14px; color: #555;">or <a href="https://yourstore.com" style="color: #4CAF50; text-decoration: none;">return to our store</a> for more shopping!</p>
        </div>

        <p style="color: #555; margin-top: 20px; font-size: 14px;">If you have any questions, feel free to contact our support team.</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message, please do not reply.</p>
      </div>
    `;

    const buyerMailOptions = {
      from: "lecotrus2019@gmail.com",
      to: shippingDetails.email,
      subject: 'Order Confirmation',
      html: buyerEmailTemplate,
    };

    // Send email to the buyer
    await transporter.sendMail(buyerMailOptions);

    // Seller email template
    const sellerEmailTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">New Order Received</h2>
        <p>A new order has been placed! Here are the details:</p>

        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${populatedOrder._id}</p>
        <p><strong>Buyer Email:</strong> ${shippingDetails.email}</p>
        <p><strong>Buyer Mobile Number:</strong> ${shippingDetails.phoneNumber}</p>
        <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>

        <h3>Items Ordered:</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${populatedOrder.items.map(item => `
            <li style="background-color: #fff; margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
              <div style="display: flex; align-items: center;">
                <img src="https://lecotrus.com/api/images/${item.productId.images[0]}" alt="${item.productId.name}" style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px; border-radius: 5px;" />
                <div>
                  <p style="margin: 0;"><strong>${item.productId.name}</strong></p>
                  <p style="margin: 5px 0;">Quantity: ${item.quantity}</p>
                  <p style="margin: 5px 0;">Price: ₹${item.productId.price.toFixed(2)}</p>
                </div>
              </div>
            </li>
          `).join('')}
        </ul>

        <p style="margin-top: 20px;">Please proceed with the fulfillment process. Click the button below to manage the order.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://yourstore.com/admin/orders/${populatedOrder._id}" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Store
          </a>
        </div>

        <p style="color: #555; margin-top: 40px; font-size: 12px;">If you have any questions, feel free to contact us.</p>
      </div>
    `;

    const sellerMailOptions = {
      from: "official@lecotrus.com",
      to: "lecotrus2019@gmail.com",
      subject: 'New Order Received',
      html: sellerEmailTemplate,
    };

    // Send email to the seller
    await transporter.sendMail(sellerMailOptions);

    // Send the populated order details in response
    res.status(201).json(populatedOrder);
  } catch (err) {
    // Clean up the uploaded screenshot if there's an error
    if (screenshot) {
      fs.unlink(screenshot, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ error: 'Order creation failed', details: err });
  }
};

// Get orders by user
const getOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find orders by userId and populate user and product details
    const orders = await OrderModel.find({ userId })
      .populate('items.productId', 'name images price')
      .sort({ createdAt: -1 });

    // Send the orders in the response
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err });
  }
};

// Export the controller functions
module.exports = {
  createOrder,
  getOrders,
};
