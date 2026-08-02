import React, { useEffect, useState } from 'react';
import { ClipboardList, Download, AlertCircle, Pill, Loader2, Activity } from 'lucide-react';
import { fetchPrescriptions } from '../../services/patientApi';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/ui/Loader';

/* ─── PDF Download ──────────────────────────────────────────────────── */
/* ─── High-Fidelity Clinical Download ──────────────────────────────── */
const downloadPrescriptionPDF = (rx, patientName) => {
    const meds = rx.medicines || [];
    const consultancyFee = 100.00;
    const medicinesCost = meds.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0);
    const hospitalName = rx.doctorId?.hospitalName?.toUpperCase() || 'HOLY CROSS MULTI-SPECIALITY HOSPITAL';
    const labTestCost = rx.labOrders?.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0) || 0;
    const totalCost = consultancyFee + medicinesCost + labTestCost;

    const pad = (str, len) => str.toString().padEnd(len, ' ');
    const padR = (str, len) => str.toString().padStart(len, ' ');
    const line = `────────────────────────────────────────────────────────────────────────`;

    const lines = [
        ` `,
        `                    ${hospitalName}`,
        `           12/A Clinical Valley, Healthcare District - 560001`,
        `               Contact: +91 80 4422 1100 | www.hcms.com`,
        line,
        `                        OFFICIAL BILLING SHEET                    `,
        line,
        ` `,
        ` INVOICE NO:  #HC-${rx._id?.slice(-8).toUpperCase().padEnd(20, ' ')} DATE: ${new Date().toLocaleDateString('en-GB')}`,
        ` PATIENT:     ${pad(patientName?.toUpperCase() || 'PRAJWAL', 25)} PID:  #${Math.floor(Math.random() * 900000) + 100000}`,
        ` PHYSICIAN:   DR. ${pad(rx.doctorId?.name?.toUpperCase() || 'NUTHAN', 22)} DEPT: ${rx.doctorId?.specialization?.toUpperCase() || 'CARDIOLOGY'}`,
        ` `,
        ` ITEM / DESCRIPTION             DURATION    FREQUENCY        AMOUNT(INR)`,
        line,
        ` [01] CONSULTATION FEE          -           Standard Visit   ${padR('₹ ' + consultancyFee.toFixed(2), 11)}`,
        ...meds.map((m, i) => {
            const index = (i + 2).toString().padStart(2, '0');
            const name = pad(m.name?.substring(0, 24) || 'Medication', 25);
            const dur = pad(m.duration ? m.duration + ' Days' : '-', 11);
            const freq = pad(m.frequency?.substring(0, 15) || '-', 16);
            const amt = padR('₹ ' + (parseFloat(m.price) || 0).toFixed(2), 11);
            return ` [${index}] ${name} ${dur} ${freq} ${amt}`;
        }),
        labTestCost > 0 ? ` [${(meds.length + 2).toString().padStart(2, '0')}] ${pad('DIAGNOSTIC SERVICES', 25)} ${pad('-', 11)} ${pad('Labs', 16)} ${padR('₹ ' + labTestCost.toFixed(2), 11)}` : '',
        ` `,
        line,
        ` FINANCIAL SUMMARY                                    SUB-TOTAL(INR)`,
        line,
        ` SUB-TOTAL                                              ${padR('₹ ' + totalCost.toFixed(2), 11)}`,
        ` TAX (0% GST)                                           ${padR('₹ 0.00', 11)}`,
        ` DISCOUNT APPLIED                                       ${padR('₹ 0.00', 11)}`,
        ` `,
        ` GRAND TOTAL PAYABLE                                    ${padR('₹ ' + totalCost.toFixed(2), 11)}`,
        line,
        ` `,
        ` DIGITAL VERIFICATION HASH:`,
        ` [0x${rx._id?.slice(0, 12)}...${Math.random().toString(16).slice(2, 6)}]`,
        ` `,
        ` Generated via MediCare Smart Portal Adherence System.`,
        ` This is a computer-generated document. No signature required.`,
        ` `
    ];

    const text = lines.filter(l => l !== '').join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_HC_${rx._id?.slice(-6).toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

/* ─── Status badge ──────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const map = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-900/10',
        inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        expired: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-lg shadow-red-900/10',
    };
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${map[status] || map.inactive} backdrop-blur-md`}>
            {status || 'Unknown'}
        </span>
    );
};



const PrescriptionCard = ({ rx, onDownload }) => {
    const [expanded, setExpanded] = useState(false);
    const meds = rx.medicines || [];
    const consultancyFee = 100;
    const medicinesCost = meds.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0);
    const labTestCost = (rx.labOrders?.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0) || 0) || (rx.bill?.items?.filter(item => item.type === 'lab_test')?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0);
    const estimatedTotal = consultancyFee + medicinesCost + labTestCost;

    return (
        <div className="group relative bg-[#0f1115] border border-white/[0.08] rounded-2xl sm:rounded-[32px] overflow-hidden hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="p-5 sm:p-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 sm:gap-8">
                    <div className="flex items-center gap-4 sm:gap-6 flex-1 w-full">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[22px] bg-purple-500/5 border border-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-600/10 group-hover:border-purple-500/30 transition-all duration-500 shadow-xl">
                            <ClipboardList size={20} sm:size={28} className="text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-base sm:text-2xl text-white tracking-tight truncate group-hover:text-purple-400 transition-colors duration-300">
                                {meds.length > 0 
                                    ? (meds.slice(0, 2).map(m => m.name || m).join(', ') + (meds.length > 2 ? ` +${meds.length - 2}` : ''))
                                    : 'Clinical Prescription'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                                <span className="text-[9px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[120px]">
                                    Dr. {rx.doctorId?.name?.split(' ')[0] || 'Practitioner'}
                                </span>
                                <span className="text-[9px] sm:text-[11px] text-gray-600 font-bold uppercase tracking-widest hidden xs:inline">
                                    • {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : 'Archive'}
                                </span>
                                <StatusBadge status={rx.status} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={onDownload}
                            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-300"
                        >
                            <Download size={18} sm:size={20} />
                        </button>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className={`flex-1 lg:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[20px] text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 ${expanded ? 'bg-white/10 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'}`}
                        >
                            {expanded ? 'Hide' : 'View Detail'}
                            <div className={`w-1.5 h-1.5 rounded-full ${expanded ? 'bg-white animate-bounce' : 'bg-white opacity-60'}`} />
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className="mt-6 sm:mt-10 pt-6 sm:pt-10 border-t border-white/[0.06] space-y-8 sm:space-y-10 animate-fade-in-down">
                        {meds.length > 0 && (
                            <div className="space-y-4 sm:space-y-6">
                                <h5 className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 border-l-2 border-purple-500/40">Clinical Regimen</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                                    {meds.map((m, i) => (
                                        <div key={i} className="group/med bg-white/[0.02] border border-white/[0.04] p-4 sm:p-5 rounded-xl sm:rounded-[24px] hover:bg-white/[0.05] hover:border-purple-500/20 transition-all duration-500 relative overflow-hidden">
                                            <div className="flex items-start justify-between mb-3 sm:mb-4 relative z-10">
                                                <h6 className="font-black text-white text-sm sm:text-base tracking-tight leading-tight max-w-[70%]">{m.name || m}</h6>
                                                {m.price && <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">₹{m.price}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2 relative z-10">
                                                {m.frequency && <p className="text-[10px] sm:text-xs text-gray-400 font-medium bg-white/[0.03] px-2 py-1 rounded-md">{m.frequency}</p>}
                                                {m.duration && <p className="text-[10px] sm:text-xs text-gray-400 font-medium bg-white/[0.03] px-2 py-1 rounded-md">{m.duration} days</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                            {rx.notes && (
                                <div className="space-y-3 sm:space-y-4">
                                    <h5 className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 border-l-2 border-blue-500/40">Clinical Instructions</h5>
                                    <div className="bg-white/[0.02] border border-white/[0.04] p-4 sm:p-6 rounded-xl sm:rounded-[24px] text-xs sm:text-sm text-gray-300 leading-relaxed font-medium italic shadow-inner">
                                        "{rx.notes}"
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-3 sm:space-y-4">
                                <h5 className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 border-l-2 border-emerald-500/40">Financial Summary</h5>
                                <div className="bg-[#0a0a0a] border border-white/[0.06] p-4 sm:p-6 rounded-xl sm:rounded-[24px] space-y-3 sm:space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-500">Consultation</span>
                                        <span className="text-gray-300">₹{consultancyFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-500">Medications</span>
                                        <span className="text-gray-300">₹{medicinesCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-500">Diagnostics</span>
                                        <span className="text-gray-300">₹{labTestCost.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 sm:pt-4 border-t border-white/[0.06] flex justify-between items-center">
                                        <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest">Grand Total</span>
                                        <span className="text-xl sm:text-2xl font-black text-emerald-400">
                                            ₹{estimatedTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PatientPrescriptions = () => {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchPrescriptions();
                if (res?.success) setPrescriptions(res.data);
                else setError('Failed to load prescriptions.');
            } catch (err) {
                console.error('[PatientPrescriptions] error:', err);
                setError('Could not fetch prescriptions.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = prescriptions.filter(rx =>
        filter === 'all' ? true : rx.status === filter
    );

    if (loading) return <Loader />;

    return (
        <div className="space-y-8 animate-fadein">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Prescriptions</h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Your medication history and active therapeutic plans.</p>
                </div>
                
                <div className="flex bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-1.5 gap-1 shadow-2xl backdrop-blur-xl">
                    {['all', 'active', 'inactive'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${filter === f ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/30 ring-1 ring-white/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 text-red-400 bg-red-500/5 border border-red-500/10 rounded-[20px] px-6 py-4 text-sm font-medium backdrop-blur-md">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {filtered.length === 0 && !error ? (
                <div className="flex flex-col items-center justify-center bg-[#0f1115] border border-white/[0.08] rounded-[32px] py-32 text-gray-700 animate-pulse">
                    <ClipboardList size={64} className="mb-6 opacity-10" />
                    <p className="text-lg font-bold uppercase tracking-[0.2em] opacity-30">Archive Empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filtered.map(rx => (
                        <PrescriptionCard key={rx._id} rx={rx} onDownload={() => downloadPrescriptionPDF(rx, user?.name)} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientPrescriptions;
