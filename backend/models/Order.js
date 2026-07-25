const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Price at time of order
  }],
  totalAmount: { type: Number },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'partial', 'delivered'], default: 'pending' },
  deliveryDate: { type: Date },
  orderType: { type: String, enum: ['manual', 'voice', 'auto'], default: 'manual' },
  deliveryProof: { type: String }, // URL or reference
  signature: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
