import React, { useEffect, useState, useRef } from 'react';
import { fetchAdmissionStatus } from '../../services/patientApi';
import { 
    Building2, MapPin, Calendar, Clock, User, 
    TrendingUp, Activity, Microscope, Pill, 
    ArrowRight, Building, AlertCircle, Loader2,
    IndianRupee, ChevronRight, Award, CheckCircle,
    Download, ShieldCheck, Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import html2canvas from 'html2canvas';
import { getBaseUrl } from '../../services/userApi';

const InPatientStatus = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const certificateRef = useRef(null);

    const handleDownloadCertificate = async () => {
        const certificateData = status?.data?.certificate;
        if (!certificateRef.current || !certificateData) {
            console.error('Certificate data or reference missing', { 
                ref: !!certificateRef.current, 
                data: !!certificateData 
            });
            return;
        }
        
        setDownloading(true);
        try {
            // Wait for any layout/font shifts
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = certificateRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true, // Enable logging for debugging
                width: 1000,
                height: element.offsetHeight || 1400 // Fallback height
            });
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Create download link for PNG
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `Medical_Certificate_${user?.name?.replace(/\s+/g, '_') || 'Patient'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (err) {
            console.error('Download failed:', err);
            alert(`Failed to generate Image: ${err.message || 'Please try again.'}`);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const res = await fetchAdmissionStatus();
                if (res?.success) {
                    setStatus(res);
                } else {
                    setError('Failed to load admission details.');
                }
            } catch (err) {
                console.error('Error fetching admission status:', err);
                setError('Could not fetch admission status.');
            } finally {
                setLoading(false);
            }
        };
        loadStatus();

        socket.on('admission-certificate-issued', (data) => {
            setStatus(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        certificate: data
                    }
                };
            });
        });

        return () => {
            socket.off('admission-certificate-issued');
        };
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 size={32} className="text-emerald-500 animate-spin" />
                <p className="text-gray-500 text-sm font-medium">Tracking your clinical status...</p>
            </div>
        );
    }

    if (!status?.isAdmitted) {
        return (
            <div className="flex flex-col items-center justify-center bg-[#111318] border border-white/[0.06] rounded-[32px] py-24 text-center px-6">
                <div className="w-20 h-20 rounded-full bg-white/[0.02] flex items-center justify-center mb-6">
                    <Building2 size={40} className="text-gray-700" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">Not Currently Admitted</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-sm">
                    You are not currently listed as an in-patient in any hospital within our network.
                </p>
            </div>
        );
    }

    const { data } = status;

    return (
        <div className="space-y-8 pb-12 animate-fadein">
            {/* Google Fonts for Certificate */}
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Inter:wght@100..900&display=swap');
                `}
            </style>
            {/* Header / Hospital Info */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1a1f2e] to-[#0e1117] border border-white/[0.08] p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Building2 size={32} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{data.hospitalName}</h2>
                            <div className="flex items-center gap-2 mt-1.5 text-gray-400">
                                <MapPin size={14} className="text-emerald-500" />
                                <span className="text-xs font-medium">{data.hospitalAddress}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                            <Calendar size={14} className="text-emerald-500" />
                            <span className="text-xs font-bold text-gray-300">
                                Admitted: {new Date(data.admittedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="bg-emerald-500 text-black px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <Activity size={14} /> LIVE STATUS
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Clinical Status & History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Recovery Certificate Section */}
                    {data.certificate?.status && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02] border border-amber-500/20 rounded-[32px] p-8 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors" />
                            
                            <div className="relative flex flex-col md:flex-row items-center gap-8">
                                <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                                    <Award size={40} className="text-amber-500" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Recovery Certification</p>
                                    <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                                        Patient {data.certificate.status}
                                    </h3>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <CheckCircle size={14} className="text-emerald-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Verified by Dr. {(data.certificate?.doctorName || data.doctorName || 'Attending Physician').replace(/^Dr\.\s+/i, '')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar size={14} className="text-amber-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Issued {new Date(data.certificate.issuedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="flex flex-col gap-3">
                                        <div className="w-24 h-24 border-4 border-amber-500/10 rounded-full flex items-center justify-center relative mx-auto">
                                            <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full animate-spin duration-[3000ms]" />
                                            <span className="text-amber-500 font-black text-xs uppercase tracking-tighter">Verified</span>
                                        </div>
                                        <button 
                                            onClick={handleDownloadCertificate}
                                            disabled={downloading}
                                            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                            {downloading ? 'Generating...' : 'Download Image'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden Certificate Template for Image Generation */}
                            <div 
                                style={{ 
                                    position: 'absolute', 
                                    top: '-9999px', 
                                    left: '-9999px', 
                                    zIndex: -100,
                                    pointerEvents: 'none'
                                }}
                            >
                                <div 
                                    ref={certificateRef}
                                    style={{ 
                                        width: '1000px',
                                        backgroundColor: '#f0f7ff',
                                        padding: '48px',
                                        color: '#1a365d',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        fontFamily: "'Inter', sans-serif",
                                        minHeight: '700px'
                                    }}
                                >
                                    {/* Main White Card with Border */}
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        border: '3px solid #1a365d',
                                        padding: '48px',
                                        height: '100%',
                                        position: 'relative',
                                        zIndex: 10
                                    }}>
                                        {/* Inner thin border */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '15px',
                                            left: '15px',
                                            right: '15px',
                                            bottom: '15px',
                                            border: '2px solid #1a365d',
                                            pointerEvents: 'none',
                                            zIndex: 5
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: '22px',
                                            left: '22px',
                                            right: '22px',
                                            bottom: '22px',
                                            border: '1px solid #1a365d',
                                            opacity: 0.2,
                                            pointerEvents: 'none',
                                            zIndex: 5
                                        }} />

                                        {/* Background Watermark */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.03,
                                            pointerEvents: 'none',
                                            overflow: 'hidden'
                                        }}>
                                            <ShieldCheck size={600} style={{ color: '#1a365d' }} />
                                        </div>

                                        <div style={{ position: 'relative', zIndex: 20 }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #1a365d',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Activity size={24} style={{ color: '#1a365d' }} />
                                                </div>
                                                <h1 style={{
                                                    fontSize: '20px',
                                                    fontWeight: 'bold',
                                                    letterSpacing: '-0.025em',
                                                    color: '#4a5568'
                                                }}>
                                                    {data.hospitalName}
                                                </h1>
                                            </div>

                                            {/* Title */}
                                            <div style={{ textAlign: 'center', marginBottom: '60px', position: 'relative', zIndex: 1 }}>
                                                <h2 style={{
                                                    fontSize: '64px',
                                                    fontFamily: "'Dancing Script', cursive",
                                                    fontWeight: 500,
                                                    color: '#1a365d',
                                                    margin: 0,
                                                    padding: '0 20px',
                                                    display: 'inline-block'
                                                }}>
                                                    Certificate of Health
                                                </h2>
                                                <div style={{
                                                    width: '300px',
                                                    height: '2px',
                                                    background: 'linear-gradient(to right, transparent, #1a365d, transparent)',
                                                    margin: '10px auto'
                                                }} />
                                            </div>

                                            {/* Patient Details Grid */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '24px',
                                                marginBottom: '48px',
                                                maxWidth: '896px',
                                                marginLeft: 'auto',
                                                marginRight: 'auto',
                                                fontSize: '18px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Patient:</span>
                                                    <span style={{ color: '#4a5568' }}>{user?.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Patient ID:</span>
                                                    <span style={{ color: '#4a5568' }}>{user?._id?.slice(-10).toUpperCase() || 'P-88294-1'}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Doctor:</span>
                                                    <span style={{ color: '#4a5568' }}>Dr. {(data.certificate?.doctorName || data.doctorName || 'Attending Physician').replace(/^Dr\.\s+/i, '')}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Patient Status:</span>
                                                    <span style={{ color: '#4a5568' }}>{data.certificate.status}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Date:</span>
                                                    <span style={{ color: '#4a5568' }}>{new Date(data.admittedAt).toLocaleDateString()} - {new Date(data.admittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1a365d' }}>{data.certificate.recommendDischarge ? 'Discharged:' : 'Issued:'}</span>
                                                    <span style={{ color: '#4a5568' }}>{new Date(data.certificate.issuedAt).toLocaleDateString()} - {new Date(data.certificate.issuedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                {data.certificate.recommendDischarge && (
                                                    <>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Recommended:</span>
                                                            <span style={{ color: '#059669', fontWeight: 'bold' }}>YES (Home Recovery)</span>
                                                        </div>
                                                        {data.certificate.followUpDate && (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Follow-up:</span>
                                                                <span style={{ color: '#4a5568' }}>{new Date(data.certificate.followUpDate).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Content Text */}
                                            <div style={{
                                                maxWidth: '896px',
                                                marginLeft: 'auto',
                                                marginRight: 'auto',
                                                color: '#4a5568',
                                                lineHeight: 1.625,
                                                marginBottom: '48px'
                                            }}>
                                                {data.certificate.recommendDischarge ? (
                                                    <p style={{ fontSize: '18px', marginBottom: '24px' }}>
                                                        Patient was recommended for discharge on <span style={{ fontWeight: 500, color: '#1a365d' }}>{new Date(data.certificate.issuedAt).toLocaleDateString()}</span>. Patient should be able to return to work in 7 days.
                                                    </p>
                                                ) : (
                                                    <p style={{ fontSize: '18px', marginBottom: '24px' }}>
                                                        This certificate confirms the patient's current clinical standing as of <span style={{ fontWeight: 500, color: '#1a365d' }}>{new Date(data.certificate.issuedAt).toLocaleDateString()}</span>. The patient remains under medical observation.
                                                    </p>
                                                )}
                                                <p style={{ fontSize: '18px', marginBottom: '24px' }}>
                                                    Based on the latest clinical assessment, the following notes and restrictions are advised:
                                                </p>
                                                <ul style={{ listStyle: 'none', paddingLeft: '16px', fontSize: '18px' }}>
                                                    {data.certificate.notes ? (
                                                        data.certificate.notes.split('\n').map((note, index) => (
                                                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                <span style={{ color: '#1a365d' }}>-</span> {note}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                <span style={{ color: '#1a365d' }}>-</span> Avoid heavy lifting
                                                            </li>
                                                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                <span style={{ color: '#1a365d' }}>-</span> No prolonged standing for more than 2 hours
                                                            </li>
                                                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                <span style={{ color: '#1a365d' }}>-</span> Light desk duties preferred
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>

                                            {/* Footer Area */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-end',
                                                maxWidth: '896px',
                                                marginLeft: 'auto',
                                                marginRight: 'auto',
                                                paddingTop: '32px',
                                                borderTop: '1px solid #f3f4f6'
                                            }}>
                                                {/* Contact Info (Bottom Left) */}
                                                <div style={{ textAlign: 'left', fontSize: '13px', color: '#64748b', width: '45%' }}>
                                                    <div style={{ display: 'flex', marginBottom: '6px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#1a365d', width: '65px', flexShrink: 0 }}>Address:</span> 
                                                        <span style={{ lineHeight: '1.4' }}>{data.hospitalAddress}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', marginBottom: '6px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#1a365d', width: '65px', flexShrink: 0 }}>Phone:</span> 
                                                        <span>+91 80 4567 8900</span>
                                                    </div>
                                                    <div style={{ display: 'flex' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#1a365d', width: '65px', flexShrink: 0 }}>Email:</span> 
                                                        <span>contact@{data.hospitalName.toLowerCase().replace(/\s+/g, '')}.com</span>
                                                    </div>
                                                </div>

                                                {/* Signature (Bottom Right) - Improved with White Background and Border */}
                                                <div style={{ textAlign: 'center', width: '220px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        height: '100px',
                                                        position: 'relative',
                                                        backgroundColor: '#ffffff', // Clean white background
                                                        border: '1px solid #e2e8f0', // Subtle light border
                                                        borderRadius: '8px', // Slightly rounded corners
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // Very soft shadow
                                                        padding: '10px',
                                                        marginBottom: '8px'
                                                    }}>
                                                        {data.certificate?.signature ? (
                                                            <img 
                                                                src={`${getBaseUrl()}/${data.certificate.signature.replace(/\\/g, '/')}`} 
                                                                alt="Signature" 
                                                                style={{ 
                                                                    maxHeight: '80px', 
                                                                    maxWidth: '180px', 
                                                                    objectFit: 'contain'
                                                                }}
                                                                crossOrigin="anonymous"
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                fontStyle: 'italic',
                                                                fontFamily: "'Dancing Script', cursive",
                                                                fontSize: '32px',
                                                                color: '#1a365d',
                                                                opacity: 0.6
                                                            }}>
                                                                Dr. {(data.certificate?.doctorName || data.doctorName || 'AP').split(' ').pop()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ marginTop: '4px' }}>
                                                        <p style={{ 
                                                            fontFamily: "'Inter', sans-serif",
                                                            fontWeight: 800, 
                                                            color: '#1a365d', 
                                                            margin: 0, 
                                                            textTransform: 'uppercase', 
                                                            fontSize: '13px',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            Dr. {(data.certificate?.doctorName || data.doctorName || 'Attending Physician').replace(/^Dr\.\s+/i, '')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* QR Code Placeholder (Small) */}
                                                 <div style={{ marginLeft: '24px', border: '1px solid #f3f4f6', padding: '4px' }}>
                                                     <div style={{ width: '48px', height: '48px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                         <ShieldCheck size={24} style={{ color: '#d1d5db' }} />
                                                     </div>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Current Stay Card */}
                    <div className="bg-[#111318] border border-white/[0.06] rounded-[32px] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Building size={20} className="text-blue-500" />
                                <h3 className="text-lg font-black text-white tracking-tight uppercase">Current Stay</h3>
                            </div>
                            <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                                Day {data.days}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ward Location</p>
                                <p className="text-2xl font-black text-white">{data.currentWard}</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Stethoscope size={12} className="text-blue-500" />
                                    Primary Physician
                                </p>
                                <p className="text-2xl font-black text-white">Dr. {(data.certificate?.doctorName || data.doctorName || 'Attending Physician').replace(/^Dr\.\s+/i, '')}</p>
                            </div>
                        </div>

                        {/* Ward Change History */}
                        {data.wardHistory && data.wardHistory.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/[0.05]">
                                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Ward Transition History</h4>
                                <div className="space-y-4">
                                    {data.wardHistory.map((h, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                                <ArrowRight size={16} className="text-gray-500 group-hover:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-bold text-gray-300">{h.ward} Ward</p>
                                                    <p className="text-[10px] font-medium text-gray-500">
                                                        {new Date(h.startedAt).toLocaleDateString()} - {new Date(h.endedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                                    <div className="h-full bg-blue-500/20 w-full" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                            <TrendingUp size={16} className="text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-black text-emerald-400">{data.currentWard} Ward</p>
                                                <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Active Now</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Running Costs Tracker */}
                <div className="space-y-8">
                    <div className="bg-[#111318] border border-white/[0.06] rounded-[32px] overflow-hidden">
                        <div className="p-8 bg-gradient-to-br from-emerald-500/10 to-transparent border-b border-white/[0.05]">
                            <div className="flex items-center gap-3 mb-2">
                                <IndianRupee size={20} className="text-emerald-500" />
                                <h3 className="text-lg font-black text-white tracking-tight uppercase">Live Expenditure</h3>
                            </div>
                            <p className="text-4xl font-black text-white mt-4 tracking-tighter">
                                ₹{data.total.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] mt-2">Accrued as of today</p>
                        </div>

                        <div className="p-8 space-y-6">
                            {data.summary.map((item, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                item.type === 'ward' ? 'bg-blue-500/10 text-blue-400' :
                                                item.type === 'consultancy' ? 'bg-emerald-500/10 text-emerald-400' :
                                                item.type === 'lab_test' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-purple-500/10 text-purple-400'
                                            }`}>
                                                {item.type === 'ward' ? <Building size={14} /> :
                                                 item.type === 'consultancy' ? <User size={14} /> :
                                                 item.type === 'lab_test' ? <Microscope size={14} /> :
                                                 <Pill size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-300">{item.name}</p>
                                                {item.details && <p className="text-[10px] text-gray-600 font-medium">{item.details}</p>}
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-white">₹{item.cost.toLocaleString()}</p>
                                    </div>
                                    <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.cost / data.total) * 100}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className={`h-full ${
                                                item.type === 'ward' ? 'bg-blue-500' :
                                                item.type === 'consultancy' ? 'bg-emerald-500' :
                                                item.type === 'lab_test' ? 'bg-amber-500' :
                                                'bg-purple-500'
                                            } opacity-50`}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 pt-8 border-t border-white/[0.05] space-y-4">
                                <div className="flex items-center gap-3 text-amber-500 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                                        Note: This is a live running total. Final bill may vary based on discharge time and additional services.
                                    </p>
                                </div>
                                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                                    Detailed Expense Log <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InPatientStatus;