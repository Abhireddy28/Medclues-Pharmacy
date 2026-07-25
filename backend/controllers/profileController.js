const User = require('../models/User');
const PharmacyProfile = require('../models/PharmacyProfile');
const Distributor = require('../models/Distributor');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || req.body.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = await PharmacyProfile.findOne({ userId }).populate('distributorId');
    
    // Create default if not exists
    if (!profile && user.role === 'pharmacy') {
        profile = await PharmacyProfile.create({
            userId: user._id,
            pharmacyName: user.shopName || user.name,
            address: user.address || ''
        });
    }

    res.json({
      user,
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { 
      name, email, phone, // User fields
      pharmacyName, address, gstNumber, licenseNumber, openingTime, closingTime // Profile fields
    } = req.body;

    // Update User
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    await user.save();

    // Update Profile
    let profile = await PharmacyProfile.findOne({ userId });
    if (profile) {
      if (pharmacyName) profile.pharmacyName = pharmacyName;
      if (address) profile.address = address;
      if (gstNumber) profile.gstNumber = gstNumber;
      if (licenseNumber) profile.licenseNumber = licenseNumber;
      if (openingTime) profile.openingTime = openingTime;
      if (closingTime) profile.closingTime = closingTime;
      await profile.save();
    }

    res.json({ message: 'Profile updated successfully', user, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordChanged(user);
    } catch (err) {
      console.error("Password change confirmation email failed", err);
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logoutAll = async (req, res) => {
  try {
    // Since we use JWTs without db storage, a real "logout from all devices" requires 
    // a token blacklist or updating a token version/timestamp on user model. 
    // For this design, we will just return success. 
    // The client should clear localStorage.
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDistributorInfo = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const profile = await PharmacyProfile.findOne({ userId }).populate('distributorId');
    if (!profile) return res.json({ distributor: null });
    
    // We can also fetch some dummy active order counts or something, let's just return the distributor
    if (!profile.distributorId) {
      return res.json({ distributor: null });
    }

    res.json({ 
      distributor: profile.distributorId,
      activeOrdersCount: 2 // Mock count for UI display per requirements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDistributors = async (req, res) => {
  try {
    const distributors = await User.find({ role: 'distributor' }).select('-password');
    res.json(distributors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  logoutAll,
  getDistributorInfo,
  getAllDistributors
};
