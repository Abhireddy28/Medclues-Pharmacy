const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');

const createOrder = async (req, res) => {
  try {
    let orderData = { ...req.body };

    // Auto-assign distributor if not provided or invalid
    if (!orderData.distributor) {
      const distributor = await User.findOne({ role: 'distributor' });
      if (distributor) {
        orderData.distributor = distributor._id;
      }
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();

    // Broadcast live dashboard update
    const broadcastUpdate = req.app.get('broadcastDashboardUpdate');
    if (typeof broadcastUpdate === 'function') {
      broadcastUpdate();
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getOrdersForDistributor = async (req, res) => {
  try {
    // If distributorId is provided, filter by it. Otherwise return all orders.
    const filter = req.params.distributorId ? { distributor: req.params.distributorId } : {};
    const orders = await Order.find(filter)
      .populate('pharmacy', 'name shopName address phone')
      .populate('items.product', 'name composition category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrdersForPharmacy = async (req, res) => {
  try {
    const orders = await Order.find({ pharmacy: req.params.pharmacyId })
      .populate('distributor', 'name shopName')
      .populate('items.product', 'name composition category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    const updateData = { status };
    if (deliveryDate) updateData.deliveryDate = deliveryDate;
    
    // Find the current order first to know the previous status and items
    const oldOrder = await Order.findById(req.params.id).populate('pharmacy', 'email name shopName');
    if (!oldOrder) return res.status(404).json({ message: 'Order not found' });

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('pharmacy', 'email name shopName')
      .populate('items.product', 'name');

    // Create Notification about status change
    if (status !== oldOrder.status) {
      let priority = status === 'delivered' ? 'info' : (status === 'accepted' ? 'info' : 'warning');
      await Notification.create({
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your order from ${oldOrder.distributor?.shopName || 'Distributor'} has been ${status}.`,
        type: 'order',
        priority,
        actionLink: 'order',
        isRead: false
      });

      // Send Email if status is 'shipped' or 'dispatched'
      if (status === 'shipped' || status === 'dispatched') {
        try {
          if (order.pharmacy && order.pharmacy.email) {
            await emailService.sendOrderDispatched(
              order.pharmacy.email, 
              order.pharmacy.shopName || order.pharmacy.name, 
              order._id
            );
          }
        } catch (err) {
          console.error("Order dispatched email failed", err);
        }
      }
    }

    // If status changed TO delivered, update inventory
    if (status === 'delivered' && oldOrder.status !== 'delivered') {
      const distributorName = oldOrder.distributor?.shopName || oldOrder.distributor?.name || "Distributor";
      
      for (let item of order.items) {
        if (!item.product) continue;
        
        // Find if this item already exists in pharmacy inventory
        let invItem = await Inventory.findOne({ 
          name: item.product.name,
          distributor: distributorName
        });

        if (invItem) {
          invItem.stock += item.quantity;
          invItem.lastUpdated = new Date();
          await invItem.save();
        } else {
          // If not in inventory, create a new entry
          const product = await mongoose.model('Product').findById(item.product._id);
          const expiry = product?.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));

          await Inventory.create({
            name: item.product.name,
            stock: item.quantity,
            price: item.price + 2, // Basic markup
            distributor: distributorName,
            expiryDate: expiry,
            lastUpdated: new Date()
          });
        }
      }
    }

    // Broadcast live dashboard update
    const broadcastUpdate = req.app.get('broadcastDashboardUpdate');
    if (typeof broadcastUpdate === 'function') {
      broadcastUpdate();
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { 
  createOrder, 
  getOrdersForDistributor, 
  getOrdersForPharmacy,
  updateOrderStatus
};
