const Address = require("../models/AddressModel");
const mongoose = require('mongoose');

// Get user addresses
const getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault = false,
    } = req.body;

    // If setting as default, remove default from other addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: req.user._id,
      firstName,
      lastName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault,
    });

    res.status(201).json(address);
  } catch (error) {
    console.error("Error adding address:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID format" });
    }

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Check if address belongs to user
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this address" });
    }

    // If setting as default, remove default from other addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    address.firstName = firstName || address.firstName;
    address.lastName = lastName || address.lastName;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.country = country || address.country;
    address.phone = phone || address.phone;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    const updatedAddress = await address.save();
    res.json(updatedAddress);
  } catch (error) {
    console.error("Error updating address:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID format" });
    }

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Check if address belongs to user
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this address" });
    }

    await Address.findByIdAndDelete(id);
    res.json({ message: "Address removed successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID format" });
    }

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Check if address belongs to user
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to set this address as default" });
    }

    // Remove default from other addresses
    await Address.updateMany(
      { user: req.user._id, isDefault: true },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};