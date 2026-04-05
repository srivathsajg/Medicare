import React from 'react';
import { Users, Activity, Shield, Settings, AlertTriangle } from 'lucide-react';

export const AdminDashboard = () => {
  const stats = [
    { name: 'Total Users', value: '2,845', icon: Users, color: 'text-sky-500', bg: 'bg-sky-100' },
    { name: 'Active Doctors', value: '142', icon: Activity, color: 'text-green-500', bg: 'bg-green-100' },
    { name: 'System Status', value: 'Healthy', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">System overview and user management.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Doctors Awaiting Approval */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40">
            <h2 className="text-lg font-bold text-slate-900">Doctor Approvals</h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-200">
              3 Pending
            </span>
          </div>
          <div className="p-6 flex-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-white flex items-center justify-center text-indigo-600 font-bold mr-4 shadow-sm group-hover:scale-105 transition-transform">
                    D
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dr. Robert Wilson</h3>
                    <p className="text-xs text-slate-500 font-medium">Neurologist • License: #MD{1000 + i}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                    <XCircle className="h-5 w-5" />
                  </button>
                  <button className="text-slate-400 hover:text-green-500 transition-colors p-2 hover:bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Logs */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40">
            <h2 className="text-lg font-bold text-slate-900">System Activity</h2>
          </div>
          <div className="p-6 flex-1 space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-white/60 shadow-sm">
              <div className="mt-1 bg-red-100 p-2 rounded-lg border border-red-200">
                <AlertOctagon className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Emergency Protocol Activated</p>
                <p className="text-xs text-slate-500 font-medium">Patient #4928 triggered SOS</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">2 mins ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-white/60 shadow-sm">
              <div className="mt-1 bg-green-100 p-2 rounded-lg border border-green-200">
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Blockchain Sync Complete</p>
                <p className="text-xs text-slate-500 font-medium">45 new medical records verified and hashed.</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">15 mins ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-white/60 shadow-sm">
              <div className="mt-1 bg-sky-100 p-2 rounded-lg border border-sky-200">
                <Activity className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">System Backup</p>
                <p className="text-xs text-slate-500 font-medium">Automated database backup completed successfully.</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
