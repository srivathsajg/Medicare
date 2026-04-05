import React from 'react';
import { Calendar, FileText, Activity, Clock, ChevronRight } from 'lucide-react';

export const PatientDashboard = () => {
  const stats = [
    { name: 'Upcoming Appointments', value: '2', icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-100' },
    { name: 'Medical Reports', value: '14', icon: FileText, color: 'text-green-500', bg: 'bg-green-100' },
    { name: 'Health Score', value: '92', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  const appointments = [
    { id: 1, doctor: 'Dr. Sarah Wilson', specialty: 'Cardiologist', date: 'Today, 2:30 PM', status: 'Upcoming' },
    { id: 2, doctor: 'Dr. Michael Chen', specialty: 'General Practice', date: 'Tomorrow, 10:00 AM', status: 'Confirmed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
        <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm shadow-sky-500/30">
          Book Appointment
        </button>
      </div>

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
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-sky-100 hover:shadow-md hover:shadow-sky-100/50 transition-all bg-slate-50/50">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold mr-4">
                    {apt.doctor.charAt(4)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{apt.doctor}</h3>
                    <p className="text-xs text-slate-500">{apt.specialty}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center text-sm text-slate-700 font-medium mb-1">
                    <Clock className="h-4 w-4 mr-1 text-slate-400" />
                    {apt.date}
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-700 rounded-lg">
                    {apt.status}
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
            <button className="w-full bg-white text-sky-600 py-2.5 rounded-xl font-medium hover:bg-sky-50 transition-colors">
              Chat Now
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Blood Test Results</p>
                    <p className="text-xs text-slate-500">Oct 12, 2023</p>
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
