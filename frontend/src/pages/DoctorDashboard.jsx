import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Users, FileText, ClipboardList, Calendar, Database, Shield, LayoutGrid, Settings, User, LogOut, X, Loader2, Plus, Trash2, CheckCircle, Clock, XCircle, Activity, Building2, Edit2, QrCode
} from 'lucide-react';
import UniversalSearchBar from '../components/ui/UniversalSearchBar';
import NotificationBell from '../components/ui/NotificationBell';
import { useSocketNotifications } from '../hooks/useSocketNotifications';
import { fetchDoctorOverview, fetchPatients, createMedicalRecord, createPrescription, fetchDoctorAppointments, updateAppointmentStatus, fetchPatientHistory, fetchPendingRecords, verifyRecord, updateDoctorDelay, fetchAdmittedPatients, issueAdmissionCertificate } from '../services/doctorApi';
import { fetchLabTests, createLabOrder } from '../services/labApi';
import { useLocation } from 'react-router-dom';
import DoctorAvailability from './DoctorAvailability';
import DrugSearchInput from '../components/ui/DrugSearchInput';
import LabTestSearchInput from '../components/ui/LabTestSearchInput';
import SettingsView from '../components/ui/SettingsView';
import { getBaseUrl } from '../services/userApi';
import Loader from '../components/ui/Loader';
import QRScannerModal from '../components/qr/QRScannerModal';
import socket from '../services/socket';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const [notificationCount, resetNotifications] = useSocketNotifications({ userId: user?.id, hospitalName: user?.hospitalName });
    const [activeTab, setActiveTab] = useState('overview');
    const location = useLocation();

    const [overview, setOverview] = useState({
        totalPatients: 0,
        totalAppointments: 0,
        pendingRecords: 0,
        blockchainVerifiedPercentage: 100
    });
    const [patients, setPatients] = useState([]);
    const [admittedPatients, setAdmittedPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [pendingRecordsList, setPendingRecordsList] = useState([]);


    // UI State
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedPatientName, setSelectedPatientName] = useState('');
    const [expandedRecordId, setExpandedRecordId] = useState(null);
    const [previewFile, setPreviewFile] = useState(null); // { url, type }

    const [loadingData, setLoadingData] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [statusLoadingId, setStatusLoadingId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    // Lab Test State
    const [isLabTestModalOpen, setIsLabTestModalOpen] = useState(false);
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [certificateForm, setCertificateForm] = useState({ 
        patientId: '', 
        status: '', 
        notes: 'Avoid heavy lifting\nNo prolonged standing for more than 2 hours\nLight desk duties preferred',
        recommendDischarge: false,
        followUpDate: ''
    });
    const [labTests, setLabTests] = useState([]);
    const [labOrderForm, setLabOrderForm] = useState({ 
        patientId: '', 
        tests: [{ testName: '', price: 0 }] 
    });

    // Form States
    const initialRecordForm = { patientId: '', diagnosis: '', symptoms: '', labResults: '', treatmentPlan: '', notes: '' };
    const [recordForm, setRecordForm] = useState(initialRecordForm);

    const initialPrescriptionForm = { patientId: '', notes: '', deliveryType: 'PHARMACY', wardNumber: '', roomNo: '', isEmergency: false };
    const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm);
    const [medicines, setMedicines] = useState([{ name: '', frequency: '', duration: '', price: '' }]);

    // Delay State
    const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
    const [delayForm, setDelayForm] = useState({
        isDelayed: false,
        reason: '',
        expectedArrivalTime: ''
    });

    // Sync delay form with user data
    useEffect(() => {
        if (user?.delayStatus) {
            setDelayForm({
                isDelayed: user.delayStatus.isDelayed || false,
                reason: user.delayStatus.reason || '',
                expectedArrivalTime: user.delayStatus.expectedArrivalTime || ''
            });
        }
    }, [user]);

    const QUICK_REASONS = [
        "Stuck in Emergency Surgery",
        "Personal Emergency",
        "Traffic Delay",
        "Extended Patient Consultation",
        "Weather Conditions"
    ];

    const handleDelaySubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await updateDoctorDelay(delayForm);
            if (res.success) {
                showToast(delayForm.isDelayed ? "Delay status reported to patients" : "Delay status cleared");
                setIsDelayModalOpen(false);
                loadData();
            }
        } catch (error) {
            showToast("Failed to update delay status");
        } finally {
            setSubmitLoading(false);
        }
    };

    const loadData = async () => {
        try {
            setLoadingData(true);
            const [overviewRes, patientsRes, appointmentsRes, labTestsRes, admittedRes] = await Promise.all([
                fetchDoctorOverview(),
                fetchPatients(),
                fetchDoctorAppointments(),
                fetchLabTests(),
                fetchAdmittedPatients()
            ]);
            if (overviewRes.success) setOverview(overviewRes.data);
            if (patientsRes.success) setPatients(patientsRes.data);
            if (appointmentsRes?.success) setAppointments(appointmentsRes.data);
            if (labTestsRes?.success) setLabTests(labTestsRes.data);
            if (admittedRes?.success) setAdmittedPatients(admittedRes.data);
        } catch (error) {
            console.error("Error loading doctor data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Real-time updates for Doctor Dashboard
    useEffect(() => {
        const handleNewAppointment = (data) => {
            showToast(data.message || "New appointment booked!");
            loadData(); // Refresh overview and appointments list
        };

        const handleAppointmentReassigned = (data) => {
            showToast(data.message || "Appointment reassigned!");
            loadData();
        };

        socket.on('new-appointment-received', handleNewAppointment);
        socket.on('appointment-reassigned', handleAppointmentReassigned);
        socket.on('new-appointment-assigned', handleNewAppointment);

        return () => {
            socket.off('new-appointment-received', handleNewAppointment);
            socket.off('appointment-reassigned', handleAppointmentReassigned);
            socket.off('new-appointment-assigned', handleNewAppointment);
        };
    }, []);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    const handleRecordSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await createMedicalRecord(recordForm);
            if (res.success) {
                showToast("Medical record created & stored on Blockchain successfully!");
                setIsRecordModalOpen(false);
                setRecordForm(initialRecordForm);
                loadData();
            } else {
                showToast(res.message || "Failed to create record");
            }
        } catch (error) {
            showToast("External error during record creation");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const payload = { ...prescriptionForm, medicines };
            const res = await createPrescription(payload);
            if (res.success) {
                showToast("Prescription issued and forwarded to the Hospital Pharmacy successfully!");
                setIsPrescriptionModalOpen(false);
                setPrescriptionForm(initialPrescriptionForm);
                setMedicines([{ name: '', frequency: '', duration: '', price: '' }]);
                loadData();
            } else {
                showToast(res.message || "Failed to create prescription");
            }
        } catch (error) {
            showToast("External error during prescription creation");
        } finally {
            setSubmitLoading(false);
        }
    };

    const openPrescriptionModal = (patientId = '') => {
        setPrescriptionForm({ ...initialPrescriptionForm, patientId });
        setIsPrescriptionModalOpen(true);
    };

    const handleAppointmentStatus = async (id, status) => {
        setStatusLoadingId(id);
        try {
            const res = await updateAppointmentStatus(id, status);
            if (res.success) {
                showToast(`Appointment ${status} successfully!`);
                loadData();
            } else {
                showToast(res.message || `Failed to update to ${status}`);
            }
        } catch (error) {
            showToast("Error updating appointment");
        } finally {
            setStatusLoadingId(null);
        }
    };

    const updateMedicineRow = (index, field, value) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const addMedicineRow = () => {
        setMedicines([...medicines, { name: '', frequency: '', duration: '', price: '' }]);
    };

    const handleDrugSelect = (index, drug) => {
        const updated = [...medicines];
        updated[index].name = drug.name;
        updated[index].price = drug.price;
        setMedicines(updated);
    };

    const calculateTotal = () => {
        return medicines.reduce((sum, med) => sum + (parseFloat(med.price) || 0), 0).toFixed(2);
    };

    const removeMedicineRow = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleViewHistory = async (patientId, patientName) => {
        setSelectedPatientName(patientName);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        setPatientHistory([]);
        try {
            const res = await fetchPatientHistory(patientId);
            if (res.success) {
                setPatientHistory(res.data);
            } else {
                showToast(res.message || "Failed to fetch history");
                setIsHistoryModalOpen(false);
            }
        } catch (error) {
            console.error("History fetch error", error);
            showToast(error.response?.data?.message || "Access Denied");
            setIsHistoryModalOpen(false);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleLabOrderSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await createLabOrder(labOrderForm);
            if (res.success) {
                showToast("Lab tests ordered successfully!");
                setIsLabTestModalOpen(false);
                setLabOrderForm({ patientId: '', tests: [{ testName: '', price: 0 }] });
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to order lab tests");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCertificateSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await issueAdmissionCertificate(certificateForm.patientId, {
                status: certificateForm.status,
                notes: certificateForm.notes,
                recommendDischarge: certificateForm.recommendDischarge,
                followUpDate: certificateForm.followUpDate
            });
            if (res.success) {
                showToast("Admission certificate issued successfully!");
                setIsCertificateModalOpen(false);
                setCertificateForm({ 
                    patientId: '', 
                    status: '',
                    notes: 'Avoid heavy lifting\nNo prolonged standing for more than 2 hours\nLight desk duties preferred',
                    recommendDischarge: false,
                    followUpDate: ''
                });
                loadData();
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to issue certificate");
        } finally {
            setSubmitLoading(false);
        }
    };

    const addLabRow = () => {
        setLabOrderForm(prev => ({
            ...prev,
            tests: [...prev.tests, { testName: '', price: 0 }]
        }));
    };

    const removeLabRow = (index) => {
        const updated = [...labOrderForm.tests];
        updated.splice(index, 1);
        setLabOrderForm(prev => ({ ...prev, tests: updated }));
    };

    const updateLabRow = (index, field, value) => {
        const updated = [...labOrderForm.tests];
        updated[index][field] = value;
        setLabOrderForm(prev => ({ ...prev, tests: updated }));
    };

    const calculateLabOrderTotal = () => {
        return (labOrderForm.tests || []).reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    };

    const loadPendingRecordsData = async () => {
        try {
            const res = await fetchPendingRecords();
            if (res.success) {
                setPendingRecordsList(res.data);
            }
        } catch (error) {
            console.error("Error loading pending records:", error);
        }
    };

    const handleVerifyRecord = async (recordId) => {
        setStatusLoadingId(recordId);
        try {
            const res = await verifyRecord(recordId);
            if (res.success) {
                showToast("Record verified on Blockchain!");
                loadPendingRecordsData();
                loadData();
            } else {
                showToast(res.message || "Verification failed");
            }
        } catch (error) {
            showToast("Blockchain node unreachable");
        } finally {
            setStatusLoadingId(null);
        }
    };

    useEffect(() => {
        if (activeTab === 'verification') {
            loadPendingRecordsData();
        }
    }, [activeTab]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const id = params.get('id');
        
        if (tab) {
            setActiveTab(tab);
        }
        
        // If an ID is provided and we're on the patients tab, open their history
        if (id && tab === 'patients' && patients.length > 0) {
            const patient = patients.find(p => p._id === id);
            if (patient) {
                handleViewHistory(patient._id, patient.name);
                // Clear the ID from URL to prevent reopening on every tab switch
                const newParams = new URLSearchParams(location.search);
                newParams.delete('id');
                window.history.replaceState({}, '', `${location.pathname}?${newParams.toString()}`);
            }
        }
    }, [location, patients]);

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">

            {toastMessage && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2 animate-bounce">
                    <CheckCircle size={20} /> {toastMessage}
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 flex flex-col bg-[#0f1110]">
                <div className="p-7 flex items-center gap-4 border-b border-white/[0.05] relative group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 p-[1px]">
                        <div className="w-full h-full rounded-[14px] bg-[#0e1015] flex items-center justify-center shadow-2xl">
                            <Shield size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                        </div>
                    </div>
                    <div>
                        <p className="font-black text-white text-base tracking-tighter leading-tight">MediCare <span className="text-emerald-500">.</span></p>
                        <p className="text-[9px] text-emerald-500/80 font-black uppercase tracking-[0.2em] mt-0.5">Doctor Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <NavItem icon={Calendar} label="Appointments" active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
                    <NavItem icon={Building2} label="Admitted Patients" active={activeTab === 'admitted'} onClick={() => setActiveTab('admitted')} />
                    <NavItem icon={Clock} label="Availability" active={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <NavItem icon={FileText} label="Pending verification" active={activeTab === 'verification'} onClick={() => setActiveTab('verification')} />
                </nav>

                <div className="p-4 mt-auto space-y-2">
                    <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    <NavItem icon={LogOut} label="Logout" onClick={logout} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0a0a0a]">
                    <div className="flex items-center gap-6 flex-1 max-w-3xl">
                        <div className="flex items-center gap-2 text-sm text-green-500 font-medium tracking-wide whitespace-nowrap">
                            <Shield size={16} /> <span className="hidden lg:inline">Backend Authorized  •  BC Integrated</span>
                        </div>
                        <UniversalSearchBar />
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsQRScannerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <QrCode size={16} /> Scan Patient QR
                        </button>
                        <button 
                            onClick={() => setIsDelayModalOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${user?.delayStatus?.isDelayed ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-white/5'}`}
                        >
                            <Clock size={16} /> 
                            {user?.delayStatus?.isDelayed ? 'DELAY REPORTED' : 'REPORT DELAY'}
                        </button>
                        <NotificationBell count={notificationCount} onClick={resetNotifications} />
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">Dr. {user?.name || 'Doctor'}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter leading-tight font-medium">{user?.hospitalName || 'Medicare Partner'}</p>
                                <p className="text-[9px] text-emerald-500/80 uppercase font-black tracking-widest mt-0.5">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 overflow-hidden ring-2 ring-emerald-500/10">
                                {user?.profileImage ? (
                                    <img src={`${getBaseUrl()}/${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-gray-400" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {activeTab === 'availability' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <DoctorAvailability />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <SettingsView />
                    </div>
                )}

                {activeTab === 'patients' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <h2 className="text-3xl font-bold mb-6">My Patients (Under Medication)</h2>
                        {loadingData ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="animate-spin text-green-500 w-10 h-10" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {patients.map((p) => (
                                    <div key={p._id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                                <User size={24} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{p.name}</h3>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Patient</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Email:</span>
                                                <span className="text-gray-300">{p.email}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">ID:</span>
                                                <span className="text-gray-300 font-mono text-xs">{p._id}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewHistory(p._id, p.name)}
                                                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLabOrderForm({ ...labOrderForm, patientId: p._id });
                                                    setIsLabTestModalOpen(true);
                                                }}
                                                className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Lab Test
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPrescriptionForm({ ...initialPrescriptionForm, patientId: p._id });
                                                    setIsPrescriptionModalOpen(true);
                                                }}
                                                className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Prescribe
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {patients.length === 0 && (
                                    <div className="col-span-full text-center py-12 bg-[#111] border border-gray-800 rounded-2xl">
                                        <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-500">No patients under medication.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold">Appointments</h2>
                            {user?.delayStatus?.isDelayed && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right-4 duration-500 shadow-xl shadow-amber-900/5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                        <Clock size={20} className="text-amber-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-[0.2em]">Active Delay Reported</h4>
                                        <p className="text-amber-200/60 text-[11px] mt-0.5 font-medium">
                                            ETA: <span className="text-white font-bold">{user.delayStatus.expectedArrivalTime}</span> • "{user.delayStatus.reason}"
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsDelayModalOpen(true)}
                                        className="ml-2 p-2 hover:bg-white/5 rounded-lg text-amber-500 transition-colors"
                                        title="Update Status"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Appointment Requests */}
                            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Clock className="text-yellow-500" /> Pending Requests
                                </h3>
                                <div className="space-y-4">
                                    {appointments.filter(a => a.status === 'pending')
                                        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                                        .map(app => (
                                        <div key={app._id} className={`bg-[#1a1a1a] rounded-xl border p-4 ${app.isEmergency ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-gray-800'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-lg">{app.patientId?.name || 'Unknown Patient'}</h4>
                                                        {app.isEmergency && (
                                                            <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse shadow-lg shadow-red-900/20">
                                                                EMERGENCY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-300 text-sm">
                                                        {new Date(app.date).toLocaleDateString()} at {app.time}
                                                    </p>
                                                </div>
                                                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded">PENDING</span>
                                            </div>
                                            
                                            {app.isEmergency && app.emergencyReason && (
                                                <div className="mt-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg mb-4">
                                                    <p className="text-[10px] font-black text-red-500/80 uppercase tracking-widest mb-1">Emergency Reason</p>
                                                    <p className="text-xs text-gray-300 italic">"{app.emergencyReason}"</p>
                                                </div>
                                            )}
                                            {!app.isEmergency && app.reason && (
                                                <p className="text-gray-500 text-sm mb-4 italic">"{app.reason}"</p>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAppointmentStatus(app._id, 'approved')}
                                                    disabled={statusLoadingId === app._id}
                                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                                >
                                                    {statusLoadingId === app._id ? '...' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleAppointmentStatus(app._id, 'rejected')}
                                                    disabled={statusLoadingId === app._id}
                                                    className="flex-1 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-500 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {appointments.filter(a => a.status === 'pending').length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No pending requests.</p>
                                    )}
                                </div>
                            </div>

                            {/* Patients for Check-up (Approved Appointments) */}
                            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <CheckCircle className="text-green-500" /> Check-up Queue
                                </h3>
                                <div className="space-y-4">
                                    {[...appointments.filter(a => a.status === 'approved'), ...appointments.filter(a => a.status === 'completed')]
                                        .sort((a, b) => {
                                            // 1. Status: Active (approved) always above Completed
                                            if (a.status === 'approved' && b.status === 'completed') return -1;
                                            if (a.status === 'completed' && b.status === 'approved') return 1;
                                            
                                            // 2. Emergency & Priority: Absolute top priority
                                            const aPriority = (a.isEmergency ? 100 : 0) + (a.priority || 0);
                                            const bPriority = (b.isEmergency ? 100 : 0) + (b.priority || 0);
                                            
                                            if (bPriority !== aPriority) {
                                                return bPriority - aPriority;
                                            }
                                            
                                            // 3. Date & Time: Earliest first for same priority
                                            const dateA = new Date(`${a.date} ${a.time}`);
                                            const dateB = new Date(`${b.date} ${b.time}`);
                                            return dateA - dateB;
                                        })
                                        .map(app => (
                                        <div key={app._id} className={`flex flex-col p-4 bg-[#1a1a1a] rounded-xl border hover:border-green-500/30 transition-colors ${app.status === 'completed' ? 'opacity-50 border-gray-800' : 'border-gray-800'} ${app.isEmergency && app.status !== 'completed' ? 'ring-1 ring-red-500/30 bg-red-500/[0.02]' : ''}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${app.isEmergency && app.status !== 'completed' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                                                        <User size={18} className={app.isEmergency && app.status !== 'completed' ? 'text-red-500' : 'text-green-500'} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={`font-bold text-sm ${app.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{app.patientId?.name}</h4>
                                                            {app.isEmergency && app.status !== 'completed' && (
                                                                <span className={`text-white text-xs font-black px-1.5 py-0.5 rounded animate-pulse shadow-lg ${app.priority > 1 ? 'bg-red-600 shadow-red-900/40 ring-1 ring-white/20' : 'bg-red-500 shadow-red-900/20'}`}>
                                                                    {app.priority > 1 ? '🔥 HIGH PRIORITY EMERGENCY' : 'EMERGENCY'}
                                                                </span>
                                                            )}
                                                            {app.status === 'completed' && (
                                                                <span className="bg-green-600/20 text-green-500 text-xs font-black px-1.5 py-0.5 rounded">
                                                                    COMPLETED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">{app.time} • {new Date(app.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewHistory(app.patientId?._id, app.patientId?.name)}
                                                        disabled={app.status === 'completed'}
                                                        className={`p-2 rounded-lg transition-colors ${app.status === 'completed' ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500'}`}
                                                        title="View History"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setLabOrderForm({ ...labOrderForm, patientId: app.patientId?._id });
                                                            setIsLabTestModalOpen(true);
                                                        }}
                                                        disabled={app.status === 'completed'}
                                                        className={`p-2 rounded-lg transition-colors ${app.status === 'completed' ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed' : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500'}`}
                                                        title="Order Lab Test"
                                                    >
                                                        <Activity size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPrescriptionForm({ ...initialPrescriptionForm, patientId: app.patientId?._id });
                                                            setIsPrescriptionModalOpen(true);
                                                        }}
                                                        disabled={app.status === 'completed'}
                                                        className={`p-2 rounded-lg transition-colors ${app.status === 'completed' ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500'}`}
                                                        title="Issue Prescription"
                                                    >
                                                        <ClipboardList size={18} />
                                                    </button>
                                                    {app.status !== 'completed' ? (
                                                        <button
                                                            onClick={() => handleAppointmentStatus(app._id, 'completed')}
                                                            disabled={statusLoadingId === app._id}
                                                            className="p-2 bg-green-500/10 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors"
                                                            title="Mark Completed"
                                                        >
                                                            {statusLoadingId === app._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="p-2 bg-gray-500/10 text-gray-600 rounded-lg cursor-not-allowed"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {app.isEmergency && app.emergencyReason && (
                                                <div className="mt-1 p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                                                    <p className="text-xs font-black text-red-500/80 uppercase tracking-widest mb-1">Emergency Reason</p>
                                                    <p className="text-xs text-gray-300 italic">"{app.emergencyReason}"</p>
                                                </div>
                                            )}
                                            {!app.isEmergency && app.reason && (
                                                <div className="mt-1 p-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Reason</p>
                                                    <p className="text-xs text-gray-400">"{app.reason}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {[...appointments.filter(a => a.status === 'approved'), ...appointments.filter(a => a.status === 'completed')].length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No patients in queue.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <h2 className="text-3xl font-bold mb-6">Overview</h2>

                        {loadingData ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="animate-spin text-green-500 w-10 h-10" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <StatCard 
                                        icon={Calendar} 
                                        title="Appointments Today" 
                                        value={appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length} 
                                        color="text-purple-500" 
                                        bg="bg-purple-500/10" 
                                    />
                                    <StatCard 
                                        icon={Users} 
                                        title="Total Patients" 
                                        value={patients.length} 
                                        color="text-blue-500" 
                                        bg="bg-blue-500/10" 
                                    />
                                    <StatCard 
                                        icon={FileText} 
                                        title="Pending BC Verify" 
                                        value={overview.pendingRecords} 
                                        color="text-yellow-500" 
                                        bg="bg-yellow-500/10" 
                                    />
                                    <StatCard 
                                        icon={Database} 
                                        title="BC Verification" 
                                        value={`${overview.blockchainVerifiedPercentage}%`} 
                                        color="text-green-500" 
                                        bg="bg-green-500/10" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <ClipboardList className="text-green-500" /> Administrative Actions
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setIsRecordModalOpen(true)}
                                                    className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl font-medium transition-colors text-left shadow-lg flex justify-between items-center group"
                                                >
                                                    Create Medical Record <Plus size={18} className="opacity-70 group-hover:opacity-100" />
                                                </button>
                                                <button
                                                    onClick={() => setIsPrescriptionModalOpen(true)}
                                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white p-4 rounded-xl font-medium transition-colors text-left flex justify-between items-center group"
                                                >
                                                    Issue Prescription <Plus size={18} className="opacity-70 group-hover:opacity-100" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* APPOINTMENT REQUESTS DECK */}
                                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <Calendar className="text-purple-500" /> Appointment Requests
                                            </h3>
                                            <div className="space-y-4">
                                                {appointments.map(app => (
                                                    <div key={app._id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-lg">{app.patientId?.name || 'Unknown Patient'}</h4>
                                                                    {app.isEmergency && (
                                                                        <span className={`text-white text-xs font-black px-1.5 py-0.5 rounded animate-pulse shadow-lg ${app.priority > 1 ? 'bg-red-600 shadow-red-900/40 ring-1 ring-white/20' : 'bg-red-500 shadow-red-900/20'}`}>
                                                                            {app.priority > 1 ? '🔥 HIGH PRIORITY EMERGENCY' : 'EMERGENCY'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-400 font-mono text-xs">{app.patientId?._id}</p>
                                                            </div>
                                                            {app.status === 'pending' && <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Clock size={12} /> PENDING</span>}
                                                            {app.status === 'approved' && (
                                                                <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${app.isEmergency ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-green-500/10 text-green-500'}`}>
                                                                    <CheckCircle size={12} /> {app.isEmergency ? 'URGENT: START CHECKUP' : 'APPROVED'}
                                                                </span>
                                                            )}
                                                            {app.status === 'rejected' && <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><XCircle size={12} /> REJECTED</span>}
                                                        </div>
                                                        <p className="text-gray-300 text-sm mb-3">
                                                            <span className="font-semibold">{new Date(app.date).toLocaleDateString()} at {app.time}</span>
                                                            <span className="text-gray-500"> — {app.reason}</span>
                                                        </p>

                                                        {app.status === 'pending' && (
                                                            <div className="flex gap-2 border-t border-gray-800 pt-3">
                                                                <button
                                                                    onClick={() => handleAppointmentStatus(app._id, 'approved')}
                                                                    disabled={statusLoadingId === app._id}
                                                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm font-bold transition-colors flex-1 disabled:opacity-50"
                                                                >
                                                                    {statusLoadingId === app._id ? 'Processing...' : 'Approve'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAppointmentStatus(app._id, 'rejected')}
                                                                    disabled={statusLoadingId === app._id}
                                                                    className="bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-500 px-4 py-1.5 rounded text-sm font-bold transition-colors flex-1 disabled:opacity-50"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}

                                                        {app.status === 'approved' && (
                                                            <div className="flex gap-2 border-t border-gray-800 pt-3">
                                                                <button
                                                                    onClick={() => openPrescriptionModal(app.patientId?._id)}
                                                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors flex-1"
                                                                >
                                                                    Give Prescription
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAppointmentStatus(app._id, 'completed')}
                                                                    disabled={statusLoadingId === app._id}
                                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors flex-1 disabled:opacity-50"
                                                                >
                                                                    {statusLoadingId === app._id ? 'Processing...' : 'Complete Checkup'}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {app.status === 'completed' && (
                                                            <div className="border-t border-gray-800 pt-3">
                                                                <span className="text-gray-500 text-xs italic flex items-center gap-1">
                                                                    <CheckCircle size={14} /> Checkup finished
                                                                </span>
                                                            </div>
                                                        )}

                                                    </div>
                                                ))}
                                                {appointments.length === 0 && <p className="text-gray-500 text-sm">No appointments scheduled.</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1 space-y-8">
                                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                            <h3 className="text-xl font-bold mb-4">Patient Workflow Directory</h3>
                                            <div className="space-y-4">
                                                {patients.slice(0, 5).map((p) => (
                                                    <div key={p._id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl border border-gray-800">
                                                        <div>
                                                            <p className="font-bold text-sm">{p.name}</p>
                                                            <p className="text-gray-500 font-mono text-xs">{p._id.substring(0, 8)}...</p>
                                                        </div>
                                                        <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded">ACTIVE</span>
                                                    </div>
                                                ))}
                                                {patients.length === 0 && <p className="text-sm text-gray-500">No patients assigned to the system.</p>}
                                            </div>
                                        </div>

                                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                            <h3 className="text-xl font-bold mb-4">Live Activity</h3>
                                            <div className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-300">Dashboard Synchronized.</p>
                                                        <p className="text-xs text-gray-500">Just now</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-300">Authentication Validated</p>
                                                        <p className="text-xs text-gray-500">On Login</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'verification' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-bold">Pending BC Verification</h2>
                                <p className="text-gray-500 mt-1">These records were created during blockchain downtime and need manual sync.</p>
                            </div>
                            <button 
                                onClick={loadPendingRecordsData}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-gray-700"
                            >
                                Refresh List
                            </button>
                        </div>

                        <div className="space-y-4">
                            {pendingRecordsList.map((record) => (
                                <div key={record._id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded">PENDING SYNC</span>
                                            <h3 className="font-bold text-lg">{record.diagnosis}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase">Patient</p>
                                                <p className="text-gray-300 font-medium">{record.patientId?.name || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase">Created On</p>
                                                <p className="text-gray-300">{new Date(record.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-gray-400 text-sm line-clamp-1 italic">"{record.treatmentPlan}"</p>
                                    </div>
                                    <div className="shrink-0 w-full md:w-auto">
                                        <button
                                            onClick={() => handleVerifyRecord(record._id)}
                                            disabled={statusLoadingId === record._id}
                                            className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {statusLoadingId === record._id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield size={18} /> Sync with Blockchain
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {pendingRecordsList.length === 0 && (
                                <div className="text-center py-20 bg-[#111] border border-gray-800 rounded-3xl">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={40} className="text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">All Clear!</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">All medical records are successfully verified and stored on the blockchain.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'admitted' && (
                    <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a]">
                        <h2 className="text-3xl font-bold mb-6">Admitted Patients</h2>
                        {loadingData ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="animate-spin text-green-500 w-10 h-10" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {admittedPatients.map((p) => (
                                    <div key={p._id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{p.name}</h3>
                                                <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">{p.admission?.ward} Ward</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Email:</span>
                                                <span className="text-gray-300">{p.email}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Admitted On:</span>
                                                <span className="text-gray-300">{new Date(p.admission?.admittedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Blood Group:</span>
                                                <span className="text-emerald-400 font-bold">{p.bloodGroup || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewHistory(p._id, p.name)}
                                                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLabOrderForm({ ...labOrderForm, patientId: p._id });
                                                    setIsLabTestModalOpen(true);
                                                }}
                                                className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Lab Test
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPrescriptionForm({ ...initialPrescriptionForm, patientId: p._id, deliveryType: 'WARD', wardNumber: p.admission?.ward });
                                                    setIsPrescriptionModalOpen(true);
                                                }}
                                                className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Prescribe
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCertificateForm({ patientId: p._id, status: p.admission?.certificate?.status || '' });
                                                    setIsCertificateModalOpen(true);
                                                }}
                                                className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Certificate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {admittedPatients.length === 0 && (
                                    <div className="col-span-full text-center py-12 bg-[#111] border border-gray-800 rounded-2xl">
                                        <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-500">No patients admitted in your {user?.specialization === 'General Physician' ? 'ward' : 'hospital'}.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- CREATE MEDICAL RECORD MODAL --- */}
            {isRecordModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-green-500" /> New Secure Medical Record</h2>
                            <button onClick={() => setIsRecordModalOpen(false)} className="text-gray-500 hover:text-white bg-gray-900 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRecordSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Select Patient</label>
                                <select required value={recordForm.patientId} onChange={e => setRecordForm({ ...recordForm, patientId: e.target.value })} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors">
                                    <option value="" disabled>-- Select a patient --</option>
                                    {[...patients, ...admittedPatients]
                                        .filter((v, i, a) => a.findIndex(t => t._id === v._id) === i)
                                        .map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Diagnosis</label>
                                    <input required type="text" value={recordForm.diagnosis} onChange={e => setRecordForm({ ...recordForm, diagnosis: e.target.value })} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500" placeholder="e.g. Acute Bronchitis" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Symptoms observed</label>
                                    <input required type="text" value={recordForm.symptoms} onChange={e => setRecordForm({ ...recordForm, symptoms: e.target.value })} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500" placeholder="e.g. Cough, Fever" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Lab Results (Optional)</label>
                                <textarea value={recordForm.labResults} onChange={e => setRecordForm({ ...recordForm, labResults: e.target.value })} className="w-full min-h-[80px] bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500" placeholder="Summary of test outcomes..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Treatment Plan</label>
                                <textarea required value={recordForm.treatmentPlan} onChange={e => setRecordForm({ ...recordForm, treatmentPlan: e.target.value })} className="w-full min-h-[80px] bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500" placeholder="Proposed course of action..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Doctor Notes</label>
                                <textarea value={recordForm.notes} onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })} className="w-full min-h-[60px] bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-green-500" placeholder="Additional observations..."></textarea>
                            </div>

                            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitLoading} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center min-w-[140px] transition-colors disabled:opacity-50">
                                    {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Commit to BC'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CREATE PRESCRIPTION MODAL --- */}
            {isPrescriptionModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList size={20} className="text-purple-500" /> Issue Prescription</h2>
                            <button onClick={() => setIsPrescriptionModalOpen(false)} className="text-gray-500 hover:text-white bg-gray-900 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePrescriptionSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Select Patient</label>
                                <select required value={prescriptionForm.patientId} onChange={e => setPrescriptionForm({ ...prescriptionForm, patientId: e.target.value })} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors">
                                    <option value="" disabled>-- Select a patient --</option>
                                    {[...patients, ...admittedPatients]
                                        .filter((v, i, a) => a.findIndex(t => t._id === v._id) === i)
                                        .map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-sm font-medium text-gray-400">Medications</label>
                                    <button type="button" onClick={addMedicineRow} className="text-xs bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"><Plus size={14} /> Add Row</button>
                                </div>
                                <div className="space-y-3">
                                    {medicines.map((med, index) => (
                                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[#0a0a0a] p-3 rounded-lg border border-gray-800">
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="relative">
                                                    <DrugSearchInput
                                                        required
                                                        value={med.name}
                                                        onChange={(val) => updateMedicineRow(index, 'name', val)}
                                                        onSelect={(drug) => handleDrugSelect(index, drug)}
                                                        placeholder="Name (e.g. Amoxicillin)"
                                                        className="w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none text-white"
                                                    />
                                                    {med.price && (
                                                        <div className="absolute right-0 top-full mt-1 z-10">
                                                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                                                ₹{med.price}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <select
                                                required
                                                value={med.frequency}
                                                onChange={(e) => updateMedicineRow(index, 'frequency', e.target.value)}
                                                className="w-[150px] bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none text-white"
                                            >
                                                <option value="" disabled>Frequency</option>
                                                <option value="Once Daily">Once Daily</option>
                                                <option value="Twice Daily">Twice Daily</option>
                                                <option value="Thrice Daily">Thrice Daily</option>
                                                <option value="Four Times Daily">Four Times Daily</option>
                                                <option value="Every 4 Hours">Every 4 Hours</option>
                                                <option value="Every 6 Hours">Every 6 Hours</option>
                                                <option value="As Needed">As Needed</option>
                                            </select>
                                            <div className="relative w-[120px]">
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    placeholder="Duration"
                                                    value={med.duration}
                                                    onChange={(e) => updateMedicineRow(index, 'duration', e.target.value)}
                                                    className="w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none text-white pr-10"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">days</span>
                                            </div>
                                            {medicines.length > 1 && (
                                                <button type="button" onClick={() => removeMedicineRow(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Notes / Instructions</label>
                                <textarea 
                                    value={prescriptionForm.notes} 
                                    onChange={e => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })} 
                                    className="w-full min-h-[80px] bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500" 
                                    placeholder="Stay hydrated, take with food..."
                                ></textarea>
                            </div>

                            <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl space-y-4">
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Delivery Destination</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPrescriptionForm(prev => ({ ...prev, deliveryType: 'PHARMACY' }))}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                                            prescriptionForm.deliveryType === 'PHARMACY' 
                                            ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold' 
                                            : 'bg-transparent border-gray-800 text-gray-500'
                                        }`}
                                    >
                                        <Activity size={18} /> Pharmacy Pickup
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const patientObj = admittedPatients.find(p => p._id === prescriptionForm.patientId) || patients.find(p => p._id === prescriptionForm.patientId);
                                            const isAdmitted = patientObj?.admission?.isAdmitted;
                                            
                                            if (!isAdmitted) {
                                                showToast("Warning: Patient is not admitted. Direct Ward delivery is not suggested.");
                                            }
                                            
                                            setPrescriptionForm(prev => ({ 
                                                ...prev, 
                                                deliveryType: 'WARD',
                                                wardNumber: patientObj?.admission?.ward || prev.wardNumber
                                            }));
                                        }}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                                            prescriptionForm.deliveryType === 'WARD' 
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold' 
                                            : 'bg-transparent border-gray-800 text-gray-500'
                                        }`}
                                    >
                                        <LayoutGrid size={18} /> Ward Delivery
                                    </button>
                                </div>

                                {prescriptionForm.deliveryType === 'WARD' && (
                                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                                        {(admittedPatients.find(p => p._id === prescriptionForm.patientId) || patients.find(p => p._id === prescriptionForm.patientId))?.admission?.isAdmitted ? (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2 text-emerald-500 text-xs font-bold">
                                                <CheckCircle size={14} /> Patient is admitted to { (admittedPatients.find(p => p._id === prescriptionForm.patientId) || patients.find(p => p._id === prescriptionForm.patientId))?.admission?.ward || 'General Ward' }
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold">
                                                <XCircle size={14} /> Attention: Selected patient is not admitted.
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest px-1">Ward #</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Ward (e.g. ICU-3)"
                                                    value={prescriptionForm.wardNumber}
                                                    onChange={e => setPrescriptionForm(prev => ({ ...prev, wardNumber: e.target.value }))}
                                                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest px-1">Room No</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Room (e.g. 102)"
                                                    value={prescriptionForm.roomNo}
                                                    onChange={e => setPrescriptionForm(prev => ({ ...prev, roomNo: e.target.value }))}
                                                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest px-1">Delivery Priority</label>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setPrescriptionForm(prev => ({ ...prev, isEmergency: false }))}
                                                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                                                        !prescriptionForm.isEmergency 
                                                        ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                                                        : 'bg-[#111] border-gray-800 text-gray-500'
                                                    }`}
                                                >
                                                    Normal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPrescriptionForm(prev => ({ ...prev, isEmergency: true }))}
                                                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                                                        prescriptionForm.isEmergency 
                                                        ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-900/20' 
                                                        : 'bg-[#111] border-gray-800 text-gray-500'
                                                    }`}
                                                >
                                                    Emergency
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl">
                                <span className="text-gray-400 text-sm">Total Estimated Cost</span>
                                <span className="text-xl font-bold text-green-400">₹{calculateTotal()}</span>
                            </div>

                            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsPrescriptionModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitLoading || medicines.length === 0} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center min-w-[140px] transition-colors disabled:opacity-50">
                                    {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Issue Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- PATIENT HISTORY MODAL --- */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2"><FileText size={20} className="text-blue-500" /> Patient History</h2>
                                <p className="text-sm text-gray-400">Records for {selectedPatientName}</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-white bg-gray-900 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {historyLoading ? (
                                <Loader message="Accessing Patient Records" />
                            ) : (
                                <>
                                    {patientHistory.length === 0 ? (
                                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 animate-pulse">
                                            <Activity className="mx-auto text-gray-600 mb-4" size={48} />
                                            <p className="text-gray-400 font-medium">No medical history records available.</p>
                                        </div>
                                    ) : (
                                        patientHistory.map((record) => (
                                            <div key={record._id} className="group relative bg-[#0f1115] border border-white/[0.08] rounded-[32px] overflow-hidden hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                                
                                                <div className="p-8 relative z-10">
                                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                                        <div className="flex-1">
                                                            <h3 className="font-black text-2xl text-white tracking-tight mb-3 group-hover:text-blue-400 transition-colors duration-300">
                                                                {record.diagnosis || record.title || 'Clinical Entry'}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                                                                    <Calendar size={12} className="text-blue-500" /> {new Date(record.createdAt).toLocaleDateString()}
                                                                </span>
                                                                {record.blockchainTxHash && (
                                                                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                                                        <Shield size={10} /> BC Verified
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-end text-right gap-2.5">
                                                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-[20px] backdrop-blur-md shadow-2xl min-w-[180px]">
                                                                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-1">Attending Physician</p>
                                                                <p className="text-sm font-black text-white uppercase italic">
                                                                    {record.orderedBy?.name ? `Dr. ${record.orderedBy.name}` : (record.doctorId?.name ? `Dr. ${record.doctorId.name}` : 'Clinical Staff')}
                                                                </p>
                                                            </div>
                                                            {(record.hospitalName || record.orderedBy?.hospitalName || record.doctorId?.hospitalName) && (
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] flex items-center gap-2 mt-1 pr-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                    <Database size={12} className="text-blue-500/40" /> {record.hospitalName || record.orderedBy?.hospitalName || record.doctorId?.hospitalName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                        <div className="bg-white/[0.02] border border-white/[0.04] p-6 rounded-[24px] hover:bg-white/[0.04] transition-all duration-300 relative group/box">
                                                            <div className="absolute top-4 right-4 text-blue-500/20 group-hover/box:text-blue-500/40 transition-colors">
                                                                <Activity size={24} />
                                                            </div>
                                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">Treatment Protocol</h4>
                                                            <p className="text-gray-300 leading-relaxed font-medium">
                                                                {record.treatmentPlan || record.description || 'Routine observation and monitoring as per standard protocol.'}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="bg-white/[0.02] border border-white/[0.04] p-6 rounded-[24px] hover:bg-white/[0.04] transition-all duration-300 relative group/box">
                                                            <div className="absolute top-4 right-4 text-purple-500/20 group-hover/box:text-purple-500/40 transition-colors">
                                                                    <FileText size={24} />
                                                            </div>
                                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">Practitioner Notes</h4>
                                                            <p className="text-gray-400 leading-relaxed font-medium italic">
                                                                "{record.notes || 'No specific clinical observations noted for this session.'}"
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-white/[0.06] gap-6">
                                                        <div className="flex flex-col gap-1.5 w-full md:w-auto">
                                                            <div className="text-emerald-500/40 font-mono text-[9px] flex items-center gap-2 group-hover:text-emerald-500/70 transition-colors">
                                                                <Shield size={12} /> SECURE BLOCKCHAIN TRANSACTION ID
                                                            </div>
                                                            <div className="text-[10px] font-mono text-gray-600 truncate max-w-xs group-hover:text-gray-400 transition-colors">
                                                                {record.blockchainTxHash || "Verification pending on-chain..."}
                                                            </div>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => {
                                                                if (record.fileUrl) {
                                                                    const url = `${getBaseUrl()}/${record.fileUrl.replace(/\\/g, '/').replace(/^\/?(backend\/)?/, '')}`;
                                                                    const type = record.fileUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
                                                                    setPreviewFile({ url, type });
                                                                } else {
                                                                    handleViewRecord(record);
                                                                }
                                                            }}
                                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            Full Clinical Narrative <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- LAB TEST MODAL --- */}
            {isLabTestModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-visible">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111] rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">Order Lab Test</h2>
                                <p className="text-sm text-gray-400">Select a test for the patient</p>
                            </div>
                            <button onClick={() => setIsLabTestModalOpen(false)} className="text-gray-500 hover:text-white bg-gray-900 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleLabOrderSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Patient</label>
                                <select
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    value={labOrderForm.patientId}
                                    onChange={(e) => setLabOrderForm({ ...labOrderForm, patientId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Patient</option>
                                    {[...patients, ...admittedPatients]
                                        .filter((v, i, a) => a.findIndex(t => t._id === v._id) === i) // Unique patients
                                        .map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Required Lab Tests</label>
                                    <button 
                                        type="button" 
                                        onClick={addLabRow} 
                                        className="text-xs bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={14} /> Add Row
                                    </button>
                                </div>
                                <div className="space-y-4 max-h-[40vh] overflow-visible pr-2 scrollbar-hide">
                                    {labOrderForm.tests.map((test, index) => (
                                        <div key={index} className="flex gap-3 items-start bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 relative group animate-fade-in">
                                            <div className="flex-1 overflow-visible">
                                                <LabTestSearchInput
                                                    required
                                                    value={test.testName}
                                                    onChange={(name) => updateLabRow(index, 'testName', name)}
                                                    onSelect={(t) => {
                                                        updateLabRow(index, 'testName', t.testName);
                                                        updateLabRow(index, 'price', t.price);
                                                    }}
                                                    placeholder="Search for lab test (e.g. CBC, Lipid Profile)"
                                                    className="w-full bg-transparent border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                {test.price > 0 && (
                                                    <div className="absolute top-2 right-12 z-20">
                                                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                                            ₹{test.price}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {labOrderForm.tests.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeLabRow(index)} 
                                                    className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {calculateLabOrderTotal() > 0 && (
                                <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center bg-gradient-to-r from-blue-500/5 to-transparent">
                                    <span className="text-blue-400 font-bold uppercase tracking-wide text-sm">Total Estimated Order Cost</span>
                                    <span className="text-2xl font-bold text-white">₹{calculateLabOrderTotal()}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                            >
                                {submitLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                Confirm Order
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DOCTOR DELAY MODAL --- */}
            {isDelayModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0f1110] border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-transparent">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="text-amber-500" /> Report Arrival Delay
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Status Broadcast to Booked Patients</p>
                            </div>
                            <button onClick={() => setIsDelayModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleDelaySubmit} className="p-6 space-y-5">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-sm font-bold text-gray-300">Are you running late?</span>
                                <button
                                    type="button"
                                    onClick={() => setDelayForm({ ...delayForm, isDelayed: !delayForm.isDelayed })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${delayForm.isDelayed ? 'bg-amber-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${delayForm.isDelayed ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {delayForm.isDelayed && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Reason for Delay</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {QUICK_REASONS.map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setDelayForm({ ...delayForm, reason: r })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${delayForm.reason === r ? 'bg-amber-500 border-amber-400 text-black' : 'bg-white/5 border-white/10 text-gray-400 hover:border-amber-500/50 hover:text-amber-200'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            required
                                            value={delayForm.reason}
                                            onChange={(e) => setDelayForm({ ...delayForm, reason: e.target.value })}
                                            placeholder="Or enter a custom reason..."
                                            className="w-full bg-white/5 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors min-h-[100px] resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Expected Arrival Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={delayForm.expectedArrivalTime}
                                            onChange={(e) => setDelayForm({ ...delayForm, expectedArrivalTime: e.target.value })}
                                            className="w-full bg-white/5 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${delayForm.isDelayed ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20' : 'bg-gray-800 hover:bg-gray-700 text-white shadow-black/20'}`}
                            >
                                {submitLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle size={18} />}
                                {delayForm.isDelayed ? 'BROADCAST DELAY' : 'CLEAR DELAY STATUS'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- FILE PREVIEW MODAL --- */}
            {previewFile && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
                    <div className="absolute top-6 right-6 flex items-center gap-4">
                         <a 
                            href={previewFile.url} 
                            download 
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2.5 rounded-full transition-colors border border-gray-700 shadow-xl"
                            title="Download Report"
                        >
                            <LayoutGrid size={24} />
                        </a>
                        <button 
                            onClick={() => setPreviewFile(null)} 
                            className="text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-full p-2.5 transition-all hover:scale-110 shadow-xl"
                        >
                            <X size={28} />
                        </button>
                    </div>
                    
                    <div className="w-full max-w-5xl h-full flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                            {previewFile.type === 'pdf' ? (
                                <iframe 
                                    src={previewFile.url} 
                                    className="w-full h-full rounded-2xl border border-gray-800 bg-white shadow-2xl"
                                    title="Full Report PDF"
                                />
                            ) : (
                                <div className="relative group max-h-full max-w-full overflow-auto rounded-2xl scrollbar-hide">
                                    <img 
                                        src={previewFile.url} 
                                        alt="Clinical Report Full" 
                                        className="rounded-2xl shadow-2xl border border-gray-800 max-h-[85vh] object-contain mx-auto"
                                    />
                                    <div className="absolute inset-0 bg-transparent group-hover:bg-white/5 transition-colors pointer-events-none"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6 text-gray-400 text-xs font-medium uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full border border-gray-800/50">
                        Secure Electronic Health Record Preview
                    </div>
                </div>
            )}

            {/* --- ADMISSION CERTIFICATE MODAL --- */}
            {isCertificateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0c0d0e] border border-white/10 rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-amber-500/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Activity size={24} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Issue Clinical Certificate</h2>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Official Recovery & Discharge Documentation</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Authorizing Physician</p>
                                    <p className="text-sm font-bold text-amber-500">Dr. {user?.name}</p>
                                </div>
                                <button 
                                    onClick={() => setIsCertificateModalOpen(false)} 
                                    className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCertificateSubmit} className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Column: Status & Notes */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Clinical Recovery Status</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {["90% Cured", "Clinically Safe", "Stable & Improving", "Fit for Discharge", "Recovering Well"].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setCertificateForm({ ...certificateForm, status })}
                                                    className={`py-3 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                                                        certificateForm.status === status 
                                                        ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]' 
                                                        : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-4">
                                            <input
                                                type="text"
                                                placeholder="Or type custom clinical status..."
                                                value={certificateForm.status}
                                                onChange={(e) => setCertificateForm({ ...certificateForm, status: e.target.value })}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.04] transition-all placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Physician Notes & Restrictions</label>
                                        <textarea
                                            rows={6}
                                            placeholder="Enter patient recovery notes, restrictions, and return-to-work advice..."
                                            value={certificateForm.notes}
                                            onChange={(e) => setCertificateForm({ ...certificateForm, notes: e.target.value })}
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-[24px] px-6 py-5 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.04] transition-all resize-none leading-relaxed placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Discharge & Follow-up */}
                                <div className="space-y-8 bg-white/[0.02] rounded-[32px] p-8 border border-white/5 flex flex-col justify-between">
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl group transition-all hover:bg-white/[0.05]">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${certificateForm.recommendDischarge ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                                                    <CheckCircle size={24} className={certificateForm.recommendDischarge ? 'text-emerald-500' : 'text-gray-600'} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">Recommend Discharge</p>
                                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Authorize immediate home recovery</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCertificateForm(prev => ({ ...prev, recommendDischarge: !prev.recommendDischarge }))}
                                                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${certificateForm.recommendDischarge ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-gray-800'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${certificateForm.recommendDischarge ? 'left-8' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className={`space-y-4 transition-all duration-500 ${certificateForm.recommendDischarge ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4'}`}>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                                <Calendar size={14} className="text-amber-500" /> Suggested Follow-up Visit
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={certificateForm.followUpDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => setCertificateForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-600 font-medium italic px-2 leading-relaxed">
                                                * This date will be printed on the official certificate as the recommended clinical review date.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-8 space-y-4">
                                        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                            <Shield size={16} className="text-amber-500/50" />
                                            <p className="text-[10px] text-amber-500/70 font-black uppercase tracking-[0.15em]">Blockchain Verified Issuance</p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitLoading || !certificateForm.status}
                                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-amber-500/10 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                                        >
                                            {submitLoading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                                            Finalize & Issue Certificate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- QR SCANNER MODAL --- */}
            <QRScannerModal 
                isOpen={isQRScannerOpen} 
                onClose={() => setIsQRScannerOpen(false)} 
            />
        </div>
    );
};

const NavItem = ({ icon: Icon, label, active, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${active
            ? 'bg-green-500 text-black font-bold shadow-lg shadow-green-900/20'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
    >
        <div className="flex items-center gap-3"><Icon size={20} /><span className="text-sm">{label}</span></div>
        {badge && badge !== "0" && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-black/20 text-black' : 'bg-red-500 text-white'}`}>{badge}</span>
        )}
    </button>
);

const StatCard = ({ icon: Icon, title, value, color, bg }) => (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
        </div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold truncate">{value}</h3>
    </div>
);

export default DoctorDashboard;
