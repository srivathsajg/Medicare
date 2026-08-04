const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  createEmergencyCase,
  getEmergencyCaseById,
  getMyEmergencyCases,
  updateEmergencyStatus,
  updateEmergencyDetails,
  cancelEmergencyCase,
} = require("./controller");

const router = express.Router();

const CREATOR_ROLES = ["patient", "doctor", "admin", "ambulance", "police"];
const STATUS_UPDATER_ROLES = ["doctor", "admin", "ambulance"];
const VIEWER_ROLES = ["patient", "doctor", "admin", "ambulance", "police"];
const ADMIN_ROLES = ["admin"];

router.post(
  "/cases",
  authMiddleware,
  roleMiddleware(CREATOR_ROLES),
  createEmergencyCase
);

router.get(
  "/cases",
  authMiddleware,
  roleMiddleware(VIEWER_ROLES),
  getMyEmergencyCases
);

router.get(
  "/cases/all",
  authMiddleware,
  roleMiddleware(ADMIN_ROLES),
  getMyEmergencyCases
);

router.get(
  "/cases/:id",
  authMiddleware,
  roleMiddleware(VIEWER_ROLES),
  getEmergencyCaseById
);

router.patch(
  "/cases/:id/status",
  authMiddleware,
  roleMiddleware(STATUS_UPDATER_ROLES.concat(["patient"])),
  updateEmergencyStatus
);

router.patch(
  "/cases/:id",
  authMiddleware,
  roleMiddleware(CREATOR_ROLES.concat(["admin"])),
  updateEmergencyDetails
);

router.post(
  "/cases/:id/cancel",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  cancelEmergencyCase
);

module.exports = router;
