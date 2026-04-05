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
        {/* User Management */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Recent Doctor Registrations</h2>
            <button className="text-sm text-sky-500 font-medium hover:text-sky-600">
              View All
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {[
                    { id: 1, name: 'Dr. Emily Chen', specialty: 'Neurology', status: 'Pending Verification' },
                    { id: 2, name: 'Dr. Robert Taylor', specialty: 'Cardiology', status: 'Approved' },
                    { id: 3, name: 'Dr. Sarah Williams', specialty: 'Pediatrics', status: 'Pending Verification' },
                  ].map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                            {doc.name.charAt(4)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                            <div className="text-sm text-slate-500">doc@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {doc.specialty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {doc.status !== 'Approved' && (
                          <button className="text-sky-600 hover:text-sky-900 mr-4">Approve</button>
                        )}
                        <button className="text-slate-600 hover:text-slate-900">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Logs & Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              System Alerts
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">High API Latency</h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>Blockchain verification endpoint is experiencing delays.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-sky-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-sky-800">System Update Available</h3>
                    <div className="mt-2 text-sm text-sky-700">
                      <p>v2.4.1 is ready to be deployed. Schedule maintenance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
