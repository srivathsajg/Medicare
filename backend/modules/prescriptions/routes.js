const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  createPrescription,
  getMyPrescriptions,
  getDoctorPrescriptions,
  getAllPrescriptions,
} = require("./controller");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["doctor"]),
  createPrescription
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyPrescriptions
);

router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getDoctorPrescriptions
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllPrescriptions
);

module.exports = router;

