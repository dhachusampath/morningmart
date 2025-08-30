const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  description: { type: String, default: '' },
  categories: { type: [String], default: [] },
  inStock: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  
  // Updated media structure
  mainImages: [{
    type: { type: String, enum: ['image'], default: 'image' },
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false }
  }],
  
  mediaGallery: [{
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    caption: { type: String, default: '' }
  }],
  
  keyBenefits: [{
    title: { type: String, default: '' },
    description: { type: String, required: true },
    image: { type: String, default: '' }
  }],
  
  productDetails: [{
    type: { type: String, enum: ['text', 'image', 'video'], required: true },
    content: { type: String, required: true },
    media: { type: String, default: '' }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// Auto-increment ID
productSchema.pre('save', async function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
    return next();
  }
  
  try {
    const lastProduct = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastProduct ? lastProduct.id + 1 : 1;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Product', productSchema);