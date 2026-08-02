import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Shield, CreditCard, Calendar, FileText, CheckCircle, 
    AlertCircle, ExternalLink, Plus, X, Upload, Clock
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { getBaseUrl } from '../../services/userApi';
import { updateInsurance, fetchInsuranceClaims, fetchPatientProfile } from '../../services/patientApi';

const PatientInsurance = () => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(authUser);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        insuranceProviderName: user?.insuranceProviderName || '',
        policyNumber: user?.policyNumber || '',
        validTillDate: user?.validTillDate ? new Date(user.validTillDate).toISOString().split('T')[0] : ''
    });
    const [file, setFile] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, claimsRes] = await Promise.all([
                fetchPatientProfile().catch(err => {
                    console.warn("Profile fetch failed:", err);
                    return { success: false };
                }),
                fetchInsuranceClaims().catch(err => {
                    console.warn("Claims fetch failed:", err);
                    return { success: false, data: [] };
                })
            ]);

            if (profileRes?.success) {
                // Ensure we handle the nested 'user' object returned by profile API
                const userData = profileRes.user || profileRes.data || profileRes; 
                
                // Keep the global context in sync so refresh doesn't drop it
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                setFormData({
                    insuranceProviderName: userData.insuranceProviderName || '',
                    policyNumber: userData.policyNumber || '',
                    validTillDate: userData.validTillDate ? new Date(userData.validTillDate).toISOString().split('T')[0] : ''
                });
            }
            if (claimsRes?.success) setClaims(claimsRes.data);
        } catch (err) {
            console.error("Error fetching insurance data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            const data = new FormData();
            data.append('insuranceProviderName', formData.insuranceProviderName);
            data.append('policyNumber', formData.policyNumber);
            data.append('validTillDate', formData.validTillDate);
            if (file) data.append('insuranceProofImage', file);

            const res = await updateInsurance(data);

            if (res?.success) {
                // Fetch latest user data from the backend to ensure all fields are populated correctly
                const profileRes = await fetchPatientProfile().catch(err => {
                    console.warn("Profile fetch after update failed:", err);
                    return { success: false };
                });
                
                let updatedUser = res.data; // fallback
                if (profileRes?.success) {
                    updatedUser = profileRes.user || profileRes.data || profileRes;
                }
                
                setUser(updatedUser);
                
                // CRITICAL: Update the global context and local storage immediately
                // so the changes survive a page refresh
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                setFormData({
                    insuranceProviderName: updatedUser.insuranceProviderName || '',
                    policyNumber: updatedUser.policyNumber || '',
                    validTillDate: updatedUser.validTillDate ? new Date(updatedUser.validTillDate).toISOString().split('T')[0] : ''
                });
                
                setShowUpdateModal(false);
                fetchData(); // Refresh list
            }
        } catch (err) {
            console.error("Error updating insurance:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.message || "Unknown error";
            alert(`Failed to update insurance details. Reason: ${errorMsg}`);
        } finally {
            setUpdateLoading(false);
        }
    };

    const isExpired = user?.validTillDate && new Date(user.validTillDate) < new Date();
    
    if (loading) {
        return <Loader message="Validating Insurance Policy" />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Insurance & Coverage</h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time verification of your policy and billing claims.</p>
                </div>
                <button 
                    onClick={() => setShowUpdateModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                >
                    <Plus size={18} /> Update Policy
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Policy Card (Primary View) */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0b0d11] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <Shield className="text-emerald-400" size={24} sm:size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-widest">Primary Provider</p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user?.insuranceProviderName || 'No Link Established'}</h3>
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-widest">Policy Number</p>
                                    <p className="text-xl sm:text-3xl font-mono font-bold text-white tracking-widest bg-white/[0.03] inline-block px-3 py-1.5 rounded-xl border border-white/[0.05]">
                                        {user?.policyNumber ? user.policyNumber.match(/.{1,4}/g).join(' ') : '•••• •••• •••• ••••'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:gap-4 min-w-0 sm:min-w-[200px]">
                                <div className={`px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border flex items-center gap-3 sm:gap-4 ${
                                    user?.isInsuranceApplied 
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                    : isExpired 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                }`}>
                                    <Calendar size={18} sm:size={20} />
                                    <div>
                                        <p className="text-[9px] uppercase font-black tracking-widest opacity-60">Status</p>
                                        <p className="text-xs sm:text-sm font-bold">
                                            {user?.isInsuranceApplied ? 'Insurance Applied' : isExpired ? 'Expired' : 'Active Coverage'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/[0.06] px-4 py-3 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Valid Till</p>
                                    <p className="text-xs sm:text-sm font-bold text-white">
                                        {user?.validTillDate ? new Date(user.validTillDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Claims History */}
                    <div className="bg-[#111318] border border-white/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Clock className="text-blue-400" size={18} sm:size={20} /> Claim History
                            </h3>
                            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{claims.length} Records</span>
                        </div>
                        
                        {claims.length === 0 && !user?.isInsuranceApplied ? (
                            <div className="py-8 sm:py-12 text-center">
                                <FileText className="mx-auto text-gray-800 mb-2 opacity-20" size={28} sm:size={32} />
                                <p className="text-gray-600 text-[11px] sm:text-sm">No hospital billing claims recorded yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {user?.isInsuranceApplied && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:bg-emerald-500/10 transition-all">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                                <Shield className="text-emerald-400" size={16} sm:size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-white truncate">Insurance Verified</p>
                                                <p className="text-[8px] sm:text-[10px] text-gray-500 font-mono tracking-tighter uppercase">Status: Active</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="px-2 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                APPLIED
                                            </span>
                                            <p className="text-[9px] sm:text-[11px] text-gray-500 mt-1">{new Date(user.insuranceVerifiedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                                {claims.map(claim => (
                                    <div key={claim._id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                <CreditCard className="text-blue-400" size={16} sm:size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-white truncate">{claim.description || 'Medical Claim'}</p>
                                                <p className="text-[8px] sm:text-[10px] text-gray-500 font-mono tracking-tighter">ID: {claim._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase ${
                                                claim.claimStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                claim.claimStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {claim.claimStatus}
                                            </span>
                                            <p className="text-[9px] sm:text-[11px] text-gray-500 mt-1">{new Date(claim.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Digital ID / Proof */}
                <div className="space-y-6 h-full">
                    <div className="bg-[#111318] border border-white/[0.06] rounded-3xl p-6 h-full flex flex-col shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-white uppercase tracking-[0.1em] flex items-center gap-2">
                                <FileText size={16} className="text-emerald-400" /> Digital Proof
                            </h4>
                        </div>
                        
                        <div className="flex-1 min-h-[300px] rounded-3xl bg-black/40 border-2 border-dashed border-white/[0.05] flex items-center justify-center overflow-hidden relative group">
                            {user?.insuranceProofImage ? (
                                <img 
                                    src={`${getBaseUrl()}/${user.insuranceProofImage.replace(/\\/g, '/').replace(/^\/?(backend\/)?/, '')}`} 
                                    alt="Insurance Proof" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                                        <Shield size={32} className="text-gray-800" />
                                    </div>
                                    <p className="text-gray-600 text-xs font-medium">No verified document uploaded.</p>
                                    <button 
                                        onClick={() => setShowUpdateModal(true)}
                                        className="mt-4 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:text-emerald-300 underline"
                                    >
                                        Upload Now
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 bg-[#1a1f2e] p-4 rounded-2xl border border-emerald-500/20">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle size={12} /> Blockchain Identity
                            </p>
                            <p className="text-[9px] text-gray-500 font-mono leading-relaxed bg-black/20 p-2 rounded-lg break-all">
                                0x{user?._id?.slice(0, 16)}... verified by MediCare Security Node
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowUpdateModal(false)} />
                    <div className="relative bg-[#0e1015] border border-white/[0.1] rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-pop-in">
                        <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Sync Insurance</h3>
                                <p className="text-gray-500 text-xs mt-1">Update your policy details for clinical billing.</p>
                            </div>
                            <button 
                                onClick={() => setShowUpdateModal(false)}
                                className="w-10 h-10 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 transition-all border border-white/[0.05]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Provider Name</label>
                                <input 
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                    placeholder="e.g. Star Health Insurance"
                                    value={formData.insuranceProviderName}
                                    onChange={e => setFormData({...formData, insuranceProviderName: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Policy ID</label>
                                <input 
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                    placeholder="SH-00123-ABC"
                                    value={formData.policyNumber}
                                    onChange={e => setFormData({...formData, policyNumber: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiry Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                                    value={formData.validTillDate}
                                    onChange={e => setFormData({...formData, validTillDate: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Proof Document (Image)</label>
                                <div className="relative group">
                                    <input 
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={e => setFile(e.target.files[0])}
                                        accept="image/*"
                                    />
                                    <label 
                                        htmlFor="file-upload"
                                        className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-5 text-sm text-gray-400 cursor-pointer hover:bg-white/[0.05] transition-all group-hover:border-emerald-500/30"
                                    >
                                        <span className="truncate">{file ? file.name : 'Select ID Card Image'}</span>
                                        <Upload size={18} className="text-gray-500" />
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={updateLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl text-white font-bold text-sm shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {updateLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Sync Policy'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientInsurance;
