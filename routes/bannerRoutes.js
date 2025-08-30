// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const BannerModel = require('../models/BannerModel');

// // Configure multer for handling file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, '../uploads'); // Corrected path
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath);
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
//   }
// });

// const upload = multer({ storage: storage });

// // Route to handle banner uploads
// router.post('/upload', upload.single('banner'), async (req, res) => {
//   try {
//     const filePath = req.file.filename ; // Ensure this matches the actual upload path

//     // Create a new banner entry in the database
//     const newBanner = new BannerModel({
//       imagePath: filePath, // Updated to match the model field name
//       title: req.body.title || '',
//       description: req.body.description || ''
//     });

//     await newBanner.save();
//     res.json({
//       message: 'Banner uploaded and saved successfully!',
//       banner: newBanner
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to upload banner' });
//   }
// });
// router.get('/', async (req, res) => {
//   try {
//     const banners = await BannerModel.find();
//     res.json(banners);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to fetch banners' });
//   }
// });

// // Route to get a specific banner by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const banner = await BannerModel.findById(req.params.id);
//     if (!banner) {
//       return res.status(404).json({ message: 'Banner not found' });
//     }
//     res.json(banner);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to fetch banner' });
//   }
// });
// // Route to delete a banner
// router.delete('/delete/:id', async (req, res) => {
//   try {
//     const banner = await BannerModel.findById(req.params.id);
//     if (!banner) {
//       return res.status(404).json({ message: 'Banner not found' });
//     }

//     // Delete the banner file
//     fs.unlink(path.join(__dirname, '../uploads', path.basename(banner.imagePath)), (err) => {
//       if (err) {
//         return res.status(500).json({ message: 'Failed to delete the image' });
//       }
//     });

//     // Delete the banner record from the database
//     await BannerModel.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Banner deleted successfully!' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to delete banner' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BannerModel = require('../models/BannerModel');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Route to handle banner uploads
router.post('/upload', upload.single('banner'), async (req, res) => {
  try {
    const filePath = req.file.filename;

    // Create a new banner entry in the database with the category
    const newBanner = new BannerModel({
      imagePath: filePath,
      title: req.body.title || '',
      description: req.body.description || '',
      category: req.body.category || 'homepage' // Default category if not provided
    });

    await newBanner.save();
    res.json({
      message: 'Banner uploaded and saved successfully!',
      banner: newBanner
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload banner' });
  }
});

// Route to get banners by category
router.get('/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const banners = await BannerModel.find({ category });
    res.json(banners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch banners' });
  }
});

// Route to get all banners (optional, in case you need all)
router.get('/', async (req, res) => {
  try {
    const banners = await BannerModel.find();
    res.json(banners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch banners' });
  }
});

// Route to get a specific banner by ID
router.get('/id/:id', async (req, res) => {
  try {
    const banner = await BannerModel.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch banner' });
  }
});

// Route to delete a banner by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const banner = await BannerModel.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete the banner file
    fs.unlink(path.join(__dirname, '../uploads', path.basename(banner.imagePath)), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete the image' });
      }
    });

    // Delete the banner record from the database
    await BannerModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete banner' });
  }
});

module.exports = router;

