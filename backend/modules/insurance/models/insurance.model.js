const mongoose = require("mongoose");

const { Schema } = mongoose;

const insuranceSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  claimStatus: {
    type: String,
    enum: ["submitted", "approved", "rejected"],
    default: "submitted",
  },
  billingId: {
    type: Schema.Types.ObjectId,
    ref: "Bill",
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ["verified", "unverified"],
    default: "unverified",
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Insurance = mongoose.model("Insurance", insuranceSchema);

module.exports = Insurance;

