const {
  getMyDeliveries,
  assignDelivery,
  updateDeliveryStatus,
  getDeliveryTracking,
  getAllDeliveries,
  getPendingDeliveries,
  markAsDelivered,
  getPatientActiveDeliveries,
} = require("./service");
const { logAction } = require("../audit/service");
const socket = require("../../core/socket");

const getPendingDeliveriesController = async (req, res, next) => {
  try {
    const deliveries = await getPendingDeliveries();

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

const markAsDeliveredController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const delivery = await markAsDelivered({
      id,
      deliveryStaffId: req.user.id,
    });

    try {
      const io = socket.getIO();
      io.emit("delivery-status-updated", {
        deliveryId: id,
        status: "delivered",
        patientId: delivery.patientId,
        orderId: delivery.orderId
      });
    } catch (socketErr) {
      console.warn("Socket notification failed for delivery markAsDelivered:", socketErr.message);
    }

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "DELIVERY_COMPLETED",
      module: "DELIVERY",
      targetId: id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Delivery marked as delivered successfully",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

const getMyDeliveriesController = async (req, res, next) => {
  try {
    const deliveries = await getMyDeliveries(req.user.id);

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

const assignDeliveryController = async (req, res, next) => {
  try {
    const { deliveryId, deliveryAgentId } = req.body;
    
    const delivery = await assignDelivery({
      id: deliveryId,
      deliveryStaffId: deliveryAgentId
    });

    try {
      const io = socket.getIO();
      io.emit("delivery-assigned", {
        deliveryId: deliveryId,
        deliveryStaffId: deliveryAgentId,
        status: "assigned",
        patientId: delivery.patientId
      });
    } catch (socketErr) {
      console.warn("Socket notification failed for delivery assignment:", socketErr.message);
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryStatusController = async (req, res, next) => {
  try {
    const { status, location } = req.body;
    const { id } = req.params;
    
    const delivery = await updateDeliveryStatus({
      id,
      deliveryStaffId: req.user.id,
      status,
      location
    });

    try {
      const io = socket.getIO();
      io.emit("delivery-status-updated", {
        deliveryId: id,
        status: status,
        location: location,
        patientId: delivery.patientId,
        orderId: delivery.orderId
      });
    } catch (socketErr) {
      console.warn("Socket notification failed for delivery status update:", socketErr.message);
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingDeliveries: getPendingDeliveriesController,
  markAsDelivered: markAsDeliveredController,
  getMyDeliveries: getMyDeliveriesController,
  assignDelivery: assignDeliveryController,
  updateDeliveryStatus: updateDeliveryStatusController,
};

const trackDeliveryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await getDeliveryTracking(id);
    
    // Response format as per Task 8
    res.json({
      success: true,
      data: {
        pharmacyId: delivery.orderId,
        deliveryTrackingId: delivery.trackingId,
        deliveryStatus: delivery.status,
        blockchainTxHash: delivery.blockchainVerificationHash,
        encryption: "AES-256",
        integrity: "SHA-256"
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllDeliveriesController = async (req, res, next) => {
  try {
    const deliveries = await getAllDeliveries();

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientActiveDeliveriesController = async (req, res, next) => {
  try {
    const deliveries = await getPatientActiveDeliveries(req.user.id);
    res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDeliveries: getMyDeliveriesController,
  assignDelivery: assignDeliveryController,
  updateDeliveryStatus: updateDeliveryStatusController,
  trackDelivery: trackDeliveryController,
  getAllDeliveries: getAllDeliveriesController,
  getPendingDeliveries: getPendingDeliveriesController,
  markAsDelivered: markAsDeliveredController,
  getPatientActiveDeliveries: getPatientActiveDeliveriesController,
};
