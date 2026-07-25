const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  createProduct, 
  getProductById, 
  getSubstitutes, 
  getProductByBarcode,
  bulkCreateProducts,
  parseInvoice,
  updateProduct,
  deleteProduct,
  getAIRecommendations
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
 
router.get('/', protect, getProducts);
router.post('/', protect, createProduct);
router.post('/bulk', protect, bulkCreateProducts);
router.post('/parse-invoice', protect, parseInvoice);
router.get('/barcode/:barcode', protect, getProductByBarcode);
router.get('/ai-recommendations', protect, getAIRecommendations);
router.get('/:id', protect, getProductById);
router.get('/substitutes/:id', protect, getSubstitutes);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
 
module.exports = router;
