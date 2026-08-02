const {
  createAutoBillForRecord,
  getPatientBills,
  getDoctorBills,
  getAllBills,
  updatePaymentStatus,
} = require("./service");
const Record = require("../medical-records/models/record.model");

const getMyBills = async (req, res, next) => {
  try {
    const bills = await getPatientBills(req.user.id);

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    console.error("Error fetching patient bills:", error);
    next(error);
  }
};

const createAutoBillController = async (req, res, next) => {
  try {
    const { medicalRecordId, amount } = req.body;

    const record = await Record.findById(medicalRecordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    const bill = await createAutoBillForRecord({
      patientId: record.patientId,
      doctorId: record.doctorId,
      medicalRecordId: record._id,
      amount: amount || 500,
      blockchainTxHash: record.blockchainTxHash,
    });

    res.status(201).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorBillsController = async (req, res, next) => {
  try {
    const bills = await getDoctorBills(req.user.id);

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBillsController = async (req, res, next) => {
  try {
    const bills = await getAllBills();

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatusController = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    const { id } = req.params;

    const bill = await updatePaymentStatus({
      id,
      paymentStatus,
    });

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBills,
  createAutoBill: createAutoBillController,
  getDoctorBills: getDoctorBillsController,
  getAllBills: getAllBillsController,
  updatePaymentStatus: updatePaymentStatusController,
};
