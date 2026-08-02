import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf/dist/jspdf.es.min.js';
import { fetchBills, fetchHospitals } from '../../services/patientApi';
import { FileText, AlertCircle, CheckCircle, Clock, Building2, Search, X, IndianRupee, MapPin, UserCog, Activity, Microscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../../components/ui/Loader';

const PatientBilling = () => {
    const { user } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('bills'); // 'bills' or 'pricing'
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadBills = async () => {
            try {
                const res = await fetchBills();
                if (res?.success) {
                    setBills(res.data);
                } else {
                    setError('Failed to load bills.');
                }
            } catch (err) {
                console.error('Error fetching bills:', err);
                setError('Could not fetch bills.');
            } finally {
                setLoading(false);
            }
        };
        loadBills();
    }, []);

    useEffect(() => {
        const loadHospitals = async () => {
            if (activeTab === 'pricing' && hospitals.length === 0) {
                try {
                    const res = await fetchHospitals();
                    if (res?.success) {
                        setHospitals(res.data);
                        if (res.data.length > 0) setSelectedHospital(res.data[0]);
                    }
                } catch (err) {
                    console.error('Error fetching hospitals:', err);
                }
            }
        };
        loadHospitals();
    }, [activeTab]);

    if (loading) return <Loader fullScreen message="Syncing Financial Records" />;

    const filteredHospitals = hospitals.filter(h => 
        h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadein">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Billing & Economics</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Manage your clinical expenses and browse transparent pricing.</p>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('bills')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'bills' 
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        <FileText size={16} /> My Bills
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'pricing' 
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        <Building2 size={16} /> Price Ledger
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'bills' ? (
                    <motion.div
                        key="bills-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {bills.map((bill) => (
                                <BillCard key={bill._id} bill={bill} user={user} />
                            ))}
                        </div>

                        {bills.length === 0 && !error && (
                            <div className="flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-[32px] py-24 text-gray-600">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <FileText size={40} className="opacity-20" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">No invoices found</p>
                                <p className="text-xs text-gray-600 mt-1">Your clinical bills will appear here once generated.</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="pricing-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start"
                    >
                        {/* Hospital Selector Sidebar */}
                        <div className="xl:col-span-4 space-y-6">
                            <div className="bg-[#0e1117] border border-white/10 rounded-[32px] p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Network Search</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                        <input 
                                            type="text"
                                            placeholder="Search hospital names..."
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/[0.02] transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredHospitals.map(h => (
                                        <button
                                            key={h._id}
                                            onClick={() => setSelectedHospital(h)}
                                            className={`w-full text-left p-4 rounded-[24px] border transition-all duration-300 group relative overflow-hidden ${
                                                selectedHospital?._id === h._id 
                                                ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                                                    selectedHospital?._id === h._id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-400'
                                                }`}>
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-black truncate tracking-tight ${
                                                        selectedHospital?._id === h._id ? 'text-white' : 'text-gray-200'
                                                    }`}>{h.hospitalName}</div>
                                                    <div className={`text-[10px] truncate mt-1 font-medium ${
                                                        selectedHospital?._id === h._id ? 'text-white/60' : 'text-gray-500'
                                                    }`}>{h.hospitalAddress || 'City Network'}</div>
                                                </div>
                                                {selectedHospital?._id === h._id && (
                                                    <div className="text-white shrink-0">
                                                        <CheckCircle size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    {filteredHospitals.length === 0 && (
                                        <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                            <Search size={48} className="mb-2" />
                                            <p className="text-xs font-black uppercase tracking-widest">No Results</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Comparison Tip */}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[24px] p-6 flex items-start gap-4">
                                <Activity size={20} className="text-emerald-500 shrink-0" />
                                <p className="text-xs text-emerald-500/80 leading-relaxed font-medium">
                                    Prices are updated in real-time by hospital administrators to ensure transparent billing across the network.
                                </p>
                            </div>
                        </div>

                        {/* Pricing Content */}
                        <div className="xl:col-span-8">
                            {selectedHospital ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Hospital Banner */}
                                    <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-[32px] p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                                            <Building2 size={120} />
                                        </div>
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                                            <div className="w-16 h-16 rounded-[24px] bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                                                <MapPin size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white tracking-tight">{selectedHospital.hospitalName}</h3>
                                                <div className="flex items-center gap-2 mt-1.5 text-gray-400">
                                                    <MapPin size={14} className="text-emerald-500/60" />
                                                    <p className="text-sm font-medium">{selectedHospital.hospitalAddress || 'Location pending verified status'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Grid */}
                                    <div className="bg-[#0e1117] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/[0.03] border-b border-white/5">
                                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Medical Service / Ward Type</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Rate (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.02]">
                                                <PricingTableRows pricing={selectedHospital.hospitalPricing} />
                                            </tbody>
                                        </table>
                                        
                                        <div className="p-8 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Pricing Policy v1.2</p>
                                            <div className="flex items-center gap-2 text-emerald-500/40">
                                                <CheckCircle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Network Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-gray-600 bg-white/[0.01] border border-dashed border-white/5 rounded-[40px]">
                                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <Building2 size={48} className="opacity-10" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-white/20 tracking-tight">Select a Provider</p>
                                        <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto">Choose a hospital from the ledger to view their current clinical service rates.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PricingTableRows = ({ pricing }) => {
    if (!pricing) return null;

    const categories = [
        {
            title: 'Wards & Rooms (Per Day)',
            icon: <Building2 size={14} />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            fields: [
                { key: 'general', label: 'General Ward' },
                { key: 'icu', label: 'ICU Ward' },
                { key: 'emergency', label: 'Emergency' },
                { key: 'pediatric', label: 'Pediatric' },
                { key: 'surgical', label: 'Surgical' },
                { key: 'deluxe', label: 'Deluxe Room' },
                { key: 'semiPrivate', label: 'Semi-Private' },
                { key: 'private', label: 'Private Room' },
                { key: 'isolation', label: 'Isolation' },
                { key: 'nicu', label: 'NICU' },
            ]
        },
        {
            title: 'Professional Fees',
            icon: <UserCog size={14} />,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            fields: [
                { key: 'doctorFee', label: 'Doctor Fee / Day' },
                { key: 'nursing', label: 'Nursing / Day' },
                { key: 'rmoFee', label: 'RMO Fee / Day' },
                { key: 'physiotherapy', label: 'Physiotherapy' },
            ]
        },
        {
            title: 'Services & Procedures',
            icon: <Activity size={14} />,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            fields: [
                { key: 'otCharges', label: 'OT Charges' },
                { key: 'laborRoom', label: 'Labor Room' },
                { key: 'ambulance', label: 'Ambulance (Basic)' },
                { key: 'ambulanceAdvanced', label: 'Ambulance (ALS)' },
                { key: 'dialysis', label: 'Dialysis Session' },
            ]
        },
        {
            title: 'Diagnostics',
            icon: <Microscope size={14} />,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            fields: [
                { key: 'xray', label: 'X-Ray' },
                { key: 'ecg', label: 'ECG' },
                { key: 'ultrasound', label: 'Ultrasound' },
                { key: 'ctScan', label: 'CT Scan' },
                { key: 'mri', label: 'MRI Scan' },
            ]
        },
        {
            title: 'Administrative',
            icon: <FileText size={14} />,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            fields: [
                { key: 'registration', label: 'Admission Fee' },
                { key: 'pharmacyHandling', label: 'Pharmacy Handling' },
            ]
        }
    ];

    return (
        <>
            {categories.map((cat, idx) => (
                <React.Fragment key={idx}>
                    <tr className="bg-white/[0.02]">
                        <td colSpan="2" className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>
                                    {cat.icon}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${cat.color}`}>
                                    {cat.title}
                                </span>
                            </div>
                        </td>
                    </tr>
                    {cat.fields.map((field) => (
                        <tr key={field.key} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-3 text-gray-400 group-hover:text-gray-200 transition-colors">{field.label}</td>
                            <td className="px-6 py-3 text-right font-bold text-white">
                                ₹{pricing[field.key] ? pricing[field.key].toLocaleString() : '—'}
                            </td>
                        </tr>
                    ))}
                </React.Fragment>
            ))}
        </>
    );
};

const BillCard = ({ bill, user }) => {
    const [expanded, setExpanded] = useState(false);
    
    const handleDownload = () => {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        const pageRight = 555;
        const pageCenter = (marginLeft + pageRight) / 2;
        let currentY = 40;
        const currency = 'Rs.';

        const patientName = bill.patientId?.name || user?.name || 'Patient Name';
        const patientId = bill.patientId?._id || user?.id || 'N/A';
        const doctorName = bill.doctorId?.name || 'Attending Physician';
        const hospitalName = bill.doctorId?.hospitalName || 'Holy Cross Hospital';
        const hospitalAddress = bill.doctorId?.hospitalAddress || '123 Wellness Avenue, Health City, India';
        const invoiceDate = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const prescription = bill.prescriptionId;

        const lineItemAmount = (item) => parseFloat(item?.cost || 0);
        const doctorFeeItem = (bill.items || []).find(item => item.type === 'consultancy' || /doctor/i.test(item.name || ''));
        const doctorFee = doctorFeeItem ? lineItemAmount(doctorFeeItem) : 0;

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(hospitalName, pageCenter, currentY, { align: 'center' });
        currentY += 22;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(hospitalAddress, pageCenter, currentY, { align: 'center' });
        currentY += 18;

        doc.setDrawColor(120);
        doc.setLineWidth(0.8);
        doc.line(marginLeft, currentY, pageRight, currentY);
        currentY += 26;

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Invoice', pageCenter, currentY, { align: 'center' });
        currentY += 22;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const downloadedAt = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
        doc.text(`Downloaded On: ${downloadedAt}`, marginLeft, currentY);
        currentY += 16;
        doc.text(`Bill ID: ${bill._id}`, marginLeft, currentY);
        doc.text(`Date: ${invoiceDate}`, pageRight, currentY, { align: 'right' });
        currentY += 16;
        doc.text(`Patient: ${patientName}`, marginLeft, currentY);
        doc.text(`Patient ID: ${patientId}`, pageRight, currentY, { align: 'right' });
        currentY += 16;
        doc.text(`Doctor: ${doctorName}`, marginLeft, currentY);
        doc.text(`Status: ${bill.status?.toUpperCase()}`, pageRight, currentY, { align: 'right' });
        currentY += 24;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Prescription & Charges', marginLeft, currentY);
        currentY += 16;
        doc.setDrawColor(180);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, currentY, pageRight, currentY);
        currentY += 18;

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('No.', marginLeft, currentY);
        doc.text('Description', marginLeft + 40, currentY);
        doc.text('Frequency', marginLeft + 330, currentY);
        doc.text('Amount', pageRight, currentY, { align: 'right' });
        currentY += 14;
        doc.line(marginLeft, currentY, pageRight, currentY);
        currentY += 18;

        doc.setFont(undefined, 'normal');

        const printLine = (leftText, freq, amount) => {
            doc.text(leftText, marginLeft + 10, currentY);
            if (freq) doc.text(freq, marginLeft + 330, currentY);
            doc.text(`${currency} ${amount.toFixed(2)}`, pageRight, currentY, { align: 'right' });
            currentY += 18;
        };

        const medicineList = prescription?.medicines || [];
        let lineIndex = 0;

        if (medicineList.length > 0) {
            medicineList.forEach((med) => {
                if (currentY > 760) {
                    doc.addPage();
                    currentY = 40;
                }
                lineIndex += 1;
                printLine(`${lineIndex}. ${med.name}`, med.frequency || 'N/A', parseFloat(med.price) || 0);
            });
        }

        const additionalItems = (bill.items || []).filter(item => item !== doctorFeeItem && item.type !== 'medicine');
        additionalItems.forEach((item) => {
            if (currentY > 760) {
                doc.addPage();
                currentY = 40;
            }
            lineIndex += 1;
            printLine(`${lineIndex}. ${item.name}`, item.frequency || '—', lineItemAmount(item));
        });

        if (doctorFeeItem) {
            if (currentY > 760) {
                doc.addPage();
                currentY = 40;
            }
            lineIndex += 1;
            printLine(`${lineIndex}. Doctor Fee`, 'Consultation', doctorFee);
        }

        if (lineIndex === 0) {
            doc.text('No items available for billing.', marginLeft + 10, currentY);
            currentY += 18;
        }

        currentY += 10;
        doc.setLineWidth(0.8);
        doc.line(marginLeft, currentY, pageRight, currentY);
        currentY += 18;

        const subtotal = bill.amount;
        doc.setFont(undefined, 'bold');
        doc.text('Total Amount', marginLeft + 10, currentY);
        doc.text(`${currency} ${subtotal.toFixed(2)}`, pageRight, currentY, { align: 'right' });
        doc.setFont(undefined, 'normal');
        currentY += 30;

        doc.setFontSize(9);
        doc.text('This invoice was generated by MediCare. Please retain it for your records.', marginLeft, currentY);
        currentY += 14;
        doc.text('If you have questions about this bill, contact support at support@medicare.com.', marginLeft, currentY);

        doc.save(`MediCare_Invoice_${bill._id?.slice(-6)}.pdf`);
    };

    return (
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/[0.05] gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        bill.status === 'paid' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-orange-500/10 border border-orange-500/20'
                    }`}>
                        <FileText size={18} sm:size={20} className={bill.status === 'paid' ? 'text-emerald-400' : 'text-orange-400'} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-white text-base sm:text-xl tracking-tight truncate">₹{bill.amount}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-bold uppercase tracking-wider">
                            {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <span className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-lg border tracking-widest ${
                        bill.status === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                    }`}>
                        {bill.status.toUpperCase()}
                    </span>
                    <button onClick={() => setExpanded(!expanded)} className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 font-black uppercase tracking-widest">
                        {expanded ? 'Hide' : 'Details'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 sm:p-6 bg-white/[0.02] animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Itemized Breakdown</p>
                        <button 
                            onClick={handleDownload} 
                            className="text-[9px] sm:text-[10px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white px-3 py-1.5 rounded-lg transition-all font-black uppercase tracking-widest"
                        >
                            Export PDF
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {(bill.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{item.name}</span>
                                <span className="font-medium text-white">₹{item.cost}</span>
                            </div>
                        ))}
                        {(!bill.items || bill.items.length === 0) && (
                            <p className="text-sm text-gray-500">No detailed items available.</p>
                        )}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">Total</span>
                        <span className="text-lg font-bold text-green-400">₹{bill.amount}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientBilling;
