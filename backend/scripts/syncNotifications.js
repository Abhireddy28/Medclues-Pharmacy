const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/Notification');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const connectDB = require('../config/db');

dotenv.config();

const syncRealNotifications = async () => {
  try {
    await connectDB();
    
    // 1. Clear existing generic static data
    await Notification.deleteMany({});
    
    let notificationsToInsert = [];

    // 2. Fetch Low Stock & Expiring Inventory
    const inventory = await Inventory.find({});
    
    for (let item of inventory) {
      if (item.stock <= 10) {
        notificationsToInsert.push({
          title: `Stock Low: ${item.name}`,
          message: `Only ${item.stock} unit(s) left. Please reorder to avoid stockouts.`,
          type: 'inventory',
          priority: 'warning',
          actionLink: 'inventory',
          isRead: false
        });
      }

      if (item.expiryDate) {
        const today = new Date();
        const expiry = new Date(item.expiryDate);
        const timeDiff = expiry.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) {
          notificationsToInsert.push({
            title: `Expired: ${item.name}`,
            message: `Batch expired ${Math.abs(daysDiff)} days ago! Please remove from shelf.`,
            type: 'inventory',
            priority: 'critical',
            actionLink: 'inventory',
            isRead: false
          });
        } else if (daysDiff <= 30) {
          notificationsToInsert.push({
            title: `Expiring Soon: ${item.name}`,
            message: `This item will expire in ${daysDiff} days.`,
            type: 'inventory',
            priority: 'warning',
            actionLink: 'inventory',
            isRead: false
          });
        }
      }
    }

    // 3. Fetch High Risk Khata Customers
    const customers = await Customer.find({ totalBalance: { $gt: 5000 } });
    for (let customer of customers) {
      notificationsToInsert.push({
        title: `Khata Overdue: ${customer.name}`,
        message: `${customer.name} has a high pending amount of ₹${customer.totalBalance}. Please collect payment.`,
        type: 'khata',
        priority: 'critical',
        actionLink: 'khata',
        isRead: false
      });
    }

    // Insert everything
    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
      console.log(`✅ successfully seeded ${notificationsToInsert.length} REAL dynamic notifications!`);
    } else {
      console.log('✅ Checked everything. No critical alerts found based on real data.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error syncing notifications:', error);
    process.exit(1);
  }
};

syncRealNotifications();
