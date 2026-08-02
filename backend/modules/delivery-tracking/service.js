const Delivery = require("./models/delivery.model");
const { encrypt, hashData } = require("../../utils/encryption");
const { addRecord } = require("../../core/services/blockchain/contract.service");

const getMyDeliveries = async (deliveryStaffId) => {
  const deliveries = await Delivery.find({ deliveryStaffId }).sort({
    updatedAt: -1,
  });

  return deliveries;
};

const createDelivery = async ({ pharmacyId, patientId, deliveryAgentId, trackingId, status, deliveryType, wardNumber }) => {
  const delivery = await Delivery.create({
    orderId: pharmacyId,
    patientId,
    deliveryStaffId: deliveryAgentId,
    trackingId,
    status: status || "assigned",
    deliveryType,
    wardNumber,
    encryptedTrackingData: encrypt(JSON.stringify({ status: status || "assigned", timestamp: Date.now(), deliveryType, wardNumber })),
  });
  return delivery;
};

const assignDelivery = async ({ id, deliveryStaffId }) => {
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    throw error;
  }
  
  delivery.deliveryStaffId = deliveryStaffId;
  delivery.status = "assigned";
  delivery.updatedAt = new Date();
  await delivery.save();
  return delivery;
};

const updateDeliveryStatus = async ({ id, deliveryStaffId, status, location }) => {
  const allowedStatuses = ["assigned", "picked", "in_transit", "delivered"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid status");
    error.statusCode = 400;
    throw error;
  }

  const delivery = await Delivery.findById(id);

  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    throw error;
  }

  if (delivery.deliveryStaffId && String(delivery.deliveryStaffId) !== String(deliveryStaffId)) {
    const error = new Error("Not allowed to update this delivery");
    error.statusCode = 403;
    throw error;
  }

  if (!delivery.deliveryStaffId) {
    delivery.deliveryStaffId = deliveryStaffId;
  }

  delivery.status = status;

  if (location) {
    delivery.location = location;
  }
  
  // Encrypt sensitive logistics info
  const trackingInfo = {
    status,
    location: location || delivery.location,
    timestamp: Date.now(),
    updatedBy: deliveryStaffId
  };
  delivery.encryptedTrackingData = encrypt(JSON.stringify(trackingInfo));

  delivery.updatedAt = new Date();

  // Blockchain integration for "delivered" status
  if (status === "delivered") {
    const Order = require("../pharmacy-orders/models/order.model");
    const order = await Order.findById(delivery.orderId);
    
    // Generate SHA-256 hash using: prescriptionId + pharmacyId + timestamp
    const hashInput = `${order.prescriptionId}-${delivery.orderId}-${Date.now()}`;
    const verificationHash = hashData(hashInput);
    
    // Store only hash on blockchain
    // Reusing addRecord(recordHash, patientId) from contract service
    // Here recordHash is our delivery verification hash
    const { txHash } = await addRecord(verificationHash, delivery.patientId.toString());
    
    delivery.blockchainVerificationHash = txHash;
    
    await Order.findByIdAndUpdate(delivery.orderId, { status: "delivered" });
  }

  await delivery.save();

  return delivery;
};

const getDeliveryTracking = async (id) => {
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    throw error;
  }
  return delivery;
};

const getAllDeliveries = async () => {
  const deliveries = await Delivery.find().sort({ updatedAt: -1 });

  return deliveries;
};

const getPendingDeliveries = async () => {
  const deliveries = await Delivery.find({ status: "assigned" }).sort({ updatedAt: -1 });
  return deliveries;
};

const markAsDelivered = async ({ id, deliveryStaffId }) => {
  return await updateDeliveryStatus({
    id,
    deliveryStaffId,
    status: "delivered",
  });
};

const getAvailableStaff = async (hospitalName) => {
  const User = require("../users/models/user.model");
  
  // Find all delivery staff
  const query = { role: "delivery" };
  // If we want to filter by hospital, we can, but usually delivery staff are hospital-independent or shared.
  // Assuming delivery staff also have a hospitalName if they belong to one.
  if (hospitalName) {
    query.$or = [
      { hospitalName },
      { hospitalName: { $exists: false } },
      { hospitalName: "" }
    ];
  }

  const staff = await User.find(query, "name email phone assignedWard hospitalName").lean();
  
  // For each staff, check how many active deliveries they have
  const staffWithStats = await Promise.all(staff.map(async (s) => {
    const activeCount = await Delivery.countDocuments({
      deliveryStaffId: s._id,
      status: { $in: ["assigned", "picked", "in_transit"] }
    });
    return { ...s, activeCount };
  }));

  // Sort by fewest active tasks (most 'free' first)
  return staffWithStats.sort((a, b) => a.activeCount - b.activeCount);
};

const getPatientActiveDeliveries = async (patientId) => {
  const deliveries = await Delivery.find({
    patientId,
    status: { $ne: "delivered" }
  }).sort({ updatedAt: -1 });
  return deliveries;
};

module.exports = {
  getMyDeliveries,
  createDelivery,
  assignDelivery,
  updateDeliveryStatus,
  getDeliveryTracking,
  getAllDeliveries,
  getPendingDeliveries,
  markAsDelivered,
  getAvailableStaff,
  getPatientActiveDeliveries,
};
