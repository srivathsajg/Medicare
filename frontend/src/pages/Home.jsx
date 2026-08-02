import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user?.role) {
      switch (user.role) {
        case 'doctor': navigate('/doctor-dashboard'); break;
        case 'patient': navigate('/patient-dashboard'); break;
        case 'pharmacist': navigate('/pharmacy-dashboard'); break;
        case 'delivery': navigate('/delivery-dashboard'); break;
        case 'admin': navigate('/admin-dashboard'); break;
        default: break;
      }
    }
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
};

export default Home;
