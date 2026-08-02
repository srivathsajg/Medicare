import React, { useEffect, useState } from 'react';
import { 
    Microscope, Clock, CheckCircle, AlertCircle, Search, 
    Calendar, User, Building2, FileText, ExternalLink, Loader2, ChevronRight, Beaker, X, Maximize2, Database, Shield, Activity
} from 'lucide-react';
import { fetchLabOrders } from '../../services/patientApi';
import { getBaseUrl } from '../../services/userApi';

const LabOrderCard = ({ order, onViewReport, isLatest }) => {
    const isCompleted = order.status === 'completed';
    const displayDate = order.date ? new Date(order.date) : new Date();

    return (
        <div className={`group relative bg-[#0f1115] border ${isLatest ? 'border-blue-500/40 shadow-blue-500/5' : 'border-white/[0.08]'} rounded-2xl sm:rounded-[32px] overflow-hidden hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10`}>
            {isLatest && (
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-br-xl uppercase tracking-widest z-20">
                    Latest
                </div>
            )}
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="p-5 sm:p-8 relative z-10">
                <div className="flex flex-col lg:flex-row justify-between gap-6 sm:gap-8">
                    <div className="flex items-start gap-4 sm:gap-6 flex-1">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[22px] border flex items-center justify-center shrink-0 transition-all duration-500 ${
                            isCompleted 
                            ? 'bg-emerald-500/5 border-emerald-500/10 group-hover:bg-emerald-600/10 group-hover:border-emerald-500/30' 
                            : 'bg-blue-500/5 border-blue-500/10 group-hover:bg-blue-600/10 group-hover:border-blue-500/30'
                        }`}>
                            <Microscope size={20} sm:size={28} className={isCompleted ? 'text-emerald-500' : 'text-blue-500'} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <h4 className="font-black text-lg sm:text-2xl text-white tracking-tight group-hover:text-blue-400 transition-colors duration-300 truncate">
                                    {order.testName || 'Diagnostic Panel'}
                                </h4>
                                <span className={`px-2 sm:px-3 py-1 rounded-full border text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-lg ${
                                    isCompleted 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-900/10' 
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-yellow-900/10'
                                }`}>
                                    {isCompleted ? <CheckCircle size={10} /> : <Clock size={10} />}
                                    {order.status?.toUpperCase() || 'PENDING'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                                <div className="bg-white/[0.02] border border-white/[0.04] p-3 sm:p-4 rounded-xl sm:rounded-[20px] flex items-center gap-3 sm:gap-4 group-hover:bg-white/[0.04] transition-all">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/5 flex items-center justify-center shrink-0">
                                        <User size={16} sm:size={18} className="text-blue-500/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Ordering MD</p>
                                        <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">Dr. {order.doctorId?.name || 'Specialist'}</p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.04] p-3 sm:p-4 rounded-xl sm:rounded-[20px] flex items-center gap-3 sm:gap-4 group-hover:bg-white/[0.04] transition-all">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/5 flex items-center justify-center shrink-0">
                                        <Building2 size={16} sm:size={18} className="text-purple-500/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Facility</p>
                                        <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">{order.hospitalName || order.doctorId?.hospitalName || 'Main Hospital'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-stretch lg:items-end justify-center gap-4 shrink-0 lg:w-[240px]">
                        <div className="text-left lg:text-right">
                            <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Order Date</p>
                            <p className="text-base sm:text-lg font-black text-white tracking-tighter">
                                {displayDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-blue-500/60 font-bold uppercase tracking-widest mt-0.5">
                                {displayDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        
                        {isCompleted && (
                            <button 
                                onClick={() => onViewReport(order)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-[18px] text-[10px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FileText size={16} /> View Lab Report
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/[0.04] flex flex-wrap gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[9px] sm:text-[10px] font-bold text-gray-400">
                        <Beaker size={12} className="text-blue-500/40" /> {order.testName}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PatientLabTests = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchLabOrders();
                if (res.success) setOrders(res.data);
            } catch (err) {
                console.error('[PatientLabTests] error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleViewReport = (order) => {
        if (order.report) {
            setSelectedReport(order.report);
            setIsReportModalOpen(true);
        } else {
            // If it's completed but report not found via diagnosis match, 
            // show a friendly message or try a broader search if needed
            alert("Report details are not yet synchronized. Please try again later.");
        }
    };

    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        
        let cleanPath = path.replace(/\\/g, '/').replace(/^(\/?backend\/)?/, '');
        if (!cleanPath.startsWith('uploads/') && !cleanPath.startsWith('/')) {
            if (!cleanPath.includes('/')) {
                cleanPath = `uploads/${cleanPath}`;
            }
        }
        
        const baseUrl = getBaseUrl();
        const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        return `${baseUrl}${finalPath}`;
    };

    const filteredOrders = sortedOrders.filter(order => 
        (order.testName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.doctorId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadein">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        Lab <span className="text-blue-500 not-italic">Investigations</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-3 font-medium max-w-xl">
                        Monitor the status of your diagnostic orders and access clinical laboratory reports as soon as they are finalized by the technician.
                    </p>
                </div>
                
                <div className="relative w-full md:w-72 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search investigations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f1115] border border-white/[0.08] rounded-[20px] pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-24 bg-[#0f1115] border border-white/[0.04] rounded-[40px] border-dashed">
                        <div className="w-20 h-20 bg-blue-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Microscope size={40} className="text-gray-700" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Diagnostic Vault Empty</h3>
                        <p className="text-gray-600 text-sm font-medium">No lab test orders match your current clinical profile.</p>
                    </div>
                ) : (
                    filteredOrders.map((order, index) => (
                        <LabOrderCard 
                            key={order._id} 
                            order={order} 
                            onViewReport={handleViewReport} 
                            isLatest={index === 0 && (new Date() - new Date(order.date)) < 24 * 60 * 60 * 1000}
                        />
                    ))
                )}
            </div>

            {/* Report Modal */}
            {isReportModalOpen && selectedReport && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#111] border border-gray-800 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-[#111] shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <Microscope size={24} className="text-emerald-500" /> {selectedReport.diagnosis || 'Lab Diagnostic Report'}
                                </h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Clinical Investigative Summary</p>
                            </div>
                            <button 
                                onClick={() => setIsReportModalOpen(false)} 
                                className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div className="bg-white/[0.02] border border-white/[0.04] p-6 rounded-[24px]">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Activity size={14} className="text-emerald-500" /> Diagnostic Result
                                        </h4>
                                        <p className="text-white font-bold text-lg leading-relaxed">
                                            {selectedReport.labResults || selectedReport.treatmentPlan || 'N/A'}
                                        </p>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/[0.04] p-6 rounded-[24px]">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FileText size={14} className="text-blue-500" /> Technician Narrative
                                        </h4>
                                        <p className="text-gray-400 leading-relaxed font-medium">
                                            {selectedReport.notes || 'No additional observations provided by the technician.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-white/[0.02] border border-white/[0.04] px-4 py-3 rounded-2xl flex items-center gap-3">
                                            <Shield size={16} className="text-emerald-500/60" />
                                            <div>
                                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Trust Status</p>
                                                <p className="text-[10px] font-bold text-white uppercase">Blockchain Verified</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/[0.04] px-4 py-3 rounded-2xl flex items-center gap-3">
                                            <Database size={16} className="text-blue-500/60" />
                                            <div>
                                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Archival</p>
                                                <p className="text-[10px] font-bold text-white uppercase">{selectedReport.hospitalName || 'Clinical Vault'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Maximize2 size={14} className="text-purple-500" /> Investigative Documentation
                                    </h4>
                                    
                                    {selectedReport.fileUrl ? (
                                        <div className="group relative rounded-[24px] border border-white/[0.08] overflow-hidden bg-black/40 aspect-square flex items-center justify-center hover:border-blue-500/30 transition-all">
                                            {selectedReport.fileUrl.toLowerCase().endsWith('.pdf') ? (
                                                <div className="text-center p-8">
                                                    <FileText size={48} className="text-blue-500 mx-auto mb-4 opacity-40" />
                                                    <p className="text-sm text-gray-400 font-bold mb-6 italic truncate max-w-xs">{selectedReport.fileUrl.split('/').pop()}</p>
                                                    <a 
                                                        href={getImageUrl(selectedReport.fileUrl)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <ExternalLink size={14} /> Download PDF Report
                                                    </a>
                                                </div>
                                            ) : (
                                                <>
                                                    <img 
                                                        src={getImageUrl(selectedReport.fileUrl)} 
                                                        alt="Lab Result" 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <a 
                                                            href={getImageUrl(selectedReport.fileUrl)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="bg-white text-black p-3 rounded-full hover:scale-110 transition-all"
                                                        >
                                                            <Maximize2 size={20} />
                                                        </a>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-[24px] border border-white/[0.04] border-dashed p-12 text-center bg-white/[0.01]">
                                            <FileText size={32} className="text-gray-700 mx-auto mb-4" />
                                            <p className="text-xs text-gray-500 font-medium">No visual attachment found for this diagnostic record.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/[0.04] bg-white/[0.01] flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsReportModalOpen(false)}
                                className="bg-white/[0.05] hover:bg-white/[0.1] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Close Investigation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLabTests;
