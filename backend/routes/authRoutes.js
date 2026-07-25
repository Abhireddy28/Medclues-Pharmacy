const express = require('express');
const router = express.Router();
const { uploadCloud } = require('../utils/cloudinary');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

router.use((req, res, next) => {
  console.log("Auth Router hit:", req.url);
  next();
});

router.post('/register', uploadCloud.single('idProof'), registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
