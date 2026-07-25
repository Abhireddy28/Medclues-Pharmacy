const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

const { protect } = require('../middleware/authMiddleware');

// Save a new sale
router.post('/add', protect, transactionController.createTransaction);

// Get transactions for pharmacy
router.get('/:pharmacyId', transactionController.getTransactionsByPharmacy);

module.exports = router;
