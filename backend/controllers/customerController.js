const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const KhataTransaction = require('../models/KhataTransaction');
const FamilyMember = require('../models/FamilyMember');

// GET /api/customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { search, filter } = req.query;

    let query = {};
    
    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filters
    if (filter && filter !== 'All') {
      if (filter === 'Pending Khata') {
        query.pendingKhata = { $gt: 0 };
      } else if (filter === 'High Risk Customers') {
        query.riskLevel = 'high';
      } else if (filter === 'High Value Customers') {
        query.customerTag = 'High Value';
      } else if (filter === 'Regular Customers') {
        query.isRegular = true; // or based on customerTag and totalVisits
      }
    }

    const customers = await Customer.find(query).sort({ lastVisit: -1 });

    // Calculate Summary Stats
    const totalCustomers = await Customer.countDocuments();
    // Assuming active are those who visited in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeCustomers = await Customer.countDocuments({ lastVisit: { $gte: thirtyDaysAgo } });
    const highValueCustomers = await Customer.countDocuments({ customerTag: 'High Value' });
    const pendingKhataCustomers = await Customer.countDocuments({ pendingKhata: { $gt: 0 } });

    res.status(200).json({
      customers,
      summary: {
        totalCustomers,
        activeCustomers,
        highValueCustomers,
        pendingKhataCustomers
      }
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/customers/:id/purchases
exports.getCustomerPurchases = async (req, res) => {
  try {
    const purchases = await Transaction.find({ customer: req.params.id })
      .sort({ createdAt: -1 });

    // Also calculate smart insights here or dynamically on frontend.
    // Let's do a simple freq tracker 
    const freqMap = {};
    purchases.forEach(txn => {
        txn.items.forEach(item => {
            freqMap[item.name] = (freqMap[item.name] || 0) + item.quantity;
        });
    });
    
    const sortedFreq = Object.entries(freqMap)
       .map(([name, count]) => ({ name, count }))
       .sort((a, b) => b.count - a.count);

    res.status(200).json({
      purchases,
      frequentMedicines: sortedFreq.slice(0, 5) // top 5
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/customers/:id/khata
exports.getCustomerKhata = async (req, res) => {
  try {
    const khataRecords = await KhataTransaction.find({ customerId: req.params.id })
      .sort({ createdAt: -1 });
    res.status(200).json(khataRecords);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/customers/:id/history (Combined)
exports.getCombinedHistory = async (req, res) => {
  try {
    // Combine both transactions and khata
    const [purchases, khata] = await Promise.all([
      Transaction.find({ customer: req.params.id }).lean(),
      KhataTransaction.find({ customerId: req.params.id }).lean()
    ]);

    const combined = [];
    
    purchases.forEach(p => {
       combined.push({
          type: p.paymentType === 'khata' ? 'Credit Bill' : 'Bill',
          date: p.createdAt,
          amount: p.totalAmount,
          medicines: p.items.map(i => i.name).join(', '),
          paymentMode: p.paymentType,
          originalRecord: p
       });
    });

    khata.forEach(k => {
        // If it's pure khata payment
        if (k.type === 'debit') {
           combined.push({
              type: 'Payment',
              date: k.createdAt,
              amount: k.amount,
              medicines: 'Clearing dues',
              paymentMode: 'Cash/UPI', // Usually cash
              originalRecord: k
           });
        }
    });

    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(combined);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/customers/:id/family
exports.getFamilyMembers = async (req, res) => {
  try {
    const members = await FamilyMember.find({ customerId: req.params.id });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/customers/:id/family
exports.addFamilyMember = async (req, res) => {
  try {
    const { memberName, relation, age, notes } = req.body;
    const customerId = req.params.id;

    if (!memberName || !relation) {
       return res.status(400).json({ message: "Name and relation are required" });
    }

    const newMember = new FamilyMember({
       customerId,
       memberName,
       relation,
       age,
       notes
    });

    await newMember.save();
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/customers/:id/payment (Khata Payment triggers updates)
exports.addCustomerPayment = async (req, res) => {
  try {
    const { amount, paymentMode, description } = req.body;
    const customerId = req.params.id;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Not found" });

    // Deduct
    customer.pendingKhata = Math.max(0, (customer.pendingKhata || 0) - Number(amount));
    customer.totalBalance = customer.pendingKhata; // sync

    if (customer.pendingKhata <= 2000) customer.riskLevel = 'low';

    await customer.save();

    const txn = new KhataTransaction({
      customerId: customer._id,
      type: 'debit', // Payment reducing due
      amount: Number(amount),
      balance: customer.pendingKhata,
      description: description || 'Paid dues via Customer History',
    });
    await txn.save();

    res.status(200).json({ message: "Payment added", customer, transaction: txn });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
