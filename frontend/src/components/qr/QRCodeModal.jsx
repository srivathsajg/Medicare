import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, RefreshCw, Clock, ShieldCheck, Trash2, Printer } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, qrData, onRefresh, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (qrData?.expiresAt) {
            const calculateTimeLeft = () => {
                const diff = new Date(qrData.expiresAt) - new Date();
                if (diff <= 0) return 0;
                return Math.floor(diff / 1000);
            };

            setTimeLeft(calculateTimeLeft());
            const timer = setInterval(() => {
                const left = calculateTimeLeft();
                setTimeLeft(left);
                if (left <= 0) clearInterval(timer);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [qrData]);

    const formatTime = (seconds) => {
        if (seconds === null) return '...';
        if (seconds <= 0) return 'Expired';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const downloadQR = () => {
        const canvas = document.getElementById('patient-qr-code');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `MediCare-Health-QR-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const printQRCard = () => {
        const canvas = document.getElementById('patient-qr-code');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>MediCare Health Identity Card</title>
                    <style>
                        body { 
                            font-family: 'Inter', sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                            background: #f0f0f0; 
                        }
                        .card { 
                            width: 350px; 
                            background: #0f1115; 
                            color: white; 
                            border-radius: 20px; 
                            padding: 30px; 
                            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                            text-align: center;
                            border: 1px solid rgba(255,255,255,0.1);
                        }
                        .header { 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            gap: 10px; 
                            margin-bottom: 25px; 
                            border-bottom: 1px solid rgba(255,255,255,0.05);
                            padding-bottom: 15px;
                        }
                        .logo { font-weight: 900; letter-spacing: 2px; font-size: 18px; color: #10b981; }
                        .qr-container { background: white; padding: 15px; border-radius: 15px; display: inline-block; margin-bottom: 20px; }
                        .qr-container img { width: 180px; height: 180px; }
                        .footer { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 15px; }
                        .security { font-size: 10px; color: #3b82f6; font-weight: bold; margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="header">
                            <span class="logo">MediCare</span>
                        </div>
                        <div class="qr-container">
                            <img src="${url}" />
                        </div>
                        <div class="security">BLOCKCHAIN SECURED NODE</div>
                        <div class="footer">DIGITAL HEALTH IDENTITY CARD</div>
                    </div>
                    <script>
                        window.onload = () => { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!isOpen) return null;

    const qrUrl = `${window.location.origin}/patient-qr-access/${qrData?.token}`;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md max-h-[95vh] bg-[#0f1115] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
                
                {/* Header - Fixed */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Your Health QR</h3>
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Secure Patient Identity</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white border border-transparent hover:border-white/10"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col items-center text-center">
                    <div className="relative p-5 bg-white rounded-2xl mb-6 shadow-[0_0_50px_rgba(255,255,255,0.05)] group shrink-0">
                        <QRCodeCanvas 
                            id="patient-qr-code"
                            value={qrUrl} 
                            size={180}
                            level="H"
                            includeMargin={false}
                        />
                        {timeLeft === 0 && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                    <Clock className="text-red-500" size={20} />
                                </div>
                                <p className="text-white text-[9px] font-black uppercase tracking-widest">Token Expired</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mb-8 bg-white/5 px-5 py-2 rounded-full border border-white/10 shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${timeLeft <= 60 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                        <span className={`text-xs font-black font-mono tracking-widest ${timeLeft <= 60 ? 'text-red-400' : 'text-gray-300'}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest pl-3 border-l border-white/10">
                            Node Valid
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mb-3 shrink-0">
                        <button 
                            onClick={downloadQR}
                            disabled={timeLeft <= 0}
                            className="flex items-center justify-center gap-2 p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-30"
                        >
                            <Download size={14} /> Download
                        </button>
                        <button 
                            onClick={onRefresh}
                            className="flex items-center justify-center gap-2 p-3 bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-black transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    <button 
                        onClick={printQRCard}
                        disabled={timeLeft <= 0}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-300 transition-all mb-6 disabled:opacity-30 shrink-0"
                    >
                        <Printer size={14} /> Print Health ID Card
                    </button>

                    <button 
                        onClick={() => onExpire(qrData?.token)}
                        disabled={timeLeft <= 0}
                        className="flex items-center justify-center gap-2 text-red-400/40 hover:text-red-400 text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-20 mb-2 shrink-0"
                    >
                        <Trash2 size={10} /> Force Expire Session
                    </button>
                </div>

                {/* Footer Info - Fixed */}
                <div className="p-5 bg-black/60 border-t border-white/5 flex items-center gap-4 shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                        <ShieldCheck className="text-blue-400" size={18} />
                    </div>
                    <p className="text-[8px] text-gray-500 leading-relaxed text-left font-medium uppercase tracking-tight">
                        This secure node allows temporary read-only access to your medical summary. Raw data remains encrypted on the ledger.
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}} />
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default QRCodeModal;
