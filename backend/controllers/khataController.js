const emailService = require('../utils/emailService');
const Customer = require('../models/Customer');
const KhataTransaction = require('../models/KhataTransaction');
const Notification = require('../models/Notification');
const FamilyMember = require('../models/FamilyMember');

// @route   POST /api/khata/add  (Add Credit / Udhaar)
exports.addKhataEntry = async (req, res) => {
  try {
    const { customerName, phone, amount, description, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    let customer;
    if (phone) {
      customer = await Customer.findOne({ phone });
    } else {
      customer = await Customer.findOne({ name: new RegExp('^' + customerName + '$', 'i') });
    }

    if (!customer) {
      // Create new customer
      customer = new Customer({
        name: customerName,
        phone: phone || `TEMP-${Date.now()}`, // fallback if no phone
        totalBalance: 0
      });
      await customer.save();
    }

    // Add previous balance and new amount
    customer.totalBalance += Number(amount);
    customer.pendingKhata = customer.totalBalance; // Sync with dynamic history dashboard

    // Risk Alert logic
    const previousRisk = customer.riskLevel;
    if (customer.totalBalance > 5000) {
      customer.riskLevel = 'high';
    } else if (customer.totalBalance > 2000) {
      customer.riskLevel = 'medium';
    } else {
      customer.riskLevel = 'low';
    }

    if (previousRisk !== 'high' && customer.riskLevel === 'high') {
      await Notification.create({
        title: `High Khata Risk: ${customer.name}`,
        message: `${customer.name} has crossed ₹5000 in pending dues. Please collect payment soon.`,
        type: 'khata',
        priority: 'critical',
        actionLink: 'khata',
        isRead: false
      });
    }

    await customer.save();

    // Create transaction
    const txn = new KhataTransaction({
      customerId: customer._id,
      type: 'credit',
      amount: Number(amount),
      balance: customer.totalBalance,
      description: description || 'Medicine taken on credit',
      createdAt: date ? new Date(date) : new Date()
    });

    await txn.save();

    res.status(201).json({ message: "Khata updated successfully", customer, transaction: txn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/khata/payment (Add Payment to clear due)
exports.addPayment = async (req, res) => {
  try {
    const { customerId, amount, date, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Reduce balance
    customer.totalBalance = Math.max(0, customer.totalBalance - Number(amount));
    customer.pendingKhata = customer.totalBalance; // Sync

    if (customer.totalBalance <= 2000) customer.riskLevel = 'low';

    await customer.save();

    const txn = new KhataTransaction({
      customerId: customer._id,
      type: 'debit', // which means payment received
      amount: Number(amount),
      balance: customer.totalBalance,
      description: description || 'Paid dues',
      createdAt: date ? new Date(date) : new Date()
    });

    await txn.save();

    res.status(200).json({ message: "Payment recorded successfully", customer, transaction: txn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/khata/list (Get notebook list)
exports.getKhataList = async (req, res) => {
  try {
    // Only get customers who have a totalBalance or have transactions
    // Actually get all customers who ever had khata, or just all customers with totalBalance > 0
    // To show "Suresh ₹0 Paid", let's get any customer who has transactions
    const distinctCustomerIds = await KhataTransaction.distinct("customerId");
    const customers = await Customer.find({
      $or: [
        { _id: { $in: distinctCustomerIds } },
        { totalBalance: { $gt: 0 } }
      ]
    }).lean();

    // Fetch latest transaction for each to get "Last Date"
    const result = await Promise.all(customers.map(async (c) => {
      const lastTxn = await KhataTransaction.findOne({ customerId: c._id }).sort({ createdAt: -1 });
      return {
        ...c,
        lastDate: lastTxn ? lastTxn.createdAt : c.updatedAt
      };
    }));

    // Sort by last active date
    result.sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/khata/:id (Get customer ledger detail)
exports.getCustomerKhataDetails = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const transactions = await KhataTransaction.find({ customerId: req.params.id }).sort({ createdAt: 1 }); // Notebook chronological order (oldest first)

    // Calculate Summary Stats logic
    const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalPayment = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

    // Some older schemas had type: 'payment', handle 'debit' or 'payment' if needed
    // The current schema says 'debit'

    const familyMembers = await FamilyMember.find({ customerId: req.params.id });

    res.status(200).json({
      customer,
      transactions,
      familyMembers,
      summary: {
        totalCredit,
        totalPayment,
        pending: customer.totalBalance
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/khata/send-reminder/:id
exports.sendPaymentReminder = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (!customer.email) {
      return res.status(400).json({ message: "Customer does not have an email address associated." });
    }

    if (customer.totalBalance <= 0) {
      return res.status(400).json({ message: "No pending balance for this customer." });
    }

    await emailService.sendPaymentReminder(customer.email, customer.name, customer.totalBalance);
    res.json({ message: `Payment reminder sent to ${customer.email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
