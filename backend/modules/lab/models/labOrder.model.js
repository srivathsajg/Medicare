const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testName: { type: String, required: true },
  price: { type: Number, required: true },
  hospitalName: { type: String, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  date: { type: Date, default: Date.now },
  blockchainTxHash: { type: String, default: "" },
  blockchainVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model("LabOrder", labOrderSchema);
