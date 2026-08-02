const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  createOrder,
  getMyOrders,
  getPharmacistOrders,
  getDoctorOrders,
  getAllOrders,
  getPendingOrders,
  updateOrderStatus,
  updateOrderById,
  getAvailableDeliveryStaff,
} = require("./controller");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["patient"]),
  createOrder
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyOrders
);

router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getDoctorOrders
);

router.get(
  "/pharmacist",
  authMiddleware,
  roleMiddleware(["pharmacist"]),
  getPharmacistOrders
);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["pharmacist", "admin"]),
  getPendingOrders
);

router.patch(
  "/status/:id",
  authMiddleware,
  roleMiddleware(["pharmacist"]),
  updateOrderStatus
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllOrders
);

router.put(
  "/update-status/:id",
  authMiddleware,
  roleMiddleware(["pharmacist", "admin"]),
  updateOrderById
);

router.get(
  "/delivery-staff",
  authMiddleware,
  roleMiddleware(["pharmacist"]),
  getAvailableDeliveryStaff
);

module.exports = router;
