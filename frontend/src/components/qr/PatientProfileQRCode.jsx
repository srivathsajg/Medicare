import React, { useState } from 'react';
import { QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { generateQR, expireQR } from '../../services/qrApi';
import QRCodeModal from './QRCodeModal';

const PatientProfileQRCode = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateQR = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await generateQR(15); // Default 15 mins for security
            if (response.success) {
                setQrData(response.data);
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error('Error generating QR:', err);
            setError(err.message || 'Failed to generate QR');
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshQR = async () => {
        await handleGenerateQR();
    };

    const handleExpireQR = async (token) => {
        try {
            const response = await expireQR(token);
            if (response.success) {
                setQrData(prev => ({ ...prev, expiresAt: new Date(0).toISOString() }));
            }
        } catch (err) {
            console.error('Error expiring QR:', err);
        }
    };

    return (
        <div className="w-full mt-4">
            <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-emerald-400 text-xs font-bold transition-all disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <QrCode size={18} />
                )}
                <span>{loading ? 'Generating...' : 'Generate My Health QR'}</span>
            </button>
            
            {error && <p className="mt-2 text-[10px] text-red-400 text-center">{error}</p>}

            <QRCodeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                qrData={qrData}
                onRefresh={handleRefreshQR}
                onExpire={handleExpireQR}
            />
        </div>
    );
};

export default PatientProfileQRCode;
