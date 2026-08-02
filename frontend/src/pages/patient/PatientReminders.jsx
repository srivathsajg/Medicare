import React, { useEffect, useState } from 'react';
import { BellRing, Clock, CheckCircle, AlertCircle, Pill, Calendar, Activity, Loader2, ChevronRight, Zap, Target, ShieldCheck, HeartPulse } from 'lucide-react';
import { fetchReminders } from '../../services/patientApi';

/* â”€â”€â”€ Type Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TYPE_MAP = {
    'Medication': { icon: Pill, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Appointment': { icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Lab Test': { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
};

const PatientReminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [completed, setCompleted] = useState(new Set());
    const [currentTime, setCurrentTime] = useState(new Date());

    // Persist completed protocols across refreshes
    useEffect(() => {
        const key = `medicare_reminders_${new Date().toDateString()}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setCompleted(new Set(JSON.parse(saved)));
            } catch (e) {
                console.error("Failed to hydrate reminders:", e);
            }
        }
    }, []);

    useEffect(() => {
        const key = `medicare_reminders_${new Date().toDateString()}`;
        if (completed.size > 0) {
            localStorage.setItem(key, JSON.stringify([...completed]));
        }
    }, [completed]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchReminders();
                if (res?.success) setReminders(res.data);
                else setError('Failed to synchronize protocol.');
            } catch (err) {
                console.error('[PatientReminders] error:', err);
                setError('Clinical sync offline.');
            } finally {
                setLoading(false);
            }
        };
        load();
        
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const toggleComplete = (id) => {
        const next = new Set(completed);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCompleted(next);
    };

    const getTimeStatus = (timeStr) => {
        if (!timeStr || timeStr === 'Fast Required') return { label: timeStr || 'Active', state: 'normal' };
        try {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);
            const diffMins = Math.round((target - currentTime) / 60000);
            if (diffMins < 0) return { label: 'Due now', state: 'urgent' };
            if (diffMins < 60) return { label: `In ${diffMins} min`, state: diffMins < 15 ? 'urgent' : 'warning' };
            return { label: `at ${timeStr}`, state: 'normal' };
        } catch (e) { return { label: timeStr, state: 'normal' }; }
    };

    const activeCompleted = reminders.filter(r => completed.has(r.id));
    const completionRate = reminders.length > 0 ? Math.round((activeCompleted.length / reminders.length) * 100) : 0;

    if (loading) return <PageSpinner />;

    return (
        <div className="space-y-6 sm:space-y-12 animate-fadein pb-20 px-2 lg:px-6">
            {/* â”€â”€â”€ Hero Dashboard Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="relative overflow-hidden bg-[#0f1115] border border-white/[0.08] rounded-[32px] sm:rounded-[48px] p-6 sm:p-12 shadow-2xl">
                {/* Visual Depth Elements */}
                <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-600/10 blur-[100px] sm:blur-[150px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8 sm:gap-12">
                    <div className="max-w-2xl text-center xl:text-left">
                        <div className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl mb-4 sm:mb-8 group cursor-default">
                           <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${completionRate === 100 ? 'bg-emerald-400' : 'bg-purple-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${completionRate === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}></span>
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">MediCare Intelligence v2.0</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight mb-4 sm:mb-6">
                            Smart <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Compliance</span> Center
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-lg font-medium leading-relaxed max-w-xl mx-auto xl:mx-0">
                            Your personalized clinical timeline is currently synchronized with the host hospital network. Adherence is tracked in real-time.
                        </p>
                    </div>

                    {/* Progress Matrix */}
                    <div className="flex flex-col items-center gap-4 sm:gap-6 shrink-0 w-full sm:w-auto">
                        <div className="relative w-40 h-48 sm:w-56 sm:h-56">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                                <circle 
                                    cx="100" cy="100" r="80" 
                                    stroke="rgba(255,255,255,0.03)" 
                                    strokeWidth="12" 
                                    fill="transparent" 
                                />
                                <circle 
                                    cx="100" cy="100" r="80" 
                                    stroke="url(#progressGradient)" 
                                    strokeWidth="12" 
                                    fill="transparent" 
                                    strokeDasharray="502.65" 
                                    strokeDashoffset={502.65 - (502.65 * completionRate) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl sm:text-5xl font-black text-white tracking-tighter">{completionRate}%</span>
                                <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">COMPLIANCE</span>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                            <MetricBlock icon={Target} label="Pending" value={reminders.length - activeCompleted.length} />
                            <MetricBlock icon={ShieldCheck} label="Secured" value={activeCompleted.length} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Clinical Timeline ────────────────────────────────────────── */}
            <div className="relative">
                <div className="absolute left-[23px] sm:left-[39px] top-4 bottom-4 w-[1px] sm:w-[2px] bg-gradient-to-b from-purple-500/20 via-white/5 to-transparent hidden xs:block" />
                
                <div className="grid grid-cols-1 gap-4 sm:gap-8">
                    {reminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 sm:py-40 rounded-3xl sm:rounded-[48px] bg-[#0a0a0a]/50 border border-dashed border-white/5 backdrop-blur-3xl">
                            <HeartPulse size={48} sm:size={64} className="text-gray-800 mb-4 sm:mb-6 opacity-30 animate-pulse" />
                            <p className="text-gray-600 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs text-center px-4">Timeline Data Quiescent</p>
                        </div>
                    ) : (
                        reminders.map((r, idx) => {
                            const config = TYPE_MAP[r.type] || TYPE_MAP['Medication'];
                            const timeStatus = getTimeStatus(r.time);
                            const isDone = completed.has(r.id);

                            return (                                <div key={r.id} className="relative group pl-0 xs:pl-16 sm:pl-24 transition-all duration-500 ease-out animate-pop-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                    {/* Timeline Node */}
                                    <div className={`absolute left-[18px] sm:left-[32px] top-8 sm:top-10 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 bg-[#0a0a0a] z-10 hidden xs:block transition-colors duration-500 ${isDone ? 'border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'border-purple-500/40'}`} />
                                    
                                    <div className={`relative bg-[#0f1115] border rounded-2xl sm:rounded-[40px] transition-all duration-700 overflow-hidden ${isDone ? 'border-white/5 opacity-50' : 'border-white/[0.08] hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/5'}`}>
                                        <div className="p-5 sm:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
                                            <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto">
                                                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-[28px] flex items-center justify-center shrink-0 border transition-all duration-700 ${isDone ? 'bg-gray-500/5 border-gray-500/10' : `${config.bg} ${config.border} group-hover:bg-purple-600/10 shadow-xl`}`}>
                                                    <config.icon size={24} sm:size={32} className={isDone ? 'text-gray-500' : config.color} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
                                                        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border ${isDone ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : `${config.bg} ${config.color} ${config.border}`}`}>
                                                            {r.type}
                                                        </span>
                                                        {r.priority === 'Urgent' && !isDone && (
                                                            <span className="bg-red-500/10 text-red-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-red-500/20 animate-pulse">Critical</span>
                                                        )}
                                                    </div>
                                                    <h3 className={`text-lg sm:text-3xl font-black tracking-tight transition-colors duration-500 truncate ${isDone ? 'text-gray-600' : 'text-white'}`}>
                                                        {r.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-2 sm:mt-4 text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-white/[0.02] w-fit px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/5">
                                                        <Zap size={12} sm:size={14} className="text-yellow-500/70" /> 
                                                        <span className="truncate max-w-[150px] sm:max-w-none">{r.instructions}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-left md:text-right">
                                                    <p className={`text-sm sm:text-lg font-black tracking-tighter ${timeStatus.state === 'urgent' && !isDone ? 'text-orange-400' : 'text-gray-400'}`}>
                                                        {timeStatus.label}
                                                    </p>
                                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mt-0.5 sm:mt-1">Timeline Node</p>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => toggleComplete(r.id)}
                                                    className={`h-12 sm:h-16 px-6 sm:px-10 rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-widest sm:tracking-[0.25em] transition-all duration-500 active:scale-90 flex items-center justify-center gap-2 sm:gap-3 group/btn ${isDone ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/[0.03] text-white border border-white/[0.08] hover:bg-purple-600 hover:border-purple-500 shadow-xl'}`}
                                                >
                                                    {isDone ? <><CheckCircle size={16} sm:size={20} /> <span className="hidden xs:inline">Verified</span></> : <><Target size={16} sm:size={18} /> <span className="hidden xs:inline">Mark Taken</span><span className="xs:hidden">Take</span></>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricBlock = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.03] border border-white/[0.08] px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-xl flex-1 sm:flex-none">
        <Icon size={14} sm:size={16} className="text-gray-400 shrink-0" />
        <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest truncate">{label}</span>
            <span className="text-xs sm:text-sm font-black text-white">{value}</span>
        </div>
    </div>
);

const PageSpinner = () => (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
        <div className="relative">
            {/* Outer Pulsing Rings */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-[2000ms]" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse duration-[1500ms]" />
            
            {/* Core Icon Container */}
            <div className="relative w-24 h-24 rounded-[32px] bg-[#0f1115] border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                <Activity size={48} className="text-emerald-400 animate-pulse drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            </div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Syncing Clinical Data</p>
            <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-emerald-500/40 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
            </div>
        </div>
    </div>
);

export default PatientReminders;
