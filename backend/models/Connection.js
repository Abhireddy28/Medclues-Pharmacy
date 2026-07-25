const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  notes: String,
  connectionDate: Date
}, { timestamps: true });

// Prevent duplicate connections
connectionSchema.index({ pharmacy: 1, distributor: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
