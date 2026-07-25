const Hospital = require('../models/Hospital');
const crypto = require('crypto');

exports.createHospital = async (req, res) => {
  try {
    const { name, webhookUrl, permissions } = req.body;
    const pharmacyId = req.user.pharmacyId || req.user._id;

    // Generate unique code
    const code = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + crypto.randomBytes(3).toString('hex');
    
    // Generate secure keys
    const apiKey = 'pk_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = 'sk_' + crypto.randomBytes(32).toString('hex');

    const hospital = await Hospital.create({
      pharmacyId,
      name,
      code,
      apiKey,
      apiSecret,
      webhookUrl,
      permissions: permissions || ['read_prescriptions', 'write_dispense_records'],
      connectionStatus: 'active'
    });

    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHospitals = async (req, res) => {
  try {
    const pharmacyId = req.user.pharmacyId || req.user._id;
    const hospitals = await Hospital.find({ pharmacyId });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital connection not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const { name, webhookUrl, connectionStatus, permissions } = req.body;
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital connection not found' });

    hospital.name = name || hospital.name;
    hospital.webhookUrl = webhookUrl !== undefined ? webhookUrl : hospital.webhookUrl;
    hospital.connectionStatus = connectionStatus || hospital.connectionStatus;
    hospital.permissions = permissions || hospital.permissions;

    const updated = await hospital.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital connection not found' });
    res.json({ message: 'Hospital disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retry failed webhook trigger from queue
exports.retryWebhook = async (req, res) => {
  try {
    const { hospitalId, payloadId } = req.params;
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const item = hospital.retryQueue.id(payloadId);
    if (!item) return res.status(404).json({ message: 'Webhook payload not found in queue' });

    // Mock sending webhook to external url
    console.log(`[Webhook] Simulating retry to: ${hospital.webhookUrl} with action: ${item.payload?.action}`);
    
    // Simulate successful retry
    hospital.retryQueue.pull(payloadId);
    await hospital.save();

    res.json({ message: 'Webhook resent successfully and cleared from queue' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get webhook delivery or sync error logs
exports.getErrorLogs = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital.errorLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
