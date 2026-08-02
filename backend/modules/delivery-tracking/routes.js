const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  getMyDeliveries,
  assignDelivery,
  updateDeliveryStatus,
  trackDelivery,
  getAllDeliveries,
  getPendingDeliveries,
  markAsDelivered,
  getPatientActiveDeliveries,
} = require("./controller");

const router = express.Router();

router.get(
  "/active",
  authMiddleware,
  roleMiddleware(["patient"]),
  getPatientActiveDeliveries
);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["delivery"]),
  getPendingDeliveries
);

router.put(
  "/deliver/:id",
  authMiddleware,
  roleMiddleware(["delivery"]),
  markAsDelivered
);

router.post(
  "/assign",
  authMiddleware,
  roleMiddleware(["admin", "delivery"]),
  assignDelivery
);

router.patch(
  "/update/:id",
  authMiddleware,
  roleMiddleware(["delivery"]),
  updateDeliveryStatus
);

router.get(
  "/track/:id",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  trackDelivery
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["delivery"]),
  getMyDeliveries
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllDeliveries
);

module.exports = router;
