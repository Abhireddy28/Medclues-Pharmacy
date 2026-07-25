const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

dotenv.config();

const seedNotifications = async () => {
  try {
    await connectDB();
    
    // Clear existing
    await Notification.deleteMany({});
    
    const sampleNotifications = [
      {
        title: 'Paracetamol Expired',
        message: 'Batch #B123 of Paracetamol 500mg has expired on 2026-03-25. Please remove from shelves.',
        type: 'inventory',
        priority: 'critical',
        isRead: false,
        actionLink: 'inventory'
      },
      {
        title: 'Stock Low: Dolo 650',
        message: 'Only 5 strips left in stock. Reorder soon to avoid stockouts.',
        type: 'inventory',
        priority: 'warning',
        isRead: false,
        actionLink: 'inventory'
      },
      {
        title: 'Khata Overdue: Amit Sharma',
        message: 'Amit Sharma has a pending due of ₹1,450 for over 30 days.',
        type: 'khata',
        priority: 'critical',
        isRead: true,
        actionLink: 'khata'
      },
      {
        title: 'Order Delivered',
        message: 'Your recent order #ORD-1092 has been delivered by MedDistributors.',
        type: 'order',
        priority: 'info',
        isRead: false,
        actionLink: 'order'
      },
      {
        title: 'Expiring Soon: Azithromycin',
        message: '10 strips of Azithromycin will expire in the next 7 days.',
        type: 'inventory',
        priority: 'warning',
        isRead: false,
        actionLink: 'inventory'
      },
      {
        title: 'New Collaboration Request',
        message: 'Distributor "HealthCorp" wants to connect with your pharmacy.',
        type: 'general',
        priority: 'info',
        isRead: false,
        actionLink: 'dashboard'
      }
    ];

    await Notification.insertMany(sampleNotifications);
    console.log('Sample notifications seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
};

seedNotifications();
