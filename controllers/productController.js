const ProductModel = require("../models/ProductModel");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);

// Add a new product
const addProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');

    // Validate required fields first
    const {
      title,
      originalPrice,
      currentPrice,
      taxRate,
      description,
      categories,
      inStock,
      keyBenefits,
      productDetails,
    } = req.body;

    if (!title || !originalPrice || !currentPrice) {
      return res.status(400).json({ error: "Missing required fields: title, originalPrice, currentPrice" });
    }

    // Check if mainImages were uploaded (exactly 4 required)
    if (!req.files?.mainImages || req.files.mainImages.length !== 4) {
      console.log('Main images validation failed:', req.files?.mainImages?.length);
      
      // Clean up any uploaded files if validation fails
      if (req.files) {
        const allFiles = Object.values(req.files).flat();
        console.log('Cleaning up files due to validation failure');
        await Promise.all(
          allFiles.map(file => 
            unlinkAsync(file.path).catch(err => 
              console.error('Error cleaning up file:', err))
        ));
      }
      return res.status(400).json({ error: "Exactly 4 main images required" });
    }

    // Validate prices
    if (parseFloat(currentPrice) >= parseFloat(originalPrice)) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        const allFiles = Object.values(req.files).flat();
        await Promise.all(
          allFiles.map(file => 
            unlinkAsync(file.path).catch(err => 
              console.error('Error cleaning up file:', err))
        ));
      }
      return res.status(400).json({ 
        error: "Current price must be less than original price" 
      });
    }

    // Get next ID
    const highestProduct = await ProductModel.findOne().sort('-id');
    const nextId = highestProduct ? highestProduct.id + 1 : 1;

    // Process main images
    const mainImages = req.files.mainImages.map((file, index) => ({
      type: 'image',
      url: file.filename,
      caption: `Main Image ${index + 1}`,
      isFeatured: index === 0
    }));

    // Process key benefits (must be exactly 4)
    let parsedKeyBenefits = [];
    try {
      parsedKeyBenefits = JSON.parse(keyBenefits || "[]");
      if (parsedKeyBenefits.length !== 4) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          await Promise.all(
            allFiles.map(file => 
              unlinkAsync(file.path).catch(err => 
                console.error('Error cleaning up file:', err))
          ));
        }
        return res.status(400).json({ error: "Exactly 4 key benefits required" });
      }

      parsedKeyBenefits = parsedKeyBenefits.map((benefit, index) => ({
        title: benefit.title || `Benefit ${index + 1}`,
        description: benefit.description || "",
        image: req.files?.keyBenefitImages?.[index]?.filename || "",
      }));
    } catch (err) {
      console.error("Error parsing key benefits:", err);
      // Clean up uploaded files if validation fails
      if (req.files) {
        const allFiles = Object.values(req.files).flat();
        await Promise.all(
          allFiles.map(file => 
            unlinkAsync(file.path).catch(err => 
              console.error('Error cleaning up file:', err))
        ));
      }
      return res.status(400).json({ error: "Invalid key benefits format" });
    }

    // Process product details
    let parsedProductDetails = [];
    if (productDetails) {
      try {
        parsedProductDetails = JSON.parse(productDetails);

        let mediaIndex = 0;
        parsedProductDetails = parsedProductDetails.map((detail) => {
          const hasMedia = detail.type !== "text";
          const mediaFile =
            hasMedia && req.files?.productDetailMedia?.[mediaIndex];
          if (hasMedia) mediaIndex++;

          return {
            type: detail.type,
            content: detail.content || "",
            media: mediaFile?.filename || "",
          };
        });
      } catch (err) {
        console.error("Error parsing product details:", err);
        // Clean up uploaded files if validation fails
        if (req.files) {
          const allFiles = Object.values(req.files).flat();
          await Promise.all(
            allFiles.map(file => 
              unlinkAsync(file.path).catch(err => 
                console.error('Error cleaning up file:', err))
          ));
        }
        return res.status(400).json({ error: "Invalid product details format" });
      }
    }

    // Process media gallery
    const mediaGallery = req.files?.mediaGallery?.map((file) => ({
      type: file.mimetype.startsWith("video") ? "video" : "image",
      url: file.filename,
      caption: "",
    })) || [];

    // Create the product
    const newProduct = new ProductModel({
      id: nextId,
      title,
      originalPrice: parseFloat(originalPrice),
      currentPrice: parseFloat(currentPrice),
      taxRate: taxRate ? parseFloat(taxRate) : 0,
      description: description || "",
      categories: categories ? JSON.parse(categories) : [],
      inStock: inStock === "true" || inStock === true,
      mainImages,
      mediaGallery,
      keyBenefits: parsedKeyBenefits,
      productDetails: parsedProductDetails,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("Error adding product:", err);
    
    // Clean up any uploaded files on error
    if (req.files) {
      const allFiles = Object.values(req.files).flat();
      await Promise.all(
        allFiles.map(file => 
          unlinkAsync(file.path).catch(cleanupErr => 
            console.error('Error cleaning up file during error handling:', cleanupErr))
      ));
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all products (admin view)
const getProducts = async (req, res) => {
  try {
    const products = await ProductModel.find().sort({ id: 1 });
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get visible products (for customers)
const getVisibleProducts = async (req, res) => {
  try {
    const products = await ProductModel.find({ isVisible: true }).sort({
      id: 1,
    });
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching visible products:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await ProductModel.findOne({ id: parseInt(id) });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product", err);
    res.status(500).json({ error: err.message });
  }
};

// Remove a product by ID
const removeProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProduct = await ProductModel.findOneAndDelete({
      id: parseInt(id),
    });
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete all associated files
    const filesToDelete = [
      ...deletedProduct.mainImages.map(img => img.url),
      ...deletedProduct.mediaGallery.map((media) => media.url),
      ...deletedProduct.keyBenefits.map((benefit) => benefit.image),
      ...deletedProduct.productDetails
        .filter((detail) => detail.media)
        .map((detail) => detail.media),
    ].filter(Boolean);

    await Promise.all(
      filesToDelete.map((file) =>
        unlinkAsync(path.join("uploads", file)).catch((err) =>
          console.error("Error deleting file:", err)
        )
      )
    );

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error removing product:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update product by ID
const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await ProductModel.findOne({ id: parseInt(id) });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const originalPrice = req.body.originalPrice
      ? parseFloat(req.body.originalPrice)
      : product.originalPrice;
    const currentPrice = req.body.currentPrice
      ? parseFloat(req.body.currentPrice)
      : product.currentPrice;

    // Validate prices before proceeding
    if (currentPrice >= originalPrice) {
      return res.status(400).json({
        error: "Current price must be less than original price",
      });
    }

    // Prepare update data
    const updateData = {
      title: req.body.title || product.title,
      originalPrice,
      currentPrice,
      taxRate: req.body.taxRate
        ? parseFloat(req.body.taxRate)
        : product.taxRate,
      description: req.body.description || product.description,
      categories: req.body.categories
        ? Array.isArray(req.body.categories)
          ? req.body.categories
          : req.body.categories.split(",").map((cat) => cat.trim())
        : product.categories,
      inStock:
        req.body.inStock !== undefined
          ? req.body.inStock === "true" || req.body.inStock === true
          : product.inStock,
    };

    // Handle main images update
    if (req.files?.mainImages) {
      // Validate exactly 4 images
      if (req.files.mainImages.length !== 4) {
        return res.status(400).json({ error: "Exactly 4 main images required" });
      }

      // Delete old main images
      await Promise.all(
        product.mainImages.map(img => 
          unlinkAsync(path.join("uploads", img.url)).catch(console.error)
      ));
      
      updateData.mainImages = req.files.mainImages.map((file, index) => ({
        type: 'image',
        url: file.filename,
        caption: `Main Image ${index + 1}`,
        isFeatured: index === 0
      }));
    }

    // Handle media gallery update
    if (req.files?.mediaGallery) {
      // Delete old media files
      await Promise.all(
        product.mediaGallery.map(media => 
          unlinkAsync(path.join("uploads", media.url)).catch(console.error)
      ));
      
      updateData.mediaGallery = req.files.mediaGallery.map(file => ({
        type: file.mimetype.startsWith("video") ? "video" : "image",
        url: file.filename,
        caption: ""
      }));
    }

    // Handle key benefits
    if (req.body.keyBenefits) {
      try {
        const keyBenefitsData = JSON.parse(req.body.keyBenefits);
        if (keyBenefitsData.length !== 4) {
          return res.status(400).json({ error: "Exactly 4 key benefits required" });
        }

        const newKeyBenefits = keyBenefitsData.map((benefit, index) => {
          // Keep existing image if no new one is provided
          const imageFile = req.files?.keyBenefitImages?.[index];
          return {
            title: benefit.title || `Benefit ${index + 1}`,
            description: benefit.description,
            image: imageFile
              ? imageFile.filename
              : product.keyBenefits[index]?.image || "",
          };
        });

        // Delete old key benefit images that are being replaced
        await Promise.all(
          product.keyBenefits.map((benefit, index) => {
            if (req.files?.keyBenefitImages?.[index] && benefit.image) {
              return unlinkAsync(path.join("uploads", benefit.image)).catch(
                console.error
              );
            }
          })
        );

        updateData.keyBenefits = newKeyBenefits;
      } catch (err) {
        console.error("Error parsing key benefits:", err);
        return res.status(400).json({ error: "Invalid key benefits format" });
      }
    }

    // Handle product details
    if (req.body.productDetails) {
      try {
        const productDetailsData = JSON.parse(req.body.productDetails);

        let mediaIndex = 0;
        const newProductDetails = productDetailsData.map((detail) => {
          const hasMedia = detail.type !== "text";
          const mediaFile =
            hasMedia && req.files?.productDetailMedia?.[mediaIndex];
          if (hasMedia) mediaIndex++;

          return {
            type: detail.type,
            content: detail.content,
            media: mediaFile ? mediaFile.filename : detail.media || "",
          };
        });

        // Delete old product detail media that are being replaced
        await Promise.all(
          product.productDetails.map((detail, index) => {
            if (req.files?.productDetailMedia?.[index] && detail.media) {
              return unlinkAsync(path.join("uploads", detail.media)).catch(
                console.error
              );
            }
          })
        );

        updateData.productDetails = newProductDetails;
      } catch (err) {
        console.error("Error parsing product details:", err);
        return res.status(400).json({ error: "Invalid product details format" });
      }
    }

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { id: parseInt(id) },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({
      error: err.message,
      details: err.errors
        ? Object.values(err.errors).map((e) => e.message)
        : null,
    });
  }
};

// Hide a product by ID
const hideProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProduct = await ProductModel.findOneAndUpdate(
      { id: parseInt(id) },
      { isVisible: false },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error("Error hiding product:", err);
    res.status(500).json({ error: err.message });
  }
};

// Unhide a product by ID
const unhideProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProduct = await ProductModel.findOneAndUpdate(
      { id: parseInt(id) },
      { isVisible: true },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error("Error unhiding product:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  getVisibleProducts,
  removeProduct,
  updateProduct,
  hideProduct,
  unhideProduct,
};