import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload, ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRScannerModal = ({ isOpen, onClose }) => {
    const [scanMethod, setScanMethod] = useState('camera'); // 'camera' or 'upload'
    const [error, setError] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && scanMethod === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, scanMethod]);

    const startCamera = async () => {
        setError(null);
        setIsCameraReady(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setIsCameraReady(true);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please check permissions or use direct upload.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraReady(false);
    };

    const handleScanSuccess = (decodedText) => {
        stopCamera();
        onClose();
        
        try {
            // Check if it's a URL or just a token
            if (decodedText.startsWith('http')) {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/').filter(Boolean);
                const token = pathParts[pathParts.length - 1];
                if (token) {
                    navigate(`/patient-qr-access/${token}`);
                } else {
                    throw new Error("Invalid QR format");
                }
            } else {
                navigate(`/patient-qr-access/${decodedText}`);
            }
        } catch (e) {
            setError("Invalid QR code content. Could not find access token.");
        }
    };

    const captureAndScan = async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return;

        setIsProcessing(true);
        setError(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to Blob/File for html5-qrcode to process
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "capture.png", { type: "image/png" });
            const html5QrCode = new Html5Qrcode("reader-hidden");
            
            try {
                const decodedText = await html5QrCode.scanFile(file, true);
                handleScanSuccess(decodedText);
            } catch (err) {
                console.error("Capture scan error:", err);
                setError("No QR code detected in the captured image. Please try again.");
            } finally {
                setIsProcessing(false);
            }
        }, 'image/png');
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        const html5QrCode = new Html5Qrcode("reader-hidden");
        try {
            const decodedText = await html5QrCode.scanFile(file, true);
            handleScanSuccess(decodedText);
        } catch (err) {
            console.error("File scan error:", err);
            setError("Could not find a valid QR code in this image. Please ensure the image is clear.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-[#0f1115] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <ShieldCheck className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Patient Access Node</h3>
                            <p className="text-[10px] text-emerald-400/80 uppercase font-black tracking-widest">Secure Profile Verification</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Method Selector */}
                <div className="p-4 bg-white/5 border-b border-white/5 flex gap-2">
                    <button 
                        onClick={() => setScanMethod('camera')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${scanMethod === 'camera' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-900/20' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Camera size={16} /> Capture Photo
                    </button>
                    <button 
                        onClick={() => setScanMethod('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${scanMethod === 'upload' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-900/20' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Upload size={16} /> Direct Upload
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center text-center">
                    {scanMethod === 'camera' ? (
                        <div className="w-full">
                            <div className="relative w-full aspect-square bg-black rounded-[32px] overflow-hidden border border-white/10 group">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
                                />
                                
                                {!isCameraReady && !error && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-4">
                                        <Loader2 className="animate-spin text-emerald-500" size={40} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Initializing Secure Link...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 gap-4 bg-red-500/5">
                                        <AlertCircle size={40} />
                                        <p className="text-sm font-bold leading-relaxed">{error}</p>
                                        <button onClick={startCamera} className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            <RefreshCw size={14} /> Retry Camera
                                        </button>
                                    </div>
                                )}

                                {isCameraReady && (
                                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-[32px] pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500/40 rounded-3xl border-dashed animate-pulse" />
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={captureAndScan}
                                disabled={!isCameraReady || isProcessing}
                                className="w-full mt-8 flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl"
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Camera className="group-hover:scale-110 transition-transform" size={18} />
                                )}
                                {isProcessing ? 'Analyzing Frame...' : 'Capture & Verify'}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <label className="w-full aspect-square bg-white/[0.03] hover:bg-white/[0.08] rounded-[40px] border-2 border-dashed border-white/10 hover:border-emerald-500/40 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                                    <Upload className="text-emerald-400" size={40} />
                                </div>
                                <h4 className="relative z-10 text-white font-black text-sm uppercase tracking-widest mb-2">Select QR Image</h4>
                                <p className="relative z-10 text-[10px] text-gray-500 px-12 font-medium">Upload a screenshot or photo of the patient's digital health identity card.</p>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isProcessing} />
                                
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="animate-spin text-emerald-500" size={40} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Analyzing Metadata...</p>
                                    </div>
                                )}
                            </label>
                            
                            {error && (
                                <div className="mt-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-400 text-left">
                                    <AlertCircle size={24} className="shrink-0" />
                                    <p className="text-xs font-bold leading-tight">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-black/40 border-t border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                        <ShieldCheck className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-white font-black uppercase tracking-widest mb-1">E2E Encryption Active</p>
                        <p className="text-[9px] text-gray-500 leading-relaxed text-left font-medium">
                            Clinical profiles are read-only. Data is fetched directly from the secure MediCare ledger node.
                        </p>
                    </div>
                </div>
            </div>

            {/* Hidden elements for processing */}
            <canvas ref={canvasRef} className="hidden" />
            <div id="reader-hidden" className="hidden"></div>
        </div>
    );
};

export default QRScannerModal;
