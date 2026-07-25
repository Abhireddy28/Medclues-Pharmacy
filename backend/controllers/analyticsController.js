const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const KhataTransaction = require('../models/KhataTransaction');
const mongoose = require('mongoose');

// Helper to get start of date based on filter
const getStartDate = (filter) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  if (filter === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else if (filter === 'monthly') {
    start.setMonth(start.getMonth() - 1);
  }
  return start;
};

exports.getProfitInsights = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { filter = 'today' } = req.query;

    const start = getStartDate(filter);
    
    // 1. Transactions matching pharmacy and date filter
    const transactions = await Transaction.find({
      pharmacy: pharmacyId,
      createdAt: { $gte: start },
      status: 'completed'
    }).sort({ createdAt: -1 });

    // 2. Summary Calculations
    let totalSales = 0;
    let totalPurchaseCost = 0;
    let upiAmount = 0;
    let cashAmount = 0;
    let khataAmount = 0;

    transactions.forEach(tx => {
       totalSales += tx.totalAmount;
       
       if (tx.paymentType === 'upi') upiAmount += tx.totalAmount;
       else if (tx.paymentType === 'cash') cashAmount += tx.totalAmount;
       else if (tx.paymentType === 'khata' || tx.paymentType === 'credit') khataAmount += tx.totalAmount;

       tx.items.forEach(item => {
          totalPurchaseCost += (item.costPrice || 0) * item.quantity;
       });
    });

    const profit = totalSales - totalPurchaseCost;

    // 3. Chart Data (Aggregate by day/date)
    // For simplicity, we'll return grouping based on the range.
    // In a real app, this would be an aggregation pipeline.
    const chartDataMap = {};
    transactions.forEach(tx => {
        const dateKey = new Date(tx.createdAt).toLocaleDateString();
        if (!chartDataMap[dateKey]) {
            chartDataMap[dateKey] = { date: dateKey, sales: 0, purchase: 0 };
        }
        chartDataMap[dateKey].sales += tx.totalAmount;
        let itemCost = 0;
        tx.items.forEach(item => itemCost += (item.costPrice || 0) * item.quantity);
        chartDataMap[dateKey].purchase += itemCost;
    });

    const chartData = Object.values(chartDataMap).reverse();

    // 4. Dead Stock (Items not sold in the period)
    const soldProductIds = [ ...new Set(transactions.flatMap(tx => tx.items.map(item => item.product.toString())))];
    const deadStock = await Product.find({
        _id: { $nin: soldProductIds },
        stock: { $gt: 0 }
    }).limit(10); // Show max 10 for info

    res.json({
       summary: {
           totalSales,
           totalPurchaseToday: totalPurchaseCost,
           profitToday: profit,
           upiAmount,
           cashAmount,
           khataAmount
       },
       chartData,
       billingList: transactions.map(tx => ({
           id: tx._id,
           time: new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
           customer: tx.customerName || 'Walk-in', // Adjust based on model if customer is object
           amount: tx.totalAmount,
           paymentType: tx.paymentType,
           profit: tx.totalAmount - tx.items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0)
       })),
       deadStock
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
