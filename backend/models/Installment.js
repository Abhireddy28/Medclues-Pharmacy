const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  khataTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhataTransaction' }, // Original credit transaction
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: { type: String, enum: ['due', 'paid', 'overdue'], default: 'due' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'direct_transfer'], default: 'cash' },
}, { timestamps: true });

module.exports = mongoose.model('Installment', installmentSchema);
