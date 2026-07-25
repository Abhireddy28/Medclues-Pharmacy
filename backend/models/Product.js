const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  composition: { type: String, required: true },
  price: { type: Number, required: true },
  previousPrice: { type: Number },
  costPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  expiryDate: { type: Date, required: true },
  category: { type: String, default: 'Tablet' }, 
  barcode: { type: String, sparse: true }, // Removed global unique constraint
  image: { type: String, default: '' }, // Medicine strip/box image URL
  masterProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterProduct' },
  distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'outOfStock', 'expired'], default: 'available' },
}, { timestamps: true });

// Create a compound index so a barcode is unique ONLY for a specific distributor
// This allows different distributors to have the same barcode products
productSchema.index({ barcode: 1, distributor: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
