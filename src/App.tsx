import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MedicalRecords } from './pages/MedicalRecords';
import { Messages } from './pages/Messages';
import { DietPlan } from './pages/DietPlan';
import { AIAssistant } from './pages/AIAssistant';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route 
          path="/patient/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/patient/records" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicalRecords />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient/messages" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Messages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient/diet" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DietPlan />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient/ai-assistant" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AIAssistant />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/messages" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <Messages />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
