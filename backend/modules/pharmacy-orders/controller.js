const {
  createOrder,
  getPatientOrders,
  getPharmacistOrders,
  getDoctorOrders,
  getAllOrders,
  getPendingOrders,
  updateOrderStatus,
  updateOrderById,
} = require("./service");
const { logAction } = require("../audit/service");
const socket = require("../../core/socket");

const User = require("../users/models/user.model");

const createOrderController = async (req, res, next) => {
  try {
    const { prescriptionId, medicines, billAmount } = req.body;

    const order = await createOrder({
      patientId: req.user.id,
      prescriptionId,
      medicines,
      billAmount,
      hospitalName: req.user.hospitalName,
      hospitalAddress: req.user.hospitalAddress,
    });

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "CREATE_PHARMACY_ORDER",
      module: "PHARMACY",
      targetId: order._id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await getPatientOrders(req.user.id);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getPharmacistOrdersController = async (req, res, next) => {
  try {
    const pharmacist = await User.findById(req.user.id);
    const orders = await getPharmacistOrders(req.user.id, pharmacist?.hospitalName);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorOrdersController = async (req, res, next) => {
  try {
    const orders = await getDoctorOrders(req.user.id);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrdersController = async (req, res, next) => {
  try {
    const orders = await getAllOrders();

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingOrdersController = async (req, res, next) => {
  try {
    const pharmacist = await User.findById(req.user.id);
    const orders = await getPendingOrders(pharmacist?.hospitalName);
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatusController = async (req, res, next) => {
  try {
    const { status, deliveryStaffId } = req.body;
    const { id } = req.params;

    const result = await updateOrderStatus({
      id,
      pharmacistId: req.user.id,
      status,
      deliveryStaffId
    });

    const order = result.order || result;

    const patient = await User.findById(order.patientId).select("name");

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "UPDATE_PHARMACY_STATUS",
      module: "PHARMACY",
      targetId: id,
      ipAddress: req.ip,
      details: { 
        status, 
        patientName: patient?.name || "Unknown Patient",
        patientId: order.patientId
      }
    });

    try {
      const io = socket.getIO();
      io.emit("pharmacy-order-updated", {
        orderId: id,
        status: status,
        patientId: order.patientId
      });
    } catch (socketErr) {
      console.warn("Socket notification failed for order update:", socketErr.message);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await updateOrderById(id, updateData);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableDeliveryStaffController = async (req, res, next) => {
  try {
    const { getAvailableStaff } = require("../delivery-tracking/service");
    const pharmacist = await User.findById(req.user.id);
    const staff = await getAvailableStaff(pharmacist?.hospitalName);
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder: createOrderController,
  getMyOrders,
  getPharmacistOrders: getPharmacistOrdersController,
  getDoctorOrders: getDoctorOrdersController,
  getAllOrders: getAllOrdersController,
  getPendingOrders: getPendingOrdersController,
  updateOrderStatus: updateOrderStatusController,
  updateOrderById: updateOrderByIdController,
  getAvailableDeliveryStaff: getAvailableDeliveryStaffController,
};
