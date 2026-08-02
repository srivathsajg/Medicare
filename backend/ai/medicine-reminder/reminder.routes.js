const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const { createReminder, getMyReminders } = require("./reminder.controller");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  createReminder
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  getMyReminders
);

module.exports = router;

