const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  role: { type: String, enum: ['admin', 'distributor', 'pharmacy', 'pharmacist', 'branch_manager', 'delivery_executive'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  shopName: { type: String },
  address: { type: String },
  phone: { type: String },
  idProof: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Profile references
  pharmacistProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacistProfile', default: null },
  riderProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'RiderProfile', default: null },
  distributorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorProfile', default: null },
  pharmacyProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyProfile', default: null },
  otp: String,
  otpExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
