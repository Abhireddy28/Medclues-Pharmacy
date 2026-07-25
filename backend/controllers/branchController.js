const Branch = require('../models/Branch');
const User = require('../models/User');

exports.createBranch = async (req, res) => {
  try {
    const { name, address, phone, managerEmail } = req.body;
    let pharmacyId = req.user._id;

    if (req.user.role === 'admin' && req.body.pharmacyId) {
      pharmacyId = req.body.pharmacyId;
    }

    let managerId = null;
    if (managerEmail) {
      const managerUser = await User.findOne({ email: managerEmail });
      if (managerUser) {
        managerId = managerUser._id;
      }
    }

    const branch = await Branch.create({
      pharmacyId,
      name,
      address,
      phone,
      manager: managerId,
      status: 'active'
    });

    if (managerId) {
      await User.findByIdAndUpdate(managerId, { branchId: branch._id, pharmacyId });
    }

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBranches = async (req, res) => {
  try {
    let pharmacyId = req.user.pharmacyId || req.user._id;
    const branches = await Branch.find({ pharmacyId }).populate('manager', 'name email role');
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager', 'name email role');
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { name, address, phone, managerEmail, status } = req.body;
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    branch.name = name || branch.name;
    branch.address = address || branch.address;
    branch.phone = phone || branch.phone;
    branch.status = status || branch.status;

    if (managerEmail) {
      const managerUser = await User.findOne({ email: managerEmail });
      if (managerUser) {
        branch.manager = managerUser._id;
        await User.findByIdAndUpdate(managerUser._id, { 
          branchId: branch._id, 
          pharmacyId: branch.pharmacyId 
        });
      }
    }

    const updatedBranch = await branch.save();
    res.json(updatedBranch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    await User.updateMany({ branchId: branch._id }, { branchId: null });
    await Branch.findByIdAndDelete(req.params.id);

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Custom API to create staff directly under branch context
exports.createBranchStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const branchId = req.params.branchId;
    const pharmacyId = req.user.pharmacyId || req.user._id;

    if (!['branch_manager', 'pharmacist', 'delivery_executive'].includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name,
      email,
      password,
      role,
      status: 'approved',
      branchId,
      pharmacyId
    });

    if (role === 'branch_manager') {
      await Branch.findByIdAndUpdate(branchId, { manager: user._id });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBranchStaff = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const staff = await User.find({ branchId }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
