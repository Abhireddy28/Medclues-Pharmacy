const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  apiSecret: {
    type: String,
    required: true
  },
  webhookUrl: {
    type: String
  },
  connectionStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastSyncTime: {
    type: Date,
    default: Date.now
  },
  permissions: {
    type: [String],
    default: ['read_prescriptions', 'write_dispense_records']
  },
  errorLogs: [{
    timestamp: { type: Date, default: Date.now },
    error: String,
    endpoint: String
  }],
  retryQueue: [{
    timestamp: { type: Date, default: Date.now },
    payload: mongoose.Schema.Types.Mixed,
    endpoint: String,
    attempts: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
