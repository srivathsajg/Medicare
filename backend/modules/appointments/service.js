const Appointment = require("./models/appointment.model");
const User = require("../users/models/user.model");
const socket = require("../../core/socket");

const reassignAppointment = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate("doctorId");
  if (!appointment) return null;

  const originalDoctor = appointment.doctorId;
  if (!originalDoctor) {
    console.warn(`Original doctor not found for appointment ${appointmentId}. Marking as expired.`);
    appointment.status = "expired";
    await appointment.save();
    return null;
  }
  const originalDoctorId = originalDoctor._id;

  // Find other doctors in the same hospital with the same specialization
  const alternativeDoctors = await User.find({
    role: "doctor",
    hospitalName: originalDoctor.hospitalName,
    specialization: originalDoctor.specialization,
    _id: { $ne: originalDoctorId }
  });

  if (alternativeDoctors.length === 0) {
    console.warn(`No alternative doctors found for Dr. ${originalDoctor.name} at ${originalDoctor.hospitalName}. Marking as expired.`);
    appointment.status = "expired";
    await appointment.save();
    return null;
  }

  // Pick one randomly for now (could be improved by checking load)
  const newDoctor = alternativeDoctors[Math.floor(Math.random() * alternativeDoctors.length)];

  // Update appointment
  appointment.originalDoctorId = originalDoctorId;
  appointment.doctorId = newDoctor._id;
  appointment.isEmergency = true;
  appointment.allocatedBySystem = true;
  appointment.reallocationAccepted = "accepted"; // Automatic
  appointment.lastDoctorActionAt = new Date(); // Reset timer so it doesn't loop

  await appointment.save();

  // Notify via socket
  try {
    const io = socket.getIO();
    // Notify patient
    io.to(String(appointment.patientId)).emit("appointment-reassigned", {
      appointmentId: appointment._id,
      oldDoctorName: originalDoctor.name,
      newDoctorName: newDoctor.name,
      message: `Your appointment has been reassigned to Dr. ${newDoctor.name} due to delay/inactivity.`
    });
    // Notify new doctor
    io.to(String(newDoctor._id)).emit("new-appointment-assigned", {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      message: `A new appointment has been automatically assigned to you.`
    });
  } catch (err) {
    console.warn("Socket notification failed for reassignment:", err.message);
  }

  return appointment;
};

const createAppointment = async ({ patientId, doctorId, date, time, notes }) => {
  const appointment = await Appointment.create({
    patientId,
    doctorId,
    date,
    time,
    notes,
    status: "pending",
  });

  return appointment;
};

const getPatientAppointments = async (patientId) => {
  const appointments = await Appointment.find({ patientId })
    .populate("doctorId", "name specialization")
    .sort({ createdAt: -1 });

  return appointments;
};

const getDoctorAppointments = async (doctorId) => {
  const appointments = await Appointment.find({ doctorId }).sort({
    createdAt: -1,
  });

  return appointments;
};

const getAllAppointments = async () => {
  const appointments = await Appointment.find().sort({ createdAt: -1 });

  return appointments;
};

const updateAppointmentStatus = async ({ id, doctorId, status }) => {
  const allowedStatuses = ["pending", "approved", "completed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid status");
    error.statusCode = 400;
    throw error;
  }

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(appointment.doctorId) !== String(doctorId)) {
    const error = new Error("Not allowed to update this appointment");
    error.statusCode = 403;
    throw error;
  }

  appointment.status = status;
  await appointment.save();

  return appointment;
};

const recordDoctorAction = async (doctorId, patientId) => {
  try {
    const appointment = await Appointment.findOne({
      doctorId,
      patientId,
      status: { $in: ["approved", "pending"] }
    }).sort({ createdAt: -1 });

    if (appointment) {
      appointment.lastDoctorActionAt = new Date();
      await appointment.save();
    }
  } catch (error) {
    console.error("Error recording doctor action:", error);
  }
};

const autoReallocateAppointments = async () => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    // Auto-reallocate if doctor had no action within 15 minutes of creation or last action.
    const appointmentsToReallocate = await Appointment.find({
      status: { $in: ["pending", "approved"] },
      allocatedBySystem: { $ne: true },
      $or: [
        { lastDoctorActionAt: { $lte: fifteenMinsAgo } },
        { lastDoctorActionAt: { $exists: false }, createdAt: { $lte: fifteenMinsAgo } },
        { lastDoctorActionAt: null, createdAt: { $lte: fifteenMinsAgo } }
      ]
    });

    for (const appointment of appointmentsToReallocate) {
      console.log(`Auto-reallocating appointment ${appointment._id} due to inactivity`);
      await reassignAppointment(appointment._id);
    }
  } catch (error) {
    console.error("Error in auto reallocation cron:", error);
  }
};

module.exports = {
  reassignAppointment,
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  recordDoctorAction,
  autoReallocateAppointments,
};

