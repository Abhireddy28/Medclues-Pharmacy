const mongoose = require('mongoose');

const pharmacistProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyProfile', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  rphRegistrationNo: { type: String, required: true }, // Registered Pharmacist Registration Number
  qualification: { type: String, default: 'B.Pharm' }, // B.Pharm, D.Pharm, M.Pharm, Pharm.D
  councilName: { type: String }, // e.g. State Pharmacy Council
  shiftHours: { type: String, default: '09:00 - 18:00' },
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('PharmacistProfile', pharmacistProfileSchema);
