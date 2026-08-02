import React, { useEffect, useState } from 'react';
import { FileText, ClipboardList, CalendarClock, Shield, Clock, CheckCircle, XCircle, BellRing, Building2, Microscope } from 'lucide-react';
import { fetchOverview, fetchPatientAppointments, fetchPrescriptions, fetchReminders, fetchLabOrders } from '../../services/patientApi';
import Loader from '../../components/ui/Loader';

const StatCard = ({ icon: Icon, label, value, color, isText }) => {
    const colorMap = {
        blue: { bg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/20', glow: 'shadow-blue-500/10', accent: 'blue' },
        purple: { bg: 'bg-purple-500/10', icon: 'text-purple-500', border: 'border-purple-500/20', glow: 'shadow-purple-500/10', accent: 'purple' },
        yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-500', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/10', accent: 'yellow' },
        emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10', accent: 'emerald' },
    };
    const c = colorMap[color];
    const accentShadow = {
        blue: 'hover:shadow-blue-500/10',
        purple: 'hover:shadow-purple-500/10',
        yellow: 'hover:shadow-yellow-500/10',
        emerald: 'hover:shadow-emerald-500/10'
    };
    return (
        <div className={`group relative bg-[#0f1115] border ${c.border} rounded-2xl sm:rounded-[32px] p-4 sm:p-7 transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl ${accentShadow[color]} overflow-hidden flex flex-col justify-between`}>
            <div className={`absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 ${c.bg} blur-[30px] sm:blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-700`} />
            <div>
                <div className={`inline-flex p-2 sm:p-3 rounded-xl sm:rounded-2xl ${c.bg} mb-3 sm:mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={20} className={c.icon} />
                </div>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-2 truncate">{label}</p>
            </div>
            <p className={`font-black text-white tracking-tighter ${isText ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>{value}</p>
        </div>
    );
};

const EmptyState = ({ text }) => (
    <div className="text-center py-16 bg-white/[0.02] rounded-[24px] border border-white/[0.04] animate-pulse">
        <p className="text-gray-600 text-[11px] font-black uppercase tracking-[0.2em]">{text}</p>
    </div>
);

const AdmissionStatus = ({ admission, isInsuranceApplied }) => {
    if (!admission?.isAdmitted) return null;

    return (
        <div className="group relative bg-[#0f1115] border border-emerald-500/20 rounded-[32px] p-8 shadow-2xl overflow-hidden mb-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] opacity-20 pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Building2 size={32} className="text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Current Hospital Admission</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-emerald-400 text-xs font-black tracking-widest uppercase">Status: Active Care</p>
                            {isInsuranceApplied && (
                                <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                    <Shield size={10} /> Insurance Applied
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 flex-1 lg:max-w-2xl">
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Hospital</p>
                        <p className="text-white font-bold truncate">{admission.hospitalName}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Ward / Unit</p>
                        <p className="text-white font-bold">{admission.ward}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Admitted On</p>
                        <p className="text-white font-bold whitespace-nowrap">{new Date(admission.admittedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


const PatientOverview = () => {
    const [overview, setOverview] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labOrders, setLabOrders] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [o, a, p, r, l] = await Promise.all([
                    fetchOverview(),
                    fetchPatientAppointments(),
                    fetchPrescriptions(),
                    fetchReminders(),
                    fetchLabOrders(),
                ]);
                if (o?.success) setOverview(o.data);
                if (a?.success) setAppointments(a.data);
                if (p?.success) setPrescriptions(p.data);
                if (r?.success) setReminders(r.data);
                if (l?.success) setLabOrders(l.data);
            } catch (err) {
                console.error('[PatientOverview] load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <Loader />;

    const statusBadge = (status) => {
        const map = {
            pending: { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: <Clock size={11} />, label: 'PENDING' },
            approved: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-900/10', icon: <CheckCircle size={11} />, label: 'CONFIRMED' },
            rejected: { cls: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-lg shadow-red-900/10', icon: <XCircle size={11} />, label: 'REJECTED' },
            completed: { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-900/10', icon: <CheckCircle size={11} />, label: 'FULFILLED' },
            cancelled: { cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: <XCircle size={11} />, label: 'CANCELLED' },
        };
        const b = map[status] || map.pending;
        return (
            <span className={`inline-flex items-center gap-2 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full border ${b.cls} backdrop-blur-md`}>
                {b.icon} {b.label}
            </span>
        );
    };

    return (
        <div className="space-y-6 sm:space-y-10 animate-fadein">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Health Analytics</h2>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Real-time synchronization of your clinical status.</p>
                </div>
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-emerald-500/5 border border-emerald-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl self-start sm:self-auto">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[9px] sm:text-[11px] font-black text-emerald-400 tracking-widest uppercase">System Online</span>
                </div>
            </div>

            {/* ADMISSION STATUS */}
            {overview?.admission?.isAdmitted && <AdmissionStatus admission={overview.admission} isInsuranceApplied={overview.isInsuranceApplied} />}

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard icon={FileText} label="Total Records" value={overview?.totalMedicalRecords ?? 0} color="blue" />
                <StatCard icon={ClipboardList} label="Active Rx" value={overview?.activePrescriptions ?? 0} color="purple" />
                <StatCard icon={Microscope} label="Pending Tests" value={labOrders.filter(l => l.status === 'pending').length} color="yellow" />
                <StatCard icon={Shield} label="Verified Data" value={overview?.blockchainStatus ?? '100%'} color="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
                {/* UPCOMING APPOINTMENTS */}
                <div className="xl:col-span-2 group relative bg-[#0f1115] border border-white/[0.08] rounded-[24px] xl:rounded-[32px] overflow-hidden hover:border-white/20 transition-all duration-500 p-5 xl:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[60px] opacity-20 pointer-events-none" />
                    <h3 className="text-base xl:text-lg font-black text-white mb-6 xl:mb-8 flex items-center gap-2 xl:gap-3 tracking-tight">
                        <CalendarClock size={18} className="text-yellow-500" /> SCHEDULED INTERVENTIONS
                    </h3>
                    {appointments.length === 0 ? (
                        <EmptyState text="No active appointments scheduled." />
                    ) : (
                        <div className="space-y-3 xl:space-y-4">
                            {appointments.slice(0, 5).map(app => (
                                <div key={app._id} className="group/item flex flex-col md:flex-row md:items-center justify-between p-4 xl:p-6 bg-white/[0.02] rounded-2xl xl:rounded-[24px] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 gap-3 xl:gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center font-black text-white text-sm group-hover/item:border-yellow-500/30 transition-colors shrink-0">
                                            {new Date(app.date).getDate()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-white text-sm xl:text-base tracking-tight truncate">Dr. {app.doctorId?.name || 'Practitioner'}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold mt-0.5 flex-wrap">
                                                <span>{new Date(app.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                                <div className="w-1 h-1 rounded-full bg-gray-700 hidden sm:block" />
                                                <span className="text-yellow-500/60 uppercase">{app.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-3 xl:gap-6">
                                        <p className="hidden md:block text-[11px] text-gray-600 font-medium italic truncate max-w-[150px]">"{app.reason}"</p>
                                        {statusBadge(app.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RECENT PRESCRIPTIONS */}
                <div className="group relative bg-[#0f1115] border border-white/[0.08] rounded-[24px] xl:rounded-[32px] overflow-hidden hover:border-white/20 transition-all duration-500 p-5 xl:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] opacity-20 pointer-events-none" />
                    <h3 className="text-base xl:text-lg font-black text-white mb-6 xl:mb-8 flex items-center gap-2 xl:gap-3 tracking-tight">
                        <ClipboardList size={18} className="text-purple-500" /> RECENT THERAPEUTICS
                    </h3>
                    {prescriptions.length === 0 ? (
                        <EmptyState text="No prescriptions on record." />
                    ) : (
                        <div className="space-y-3 xl:space-y-4">
                            {prescriptions.slice(0, 4).map(rx => (
                                <div key={rx._id} className="p-4 xl:p-5 bg-white/[0.02] rounded-2xl xl:rounded-[24px] border border-white/[0.04] hover:bg-white/[0.05] transition-all duration-300">
                                    <p className="font-black text-white text-sm tracking-tight truncate mb-2">
                                        {rx.medicines?.map(m => m.name || m).join(', ') || 'Protocol Record'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Dr. {rx.doctorId?.name?.split(' ')[0] || 'Staff'}</p>
                                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{rx.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* LAB ORDERS & REMINDERS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                {/* RECENT LAB ORDERS */}
                <div className="group relative bg-[#0f1115] border border-white/[0.08] rounded-[24px] xl:rounded-[32px] overflow-hidden hover:border-white/20 transition-all duration-500 p-5 xl:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] opacity-20 pointer-events-none" />
                    <h3 className="text-base xl:text-lg font-black text-white mb-6 xl:mb-8 flex items-center gap-2 xl:gap-3 tracking-tight">
                        <Microscope size={18} className="text-blue-500" /> RECENT LAB INVESTIGATIONS
                    </h3>
                    {labOrders.length === 0 ? (
                        <EmptyState text="No lab tests ordered." />
                    ) : (
                        <div className="space-y-3 xl:space-y-4">
                            {labOrders.slice(0, 4).map(order => (
                                <div key={order._id} className="p-4 xl:p-5 bg-white/[0.02] rounded-2xl xl:rounded-[24px] border border-white/[0.04] hover:bg-white/[0.05] transition-all duration-300">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <p className="font-black text-white text-sm tracking-tight truncate flex-1">
                                            {order.tests?.map(t => t.testName).join(', ') || 'Diagnostic Panel'}
                                        </p>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shrink-0 ${
                                            order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                            {order.status?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate">Dr. {order.doctorId?.name?.split(' ')[0] || 'Staff'}</p>
                                        <p className="text-[10px] text-gray-600 font-medium italic shrink-0">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MEDICINE REMINDERS */}
                <div className={`group relative bg-[#0f1115] border border-white/[0.08] rounded-[24px] xl:rounded-[32px] p-5 xl:p-8 shadow-2xl overflow-hidden ${reminders.length === 0 ? 'hidden xl:block' : ''}`}>
                    <div className="absolute inset-0 bg-orange-500/[0.01] pointer-events-none" />
                    <h3 className="text-base xl:text-lg font-black text-white mb-6 xl:mb-8 flex items-center gap-2 xl:gap-3 tracking-tight">
                        <BellRing size={18} className="text-orange-500" /> MEDICATION ADHERENCE
                    </h3>
                    {reminders.length === 0 ? (
                        <EmptyState text="No active medications found." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:gap-4">
                            {reminders.slice(0, 4).map(r => (
                                <div key={r.id} className="group/rem p-4 xl:p-5 bg-white/[0.02] rounded-2xl xl:rounded-[24px] border border-white/[0.04] hover:border-orange-500/20 transition-all duration-500 relative">
                                    <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                                    <p className="font-black text-white text-sm tracking-tight mb-1 truncate pr-4">{r.title}</p>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={10} /> {r.time}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



export default PatientOverview;
