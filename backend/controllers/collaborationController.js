const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

exports.getCollaborations = async (req, res) => {
  try {
    const { distributorId } = req.query;

    // Get all pharmacies. For a real app, only those with orders from this distributor.
    // We will do that: find distinct pharmacy IDs from Orders
    let query = { role: 'pharmacy' };
    
    const pharmacies = await User.find(query);

    const results = await Promise.all(pharmacies.map(async (pharmacy) => {
      // Get orders for this distributor and pharmacy
      const orderQuery = { pharmacy: pharmacy._id };
      if (distributorId) orderQuery.distributor = distributorId;

      const orders = await Order.find(orderQuery);
      
      const paymentQuery = { pharmacyId: pharmacy._id };
      if (distributorId) paymentQuery.distributorId = distributorId;
      
      const payments = await Payment.find(paymentQuery);

      const totalOrders = orders.length;
      const totalBusinessAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
      const pendingPayment = totalBusinessAmount - totalPaid;

      // Status logic
      const lastOrderDate = orders.length > 0 ? new Date(Math.max(...orders.map(o => new Date(o.createdAt)))) : null;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let status = 'Inactive';
      if (lastOrderDate && lastOrderDate > thirtyDaysAgo) {
        status = 'Active';
      }

      return {
        _id: pharmacy._id,
        pharmacyName: pharmacy.shopName || pharmacy.name,
        ownerName: pharmacy.name,
        phone: pharmacy.phone || 'N/A',
        location: pharmacy.address || 'Unknown',
        totalOrders,
        totalBusinessAmount,
        pendingPayment: pendingPayment > 0 ? pendingPayment : 0,
        status,
        lastOrderDate
      };
    }));

    // Filter out pharmacies that have no collaboration (0 orders) with this distributor
    const activeCollaborations = results.filter(r => r.totalOrders > 0 || r.totalBusinessAmount > 0);

    res.json(activeCollaborations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPharmacyDetails = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { distributorId } = req.query;

    const pharmacy = await User.findById(pharmacyId);
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

    const orderQuery = { pharmacy: pharmacyId };
    if (distributorId) orderQuery.distributor = distributorId;
    const orders = await Order.find(orderQuery);

    const paymentQuery = { pharmacyId };
    if (distributorId) paymentQuery.distributorId = distributorId;
    const payments = await Payment.find(paymentQuery);

    const totalOrders = orders.length;
    const totalBusinessAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingPayment = totalBusinessAmount - totalPaid;

    res.json({
      _id: pharmacy._id,
      pharmacyName: pharmacy.shopName || pharmacy.name,
      ownerName: pharmacy.name,
      phone: pharmacy.phone || 'N/A',
      location: pharmacy.address || 'Unknown',
      joinedDate: pharmacy.createdAt,
      totalOrders,
      totalBusinessAmount,
      totalPaid,
      pendingPayment: pendingPayment > 0 ? pendingPayment : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPharmacyOrders = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { distributorId } = req.query;
    
    const orderQuery = { pharmacy: pharmacyId };
    if (distributorId) orderQuery.distributor = distributorId;

    const orders = await Order.find(orderQuery).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPharmacyPayments = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { distributorId } = req.query;

    const paymentQuery = { pharmacyId };
    if (distributorId) paymentQuery.distributorId = distributorId;
    
    const payments = await Payment.find(paymentQuery).sort({ date: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
