const mongoose = require('mongoose');

const posInvoiceItemSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  name: { type: String, required: true },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  quantity: { type: Number, required: true, default: 1 },
  mrp: { type: Number, required: true },
  costPrice: { type: Number, required: true }, // Buying Price for profit margin calculation
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  gstRate: { type: Number, default: 12 }, // Percentage
  gstAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
});

const posInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyProfile', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String },
  customerKhataId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  items: [posInvoiceItemSchema],
  subtotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Khata', 'Mixed'], default: 'Cash' },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'paid' },
  notes: { type: String }
}, { timestamps: true });

posInvoiceSchema.index({ pharmacy: 1, invoiceNumber: 1 });

module.exports = mongoose.model('POSInvoice', posInvoiceSchema);
