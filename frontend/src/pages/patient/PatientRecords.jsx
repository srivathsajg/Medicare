import React, { useEffect, useState } from 'react';
import { 
    FileText, Shield, CheckCircle, AlertCircle, Eye, 
    Clock, Search, Plus, ExternalLink, X, Maximize2,
    Calendar, User, Activity, MoreVertical, Download, CreditCard, Database, Loader2
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { fetchRecords, fetchAccessLogs } from '../../services/patientApi';
import { getBaseUrl } from '../../services/userApi';
import { useAuth } from '../../context/AuthContext';

const RecordCard = ({ record, onPreview }) => {
    const isVerified = !!record.blockchainTxHash;

    return (
        <div className="group relative bg-[#0f1115] border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="p-4 sm:p-6 relative z-10 flex flex-col lg:flex-row justify-between gap-4 sm:gap-6">
                <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:border-blue-500/30 transition-all duration-500">
                        <FileText size={16} sm:size={20} className="text-blue-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                            <h4 className="font-black text-sm sm:text-lg text-white tracking-tight group-hover:text-blue-400 transition-colors duration-300 truncate">
                                {record.title || record.diagnosis || 'Clinical Update'}
                            </h4>
                            <div className="flex gap-2">
                                {record.isSelfUploaded && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[7px] sm:text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <User size={8} /> Self
                                    </span>
                                )}
                                {isVerified && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] sm:text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Shield size={8} /> BC
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {(record.notes || record.description || record.labResults) && (
                            <p className="text-gray-500 leading-relaxed text-[10px] sm:text-xs font-medium line-clamp-2 sm:line-clamp-none mt-1 sm:mt-2">
                                {record.description || record.notes || record.labResults}
                            </p>
                        )}
                        
                        <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                            <span className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                                <Calendar size={10} sm:size={11} className="text-blue-500/60" /> 
                                {new Date(record.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch lg:items-end justify-between gap-3 sm:gap-4 shrink-0 lg:w-[240px]">
                    <div className="flex flex-col items-stretch lg:items-end gap-2 w-full sm:w-auto">
                        <div className="bg-[#0c0e12] border border-white/[0.04] p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-inner">
                            <p className="text-[8px] sm:text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-0.5 sm:mb-1">Dr.</p>
                            <p className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight truncate max-w-[120px] sm:max-w-[160px]">
                                {record.orderedBy?.name ? `Dr. ${record.orderedBy.name}` : (record.doctorId?.name ? `Dr. ${record.doctorId.name}` : 'Specialist')}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onPreview}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        Review
                    </button>
                </div>
            </div>

            {isVerified && (
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-500/[0.02] border-t border-white/[0.04] flex items-center gap-2 group-hover:bg-emerald-500/[0.04] transition-all duration-500">
                    <Shield size={10} sm:size={12} className="text-emerald-500/40" />
                    <div className="font-mono text-[8px] sm:text-[9px] text-gray-600 truncate group-hover:text-emerald-400/60 transition-colors">
                        {record.blockchainTxHash}
                    </div>
                </div>
            )}
        </div>
    );
};

const PatientRecords = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('records'); // 'records' | 'history'
    const [records, setRecords] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Preview state
    const [previewFile, setPreviewFile] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (previewFile) {
            setImageLoading(true);
            setImageError(false);
        }
    }, [previewFile]);

    const getImageUrl = (path) => {
        if (!path) return '/fallback-image.png'; // safe fallback
        if (path.startsWith('http')) return path;
        
        // Fix Windows slashes and remove any backend prefix
        let cleanPath = path.replace(/\\/g, '/').replace(/^(\/?backend\/)?/, '');
        
        // If the path doesn't start with 'uploads/' and isn't just an absolute path, we might need to prepend it
        if (!cleanPath.startsWith('uploads/') && !cleanPath.startsWith('/')) {
            if (!cleanPath.includes('/')) {
                cleanPath = `uploads/${cleanPath}`;
            }
        }
        
        // Encode each segment of the path to handle spaces and special chars
        const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        
        const baseUrl = getBaseUrl();
        const finalPath = encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`;
        
        return `${baseUrl}${finalPath}`;
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [recordsRes, logsRes] = await Promise.all([
                    fetchRecords(),
                    fetchAccessLogs().catch(err => ({ success: false, error: err }))
                ]);

                if (recordsRes?.success) setRecords(recordsRes.data);
                else setError('Failed to load records.');

                if (logsRes?.success) setAccessLogs(logsRes.data);
                else console.warn('Failed to load access logs');

            } catch (err) {
                console.error('[PatientRecords] error:', err);
                setError('Could not fetch data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Add Identity Card to search results if it matches
    const showIdentityCard = user?.idProofImage && (
        'identity registration card proof'.includes(search.toLowerCase()) || 
        search === ''
    );


    const pastReports = user?.pastLabReports || [];
    const showPastReports = pastReports.length > 0 && (
        'past lab reports registration'.includes(search.toLowerCase()) || 
        search === ''
    );

    const filteredRecords = records.filter(r =>
        (r.title || r.diagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.doctorId?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredLogs = accessLogs.filter(log => 
        (log.userId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <Loader message="Accessing Clinical Vault" />;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Medical Records</h2>
                    <p className="text-gray-500 text-sm mt-1">Your identity proofs and verified clinical history.</p>
                </div>
                <div className="flex gap-2 bg-[#111318] p-1.5 rounded-2xl border border-white/[0.06] backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('records')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'records' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
                        }`}
                    >
                        My Records
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'history' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
                        }`}
                    >
                        Access Logs
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder={activeTab === 'records' ? "Search records, diagnoses, or identity documents..." : "Search access history..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-[#111318] border border-white/[0.06] rounded-2xl pl-12 pr-4 py-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-blue-500/30 transition-all w-full shadow-2xl"
                />
            </div>

            {activeTab === 'records' ? (
                <div className="grid grid-cols-1 gap-4">
                    {/* Registration Identity Card */}
                    {showIdentityCard && (
                        <div className="bg-gradient-to-br from-[#1a1c22] to-[#0d0e12] border border-emerald-500/20 rounded-[28px] p-6 hover:border-emerald-500/40 transition-all group relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-600/10 transition-all">
                                        <CreditCard size={24} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h4 className="font-bold text-lg text-white tracking-tight">Identity & Registration Proof</h4>
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                                Registry Doc
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                                            <CheckCircle size={12} className="text-emerald-500" /> Verified during account registration
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setPreviewFile({ 
                                        title: 'Identity Proof', 
                                        fileUrl: user.idProofImage,
                                        createdAt: user.createdAt 
                                    })}
                                    className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 shadow-lg shadow-emerald-900/10"
                                >
                                    View Record
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Past Lab Reports from Registration */}
                    {showPastReports && pastReports.map((report, index) => (
                        <div key={`past-report-${index}`} className="bg-gradient-to-br from-[#1a1c22] to-[#0d0e12] border border-blue-500/20 rounded-[28px] p-6 hover:border-blue-500/40 transition-all group relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center group-hover:bg-blue-600/10 transition-all">
                                        <FileText size={24} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h4 className="font-bold text-lg text-white tracking-tight">Past Lab Report {index + 1}</h4>
                                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest">
                                                Self Uploaded
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                                            <Clock size={12} className="text-blue-500" /> Uploaded during registration
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setPreviewFile({ 
                                        title: `Past Lab Report ${index + 1}`, 
                                        fileUrl: report,
                                        createdAt: user.createdAt 
                                    })}
                                    className="bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20 shadow-lg shadow-blue-900/10"
                                >
                                    View Record
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredRecords.length === 0 && !showIdentityCard && !showPastReports && !error ? (
                        <div className="flex flex-col items-center justify-center bg-[#111318] border border-white/[0.06] rounded-[32px] py-32 text-gray-700">
                            <FileText size={64} className="mb-4 opacity-10" />
                            <p className="text-lg font-bold">No Records Found</p>
                        </div>
                    ) : (
                        filteredRecords.map(record => (
                            <RecordCard 
                                key={record._id} 
                                record={record} 
                                onPreview={() => setPreviewFile(record)}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-[#111318] border border-white/[0.06] rounded-[32px] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-16">Sl No.</th>
                                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Accessed By</th>
                                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Security Role</th>
                                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Operation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredLogs.map((log, idx) => (
                                <tr key={log._id} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="p-6 text-sm text-gray-500 font-mono">{idx + 1}</td>
                                    <td className="p-6 text-sm text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-6 font-bold text-white text-sm">{log.userId?.name || 'Unknown User'}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${log.role === 'doctor' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                            {log.role}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm text-gray-300">{log.action.replace(/_/g, ' ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setPreviewFile(null)} />
                    <div className="relative bg-[#0e1015] border border-white/[0.1] rounded-[40px] w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl animate-pop-in flex flex-col">
                        <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <FileText className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{previewFile.title || 'Regulatory Document'}</h3>
                                    <p className="text-gray-500 text-xs mt-1">Verified Clinical Proof · {new Date(previewFile.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPreviewFile(null)}
                                className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 bg-black/40 overflow-auto p-4 flex items-center justify-center">
                            {!previewFile.fileUrl ? (
                                <div className="text-gray-500 flex flex-col items-center">
                                    <FileText size={48} className="mb-4 opacity-50" />
                                    <p>No document attached.</p>
                                    {(previewFile.labResults || previewFile.description) && (
                                        <div className="mt-6 bg-[#111318] p-6 rounded-2xl border border-white/[0.05] max-w-2xl text-center">
                                            <p className="text-white text-lg">{previewFile.labResults || previewFile.description}</p>
                                        </div>
                                    )}
                                </div>
                            ) : previewFile.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {imageLoading && !imageError && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-blue-500" size={40} />
                                        </div>
                                    )}
                                    {imageError ? (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <AlertCircle size={48} className="mb-4 text-red-500 opacity-50" />
                                            <p>Failed to load image.</p>
                                            <p className="text-xs mt-2 text-gray-600 break-all">{getImageUrl(previewFile.fileUrl)}</p>
                                        </div>
                                    ) : (
                                        <img 
                                            src={getImageUrl(previewFile.fileUrl)} 
                                            alt="Medical Record Preview"
                                            className={`max-w-full max-h-full object-contain rounded-xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                            onLoad={() => {
                                                console.log('Image loaded successfully:', getImageUrl(previewFile.fileUrl));
                                                setImageLoading(false);
                                            }}
                                            onError={(e) => {
                                                console.error('Image load error for:', getImageUrl(previewFile.fileUrl), e);
                                                setImageLoading(false);
                                                setImageError(true);
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <iframe 
                                    src={getImageUrl(previewFile.fileUrl)}
                                    className="w-full h-full rounded-xl border-none"
                                    title="Medical Record Document"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



export default PatientRecords;
