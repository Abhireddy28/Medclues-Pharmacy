const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Inventory = require('../models/Inventory');

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // 1. Find the first pharmacy user
    const pharmacy = await User.findOne({ role: 'pharmacy' });
    if (!pharmacy) {
      console.log('No pharmacy user found. Seed the profile first.');
      process.exit(1);
    }
    console.log(`Using Pharmacy: ${pharmacy.name} (${pharmacy.email}) as Parent Corp`);

    // 2. Create or find a default branch
    let branch = await Branch.findOne({ pharmacyId: pharmacy._id });
    if (!branch) {
      branch = await Branch.create({
        pharmacyId: pharmacy._id,
        name: 'Main Pharmacy Branch 1',
        address: pharmacy.address || '123 Main St, Bangalore',
        phone: pharmacy.phone || '9999999999',
        status: 'active'
      });
      console.log(`Created Default Branch: ${branch.name}`);
    } else {
      console.log(`Found Existing Branch: ${branch.name}`);
    }

    // 3. Update all existing user records
    const updatedUsers = await User.updateMany(
      { role: { $in: ['pharmacy', 'pharmacist', 'branch_manager', 'delivery_executive'] }, pharmacyId: null },
      { $set: { pharmacyId: pharmacy._id } }
    );
    console.log(`Updated ${updatedUsers.modifiedCount} Users with pharmacyId`);

    // Also update pharmacy user itself to have branchId for test
    await User.findByIdAndUpdate(pharmacy._id, { branchId: branch._id });

    // 4. Update all existing inventory records
    const updatedInventory = await Inventory.updateMany(
      { pharmacyId: null },
      { $set: { pharmacyId: pharmacy._id, branchId: branch._id } }
    );
    console.log(`Updated ${updatedInventory.modifiedCount} Inventory items with pharmacyId and branchId`);

    console.log('Multi-branch migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
