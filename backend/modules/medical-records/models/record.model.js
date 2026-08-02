const mongoose = require("mongoose");

const { Schema } = mongoose;

const recordSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  symptoms: {
    type: String,
  },
  labResults: {
    type: String,
  },
  treatmentPlan: {
    type: String,
  },
  notes: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  ipfsHash: {
    type: String,
  },
  sha256Hash: {
    type: String,
  },
  blockchainTxHash: {
    type: String,
  },
  blockchainVerified: {
    type: Boolean,
    default: false
  },
  hospitalName: {
    type: String,
  },
  orderedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Record = mongoose.model("Record", recordSchema);

module.exports = Record;
