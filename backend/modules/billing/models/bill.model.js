const mongoose = require("mongoose");

const { Schema } = mongoose;

const billSchema = new Schema({
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
  medicalRecordId: {
    type: Schema.Types.ObjectId,
    ref: "Record",
    required: false,
  },
  prescriptionId: {
    type: Schema.Types.ObjectId,
    ref: "Prescription",
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  items: [
    {
      name: String,
      cost: Number,
      type: { type: String, enum: ["medicine", "lab_test", "consultancy", "other"] }
    }
  ],
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  blockchainTxHash: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
