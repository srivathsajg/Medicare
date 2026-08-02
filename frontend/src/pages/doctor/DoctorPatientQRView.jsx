import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, Calendar, Droplets, Phone, Heart, Activity, 
    ClipboardList, Microscope, ShieldCheck, AlertCircle, 
    ArrowLeft, Clock, MapPin, Scale, Ruler, CheckCircle, 
    Database, Database as DatabaseIcon, Eye, ExternalLink, X
} from 'lucide-react';
import { fetchPatientDataByQRToken } from '../../services/qrApi';
import { getBaseUrl } from '../../services/userApi';
import Loader from '../../components/ui/Loader';

const DoctorPatientQRView = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [previewFile, setPreviewFile] = useState(null); // { url, type }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const response = await fetchPatientDataByQRToken(token);
                if (response.success) {
                    setData(response.data);
                }
            } catch (err) {
                console.error('Error fetching patient data by QR:', err);
                setError(err.message || 'Failed to load patient data. QR may be expired or invalid.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadData();
        }
    }, [token]);

    if (loading) return <Loader message="Decrypting Health Ledger Access..." />;

    if (error || !data || !data.patient) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-[#0f1115] border border-white/10 rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Access Restricted</h1>
                    <p className="text-gray-500 text-sm leading-relaxed mb-10">{error || 'Patient data is incomplete or unavailable.'}</p>
                    <button 
                        onClick={() => navigate('/doctor-dashboard')}
                        className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-[0.2em]"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const { patient, records = [], prescriptions = [], labOrders = [], qrStatus = {} } = data;

    const formatDate = (dateValue) => {
        if (!dateValue) return '—';
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
    };

    const openPreview = (fileUrl) => {
        if (!fileUrl) return;
        // Normalize backslashes for Windows paths
        const normalizedPath = fileUrl.replace(/\\/g, '/');
        const url = `${getBaseUrl()}/${normalizedPath}`;
        const type = url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
        setPreviewFile({ url, type });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/doctor-dashboard')}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black tracking-tight">{patient.name}</h1>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck size={12} /> Secure QR Access
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs font-medium tracking-wide">Patient Digital Health Profile Summary (Read-Only)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                        <Clock size={16} className="text-gray-400" />
                        <div className="text-left">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Access Expires At</p>
                            <p className="text-sm font-mono font-bold text-white">
                                {qrStatus?.expiresAt ? new Date(qrStatus.expiresAt).toLocaleTimeString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Sidebar: Personal Info */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Profile Card */}
                        <div className="bg-[#0f1115] border border-white/10 rounded-[40px] p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -translate-y-1/2 translate-x-1/2" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-[32px] bg-gray-800 border border-white/10 overflow-hidden mb-6 shadow-2xl">
                                    {patient.profileImage ? (
                                        <img src={`${getBaseUrl()}/${patient.profileImage}`} alt={patient.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/20">
                                            {patient.name[0]}
                                        </div>
                                    )}
                                </div>
                                
                                <h2 className="text-xl font-black mb-1 tracking-tight">{patient.name}</h2>
                                <p className="text-gray-500 text-xs font-medium mb-6">{patient.email}</p>
                                
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Blood Group</p>
                                        <p className="text-lg font-black text-red-500">{patient.bloodGroup || '—'}</p>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Age</p>
                                        <p className="text-lg font-black text-white">
                                            {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vital Summary */}
                        <div className="bg-[#0f1115] border border-white/10 rounded-[40px] p-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                <Heart size={14} /> Vital Stats
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="text-gray-500" size={18} />
                                        <span className="text-sm font-medium text-gray-300">Date of Birth</span>
                                    </div>
                                    <span className="font-bold">{patient.dob ? new Date(patient.dob).toLocaleDateString() : '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Ruler className="text-gray-500" size={18} />
                                        <span className="text-sm font-medium text-gray-300">Height</span>
                                    </div>
                                    <span className="font-bold">{patient.height || '—'} cm</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Scale className="text-gray-500" size={18} />
                                        <span className="text-sm font-medium text-gray-300">Weight</span>
                                    </div>
                                    <span className="font-bold">{patient.weight || '—'} kg</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Phone className="text-gray-500" size={18} />
                                        <span className="text-sm font-medium text-gray-300">Emergency</span>
                                    </div>
                                    <span className="font-bold">{patient.guardianNumber || '—'}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-gray-500 shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-300 mb-1">Address</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">{patient.residentialAddress || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Medical Summary */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Recent Medical Records */}
                        <div className="bg-[#0f1115] border border-white/10 rounded-[40px] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                    <Database size={14} /> Blockchain Verified Records
                                </h3>
                                <span className="text-[10px] text-gray-500 font-mono">Sync: Healthy</span>
                            </div>
                            
                            <div className="space-y-4">
                                {records.length === 0 ? (
                                    <p className="text-center py-10 text-gray-500 text-sm italic">No medical records found on ledger.</p>
                                ) : (
                                    records.slice(0, 5).map(record => (
                                        <div key={record._id} className="p-6 bg-white/[0.03] border border-white/5 rounded-[28px] hover:bg-white/[0.05] transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-white mb-1">
                                                        {record.diagnosis?.toLowerCase().includes('lab test') ? record.diagnosis : `Medical Record: ${record.diagnosis}`}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                                                        {record.doctorId?.name} • {record.hospitalName}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <CheckCircle size={10} /> Verified
                                                    </div>
                                                    <span className="text-[9px] text-gray-600 font-mono">{formatDate(record.createdAt)}</span>
                                                </div>
                                            </div>
                                            
                                            {!record.labResults && (
                                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
                                                    {record.treatmentPlan || record.description}
                                                </p>
                                            )}
                                            
                                            {record.labResults && (
                                                <div className="mb-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                                    <p className="text-[10px] text-emerald-500/60 uppercase font-black tracking-[0.2em] mb-1.5">Clinical Result</p>
                                                    <p className="text-sm font-bold text-white tracking-tight">{record.labResults}</p>
                                                </div>
                                            )}

                                            {record.fileUrl && (
                                                <button 
                                                    onClick={() => openPreview(record.fileUrl)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    <Eye size={14} /> View Report
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Recent Prescriptions */}
                            <div className="bg-[#0f1115] border border-white/10 rounded-[40px] p-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                    <ClipboardList size={14} /> Active Medications
                                </h3>
                                <div className="space-y-4">
                                    {prescriptions.length === 0 ? (
                                        <p className="text-gray-500 text-xs italic">No active prescriptions.</p>
                                    ) : (
                                        prescriptions.slice(0, 3).map(p => (
                                            <div key={p._id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                                                <p className="text-xs font-bold text-white mb-2">{p.medicines[0]?.name} {p.medicines.length > 1 ? `(+${p.medicines.length - 1} more)` : ''}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-500">{formatDate(p.createdAt)}</span>
                                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{p.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Lab Tests */}
                            <div className="bg-[#0f1115] border border-white/10 rounded-[40px] p-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                    <Microscope size={14} /> Recent Lab Tests
                                </h3>
                                <div className="space-y-4">
                                    {labOrders.length === 0 ? (
                                        <p className="text-gray-500 text-xs italic">No recent lab reports.</p>
                                    ) : (
                                        labOrders.slice(0, 3).map(l => (
                                            <div key={l._id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-xs font-bold text-white">{l.testName}</p>
                                                    {l.resultFile && (
                                                        <button 
                                                            onClick={() => openPreview(l.resultFile)}
                                                            className="text-emerald-500 hover:text-emerald-400 transition-colors"
                                                            title="View Result"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{l.status}</span>
                                                    <span className="text-[10px] text-emerald-500 font-bold">{formatDate(l.date || l.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- FILE PREVIEW MODAL --- */}
            {previewFile && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
                    <div className="absolute top-6 right-6 flex items-center gap-4">
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
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6 text-gray-400 text-xs font-medium uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full border border-gray-800/50">
                        Secure Electronic Health Record Preview
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPatientQRView;
