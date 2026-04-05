import React from 'react';
import { Calendar, Users, FileText, CheckCircle, Clock } from 'lucide-react';

export const DoctorDashboard = () => {
  const stats = [
    { name: "Today's Appointments", value: '8', icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-100' },
    { name: 'Pending Requests', value: '3', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' },
    { name: 'Total Patients', value: '142', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  const schedule = [
    { id: 1, time: '09:00 AM', patient: 'Emma Thompson', type: 'Checkup', status: 'Completed' },
    { id: 2, time: '10:30 AM', patient: 'James Wilson', type: 'Follow-up', status: 'In Progress' },
    { id: 3, time: '11:15 AM', patient: 'Sarah Davis', type: 'Consultation', status: 'Waiting' },
    { id: 4, time: '02:00 PM', patient: 'Michael Brown', type: 'New Patient', status: 'Upcoming' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, Dr. Smith. Here's your schedule for today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm">
            Manage Schedule
          </button>
        </div>
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
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Today's Schedule</h2>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {schedule.map((apt) => (
                <div key={apt.id} className="flex items-center p-4 rounded-xl border border-slate-100 hover:border-sky-100 hover:shadow-md hover:shadow-sky-100/50 transition-all bg-slate-50/50">
                  <div className="w-24 text-sm font-semibold text-slate-700 border-r border-slate-200 mr-4">
                    {apt.time}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                        {apt.patient.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{apt.patient}</h3>
                        <p className="text-xs text-slate-500">{apt.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                        apt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'In Progress' ? 'bg-sky-100 text-sky-700' :
                        apt.status === 'Waiting' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                      <button className="text-slate-400 hover:text-sky-500 transition-colors">
                        <CheckCircle className="h-5 w-5" />
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Approvals</h3>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex flex-col p-4 rounded-xl border border-orange-100 bg-orange-50/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">New Appointment</h4>
                      <p className="text-xs text-slate-500">Requested by Jane Doe</p>
                    </div>
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                      Pending
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Decline
                    </button>
                    <button className="flex-1 bg-sky-500 text-white py-1.5 text-xs font-medium rounded-lg hover:bg-sky-600 transition-colors shadow-sm shadow-sky-500/20">
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Records Uploaded</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">MRI Scan Result</p>
                    <p className="text-xs text-slate-500">Patient: John Smith</p>
                  </div>
                  <span className="text-xs text-sky-500 font-medium">View</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
