import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string; email: string };
  date: string;
  status: string;
  notes?: string;
}

export const DoctorDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (err) {
      setError('An error occurred while fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('An error occurred while updating status');
    }
  };

  const pendingAppointments = appointments.filter(a => !a.status || a.status === 'upcoming' || a.status === 'pending');
  const todayAppointments = appointments.filter(a => a.status === 'confirmed');

  const stats = [
    { name: "Confirmed Appointments", value: todayAppointments.length.toString(), icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-100' },
    { name: 'Pending Requests', value: pendingAppointments.length.toString(), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' },
    { name: 'Total Patients', value: new Set(appointments.map(a => a.patientId?._id)).size.toString(), icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  if (loading) return <div className="flex justify-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 py-10 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, Dr. {user?.name}. Here's your schedule.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/doctor/messages')} className="bg-sky-50 text-sky-600 px-4 py-2 rounded-xl font-medium hover:bg-sky-100 transition-colors shadow-sm flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/50 flex items-center hover:bg-white/80 transition-colors">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} mr-4 border border-white/50 shadow-inner`}>
              <stat.icon className={`h-6 w-6 ${stat.color} drop-shadow-sm`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40">
            <h2 className="text-lg font-bold text-slate-900">Confirmed Appointments</h2>
            <div className="flex items-center space-x-2 text-sm font-medium text-slate-500 bg-white/50 px-3 py-1.5 rounded-lg border border-white/60">
              <Calendar className="h-4 w-4 text-sky-500" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-4">
              {todayAppointments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No confirmed appointments today.</p>
              ) : todayAppointments.map((apt) => (
                <div key={apt._id} className="flex items-center p-4 rounded-xl border border-white/60 hover:border-sky-200 hover:shadow-md transition-all bg-white/50 backdrop-blur-sm group">
                  <div className="w-32 text-sm font-bold text-slate-700 border-r border-slate-200 mr-4 flex flex-col justify-center">
                    <span className="text-sky-600">{new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-xs font-medium text-slate-400">{new Date(apt.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-white flex items-center justify-center text-indigo-600 font-bold mr-3 shadow-sm group-hover:scale-105 transition-transform">
                        {apt.patientId?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{apt.patientId?.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{apt.notes || 'No notes provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-green-100 text-green-700 border border-green-200">
                        {apt.status}
                      </span>
                      <button 
                        onClick={() => updateStatus(apt._id, 'cancelled')}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                        title="Cancel Appointment"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Patients */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 text-orange-500 mr-2" />
              Pending Approvals
            </h3>
            <div className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No pending requests.</p>
              ) : pendingAppointments.map((apt) => (
                <div key={apt._id} className="flex flex-col p-4 rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-amber-50/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center">
                        <Users className="w-3.5 h-3.5 text-orange-500 mr-1.5" />
                        {apt.patientId?.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 mt-1.5 bg-white/60 px-2 py-1 rounded-md border border-white/40 inline-block">
                        {new Date(apt.date).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-1 rounded-md">
                      {apt.status || 'pending'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => updateStatus(apt._id, 'cancelled')}
                      className="flex-1 bg-white/80 border border-slate-200 text-slate-700 py-2 text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => updateStatus(apt._id, 'confirmed')}
                      className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white py-2 text-xs font-bold rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Records Uploaded</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-3 rounded-xl bg-white/40 hover:bg-white/80 transition-colors cursor-pointer border border-white/60 shadow-sm group">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center mr-3 border border-white shadow-inner group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">MRI Scan Result</p>
                    <p className="text-xs text-slate-500 font-medium">Patient: John Smith</p>
                  </div>
                  <span className="text-xs text-sky-600 font-bold bg-sky-50 px-2 py-1 rounded-lg border border-sky-100 group-hover:bg-sky-100 transition-colors">View</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};