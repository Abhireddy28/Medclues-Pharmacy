const express = require('express');
const router = express.Router();
const { 
  requestConnection, 
  respondToConnection, 
  getConnections, 
  discoverDistributors 
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All connection routes require login

router.get('/', getConnections);
router.post('/request', requestConnection);
router.put('/respond', respondToConnection);
router.get('/discover', discoverDistributors);

module.exports = router;
