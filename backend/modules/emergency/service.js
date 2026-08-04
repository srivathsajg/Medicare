const mongoose = require("mongoose");

const EmergencyCase = require("./models/emergencyCase.model");
const User = require("../users/models/user.model");
const { logAction } = require("../audit/service");
const socket = require("../../core/socket");

const LIFECYCLE_ORDER = [
  "REPORTED",
  "AMBULANCE_REQUESTED",
  "AMBULANCE_ASSIGNED",
  "AMBULANCE_ARRIVED",
  "PATIENT_IDENTIFIED",
  "IN_TRANSIT",
  "HOSPITAL_PREPARED",
  "ARRIVED_AT_HOSPITAL",
  "UNDER_TREATMENT",
  "CLOSED",
];

const VALID_TRANSITIONS = {
  REPORTED: ["AMBULANCE_REQUESTED", "CANCELLED"],
  AMBULANCE_REQUESTED: ["AMBULANCE_ASSIGNED", "REPORTED", "CANCELLED"],
  AMBULANCE_ASSIGNED: ["AMBULANCE_ARRIVED", "AMBULANCE_REQUESTED", "CANCELLED"],
  AMBULANCE_ARRIVED: ["PATIENT_IDENTIFIED", "AMBULANCE_ASSIGNED"],
  PATIENT_IDENTIFIED: ["IN_TRANSIT", "AMBULANCE_ARRIVED"],
  IN_TRANSIT: ["HOSPITAL_PREPARED", "ARRIVED_AT_HOSPITAL", "PATIENT_IDENTIFIED"],
  HOSPITAL_PREPARED: ["ARRIVED_AT_HOSPITAL", "IN_TRANSIT"],
  ARRIVED_AT_HOSPITAL: ["UNDER_TREATMENT", "HOSPITAL_PREPARED"],
  UNDER_TREATMENT: ["CLOSED", "ARRIVED_AT_HOSPITAL"],
  CLOSED: [],
  CANCELLED: [],
};

const isTerminalStatus = (status) => status === "CLOSED" || status === "CANCELLED";

const isValidStatusTransition = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  const allowed = VALID_TRANSITIONS[fromStatus];
  return !!allowed && allowed.includes(toStatus);
};

const assertValidStatusTransition = (fromStatus, toStatus) => {
  if (isTerminalStatus(fromStatus) && fromStatus !== toStatus) {
    const err = new Error(`Illegal transition: ${fromStatus} is terminal and cannot be changed`);
    err.statusCode = 400;
    throw err;
  }
  if (!isValidStatusTransition(fromStatus, toStatus)) {
    const allowed = VALID_TRANSITIONS[fromStatus] || [];
    const allowedStr = allowed.length > 0 ? allowed.join(", ") : "(none)";
    const err = new Error(
      `Illegal status transition ${fromStatus} → ${toStatus}. Allowed from ${fromStatus}: ${allowedStr}`
    );
    err.statusCode = 400;
    throw err;
  }
};

const buildAccessQuery = (user) => {
  const role = user.role;

  switch (role) {
    case "admin":
      return {};
    case "doctor": {
      return {
        $or: [
          { assignedDoctor: new mongoose.Types.ObjectId(user.id) },
          { reportedBy: new mongoose.Types.ObjectId(user.id) },
        ],
      };
    }
    case "patient": {
      const uid = new mongoose.Types.ObjectId(user.id);
      return {
        $or: [
          { patient: uid },
          { reportedBy: uid },
        ],
      };
    }
    case "ambulance": {
      return {
        $or: [
          { assignedAmbulance: new mongoose.Types.ObjectId(user.id) },
          { reportedBy: new mongoose.Types.ObjectId(user.id) },
        ],
      };
    }
    case "police": {
      return {
        $or: [
          { assignedPoliceOfficer: new mongoose.Types.ObjectId(user.id) },
          { reportedBy: new mongoose.Types.ObjectId(user.id) },
        ],
      };
    }
    default:
      return { reportedBy: new mongoose.Types.ObjectId(user.id) };
  }
};

const canViewCase = (user, emergencyCase) => {
  if (user.role === "admin") return true;

  const userId = String(user.id);
  if (String(emergencyCase.reportedBy) === userId) return true;
  if (emergencyCase.patient && String(emergencyCase.patient) === userId) return true;
  if (emergencyCase.assignedDoctor && String(emergencyCase.assignedDoctor) === userId) return true;
  if (emergencyCase.assignedAmbulance && String(emergencyCase.assignedAmbulance) === userId) return true;
  if (emergencyCase.assignedPoliceOfficer && String(emergencyCase.assignedPoliceOfficer) === userId) return true;

  if (user.role === "doctor" && emergencyCase.assignedHospital && user.hospitalName) {
    if (emergencyCase.assignedHospital.toLowerCase() === user.hospitalName.toLowerCase()) {
      return true;
    }
  }

  return false;
};

const canUpdateDetails = (user, emergencyCase) => {
  if (user.role === "admin") return true;

  const userId = String(user.id);
  if (emergencyCase.status === "REPORTED" && String(emergencyCase.reportedBy) === userId) {
    return true;
  }
  if (emergencyCase.assignedDoctor && String(emergencyCase.assignedDoctor) === userId) return true;
  if (emergencyCase.assignedAmbulance && String(emergencyCase.assignedAmbulance) === userId) return true;
  if (emergencyCase.assignedPoliceOfficer && String(emergencyCase.assignedPoliceOfficer) === userId) return true;

  if (user.role === "doctor" && emergencyCase.assignedHospital && user.hospitalName) {
    if (emergencyCase.assignedHospital.toLowerCase() === user.hospitalName.toLowerCase()) {
      return true;
    }
  }

  return false;
};

const canUpdateStatus = (user, emergencyCase, newStatus) => {
  if (user.role === "admin") return true;

  const userId = String(user.id);

  if (newStatus === "CANCELLED") {
    if (String(emergencyCase.reportedBy) === userId && emergencyCase.status === "REPORTED") {
      return true;
    }
    return false;
  }

  if (emergencyCase.assignedDoctor && String(emergencyCase.assignedDoctor) === userId) return true;
  if (emergencyCase.assignedAmbulance && String(emergencyCase.assignedAmbulance) === userId) return true;

  if (user.role === "doctor" && emergencyCase.assignedHospital && user.hospitalName) {
    if (emergencyCase.assignedHospital.toLowerCase() === user.hospitalName.toLowerCase()) {
      return true;
    }
  }

  return false;
};

const canCancelCase = (user, emergencyCase) => {
  if (user.role === "admin") return true;
  const userId = String(user.id);
  return (
    emergencyCase.status === "REPORTED" &&
    String(emergencyCase.reportedBy) === userId
  );
};

const validateIncidentType = (value) => {
  if (!EmergencyCase.INCIDENT_TYPES.includes(value)) {
    const err = new Error(`Invalid incidentType. Allowed: ${EmergencyCase.INCIDENT_TYPES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
};

const validateSeverity = (value) => {
  if (!EmergencyCase.SEVERITY_LEVELS.includes(value)) {
    const err = new Error(`Invalid severity. Allowed: ${EmergencyCase.SEVERITY_LEVELS.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
};

const validateStatus = (value) => {
  if (!EmergencyCase.STATUSES.includes(value)) {
    const err = new Error(`Invalid status. Allowed: ${EmergencyCase.STATUSES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
};

const emitSocket = (event, payload) => {
  try {
    const io = socket.getIO();
    io.emit(event, payload);
  } catch (err) {
    console.warn("Emergency socket emit skipped:", err.message);
  }
};

const emitCaseSocket = (event, emergencyCase, extra = {}) => {
  try {
    const io = socket.getIO();
    const payload = {
      emergencyCaseId: emergencyCase._id,
      status: emergencyCase.status,
      severity: emergencyCase.severity,
      incidentType: emergencyCase.incidentType,
      patientId: emergencyCase.patient ? emergencyCase.patient.toString() : null,
      assignedHospital: emergencyCase.assignedHospital || null,
      ...extra,
    };

    io.emit(event, payload);

    if (emergencyCase.patient) {
      io.to(String(emergencyCase.patient)).emit(event, payload);
    }
    if (emergencyCase.assignedDoctor) {
      io.to(String(emergencyCase.assignedDoctor)).emit(event, payload);
    }
    if (emergencyCase.assignedAmbulance) {
      io.to(String(emergencyCase.assignedAmbulance)).emit(event, payload);
    }
    if (emergencyCase.assignedPoliceOfficer) {
      io.to(String(emergencyCase.assignedPoliceOfficer)).emit(event, payload);
    }
  } catch (err) {
    console.warn("Emergency case socket emit skipped:", err.message);
  }
};

const createEmergencyCase = async ({ user, data, ipAddress }) => {
  const {
    patient,
    incidentType,
    description,
    severity,
    location,
    assignedHospital,
    assignedDoctor,
    linkedAppointmentId,
    notes,
  } = data;

  validateIncidentType(incidentType);
  validateSeverity(severity);

  if (patient) {
    const patientExists = await User.exists({ _id: patient, role: "patient" });
    if (!patientExists) {
      const err = new Error("Patient not found");
      err.statusCode = 404;
      throw err;
    }
  }

  if (assignedDoctor) {
    const doctorExists = await User.exists({ _id: assignedDoctor, role: "doctor" });
    if (!doctorExists) {
      const err = new Error("Assigned doctor not found");
      err.statusCode = 404;
      throw err;
    }
  }

  const emergencyCase = new EmergencyCase({
    patient: patient ? new mongoose.Types.ObjectId(patient) : undefined,
    reportedBy: new mongoose.Types.ObjectId(user.id),
    incidentType,
    description: description || "",
    severity,
    location: location || {},
    assignedHospital: assignedHospital || undefined,
    assignedDoctor: assignedDoctor ? new mongoose.Types.ObjectId(assignedDoctor) : undefined,
    linkedAppointmentId: linkedAppointmentId
      ? new mongoose.Types.ObjectId(linkedAppointmentId)
      : undefined,
    notes: notes || undefined,
    status: "REPORTED",
  });

  emergencyCase.statusTimestamps = new Map([["REPORTED", new Date()]]);

  await emergencyCase.save();

  await logAction({
    userId: new mongoose.Types.ObjectId(user.id),
    role: user.role,
    action: "EMERGENCY_CASE_CREATED",
    module: "EMERGENCY",
    targetId: emergencyCase._id.toString(),
    ipAddress,
    details: {
      incidentType,
      severity,
      assignedHospital: assignedHospital || null,
      patientId: patient || null,
    },
  });

  emitCaseSocket("emergency-created", emergencyCase, {
    createdBy: user.id,
  });

  const populated = await EmergencyCase.findById(emergencyCase._id)
    .populate("patient", "name email phone bloodGroup healthSummary")
    .populate("reportedBy", "name role email")
    .populate("assignedDoctor", "name specialization hospitalName")
    .populate("assignedAmbulance", "name phone")
    .populate("assignedPoliceOfficer", "name phone")
    .lean();

  return populated;
};

const getEmergencyCaseById = async ({ user, id, ipAddress }) => {
  const emergencyCase = await EmergencyCase.findById(id)
    .populate("patient", "name email phone bloodGroup gender dob healthSummary guardianNumber residentialAddress profileImage")
    .populate("reportedBy", "name role email")
    .populate("assignedDoctor", "name specialization hospitalName")
    .populate("assignedAmbulance", "name phone")
    .populate("assignedPoliceOfficer", "name phone")
    .populate("linkedAppointmentId", "status date time");

  if (!emergencyCase) {
    const err = new Error("Emergency case not found");
    err.statusCode = 404;
    throw err;
  }

  if (!canViewCase(user, emergencyCase)) {
    const err = new Error("Forbidden: Not authorized to access this emergency case");
    err.statusCode = 403;
    throw err;
  }

  await logAction({
    userId: new mongoose.Types.ObjectId(user.id),
    role: user.role,
    action: "EMERGENCY_CASE_ACCESSED",
    module: "EMERGENCY",
    targetId: emergencyCase._id.toString(),
    ipAddress,
    details: {
      patientId: emergencyCase.patient ? emergencyCase.patient._id.toString() : null,
      status: emergencyCase.status,
    },
  });

  return emergencyCase;
};

const getAccessibleEmergencyCases = async ({ user, filters = {} }) => {
  const query = buildAccessQuery(user);

  if (filters.status) {
    validateStatus(filters.status);
    query.status = filters.status;
  }
  if (filters.severity) {
    validateSeverity(filters.severity);
    query.severity = filters.severity;
  }
  if (filters.incidentType) {
    validateIncidentType(filters.incidentType);
    query.incidentType = filters.incidentType;
  }
  if (filters.assignedHospital) {
    query.assignedHospital = { $regex: filters.assignedHospital, $options: "i" };
  }

  const cases = await EmergencyCase.find(query)
    .populate("patient", "name email phone bloodGroup")
    .populate("reportedBy", "name role")
    .populate("assignedDoctor", "name specialization hospitalName")
    .populate("assignedAmbulance", "name phone")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return cases;
};

const updateEmergencyStatus = async ({ user, id, newStatus, ipAddress, cancelledReason }) => {
  validateStatus(newStatus);

  const emergencyCase = await EmergencyCase.findById(id);
  if (!emergencyCase) {
    const err = new Error("Emergency case not found");
    err.statusCode = 404;
    throw err;
  }

  if (newStatus === "CANCELLED") {
    if (!canCancelCase(user, emergencyCase)) {
      const err = new Error("Forbidden: Not authorized to cancel this emergency case");
      err.statusCode = 403;
      throw err;
    }
  } else {
    if (!canUpdateStatus(user, emergencyCase, newStatus)) {
      const err = new Error("Forbidden: Not authorized to update status");
      err.statusCode = 403;
      throw err;
    }
  }

  assertValidStatusTransition(emergencyCase.status, newStatus);

  const oldStatus = emergencyCase.status;
  emergencyCase.status = newStatus;

  if (!emergencyCase.statusTimestamps) {
    emergencyCase.statusTimestamps = new Map();
  }
  emergencyCase.statusTimestamps.set(newStatus, new Date());

  if (newStatus === "CANCELLED" && cancelledReason) {
    emergencyCase.cancelledReason = cancelledReason;
  }

  await emergencyCase.save();

  await logAction({
    userId: new mongoose.Types.ObjectId(user.id),
    role: user.role,
    action: "EMERGENCY_STATUS_UPDATED",
    module: "EMERGENCY",
    targetId: emergencyCase._id.toString(),
    ipAddress,
    details: {
      oldStatus,
      newStatus,
      cancelledReason: cancelledReason || null,
    },
  });

  emitCaseSocket("emergency-status-updated", emergencyCase, {
    oldStatus,
    updatedBy: user.id,
  });

  if (newStatus === "AMBULANCE_ASSIGNED" && emergencyCase.assignedAmbulance) {
    emitSocket("ambulance-assigned", {
      emergencyCaseId: emergencyCase._id,
      assignedAmbulance: emergencyCase.assignedAmbulance.toString(),
    });
  }

  if (
    newStatus === "HOSPITAL_PREPARED" ||
    newStatus === "ARRIVED_AT_HOSPITAL" ||
    (newStatus === "IN_TRANSIT" && emergencyCase.assignedHospital)
  ) {
    emitSocket("hospital-emergency-alert", {
      emergencyCaseId: emergencyCase._id,
      status: newStatus,
      assignedHospital: emergencyCase.assignedHospital,
      patientId: emergencyCase.patient ? emergencyCase.patient.toString() : null,
      severity: emergencyCase.severity,
    });
  }

  const populated = await EmergencyCase.findById(emergencyCase._id)
    .populate("patient", "name email phone bloodGroup")
    .populate("reportedBy", "name role")
    .populate("assignedDoctor", "name specialization hospitalName")
    .populate("assignedAmbulance", "name phone")
    .populate("assignedPoliceOfficer", "name phone")
    .lean();

  return populated;
};

const updateEmergencyDetails = async ({ user, id, data, ipAddress }) => {
  const emergencyCase = await EmergencyCase.findById(id);
  if (!emergencyCase) {
    const err = new Error("Emergency case not found");
    err.statusCode = 404;
    throw err;
  }

  if (!canUpdateDetails(user, emergencyCase)) {
    const err = new Error("Forbidden: Not authorized to update this emergency case");
    err.statusCode = 403;
    throw err;
  }

  if (emergencyCase.status === "CLOSED" || emergencyCase.status === "CANCELLED") {
    const err = new Error(`Cannot modify a ${emergencyCase.status.toLowerCase()} case`);
    err.statusCode = 400;
    throw err;
  }

  const changedFields = {};

  if (data.incidentType !== undefined) {
    validateIncidentType(data.incidentType);
    emergencyCase.incidentType = data.incidentType;
    changedFields.incidentType = data.incidentType;
  }
  if (data.severity !== undefined) {
    validateSeverity(data.severity);
    emergencyCase.severity = data.severity;
    changedFields.severity = data.severity;
  }
  if (data.description !== undefined) {
    emergencyCase.description = data.description;
    changedFields.description = true;
  }
  if (data.location !== undefined) {
    emergencyCase.location = {
      ...(emergencyCase.location || {}),
      ...data.location,
    };
    changedFields.location = true;
  }
  if (data.notes !== undefined) {
    emergencyCase.notes = data.notes;
    changedFields.notes = true;
  }
  if (data.assignedHospital !== undefined) {
    emergencyCase.assignedHospital = data.assignedHospital;
    changedFields.assignedHospital = data.assignedHospital;
  }

  if (data.assignedDoctor !== undefined) {
    if (data.assignedDoctor === null) {
      emergencyCase.assignedDoctor = undefined;
      changedFields.assignedDoctor = null;
    } else {
      const doctorExists = await User.exists({ _id: data.assignedDoctor, role: "doctor" });
      if (!doctorExists) {
        const err = new Error("Assigned doctor not found");
        err.statusCode = 404;
        throw err;
      }
      emergencyCase.assignedDoctor = new mongoose.Types.ObjectId(data.assignedDoctor);
      changedFields.assignedDoctor = data.assignedDoctor;
    }
  }

  if (data.assignedAmbulance !== undefined) {
    if (data.assignedAmbulance === null) {
      emergencyCase.assignedAmbulance = undefined;
      changedFields.assignedAmbulance = null;
    } else {
      const crewExists = await User.exists({ _id: data.assignedAmbulance });
      if (!crewExists) {
        const err = new Error("Assigned ambulance personnel not found");
        err.statusCode = 404;
        throw err;
      }
      emergencyCase.assignedAmbulance = new mongoose.Types.ObjectId(data.assignedAmbulance);
      changedFields.assignedAmbulance = data.assignedAmbulance;
    }
  }

  if (data.assignedPoliceOfficer !== undefined) {
    if (data.assignedPoliceOfficer === null) {
      emergencyCase.assignedPoliceOfficer = undefined;
      changedFields.assignedPoliceOfficer = null;
    } else {
      const officerExists = await User.exists({ _id: data.assignedPoliceOfficer });
      if (!officerExists) {
        const err = new Error("Assigned police officer not found");
        err.statusCode = 404;
        throw err;
      }
      emergencyCase.assignedPoliceOfficer = new mongoose.Types.ObjectId(data.assignedPoliceOfficer);
      changedFields.assignedPoliceOfficer = data.assignedPoliceOfficer;
    }
  }

  if (data.patient !== undefined) {
    if (data.patient === null) {
      emergencyCase.patient = undefined;
      changedFields.patient = null;
    } else {
      const patientExists = await User.exists({ _id: data.patient, role: "patient" });
      if (!patientExists) {
        const err = new Error("Patient not found");
        err.statusCode = 404;
        throw err;
      }
      emergencyCase.patient = new mongoose.Types.ObjectId(data.patient);
      changedFields.patient = data.patient;
    }
  }

  await emergencyCase.save();

  await logAction({
    userId: new mongoose.Types.ObjectId(user.id),
    role: user.role,
    action: "EMERGENCY_CASE_DETAILS_UPDATED",
    module: "EMERGENCY",
    targetId: emergencyCase._id.toString(),
    ipAddress,
    details: changedFields,
  });

  emitCaseSocket("emergency-updated", emergencyCase, {
    changedFields: Object.keys(changedFields),
    updatedBy: user.id,
  });

  const populated = await EmergencyCase.findById(emergencyCase._id)
    .populate("patient", "name email phone bloodGroup")
    .populate("reportedBy", "name role")
    .populate("assignedDoctor", "name specialization hospitalName")
    .populate("assignedAmbulance", "name phone")
    .populate("assignedPoliceOfficer", "name phone")
    .lean();

  return populated;
};

const cancelEmergencyCase = async ({ user, id, cancelledReason, ipAddress }) => {
  return updateEmergencyStatus({
    user,
    id,
    newStatus: "CANCELLED",
    cancelledReason,
    ipAddress,
  });
};

module.exports = {
  createEmergencyCase,
  getEmergencyCaseById,
  getAccessibleEmergencyCases,
  updateEmergencyStatus,
  updateEmergencyDetails,
  cancelEmergencyCase,
  INCIDENT_TYPES: EmergencyCase.INCIDENT_TYPES,
  SEVERITY_LEVELS: EmergencyCase.SEVERITY_LEVELS,
  STATUSES: EmergencyCase.STATUSES,
  LIFECYCLE_ORDER,
  VALID_TRANSITIONS,
  isTerminalStatus,
  isValidStatusTransition,
  assertValidStatusTransition,
};
