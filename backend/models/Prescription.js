const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  externalPrescriptionId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialty: {
    type: String
  },
  patient: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    gender: { type: String },
    age: { type: Number }
  },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String },
    quantity: { type: Number, required: true },
    instructions: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'available', 'partial', 'alternative', 'out_of_stock'],
      default: 'pending'
    },
    verifiedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      default: null
    }
  }],
  estimatedCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['received', 'verified', 'packing', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'received'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  fulfillmentType: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  deliveryAddress: {
    type: String
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'assigned', 'picked', 'on_route', 'delivered', 'failed'],
    default: 'pending'
  },
  deliveryExecutive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryProof: {
    type: String,
    default: ''
  },
  digitalSignature: {
    type: String,
    default: ''
  },
  packingLog: {
    packedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    barcodeVerified: { type: Boolean, default: false },
    expiryVerified: { type: Boolean, default: false },
    packingNotes: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
