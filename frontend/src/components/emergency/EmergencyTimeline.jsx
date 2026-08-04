import React from 'react';
import { Check, Circle, X } from 'lucide-react';

export const LIFECYCLE_ORDER = [
    'REPORTED',
    'AMBULANCE_REQUESTED',
    'AMBULANCE_ASSIGNED',
    'AMBULANCE_ARRIVED',
    'PATIENT_IDENTIFIED',
    'IN_TRANSIT',
    'HOSPITAL_PREPARED',
    'ARRIVED_AT_HOSPITAL',
    'UNDER_TREATMENT',
    'CLOSED',
];

export const STATUS_LABELS = {
    REPORTED: 'Emergency Reported',
    AMBULANCE_REQUESTED: 'Ambulance Requested',
    AMBULANCE_ASSIGNED: 'Ambulance Assigned',
    AMBULANCE_ARRIVED: 'Ambulance Arrived',
    PATIENT_IDENTIFIED: 'Patient Identified',
    IN_TRANSIT: 'In Transit to Hospital',
    HOSPITAL_PREPARED: 'Hospital Prepared',
    ARRIVED_AT_HOSPITAL: 'Arrived at Hospital',
    UNDER_TREATMENT: 'Under Treatment',
    CLOSED: 'Case Closed',
    CANCELLED: 'Cancelled',
};

const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
        const d = typeof ts === 'string' ? new Date(ts) : ts;
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString();
    } catch (e) {
        return '';
    }
};

const getStatusColor = (status, isCompleted) => {
    if (status === 'CANCELLED') return 'text-gray-400 border-gray-500/40 bg-gray-500/10';
    if (status === 'CLOSED') return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    if (isCompleted) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    return 'text-gray-500 border-white/10 bg-white/[0.02]';
};

const EmergencyTimeline = ({ statusTimestamps, currentStatus = 'REPORTED', cancelledReason = '' }) => {
    const safeTimestamps = statusTimestamps || {};

    const timestampAt = (stage) => {
        if (!safeTimestamps) return null;
        if (safeTimestamps instanceof Map) return safeTimestamps.get(stage) || null;
        if (typeof safeTimestamps === 'object') return safeTimestamps[stage] || null;
        return null;
    };

    const currentIdx = LIFECYCLE_ORDER.indexOf(currentStatus);

    const isCancelled = currentStatus === 'CANCELLED';
    const isClosed = currentStatus === 'CLOSED';

    return (
        <div className="w-full">
            <div className="relative space-y-1">
                {LIFECYCLE_ORDER.map((stage, idx) => {
                    const completedAt = timestampAt(stage);
                    const isCompleted = !!completedAt || (currentIdx >= 0 && idx < currentIdx) || isClosed;
                    const isCurrent = currentStatus === stage;
                    const color = getStatusColor(stage, isCompleted);

                    return (
                        <div key={stage} className="relative flex gap-4 min-h-[62px]">
                            <div className="relative flex flex-col items-center">
                                <div
                                    className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${color} ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#0a0f1c] ring-emerald-500/60 scale-110' : ''}`}
                                >
                                    {isCompleted ? (
                                        <Check size={14} />
                                    ) : (
                                        <Circle size={14} className="opacity-40" />
                                    )}
                                </div>
                                {idx < LIFECYCLE_ORDER.length - 1 && (
                                    <div
                                        className={`absolute top-8 w-[2px] h-[calc(100%-28px)] ${isCompleted ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`}
                                    />
                                )}
                            </div>
                            <div className="flex-1 pb-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-sm font-bold tracking-wide ${isCompleted ? 'text-gray-100' : 'text-gray-500'}`}>
                                        {STATUS_LABELS[stage] || stage}
                                    </span>
                                    {isCurrent && !isCancelled && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                            Current
                                        </span>
                                    )}
                                </div>
                                {completedAt ? (
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {formatTimestamp(completedAt)}
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-gray-600 mt-0.5 italic">
                                        Pending
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isCancelled && (
                    <div className="mt-4 p-4 rounded-2xl border border-gray-500/20 bg-gray-500/5">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 flex items-center justify-center shrink-0">
                                <X size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-300 tracking-wide">
                                    {STATUS_LABELS.CANCELLED}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {formatTimestamp(timestampAt('CANCELLED')) || ''}
                                </p>
                                {cancelledReason && (
                                    <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap break-words">
                                        {cancelledReason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyTimeline;
