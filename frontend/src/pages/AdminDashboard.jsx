import React from 'react';
import { useAuth } from '../context/AuthContext';
import SystemAdminDashboard from './SystemAdminDashboard';
import HospitalAdminDashboard from './HospitalAdminDashboard';

const AdminDashboard = () => {
    const { user } = useAuth();
    
    const isSuperAdmin = user?.role === 'admin' && !user?.hospitalName;

    return isSuperAdmin ? <SystemAdminDashboard /> : <HospitalAdminDashboard />;
};

export default AdminDashboard;
