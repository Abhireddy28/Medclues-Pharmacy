const express = require('express');
const router = express.Router();
const khataController = require('../controllers/khataController');

// Add to khata (Credit)
router.post('/add', khataController.addKhataEntry);

// Add payment to clear due
router.post('/payment', khataController.addPayment);

// Get all customers with khata balance
router.get('/list', khataController.getKhataList);

// Get specific customer khata details
router.get('/:id', khataController.getCustomerKhataDetails);

// Send payment reminder email
router.post('/send-reminder/:id', khataController.sendPaymentReminder);

module.exports = router;
