// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Google OAuth routes
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

// User routes
router.get("/me", userController.getMe);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);

module.exports = router;