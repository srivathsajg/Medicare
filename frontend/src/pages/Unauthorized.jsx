import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleGoBack = () => {
        if (user?.role) {
            const role = user.role;
            if (role === 'patient') navigate('/patient-dashboard');
            else if (role === 'doctor') navigate('/doctor-dashboard');
            else if (role === 'pharmacist') navigate('/pharmacy-dashboard');
            else if (role === 'delivery') navigate('/delivery-dashboard');
            else if (role === 'admin') navigate('/admin-dashboard');
            else navigate('/');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white p-4">
            <div className="max-w-md w-full bg-[#111] border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="text-red-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
                <p className="text-gray-400 mb-8">
                    You do not have the required permissions to view this page. Please contact your system administrator if you believe this is a mistake.
                </p>
                <button
                    onClick={handleGoBack}
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-full transition-colors shadow-lg"
                >
                    <ArrowLeft size={20} />
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
