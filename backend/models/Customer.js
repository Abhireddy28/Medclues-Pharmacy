const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  address: { type: String },
  totalBalance: { type: Number, default: 0 },
  pendingKhata: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalVisits: { type: Number, default: 0 },
  lastVisit: { type: Date },
  customerTag: { type: String, enum: ['Regular', 'High Value', 'High Risk', 'New', 'None'], default: 'None' },
  isRegular: { type: Boolean, default: false },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
