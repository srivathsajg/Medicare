const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("../modules/auth/routes/auth.routes");
const appointmentRoutes = require("../modules/appointments");
const recordRoutes = require("../modules/medical-records");
const medicalRecordRoutes = require("../modules/medical-records");
const prescriptionRoutes = require("../modules/prescriptions");
const pharmacyRoutes = require("../modules/pharmacy-orders");
const deliveryRoutes = require("../modules/delivery-tracking");
const insuranceRoutes = require("../modules/insurance");
const billingRoutes = require("../modules/billing");
const blockchainRoutes = require("../modules/blockchain-records");
const diagnosisRoutes = require("../ai/smart-diagnosis/diagnosis.routes");
const dietRoutes = require("../ai/diet-recommendation/diet.routes");
const reminderRoutes = require("../ai/medicine-reminder/reminder.routes");
const auditRoutes = require("../modules/audit/routes");
const errorHandler = require("../middleware/errorHandler");
const { limiter, securityHeaders } = require("../middleware/security");
const requestLogger = require("../middleware/requestLogger");

const app = express();

// Security Middleware
app.use(securityHeaders);
app.use(limiter);

// Logging Middleware
app.use(requestLogger);

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Explicit CORS configuration
app.use(cors({
  origin: true, // Allow any origin to support both local and public tunnels
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors()); // Enable pre-flight across-the-board

app.use(express.json());

// Serve static files from uploads directory
// Using __dirname ensures we find the uploads folder relative to this file
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/backend/uploads", express.static(path.join(__dirname, "../uploads"))); // Fallback

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

console.log("Loading auth routes at /api/auth");
app.use("/api/auth", authRoutes);
console.log("Loading appointment routes at /api/appointments");
app.use("/api/appointments", appointmentRoutes);
console.log("Loading medical record routes at /api/records");
app.use("/api/records", recordRoutes);
console.log("Loading medical record routes at /api/medical-record");
app.use("/api/medical-record", medicalRecordRoutes);
console.log("Loading prescription routes at /api/prescriptions");
app.use("/api/prescriptions", prescriptionRoutes);
console.log("Loading pharmacy routes at /api/pharmacy");
app.use("/api/pharmacy", pharmacyRoutes);
console.log("Loading delivery routes at /api/delivery");
app.use("/api/delivery", deliveryRoutes);
console.log("Loading insurance routes at /api/insurance");
app.use("/api/insurance", insuranceRoutes);
console.log("Loading billing routes at /api/billing");
app.use("/api/billing", billingRoutes);
console.log("Loading blockchain routes at /api/blockchain");
app.use("/api/blockchain", blockchainRoutes);
console.log("Loading AI diagnosis routes at /api/ai/diagnosis");
app.use("/api/ai/diagnosis", diagnosisRoutes);
console.log("Loading AI diet routes at /api/ai/diet");
app.use("/api/ai/diet", dietRoutes);
console.log("Loading AI reminder routes at /api/ai/reminder");
app.use("/api/ai/reminder", reminderRoutes);
console.log("Loading Audit routes at /api/audit");
app.use("/api/audit", auditRoutes);
console.log("Loading QR access routes at /api/qr");
const qrRoutes = require("../modules/qr-access/routes/qr.routes");
app.use("/api/qr", qrRoutes);
console.log("Loading patient routes at /api/patient");
const patientRoutes = require("../roles/patient/patient.routes");
app.use("/api/patient", patientRoutes);
console.log("Loading doctor routes at /api/doctor");
const doctorRoutes = require("../roles/doctor/doctor.routes");
app.use("/api/doctor", doctorRoutes);
console.log("Loading admin routes at /api/admin");
const adminRoutes = require("../roles/admin/admin.routes");
app.use("/api/admin", adminRoutes);

console.log("Loading drug routes at /api/drugs");
const drugRoutes = require("../modules/drugs/routes");
app.use("/api/drugs", drugRoutes);

console.log("Loading inventory routes at /api/inventory");
const inventoryRoutes = require("../modules/inventory/routes");
app.use("/api/inventory", inventoryRoutes);

console.log("Loading lab routes at /api/lab");
const labRoutes = require("../modules/lab/routes");
app.use("/api/lab", labRoutes);

console.log("Loading universal search routes at /api/search");
const searchRoutes = require("../modules/search/routes");
app.use("/api/search", searchRoutes);

console.log("App initialized - all routes loaded");

app.use(errorHandler);

module.exports = app;
