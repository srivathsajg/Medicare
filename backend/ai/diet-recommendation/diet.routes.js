const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const { getDietRecommendation, getLatestDietPlan, refreshDietPlan, getFoodImage } = require("./diet.controller");

const router = express.Router();

router.get(
  "/latest-plan",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  getLatestDietPlan
);

router.post(
  "/refresh",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  refreshDietPlan
);

router.post(
  "/recommend",
  authMiddleware,
  roleMiddleware(["patient", "admin"]),
  getDietRecommendation
);

// Food image proxy — calls Spoonacular server-side, no CORS issues
router.get(
  "/food-image",
  authMiddleware,
  getFoodImage
);

module.exports = router;

