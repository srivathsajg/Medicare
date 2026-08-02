const Insurance = require("./models/insurance.model");
const Bill = require("../billing/models/bill.model");
const Record = require("../medical-records/models/record.model");
const { getMedicalRecord } = require("../../core/services/blockchain/contract.service");

const createVerifiedClaim = async ({ patientId, billingId, description }) => {
  const bill = await Bill.findById(billingId);

  if (!bill) {
    const error = new Error("Billing not found");
    error.statusCode = 404;
    throw error;
  }

  const record = await Record.findById(bill.medicalRecordId);

  if (!record || !record.blockchainTxHash || record.blockchainRecordId === undefined) {
    const error = new Error("Blockchain verification failed");
    error.statusCode = 400;
    throw error;
  }

  try {
    await getMedicalRecord(record.blockchainRecordId);
  } catch (err) {
    const error = new Error("Blockchain verification failed");
    error.statusCode = 400;
    throw error;
  }

  const claim = await Insurance.create({
    patientId,
    billingId,
    claimStatus: "submitted",
    verificationStatus: "verified",
    description,
  });

  return {
    claim,
    bill,
    record,
  };
};

const getPatientClaims = async (patientId) => {
  const claims = await Insurance.find({ patientId }).sort({ createdAt: -1 });

  return claims;
};

const getAllClaims = async () => {
  const claims = await Insurance.find().sort({ createdAt: -1 });

  return claims;
};

const updateClaimStatus = async ({ id, claimStatus }) => {
  const allowedStatuses = ["submitted", "approved", "rejected"];

  if (!allowedStatuses.includes(claimStatus)) {
    const error = new Error("Invalid claim status");
    error.statusCode = 400;
    throw error;
  }

  const claim = await Insurance.findById(id);

  if (!claim) {
    const error = new Error("Claim not found");
    error.statusCode = 404;
    throw error;
  }

  claim.claimStatus = claimStatus;
  await claim.save();

  return claim;
};

module.exports = {
  createVerifiedClaim,
  getPatientClaims,
  getAllClaims,
  updateClaimStatus,
};
