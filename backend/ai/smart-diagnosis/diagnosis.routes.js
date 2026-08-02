const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const { analyzeDiagnosis } = require("./diagnosis.controller");

const router = express.Router();

router.post(
  "/analyze",
  authMiddleware,
  roleMiddleware(["doctor", "admin"]),
  analyzeDiagnosis
);

module.exports = router;

