const mongoose = require("mongoose");

const { Schema } = mongoose;

const prescriptionSchema = new Schema({
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
  medicines: [
    {
      name: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: { type: String, required: true },
      price: { type: String }
    }
  ],
  instructions: {
    type: String,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },
  deliveryType: {
    type: String,
    enum: ["PHARMACY", "WARD"],
    default: "PHARMACY",
  },
  wardNumber: {
    type: String,
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

module.exports = Prescription;
