const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qr.controller");
const authMiddleware = require("../../../middleware/authMiddleware");
const roleMiddleware = require("../../../middleware/roleMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Patient side: Generate and expire QR
router.post("/generate", roleMiddleware(["patient"]), qrController.generateQR);
router.post("/expire/:token", roleMiddleware(["patient"]), qrController.expireToken);

// Doctor side: Validate and get patient data
router.get("/validate/:token", roleMiddleware(["doctor", "admin"]), qrController.validateToken);
router.get("/patient/:token", roleMiddleware(["doctor", "admin"]), qrController.getPatientDataByToken);

module.exports = router;
