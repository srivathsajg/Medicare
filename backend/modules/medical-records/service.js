const Record = require("./models/record.model");

const uploadRecord = async ({
  patientId,
  doctorId,
  title,
  description,
  fileUrl,
  ipfsHash,
  sha256Hash,
  hospitalName,
  orderedBy,
}) => {
  const record = await Record.create({
    patientId,
    doctorId,
    title,
    description,
    fileUrl,
    ipfsHash,
    sha256Hash,
    hospitalName,
    orderedBy,
  });

  return record;
};

const getPatientRecords = async (patientId) => {
  const records = await Record.find({ patientId })
    .populate("doctorId", "name role hospitalName")
    .populate("orderedBy", "name role hospitalName")
    .sort({ createdAt: -1 });

  return records;
};

const getDoctorRecords = async (doctorId) => {
  const records = await Record.find({ doctorId })
    .populate("doctorId", "name role hospitalName")
    .populate("orderedBy", "name role hospitalName")
    .sort({ createdAt: -1 });

  return records;
};

const getAllRecords = async () => {
  const records = await Record.find()
    .populate("doctorId", "name role hospitalName")
    .populate("orderedBy", "name role hospitalName")
    .sort({ createdAt: -1 });

  return records;
};

const getRecordById = async (id) => {
  const record = await Record.findById(id)
    .populate("doctorId", "name role hospitalName")
    .populate("orderedBy", "name role hospitalName");
  if (!record) {
    const error = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  return record;
};

module.exports = {
  uploadRecord,
  getPatientRecords,
  getDoctorRecords,
  getAllRecords,
  getRecordById,
};

