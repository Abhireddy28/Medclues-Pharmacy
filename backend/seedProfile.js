const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const PharmacyProfile = require('./models/PharmacyProfile');
const Distributor = require('./models/Distributor');

dotenv.config();

console.log("Connecting to MONGODB: ", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to MongoDB for Seeding Profile Data...");
    
    // Find a pharmacy user
    let pharmacyUser = await User.findOne({ role: 'pharmacy' });
    if (!pharmacyUser) {
        console.log("No pharmacy user found. Skipping profile seeding.");
        process.exit();
    }

    // Create a distributor
    let dist = await Distributor.findOne({ phone: "9876543210" });
    if (!dist) {
      dist = await Distributor.create({
          name: "Global Health Distributors",
          phone: "9876543210",
          location: "Mumbai, Maharashtra"
      });
      console.log("Distributor Created:", dist.name);
    }

    // Create Profile
    let profile = await PharmacyProfile.findOne({ userId: pharmacyUser._id });
    if (!profile) {
      profile = await PharmacyProfile.create({
          userId: pharmacyUser._id,
          pharmacyName: pharmacyUser.shopName || "CarePoint Pharmacy",
          address: pharmacyUser.address || "123 Health Ave, Bangalore",
          gstNumber: "29ABCDE1234F1Z5",
          licenseNumber: "KA-BLR-12345",
          openingTime: "08:00",
          closingTime: "22:00",
          distributorId: dist._id
      });
      console.log("Pharmacy Profile Created for:", profile.pharmacyName);
    } else {
      console.log("Pharmacy Profile already exists.");
    }

    console.log("Seeding Complete.");
    process.exit();
}).catch(err => {
    console.log("Error:", err);
    process.exit(1);
});
