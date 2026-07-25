const mongoose = require('mongoose');

const khataTransactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }, // Original billing ID
  type: { type: String, enum: ['credit', 'debit', 'installment'], required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true }, // Remaining balance for customer
  status: { type: String, enum: ['unpaid', 'paid', 'partiallyPaid'], default: 'unpaid' },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('KhataTransaction', khataTransactionSchema);
