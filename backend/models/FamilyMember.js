const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  memberName: { type: String, required: true },
  relation: { type: String, required: true },
  age: { type: Number },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
