const mongoose = require('mongoose');

const stockBatchSchema = new mongoose.Schema({
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyProfile', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  mrp: { type: Number, required: true },
  costPrice: { type: Number, required: true }, // Buying Price (BP)
  manufactureDate: { type: Date },
  expiryDate: { type: Date, required: true },
  barcode: { type: String },
  status: { type: String, enum: ['available', 'near_expiry', 'expired', 'depleted'], default: 'available' }
}, { timestamps: true });

stockBatchSchema.index({ inventory: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model('StockBatch', stockBatchSchema);
