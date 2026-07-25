const mongoose = require('mongoose');

const deliveryProofSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  imageUrl: { type: String, required: true },
  signatureUrl: { type: String },
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DeliveryProof', deliveryProofSchema);
