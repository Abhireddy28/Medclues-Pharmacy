const express = require('express');
const router = express.Router();
const multer = require('multer');
const inventoryController = require('../controllers/inventoryController');

// Multer memory storage for Excel uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/add', inventoryController.addStock);
router.post('/bulk-upload', upload.single('file'), inventoryController.bulkUploadInventory);
router.post('/billing-reduce-stock', inventoryController.reduceStockBulk);
router.put('/update/:id', inventoryController.updateStock);
router.delete('/:id', inventoryController.deleteStock);
router.get('/', inventoryController.getInventory);
router.get('/expired', inventoryController.getExpired);
router.get('/near-expiry', inventoryController.getNearExpiry);
router.get('/barcode/:barcode', inventoryController.getByBarcode);

module.exports = router;
