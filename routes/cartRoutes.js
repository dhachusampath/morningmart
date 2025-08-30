const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

// Protected routes (require authentication)
router.use(protect);

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/:itemId", cartController.updateCartItem);
router.delete("/:itemId", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

module.exports = router;