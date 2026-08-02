const Bill = require("./models/bill.model");
const Record = require("../medical-records/models/record.model");

const createAutoBillForRecord = async ({
  patientId,
  doctorId,
  medicalRecordId,
  amount,
  blockchainTxHash,
}) => {
  const bill = await Bill.create({
    patientId,
    doctorId,
    medicalRecordId,
    amount,
    status: "pending",
    blockchainTxHash,
  });

  return bill;
};

const getPatientBills = async (patientId) => {
  const bills = await Bill.find({ patientId })
    .sort({ createdAt: -1 })
    .populate('doctorId', 'name hospitalName hospitalAddress specialization')
    .populate('patientId', 'name email')
    .populate('prescriptionId', 'medicines createdAt');

  return bills;
};

const getDoctorBills = async (doctorId) => {
  const bills = await Bill.find({ doctorId })
    .sort({ createdAt: -1 })
    .populate('doctorId', 'name hospitalName hospitalAddress specialization')
    .populate('patientId', 'name email')
    .populate('prescriptionId', 'medicines createdAt');

  return bills;
};

const getAllBills = async () => {
  const bills = await Bill.find()
    .sort({ createdAt: -1 })
    .populate('doctorId', 'name hospitalName hospitalAddress specialization')
    .populate('patientId', 'name email')
    .populate('prescriptionId', 'medicines createdAt');

  return bills;
};

const updatePaymentStatus = async ({ id, paymentStatus }) => {
  const allowedStatuses = ["pending", "paid"];

  if (!allowedStatuses.includes(paymentStatus)) {
    const error = new Error("Invalid payment status");
    error.statusCode = 400;
    throw error;
  }

  const bill = await Bill.findById(id);

  if (!bill) {
    const error = new Error("Bill not found");
    error.statusCode = 404;
    throw error;
  }

  bill.status = paymentStatus;
  await bill.save();

  return bill;
};

module.exports = {
  createAutoBillForRecord,
  getPatientBills,
  getDoctorBills,
  getAllBills,
  updatePaymentStatus,
};
