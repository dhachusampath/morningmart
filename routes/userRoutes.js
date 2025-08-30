// const express = require('express');
// const { registerUser, loginUser, getUserProfile } = require('../controllers/userController.js');

// const router = express.Router();

// router.post('/register', registerUser);
// router.post('/login', loginUser);
// router.get('/profile/:userId', getUserProfile);

// module.exports = router;

const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/userController");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile/:userId", authenticateToken, getUserProfile);

module.exports = router;
