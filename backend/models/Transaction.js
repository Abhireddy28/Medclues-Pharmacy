const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String }, // Added to store name for walk-in or history
  familyMember: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    mrp: { type: Number, required: true },
    costPrice: { type: Number, required: true }, // Added for profit calculation
    gst: { type: Number, required: true }, // Per track per item
    total: { type: Number, required: true }, // MRP * Quantity + GST
  }],
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  paymentType: { type: String, enum: ['cash', 'upi', 'khata', 'credit', 'Cash', 'UPI', 'Khata', 'Credit'], required: true },
  status: { type: String, enum: ['completed', 'failed', 'refunded'], default: 'completed' },
  invoiceNumber: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema)
