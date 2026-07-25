const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersForDistributor,
  getOrdersForPharmacy,
  updateOrderStatus
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/all', getOrdersForDistributor);
router.get('/distributor/:distributorId', getOrdersForDistributor);
router.get('/pharmacy/:pharmacyId', getOrdersForPharmacy);
router.put('/:id', updateOrderStatus);

module.exports = router;
