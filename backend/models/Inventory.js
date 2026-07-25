const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, default: 0 },
  blockedStock: { type: Number, default: 0 },
  hospitalReservedStock: { type: Number, default: 0 },
  walkInReservedStock: { type: Number, default: 0 },
  expiredStock: { type: Number, default: 0 },
  damagedStock: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  price: { type: Number }, // Selling Price (MRP) - optional now as we focus on BP
  costPrice: { type: Number, required: true, default: 0 }, // Buying Price (BP)
  distributor: { type: String, required: true },
  batchNumber: { type: String },
  barcode: { type: String, sparse: true },
  image: { type: String, default: '' }, // URL or file path for medicine box/strip image
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Link to Distributor Catalog for Sync
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema, 'inventory');
