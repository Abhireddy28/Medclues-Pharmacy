const mongoose = require('mongoose');

const distributorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstNumber: { type: String }, // GSTIN
  licenseNumber: { type: String }, // Drug Wholesale License
  minOrderValue: { type: Number, default: 0 },
  paymentTerms: { type: String, default: 'Net 30' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('DistributorProfile', distributorProfileSchema);
