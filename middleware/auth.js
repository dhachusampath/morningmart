const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const express = require("express");

const app = express();

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }
};
// Middleware to skip static file logging
app.use((req, res, next) => {
  // List of paths to exclude from logging
  const excludePaths = ["/uploads"];

  if (!excludePaths.some((path) => req.path.startsWith(path))) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});
