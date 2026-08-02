const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  getMyBills,
  createAutoBill,
  getDoctorBills,
  getAllBills,
  updatePaymentStatus,
} = require("./controller");

const router = express.Router();

router.post(
  "/auto",
  authMiddleware,
  roleMiddleware(["doctor"]),
  createAutoBill
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyBills
);

router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getDoctorBills
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllBills
);

router.patch(
  "/status/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updatePaymentStatus
);

module.exports = router;
