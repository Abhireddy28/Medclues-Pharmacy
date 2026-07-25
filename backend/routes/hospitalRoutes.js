const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, hospitalController.createHospital);
router.get('/', protect, hospitalController.getHospitals);
router.get('/:id', protect, hospitalController.getHospitalById);
router.put('/:id', protect, hospitalController.updateHospital);
router.delete('/:id', protect, hospitalController.deleteHospital);

router.post('/:hospitalId/retry/:payloadId', protect, hospitalController.retryWebhook);
router.get('/:id/error-logs', protect, hospitalController.getErrorLogs);

module.exports = router;
