const mongoose = require('mongoose');

const riderProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyProfile', required: true },
  vehicleNumber: { type: String, required: true },
  drivingLicenseNo: { type: String },
  vehicleType: { type: String, enum: ['bike', 'scooter', 'bicycle'], default: 'bike' },
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  status: { type: String, enum: ['idle', 'delivering', 'offline'], default: 'offline' }
}, { timestamps: true });

module.exports = mongoose.model('RiderProfile', riderProfileSchema);
