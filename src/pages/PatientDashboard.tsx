import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Activity, Clock, ChevronRight, Plus, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  _id: string;
  doctorId: { _id: string; name: string; specialization: string };
  date: string;
  status: string;
}

interface Record {
  _id: string;
  title: string;
  createdAt: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
}

export const PatientDashboard = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({ doctorId: '', date: '', notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, recRes, docRes] = await Promise.all([
        fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/records', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users/doctors', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [aptData, recData, docData] = await Promise.all([
        aptRes.json(),
        recRes.json(),
        docRes.json(),
      ]);

      if (aptData.success) setAppointments(aptData.data);
      if (recData.success) setRecords(recData.data);
      if (docData.success) setDoctors(docData.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (data.success) {
        setShowBooking(false);
        setBookingData({ doctorId: '', date: '', notes: '' });
        fetchData(); // Refresh list
      } else {
        alert(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      alert('An error occurred while booking');
    }
  };

  const stats = [
    { name: 'Upcoming Appointments', value: appointments.filter(a => a.status === 'upcoming').length.toString(), icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-100' },
    { name: 'Medical Reports', value: records.length.toString(), icon: FileText, color: 'text-green-500', bg: 'bg-green-100' },
    { name: 'Health Score', value: '92', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  if (loading) return <div className="flex justify-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 py-10 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
        <button 
          onClick={() => setShowBooking(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm shadow-sky-500/30 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </button>
      </div>

      {showBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowBooking(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                <select 
                  required
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                  className="w-full border-slate-300 rounded-xl p-2.5 border focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>Dr. {doc.name} - {doc.specialization}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="w-full border-slate-300 rounded-xl p-2.5 border focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea 
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="w-full border-slate-300 rounded-xl p-2.5 border focus:ring-sky-500 focus:border-sky-500"
                  rows={3}
                />
              </div>
              <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} mr-4`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
            <button className="text-sm text-sky-500 font-medium hover:text-sky-600 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {appointments.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No appointments found.</p>
            ) : appointments.map((apt) => (
              <div key={apt._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-sky-100 hover:shadow-md hover:shadow-sky-100/50 transition-all bg-slate-50/50">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold mr-4">
                    {apt.doctorId?.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Dr. {apt.doctorId?.name}</h3>
                    <p className="text-xs text-slate-500">{apt.doctorId?.specialization}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center text-sm text-slate-700 font-medium mb-1">
                    <Clock className="h-4 w-4 mr-1 text-slate-400" />
                    {new Date(apt.date).toLocaleString()}
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-sky-100 text-sky-700'
                  }`}>
                    {apt.status || 'upcoming'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & AI */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-500/30">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Health Assistant</h3>
            <p className="text-sky-100 text-sm mb-4">
              Get personalized health advice and diet recommendations based on your reports.
            </p>
            <button onClick={() => navigate('/patient/ai-assistant')} className="w-full bg-white text-sky-600 py-2.5 rounded-xl font-medium hover:bg-sky-50 transition-colors">
              Chat Now
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-slate-500 text-sm text-center">No reports found.</p>
              ) : records.slice(0, 3).map((record) => (
                <div key={record._id} className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{record.title}</p>
                    <p className="text-xs text-slate-500">{new Date(record.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
