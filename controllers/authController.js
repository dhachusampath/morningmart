// controllers/authController.js
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const passport = require("passport");

// Google authentication
exports.googleLogin = (req, res, next) => {
  console.log("Initiating Google OAuth...");
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
};


exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err || !user) {
      console.error("Google authentication error:", err || "No user returned");
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_auth_failed`
      );
    }

    try {
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // Prepare user data for frontend
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isVerified: user.isVerified
      };
      
      // Check if user has a temporary cart in session
      if (req.session.tempCart) {
        userData.tempCart = JSON.stringify(req.session.tempCart);
        delete req.session.tempCart;
      }

      // ⬇️⬇️⬇️ CHANGE THIS LINE ⬇️⬇️⬇️
      const redirectUrl = new URL(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/success`);
      // ⬆️⬆️⬆️ CHANGE THIS LINE ⬆️⬆️⬆️
      
      // Add all user data as query params
      Object.keys(userData).forEach(key => {
        if (userData[key]) {
          redirectUrl.searchParams.append(key, userData[key]);
        }
      });
      
      redirectUrl.searchParams.append('token', token);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Google callback error:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=server_error`
      );
    }
  })(req, res, next);
};
// Other auth functions remain the same...
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({ name, email, password });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        avatar: user.avatar 
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email with OTP
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });
    } else {
      console.log("OTP for password reset:", otp);
    }

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid OTP or expired" });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};