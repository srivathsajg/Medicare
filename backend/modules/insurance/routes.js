const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaimStatus,
} = require("./controller");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["patient"]),
  createClaim
);

router.post(
  "/claim",
  authMiddleware,
  roleMiddleware(["patient"]),
  createClaim
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyClaims
);

router.get(
  "/patient",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyClaims
);

router.patch(
  "/status/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateClaimStatus
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin", "doctor", "pharmacist"]),
  getAllClaims
);

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllClaims
);

module.exports = router;
