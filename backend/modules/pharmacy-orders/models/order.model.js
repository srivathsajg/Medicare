const mongoose = require("mongoose");

const { Schema } = mongoose;

const orderSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pharmacistId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  prescriptionId: {
    type: Schema.Types.ObjectId,
    ref: "Prescription",
    required: false,
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  medicalRecordId: {
    type: Schema.Types.ObjectId,
    ref: "Record",
  },
  medicines: {
    type: [String],
    default: [],
  },
  isAdmitted: {
    type: Boolean,
    default: false,
  },
  wardNumber: {
    type: String,
  },
  deliveryType: {
    type: String,
    enum: ["WARD_DELIVERY", "HAND_OVER"],
    default: "HAND_OVER",
  },
  roomNo: {
    type: String,
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  encryptedNotes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "preparing", "ready", "dispatched", "delivered"],
    default: "processing",
  },
  billAmount: {
    type: Number,
    default: 0,
  },
  hospitalName: {
    type: String,
    required: false,
  },
  hospitalAddress: {
    type: String,
    required: false,
  },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;

