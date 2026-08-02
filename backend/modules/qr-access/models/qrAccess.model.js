const mongoose = require("mongoose");

const qrAccessSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accessType: {
    type: String,
    enum: ["doctor_readonly"],
    default: "doctor_readonly",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  scanCount: {
    type: Number,
    default: 0,
  },
  scannedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-expire tokens
qrAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const QRAccess = mongoose.model("QRAccess", qrAccessSchema);

module.exports = QRAccess;
