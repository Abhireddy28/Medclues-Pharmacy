const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['inventory', 'khata', 'order', 'general'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  actionLink: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
