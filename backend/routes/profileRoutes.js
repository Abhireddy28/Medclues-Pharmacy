const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  updatePassword, 
  logoutAll, 
  getDistributorInfo,
  getAllDistributors
} = require('../controllers/profileController');

router.get('/', getProfile);
router.put('/update', updateProfile);
router.put('/password', updatePassword);
router.post('/logout-all', logoutAll);
router.get('/distributor', getDistributorInfo);
router.get('/all-distributors', getAllDistributors);

module.exports = router;
