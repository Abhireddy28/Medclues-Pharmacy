const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// Hospital-facing Webhook API Hooks (protected via HMAC verification)
router.post('/medclues/prescription', integrationController.createHospitalPrescription);
router.post('/medclues/emergency-request', integrationController.createEmergencyRequest);
router.post('/medclues/discharge-medicines', integrationController.createDischargeRequest);

// Patient App Direct Endpoints
router.get('/patient/prescriptions', integrationController.getPatientPrescriptions);
router.get('/patient/orders', integrationController.getPatientOrders);
router.get('/patient/bills', integrationController.getPatientBills);
router.get('/patient/delivery-tracking', integrationController.getDeliveryTracking);
router.post('/patient/refill-request', integrationController.requestRefill);

// Catalog Inquiry Endpoints
router.get('/catalog/search', integrationController.searchCatalog);
router.get('/catalog/details', integrationController.getCatalogDetails);

module.exports = router;
