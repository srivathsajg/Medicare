import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Users, Calendar, Activity, Settings, 
  Search, Bell, User, ChevronDown, Zap, Shield, Filter 
} from 'lucide-react';
import UniversalSearchBar from '../components/ui/UniversalSearchBar';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 flex flex-col bg-[#0f1110]">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-green-500 p-1.5 rounded-lg shadow-sm">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">MediCare</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Doctor Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={LayoutGrid} label="Dashboard" active />
          <NavItem icon={Users} label="Patients" />
          <NavItem icon={Calendar} label="Schedule" badge="4" />
          <NavItem icon={Activity} label="Lab Results" badge="2" />
        </nav>

        <div className="p-4 mt-auto">
          <NavItem icon={Settings} label="Settings" onClick={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0a0a0a]">
          <div className="flex items-center text-gray-400 text-sm">
            <span className="flex items-center gap-2">
              <Shield size={14} className="text-green-500" />
              Encrypted Connection
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-bold text-white">{user?.name || 'Dr. Srivathsa JG'}</p>
                <p className="text-xs text-gray-500">ID: {user?.id?.substring(0, 10) || '0x881D711B...'}...</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                <User size={20} className="text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            
            {/* Left Panel - Clinical Overview */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Live Clinical Data</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">Clinical Overview</h2>
                <p className="text-gray-400">Managing active patient queue & validating blockchain records.</p>
              </div>

              {/* Search Bar */}
              <div className="flex gap-4">
                <UniversalSearchBar />
                <button className="w-12 h-12 rounded-full bg-[#111] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
                  <Filter size={20} />
                </button>
              </div>

              {/* Priority Patient Queue */}
              <div className="flex-1 bg-[#111] border border-gray-800 rounded-2xl p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Activity size={18} className="text-green-500" />
                  <h3 className="font-bold text-lg">Priority Patient Queue</h3>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <Users size={32} className="text-gray-500" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-300">No Active Consultation</h4>
                  <p className="text-gray-500 mt-2">Select a patient from the queue to start a session.</p>
                </div>
              </div>
            </div>

            {/* Right Panel - Ledger Activity */}
            <div className="lg:col-span-1 bg-[#0f1110] border-l border-gray-800 -my-8 -mr-8 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="bg-green-900/20 p-1.5 rounded">
                    <Zap size={16} className="text-green-500" />
                  </div>
                  <h3 className="font-bold">Ledger Activity</h3>
                </div>
                <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded uppercase">Live</span>
              </div>

              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
                No recent activity.
              </div>

              <button className="mt-auto w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-lg transition-colors">
                <Zap size={20} fill="currentColor" />
                ACTIONS
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
      active 
        ? 'bg-green-500 text-black font-bold shadow-lg shadow-green-900/20' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        active ? 'bg-black/20 text-black' : 'bg-red-500 text-white'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

export default Dashboard;
