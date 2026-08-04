import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, FileText, Hospital, User, MapPin, Clock,
    CalendarClock, Eye, Search, ChevronRight, XCircle,
    Loader2, AlertTriangle, ListChecks, AlertOctagon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Loader from '../../components/ui/Loader';
import {
    IncidentBadge, SeverityBadge, StatusBadge,
    formatDateTime, getIncidentLabel,
} from '../../components/emergency/EmergencyBadges';
import { getMyEmergencyCases, cancelEmergencyCase } from '../../services/emergencyApi';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const canBeCancelled = (c) => c && c.status === 'REPORTED';

const MyEmergencies = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [cancellingId, setCancellingId] = useState(null);

    const loadCases = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getMyEmergencyCases();
            if (!res.success) {
                setError(res.message || 'Failed to load emergency cases');
                setCases([]);
                return;
            }
            setCases(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            const msg =
                (err && err.response && err.response.status === 401)
                    ? 'Your session expired. Please log in again.'
                    : (err && err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    'Failed to load emergency cases.';
            setError(msg);
            setCases([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCases();
    }, [loadCases]);

    useEffect(() => {
        if (!user?.id) return undefined;

        const onCreated = (payload) => {
            if (!payload) return;
            const pid = payload.patientId ? String(payload.patientId) : null;
            const uid = String(user.id);
            if (pid === uid) {
                loadCases();
            }
        };

        const onUpdated = (payload) => {
            if (!payload) return;
            const pid = payload.patientId ? String(payload.patientId) : null;
            const uid = String(user.id);
            if (pid === uid) {
                loadCases();
            }
        };

        socket.on('emergency-created', onCreated);
        socket.on('emergency-status-updated', onUpdated);
        socket.on('emergency-updated', onUpdated);

        return () => {
            socket.off('emergency-created', onCreated);
            socket.off('emergency-status-updated', onUpdated);
            socket.off('emergency-updated', onUpdated);
        };
    }, [user?.id, loadCases]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return cases.filter((c) => {
            if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
            if (severityFilter !== 'ALL' && c.severity !== severityFilter) return false;
            if (!q) return true;
            const hay = [
                getIncidentLabel(c.incidentType),
                c.description,
                c.assignedHospital,
                c.notes,
                c.status,
                c.severity,
                typeof c.assignedDoctor === 'object' ? c.assignedDoctor?.name : '',
                c.location?.address,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [cases, query, statusFilter, severityFilter]);

    const handleCancel = async (c) => {
        if (!c) return;
        const reasonWindow = window.prompt('Optional: provide a reason for cancelling this emergency case.');
        if (reasonWindow === null) return; // user cancelled prompt
        setCancellingId(c._id);
        try {
            const res = await cancelEmergencyCase(c._id, reasonWindow || undefined);
            if (res.success) {
                setCases((prev) =>
                    prev.map((pc) => (pc._id === c._id ? { ...pc, ...res.data, status: 'CANCELLED', cancelledReason: reasonWindow || pc.cancelledReason } : pc))
                );
                window.alert('Emergency case cancelled successfully.');
            } else {
                window.alert(res.message || 'Failed to cancel case.');
            }
        } catch (err) {
            const msg =
                (err && err.response && err.response.data && err.response.data.message) ||
                err.message ||
                'Failed to cancel case.';
            window.alert(msg);
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton height={34} width={260} />
                <div className="flex flex-wrap gap-3">
                    <Skeleton height={40} className="flex-1" />
                    <Skeleton height={40} width={160} />
                    <Skeleton height={40} width={160} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-3xl p-5 space-y-3">
                            <Skeleton height={22} width={180} />
                            <Skeleton height={16} width={220} />
                            <Skeleton height={40} className="mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        const isAuth = /session|log in|unauthorized|401/i.test(error);
        return (
            <div className="bg-[#111318] border border-red-500/20 rounded-3xl p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                    <AlertCircle size={26} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Could not load emergencies</h3>
                <p className="mt-2 text-sm text-gray-400">{error}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={loadCases}
                        className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                    >
                        Try again
                    </button>
                    {isAuth && (
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors"
                        >
                            Go to Login
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        My Emergency Cases
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <ListChecks size={14} className="text-emerald-400" />
                        Track the status of emergency cases you've created or are listed as the patient.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/patient-dashboard/emergency')}
                    className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-black uppercase tracking-[0.1em] shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all"
                >
                    <AlertOctagon size={16} />
                    New Emergency
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 bg-[#111318] border border-white/[0.06] rounded-3xl p-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search cases by type, status, hospital, description..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05]"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-emerald-500/40"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="REPORTED">Reported</option>
                        <option value="AMBULANCE_REQUESTED">Ambulance Requested</option>
                        <option value="AMBULANCE_ASSIGNED">Ambulance Assigned</option>
                        <option value="AMBULANCE_ARRIVED">Ambulance On Scene</option>
                        <option value="PATIENT_IDENTIFIED">Patient Identified</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="HOSPITAL_PREPARED">Hospital Prepared</option>
                        <option value="ARRIVED_AT_HOSPITAL">Arrived at Hospital</option>
                        <option value="UNDER_TREATMENT">Under Treatment</option>
                        <option value="CLOSED">Closed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-emerald-500/40"
                    >
                        <option value="ALL">All Severities</option>
                        <option value="LOW">Low</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-[#111318] border border-white/[0.06] rounded-3xl p-10 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-gray-500 flex items-center justify-center">
                        <FileText size={26} />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-white tracking-wide">
                        {cases.length === 0 ? 'No emergency cases yet' : 'No cases match your filters'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                        {cases.length === 0
                            ? 'When you submit an emergency booking, the case will appear here with a real-time status timeline.'
                            : 'Try adjusting your search or filters to see more results.'}
                    </p>
                    {cases.length === 0 && (
                        <button
                            onClick={() => navigate('/patient-dashboard/emergency')}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-black uppercase tracking-[0.1em] transition-colors"
                        >
                            <AlertTriangle size={16} />
                            Open Emergency Booking
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map((c) => {
                        const doctorName =
                            typeof c.assignedDoctor === 'object'
                                ? c.assignedDoctor?.name
                                : null;
                        const doctorSpec =
                            typeof c.assignedDoctor === 'object'
                                ? c.assignedDoctor?.specialization
                                : null;
                        const address = c.location?.address;
                        const cancellable = canBeCancelled(c);
                        return (
                            <div
                                key={c._id}
                                className={`relative group bg-[#111318] border rounded-3xl p-6 flex flex-col gap-4 hover:border-white/[0.12] transition-all ${
                                    c.status === 'CANCELLED'
                                        ? 'border-gray-500/20 opacity-80'
                                        : c.status === 'CLOSED'
                                            ? 'border-blue-500/10'
                                            : 'border-white/[0.06]'
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <IncidentBadge type={c.incidentType} />
                                        <SeverityBadge severity={c.severity} />
                                    </div>
                                    <StatusBadge status={c.status} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-white tracking-tight leading-tight">
                                        {getIncidentLabel(c.incidentType)}
                                    </h3>
                                    {c.description ? (
                                        <p className="text-sm text-gray-400 line-clamp-3 whitespace-pre-wrap break-words">
                                            {c.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No description provided.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    {c.assignedHospital && (
                                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <Hospital size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-gray-500 font-bold uppercase tracking-[0.12em] text-[10px]">
                                                    Hospital
                                                </p>
                                                <p className="text-gray-200 font-semibold truncate">{c.assignedHospital}</p>
                                            </div>
                                        </div>
                                    )}
                                    {doctorName && (
                                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <User size={13} className="text-blue-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-gray-500 font-bold uppercase tracking-[0.12em] text-[10px]">
                                                    Doctor
                                                </p>
                                                <p className="text-gray-200 font-semibold truncate">
                                                    Dr. {doctorName}
                                                    {doctorSpec ? <span className="text-gray-500 font-medium"> · {doctorSpec}</span> : null}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {address && (
                                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] sm:col-span-2">
                                            <MapPin size={13} className="text-orange-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-gray-500 font-bold uppercase tracking-[0.12em] text-[10px]">
                                                    Location
                                                </p>
                                                <p className="text-gray-200 font-medium truncate">{address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarClock size={12} />
                                            Reported: <span className="text-gray-300 font-medium">{formatDateTime(c.createdAt)}</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock size={12} />
                                            Updated: <span className="text-gray-300 font-medium">{formatDateTime(c.updatedAt)}</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {cancellable && (
                                            <button
                                                disabled={!!cancellingId}
                                                onClick={() => handleCancel(c)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                {cancellingId === c._id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <XCircle size={12} />
                                                )}
                                                Cancel
                                            </button>
                                        )}
                                        <Link
                                            to={`/patient-dashboard/emergencies/${encodeURIComponent(c._id)}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-xs font-bold transition-colors"
                                        >
                                            <Eye size={12} />
                                            View Details
                                            <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyEmergencies;
