const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27000/pharma_sync');
    console.log('MongoDB Connected to seed transactions...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  try {
    const pharmacy = await User.findOne({ role: 'pharmacy' });
    const products = await Product.find().limit(5);

    if (!pharmacy || products.length === 0) {
      console.log('Pharmacy user or products not found. Run seedProducts first.');
      process.exit(1);
    }

    // Clear old transactions
    await Transaction.deleteMany({ pharmacy: pharmacy._id });

    const transactions = [];
    const today = new Date();
    
    // Generate transactions for the last 10 days
    for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // 3-5 transactions per day
        const dailyCount = Math.floor(Math.random() * 3) + 2;
        
        for (let j = 0; j < dailyCount; j++) {
            const txTime = new Date(date);
            txTime.setHours(Math.floor(Math.random() * 12) + 9); // Between 9 AM and 9 PM
            
            const selectedProduct = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 5) + 1;
            const sellingPrice = selectedProduct.price;
            const costPrice = selectedProduct.costPrice;
            const gst = 5;
            const totalPerItem = sellingPrice * qty * 1.05;

            transactions.push({
                pharmacy: pharmacy._id,
                items: [{
                    product: selectedProduct._id,
                    name: selectedProduct.name,
                    quantity: qty,
                    mrp: sellingPrice,
                    costPrice: costPrice,
                    gst: gst,
                    total: totalPerItem
                }],
                totalAmount: totalPerItem,
                taxAmount: totalPerItem * 0.05,
                paymentType: ['cash', 'upi', 'khata'][Math.floor(Math.random() * 3)],
                invoiceNumber: `INV-${i}${j}${Math.floor(Math.random() * 1000)}`,
                customerName: ['Ravi', 'Suresh', 'Amit', 'Priya', 'Anjali'][Math.floor(Math.random() * 5)],
                createdAt: txTime,
                status: 'completed'
            });
        }
    }

    await Transaction.insertMany(transactions);
    console.log(`${transactions.length} dummy transactions seeded successfully!`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

seed();
