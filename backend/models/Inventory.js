const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  salt: { type: String, default: '' },
  brand: { type: String, default: '' },
  category: { type: String, default: 'General' },
  mrp: { type: Number, default: 0 },
  price: { type: Number, default: 0 }, // Selling Price
  costPrice: { type: Number, default: 0 }, // Buying Price (BP)
  hsnCode: { type: String, default: '30049099' },
  requiresRx: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  blockedStock: { type: Number, default: 0 },
  hospitalReservedStock: { type: Number, default: 0 },
  walkInReservedStock: { type: Number, default: 0 },
  expiredStock: { type: Number, default: 0 },
  damagedStock: { type: Number, default: 0 },
  expiryDate: { type: Date, default: () => new Date(Date.now() + 365*24*60*60*1000) },
  distributor: { type: String, default: 'General Wholesaler' },
  batchNumber: { type: String },
  barcode: { type: String, sparse: true },
  image: { type: String, default: '' }, // URL or file path for medicine box/strip image
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Link to Distributor Catalog for Sync
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema, 'inventory');
