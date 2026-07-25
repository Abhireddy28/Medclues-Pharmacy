const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification
} = require('../controllers/notificationController');

router.get('/', getNotifications);
router.post('/', createNotification);
router.get('/count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/read/:id', markAsRead);

module.exports = router;
