const User = require("../users/models/user.model");
const Record = require("../medical-records/models/record.model");
const LabTest = require("./models/labTest.model");
const LabOrder = require("./models/labOrder.model");
const { uploadToIPFS } = require("../../core/services/ipfs.service");
const { logAction } = require("../audit/service");
const { addRecord } = require("../../core/services/blockchain/contract.service");
const crypto = require("crypto");
const { recordDoctorAction } = require("../appointments/service");

const getLabTests = async () => {
  return await LabTest.find({}).sort({ testName: 1 });
};

const createLabOrder = async ({ doctorId, patientId, testName, price, hospitalName }) => {
  const order = await LabOrder.create({
    doctorId,
    patientId,
    testName,
    price,
    hospitalName,
    status: 'pending'
  });
  
  // Storage on Blockchain
  try {
    const recordHash = crypto.createHash('sha256').update(`${testName}-${patientId}-${Date.now()}`).digest('hex');
    const result = await addRecord(recordHash, patientId.toString());
    
    order.blockchainTxHash = result.txHash;
    order.blockchainVerified = true;
    await order.save();

    // Notify Admins
    const io = require("../../core/socket").getIO();
    io.emit("blockchain-record-verified", {
        type: 'LAB_ORDER',
        id: order._id,
        txHash: result.txHash
    });
  } catch (err) {
    console.error("Blockchain error for lab order:", err);
    order.blockchainTxHash = "SIMULATED_" + Date.now();
    order.blockchainVerified = false;
    await order.save();
  }

  await logAction({
    userId: doctorId,
    role: 'doctor',
    action: 'CREATE_LAB_ORDER',
    module: 'LAB',
    targetId: order._id,
    details: { patientId, testName }
  });

  await recordDoctorAction(doctorId, patientId);

  return order;
};

const getLabOrders = async (hospitalName) => {
  return await LabOrder.find({ 
    hospitalName, 
    status: 'pending' 
  })
  .populate('patientId', 'name email')
  .populate('doctorId', 'name')
  .sort({ date: -1 });
};

const getLabPatients = async () => {
  // Find patients who have been recommended lab tests but don't have results yet
  // This logic depends on how lab tests are requested. 
  // For now, let's return all patients who are admitted or have appointments today.
  // Or simpler: All patients. In a real system, we'd filter by 'lab_test_requested' status.
  
  // Let's assume patients with 'admission.isAdmitted: true' need lab monitoring
  const patients = await User.find({ role: 'patient', "admission.isAdmitted": true })
    .select('name email admission')
    .populate('admission.doctorId', 'name');
    
  return patients;
};

const uploadLabReport = async ({ orderId, technicianId, patientId, testName, result, notes, reportFile, hospitalName }) => {
  // Upload file to IPFS (mock or real)
  let ipfsHash = "mock-ipfs-hash";
  if (reportFile) {
      // In a real scenario, handle file upload to IPFS here
      // For now, we simulate it or use the file path if stored locally by multer
      // ipfsHash = await uploadToIPFS(reportFile.path); 
  }

  // Get ordering doctor from lab order
  let orderedBy = null;
  if (orderId) {
    const order = await LabOrder.findById(orderId);
    if (order) {
      orderedBy = order.doctorId;
      if (!hospitalName) hospitalName = order.hospitalName;
    }
  }

  // Create a Medical Record for this Lab Report
  const record = await Record.create({
    patientId,
    doctorId: technicianId,
    orderedBy, // The doctor who ordered the test
    diagnosis: `Lab Test: ${testName}`,
    treatmentPlan: `Result: ${result}`,
    notes: `Technician Notes: ${notes}`,
    labResults: result,
    fileUrl: reportFile ? reportFile.path.replace(/\\/g, '/') : null,
    ipfsHash,
    hospitalName
  });

  // NEW: Blockchain Verification for the Lab Report Record
  try {
    const recordHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({
        patientId,
        testName,
        result,
        timestamp: Date.now()
      }))
      .digest("hex");

    const { txHash, recordId } = await addRecord(recordHash, patientId.toString());
    
    record.blockchainTxHash = txHash;
    record.sha256Hash = recordHash;
    record.blockchainVerified = true;
    await record.save();

    console.log(`Lab Report BC Verified: ${txHash}`);
    
    // Notify via Socket
    try {
      const io = require("../../core/socket").getIO();
      if (io) {
        io.emit("blockchain-record-verified", {
          type: 'LAB_REPORT',
          id: record._id,
          txHash
        });
      }
    } catch (sErr) {
      console.warn("Socket notification failed for lab report verification:", sErr.message);
    }
  } catch (err) {
    console.error("Blockchain anchoring failed for lab report:", err.message);
    // Even if blockchain fails, the record is saved. 
    // We could mark it as simulated if needed, but for now we just log error.
  }

  if (orderId) {
    await LabOrder.findByIdAndUpdate(orderId, { status: 'completed' });
  }

  await logAction({
    userId: technicianId,
    role: 'lab_technician',
    action: 'UPLOAD_LAB_REPORT',
    module: 'LAB',
    targetId: record._id,
    details: { patientId, testName, orderId }
  });

  return record;
};

const getCompletedLabOrders = async (hospitalName) => {
  return await LabOrder.find({ 
    hospitalName, 
    status: 'completed' 
  })
  .populate('patientId', 'name email')
  .populate('doctorId', 'name')
  .sort({ date: -1 });
};

module.exports = {
  getLabPatients,
  uploadLabReport,
  getLabTests,
  createLabOrder,
  getLabOrders,
  getCompletedLabOrders
};
