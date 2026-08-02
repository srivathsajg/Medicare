const crypto = require("crypto");
const QRAccess = require("../models/qrAccess.model");
const User = require("../../users/models/user.model");
const Record = require("../../medical-records/models/record.model");
const Prescription = require("../../prescriptions/models/prescription.model");
const LabOrder = require("../../lab/models/labOrder.model");
const Audit = require("../../audit/models/audit.model");

// POST /api/qr/generate
exports.generateQR = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { expiryMinutes = 60 } = req.body; // Default 1 hour

    // Deactivate existing tokens for this patient
    await QRAccess.updateMany({ patientId, isActive: true }, { isActive: false });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const qrAccess = await QRAccess.create({
      patientId,
      token,
      expiresAt,
      createdBy: patientId,
    });

    res.status(201).json({
      success: true,
      data: {
        token: qrAccess.token,
        expiresAt: qrAccess.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error generating QR:", error);
    res.status(500).json({ success: false, message: "Error generating QR access" });
  }
};

// GET /api/qr/validate/:token
exports.validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    const qrAccess = await QRAccess.findOne({ token, isActive: true });

    if (!qrAccess) {
      return res.status(404).json({ success: false, message: "Invalid or inactive QR code" });
    }

    if (qrAccess.expiresAt < new Date()) {
      qrAccess.isActive = false;
      await qrAccess.save();
      return res.status(410).json({ success: false, message: "QR code has expired" });
    }

    res.json({ success: true, message: "QR code is valid", patientId: qrAccess.patientId });
  } catch (error) {
    console.error("Error validating QR token:", error);
    res.status(500).json({ success: false, message: "Error validating QR access" });
  }
};

// GET /api/qr/patient/:token
exports.getPatientDataByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const qrAccess = await QRAccess.findOne({ token, isActive: true }).populate("patientId");

    if (!qrAccess || qrAccess.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Unauthorized or expired QR access" });
    }

    // Only allow doctors and admins to access this data
    if (!["doctor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access restricted to authorized personnel" });
    }

    const patientId = qrAccess.patientId._id;

    // Fetch related data
    const [records, prescriptions, labOrders] = await Promise.all([
      Record.find({ patientId }).populate("doctorId", "name hospitalName").sort({ createdAt: -1 }),
      Prescription.find({ patientId }).populate("doctorId", "name").sort({ createdAt: -1 }),
      LabOrder.find({ patientId }).populate("doctorId", "name").sort({ createdAt: -1 }),
    ]);

    // Update scan log
    qrAccess.scanCount += 1;
    if (!qrAccess.scannedBy.includes(req.user.id)) {
      qrAccess.scannedBy.push(req.user.id);
    }
    await qrAccess.save();

    // Create Audit Log for QR-based access
    await Audit.create({
      userId: req.user.id,
      role: req.user.role,
      action: "QR_PROFILE_ACCESS",
      module: "PATIENT_DATA",
      targetId: patientId.toString(),
      ipAddress: req.ip || req.connection.remoteAddress,
      details: {
        method: "QR_CODE_SCAN",
        patientName: qrAccess.patientId.name,
        tokenUsed: token.substring(0, 8) + "..."
      }
    });

    res.json({
      success: true,
      data: {
        patient: {
          name: qrAccess.patientId.name,
          email: qrAccess.patientId.email,
          phone: qrAccess.patientId.phone,
          dob: qrAccess.patientId.dob,
          bloodGroup: qrAccess.patientId.bloodGroup,
          gender: qrAccess.patientId.gender,
          guardianNumber: qrAccess.patientId.guardianNumber,
          residentialAddress: qrAccess.patientId.residentialAddress,
          height: qrAccess.patientId.height,
          weight: qrAccess.patientId.weight,
          profileImage: qrAccess.patientId.profileImage,
          healthSummary: qrAccess.patientId.healthSummary,
        },
        records,
        prescriptions,
        labOrders,
        qrStatus: {
          expiresAt: qrAccess.expiresAt,
          scanCount: qrAccess.scanCount,
        }
      },
    });
  } catch (error) {
    console.error("Error fetching patient data by token:", error);
    res.status(500).json({ success: false, message: "Error fetching patient profile" });
  }
};

// POST /api/qr/expire/:token
exports.expireToken = async (req, res) => {
  try {
    const { token } = req.params;
    const qrAccess = await QRAccess.findOne({ token, patientId: req.user.id });

    if (!qrAccess) {
      return res.status(404).json({ success: false, message: "QR code not found" });
    }

    qrAccess.isActive = false;
    await qrAccess.save();

    res.json({ success: true, message: "QR code expired successfully" });
  } catch (error) {
    console.error("Error expiring QR token:", error);
    res.status(500).json({ success: false, message: "Error expiring QR access" });
  }
};
