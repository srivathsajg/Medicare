const {
  createEmergencyCase: createEmergencyCaseService,
  getEmergencyCaseById: getEmergencyCaseByIdService,
  getAccessibleEmergencyCases: getAccessibleEmergencyCasesService,
  updateEmergencyStatus: updateEmergencyStatusService,
  updateEmergencyDetails: updateEmergencyDetailsService,
  cancelEmergencyCase: cancelEmergencyCaseService,
} = require("./service");

const getIp = (req) => {
  return (
    req.ip ||
    (req.headers && req.headers["x-forwarded-for"]) ||
    (req.connection && req.connection.remoteAddress) ||
    "127.0.0.1"
  );
};

const createEmergencyCase = async (req, res, next) => {
  try {
    const data = req.body || {};

    if (!data.incidentType) {
      return res.status(400).json({
        success: false,
        message: "incidentType is required",
      });
    }
    if (!data.severity) {
      return res.status(400).json({
        success: false,
        message: "severity is required",
      });
    }

    const result = await createEmergencyCaseService({
      user: req.user,
      data,
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getEmergencyCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await getEmergencyCaseByIdService({
      user: req.user,
      id,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEmergencyCases = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      incidentType: req.query.incidentType,
      assignedHospital: req.query.assignedHospital,
    };

    const result = await getAccessibleEmergencyCasesService({
      user: req.user,
      filters,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateEmergencyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancelledReason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const result = await updateEmergencyStatusService({
      user: req.user,
      id,
      newStatus: status,
      cancelledReason,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateEmergencyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const result = await updateEmergencyDetailsService({
      user: req.user,
      id,
      data,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cancelEmergencyCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancelledReason } = req.body || {};

    const result = await cancelEmergencyCaseService({
      user: req.user,
      id,
      cancelledReason,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      message: "Emergency case cancelled",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmergencyCase,
  getEmergencyCaseById,
  getMyEmergencyCases,
  updateEmergencyStatus,
  updateEmergencyDetails,
  cancelEmergencyCase,
};
