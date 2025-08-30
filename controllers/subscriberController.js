const SubscriberModel = require("../models/SubscriberModel.js");

// Get all subscribers
const getSubscribers = async (req, res) => {
  try {
    const subscribers = await SubscriberModel.find();
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a new subscriber
const addSubscriber = async (req, res) => {
  const { email } = req.body;
  try {
    const newSubscriber = new SubscriberModel({ email });
    await newSubscriber.save();
    res.status(201).json(newSubscriber);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Remove a subscriber
const removeSubscriber = async (req, res) => {
  try {
    const subscriber = await SubscriberModel.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }
    res.status(200).json({ message: "Subscriber removed" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getSubscribers,
  addSubscriber,
  removeSubscriber,
};
