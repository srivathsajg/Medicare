const crypto = require("crypto");
const { encrypt } = require("../../utils/encryption");
const { uploadToIPFS, fetchFromIPFS } = require("../../core/services/ipfs.service");
const { logAction } = require("../audit/service");
const User = require("../../modules/users/models/user.model");
const Appointment = require("../../modules/appointments/models/appointment.model");
const { recordDoctorAction } = require("../../modules/appointments/service");

const {
  uploadRecord,
  getPatientRecords,
  getDoctorRecords,
  getAllRecords,
  getRecordById,
} = require("./service");

const { addRecord: addRecordOnChain } = require("../../core/services/blockchain/contract.service");
const { createAutoBillForRecord } = require("../billing/service");

const uploadRecordController = async (req, res, next) => {
  try {
    const { patientId, diagnosis, treatment, notes, title } = req.body;

    // Prepare data for IPFS
    const medicalData = {
      patientId,
      doctorId: req.user.id,
      diagnosis,
      treatment,
      notes,
    };

    // Encrypt data
    const encryptedData = encrypt(JSON.stringify(medicalData));

    // Convert encrypted result to a deterministic string
    const encryptedString = JSON.stringify(encryptedData);

    // Generate SHA-256 hash using the deterministic string
    const recordHash = crypto
      .createHash("sha256")
      .update(encryptedString)
      .digest("hex");

    // Upload to IPFS with payload structure
    let ipfsHash;
    try {
      ipfsHash = await uploadToIPFS({ payload: encryptedString });
    } catch (error) {
      console.error("IPFS Upload Failed:", error.message);
      return res.status(500).json({
        success: false,
        message: "IPFS upload failed",
      });
    }

    // Get doctor details for hospital name
    const doctor = await User.findById(req.user.id);
    const hospitalName = doctor ? doctor.hospitalName : null;

    const record = await uploadRecord({
      patientId,
      doctorId: req.user.id,
      title: title || diagnosis,
      description: treatment,
      notes: notes,
      fileUrl: null,
      ipfsHash,
      sha256Hash: recordHash,
      hospitalName,
    });

    // Store hash on blockchain
    // Note: The previous implementation hashed the record ID. 
    // The prompt says "Store SHA-256 hash on blockchain". 
    // Usually we store the hash of the content. I'll use recordHash (content hash) as per prompt requirements "Store SHA-256 hash on blockchain".
    // However, to keep backward compatibility or consistency, I should check what addRecordOnChain expects.
    // The previous code: crypto.createHash("sha256").update(record._id.toString()).digest("hex");
    // I will use the content hash `recordHash` now as it is more meaningful for integrity verification.
    
    const { txHash, recordId } = await addRecordOnChain(
      recordHash,
      record.patientId.toString()
    );

    record.blockchainTxHash = txHash;
    record.blockchainRecordId = recordId;
    await record.save();

    console.log("Blockchain record linked to DB successfully");

    // Audit Log
    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "CREATE_MEDICAL_RECORD",
      module: "MEDICAL_RECORDS",
      targetId: record._id,
      ipAddress: req.ip,
      details: { patientId, ipfsHash, txHash }
    });
    
    // Blockchain Verification Log (Implicitly done above via addRecordOnChain, but we can log the event)
    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "BLOCKCHAIN_VERIFICATION_STORE",
      module: "BLOCKCHAIN",
      targetId: txHash,
      ipAddress: req.ip
    });

    await createAutoBillForRecord({
      patientId: record.patientId,
      doctorId: record.doctorId,
      medicalRecordId: record._id,
      amount: 500,
      blockchainTxHash: record.blockchainTxHash,
    });

    console.log("Billing auto-created for medical record");

    await recordDoctorAction(req.user.id, patientId);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const verifyRecordIntegrity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await getRecordById(id);

    if (!record.ipfsHash) {
      return res.status(400).json({
        success: false,
        message: "Record does not have an IPFS hash",
      });
    }

    // Fetch encrypted data from IPFS
    // fetchFromIPFS returns the JSON object stored in IPFS
    const ipfsData = await fetchFromIPFS(record.ipfsHash);

    console.log("IPFS Data:", ipfsData);

    let encryptedString;

    if (typeof ipfsData === "string") {
      encryptedString = ipfsData;
    } else if (ipfsData.payload) {
      encryptedString = ipfsData.payload;
    } else if (ipfsData.data && ipfsData.data.payload) {
      encryptedString = ipfsData.data.payload;
    } else {
      console.error("Invalid IPFS Structure:", ipfsData);
      throw new Error("Invalid IPFS data structure");
    }

    if (!encryptedString) {
      throw new Error("Encrypted string missing from IPFS");
    }

    // Calculate SHA-256 hash
    const calculatedHash = crypto
      .createHash("sha256")
      .update(encryptedString)
      .digest("hex");
    
    const verified = calculatedHash === record.sha256Hash;

    console.log(`Stored Hash: ${record.sha256Hash}`);
    console.log(`Recalculated Hash: ${calculatedHash}`);

    res.json({
      success: true,
      verified,
      storedHash: record.sha256Hash,
      recalculatedHash: calculatedHash,
      ipfsHash: record.ipfsHash,
      blockchainTxHash: record.blockchainTxHash,
    });
  } catch (error) {
    next(error);
  }
};

const getMyRecords = async (req, res, next) => {
  try {
    const records = await getPatientRecords(req.user.id);

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorRecordsController = async (req, res, next) => {
  try {
    const records = await getDoctorRecords(req.user.id);

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRecordsController = async (req, res, next) => {
  try {
    const records = await getAllRecords();

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientHistoryForDoctor = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    let hasAccess = false;

    // 1. Check Admission Status
    if (patient.admission && patient.admission.isAdmitted) {
      // Admitted to this doctor directly
      if (patient.admission.doctorId && patient.admission.doctorId.toString() === doctorId) {
        hasAccess = true;
      }
      // Admitted to same hospital (if hospitalName matches)
      else if (patient.admission.hospitalName && 
               doctor.hospitalName && 
               patient.admission.hospitalName.toLowerCase() === doctor.hospitalName.toLowerCase()) {
        hasAccess = true;
      }
    }

    // 2. Check Appointment Status (if not already granted)
    if (!hasAccess) {
      // Check for any appointment with this doctor that is not cancelled or rejected
      const appointment = await Appointment.findOne({
        patientId,
        doctorId,
        status: { $in: ["approved", "completed", "pending"] }
      });
      
      if (appointment) {
        hasAccess = true;
        // Update action timestamp if it's an active appointment
        if (appointment.status === "approved") {
          appointment.lastDoctorActionAt = new Date();
          await appointment.save();
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Patient is not admitted to your hospital nor has a booked appointment." 
      });
    }

    // 3. Log Access
    await logAction({
      userId: doctorId,
      role: 'doctor',
      action: 'VIEW_PATIENT_HISTORY',
      module: 'MEDICAL_RECORDS',
      targetId: patientId,
      ipAddress: req.ip,
      details: { patientName: patient.name }
    });

    // 4. Fetch Records
    const records = await getPatientRecords(patientId);

    res.json({
      success: true,
      data: records
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadRecord: uploadRecordController,
  getMyRecords,
  getDoctorRecords: getDoctorRecordsController,
  getAllRecords: getAllRecordsController,
  verifyRecordIntegrity,
  getPatientHistoryForDoctor,
};
