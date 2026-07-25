const mongoose = require('mongoose');

const masterProductSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  genericName: { type: String }, // Generic active ingredient
  composition: { type: String }, // e.g. Paracetamol 650mg + Caffeine 50mg
  manufacturer: { type: String }, // e.g. Cipla, Sun Pharma, Mankind
  brandName: { type: String }, // e.g. Dolo 650, Calpol 650
  category: { type: String, default: 'Tablet' }, // Tablet, Capsule, Syrup, Injection, Ointment, Drops
  dosageForm: { type: String }, // Oral, Topical, Intravenous
  strength: { type: String }, // 500mg, 650mg, 10ml, 100IU
  hsnCode: { type: String, default: '3004' }, // GST HSN Code for Medicaments
  gstRate: { type: Number, default: 12 }, // Percentage (5, 12, 18)
  prescriptionRequired: { type: Boolean, default: false }, // Rx / Schedule H drug flag
  packaging: { type: String, default: '10 Tablets/Strip' }, // Strip size / pack info
  barcode: { type: String, sparse: true },
  image: { type: String, default: '' }, // Master medicine box / strip photo URL
  status: { type: String, enum: ['active', 'discontinued'], default: 'active' }
}, { timestamps: true });

masterProductSchema.index({ name: 'text', composition: 'text', brandName: 'text' });

module.exports = mongoose.model('MasterProduct', masterProductSchema);
