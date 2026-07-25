const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const Prescription = require('../models/Prescription');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const patientPhone = '9876543210';
    const base = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    console.log(`Simulating Patient Mobile App requests for Phone: ${patientPhone} to: ${base}`);

    // 1. Fetch patient prescriptions
    console.log('\n--- 1. Fetch Patient Prescriptions History ---');
    const historyRes = await axios.get(`${base}/api/integration/patient/prescriptions?phone=${patientPhone}`);
    console.log(`Found ${historyRes.data.length} records. First few:`);
    console.log(historyRes.data.slice(0, 2).map(p => ({
      id: p._id,
      doctor: p.doctorName,
      status: p.status,
      cost: p.estimatedCost
    })));

    // 2. Fetch patient active orders
    console.log('\n--- 2. Fetch Active Orders Tracking ---');
    const ordersRes = await axios.get(`${base}/api/integration/patient/orders?phone=${patientPhone}`);
    console.log(`Found ${ordersRes.data.length} active orders.`);
    console.log(ordersRes.data.map(o => ({
      id: o._id,
      status: o.status,
      fulfillment: o.fulfillmentType
    })));

    // 3. Simulating Refill Request
    const targetPrescription = await Prescription.findOne({ 'patient.phone': patientPhone });
    if (targetPrescription) {
      console.log(`\n--- 3. Refill Request Simulation (Previous ID: ${targetPrescription._id}) ---`);
      const refillRes = await axios.post(`${base}/api/integration/patient/refill-request`, {
        patientPhone,
        previousPrescriptionId: targetPrescription._id
      });
      console.log('Refill Response:', refillRes.data);
    } else {
      console.log('\n--- 3. Refill Request Simulation Skipped (No previous prescription in DB) ---');
    }

    // 4. Fetch delivery tracking coordinates if an active order is out for delivery
    const outForDeliveryOrder = await Prescription.findOne({
      'patient.phone': patientPhone,
      status: 'out_for_delivery'
    });

    if (outForDeliveryOrder) {
      console.log(`\n--- 4. Delivery Tracking GPS Simulation (Order ID: ${outForDeliveryOrder._id}) ---`);
      const trackingRes = await axios.get(`${base}/api/integration/patient/delivery-tracking?prescriptionId=${outForDeliveryOrder._id}`);
      console.log('GPS Tracking Payload:', trackingRes.data);
    } else {
      console.log('\n--- 4. Delivery Tracking GPS Simulation Skipped (No orders in out_for_delivery state) ---');
    }

    console.log('\nPatient Mobile simulation complete.');
    process.exit(0);
  } catch (error) {
    console.error('Patient simulation failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

run();
