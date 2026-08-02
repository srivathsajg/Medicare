import React, { useEffect, useState } from 'react';
import {
    AlertCircle,
    CalendarDays,
    ExternalLink,
    FileText,
    HeartPulse,
    RefreshCw,
    Search,
    Shield,
    UserRound,
    X,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import Loader from '../ui/Loader';
import { fetchAdmittedPatientInsurance, verifyPatientInsurance } from '../../services/adminApi';
import { getBaseUrl } from '../../services/userApi';

const formatDate = (value) => {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const formatDateTime = (value) => {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const maskPolicy = (value) => {
    if (!value) {
        return 'Policy not added';
    }

    if (value.length <= 4) {
        return value;
    }

    return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

const getProofUrl = (proofPath) => {
    if (!proofPath) {
        return null;
    }

    const normalized = proofPath.replace(/\\/g, '/').replace(/^\/?(backend\/)?/, '');
    return `${getBaseUrl()}/${normalized}`;
};

const claimTone = (status) => {
    if (status === 'approved') {
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (status === 'rejected') {
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
};

const ClaimsModal = ({ patient, onClose }) => {
    if (!patient) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#101317] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <h3 className="text-xl font-bold text-white">{patient.name} Claim Timeline</h3>
                        <p className="text-sm text-gray-400 mt-1">Review insurance claims created for this admitted patient.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[calc(85vh-96px)] overflow-y-auto px-6 py-6 space-y-4">
                    {patient.claims.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center text-gray-400">
                            No insurance claims have been created for this patient yet.
                        </div>
                    ) : (
                        patient.claims.map((claim) => (
                            <div key={claim._id} className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{claim.description || 'Insurance claim'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Created {formatDateTime(claim.createdAt)}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${claimTone(claim.claimStatus)}`}>
                                            {claim.claimStatus}
                                        </span>
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase text-gray-300">
                                            {claim.verificationStatus || 'unverified'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Billing Amount</p>
                                        <p className="mt-2 text-lg font-bold text-white">
                                            {claim.billingAmount != null ? `Rs. ${claim.billingAmount}` : 'Not linked'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Billing Status</p>
                                        <p className="mt-2 text-lg font-bold text-white">{claim.billingStatus || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const HospitalInsuranceView = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [verifyingId, setVerifyingId] = useState('');

    const loadPatients = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetchAdmittedPatientInsurance();
            if (response?.success) {
                setPatients(response.data || []);
            } else {
                setPatients([]);
                setError(response?.message || 'Unable to load admitted patient insurance data.');
            }
        } catch (err) {
            console.error(err);
            setPatients([]);
            setError(err.response?.data?.message || 'Unable to load admitted patient insurance data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const handleVerifyInsurance = async (patientId) => {
        if (!window.confirm('Are you sure you want to verify and apply insurance for this patient?')) return;
        try {
            setVerifyingId(patientId);
            const res = await verifyPatientInsurance(patientId);
            if (res.success) {
                window.alert('Verified and applied');
                loadPatients();
            }
        } catch (err) {
            window.alert('Failed to verify insurance');
        } finally {
            setVerifyingId('');
        }
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredPatients = patients.filter((patient) => {
        if (!normalizedSearch) {
            return true;
        }

        const fields = [
            patient.name,
            patient.email,
            patient.phone,
            patient.admission?.ward,
            patient.admission?.doctorName,
            patient.insurance?.providerName,
            patient.insurance?.policyNumber,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return fields.includes(normalizedSearch);
    });

    const summary = {
        total: patients.length,
        covered: patients.filter((patient) => patient.insurance?.hasInsurance).length,
        expired: patients.filter((patient) => patient.insurance?.isExpired).length,
        claims: patients.reduce((count, patient) => count + (patient.claimSummary?.total || 0), 0),
    };

    if (loading) {
        return <Loader message="Loading admitted patient insurance" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Admitted Patient Insurance</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Only patients currently admitted to this hospital are shown here.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadPatients}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={HeartPulse} title="Admitted Patients" value={summary.total} tone="emerald" />
                <SummaryCard icon={Shield} title="With Insurance" value={summary.covered} tone="blue" />
                <SummaryCard icon={AlertCircle} title="Expired Policies" value={summary.expired} tone="amber" />
                <SummaryCard icon={FileText} title="Total Claims" value={summary.claims} tone="rose" />
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#101317] p-5">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search patient, ward, doctor, provider, or policy"
                        className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/40"
                    />
                </div>
            </div>

            {error ? (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                    {error}
                </div>
            ) : null}

            {filteredPatients.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#101317] p-10 text-center">
                    <UserRound className="mx-auto text-gray-700" size={36} />
                    <h3 className="mt-4 text-lg font-semibold text-white">No admitted patient insurance records found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        When a patient is admitted to this hospital, their insurance profile and claims will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {filteredPatients.map((patient) => {
                        const proofUrl = getProofUrl(patient.insurance?.insuranceProofImage);

                        return (
                            <div key={patient._id} className="rounded-3xl border border-white/10 bg-[#101317] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{patient.name}</h3>
                                        <p className="mt-1 text-sm text-gray-400">{patient.email || 'Email not available'}</p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                            {patient.phone ? <InfoPill label={patient.phone} /> : null}
                                            {patient.gender ? <InfoPill label={patient.gender} /> : null}
                                            {patient.bloodGroup ? <InfoPill label={`Blood ${patient.bloodGroup}`} /> : null}
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${patient.insurance?.isExpired ? 'bg-red-500/10 text-red-300 border border-red-500/20' : patient.isInsuranceApplied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
                                        {patient.insurance?.isExpired ? 'Expired policy' : patient.isInsuranceApplied ? 'Verified & Applied' : 'Active / pending review'}
                                    </span>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <SectionCard title="Admission Details">
                                        <DetailRow label="Hospital" value={patient.admission?.hospitalName || 'Not available'} />
                                        <DetailRow label="Ward" value={patient.admission?.ward || 'Not assigned'} />
                                        <DetailRow label="Admitted At" value={formatDateTime(patient.admission?.admittedAt)} />
                                    </SectionCard>

                                    <SectionCard title="Insurance Profile">
                                        <DetailRow label="Provider" value={patient.insurance?.providerName || 'Not added'} />
                                        <DetailRow label="Policy" value={maskPolicy(patient.insurance?.policyNumber)} />
                                        <DetailRow label="Valid Till" value={formatDate(patient.insurance?.validTillDate)} />
                                        <div className="pt-2 flex flex-wrap gap-2">
                                            {proofUrl ? (
                                                <a
                                                    href={proofUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/15"
                                                >
                                                    <ExternalLink size={14} /> View proof
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-500">Insurance proof not uploaded</span>
                                            )}
                                        </div>
                                    </SectionCard>
                                </div>

                                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Insurance Eligibility</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {patient.isInsuranceApplied ? `Verified & Applied on ${formatDate(patient.insuranceVerifiedAt)}` : 'Awaiting Hospital Admin Verification'}
                                            </p>
                                        </div>
                                        {!patient.isInsuranceApplied ? (
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyInsurance(patient._id)}
                                                disabled={verifyingId === patient._id}
                                                className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                            >
                                                {verifyingId === patient._id ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                                                Verify & Apply
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="rounded-full bg-emerald-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20 flex items-center gap-2 cursor-default"
                                            >
                                                <CheckCircle size={14} /> Verified & Completed
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Claims Overview</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Submitted {patient.claimSummary?.submitted || 0} | Approved {patient.claimSummary?.approved || 0} | Rejected {patient.claimSummary?.rejected || 0}
                                            </p>
                                        </div>
                                        {patient.claims?.length ? (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPatient(patient)}
                                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                            >
                                                View all {patient.claims.length} claims
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500">No claims linked yet</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ClaimsModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
        </div>
    );
};

const SummaryCard = ({ icon: Icon, title, value, tone }) => {
    const toneClass = {
        emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    }[tone] || 'bg-white/10 text-white border-white/10';

    return (
        <div className="rounded-3xl border border-white/10 bg-[#101317] p-5">
            <div className={`inline-flex rounded-2xl border p-3 ${toneClass}`}>
                <Icon size={20} />
            </div>
            <p className="mt-4 text-sm text-gray-400">{title}</p>
            <p className="mt-1 text-3xl font-bold text-white">{value}</p>
        </div>
    );
};

const SectionCard = ({ title, children }) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{title}</p>
        <div className="mt-3 space-y-3">{children}</div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="text-right font-medium text-white">{value}</span>
    </div>
);

const InfoPill = ({ label }) => (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
        {label}
    </span>
);

export default HospitalInsuranceView;
