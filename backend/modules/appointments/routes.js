const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  reportDelay,
} = require("./controller");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["patient"]),
  createAppointment
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyAppointments
);

router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getDoctorAppointments
);

router.patch(
  "/status/:id",
  authMiddleware,
  roleMiddleware(["doctor"]),
  updateAppointmentStatus
);

router.post(
  "/:id/report-delay",
  authMiddleware,
  roleMiddleware(["doctor"]),
  reportDelay
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllAppointments
);

module.exports = router;

