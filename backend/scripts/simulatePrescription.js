const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Inventory = require('../models/Inventory');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // 1. Get parent pharmacy
    const pharmacy = await User.findOne({ role: 'pharmacy' });
    if (!pharmacy) {
      console.error('No pharmacy user found. Run migration/seed first.');
      process.exit(1);
    }

    // 2. Find or create a hospital connection
    let hospital = await Hospital.findOne({ pharmacyId: pharmacy._id });
    if (!hospital) {
      const code = 'st_john_hospital';
      const apiKey = 'pk_test_' + crypto.randomBytes(8).toString('hex');
      const apiSecret = 'sk_test_' + crypto.randomBytes(16).toString('hex');
      
      hospital = await Hospital.create({
        pharmacyId: pharmacy._id,
        name: 'St. John General Hospital',
        code,
        apiKey,
        apiSecret,
        webhookUrl: 'http://127.0.0.1:5000/api/webhook/test',
        permissions: ['read_prescriptions', 'write_dispense_records'],
        connectionStatus: 'active'
      });
      console.log('Created Mock Hospital:', hospital.name);
    } else {
      console.log('Using Existing Hospital:', hospital.name);
    }

    // 3. Find some inventory item names to build a prescription that can be verified
    const invItems = await Inventory.find({ stock: { $gt: 5 } }).limit(2);
    let medList = [];
    if (invItems.length > 0) {
      medList = invItems.map(item => ({
        name: item.name,
        dosage: '1-0-1',
        quantity: 5,
        instructions: 'After meals'
      }));
    } else {
      // fallback
      medList = [
        { name: 'Dolo 650', dosage: '1-0-1', quantity: 10, instructions: 'After meals' },
        { name: 'Amoxicillin 500mg', dosage: '1-1-1', quantity: 15, instructions: 'Empty stomach' }
      ];
    }

    // Create unique mock prescription
    const prescriptionBody = {
      externalPrescriptionId: 'pres_' + Math.floor(100000 + Math.random() * 900000),
      doctorName: 'Dr. Jane Smith',
      doctorSpecialty: 'Internal Medicine',
      patient: {
        name: 'Rohan Sharma',
        phone: '9876543210',
        email: 'rohan.sharma@example.com',
        gender: 'Male',
        age: 34
      },
      medicines: medList,
      priority: 'normal',
      fulfillmentType: Math.random() > 0.5 ? 'delivery' : 'pickup',
      deliveryAddress: 'Apt 405, Sector 4, Bangalore'
    };

    // 4. Sign request
    const bodyStr = JSON.stringify(prescriptionBody);
    const signature = crypto.createHmac('sha256', hospital.apiSecret)
      .update(bodyStr)
      .digest('hex');

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    console.log(`Sending signed prescription payload to API Integration endpoint (${backendUrl})...`);
    const response = await axios.post(`${backendUrl}/api/integration/medclues/prescription`, prescriptionBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-hospital-code': hospital.code,
        'x-api-key': hospital.apiKey,
        'x-signature': signature
      }
    });

    console.log('API Response:', response.data);
    process.exit(0);
  } catch (error) {
    console.error('Simulation run failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

run();
