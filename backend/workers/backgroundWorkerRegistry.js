const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

/**
 * 1. Reservation Lock Cleanup Worker (Runs every 60 seconds)
 * Releases expired stock locks for unpaid checkouts (>10 mins old)
 */
const cleanupExpiredReservationLocks = async () => {
  try {
    const now = new Date();
    const expiredLocks = await Inventory.find({
      'locks.expiresAt': { $lt: now }
    });

    for (const item of expiredLocks) {
      const activeLocks = (item.locks || []).filter(l => new Date(l.expiresAt) > now);
      const releasedQty = (item.locks || [])
        .filter(l => new Date(l.expiresAt) <= now)
        .reduce((sum, l) => sum + (l.quantity || 0), 0);

      if (releasedQty > 0) {
        item.locks = activeLocks;
        item.stock += releasedQty; // Revert reserved stock back to available
        await item.save();
        console.log(`[ReservationLockCleanupWorker] Released ${releasedQty} units for item ${item.name}`);
      }
    }
  } catch (err) {
    console.error('[ReservationLockCleanupWorker] Error:', err.message);
  }
};

/**
 * 2. Payment Reconciliation Worker (Runs every 5 minutes)
 * Reconciles unverified Razorpay orders older than 15 minutes
 */
const reconcilePendingPayments = async () => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const staleOrders = await Order.find({
      status: 'pending',
      createdAt: { $lt: fifteenMinsAgo }
    });

    for (const order of staleOrders) {
      // Shift to PAYMENT_FAILED and log audit alert
      order.status = 'rejected';
      order.notes = (order.notes || '') + ' [System: Unverified Payment Timeout (15m)]';
      await order.save();

      await AuditLog.create({
        action: 'PAYMENT_TIMEOUT_RECONCILIATION',
        endpoint: 'Worker/PaymentReconciliation',
        ipAddress: '127.0.0.1',
        status: 'success',
        payloadSummary: { orderId: order._id, reason: 'Payment timeout 15m' }
      });
      console.log(`[PaymentReconciliationWorker] Order ${order._id} marked FAILED due to timeout.`);
    }
  } catch (err) {
    console.error('[PaymentReconciliationWorker] Error:', err.message);
  }
};

/**
 * 3. Expired Inventory Worker (Runs daily)
 * Flags medicines hitting expiry date
 */
const flagExpiredMedicines = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredItems = await Inventory.updateMany(
      { expiryDate: { $lt: today }, status: { $ne: 'discontinued' } },
      { $set: { status: 'discontinued' } }
    );
    if (expiredItems.modifiedCount > 0) {
      console.log(`[ExpiredInventoryWorker] Marked ${expiredItems.modifiedCount} items as discontinued.`);
    }
  } catch (err) {
    console.error('[ExpiredInventoryWorker] Error:', err.message);
  }
};

/**
 * Register and start all background cron workers
 */
exports.startBackgroundWorkers = () => {
  console.log('🚀 Starting MedClues Background Worker Registry...');

  // Lock Cleanup every 60 seconds
  setInterval(cleanupExpiredReservationLocks, 60 * 1000);

  // Payment Reconciliation every 5 minutes
  setInterval(reconcilePendingPayments, 5 * 60 * 1000);

  // Expired Inventory Check every 24 hours
  setInterval(flagExpiredMedicines, 24 * 60 * 60 * 1000);
};
