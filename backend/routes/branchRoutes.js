const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, branchController.createBranch);
router.get('/', protect, branchController.getBranches);
router.get('/:id', protect, branchController.getBranchById);
router.put('/:id', protect, branchController.updateBranch);
router.delete('/:id', protect, branchController.deleteBranch);

router.post('/:branchId/staff', protect, branchController.createBranchStaff);
router.get('/:branchId/staff', protect, branchController.getBranchStaff);

module.exports = router;
