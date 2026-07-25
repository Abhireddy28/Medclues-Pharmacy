const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser, getAdminStats, getAllUsers, deleteUser } = require('../controllers/adminController');

router.get('/pending', getPendingUsers);
router.get('/pending-users', getPendingUsers); 
router.put('/approve/:id', approveUser);
router.put('/approve-user/:id', approveUser); // Alias for frontend handleApprove
router.put('/reject-user/:id', approveUser);  // Alias for frontend handleReject (logic handles rejection via body)
router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
