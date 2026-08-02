const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const { getAdminAuditLogs, getPatientAccessLogs } = require("./controller");

const router = express.Router();

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAdminAuditLogs
);

router.get(
  "/my-access",
  authMiddleware,
  roleMiddleware(["patient"]),
  getPatientAccessLogs
);

module.exports = router;
