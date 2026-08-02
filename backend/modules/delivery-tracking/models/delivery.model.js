const mongoose = require("mongoose");

const { Schema } = mongoose;

const deliverySchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  deliveryStaffId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  trackingId: {
    type: String,
  },
  deliveryType: {
    type: String,
    enum: ["WARD_DELIVERY", "HAND_OVER"],
    default: "HAND_OVER",
  },
  wardNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ["assigned", "picked", "in_transit", "delivered"],
    default: "assigned",
  },
  encryptedTrackingData: {
    type: String,
  },
  blockchainVerificationHash: {
    type: String,
  },
  location: {
    type: Schema.Types.Mixed,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Delivery = mongoose.model("Delivery", deliverySchema);

module.exports = Delivery;

