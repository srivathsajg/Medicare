const Audit = require("./models/audit.model");

const logAction = async ({ userId, role, action, module, targetId, ipAddress, details }) => {
  try {
    // If ipAddress is ::1, convert to 127.0.0.1 for readability
    const normalizedIp = ipAddress === "::1" ? "127.0.0.1" : ipAddress;
    
    await Audit.create({
      userId,
      role,
      action,
      module,
      targetId,
      ipAddress: normalizedIp,
      details,
    });
  } catch (error) {
    console.error("Audit Logging Failed:", error.message);
    // Do not throw error to avoid blocking the main flow
  }
};

const getAuditLogs = async () => {
  // Sort by newest first
  const logs = await Audit.find().sort({ timestamp: -1 }).populate("userId", "name email role hospitalName");
  return logs;
};

const getLogsByTargetId = async (targetId) => {
  const logs = await Audit.find({ targetId }).sort({ timestamp: -1 }).populate("userId", "name email");
  return logs;
};

const getPatientLogs = async (patientId) => {
  // Find logs where the target is the patient OR where the patient is involved (e.g. creating a record for them)
  const logs = await Audit.find({
    $or: [
      { targetId: patientId },
      { "details.patientId": patientId }
    ]
  }).sort({ timestamp: -1 }).populate("userId", "name email");
  return logs;
};

module.exports = {
  logAction,
  getAuditLogs,
  getLogsByTargetId,
  getPatientLogs,
};
