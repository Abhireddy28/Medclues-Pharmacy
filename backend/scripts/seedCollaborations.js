const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

dotenv.config({ path: '../.env' });

const seedCollaborations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    // Get a distributor
    const distributor = await User.findOne({ role: 'distributor' });
    if (!distributor) {
      console.log('No distributor found. Please create one first.');
      process.exit();
    }

    // Create 3 dummy pharmacies if they don't exist
    const pharmaciesRaw = [
      { name: 'Ravi Kumar', shopName: 'ABC Pharmacy', email: 'ravi@abc.com', password: 'password', role: 'pharmacy', phone: '9876543210', address: 'Guntur' },
      { name: 'Srinivas', shopName: 'MedPlus', email: 'sri@medplus.com', password: 'password', role: 'pharmacy', phone: '9876543211', address: 'Vijayawada' },
      { name: 'Ramana', shopName: 'Apollo Pharmacy', email: 'ram@apollo.com', password: 'password', role: 'pharmacy', phone: '9876543212', address: 'Hyderabad' }
    ];

    const pharmacies = [];
    for (const p of pharmaciesRaw) {
      let ph = await User.findOne({ email: p.email });
      if (!ph) {
         ph = await User.create(p);
      }
      pharmacies.push(ph);
    }
    
    // Clear old sample orders for these pharmacies and the distributor
    await Order.deleteMany({ distributor: distributor._id, pharmacy: { $in: pharmacies.map(p => p._id) } });
    await Payment.deleteMany({ distributorId: distributor._id, pharmacyId: { $in: pharmacies.map(p => p._id) } });

    // Create dummy orders
    for (const ph of pharmacies) {
       // Create 5 orders for each
       for (let i = 0; i < 5; i++) {
         const amount = Math.floor(Math.random() * 5000) + 1000;
         await Order.create({
            pharmacy: ph._id,
            distributor: distributor._id,
            items: [],
            totalAmount: amount,
            status: i % 2 === 0 ? 'delivered' : 'pending',
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
         });
         
         // Create dummy payments
         if (i % 2 === 0) {
            await Payment.create({
              pharmacyId: ph._id,
              distributorId: distributor._id,
              amount: amount - 500, // Partial payment
              status: Math.random() > 0.5 ? 'Paid' : 'Pending',
              date: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
            });
         }
       }
    }

    console.log('Sample data seeded successfully.');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedCollaborations();
