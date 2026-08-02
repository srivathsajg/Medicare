const {
  addRecord: addRecordOnChain,
  getMedicalRecord,
} = require("../../core/services/blockchain/contract.service");
const Record = require("../medical-records/models/record.model");

const addRecord = async (req, res, next) => {
  try {
    const { recordHash, patientId } = req.body;

    const { txHash, recordId } = await addRecordOnChain(recordHash, patientId);

    res.status(201).json({
      success: true,
      txHash,
      recordId,
    });
  } catch (error) {
    next(error);
  }
};

const getRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await getMedicalRecord(id);

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const getDbLinkedRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.json({
      success: true,
      data: {
        diagnosis: record.title,
        treatment: record.description,
        notes: record.fileUrl,
        blockchainTxHash: record.blockchainTxHash || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addRecord,
  getRecord,
  getDbLinkedRecord,
};
