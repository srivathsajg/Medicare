import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, MapPin, ShieldCheck, ArrowRight, AlertCircle, ChevronLeft, Loader2, User, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHospitals, fetchDoctors, bookAppointment, fetchPatientAppointments } from '../../services/patientApi';
import { getBaseUrl } from '../../services/userApi';
import Loader from '../../components/ui/Loader';

const EmergencyBookingPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Situation & Hospital, 2: Doctor Selection
    const [loading, setLoading] = useState(true);
    const [hospitals, setHospitals] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [emergencyReason, setEmergencyReason] = useState('');
    const [booking, setBooking] = useState(false);
    const [selectedSpecialization, setSelectedSpecialization] = useState('All');
    const [activeAppointment, setActiveAppointment] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                // Check for active appointments first
                const appointmentsRes = await fetchPatientAppointments();
                if (appointmentsRes?.success) {
                    const active = appointmentsRes.data.find(a => ['pending', 'approved'].includes(a.status));
                    if (active) {
                        setActiveAppointment(active);
                        setLoading(false);
                        return;
                    }
                }

                const res = await fetchHospitals();
                if (res?.success) {
                    setHospitals(res.data);
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const loadDoctors = async () => {
            if (step === 2 && selectedHospital && !activeAppointment) {
                setLoading(true);
                try {
                    const res = await fetchDoctors({ 
                        hospitalName: selectedHospital.hospitalName, 
                        specialization: 'All',
                        isEmergency: true 
                    });
                    if (res?.success) {
                        setDoctors(res.data.doctors || res.data);
                    }
                } catch (error) {
                    console.error("Error loading doctors:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadDoctors();
    }, [step, selectedHospital, activeAppointment]);

    const handleEmergencyBooking = async (doctorToBook) => {
        const doc = doctorToBook || selectedDoctor;
        if (!doc || !selectedHospital || !emergencyReason) return;

        setBooking(true);
        try {
            const now = new Date();
            const res = await bookAppointment({
                doctorId: doc._id,
                hospitalName: selectedHospital.hospitalName,
                date: now.toISOString().split('T')[0],
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                reason: `[EMERGENCY] ${emergencyReason}`,
                emergencyReason: emergencyReason,
                isEmergency: true
            });

            if (res.success) {
                navigate('/patient-dashboard/appointments', { state: { toast: "🚨 Emergency appointment booked and doctor notified!" } });
            }
        } catch (error) {
            console.error("Emergency booking failed:", error);
        } finally {
            setBooking(false);
        }
    };

    if (loading && step === 1) return <Loader fullScreen message="Accessing Emergency Gateway" />;

    if (activeAppointment) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6">
                <div className="bg-[#0e1117] border border-red-500/20 rounded-[48px] p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-transparent opacity-50" />
                    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                        <XCircle size={48} className="text-red-500" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Active Appointment Detected</h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                        You currently have an active appointment with <span className="text-white font-bold">Dr. {activeAppointment.doctorId?.name}</span>. 
                        To ensure clinical safety and protocol adherence, you cannot book a new emergency session until your current one is completed or cancelled.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => navigate('/patient-dashboard/appointments')}
                            className="px-10 py-5 rounded-[24px] bg-red-600 text-white font-black uppercase tracking-widest text-sm hover:bg-red-500 transition-all shadow-xl shadow-red-900/20"
                        >
                            View Active Session
                        </button>
                        <button 
                            onClick={() => navigate('/patient-dashboard')}
                            className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-black uppercase tracking-widest"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredHospitals = hospitals
        .filter(h => 
            h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.hospitalAddress?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.hospitalName.localeCompare(b.hospitalName));

    const uniqueSpecializations = ['All', ...new Set(doctors.map(d => d.specialization || "General Physician"))];
    const filteredDoctors = selectedSpecialization === 'All' 
        ? doctors 
        : doctors.filter(d => (d.specialization || "General Physician") === selectedSpecialization);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-[48px] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 text-red-500 pointer-events-none">
                    <AlertCircle size={240} />
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-24 h-24 rounded-[32px] bg-red-500/20 flex items-center justify-center border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] group transition-transform hover:scale-105">
                        <AlertCircle size={48} className="text-red-500 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-sm font-black text-red-500 uppercase tracking-[0.2em]">Protocol v2.4</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Emergency <span className="text-red-500">Gateway</span></h1>
                        <p className="text-base text-gray-400 font-bold uppercase tracking-[0.3em] mt-4">Priority Clinical Access Protocol • 24/7 Network Live</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/patient-dashboard')}
                    className="group flex items-center gap-3 px-10 py-5 rounded-[28px] bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-black uppercase tracking-widest relative z-10 shadow-xl"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Exit Gateway
                </button>
            </div>

            {/* Stepper Progress */}
            <div className="flex items-center gap-8 px-12">
                <div className="flex flex-col gap-4 flex-1">
                    <div className={`h-2.5 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5'}`} />
                    <p className={`text-sm font-black uppercase tracking-[0.2em] ${step >= 1 ? 'text-red-500' : 'text-gray-600'}`}>01. Situation Audit</p>
                </div>
                <div className="flex flex-col gap-4 flex-1">
                    <div className={`h-2.5 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5'}`} />
                    <p className={`text-sm font-black uppercase tracking-[0.2em] ${step >= 2 ? 'text-red-500' : 'text-gray-600'}`}>02. Response Team</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Situation Input */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-[#0e1117] border border-white/[0.05] rounded-[48px] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent opacity-50" />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] px-1">Describe Situation</label>
                                        <span className="text-sm font-bold text-red-500/80 uppercase tracking-widest">Mandatory Field</span>
                                    </div>
                                    <textarea 
                                        value={emergencyReason}
                                        onChange={(e) => setEmergencyReason(e.target.value)}
                                        placeholder="Briefly explain the emergency condition for clinical prioritization..."
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-[32px] p-8 text-white focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all min-h-[300px] leading-relaxed text-lg placeholder:text-gray-700"
                                    />
                                </div>
                                
                                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 flex items-start gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                                        <ShieldCheck size={20} className="text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-bold mb-1">Direct Transmission Active</p>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium uppercase tracking-wider">
                                            Your situation will be transmitted directly to the selected provider's emergency response team.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hospital Grid */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Select Provider</h3>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Available Hospital Network</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={16} />
                                        <input 
                                            type="text"
                                            placeholder="Search network..."
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-red-500/40 focus:bg-white/[0.05] transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        disabled={!selectedHospital || !emergencyReason}
                                        onClick={() => setStep(2)}
                                        className="bg-white text-black font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all hover:bg-gray-100 disabled:opacity-10 flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] group shrink-0"
                                    >
                                        Next <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-4 custom-scrollbar">
                                {filteredHospitals.map(h => (
                                    <button
                                        key={h._id}
                                        onClick={() => setSelectedHospital(h)}
                                        className={`w-full flex items-center gap-6 p-5 rounded-[28px] border transition-all duration-500 text-left group relative overflow-hidden ${
                                            selectedHospital?._id === h._id 
                                            ? 'bg-red-500 border-red-500 shadow-[0_15px_30px_rgba(239,68,68,0.2)]' 
                                            : 'bg-[#0e1117] border-white/5 hover:border-red-500/30 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                                            selectedHospital?._id === h._id ? 'bg-white text-red-500 shadow-xl' : 'bg-white/5 text-red-500/60 group-hover:bg-red-500/10 group-hover:text-red-500'
                                        }`}>
                                            <Building2 size={26} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-lg font-black tracking-tight leading-tight mb-1 truncate ${
                                                selectedHospital?._id === h._id ? 'text-white' : 'text-gray-200'
                                            }`}>{h.hospitalName}</h4>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className={selectedHospital?._id === h._id ? 'text-white/60' : 'text-red-500/40'} />
                                                <p className={`text-xs font-bold truncate tracking-wide ${
                                                    selectedHospital?._id === h._id ? 'text-white/70' : 'text-gray-500'
                                                }`}>{h.hospitalAddress || 'Clinical Network'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            {selectedHospital?._id === h._id && (
                                                <div className="bg-white/20 p-2 rounded-full text-white animate-in zoom-in duration-300">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            <div className={`p-2 rounded-xl transition-colors ${selectedHospital?._id === h._id ? 'text-white' : 'text-gray-700 group-hover:text-red-500'}`}>
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => setStep(1)}
                                    className="p-6 rounded-[24px] bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-xl group"
                                >
                                    <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                                </button>
                                <div>
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Select Response Team</h3>
                                    <p className="text-sm text-red-500 font-bold mt-2 uppercase tracking-[0.2em]">Available specialists at {selectedHospital.hospitalName}</p>
                                </div>
                            </div>
                            
                            {!loading && doctors.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                    {uniqueSpecializations.map(spec => (
                                        <button
                                            key={spec}
                                            onClick={() => setSelectedSpecialization(spec)}
                                            className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all border ${
                                                selectedSpecialization === spec
                                                ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                                                : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-gray-300'
                                            }`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-40 flex flex-col items-center justify-center bg-[#0e1117] rounded-[48px] border border-white/[0.05] border-dashed">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                    <Loader2 size={64} className="text-red-500 animate-spin relative z-10" />
                                </div>
                                <p className="text-sm font-black text-gray-500 uppercase tracking-[0.4em]">Accessing Provider Database...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredDoctors.map(doctor => (
                                    <button
                                        key={doctor._id}
                                        onClick={() => setSelectedDoctor(doctor)}
                                        className={`p-10 rounded-[48px] border transition-all duration-500 text-left relative overflow-hidden group ${
                                            selectedDoctor?._id === doctor._id 
                                            ? 'bg-red-500 border-red-500 shadow-[0_30px_60px_rgba(239,68,68,0.25)] translate-y-[-4px]' 
                                            : 'bg-[#0e1117] border-white/5 hover:border-red-500/30 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-6 mb-10">
                                            <div className={`w-20 h-20 rounded-[28px] overflow-hidden border-2 transition-all duration-500 ${
                                                selectedDoctor?._id === doctor._id ? 'border-white/40 shadow-2xl scale-110' : 'border-white/10 group-hover:border-red-500/30'
                                            }`}>
                                                {doctor.profileImage ? (
                                                    <img src={`${getBaseUrl()}/${doctor.profileImage}`} alt={doctor.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500">
                                                        <User size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`text-2xl font-black tracking-tight mb-1 ${
                                                    selectedDoctor?._id === doctor._id ? 'text-white' : 'text-gray-100'
                                                }`}>{doctor.name}</h4>
                                                <p className={`text-sm font-black uppercase tracking-[0.2em] ${
                                                    selectedDoctor?._id === doctor._id ? 'text-white/70' : 'text-red-500'
                                                }`}>{doctor.specialization}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className={`px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] text-center transition-all ${
                                                selectedDoctor?._id === doctor._id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-500'
                                            }`}>
                                                Est. Response: ~4-6 mins
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEmergencyBooking(doctor);
                                                }}
                                                disabled={booking}
                                                className={`w-full py-6 rounded-[28px] text-sm font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                                                    selectedDoctor?._id === doctor._id 
                                                    ? 'bg-white text-black hover:bg-gray-100' 
                                                    : 'bg-red-600 text-white hover:bg-red-500 shadow-xl shadow-red-500/10'
                                                }`}
                                            >
                                                {booking && selectedDoctor?._id === doctor._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <ShieldCheck size={16} />
                                                        Secure Access
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {selectedDoctor?._id === doctor._id && (
                                            <div className="absolute top-10 right-10 text-white animate-in zoom-in duration-300">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmergencyBookingPage;