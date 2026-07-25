const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const emailService = require('../utils/emailService');

exports.createTransaction = async (req, res) => {
  try {
    const {
      customer, // might be null
      items,
      totalAmount,
      taxAmount,
      paymentType,
      invoiceNumber,
      customerName,
      customerPhone
    } = req.body;

    const pharmacy = req.user._id || req.user.id;
    console.log(`[Transaction] Processing for Pharmacy: ${pharmacy}, Raw Payment: ${paymentType}`);
    const normalizedPaymentType = paymentType ? paymentType.toString().toLowerCase() : 'cash';

    let customerId = customer;
    let foundCustomer = null;
    
    // Auto Customer Creation / Linking engine
    if (customerName && customerName !== 'Walk-in Customer') {
      let custParams = { name: customerName };
      if (customerPhone) custParams.phone = customerPhone;

      foundCustomer = await Customer.findOne(custParams);
      if (!foundCustomer) {
         foundCustomer = new Customer({
           name: customerName,
           phone: customerPhone || 'Not Provided'
         });
      }
      
      // Update LIVE Data Metrics
      foundCustomer.totalVisits = (foundCustomer.totalVisits || 0) + 1;
      foundCustomer.totalSpent = (foundCustomer.totalSpent || 0) + Number(totalAmount);
      foundCustomer.lastVisit = new Date();
      
      // Smart Auto-Tagging
      if (foundCustomer.totalSpent >= 5000) {
         foundCustomer.customerTag = 'High Value';
      }
      
      await foundCustomer.save();
      customerId = foundCustomer._id;
    }

    // 1. Create transaction record
    const newTransaction = new Transaction({
      pharmacy,
      customer: customerId,
      items,
      totalAmount,
      taxAmount,
      paymentType: normalizedPaymentType,
      invoiceNumber,
      customerName, 
      status: 'completed'
    });

    await newTransaction.save();

    // 2. Send Invoice Email if customer has an email
    if (foundCustomer && foundCustomer.email) {
      try {
        await emailService.sendInvoice(foundCustomer.email, foundCustomer.name, items, totalAmount);
        console.log(`Digital invoice sent to: ${foundCustomer.email}`);
      } catch (err) {
        console.error("Failed to send digital invoice email", err);
      }
    }

    // Trigger Live Socket Dashboard update
    const broadcastUpdate = req.app.get('broadcastDashboardUpdate');
    if (typeof broadcastUpdate === 'function') {
      broadcastUpdate();
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Save Transaction Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactionsByPharmacy = async (req, res) => {
  try {
    const transactions = await Transaction.find({ pharmacy: req.params.pharmacyId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
