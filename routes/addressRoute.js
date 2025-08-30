const express = require("express");
const addressController = require("../controllers/addressController");
const { protect } = require("../middleware/auth");
const { validateAddress } = require("../middleware/validation");

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route("/")
  .get(addressController.getUserAddresses)
  .post(validateAddress, addressController.addAddress);

router
  .route("/:id")
  .put(validateAddress, addressController.updateAddress)
  .delete(addressController.deleteAddress);

// Set default address
router.patch("/:id/default", addressController.setDefaultAddress);

module.exports = router;