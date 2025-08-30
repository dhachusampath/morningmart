const OrderModel = require('../models/OrderModel.js');
const UserModel = require('../models/UserModel.js');
const ProductModel = require('../models/ProductModel.js');

const getSummary = async (req, res) => {
  try {
    const totalSale = await OrderModel.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const productsCount = await ProductModel.countDocuments();
    const ordersCount = await OrderModel.countDocuments();
    const paidOrdersCount = await OrderModel.countDocuments({ status: 'Paid' });
    const unpaidOrdersCount = await OrderModel.countDocuments({ status: 'Unpaid' });
    const usersCount = await UserModel.countDocuments();

    res.status(200).json({
      totalSale: totalSale[0]?.total || 0,
      products: productsCount,
      orders: ordersCount,
      paidOrders: paidOrdersCount,
      unpaidOrders: unpaidOrdersCount,
      totalUsers: usersCount,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getSummary
};
