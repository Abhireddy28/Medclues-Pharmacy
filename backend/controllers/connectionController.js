const Connection = require('../models/Connection');
const User = require('../models/User');

// Pharmacy: Request connection with a Distributor
exports.requestConnection = async (req, res) => {
  try {
    const { distributorId } = req.body;
    const pharmacyId = req.user.id; // From auth middleware

    const existing = await Connection.findOne({ pharmacy: pharmacyId, distributor: distributorId });
    if (existing) return res.status(400).json({ message: 'Connection already exists or is pending' });

    const connection = new Connection({
      pharmacy: pharmacyId,
      distributor: distributorId,
      status: 'pending'
    });

    await connection.save();
    res.status(201).json({ message: 'Connection request sent', connection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Distributor: Respond to connection request
exports.respondToConnection = async (req, res) => {
  try {
    const { connectionId, status } = req.body; // 'active' or 'rejected'
    const distributorId = req.user.id;

    const connection = await Connection.findOne({ _id: connectionId, distributor: distributorId });
    if (!connection) return res.status(404).json({ message: 'Connection request not found' });

    connection.status = status;
    if (status === 'active') connection.connectionDate = new Date();
    
    await connection.save();
    res.json({ message: `Connection ${status}`, connection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List connections
exports.getConnections = async (req, res) => {
  try {
    const query = req.user.role === 'pharmacy' ? { pharmacy: req.user.id } : { distributor: req.user.id };
    const connections = await Connection.find(query)
      .populate('pharmacy', 'name email shopName phone')
      .populate('distributor', 'name email shopName phone address');
    res.json(connections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pharmacy: Find New Distributors to connect with
exports.discoverDistributors = async (req, res) => {
  try {
    const pharmaciesConnections = await Connection.find({ pharmacy: req.user.id }).select('distributor');
    const connectedDistIds = pharmaciesConnections.map(c => c.distributor.toString());

    // Find distributors NOT already connected/pending
    const distributors = await User.find({ 
      role: 'distributor', 
      _id: { $nin: connectedDistIds }
    }).select('name shopName address phone');
    
    res.json(distributors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
