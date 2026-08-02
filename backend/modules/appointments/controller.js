const {
  createAppointment: createAppointmentService,
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus: updateAppointmentStatusService,
  reassignAppointment,
} = require("./service");

const { getIO } = require("../../core/socket");

const createAppointmentController = async (req, res, next) => {
  try {
    const { doctorId, date, time, notes } = req.body;

    const appointment = await createAppointmentService({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      notes,
    });

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await getPatientAppointments(req.user.id);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorAppointmentsController = async (req, res, next) => {
  try {
    const appointments = await getDoctorAppointments(req.user.id);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

const getAllAppointmentsController = async (req, res, next) => {
  try {
    const appointments = await getAllAppointments();

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatusController = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const appointment = await updateAppointmentStatusService({
      id,
      doctorId: req.user.id,
      status,
    });

    try {
      const io = getIO();
      io.to(String(appointment.patientId)).emit("appointment-updated", {
        status: appointment.status,
        patientId: appointment.patientId,
        message: `Your appointment has been ${appointment.status}`,
      });
      
      if (status === 'approved') {
        io.to(String(appointment.patientId)).emit("appointment-approved", {
           message: `Your appointment has been approved!`,
        });
      }
    } catch (socketError) {
      console.error("Socket notification failed:", socketError.message);
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const reportDelayController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Appointment = require("./models/appointment.model");
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    
    if (String(appointment.doctorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not allowed to reassign this appointment" });
    }

    const newApt = await reassignAppointment(id);
    
    if (!newApt) {
      return res.status(400).json({ success: false, message: "Could not reassign. No alternative doctors found." });
    }

    res.json({
      success: true,
      message: "Patient has been reassigned successfully.",
      data: newApt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment: createAppointmentController,
  getMyAppointments,
  getDoctorAppointments: getDoctorAppointmentsController,
  getAllAppointments: getAllAppointmentsController,
  updateAppointmentStatus: updateAppointmentStatusController,
  reportDelay: reportDelayController,
};

