const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  addProduct,
  getProducts,
  getProductById,
  getVisibleProducts,
  removeProduct,
  updateProduct,
  hideProduct,
  unhideProduct,
} = require("../controllers/productController");

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/jpg",
    "image/svg+xml",
    "image/bmp",
    "image/avif",
    "image/tiff",
    "image/x-icon",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/mpeg",
    "video/ogg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log(
      "Rejected file type:",
      file.mimetype,
      "Original name:",
      file.originalname
    );
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images and videos are allowed.`
      ),
      false
    );
  }
};

// Create multer instance with proper error handling
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 40 * 1024 * 1024, // 20MB limit
    files: 28 // Total files across all fields (4 main + 10 gallery + 4 benefits + 10 details)
  },
  fileFilter: fileFilter,
});
// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Max size is 20MB." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Too many files." });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Unexpected file field." });
    }
  }

  // Handle custom file filter errors
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
};

// Product routes with proper error handling
router.post(
  "/",
  (req, res, next) => {
    console.log("File upload request received");
    next();
  },
  upload.fields([
    { name: "mainImages", maxCount: 4 },
    { name: "mediaGallery", maxCount: 10 },
    { name: "keyBenefitImages", maxCount: 4 },
    { name: "productDetailMedia", maxCount: 10 },
  ]),
  (req, res, next) => {
    console.log(
      "Files uploaded:",
      req.files ? Object.keys(req.files) : "No files"
    );
    if (req.files) {
      Object.entries(req.files).forEach(([field, files]) => {
        console.log(
          `${field}:`,
          files.map((f) => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
          }))
        );
      });
    }
    next();
  },
  handleMulterError,
  addProduct
);

router.get("/", getProducts);
router.get("/visible", getVisibleProducts);
router.get("/:id", getProductById);

router.delete("/:id", removeProduct);
router.put(
  "/:id",
  upload.fields([
    { name: "mainImages", maxCount: 4 },
    { name: "mediaGallery", maxCount: 10 },
    { name: "keyBenefitImages", maxCount: 4 },
    { name: "productDetailMedia", maxCount: 10 },
  ]),
  handleMulterError,
  updateProduct
);
router.patch("/:id/hide", hideProduct);
router.patch("/:id/unhide", unhideProduct);

module.exports = router;
