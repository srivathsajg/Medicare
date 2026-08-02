const Order = require("./models/order.model");
const Prescription = require("../prescriptions/models/prescription.model");
const Bill = require("../billing/models/bill.model");
const LabOrder = require("../lab/models/labOrder.model");
const { encrypt } = require("../../utils/encryption");
const { createDelivery } = require("../delivery-tracking/service");
const inventoryService = require("../inventory/service");
const socket = require("../../core/socket");

const createOrder = async ({ patientId, prescriptionId, medicines, billAmount, doctorId, isAdmitted, wardNumber, roomNo, isEmergency, hospitalName, hospitalAddress }) => {
  const deliveryType = isAdmitted ? "WARD_DELIVERY" : "HAND_OVER";
  
  const order = await Order.create({
    patientId,
    prescriptionId,
    medicines,
    billAmount,
    doctorId,
    isAdmitted,
    wardNumber,
    roomNo,
    isEmergency: !!isEmergency,
    deliveryType,
    hospitalName,
    hospitalAddress,
    status: "processing"
  });

  // Emit socket event for real-time notification to pharmacists
  try {
    const io = socket.getIO();
    // Emit to a specific hospital room for pharmacists
    io.to(hospitalName || "General").emit("new-pharmacy-order", {
      orderId: order._id,
      patientId: order.patientId,
      status: order.status,
      hospitalName: order.hospitalName,
      message: `New pharmacy order received for patient.`
    });
  } catch (socketErr) {
    console.warn("Socket notification failed for new pharmacy order:", socketErr.message);
  }

  return order;
};

const createPharmacyOrder = async ({ patientId, doctorId, medicalRecordId, insuranceId, medicines }) => {
  // Encrypt notes/sensitive info
  const notes = `Auto-generated order from Medical Record ${medicalRecordId} and Insurance ${insuranceId}`;
  const encryptedNotes = encrypt(notes);

  const order = await Order.create({
    patientId,
    doctorId,
    medicalRecordId,
    medicines: medicines || ["Mock Medicine A", "Mock Medicine B"],
    encryptedNotes,
    status: "processing"
  });
  
  console.log("Pharmacy order created after insurance approval");
  return order;
};

const getPatientOrders = async (patientId) => {
  const orders = await Order.find({ patientId }).sort({ createdAt: -1 });

  return orders;
};

const getPharmacistOrders = async (pharmacistId, hospitalName) => {
  const query = pharmacistId ? { pharmacistId } : {};
  // If the pharmacist wants to see orders they processed OR orders that belong to their hospital
  // But usually this means "orders assigned to me". We should just ensure it works.
  
  const orders = await Order.find(query)
    .populate("patientId", "name email")
    .populate("doctorId", "name hospitalName")
    .populate("prescriptionId", "medicines createdAt")
    .sort({ createdAt: -1 });

  return orders;
};

const getDoctorOrders = async (doctorId) => {
  const orders = await Order.find({ doctorId }).sort({ createdAt: -1 });
  return orders;
};

const getAllOrders = async () => {
  const orders = await Order.find().sort({ createdAt: -1 });

  return orders;
};

const getPendingOrders = async (hospitalName) => {
  const query = { status: { $in: ["pending", "processing", "preparing"] } };
  
  // If hospitalName is provided, filter by it. Handle exact matches and cases where it might be undefined/null in legacy data.
  if (hospitalName) {
    query.$or = [
      { hospitalName: hospitalName },
      { hospitalName: { $exists: false } },
      { hospitalName: null },
      { hospitalName: "" }
    ];
  }

  const orders = await Order.find(query)
    .populate("patientId", "name email")
    .populate("doctorId", "name hospitalName")
    .populate("prescriptionId", "medicines createdAt")
    .sort({ createdAt: 1 });
  return orders;
};

const updateOrderStatus = async ({ id, pharmacistId, status, deliveryStaffId }) => {
  const allowedStatuses = ["pending", "processing", "packed", "dispatched", "delivered", "preparing", "ready"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid status");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(id);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = order.status;
  let generatedBill = null;

  // Pharmacist assignment logic
  if (status !== "pending" && !order.pharmacistId) {
     order.pharmacistId = pharmacistId;
  }
  
  order.status = status;
  await order.save();

  // Deduct inventory when order is marked as ready and generate the bill
  if (status === "ready") {
    if (order.medicines && order.medicines.length > 0) {
      for (const medicineName of order.medicines) {
        try {
          await inventoryService.updateInventoryStock(medicineName, -1);
        } catch (err) {
          console.warn(`Could not update inventory for ${medicineName}:`, err.message);
        }
      }
    }

    // Generate Bill
    try {
      let items = [];
      let totalAmount = 0;
      items.push({ name: "Doctor Consultancy Fee", cost: 100, type: "consultancy" });
      totalAmount += 100;
      if (order.prescriptionId) {
        const prescription = await Prescription.findById(order.prescriptionId);
        if (prescription && prescription.medicines) {
          prescription.medicines.forEach(m => {
            let price = parseFloat(m.price) || 0;
            items.push({ name: `Medicine: ${m.name}`, cost: price, type: "medicine" });
            totalAmount += price;
          });
        }
      }
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const labOrders = await LabOrder.find({ 
        patientId: order.patientId, 
        doctorId: order.doctorId,
        date: { $gte: yesterday }
      });
      if (labOrders && labOrders.length > 0) {
        labOrders.forEach(lo => {
          let price = parseFloat(lo.price) || 0;
          items.push({ name: `Lab Test: ${lo.testName}`, cost: price, type: "lab_test" });
          totalAmount += price;
        });
      }
      generatedBill = await Bill.create({
        patientId: order.patientId,
        doctorId: order.doctorId,
        prescriptionId: order.prescriptionId,
        amount: totalAmount,
        items: items,
        status: "pending"
      });
      console.log(`Pharmacist generated bill for order ${id}. Total: ${totalAmount}`);
    } catch (billErr) {
      console.error("Failed to generate bill during pharmacy status update:", billErr.message);
    }

    // REAL-TIME AUTO-ASSIGNMENT LOGIC
    if (order.deliveryType === "WARD_DELIVERY") {
      const User = require("../users/models/user.model");
      // Find delivery staff belong to this ward in this hospital
      const staff = await User.findOne({
        role: "delivery",
        assignedWard: order.wardNumber,
        hospitalName: order.hospitalName
      });

      if (staff) {
        console.log(`Auto-assigning order ${id} to staff ${staff.name} for ward ${order.wardNumber}`);
        // Automatically dispatch it
        order.status = "dispatched";
        await order.save();

        const trackingId = `TRK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await createDelivery({
          pharmacyId: id,
          patientId: order.patientId,
          deliveryAgentId: staff._id,
          trackingId,
          status: "assigned",
          deliveryType: "WARD_DELIVERY",
          wardNumber: order.wardNumber
        });

        // Notify staff via socket if possible
        try {
          const io = require("../../core/socket").getIO();
          io.emit("new-delivery-assigned-" + staff._id, {
            orderId: order._id,
            trackingId
          });
          // Also broadcast to general room for this ward staff
          io.emit("ward-delivery-update", { ward: order.wardNumber, status: "dispatched" });
        } catch (sErr) {}
      } else {
        console.warn(`No delivery staff found for ward ${order.wardNumber} in ${order.hospitalName}. Order remains 'ready' for manual dispatch.`);
      }
    }
  }

  if (status === "dispatched" && previousStatus !== "dispatched") {
    const trackingId = `TRK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const deliveryType = order.isAdmitted ? "WARD_DELIVERY" : "HAND_OVER";
    
    await createDelivery({
      pharmacyId: id,
      patientId: order.patientId,
      deliveryAgentId: deliveryStaffId,
      trackingId,
      status: "assigned",
      deliveryType,
      wardNumber: order.wardNumber
    });
  }

  await order.populate("patientId", "name email");
  await order.populate("doctorId", "name hospitalName");
  if (order.prescriptionId) {
    await order.populate("prescriptionId", "medicines createdAt");
  }

  return { order, generatedBill };
};

const updateOrderById = async (id, updateData) => {
  const order = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  return order;
};

module.exports = {
  createOrder,
  createPharmacyOrder,
  getPatientOrders,
  getPharmacistOrders,
  getDoctorOrders,
  getAllOrders,
  getPendingOrders,
  updateOrderStatus,
  updateOrderById,
};
