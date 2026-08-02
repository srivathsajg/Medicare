const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
  targetId: {
    type: String, // Can be ObjectId or string ID
  },
  ipAddress: {
    type: String,
  },
  details: {
    type: Object, // Optional extra details
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Audit = mongoose.model("Audit", auditSchema);

module.exports = Audit;
