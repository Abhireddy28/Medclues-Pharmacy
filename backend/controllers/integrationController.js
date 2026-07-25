const Hospital = require('../models/Hospital');
const Prescription = require('../models/Prescription');
const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const crypto = require('crypto');

// Helper to verify HMAC or Internal API Key signature
const verifySignature = async (req) => {
  const internalApiKey = req.headers['x-internal-api-key'] || req.headers['x-api-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'd82a9cf038d0f27d90d0601ae5aa3eefd8562b1a7303ba3b2151dc2b13a3b461';

  if (internalApiKey && internalApiKey === expectedKey) {
    let hospital = await Hospital.findOne({ connectionStatus: 'active' });
    if (!hospital) {
      hospital = await Hospital.findOne({});
    }
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'KIMS Hospital In-House Pharmacy',
        code: 'KIMS-001',
        apiKey: expectedKey,
        apiSecret: 'internal_secret',
        connectionStatus: 'active'
      });
    }
    return hospital;
  }

  const hospitalCode = req.headers['x-hospital-code'];
  const apiKey = req.headers['x-api-key'];
  const signature = req.headers['x-signature'];

  if (!hospitalCode || !apiKey || !signature) {
    throw new Error('Authentication headers missing');
  }

  const hospital = await Hospital.findOne({ code: hospitalCode, apiKey, connectionStatus: 'active' });
  if (!hospital) {
    throw new Error('Invalid Hospital credentials or inactive connection');
  }

  // Compute HMAC SHA256 signature
  const bodyString = JSON.stringify(req.body);
  const computedSig = crypto.createHmac('sha256', hospital.apiSecret)
    .update(bodyString)
    .digest('hex');

  if (computedSig !== signature) {
    throw new Error('Signature mismatch');
  }

  return hospital;
};

// Hospital Endpoint: Create Prescription
exports.createHospitalPrescription = async (req, res) => {
  let hospital;
  try {
    hospital = await verifySignature(req);
  } catch (error) {
    await AuditLog.create({
      action: 'medclues_prescription_received',
      endpoint: '/api/integration/medclues/prescription',
      ipAddress: req.ip || 'unknown',
      status: 'failure',
      payloadSummary: { error: error.message, body: req.body }
    });
    return res.status(401).json({ message: error.message });
  }

  try {
    const { externalPrescriptionId, doctorName, doctorSpecialty, patient, medicines, priority, fulfillmentType, deliveryAddress } = req.body;

    // Check duplicate prescription
    const existing = await Prescription.findOne({ hospital: hospital._id, externalPrescriptionId });
    if (existing) {
      return res.status(400).json({ message: 'Prescription already exists' });
    }

    const prescription = await Prescription.create({
      pharmacy: hospital.pharmacyId,
      hospital: hospital._id,
      externalPrescriptionId,
      doctorName,
      doctorSpecialty,
      patient,
      medicines: medicines.map(m => ({
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity,
        instructions: m.instructions,
        verificationStatus: 'pending'
      })),
      priority: priority || 'normal',
      fulfillmentType,
      deliveryAddress: deliveryAddress || '',
      status: 'received'
    });

    // Write audit log
    await AuditLog.create({
      actor: hospital._id,
      actorType: 'hospital',
      actorTypeModel: 'Hospital',
      action: 'medclues_prescription_received',
      endpoint: '/api/integration/medclues/prescription',
      ipAddress: req.ip || 'unknown',
      status: 'success',
      payloadSummary: { prescriptionId: prescription._id, externalPrescriptionId }
    });

    // Trigger Live update via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newPrescription', prescription);
      io.emit('prescriptionQueueUpdate', { time: new Date() });
    }

    res.status(201).json({ message: 'Prescription received successfully', prescriptionId: prescription._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hospital Endpoint: Emergency Request
exports.createEmergencyRequest = async (req, res) => {
  req.body.priority = 'emergency';
  return exports.createHospitalPrescription(req, res);
};

// Hospital Endpoint: Discharge Medicines
exports.createDischargeRequest = async (req, res) => {
  req.body.priority = 'urgent';
  return exports.createHospitalPrescription(req, res);
};

// Patient Endpoint: Retrieve history
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Patient phone number is required' });

    const prescriptions = await Prescription.find({ 'patient.phone': phone })
      .populate('hospital', 'name')
      .populate('branch', 'name phone')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Patient Endpoint: Track active order status
exports.getPatientOrders = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Patient phone number is required' });

    const orders = await Prescription.find({
      'patient.phone': phone,
      status: { $ne: 'delivered' }
    })
      .populate('hospital', 'name')
      .populate('branch', 'name phone')
      .populate('deliveryExecutive', 'name phone');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Patient Endpoint: Fetch invoice bills
exports.getPatientBills = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Patient phone number is required' });

    const customer = await Customer.findOne({ phone });
    if (!customer) return res.json([]);

    const transactions = await Transaction.find({ customer: customer._id })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Patient Endpoint: Delivery Tracking Simulation
exports.getDeliveryTracking = async (req, res) => {
  try {
    const { prescriptionId } = req.query;
    if (!prescriptionId) return res.status(400).json({ message: 'Prescription ID is required' });

    const prescription = await Prescription.findById(prescriptionId)
      .populate('deliveryExecutive', 'name phone');

    if (!prescription) return res.status(404).json({ message: 'Order not found' });

    if (prescription.status !== 'out_for_delivery') {
      return res.json({
        status: prescription.status,
        trackingAvailable: false,
        message: 'Order is not out for delivery yet'
      });
    }

    // Generate mock GPS coordinate details
    // Pharmacy Branch coordinate: lat: 12.9716, lng: 77.5946 (Bangalore Center)
    const mockCoordinates = [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9725, lng: 77.5960 },
      { lat: 12.9738, lng: 77.5985 },
      { lat: 12.9750, lng: 77.6010 }
    ];

    // Pick coordinate based on current seconds to simulate movement
    const index = Math.floor(Date.now() / 15000) % mockCoordinates.length;
    const currentLoc = mockCoordinates[index];

    res.json({
      prescriptionId: prescription._id,
      status: prescription.status,
      deliveryStatus: prescription.deliveryStatus,
      trackingAvailable: true,
      executive: prescription.deliveryExecutive,
      coordinates: currentLoc,
      etaMinutes: Math.max(2, 15 - index * 4),
      destination: prescription.deliveryAddress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Patient Endpoint: Submit recurring refill request
exports.requestRefill = async (req, res) => {
  try {
    const { patientPhone, previousPrescriptionId } = req.body;

    const prevPrescription = await Prescription.findById(previousPrescriptionId);
    if (!prevPrescription) return res.status(404).json({ message: 'Previous prescription not found' });

    // Recreate a new prescription linked to the pharmacy
    const refillOrder = await Prescription.create({
      pharmacy: prevPrescription.pharmacy,
      hospital: prevPrescription.hospital,
      externalPrescriptionId: 'refill_' + Date.now().toString().slice(-4),
      doctorName: prevPrescription.doctorName,
      doctorSpecialty: prevPrescription.doctorSpecialty,
      patient: prevPrescription.patient,
      medicines: prevPrescription.medicines.map(m => ({
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity,
        instructions: m.instructions,
        verificationStatus: 'pending'
      })),
      priority: 'normal',
      fulfillmentType: prevPrescription.fulfillmentType,
      deliveryAddress: prevPrescription.deliveryAddress,
      status: 'received'
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('newPrescription', refillOrder);
      io.emit('prescriptionQueueUpdate', { time: new Date() });
    }

    res.status(201).json({ message: 'Refill request created successfully', prescriptionId: refillOrder._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Catalog Endpoint: Search in nearest branches
exports.searchCatalog = async (req, res) => {
  try {
    const { query } = req.query;
    const filter = (query && query.trim() !== '') ? { name: { $regex: query.trim(), $options: 'i' } } : {};

    const items = await Inventory.find(filter).populate('branchId', 'name address phone');

    const medicines = items.map(item => ({
      id: item._id,
      name: item.name,
      brand: item.brand || 'Pharma',
      category: item.category || 'General',
      price: item.price || item.costPrice || 50.00,
      mrp: Math.round((item.price || item.costPrice || 50.00) * 1.2 * 100) / 100,
      discount: '15% OFF',
      stock: item.stock,
      requiresRx: item.requiresRx || false,
      branch: item.branchId ? item.branchId.name : 'Hospital In-House Pharmacy',
      image: item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'
    }));

    res.json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Catalog Endpoint: Details and alternatives
exports.getCatalogDetails = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: 'Medicine name is required' });

    const exactMatch = await Inventory.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    // Simple fallback alternatives: find medicines starting with same prefix or matching partial name
    const alternatives = await Inventory.find({
      name: { $regex: name.slice(0, 4), $options: 'i' },
      stock: { $gt: 0 }
    }).limit(5);

    res.json({
      exactMatch,
      alternatives: alternatives.filter(a => exactMatch ? a._id.toString() !== exactMatch._id.toString() : true)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
