import React, { useState } from 'react';
import { Menu, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RegistrationModal from './RegistrationModal';
import LoginModal from './LoginModal';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleEmergencyClick = () => {
    if (token && user?.role === 'patient') {
      navigate('/patient-dashboard', { state: { openEmergency: true } });
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                <div className="bg-green-500 p-1.5 rounded-lg shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-bold text-2xl text-gray-900 tracking-tight">MediCare</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Home</a>
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Features</a>
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium transition-colors">How it Works</a>
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Testimonials</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleEmergencyClick}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] group"
              >
                <AlertCircle size={18} className="group-hover:scale-110 transition-transform animate-pulse" />
                <span>EMERGENCY</span>
              </button>
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="px-6 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-full hover:border-green-500 hover:text-green-600 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Login
              </button>
              <button 
                onClick={() => setIsRegisterOpen(true)}
                className="px-6 py-2.5 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Register
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 absolute w-full shadow-lg">
            <div className="px-4 space-y-3">
              <a href="#" className="block text-gray-600 hover:text-green-600 font-medium py-2">Home</a>
              <a href="#" className="block text-gray-600 hover:text-green-600 font-medium py-2">Features</a>
              <a href="#" className="block text-gray-600 hover:text-green-600 font-medium py-2">How it Works</a>
              <a href="#" className="block text-gray-600 hover:text-green-600 font-medium py-2">Testimonials</a>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  handleEmergencyClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 shadow-md"
              >
                <AlertCircle size={18} className="animate-pulse" />
                EMERGENCY
              </button>
              <div className="pt-4 flex flex-col space-y-3">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="w-full px-5 py-3 text-gray-700 font-medium border border-gray-300 rounded-full hover:border-green-500 hover:text-green-600"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  className="w-full px-5 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 shadow-md"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <RegistrationModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onSwitchToLogin={() => setIsLoginOpen(true)}
      />

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onRegisterClick={() => setIsRegisterOpen(true)}
      />
    </>
  );
};

export default Navbar;
