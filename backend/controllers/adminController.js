const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const emailService = require('../utils/emailService');

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      $or: [
        { status: 'pending' }, 
        { status: { $exists: false } }
      ] 
    }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'approved' or 'rejected'
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    await User.findByIdAndUpdate(id, { status });

    if (status === 'approved') {
      try {
        // Generate a secure random password for the user
        const generatedPassword = Math.random().toString(36).slice(-8);
        user.password = generatedPassword;
        await user.save(); // pre-save hook will hash it

        await emailService.sendAccountApproval(user, generatedPassword);
        console.log(`Live approval email + credentials dispatched to: ${user.email}`);
      } catch (err) {
        console.error("Critical Failure: Could not dispatch live email notification", err);
      }
    } else if (status === 'rejected') {
      try {
        await emailService.sendAccountRejection(user, reason || 'Incomplete documentation or verification failed.');
        console.log(`Rejection email dispatched to: ${user.email}`);
      } catch (err) {
        console.error("Rejection email failed", err);
      }
    }

    res.json({ message: `User ${status} successfully.`, user });
  } catch (error) {
    console.error("Admin Approval Crash:", error.message, error.stack);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const pharmaciesCount = await User.countDocuments({ role: 'pharmacy', status: 'approved' });
    const distributorsCount = await User.countDocuments({ role: 'distributor', status: 'approved' });
    const pendingCount = await User.countDocuments({ 
      $or: [{ status: 'pending' }, { status: { $exists: false } }] 
    });
    const totalOrders = await Order.countDocuments({});
    
    // Calculate total volume by aggregating totalAmount from orders
    const volumeData = await Order.aggregate([
      { $group: { _id: null, totalVolume: { $sum: "$totalAmount" } } }
    ]);
    const totalVolume = volumeData.length > 0 ? volumeData[0].totalVolume : 0;

    res.json({
      pharmaciesCount,
      distributorsCount,
      pendingCount,
      totalOrders,
      totalVolume
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'approved', role: { $ne: 'admin' } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User removed from system.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPendingUsers, approveUser, getAdminStats, getAllUsers, deleteUser };
