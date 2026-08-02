import React, { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose, onRegisterClick }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        identifier: formData.identifier,
        password: formData.password
      });

      if (response.data.success) {
        login(response.data.user, response.data.token);
        onClose();
      }
    } catch (err) {
      console.error("Login failed", err);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-3xl shadow-2xl overflow-hidden border border-gray-800 animate-in fade-in zoom-in duration-300">

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10">
          <X size={24} />
        </button>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white mb-2">Login to MediCare</h2>
          <p className="text-gray-400 text-sm mb-8">Access your secure healthcare dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email or Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="e.g. sarah@example.com"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 pl-11 pr-11 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-full transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  onClose();
                  onRegisterClick();
                }}
                className="text-green-500 hover:text-green-400 font-medium hover:underline focus:outline-none"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
