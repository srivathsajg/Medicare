const {
  createVerifiedClaim,
  getPatientClaims,
  getAllClaims,
  updateClaimStatus,
} = require("./service");
const { logAction } = require("../audit/service");

const { createPharmacyOrder } = require("../pharmacy-orders/service");
const Bill = require("../billing/models/bill.model");

const createClaimController = async (req, res, next) => {
  try {
    const { billingId, description } = req.body;

    const { claim, bill, record } = await createVerifiedClaim({
      patientId: req.user.id,
      billingId,
      description,
    });

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "INSURANCE_CLAIM_SUBMIT",
      module: "INSURANCE",
      targetId: claim._id || billingId,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        medicalRecordId: record._id,
        billingId: bill._id,
        blockchainTxHash: record.blockchainTxHash || null,
        claimStatus: claim.claimStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyClaims = async (req, res, next) => {
  try {
    const claims = await getPatientClaims(req.user.id);

    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

const getAllClaimsController = async (req, res, next) => {
  try {
    const claims = await getAllClaims();

    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

const updateClaimStatusController = async (req, res, next) => {
  try {
    const { claimStatus } = req.body;
    const { id } = req.params;

    const claim = await updateClaimStatus({
      id,
      claimStatus,
    });

    if (claimStatus === "approved") {
      // Logic for pharmacy order auto-creation on insurance approval removed.
      // Now triggered directly from Prescription creation.
    }

    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim: createClaimController,
  getMyClaims,
  getAllClaims: getAllClaimsController,
  updateClaimStatus: updateClaimStatusController,
};
