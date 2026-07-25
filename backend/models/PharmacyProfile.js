const mongoose = require('mongoose');

const pharmacyProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyName: { type: String, required: true },
  address: { type: String },
  gstNumber: { type: String },
  licenseNumber: { type: String },
  openingTime: { type: String },
  closingTime: { type: String },
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Distributor' }
}, { timestamps: true });

module.exports = mongoose.model('PharmacyProfile', pharmacyProfileSchema);
