const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, prescriptionController.getPrescriptions);
router.get('/:id', protect, prescriptionController.getPrescriptionById);
router.put('/:id/verify', protect, prescriptionController.verifyPrescription);
router.put('/:id/pack', protect, prescriptionController.packPrescription);
router.post('/:id/dispatch', protect, prescriptionController.dispatchPrescription);
router.post('/:id/complete-pickup', protect, prescriptionController.completePickup);
router.post('/:id/complete-delivery', protect, prescriptionController.completeDelivery);

module.exports = router;
