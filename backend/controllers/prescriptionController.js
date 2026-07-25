const Prescription = require('../models/Prescription');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

const axios = require('axios');

// Helper to push status updates to MedClues Core backend
const notifyMedCluesCore = async (prescription) => {
  try {
    const medcluesUrl = process.env.MEDCLUES_CORE_URL || 'http://localhost:5000';
    const apiKey = process.env.INTERNAL_API_KEY || 'd82a9cf038d0f27d90d0601ae5aa3eefd8562b1a7303ba3b2151dc2b13a3b461';
    await axios.post(`${medcluesUrl}/api/partner/webhook/pharmacy-status`, {
      prescriptionId: prescription._id,
      externalPrescriptionId: prescription.externalPrescriptionId,
      status: prescription.status,
      deliveryStatus: prescription.deliveryStatus,
      fulfillmentType: prescription.fulfillmentType,
      patientPhone: prescription.patient?.phone
    }, {
      headers: {
        'x-internal-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 3000
    });
  } catch (err) {
    console.log('[Webhook Notify] MedClues core notify quiet error:', err.message);
  }
};

// Helper to broadcast Socket.io dashboard updates & push webhook
const triggerDashboardUpdate = (req, prescription) => {
  const broadcastUpdate = req.app.get('broadcastDashboardUpdate');
  if (typeof broadcastUpdate === 'function') {
    broadcastUpdate();
  }
  
  // Real-time live status updates stream
  const io = req.app.get('socketio');
  if (io) {
    io.emit('prescriptionQueueUpdate', { time: new Date() });
  }

  if (prescription) {
    notifyMedCluesCore(prescription);
  }
};

exports.getPrescriptions = async (req, res) => {
  try {
    const pharmacyId = req.user.pharmacyId || req.user._id;
    let query = { pharmacy: pharmacyId };

    // Scoping for branch managers or pharmacists
    if (req.user.role === 'branch_manager' || req.user.role === 'pharmacist') {
      if (req.user.branchId) {
        query.branch = req.user.branchId;
      }
    } else if (req.query.branchId) {
      query.branch = req.query.branchId;
    }

    // Filter by status if requested
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Scoping for delivery executives
    if (req.user.role === 'delivery_executive') {
      query.deliveryExecutive = req.user._id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('branch', 'name address')
      .populate('hospital', 'name code')
      .populate('deliveryExecutive', 'name phone')
      .populate('medicines.verifiedProduct', 'name price stock batchNumber barcode')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('branch', 'name address')
      .populate('hospital', 'name code')
      .populate('deliveryExecutive', 'name phone')
      .populate('medicines.verifiedProduct', 'name price stock batchNumber barcode');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId, medicines } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    prescription.branch = branchId;
    
    let totalCost = 0;
    
    // Allocate stock reservations
    for (let medUpdate of medicines) {
      const match = prescription.medicines.id(medUpdate._id);
      if (match) {
        match.verificationStatus = medUpdate.verificationStatus;
        match.verifiedProduct = medUpdate.verifiedProduct;

        // If available, reserve inventory stock
        if ((medUpdate.verificationStatus === 'available' || medUpdate.verificationStatus === 'alternative') && medUpdate.verifiedProduct) {
          const invItem = await Inventory.findById(medUpdate.verifiedProduct);
          if (invItem) {
            // Transfer from stock to reservedStock
            const reserveQty = match.quantity;
            if (invItem.stock >= reserveQty) {
              invItem.stock -= reserveQty;
              invItem.reservedStock += reserveQty;
              await invItem.save();
              
              totalCost += (invItem.price || invItem.costPrice || 0) * reserveQty;
            } else {
              match.verificationStatus = 'partial';
              // Reserve whatever is left
              const available = invItem.stock;
              invItem.stock = 0;
              invItem.reservedStock += available;
              await invItem.save();
              
              totalCost += (invItem.price || invItem.costPrice || 0) * available;
            }
          }
        }
      }
    }

    prescription.estimatedCost = totalCost;
    prescription.status = 'verified';
    await prescription.save();

    triggerDashboardUpdate(req, prescription);
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.packPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { barcodeVerified, expiryVerified, packingNotes } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    prescription.packingLog = {
      packedBy: req.user._id,
      barcodeVerified: !!barcodeVerified,
      expiryVerified: !!expiryVerified,
      packingNotes: packingNotes || ''
    };
    prescription.status = 'packed';
    await prescription.save();

    triggerDashboardUpdate(req, prescription);
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dispatchPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryExecutiveId, fulfillmentType } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    prescription.otp = otp;
    prescription.otpExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours
    prescription.fulfillmentType = fulfillmentType;

    if (fulfillmentType === 'delivery') {
      prescription.deliveryExecutive = deliveryExecutiveId;
      prescription.deliveryStatus = 'assigned';
      prescription.status = 'out_for_delivery';
    } else {
      prescription.status = 'ready_for_pickup';
    }

    await prescription.save();
    triggerDashboardUpdate(req, prescription);
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal utility to complete checkout and create POS Transaction
const completeFulfillmentInvoice = async (prescription, paymentType) => {
  // Find or create customer
  let customer = await Customer.findOne({ phone: prescription.patient.phone });
  if (!customer) {
    customer = await Customer.create({
      name: prescription.patient.name,
      phone: prescription.patient.phone,
      email: prescription.patient.email || '',
      customerTag: 'New'
    });
  } else {
    customer.totalVisits += 1;
    customer.totalSpent += prescription.estimatedCost;
    customer.lastVisit = new Date();
    await customer.save();
  }

  // Deduct reserved stock from inventory permanently
  const itemsList = [];
  for (let med of prescription.medicines) {
    if (med.verifiedProduct && (med.verificationStatus === 'available' || med.verificationStatus === 'alternative')) {
      const invItem = await Inventory.findById(med.verifiedProduct);
      if (invItem) {
        invItem.reservedStock = Math.max(0, invItem.reservedStock - med.quantity);
        await invItem.save();

        itemsList.push({
          product: invItem.productId || null,
          name: invItem.name,
          quantity: med.quantity,
          mrp: invItem.price || invItem.costPrice,
          costPrice: invItem.costPrice,
          gst: 18, // 18% default GST
          total: (invItem.price || invItem.costPrice) * med.quantity
        });
      }
    }
  }

  // Generate unique invoice number
  const invoiceNumber = 'INV-HOS-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

  const transaction = await Transaction.create({
    pharmacy: prescription.pharmacy,
    customer: customer._id,
    customerName: prescription.patient.name,
    items: itemsList,
    totalAmount: prescription.estimatedCost,
    taxAmount: prescription.estimatedCost * 0.18, // Simulated 18% tax
    paymentType: paymentType,
    status: 'completed',
    invoiceNumber: invoiceNumber
  });

  return transaction;
};

exports.completePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    if (prescription.status !== 'ready_for_pickup') {
      return res.status(400).json({ message: 'Prescription is not ready for pickup' });
    }

    if (prescription.otp !== otp || new Date() > prescription.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    prescription.status = 'delivered';
    prescription.otp = undefined;
    prescription.otpExpires = undefined;
    await prescription.save();

    // Create POS Transaction
    await completeFulfillmentInvoice(prescription, 'cash');

    triggerDashboardUpdate(req, prescription);
    res.json({ message: 'Pickup completed and invoiced successfully', prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, digitalSignature, deliveryProof } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    if (prescription.status !== 'out_for_delivery') {
      return res.status(400).json({ message: 'Prescription is not out for delivery' });
    }

    if (prescription.otp !== otp || new Date() > prescription.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    prescription.status = 'delivered';
    prescription.deliveryStatus = 'delivered';
    prescription.digitalSignature = digitalSignature || '';
    prescription.deliveryProof = deliveryProof || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'; // Mock delivery proof url
    prescription.otp = undefined;
    prescription.otpExpires = undefined;
    await prescription.save();

    // Create POS Transaction
    await completeFulfillmentInvoice(prescription, 'upi');

    triggerDashboardUpdate(req, prescription);
    res.json({ message: 'Delivery completed and invoiced successfully', prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRiderLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    prescription.riderLatitude = latitude;
    prescription.riderLongitude = longitude;
    await prescription.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('riderLocationUpdate', {
        prescriptionId: id,
        latitude,
        longitude,
        speed: speed || 0
      });
    }

    notifyMedCluesCore(prescription);
    res.json({ success: true, message: 'Rider GPS updated', latitude, longitude });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
