const crypto = require('crypto');

// Memory cache for active nonces (in production backed by Redis)
const processedEmrNonces = new Map();

/**
 * Verify Hospital EMR Integration HMAC Signature & Anti-Replay Protection
 */
exports.verifyEmrHmacSignature = (req) => {
  const hospitalCode = req.headers['x-hospital-code'];
  const apiKey = req.headers['x-api-key'];
  const signature = req.headers['x-signature'];
  const timestampStr = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];

  if (!hospitalCode || !apiKey || !signature || !timestampStr || !nonce) {
    throw new Error('Missing EMR security headers (x-hospital-code, x-api-key, x-signature, x-timestamp, x-nonce)');
  }

  // 1. Timestamp Window Check (Max 300 seconds skew)
  const timestamp = parseInt(timestampStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    throw new Error('Timestamp window expired (max 300 seconds allowed). Skew detected.');
  }

  // 2. Anti-Replay Nonce Tracking
  if (processedEmrNonces.has(nonce)) {
    throw new Error('Replay attack detected! Nonce has already been processed.');
  }

  // Store nonce with TTL 15 minutes
  processedEmrNonces.set(nonce, now);
  setTimeout(() => {
    processedEmrNonces.delete(nonce);
  }, 15 * 60 * 1000);

  // 3. HMAC SHA-256 Signature Verification
  const expectedSecret = process.env.EMR_SECRET || 'emr_hospital_shared_secret_production_2026';
  const bodyString = JSON.stringify(req.body || {});
  const payloadToSign = `${hospitalCode}.${timestampStr}.${nonce}.${bodyString}`;
  
  const computedSignature = crypto
    .createHmac('sha256', expectedSecret)
    .update(payloadToSign)
    .digest('hex');

  if (computedSignature !== signature) {
    throw new Error('HMAC signature verification failed. Invalid secret or tampered payload.');
  }

  return { valid: true, hospitalCode };
};
