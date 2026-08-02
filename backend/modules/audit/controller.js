const { getAuditLogs, getLogsByTargetId, getPatientLogs } = require("./service");
const User = require("../users/models/user.model");
const Appointment = require("../appointments/models/appointment.model");

const getAdminAuditLogs = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.id);
    const logs = await getAuditLogs();

    let filteredLogs = logs;
    if (admin && admin.hospitalName) {
        // Find all doctors of this hospital
        const doctors = await User.find({ role: "doctor", hospitalName: admin.hospitalName }, "_id");
        const doctorIds = doctors.map(d => d._id);

        // Find all patients who booked an appointment with these doctors
        const appointments = await Appointment.find({ doctorId: { $in: doctorIds } }, "patientId");
        const patientIds = appointments.map(a => a.patientId.toString());

        filteredLogs = logs.filter(log => {
            if (!log.userId) return false;
            
            // Allow if user is staff belonging to this hospital
            if (log.userId.hospitalName === admin.hospitalName) return true;
            
            // Allow if user is a patient admitted here OR booked an appointment here
            if (log.userId.role === 'patient') {
                if (log.userId.admission && log.userId.admission.hospitalName === admin.hospitalName) return true;
                if (patientIds.includes(log.userId._id.toString())) return true;
            }
            
            return false;
        });
    }

    res.json({
      success: true,
      data: filteredLogs,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientAccessLogs = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const logs = await getPatientLogs(patientId);
    
    // Filter out actions where the user themselves accessed their own data (optional, but requested "who viewed them")
    // If patientId is the user, then we might want to exclude logs where userId == patientId
    const accessLogs = logs.filter(log => 
        log.userId && log.userId._id.toString() !== patientId
    );

    res.json({
      success: true,
      data: accessLogs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminAuditLogs,
  getPatientAccessLogs,
};
