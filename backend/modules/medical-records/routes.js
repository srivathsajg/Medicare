const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  uploadRecord,
  getMyRecords,
  getDoctorRecords,
  getAllRecords,
  verifyRecordIntegrity,
  getPatientHistoryForDoctor,
} = require("./controller");

const router = express.Router();

console.log("Initializing medical-record routes");

router.get(
  "/patient-history/:patientId",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getPatientHistoryForDoctor
);

router.get(
  "/verify/:id",
  authMiddleware,
  roleMiddleware(["admin", "doctor", "patient"]),
  verifyRecordIntegrity
);

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["doctor"]),
  uploadRecord
);

router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["patient"]),
  uploadRecord
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyRecords
);

router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getDoctorRecords
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllRecords
);

module.exports = router;
