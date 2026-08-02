const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const { addRecord, getRecord, getDbLinkedRecord } = require("./controller");

const router = express.Router();

router.post(
  "/record/add",
  authMiddleware,
  roleMiddleware(["doctor", "admin"]),
  addRecord
);

router.get(
  "/record/:id",
  authMiddleware,
  roleMiddleware(["doctor", "patient", "pharmacist", "delivery", "admin"]),
  getRecord
);

router.get(
  "/record/db/:id",
  authMiddleware,
  roleMiddleware(["doctor", "patient", "pharmacist", "delivery", "admin"]),
  getDbLinkedRecord
);

module.exports = router;
