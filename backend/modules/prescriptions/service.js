const Prescription = require("./models/prescription.model");
const { recordDoctorAction } = require("../appointments/service");


const createPrescription = async ({
  patientId,
  doctorId,
  appointmentId,
  medicines,
  notes,
  deliveryType,
  wardNumber
}) => {
  const prescription = await Prescription.create({
    patientId,
    doctorId,
    appointmentId,
    medicines,
    notes,
    deliveryType,
    wardNumber
  });

  await recordDoctorAction(doctorId, patientId);

  return prescription;
};

const getPatientPrescriptions = async (patientId) => {
  const prescriptions = await Prescription.find({ patientId }).sort({
    createdAt: -1,
  });

  return prescriptions;
};

const getDoctorPrescriptions = async (doctorId) => {
  const prescriptions = await Prescription.find({ doctorId }).sort({
    createdAt: -1,
  });

  return prescriptions;
};

const getAllPrescriptions = async () => {
  const prescriptions = await Prescription.find().sort({ createdAt: -1 });

  return prescriptions;
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getAllPrescriptions,
};

