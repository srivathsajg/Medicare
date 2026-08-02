const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { ethers } = require("ethers");

const User = require("../../modules/users/models/user.model");
const Audit = require("../../modules/audit/models/audit.model");
const Appointment = require("../../modules/appointments/models/appointment.model");
const Prescription = require("../../modules/prescriptions/models/prescription.model");
const Record = require("../../modules/medical-records/models/record.model");
const LabOrder = require("../../modules/lab/models/labOrder.model");
const Insurance = require("../../modules/insurance/models/insurance.model");
const Bill = require("../../modules/billing/models/bill.model");
const { addRecord: addRecordOnChain } = require("../../core/services/blockchain/contract.service");

const STAFF_ROLES = ["doctor", "pharmacist", "lab_technician", "delivery"];
const ROLE_UPDATE_ROLES = ["doctor", "pharmacist", "lab_technician", "delivery"];

const getAdmin = (id) => User.findById(id).select("hospitalName hospitalPricing");

const getWardRate = (pricing = {}, ward = "General") => {
    const wardRates = {
        General: pricing.general || 1000,
        ICU: pricing.icu || 5000,
        Emergency: pricing.emergency || 3000,
        Pediatric: pricing.pediatric || 1500,
        Surgical: pricing.surgical || 2500,
        Deluxe: pricing.deluxe || 4000,
        "Semi-Private": pricing.semiPrivate || 2000,
        Private: pricing.private || 3000,
        Isolation: pricing.isolation || 3500,
        NICU: pricing.nicu || 5500,
    };

    return {
        wardRate: wardRates[ward] || wardRates.General,
        doctorFee: pricing.doctorFee || 500
    };
};

const getDoctorIds = async (hospitalName) => {
    if (!hospitalName) {
        return [];
    }
    return User.find({ role: "doctor", hospitalName }).distinct("_id");
};

const getHospitalScope = async (hospitalName) => {
    if (!hospitalName) {
        return { doctorIds: [], patientIds: [] };
    }

    const doctorIds = await getDoctorIds(hospitalName);
    const patientIds = doctorIds.length
        ? await Appointment.find({ doctorId: { $in: doctorIds } }).distinct("patientId")
        : [];

    return { doctorIds, patientIds };
};

const getScopedUsersQuery = async (hospitalName) => {
    if (!hospitalName) {
        return {};
    }

    const { patientIds } = await getHospitalScope(hospitalName);
    return {
        $or: [
            { hospitalName },
            {
                role: "patient",
                $or: [
                    { _id: { $in: patientIds } },
                    { "admission.hospitalName": hospitalName },
                ],
            },
        ],
    };
};

const sameHospital = (admin, user) => !admin?.hospitalName || user?.hospitalName === admin.hospitalName;

const hashValue = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

const sanitizeUser = (user) => {
    if (!user) {
        return user;
    }

    const data = user.toObject ? user.toObject() : { ...user };
    delete data.password;
    return data;
};

const getProvider = () => new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");

const getTxMeta = async (provider, txHash) => {
    if (!txHash || txHash.startsWith("SIMULATED_")) {
        return { blockNumber: "N/A", gasUsed: "N/A", status: "Wait-Sync", timestamp: null };
    }

    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            return { blockNumber: "N/A", gasUsed: "N/A", status: "Wait-Sync", timestamp: null };
        }

        let timestamp = null;
        try {
            const block = await provider.getBlock(receipt.blockNumber);
            if (block && block.timestamp) {
                timestamp = new Date(block.timestamp * 1000).toISOString();
            }
        } catch (e) {
            console.error("Error fetching block timestamp:", e);
        }

        return {
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "N/A",
            gasPrice: receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, "gwei") : "N/A",
            totalFee: receipt.gasUsed && receipt.gasPrice ? ethers.formatEther(receipt.gasUsed * receipt.gasPrice) : "N/A",
            status: receipt.status === 1 ? "Confirmed" : "Failed",
            timestamp
        };
    } catch (error) {
        console.error("Error fetching transaction metadata:", error);
        return { blockNumber: "N/A", gasUsed: "N/A", status: "Sync-Error", timestamp: null };
    }
};

const syncEntity = async ({ id, type, hospitalName }) => {
    if (type === "record") {
        const record = await Record.findById(id).populate("doctorId", "hospitalName");
        if (!record) {
            throw Object.assign(new Error("Medical record not found"), { statusCode: 404 });
        }
        if (hospitalName && record.doctorId?.hospitalName !== hospitalName) {
            throw Object.assign(new Error("Unauthorized to sync this medical record"), { statusCode: 403 });
        }

        const recordHash = record.sha256Hash || hashValue(`record:${record._id}`);
        const { txHash } = await addRecordOnChain(recordHash, String(record.patientId));
        record.blockchainTxHash = txHash;
        record.blockchainVerified = true;
        await record.save();
        return { txHash, entity: record };
    }

    if (type === "lab") {
        const order = await LabOrder.findById(id);
        if (!order) {
            throw Object.assign(new Error("Lab order not found"), { statusCode: 404 });
        }
        if (hospitalName && order.hospitalName !== hospitalName) {
            throw Object.assign(new Error("Unauthorized to sync this lab order"), { statusCode: 403 });
        }

        const recordHash = hashValue(`lab:${order._id}:${order.testName}:${order.patientId}`);
        const { txHash } = await addRecordOnChain(recordHash, String(order.patientId));
        order.blockchainTxHash = txHash;
        order.blockchainVerified = true;
        await order.save();
        return { txHash, entity: order };
    }

    throw Object.assign(new Error("Unsupported blockchain sync type"), { statusCode: 400 });
};

const createHospitalAdmin = async (req, res) => {
    try {
        const requester = await User.findById(req.user.id).select("hospitalName");
        if (requester?.hospitalName) {
            return res.status(403).json({
                success: false,
                message: "Only System Super Admin can perform this action",
            });
        }

        const { name, email, password, hospitalName, hospitalAddress, phone } = req.body;
        if (await User.findOne({ email })) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const data = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            hospitalName,
            hospitalAddress,
            phone,
            isApproved: true,
        });

        return res.status(201).json({ success: true, data: sanitizeUser(data) });
    } catch (error) {
        console.error("Error creating hospital admin:", error);
        return res.status(500).json({
            success: false,
            message: "Server error creating hospital admin",
        });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const hospitalName = admin?.hospitalName || "";
        const { doctorIds, patientIds } = await getHospitalScope(hospitalName);

        const appointmentQuery = hospitalName ? { doctorId: { $in: doctorIds } } : {};
        const prescriptionQuery = hospitalName ? { doctorId: { $in: doctorIds } } : {};
        const patientQuery = hospitalName
            ? {
                role: "patient",
                $or: [
                    { _id: { $in: patientIds } },
                    { "admission.hospitalName": hospitalName },
                ],
            }
            : { role: "patient" };

        const totalUsers = await User.countDocuments(
            hospitalName
                ? {
                    $or: [
                        { hospitalName },
                        patientQuery,
                    ],
                }
                : {}
        );

        const totalHospitals = hospitalName 
            ? 0 
            : await User.distinct("hospitalName").then(hospitals => hospitals.filter(h => h && h.trim() !== "").length);

        const totalDoctors = await User.countDocuments(
            hospitalName ? { role: "doctor", hospitalName } : { role: "doctor" }
        );

        const totalPatients = await User.countDocuments(patientQuery);
        const totalAppointments = await Appointment.countDocuments(appointmentQuery);
        const totalPrescriptions = await Prescription.countDocuments(prescriptionQuery);
        const approvedAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: "approved",
        });
        const pendingAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: "pending",
        });

        const pendingStaffApprovals = hospitalName
            ? await User.countDocuments({ role: { $in: STAFF_ROLES }, isApproved: false, hospitalName })
            : await User.countDocuments({ role: { $in: STAFF_ROLES }, isApproved: false });

        const appointmentsPerMonth = await Appointment.aggregate([
            {
                $match: {
                    ...appointmentQuery,
                    date: {
                        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                    },
                },
            },
            { $group: { _id: { $month: "$date" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const doctorPerformance = await Appointment.aggregate([
            { $match: appointmentQuery },
            { $group: { _id: "$doctorId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "doctor",
                },
            },
            { $unwind: "$doctor" },
            { $project: { name: "$doctor.name", count: 1 } },
        ]);

        return res.json({
            success: true,
            data: {
                totalUsers,
                totalHospitals,
                totalDoctors,
                totalPatients,
                totalAppointments,
                approvedAppointments,
                pendingAppointments,
                pendingStaffApprovals,
                totalPrescriptions,
                appointmentsPerMonth,
                doctorPerformance,
            },
        });
    } catch (error) {
        console.error("Error fetching admin analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Server error fetching analytics",
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const query = await getScopedUsersQuery(admin?.hospitalName || "");
        const data = await User.find(query, "-password").sort({ createdAt: -1 });
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Server error fetching users",
        });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { role } = req.body;

        if (!ROLE_UPDATE_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid target role",
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!sameHospital(admin, user)) {
            return res.status(403).json({
                success: false,
                message: "You can only manage staff in your hospital",
            });
        }

        if (!ROLE_UPDATE_ROLES.includes(user.role)) {
            return res.status(400).json({
                success: false,
                message: "Only hospital staff roles can be updated",
            });
        }

        user.role = role;
        user.isApproved = true;
        await user.save();

        return res.json({ success: true, data: sanitizeUser(user) });
    } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({
            success: false,
            message: "Server error updating user role",
        });
    }
};

const getPendingApprovals = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const query = {
            role: { $in: STAFF_ROLES },
            isApproved: false,
        };

        if (admin?.hospitalName) {
            query.hospitalName = admin.hospitalName;
        }

        const data = await User.find(query, "-password").sort({ createdAt: -1 });
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching pending approvals:", error);
        return res.status(500).json({
            success: false,
            message: "Server error fetching pending approvals",
        });
    }
};

const approvePendingUser = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!STAFF_ROLES.includes(user.role)) {
            return res.status(400).json({
                success: false,
                message: "Only pending staff accounts can be approved",
            });
        }

        if (!sameHospital(admin, user)) {
            return res.status(403).json({
                success: false,
                message: "You can only approve staff in your hospital",
            });
        }

        user.isApproved = true;
        await user.save();

        return res.json({ success: true, data: sanitizeUser(user) });
    } catch (error) {
        console.error("Error approving user:", error);
        return res.status(500).json({
            success: false,
            message: "Server error approving user",
        });
    }
};

const rejectUser = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!STAFF_ROLES.includes(user.role)) {
            return res.status(400).json({
                success: false,
                message: "Only pending staff accounts can be rejected",
            });
        }

        if (!sameHospital(admin, user)) {
            return res.status(403).json({
                success: false,
                message: "You can only reject staff in your hospital",
            });
        }

        await User.findByIdAndDelete(user._id);
        return res.json({
            success: true,
            data: { _id: user._id },
            message: "User rejected successfully",
        });
    } catch (error) {
        console.error("Error rejecting user:", error);
        return res.status(500).json({
            success: false,
            message: "Server error rejecting user",
        });
    }
};

const getBlockchainStatus = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const hospitalName = admin?.hospitalName || "";

        const recordQuery = hospitalName ? { hospitalName } : {};
        const labQuery = hospitalName ? { hospitalName } : {};

        const [records, labOrders] = await Promise.all([
            Record.find(recordQuery)
                .populate("doctorId", "name hospitalName")
                .populate("patientId", "name")
                .sort({ createdAt: -1 })
                .limit(30),
            LabOrder.find(labQuery)
                .populate("doctorId", "name hospitalName")
                .populate("patientId", "name")
                .sort({ date: -1 })
                .limit(30),
        ]);

        const provider = getProvider();
        let blockNumber = "N/A";
        try {
            blockNumber = await provider.getBlockNumber();
        } catch {
            blockNumber = "N/A";
        }

        const recordTransactions = await Promise.all(
            records.map(async (record) => {
                const meta = await getTxMeta(provider, record.blockchainTxHash);
                return {
                    _id: record._id,
                    type: "record",
                    label: record.title || record.diagnosis || "Medical Record",
                    patientName: record.patientId?.name || "Unknown patient",
                    doctorName: record.doctorId?.name || "Unknown doctor",
                    hospitalName:
                        record.hospitalName ||
                        record.doctorId?.hospitalName ||
                        hospitalName ||
                        "Unknown hospital",
                    createdAt: record.createdAt,
                    txHash: record.blockchainTxHash || "",
                    blockchainVerified: Boolean(record.blockchainVerified),
                    ...meta,
                };
            })
        );

        const labTransactions = await Promise.all(
            labOrders.map(async (order) => {
                const meta = await getTxMeta(provider, order.blockchainTxHash);
                return {
                    _id: order._id,
                    type: "lab",
                    label: order.testName,
                    patientName: order.patientId?.name || "Unknown patient",
                    doctorName: order.doctorId?.name || "Unknown doctor",
                    hospitalName: order.hospitalName || hospitalName || "Unknown hospital",
                    createdAt: order.date,
                    txHash: order.blockchainTxHash || "",
                    blockchainVerified: Boolean(order.blockchainVerified),
                    ...meta,
                };
            })
        );

        const transactions = [...recordTransactions, ...labTransactions].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        return res.json({
            success: true,
            data: {
                blockNumber,
                totals: {
                    records: records.length,
                    labOrders: labOrders.length,
                    verified: transactions.filter((item) => item.status === "Confirmed").length,
                    // Pending sync should reflect items not yet verified OR still pending on blockchain
                    pendingSync: transactions.filter((item) => item.status !== "Confirmed").length,
                },
                transactions,
            },
        });
    } catch (error) {
        console.error("Error fetching blockchain status:", error);
        return res.status(500).json({
            success: false,
            message: "Server error fetching blockchain status",
        });
    }
};

const syncBlockchainRecord = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { type, id } = req.params;
        const result = await syncEntity({
            id,
            type,
            hospitalName: admin?.hospitalName || "",
        });

        return res.json({
            success: true,
            data: {
                _id: result.entity._id,
                type,
                txHash: result.txHash,
            },
        });
    } catch (error) {
        console.error("Error syncing blockchain record:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error syncing blockchain record",
        });
    }
};

const syncAllBlockchainRecords = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const hospitalName = admin?.hospitalName || "";
        const provider = getProvider();

        // 1. Initial candidates (not verified OR empty hash)
        const baseQuery = hospitalName ? { hospitalName } : {};
        const [records, labOrders] = await Promise.all([
            Record.find(baseQuery).select("_id blockchainTxHash blockchainVerified"),
            LabOrder.find(baseQuery).select("_id blockchainTxHash blockchainVerified"),
        ]);

        const needsSync = [];

        // Check each for actual blockchain presence
        for (const record of records) {
            if (!record.blockchainVerified || !record.blockchainTxHash) {
                needsSync.push({ id: record._id, type: "record" });
                continue;
            }
            // Even if marked verified, check if transaction actually exists on node
            const meta = await getTxMeta(provider, record.blockchainTxHash);
            if (meta.status === "Wait-Sync" || meta.status === "Failed") {
                needsSync.push({ id: record._id, type: "record" });
            }
        }

        for (const order of labOrders) {
            if (!order.blockchainVerified || !order.blockchainTxHash) {
                needsSync.push({ id: order._id, type: "lab" });
                continue;
            }
            const meta = await getTxMeta(provider, order.blockchainTxHash);
            if (meta.status === "Wait-Sync" || meta.status === "Failed") {
                needsSync.push({ id: order._id, type: "lab" });
            }
        }

        const synced = [];
        const failed = [];

        for (const item of needsSync) {
            try {
                const result = await syncEntity({
                    id: item.id,
                    type: item.type,
                    hospitalName,
                });
                synced.push({ _id: item.id, type: item.type, txHash: result.txHash });
            } catch (error) {
                failed.push({ _id: item.id, type: item.type, message: error.message });
            }
        }

        return res.json({
            success: true,
            data: {
                syncedCount: synced.length,
                failedCount: failed.length,
                synced,
                failed,
            },
        });
    } catch (error) {
        console.error("Error syncing all blockchain records:", error);
        return res.status(500).json({
            success: false,
            message: "Server error syncing all blockchain records",
        });
    }
};

const getAdmittedPatientInsurance = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        if (!admin?.hospitalName) {
            return res.status(403).json({
                success: false,
                message: "Insurance view is available only for hospital admins",
            });
        }

        const patients = await User.find({
            role: "patient",
            "admission.isAdmitted": true,
            "admission.hospitalName": admin.hospitalName,
        })
            .select(
                "name email phone gender bloodGroup insuranceProviderName policyNumber validTillDate insuranceProofImage admission createdAt isInsuranceApplied insuranceVerifiedAt"
            )
            .populate("admission.doctorId", "name")
            .sort({ "admission.admittedAt": -1 })
            .lean();

        const patientIds = patients.map((patient) => patient._id);
        const claims = patientIds.length
            ? await Insurance.find({ patientId: { $in: patientIds } })
                .populate("billingId", "amount status createdAt")
                .sort({ createdAt: -1 })
                .lean()
            : [];

        const claimsByPatient = claims.reduce((map, claim) => {
            const key = String(claim.patientId);
            if (!map.has(key)) {
                map.set(key, []);
            }

            map.get(key).push({
                _id: claim._id,
                claimStatus: claim.claimStatus,
                verificationStatus: claim.verificationStatus,
                description: claim.description,
                createdAt: claim.createdAt,
                billingAmount: claim.billingId?.amount ?? null,
                billingStatus: claim.billingId?.status ?? null,
            });

            return map;
        }, new Map());

        const now = new Date();
        const data = patients.map((patient) => {
            const patientClaims = claimsByPatient.get(String(patient._id)) || [];
            const validTillDate = patient.validTillDate ? new Date(patient.validTillDate) : null;
            const claimSummary = patientClaims.reduce(
                (summary, claim) => {
                    summary.total += 1;
                    summary[claim.claimStatus] += 1;
                    return summary;
                },
                { total: 0, submitted: 0, approved: 0, rejected: 0 }
            );

            return {
                _id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                createdAt: patient.createdAt,
                admission: {
                    hospitalName: patient.admission?.hospitalName || null,
                    ward: patient.admission?.ward || null,
                    admittedAt: patient.admission?.admittedAt || null,
                    doctorName: patient.admission?.doctorId?.name || null,
                },
                insurance: {
                    providerName: patient.insuranceProviderName || "",
                    policyNumber: patient.policyNumber || "",
                    validTillDate: patient.validTillDate || null,
                    insuranceProofImage: patient.insuranceProofImage || null,
                    isExpired: validTillDate ? validTillDate < now : false,
                    hasInsurance:
                        Boolean(patient.insuranceProviderName) ||
                        Boolean(patient.policyNumber) ||
                        Boolean(patient.insuranceProofImage) ||
                        patientClaims.length > 0,
                },
                claims: patientClaims,
                claimSummary,
                isInsuranceApplied: Boolean(patient.isInsuranceApplied),
                insuranceVerifiedAt: patient.insuranceVerifiedAt || null,
            };
        });

        return res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching admitted patient insurance:", error);
        return res.status(500).json({
            success: false,
            message: "Server error fetching admitted patient insurance",
        });
    }
};

const searchPatients = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        const patients = await User.find({
            role: "patient",
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ],
            "admission.isAdmitted": { $ne: true }
        }).select("-password").limit(10);

        return res.json({ success: true, data: patients });
    } catch (error) {
        console.error("Error searching patients:", error);
        return res.status(500).json({ success: false, message: "Server error searching patients" });
    }
};

const admitPatient = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { id } = req.params;
        const { ward, doctorId } = req.body;

        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can admit patients" });
        }

        const patient = await User.findById(id);
        if (!patient || patient.role !== "patient") {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        if (patient.admission?.isAdmitted) {
            return res.status(400).json({ success: false, message: "Patient is already admitted" });
        }

        patient.admission = {
            isAdmitted: true,
            hospitalName: admin.hospitalName,
            ward: ward || "General",
            doctorId: doctorId || null,
            admittedAt: new Date(),
            wardHistory: []
        };

        await patient.save();

        return res.json({ success: true, data: sanitizeUser(patient) });
    } catch (error) {
        console.error("Error admitting patient:", error);
        return res.status(500).json({ success: false, message: "Server error admitting patient" });
    }
};

const changeWard = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { id } = req.params;
        const { newWard } = req.body;

        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can change wards" });
        }

        const patient = await User.findById(id);
        if (!patient || !patient.admission?.isAdmitted || patient.admission?.hospitalName !== admin.hospitalName) {
            return res.status(404).json({ success: false, message: "Admitted patient not found" });
        }

        if (patient.admission.ward === newWard) {
            return res.status(400).json({ success: false, message: "Patient is already in this ward" });
        }

        // Push current ward stay to history
        const now = new Date();
        patient.admission.wardHistory.push({
            ward: patient.admission.ward,
            startedAt: patient.admission.admittedAt,
            endedAt: now
        });

        // Update current ward
        patient.admission.ward = newWard;
        patient.admission.admittedAt = now;

        await patient.save();

        return res.json({ success: true, message: `Ward changed to ${newWard} successfully`, data: sanitizeUser(patient) });
    } catch (error) {
        console.error("Error changing ward:", error);
        return res.status(500).json({ success: false, message: "Server error changing ward" });
    }
};

const calculateLiveAdmissionCosts = async (patient, pricing) => {
    const admittedAt = new Date(patient.admission.admittedAt);
    const now = new Date();
    
    // Calculate historical ward costs
    let wardTotal = 0;
    const wardBreakdown = [];
    
    if (patient.admission.wardHistory && patient.admission.wardHistory.length > 0) {
        patient.admission.wardHistory.forEach(h => {
            const start = new Date(h.startedAt);
            const end = new Date(h.endedAt);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            const { wardRate } = getWardRate(pricing, h.ward);
            const cost = wardRate * diffDays;
            wardTotal += cost;
            wardBreakdown.push({ name: `${h.ward} Ward (${diffDays} days)`, cost, type: "ward" });
        });
    }

    // Calculate current ward cost
    const diffTimeCurrent = Math.abs(now - admittedAt);
    const diffDaysCurrent = Math.ceil(diffTimeCurrent / (1000 * 60 * 60 * 24)) || 1;
    const { wardRate: currentRate, doctorFee } = getWardRate(pricing, patient.admission.ward);
    const currentWardCost = currentRate * diffDaysCurrent;
    wardTotal += currentWardCost;
    wardBreakdown.push({ name: `${patient.admission.ward} Ward (Current, ${diffDaysCurrent} days)`, cost: currentWardCost, type: "ward" });

    // Doctor Fee - assuming per day of total stay
    const totalStayStart = patient.admission.wardHistory?.length > 0 
        ? new Date(patient.admission.wardHistory[0].startedAt) 
        : admittedAt;
    const totalStayDays = Math.ceil(Math.abs(now - totalStayStart) / (1000 * 60 * 60 * 24)) || 1;
    const doctorFeeTotal = doctorFee * totalStayDays;

    // Fetch Lab Tests
    const labOrders = await LabOrder.find({
        patientId: patient._id,
        hospitalName: patient.admission.hospitalName,
        date: { $gte: totalStayStart }
    });
    const labTotal = labOrders.reduce((sum, order) => sum + (order.price || 0), 0);

    // Fetch Medicines
    const prescriptions = await Prescription.find({
        patientId: patient._id,
        deliveryType: "WARD",
        createdAt: { $gte: totalStayStart }
    });
    
    let medicineTotal = 0;
    const medicineItems = [];
    prescriptions.forEach(p => {
        p.medicines.forEach(m => {
            const price = parseFloat(m.price) || 0;
            medicineTotal += price;
            medicineItems.push({ name: m.name, cost: price, type: "medicine" });
        });
    });

    return {
        wardTotal,
        wardBreakdown,
        doctorFeeTotal,
        doctorFee,
        labTotal,
        medicineTotal,
        medicineItems,
        totalStayDays,
        totalStayStart,
        total: wardTotal + doctorFeeTotal + labTotal + medicineTotal
    };
};

const getAdmittedPatients = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can view admitted patients" });
        }

        const patients = await User.find({
            role: "patient",
            "admission.isAdmitted": true,
            "admission.hospitalName": admin.hospitalName,
        }).select("-password");

        return res.json({ success: true, data: patients });
    } catch (error) {
        console.error("Error fetching admitted patients:", error);
        return res.status(500).json({ success: false, message: "Server error fetching admitted patients" });
    }
};

const getPatientBillPreview = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { id } = req.params;

        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can view billing" });
        }

        const patient = await User.findById(id);
        if (!patient || patient.role !== "patient" || patient.admission?.hospitalName !== admin.hospitalName) {
            return res.status(404).json({ success: false, message: "Admitted patient not found" });
        }

        const costs = await calculateLiveAdmissionCosts(patient, admin.hospitalPricing);

        const billData = {
            patient: {
                name: patient.name,
                email: patient.email,
                ward: patient.admission.ward,
                admittedAt: costs.totalStayStart,
                days: costs.totalStayDays
            },
            summary: [
                ...costs.wardBreakdown,
                { name: `Doctor Consultation Fees (₹${costs.doctorFee} x ${costs.totalStayDays} days)`, cost: costs.doctorFeeTotal, type: "consultancy" },
                { name: "Laboratory Investigations", cost: costs.labTotal, type: "lab_test" },
                { name: "Pharmacy (Ward Delivery)", cost: costs.medicineTotal, type: "medicine" }
            ],
            total: costs.total
        };

        return res.json({ success: true, data: billData });
    } catch (error) {
        console.error("Error generating bill preview:", error);
        return res.status(500).json({ success: false, message: "Server error generating bill preview" });
    }
};

const dischargePatient = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { id } = req.params;
        const { totalAmount, items } = req.body;

        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can discharge patients" });
        }

        const patient = await User.findById(id);
        if (!patient || !patient.admission?.isAdmitted || patient.admission?.hospitalName !== admin.hospitalName) {
            return res.status(404).json({ success: false, message: "Admitted patient not found" });
        }

        // Create Final Bill
        const finalBill = new Bill({
            patientId: id,
            doctorId: req.user.id, // Admin acting as bill generator
            amount: totalAmount,
            items: items.map(item => ({
                name: item.name,
                cost: item.cost,
                type: item.type === "consultancy" ? "consultancy" : (["medicine", "lab_test"].includes(item.type) ? item.type : "other")
            })),
            status: "pending"
        });
        await finalBill.save();

        // Update Patient Admission Status
        patient.admission = {
            isAdmitted: false,
            hospitalName: null,
            ward: null,
            doctorId: null,
            admittedAt: null
        };
        await patient.save();

        return res.json({ success: true, message: "Patient discharged and bill generated successfully", billId: finalBill._id });
    } catch (error) {
        console.error("Error discharging patient:", error);
        return res.status(500).json({ success: false, message: "Server error discharging patient" });
    }
};

const getBillingHistory = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can view billing history" });
        }

        const bills = await Bill.find()
            .populate({
                path: "patientId",
                select: "name email phone",
            })
            .sort({ createdAt: -1 })
            .lean();

        // Filter bills where the patient was admitted to this hospital
        // Since the Bill model doesn't store hospitalName directly, we filter based on current/past admission context if needed
        // Or better, we filter by doctorId if it belongs to this hospital's doctors
        const hospitalDoctorIds = await User.find({ role: "doctor", hospitalName: admin.hospitalName }).distinct("_id");
        
        // Include admin's own ID as they generate bills during discharge
        const allowedGeneratorIds = [...hospitalDoctorIds.map(id => id.toString()), req.user.id.toString()];

        const hospitalBills = bills.filter(bill => 
            allowedGeneratorIds.includes(bill.doctorId?.toString())
        );

        return res.json({ success: true, data: hospitalBills });
    } catch (error) {
        console.error("Error fetching billing history:", error);
        return res.status(500).json({ success: false, message: "Server error fetching billing history" });
    }
};

const markBillAsPaid = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { id } = req.params;

        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can update billing" });
        }

        const bill = await Bill.findById(id);
        if (!bill) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        bill.status = "paid";
        await bill.save();

        return res.json({ success: true, message: "Bill marked as paid successfully", data: bill });
    } catch (error) {
        console.error("Error updating bill status:", error);
        return res.status(500).json({ success: false, message: "Server error updating bill status" });
    }
};

const verifyInsurance = async (req, res) => {
    try {
        const admin = await getAdmin(req.user.id);
        const { id } = req.params;

        if (!admin?.hospitalName) {
            return res.status(403).json({ success: false, message: "Only hospital admins can verify insurance" });
        }

        const patient = await User.findById(id);
        if (!patient || patient.role !== "patient") {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        patient.isInsuranceApplied = true;
        patient.insuranceVerifiedAt = new Date();
        await patient.save();

        return res.json({ success: true, message: "Insurance verified and applied successfully" });
    } catch (error) {
        console.error("Error verifying insurance:", error);
        return res.status(500).json({ success: false, message: "Server error verifying insurance" });
    }
};

module.exports = {
    createHospitalAdmin,
    getAnalytics,
    getUsers,
    updateUserRole,
    getPendingApprovals,
    approvePendingUser,
    rejectUser,
    getBlockchainStatus,
    syncBlockchainRecord,
    syncAllBlockchainRecords,
    getAdmittedPatientInsurance,
    searchPatients,
    admitPatient,
    changeWard,
    getAdmittedPatients,
    getPatientBillPreview,
    dischargePatient,
    getBillingHistory,
    markBillAsPaid,
    verifyInsurance
};
