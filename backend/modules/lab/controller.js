const labService = require("./service");
const User = require("../users/models/user.model");
const Appointment = require("../appointments/models/appointment.model");
const { logAction } = require("../audit/service");

const getTests = async (req, res, next) => {
  try {
    const tests = await labService.getLabTests();
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { patientId, tests, testName, price } = req.body;
    const doctorId = req.user.id;

    // Get doctor's hospital name
    const doctor = await User.findById(doctorId);
    if (!doctor || !doctor.hospitalName) {
      const error = new Error("Doctor hospital not found");
      error.statusCode = 400;
      throw error;
    }

    const labOrders = [];

    // Handle multiple tests if provided
    if (tests && Array.isArray(tests)) {
      for (const t of tests) {
        const order = await labService.createLabOrder({
          doctorId,
          patientId,
          testName: t.testName,
          price: t.price,
          hospitalName: doctor.hospitalName
        });
        labOrders.push(order);
      }
    } 
    // Handle single test (backward compatibility)
    else if (testName) {
      const order = await labService.createLabOrder({
        doctorId,
        patientId,
        testName,
        price,
        hospitalName: doctor.hospitalName
      });
      labOrders.push(order);
    }

    // Update doctor action timestamp on appointment
    try {
      await Appointment.findOneAndUpdate(
        { doctorId, patientId, status: "approved" },
        { lastDoctorActionAt: new Date() }
      );
    } catch (err) {
      console.warn("Could not update appointment action timestamp:", err.message);
    }

    const patient = await User.findById(patientId).select("name");
    
    // Notify Lab Technician in real-time via hospital room
    try {
      const socket = require("../../core/socket");
      const io = socket.getIO();
      io.to(doctor.hospitalName).emit("new-lab-order-received", {
        patientName: patient?.name || "New Patient",
        testNames: labOrders.map(o => o.testName),
        hospitalName: doctor.hospitalName,
        message: `New lab order received for ${patient?.name || "Patient"}`
      });
    } catch (socketErr) {
      console.warn("Socket notification failed for lab order:", socketErr.message);
    }

    await logAction({
      userId: doctorId,
      role: req.user.role,
      action: "CREATE_LAB_ORDER",
      module: "LAB",
      targetId: labOrders.length > 0 ? labOrders[0]._id : null,
      ipAddress: req.ip,
      details: { 
        patientName: patient?.name || "Unknown Patient",
        patientId,
        testCount: labOrders.length
      }
    });

    res.status(201).json({ success: true, count: labOrders.length, data: labOrders });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    // Get technician's hospital name
    const technicianId = req.user.id;
    const technician = await User.findById(technicianId);
    
    if (!technician || !technician.hospitalName) {
      const error = new Error("Technician hospital not found");
      error.statusCode = 400;
      throw error;
    }

    const orders = await labService.getLabOrders(technician.hospitalName);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getCompletedOrders = async (req, res, next) => {
  try {
    const technicianId = req.user.id;
    const technician = await User.findById(technicianId);
    
    if (!technician || !technician.hospitalName) {
      const error = new Error("Technician hospital not found");
      error.statusCode = 400;
      throw error;
    }

    const orders = await labService.getCompletedLabOrders(technician.hospitalName);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getPatients = async (req, res, next) => {
  try {
    const patients = await labService.getLabPatients();
    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

const uploadReport = async (req, res, next) => {
  try {
    const { orderId, patientId, testName, result, notes } = req.body;
    const reportFile = req.file;

    // Get technician's hospital name
    const technician = await User.findById(req.user.id);
    const hospitalName = technician ? technician.hospitalName : null;

    const record = await labService.uploadLabReport({
      orderId,
      technicianId: req.user.id,
      patientId,
      testName,
      result,
      notes,
      reportFile,
      hospitalName
    });

    const patient = await User.findById(patientId).select("name");

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: "UPLOAD_LAB_REPORT",
      module: "LAB",
      targetId: record._id,
      ipAddress: req.ip,
      details: { 
        testName,
        patientName: patient?.name || "Unknown Patient",
        patientId
      }
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  uploadReport,
  getTests,
  createOrder,
  getOrders,
  getCompletedOrders
};
