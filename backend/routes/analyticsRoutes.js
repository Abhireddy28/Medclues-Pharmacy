const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET analytics for pharmacy (Profit, Sales, Costs)
router.get('/:pharmacyId', analyticsController.getProfitInsights);

module.exports = router;
