import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeft, Hospital, User, MapPin, CalendarClock,
    Clock, Loader2, AlertTriangle, FileText, XCircle,
    AlertCircle, AlertOctagon, Phone, CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/ui/Loader';
import EmergencyTimeline from '../../components/emergency/EmergencyTimeline';
import {
    IncidentBadge, SeverityBadge, StatusBadge,
    formatDateTime, getIncidentLabel,
} from '../../components/emergency/EmergencyBadges';
import {
    getEmergencyCaseById,
    cancelEmergencyCase,
} from '../../services/emergencyApi';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const canBeCancelled = (c) => c && c.status === 'REPORTED';

const InfoRow = ({ icon: Icon, iconClass, title, children }) => (
    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconClass || 'bg-white/[0.04] text-gray-400'}`}>
            <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{title}</p>
            <div className="mt-1 text-sm text-gray-200 font-medium break-words">{children}</div>
        </div>
    </div>
);

const EmergencyCaseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [emergencyCase, setEmergencyCase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const loadCase = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await getEmergencyCaseById(id);
            if (!res.success) {
                setError(res.message || 'Failed to load emergency case.');
                setEmergencyCase(null);
                return;
            }
            setEmergencyCase(res.data || null);
        } catch (err) {
            const status = err && err.response && err.response.status;
            if (status === 403 || status === 401) {
                setError('You are not authorized to view this emergency case.');
            } else if (status === 404) {
                setError('Emergency case not found.');
            } else {
                setError(
                    (err && err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    'Failed to load emergency case.'
                );
            }
            setEmergencyCase(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadCase();
    }, [loadCase]);

    useEffect(() => {
        if (!user?.id || !id) return undefined;

        const matches = (payload) => {
            if (!payload) return false;
            if (payload.emergencyCaseId && String(payload.emergencyCaseId) === String(id)) return true;
            return false;
        };

        const onStatusUpdated = (payload) => {
            if (matches(payload)) loadCase();
        };
        const onUpdated = (payload) => {
            if (matches(payload)) loadCase();
        };
        const onCreated = (payload) => {
            if (matches(payload)) loadCase();
        };

        socket.on('emergency-status-updated', onStatusUpdated);
        socket.on('emergency-updated', onUpdated);
        socket.on('emergency-created', onCreated);

        return () => {
            socket.off('emergency-status-updated', onStatusUpdated);
            socket.off('emergency-updated', onUpdated);
            socket.off('emergency-created', onCreated);
        };
    }, [user?.id, id, loadCase]);

    const performCancel = async () => {
        if (!emergencyCase) return;
        setCancelling(true);
        try {
            const res = await cancelEmergencyCase(emergencyCase._id, cancelReason || undefined);
            if (res.success) {
                setConfirmCancelOpen(false);
                setCancelReason('');
                await loadCase();
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
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh]">
                <Loader message="Loading emergency case details" />
            </div>
        );
    }

    if (error) {
        const isAuth = /not authorized|session|unauthorized|401|403/i.test(error);
        return (
            <div className="space-y-5">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="bg-[#111318] border border-red-500/20 rounded-3xl p-8 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                        <AlertCircle size={26} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">Could not load this case</h3>
                    <p className="mt-2 text-sm text-gray-400">{error}</p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={loadCase}
                            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                        >
                            Try again
                        </button>
                        {isAuth ? (
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors"
                            >
                                Go to Login
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/patient-dashboard/emergencies')}
                                className="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors"
                            >
                                Back to My Emergencies
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!emergencyCase) {
        return null;
    }

    const c = emergencyCase;
    const doctorName = typeof c.assignedDoctor === 'object' ? c.assignedDoctor?.name : null;
    const doctorSpec = typeof c.assignedDoctor === 'object' ? c.assignedDoctor?.specialization : null;
    const doctorHospital = typeof c.assignedDoctor === 'object' ? c.assignedDoctor?.hospitalName : null;
    const linkedApt = c.linkedAppointmentId;
    const aptStatus = linkedApt && typeof linkedApt === 'object' ? linkedApt.status : null;
    const aptDate = linkedApt && typeof linkedApt === 'object' ? linkedApt.date : null;
    const aptTime = linkedApt && typeof linkedApt === 'object' ? linkedApt.time : null;
    const address = c.location?.address;
    const hasCoords =
        typeof c.location?.latitude === 'number' && typeof c.location?.longitude === 'number';
    const cancellable = canBeCancelled(c);
    const isCancelled = c.status === 'CANCELLED';
    const isClosed = c.status === 'CLOSED';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/patient-dashboard/emergencies')}
                        className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-300 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Emergency Case
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Reported {formatDateTime(c.createdAt) || ''}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {cancellable && (
                        <button
                            onClick={() => setConfirmCancelOpen(true)}
                            disabled={cancelling}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Cancel Emergency
                        </button>
                    )}
                    <Link
                        to="/patient-dashboard/emergencies"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors"
                    >
                        All Cases
                    </Link>
                </div>
            </div>

            <div className={`rounded-3xl border p-6 sm:p-8 ${isCancelled ? 'bg-gray-500/[0.03] border-gray-500/20' : isClosed ? 'bg-blue-500/[0.03] border-blue-500/15' : 'bg-[#111318] border-white/[0.06]'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <IncidentBadge type={c.incidentType} />
                        <SeverityBadge severity={c.severity} />
                        <StatusBadge status={c.status} />
                    </div>
                    <div className="text-right text-[11px] text-gray-500 flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarClock size={12} />
                            Reported: {formatDateTime(c.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={12} />
                            Last updated: {formatDateTime(c.updatedAt)}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-xl font-black text-white tracking-tight">
                        {getIncidentLabel(c.incidentType)}
                    </h3>
                    {c.description ? (
                        <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                            {c.description}
                        </p>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500 italic">No description provided.</p>
                    )}
                    {c.notes && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                                Clinical Notes
                            </p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                                {c.notes}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {c.assignedHospital && (
                        <InfoRow icon={Hospital} iconClass="bg-emerald-500/10 text-emerald-400" title="Hospital">
                            {c.assignedHospital}
                            {doctorHospital && doctorHospital !== c.assignedHospital && (
                                <span className="block text-xs text-gray-500 mt-0.5">
                                    (Doctor's primary: {doctorHospital})
                                </span>
                            )}
                        </InfoRow>
                    )}
                    {doctorName && (
                        <InfoRow icon={User} iconClass="bg-blue-500/10 text-blue-400" title="Assigned Doctor">
                            Dr. {doctorName}
                            {doctorSpec && <span className="text-gray-500"> · {doctorSpec}</span>}
                        </InfoRow>
                    )}
                    {address && (
                        <InfoRow
                            icon={MapPin}
                            iconClass="bg-orange-500/10 text-orange-400"
                            title="Incident Location"
                        >
                            <div className="space-y-1">
                                <span>{address}</span>
                                {hasCoords && (
                                    <span className="block text-[11px] text-gray-500">
                                        Lat {Number(c.location.latitude).toFixed(6)}, Lng {Number(c.location.longitude).toFixed(6)}
                                    </span>
                                )}
                            </div>
                        </InfoRow>
                    )}
                    {linkedApt && (
                        <InfoRow icon={FileText} iconClass="bg-indigo-500/10 text-indigo-400" title="Linked Appointment">
                            <div className="space-y-1">
                                <span>
                                    {aptDate ? `${aptDate}` : ''}
                                    {aptTime ? ` at ${aptTime}` : ''}
                                </span>
                                <span className="block text-[11px] text-gray-500">
                                    Status: <span className="capitalize text-gray-300">{aptStatus || '—'}</span>
                                </span>
                            </div>
                        </InfoRow>
                    )}
                    {!c.assignedHospital && !doctorName && !address && !linkedApt && (
                        <div className="md:col-span-2 p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] text-xs text-gray-500 italic">
                            Additional details such as hospital, assigned doctor, and incident location will appear here as they become available.
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-[#111318] border border-white/[0.06] rounded-3xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-black text-white tracking-tight">
                            Emergency Timeline
                        </h3>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Status: {c.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <EmergencyTimeline
                        statusTimestamps={c.statusTimestamps}
                        currentStatus={c.status}
                        cancelledReason={c.cancelledReason}
                    />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111318] border border-white/[0.06] rounded-3xl p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.14em] mb-4">
                            Summary
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-gray-400">Incident</span>
                                <span className="text-gray-100 font-semibold">{getIncidentLabel(c.incidentType)}</span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-gray-400">Severity</span>
                                <span className="text-gray-100 font-semibold capitalize">{c.severity}</span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-gray-400">Status</span>
                                <span className="text-gray-100 font-semibold capitalize">
                                    {c.status.replace(/_/g, ' ').toLowerCase()}
                                </span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-gray-400">Hospital</span>
                                <span className="text-gray-100 font-semibold text-right">
                                    {c.assignedHospital || '—'}
                                </span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-gray-400">Doctor</span>
                                <span className="text-gray-100 font-semibold text-right">
                                    {doctorName ? `Dr. ${doctorName}` : '—'}
                                </span>
                            </li>
                            {linkedApt && (
                                <li className="flex items-center justify-between gap-3">
                                    <span className="text-gray-400">Appointment</span>
                                    <span className="text-gray-100 font-semibold text-right capitalize">
                                        {aptStatus || 'Booked'}
                                    </span>
                                </li>
                            )}
                            {isCancelled && c.cancelledReason && (
                                <li className="pt-3 border-t border-white/[0.05]">
                                    <div className="flex items-start gap-3">
                                        <XCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cancellation reason</p>
                                            <p className="text-sm text-gray-200 mt-1 whitespace-pre-wrap break-words">
                                                {c.cancelledReason}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/15 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 size={16} />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.14em]">
                                Live Updates
                            </h3>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            This page updates automatically whenever the emergency status changes,
                            new details are added, or responders are assigned — no need to refresh.
                        </p>
                    </div>
                </div>
            </div>

            {confirmCancelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadein">
                    <div className="w-full max-w-md bg-[#0a0f1c] border border-red-500/20 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                                <AlertTriangle size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-white">Cancel this emergency case?</h3>
                                <p className="text-sm text-gray-400 mt-1.5">
                                    Cancellation is only allowed while the case is <span className="font-bold text-white">Reported</span>.
                                    After cancelling, no further updates can be made.
                                </p>
                            </div>
                        </div>

                        <label className="block mt-5">
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                                Cancellation reason <span className="text-gray-600">(optional)</span>
                            </span>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                placeholder="Briefly explain why the emergency is being cancelled..."
                                className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 focus:bg-white/[0.05]"
                            />
                        </label>

                        <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <button
                                onClick={() => {
                                    setConfirmCancelOpen(false);
                                    setCancelReason('');
                                }}
                                disabled={cancelling}
                                className="px-5 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                Keep Case
                            </button>
                            <button
                                onClick={performCancel}
                                disabled={cancelling}
                                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {cancelling ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <XCircle size={14} />
                                )}
                                Yes, Cancel Emergency
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyCaseDetails;
