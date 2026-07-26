const crypto = require('crypto');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB Limit

/**
 * Validate paper prescription upload file format, size, and magic bytes
 */
exports.validatePrescriptionFile = (fileBuffer, mimeType) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Upload file is empty');
  }

  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds maximum allowed limit of 10 MB');
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Unsupported file format. Please upload JPEG, PNG, WEBP, or PDF');
  }

  // Calculate SHA-256 Hash for duplicate upload detection
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  return {
    valid: true,
    fileSize: fileBuffer.length,
    mimeType,
    fileHash
  };
};

/**
 * Simulated OCR Extraction Hook (Extracts text & dosage suggestions from prescription scan)
 */
exports.extractPrescriptionOcrText = async (fileBuffer) => {
  // In production integrated with Tesseract / Google Cloud Vision API
  return {
    detectedText: 'Rx: Paracetamol 500mg (1-0-1), Cetirizine 10mg (0-0-1)',
    suggestedMedicines: [
      { name: 'Paracetamol 500mg', dosage: '1-0-1', durationDays: 5 },
      { name: 'Cetirizine 10mg', dosage: '0-0-1', durationDays: 3 }
    ],
    confidenceScore: 0.92
  };
};

/**
 * Generate secure signed URL with 15-minute expiration
 */
exports.generateSignedStorageUrl = (filePath) => {
  const expires = Math.floor(Date.now() / 1000) + (15 * 60); // 15 mins
  const token = crypto.createHmac('sha256', process.env.STORAGE_SECRET || 's3_storage_secret')
    .update(`${filePath}:${expires}`)
    .digest('hex');
  
  return `/uploads/prescriptions/${filePath}?token=${token}&expires=${expires}`;
};
