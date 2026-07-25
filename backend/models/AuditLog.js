const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'actorTypeModel',
    required: false
  },
  actorType: {
    type: String,
    enum: ['user', 'hospital', 'system'],
    default: 'system'
  },
  actorTypeModel: {
    type: String,
    enum: ['User', 'Hospital'],
    required: false
  },
  action: {
    type: String,
    required: true
  },
  endpoint: {
    type: String
  },
  ipAddress: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  payloadSummary: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
