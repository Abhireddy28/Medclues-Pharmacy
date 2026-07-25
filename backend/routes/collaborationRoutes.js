const express = require('express');
const router = express.Router();
const {
  getCollaborations,
  getPharmacyDetails,
  getPharmacyOrders,
  getPharmacyPayments
} = require('../controllers/collaborationController');

router.get('/', getCollaborations);
router.get('/:pharmacyId', getPharmacyDetails);
router.get('/orders/:pharmacyId', getPharmacyOrders);
router.get('/payments/:pharmacyId', getPharmacyPayments);

module.exports = router;
