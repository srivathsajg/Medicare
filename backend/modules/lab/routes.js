const express = require("express");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const { getPatients, uploadReport, getTests, createOrder, getOrders, getCompletedOrders } = require("./controller");

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.get(
  "/tests",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getTests
);

router.post(
  "/orders",
  authMiddleware,
  roleMiddleware(["doctor"]),
  createOrder
);

router.get(
  "/orders",
  authMiddleware,
  roleMiddleware(["lab_technician", "admin"]),
  getOrders
);

router.get(
  "/orders/completed",
  authMiddleware,
  roleMiddleware(["lab_technician", "admin"]),
  getCompletedOrders
);

router.get(
  "/patients",
  authMiddleware,
  roleMiddleware(["lab_technician", "admin"]),
  getPatients
);

router.post(
  "/upload-report",
  authMiddleware,
  roleMiddleware(["lab_technician", "admin"]),
  upload.single("reportFile"),
  uploadReport
);

module.exports = router;
