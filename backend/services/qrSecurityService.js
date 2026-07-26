const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const QR_SECRET = process.env.QR_SECRET || 'medclues_qr_secret_key_production_2026_super_secure';

// Redemptions cache to prevent replay/re-scanning of QR codes
const redeemedNonces = new Set();

/**
 * Generate an encrypted, time-bound dynamic QR Token (15-min TTL)
 */
exports.generateEncryptedQrToken = (orderId, patientId) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = {
    orderId,
    patientId,
    nonce,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15-minute expiration
  };
  const token = jwt.sign(payload, QR_SECRET);
  return { token, nonce, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
};

/**
 * Verify and redeem an encrypted QR Token at the Hospital Pharmacy Counter
 */
exports.verifyAndRedeemQrToken = (token) => {
  try {
    const decoded = jwt.verify(token, QR_SECRET);
    if (!decoded || !decoded.orderId || !decoded.nonce) {
      return { valid: false, error: 'Invalid QR token payload' };
    }

    if (redeemedNonces.has(decoded.nonce)) {
      return { valid: false, error: 'QR Code already redeemed or replayed!' };
    }

    // Mark nonce as redeemed (single-use lock)
    redeemedNonces.add(decoded.nonce);

    // Auto-cleanup nonce after 30 mins
    setTimeout(() => {
      redeemedNonces.delete(decoded.nonce);
    }, 30 * 60 * 1000);

    return {
      valid: true,
      orderId: decoded.orderId,
      patientId: decoded.patientId,
      nonce: decoded.nonce
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'QR Code has expired! Please refresh on mobile app.' };
    }
    return { valid: false, error: `Verification failed: ${err.message}` };
  }
};
