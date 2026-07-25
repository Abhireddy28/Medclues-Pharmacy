const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');

dotenv.config();

const products = [
  { name: 'Paracetamol 500mg', composition: 'Paracetamol', price: 45, costPrice: 30, stock: 500, expiryDate: '2025-12-31', category: 'Tablet', barcode: '12345678' },
  { name: 'Amoxicillin 250mg', composition: 'Amoxicillin', price: 120, costPrice: 90, stock: 200, expiryDate: '2025-10-15', category: 'Capsule', barcode: '87654321' },
  { name: 'Azithromycin 500mg', composition: 'Azithromycin', price: 95, costPrice: 70, stock: 150, expiryDate: '2026-06-20', category: 'Tablet', barcode: '11223344' },
  { name: 'Pan 40', composition: 'Pantoprazole', price: 150, costPrice: 110, stock: 300, expiryDate: '2025-09-10', category: 'Tablet', barcode: '44332211' },
  { name: 'GALPHARM PARACETAMOL 500MG CAPLETS', composition: 'Paracetamol', price: 50, costPrice: 35, stock: 100, expiryDate: '2026-12-31', category: 'Tablet', barcode: '5017353500809' },
  { name: 'Paracetamol-ratiopharm 500 mg', composition: 'Paracetamol', price: 65, costPrice: 45, stock: 100, expiryDate: '2026-10-15', category: 'Tablet', barcode: '1126111' },
  { name: 'Benadryl', composition: 'Diphenhydramine', price: 85, costPrice: 60, stock: 100, expiryDate: '2025-08-05', category: 'Syrup', barcode: '55667788' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const distributor = await User.findOne({ role: 'distributor' });
    if (!distributor) {
      console.log('No distributor found. Please sign up as a distributor first.');
      process.exit(1);
    }

    const productsWithDistributor = products.map(p => ({ ...p, distributor: distributor._id }));

    await Product.deleteMany({});
    await Product.insertMany(productsWithDistributor);

    console.log('Successfully seeded products!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
