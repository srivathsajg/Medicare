const User = require("../users/models/user.model");
const Order = require("../pharmacy-orders/models/order.model");
const Record = require("../medical-records/models/record.model");
const Appointment = require("../appointments/models/appointment.model");
const mongoose = require("mongoose");

exports.universalSearch = async (req, res) => {
    const { q, role } = req.query;
    if (!q || q.length < 2) {
        return res.json({ success: true, data: [] });
    }

    const userId = req.user.id;
    const searchRegex = new RegExp(q, 'i');

    try {
        let results = [];

        switch (role) {
            case 'doctor':
                // Search patients assigned to this doctor or all patients
                const patients = await User.find({
                    role: 'patient',
                    $or: [
                        { name: searchRegex },
                        { email: searchRegex }
                    ]
                }).limit(5);
                results = patients.map(p => ({
                    _id: p._id,
                    name: p.name,
                    subtitle: p.email,
                    type: 'patient'
                }));
                break;

            case 'pharmacist':
                // Search orders by patient name or partial ID
                let pharmacistIdFilter = {};
                // If we want to filter by pharmacist's pharmacy, we can add it here
                
                let orderIdQuery = [];
                if (mongoose.Types.ObjectId.isValid(q)) {
                    orderIdQuery = [{ _id: q }];
                }

                const orders = await Order.find({
                    $or: [
                        { 'patientName': searchRegex },
                        ...orderIdQuery
                    ]
                }).sort({ createdAt: -1 }).limit(5);

                results = orders.map(o => ({
                    _id: o._id,
                    name: `Order# ${o._id.toString().slice(-6)}`,
                    subtitle: o.patientName || 'Patient',
                    type: 'order'
                }));
                break;

            case 'patient':
                // Search their own records, appointments, prescriptions
                const [myRecords, myAppointments] = await Promise.all([
                    Record.find({
                        patientId: userId,
                        $or: [
                            { diagnosis: searchRegex },
                            { hospitalName: searchRegex }
                        ]
                    }).limit(3),
                    Appointment.find({
                        patientId: userId,
                        $or: [
                            { doctorName: searchRegex },
                            { reason: searchRegex }
                        ]
                    }).limit(3)
                ]);

                results = [
                    ...myRecords.map(r => ({
                        _id: r._id,
                        name: r.diagnosis || 'Medical Record',
                        subtitle: r.hospitalName,
                        type: 'record'
                    })),
                    ...myAppointments.map(a => ({
                        _id: a._id,
                        name: `Appointment with Dr. ${a.doctorName}`,
                        subtitle: a.date,
                        type: 'appointment'
                    }))
                ];
                break;

            case 'admin':
                // Search all users
                const allUsers = await User.find({
                    $or: [
                        { name: searchRegex },
                        { email: searchRegex },
                        { role: searchRegex }
                    ]
                }).limit(5);
                results = allUsers.map(u => ({
                    _id: u._id,
                    name: u.name,
                    subtitle: `${u.role.toUpperCase()} - ${u.email}`,
                    type: 'patient' // User icon
                }));
                break;
            
            case 'lab_technician':
                // Search lab tests (implement if lab model exists)
                // For now, search patients
                const labPatients = await User.find({
                    role: 'patient',
                    name: searchRegex
                }).limit(5);
                results = labPatients.map(p => ({
                    _id: p._id,
                    name: p.name,
                    subtitle: p.email,
                    type: 'patient'
                }));
                break;

            default:
                results = [];
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ success: false, message: "Search failed" });
    }
};
