const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Define routes for customer management
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.get('/:id/purchases', customerController.getCustomerPurchases);
router.get('/:id/khata', customerController.getCustomerKhata);
router.get('/:id/history', customerController.getCombinedHistory);
router.get('/:id/family', customerController.getFamilyMembers);
router.post('/:id/family', customerController.addFamilyMember);
router.post('/:id/payment', customerController.addCustomerPayment);

module.exports = router;
