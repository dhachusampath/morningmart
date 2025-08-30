const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");

const mongoose = require('mongoose');
// Get user's cart
exports.getCart = async (req, res) => {
  try {
    console.log("Fetching cart for user:", req.user._id);
    
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
    
    if (!cart) {
      console.log("No cart found, returning empty array");
      return res.status(200).json({ items: [], message: "Cart is empty" });
    }
    
    console.log("Cart found with", cart.items.length, "items");
    res.status(200).json(cart);
  } catch (err) {
    console.error("Error in getCart:", err.message);
    res.status(500).json({ 
      error: "Failed to fetch cart", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Add item to cart
// In cartController.js - enhanced addToCart function
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    console.log("Add to cart request:", { productId, quantity, userId });

    // Validate input
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID format" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.inStock) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      console.log("Creating new cart for user");
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += quantity;
      console.log("Updated existing item quantity to:", cart.items[existingItemIndex].quantity);
    } else {
      // Add new item to cart
      cart.items.push({ product: productId, quantity });
      console.log("Added new item to cart");
    }

    await cart.save();
    console.log("Cart saved successfully");
    
    const populatedCart = await Cart.findById(cart._id).populate("items.product");
    res.status(200).json(populatedCart);
  } catch (err) {
    console.error("Error in addToCart:", err.message);
    console.error("Full error:", err); // Added for better debugging
    
    // Check for specific error types
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid data format",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to add item to cart", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    console.log("Update cart item request:", { itemId, quantity, userId });

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    // Validate item ID format
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID format" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();
    console.log("Item quantity updated successfully");
    
    const populatedCart = await Cart.findById(cart._id).populate("items.product");
    res.status(200).json(populatedCart);
  } catch (err) {
    console.error("Error in updateCartItem:", err.message);
    res.status(500).json({ 
      error: "Failed to update cart item", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    console.log("Remove from cart request:", { itemId, userId });

    // Validate item ID format
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID format" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Find the item by ID and remove it
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    console.log("Item removed from cart successfully");
    
    const populatedCart = await Cart.findById(cart._id).populate("items.product");
    res.status(200).json(populatedCart);
  } catch (err) {
    console.error("Error in removeFromCart:", err.message);
    res.status(500).json({ 
      error: "Failed to remove item from cart", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Clear cart request for user:", userId);

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    
    cart.items = [];
    await cart.save();
    console.log("Cart cleared successfully");
    
    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    console.error("Error in clearCart:", err.message);
    res.status(500).json({ 
      error: "Failed to clear cart", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};