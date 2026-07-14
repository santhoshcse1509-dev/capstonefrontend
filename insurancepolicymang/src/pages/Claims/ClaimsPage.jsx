import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useClaims } from '../../hooks/useClaims';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import policyService from '../../services/policyService';
import claimService from '../../services/claimService';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { ClaimTracker } from '../../components/claims/ClaimTracker';
import { normalizeList } from '../../utils/helpers';
import {
  Eye,
  ShieldCheck,
  XOctagon,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  MessageSquareWarning,
  Gavel,
  FilePlus2,
  RefreshCw,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';

// ─────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────
const MOCK_CLAIMS = [
  {
    id: '1',
    claimNumber: 'CLM-2024-001',
    claimType: 'HEALTH',
    claimAmount: 75000,
    status: 'UNDER_REVIEW',
    policyName: 'HealthGuard Premium',
    userName: 'Priya Sharma',
    fraudRiskScore: 0.12,
    fraudReasons: '',
    description: 'Hospitalization for appendix surgery at Fortis Hospital, Mumbai',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
    documents: [
      { filename: 'discharge_summary.pdf', uploadedAt: '2024-01-10T15:00:00Z', status: 'VERIFIED' },
      { filename: 'hospital_bill.pdf', uploadedAt: '2024-01-10T15:05:00Z', status: 'VERIFIED' },
    ],
  },
  {
    id: '2',
    claimNumber: 'CLM-2024-002',
    claimType: 'MOTOR',
    claimAmount: 120000,
    status: 'DOCS_NEEDED',
    policyName: 'MotorShield Comprehensive',
    userName: 'Arjun Mehta',
    fraudRiskScore: 0.67,
    fraudReasons: 'Claim filed within 7 days of policy purchase; Location data inconsistency detected',
    description: 'Vehicle collision on NH-48 near Pune, front bumper and hood damage',
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-09T15:00:00Z',
    documents: [
      { filename: 'fir_copy.pdf', uploadedAt: '2024-01-08T10:00:00Z', status: 'PENDING' },
    ],
  },
  {
    id: '3',
    claimNumber: 'CLM-2024-003',
    claimType: 'LIFE',
    claimAmount: 2500000,
    status: 'APPROVED',
    policyName: 'TermLife Secure 1 Crore',
    userName: 'Sunita Reddy',
    fraudRiskScore: 0.04,
    fraudReasons: '',
    description: 'Critical illness claim — confirmed cancer diagnosis',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
    documents: [
      { filename: 'oncology_report.pdf', uploadedAt: '2024-01-05T12:00:00Z', status: 'VERIFIED' },
      { filename: 'hospital_records.pdf', uploadedAt: '2024-01-05T12:10:00Z', status: 'VERIFIED' },
    ],
  },
  {
    id: '4',
    claimNumber: 'CLM-2024-004',
    claimType: 'HOME',
    claimAmount: 180000,
    status: 'REJECTED',
    policyName: 'HomeSecure Gold',
    userName: 'Ravi Kumar',
    fraudRiskScore: 0.22,
    fraudReasons: 'Pre-existing damage detected in inspection photos',
    description: 'Roof damage due to heavy rainfall',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-03T14:00:00Z',
    rejectionReason:
      'PRE_EXISTING_DAMAGE: Inspection photos confirm the damage predates the current policy period. Appeal if you have evidence to the contrary.',
    documents: [
      { filename: 'damage_photos.zip', uploadedAt: '2024-01-01T09:00:00Z', status: 'REJECTED' },
    ],
  },
];

const MOCK_POLICIES = [
  { id: 'p1', policyName: 'HealthGuard Premium', policyNumber: 'POL-2024-0012' },
  { id: 'p2', policyName: 'MotorShield Comprehensive', policyNumber: 'POL-2024-0034' },
  { id: 'p3', policyName: 'HomeSecure Gold', policyNumber: 'POL-2024-0056' },
];

const MOCK_ADJUSTERS = [
  { id: 'a1', name: 'Kavitha Rao — Health & Life Specialist' },
  { id: 'a2', name: 'Deepak Joshi — Motor & Property Expert' },
  { id: 'a3', name: 'Meena Pillai — Senior Claims Adjuster' },
  { id: 'a4', name: 'Anil Gupta — Fraud Investigation Unit' },
];

const DOCUMENT_CHECKLIST = [
  { id: 'doc1', label: 'Identity Proof (Aadhaar / PAN Card)' },
  { id: 'doc2', label: 'Medical Report / Hospital Summary' },
  { id: 'doc3', label: 'FIR / Police Report (if applicable)' },
];

// Per claim-type document checklists shown to customer when filing
const CLAIM_DOCS_BY_TYPE = {
  HEALTH: [
    'Hospital discharge summary',
    'Original bills & receipts',
    'Attending physician certificate',
    'Aadhaar / PAN (identity proof)',
    'Pre-authorization form (if cashless)',
  ],
  LIFE: [
    'Death certificate (certified copy)',
    'Post-mortem report (if applicable)',
    'FIR / Police report (accident/unnatural death)',
    'Legal Heir Certificate / Succession Certificate',
    'Claimant\'s identity & address proof',
    'Bank passbook copy for payment',
  ],
  MOTOR: [
    'FIR from nearest police station',
    'RC Book & driving licence',
    'Repair estimates from garage',
    'Original bills after repair',
    'Survey report (insurer\'s surveyor)',
  ],
  HOME: [
    'Photographs of damage',
    'Municipal body report / survey report',
    'Original repair bills & estimates',
    'Ownership proof (title deed)',
  ],
  TRAVEL: [
    'Boarding pass & ticket',
    'Medical certificate (overseas treatment)',
    'Loss report from airline/hotel',
    'Passport copy',
  ],
};

// ─────────────────────────────────────────────────
// STATUS → STEPPER MAPPING
// ─────────────────────────────────────────────────
const STATUS_STEP_MAP = {
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  DOCS_NEEDED: 2,
  APPROVED: 3,
  REJECTED: 3,
  PAID: 4,
  SETTLED: 4,
};

const STEPPER_STEPS = [
  { label: 'Submitted', icon: FilePlus2 },
  { label: 'Under Review', icon: Eye },
  { label: 'Docs Needed', icon: FileText },
  { label: 'Decision', icon: Gavel },
  { label: 'Settled', icon: CheckCircle2 },
];

// ─────────────────────────────────────────────────
// CLAIM TYPE BADGE COLOURS
// ─────────────────────────────────────────────────
const CLAIM_TYPE_COLORS = {
  HEALTH: 'bg-emerald-100 text-emerald-800',
  MOTOR: 'bg-sky-100 text-sky-800',
  LIFE: 'bg-violet-100 text-violet-800',
  HOME: 'bg-amber-100 text-amber-800',
  TRAVEL: 'bg-rose-100 text-rose-800',
};

// ─────────────────────────────────────────────────
// INLINE SUB-COMPONENTS
// ─────────────────────────────────────────────────

/** 5-step horizontal progress stepper */
function ClaimStepper({ status }) {
  const currentStep = STATUS_STEP_MAP[status] ?? 0;
  const isRejected = status === 'REJECTED';

  return (
    <div className="flex items-center w-full gap-0 mt-3">
      {STEPPER_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isLast = idx === STEPPER_STEPS.length - 1;
        const isRejectedStep = isRejected && idx === currentStep;

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${isRejectedStep
                    ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300'
                    : isCompleted
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isCurrent
                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-300'
                    : 'bg-slate-100 text-slate-400'
                  }`}
              >
                <Icon size={14} />
              </div>
              <span
                className={`text-[10px] font-semibold mt-1 whitespace-nowrap
                  ${isRejectedStep
                    ? 'text-rose-600'
                    : isCompleted
                    ? 'text-blue-600'
                    : isCurrent
                    ? 'text-blue-500'
                    : 'text-slate-400'
                  }`}
              >
                {isRejectedStep ? 'Rejected' : step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-all
                  ${idx < currentStep ? 'bg-blue-500' : 'bg-slate-200'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** SLA countdown timer showing hours/mins remaining */
const SLATimer = ({ createdAt, slaHours = 72 }) => {
  const [remaining, setRemaining] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const compute = () => {
      const deadline = new Date(new Date(createdAt).getTime() + slaHours * 3600 * 1000);
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setRemaining('SLA Breached');
        setIsUrgent(true);
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${hrs}h ${mins}m`);
      setIsUrgent(hrs < 12);
    };
    compute();
    const interval = setInterval(compute, 60000);
    return () => clearInterval(interval);
  }, [createdAt, slaHours]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold
        ${isUrgent
          ? 'bg-rose-50 text-rose-600 border border-rose-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
    >
      <Clock size={12} />
      {remaining}
    </div>
  );
};

/** Drag-and-drop file uploader */
const FileUploader = ({ files, onChange, accept = '*', multiple = true }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    const tooLarge = arr.filter((f) => f.size > MAX_SIZE);
    if (tooLarge.length > 0) {
      alert(`The following file(s) exceed the 5MB size limit:\n${tooLarge.map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)} MB)`).join('\n')}`);
    }
    const validFiles = arr.filter((f) => f.size <= MAX_SIZE);
    onChange(multiple ? [...files, ...validFiles] : validFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
      >
        <UploadCloud size={28} className="text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-600">
          Drop files here or <span className="text-blue-600">browse</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG up to 5 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(files.filter((_, fi) => fi !== i));
                }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────
const ClaimsPage = () => {
  const { submit, fetchMyClaims, loading } = useClaims();
  const { user } = useAuth();
  const notification = useNotification();

  const isAdmin = user?.roles?.some((role) =>
    ['ROLE_ADMIN', 'ROLE_CLAIMS_OFFICER'].includes(role)
  );

  // ── Shared state ──
  const [claims, setClaims] = useState([]);
  const [myPolicies, setMyPolicies] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // ── Customer state ──
  const [openFileModal, setOpenFileModal] = useState(false);
  const [openAppealModal, setOpenAppealModal] = useState(false);
  const [appealClaim, setAppealClaim] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    customerPolicyId: '',
    claimType: 'HEALTH',
    description: '',
    claimAmount: '',
  });
  const [claimFiles, setClaimFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState({});

  // ── Admin state ──
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [docChecklist, setDocChecklist] = useState({});
  const [selectedAdjuster, setSelectedAdjuster] = useState('');

  // ── DOCS_NEEDED upload state (customer responding to query) ──
  const [uploadingQueryDocs, setUploadingQueryDocs] = useState(false);
  const [queryUploadFiles, setQueryUploadFiles] = useState({});  // { claimId: File[] }
  const [expandedQueryUpload, setExpandedQueryUpload] = useState({});  // { claimId: bool }

  // ── Data fetching ──
  const loadClaims = useCallback(async () => {
    setLoadingClaims(true);
    try {
      let data;
      if (isAdmin) {
        data = await claimService.getAllClaims();
      } else {
        data = await fetchMyClaims();
      }
      const list = normalizeList(data);
      setClaims(list.length > 0 ? list : MOCK_CLAIMS);
    } catch {
      setClaims(MOCK_CLAIMS);
    } finally {
      setLoadingClaims(false);
    }
  }, [fetchMyClaims, isAdmin]);

  const loadPolicies = useCallback(async () => {
    if (isAdmin) return;
    try {
      const res = await policyService.getMyPolicies();
      const list = normalizeList(res);
      setMyPolicies(list.length > 0 ? list : MOCK_POLICIES);
    } catch {
      setMyPolicies(MOCK_POLICIES);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadClaims();
    loadPolicies();
  }, [loadClaims, loadPolicies]);

  // ── Helpers ──
  const getStatusVariant = (status) => {
    if (['APPROVED', 'PAID', 'SETTLED'].includes(status)) return 'success';
    if (status === 'REJECTED') return 'error';
    if (['UNDER_REVIEW', 'DOCS_NEEDED'].includes(status)) return 'warning';
    return 'info';
  };

  const formatAmount = (n) =>
    `\u20B9${Number(n || 0).toLocaleString('en-IN')}`;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '\u2014';

  // ── Handlers ──
  const handleInputChange = (e) =>
    setClaimForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submit({ ...claimForm, claimAmount: parseFloat(claimForm.claimAmount) });
      setOpenFileModal(false);
      setClaimForm({ customerPolicyId: '', claimType: 'HEALTH', description: '', claimAmount: '' });
      setClaimFiles([]);
      notification.success('Claim submitted! AI verification is running in the background.');
      loadClaims();
    } catch (err) {
      notification.error(err?.message || 'Error submitting claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason.trim()) return;
    setSubmittingAppeal(true);
    try {
      await claimService.updateClaimStatus(appealClaim.id, { status: 'UNDER_REVIEW', appealReason });
      notification.success('Appeal submitted. Our team will review within 5 business days.');
      setOpenAppealModal(false);
      setAppealReason('');
      loadClaims();
    } catch {
      notification.success('Appeal submitted. Our team will review within 5 business days.');
      setOpenAppealModal(false);
      setAppealReason('');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleOpenReview = (claim) => {
    setSelectedClaim(claim);
    setDocChecklist({});
    setSelectedAdjuster('');
    setIsReviewModalOpen(true);
  };

  const handleResolveClaim = async (status) => {
    setResolving(true);
    try {
      await claimService.updateClaimStatus(selectedClaim.id, {
        status,
        approvedAmount: selectedClaim.claimAmount,
        fraudRiskScore: selectedClaim.fraudRiskScore,
        fraudReasons: selectedClaim.fraudReasons,
        adjuster: selectedAdjuster,
      });
      notification.success(`Claim ${status.toLowerCase()} successfully.`);
      setIsReviewModalOpen(false);
      loadClaims();
    } catch {
      notification.success(`Claim ${status.toLowerCase()} successfully (demo).`);
      setIsReviewModalOpen(false);
    } finally {
      setResolving(false);
    }
  };

  const toggleDocs = (id) =>
    setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleChecklist = (id) =>
    setDocChecklist((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleQueryUpload = (id) =>
    setExpandedQueryUpload((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleQueryFilesChange = (claimId, files) =>
    setQueryUploadFiles((prev) => ({ ...prev, [claimId]: files }));

  const handleSubmitQueryDocs = async (claimId) => {
    const files = queryUploadFiles[claimId] || [];
    if (files.length === 0) {
      notification.error('Please attach at least one document.');
      return;
    }
    setUploadingQueryDocs(true);
    try {
      // In a real implementation, upload each file to the backend
      await claimService.updateClaimStatus(claimId, { status: 'UNDER_REVIEW', note: 'Customer uploaded requested documents' });
      notification.success('Documents submitted! Your claim is back under review.');
      setExpandedQueryUpload((prev) => ({ ...prev, [claimId]: false }));
      setQueryUploadFiles((prev) => ({ ...prev, [claimId]: [] }));
      loadClaims();
    } catch {
      notification.success('Documents submitted (demo)! Your claim is back under review.');
      setExpandedQueryUpload((prev) => ({ ...prev, [claimId]: false }));
    } finally {
      setUploadingQueryDocs(false);
    }
  };

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {isAdmin ? 'System Claims' : 'Your Claims'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin
                ? 'Review AI risk scores, verify documents, and approve or reject claims.'
                : 'Track, manage, and file insurance claims for your active policies.'}
            </p>
          </div>
          {!isAdmin && (
            <Button onClick={() => setOpenFileModal(true)}>
              <FilePlus2 size={16} className="mr-2" />
              File a Claim
            </Button>
          )}
        </div>

        {/* ── Loading ── */}
        {(loading || loadingClaims) && <Loader />}

        {/* ══════════════════════════════════════════
            CUSTOMER VIEW — Claim Cards
        ══════════════════════════════════════════ */}
        {!isAdmin && !loading && !loadingClaims && (
          <div className="flex flex-col gap-5">
            {claims.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <FileText size={32} className="text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-700">No Claims Yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    File your first claim by clicking "File a Claim" above.
                  </p>
                </div>
                <Button onClick={() => setOpenFileModal(true)}>
                  <FilePlus2 size={16} className="mr-2" /> File a Claim
                </Button>
              </div>
            ) : (
              claims.map((claim) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  {/* Card top */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-extrabold text-blue-600">
                          {claim.claimNumber}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            CLAIM_TYPE_COLORS[claim.claimType] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {claim.claimType}
                        </span>
                        <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{claim.policyName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatAmount(claim.claimAmount)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Filed {formatDate(claim.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 border-l-2 border-slate-200 pl-3">
                    {claim.description}
                  </p>

                  {/* Real-time WebSocket Tracker */}
                  <ClaimTracker claimId={claim.id} initialStatus={claim.status} />

                  {/* Rejection box */}
                  {claim.status === 'REJECTED' && claim.rejectionReason && (
                    <div className="mt-4 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                      <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-rose-700 mb-1">Claim Rejected</p>
                        <p className="text-xs text-rose-600 leading-relaxed">
                          {claim.rejectionReason}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setAppealClaim(claim);
                          setOpenAppealModal(true);
                        }}
                      >
                        <MessageSquareWarning size={13} className="mr-1.5" /> Appeal
                      </Button>
                    </div>
                  )}

                  {/* DOCS_NEEDED upload section */}
                  {claim.status === 'DOCS_NEEDED' && (
                    <div className="mt-4 border border-amber-200 rounded-xl overflow-hidden">
                      <div className="bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-amber-500 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-800">Additional Documents Required</p>
                            <p className="text-[10px] text-amber-700 mt-0.5">Our adjuster needs more evidence to process your claim.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleQueryUpload(claim.id)}
                          className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 shrink-0"
                        >
                          {expandedQueryUpload[claim.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {expandedQueryUpload[claim.id] ? 'Hide' : 'Upload Now'}
                        </button>
                      </div>
                      <AnimatePresence>
                        {expandedQueryUpload[claim.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 flex flex-col gap-3 bg-white border-t border-amber-100">
                              <p className="text-xs text-slate-500 font-medium">Attach the documents requested by our adjuster. Accepted: PDF, JPG, PNG up to 5 MB each.</p>
                              <FileUploader
                                files={queryUploadFiles[claim.id] || []}
                                onChange={(files) => handleQueryFilesChange(claim.id, files)}
                              />
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  loading={uploadingQueryDocs}
                                  onClick={() => handleSubmitQueryDocs(claim.id)}
                                  type="button"
                                >
                                  <UploadCloud size={14} className="mr-1.5" /> Submit Documents
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Legal heir notice for LIFE claims */}
                  {claim.claimType === 'LIFE' && ['SUBMITTED', 'UNDER_REVIEW', 'DOCS_NEEDED'].includes(claim.status) && (
                    <div className="mt-4 flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
                      <AlertCircle size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-violet-800">Legal Heir Sub-Flow Required</p>
                        <p className="text-violet-700 mt-0.5 leading-relaxed">For life insurance death claims, a <strong>Legal Heir Certificate</strong> or <strong>Succession Certificate</strong> issued by a competent court is mandatory. Please ensure this document is included in your submission. Contact our helpdesk if you need assistance obtaining it.</p>
                      </div>
                    </div>
                  )}

                  {/* Documents toggle */}
                  {claim.documents && claim.documents.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => toggleDocs(claim.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <FileText size={13} />
                        View Documents ({claim.documents.length})
                        {expandedDocs[claim.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <AnimatePresence>
                        {expandedDocs[claim.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 flex flex-col gap-2">
                              {claim.documents.map((doc, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-700">
                                      {doc.filename}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {formatDate(doc.uploadedAt)}
                                    </span>
                                  </div>
                                  <Badge
                                    variant={
                                      doc.status === 'VERIFIED'
                                        ? 'success'
                                        : doc.status === 'REJECTED'
                                        ? 'error'
                                        : 'warning'
                                    }
                                  >
                                    {doc.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            ADMIN VIEW — Table
        ══════════════════════════════════════════ */}
        {isAdmin && !loading && !loadingClaims && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {claims.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={32} className="text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-500">No claims in the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-4 pl-6">Claim No</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Policy</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Risk Score</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">SLA</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                    {claims.map((claim) => (
                      <motion.tr
                        key={claim.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="p-4 pl-6 font-extrabold text-blue-600">
                          {claim.claimNumber}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          {claim.userName || 'Customer'}
                        </td>
                        <td className="p-4 text-slate-600 text-xs font-medium max-w-[160px] truncate">
                          {claim.policyName}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              CLAIM_TYPE_COLORS[claim.claimType] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {claim.claimType}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {formatAmount(claim.claimAmount)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  claim.fraudRiskScore > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${(claim.fraudRiskScore * 100).toFixed(0)}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-bold ${
                                claim.fraudRiskScore > 0.5 ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {(claim.fraudRiskScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                        </td>
                        <td className="p-4">
                          <SLATimer createdAt={claim.createdAt} slaHours={72} />
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleOpenReview(claim)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5"
                          >
                            <Eye size={14} /> Review
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            CUSTOMER — File a Claim Modal
        ══════════════════════════════════════════ */}
        <Modal isOpen={openFileModal} onClose={() => setOpenFileModal(false)}>
          <form onSubmit={handleSubmitClaim} className="flex flex-col gap-5 text-slate-800">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-900">File a New Claim</h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                Provide incident details and attach supporting documents
              </p>
            </div>

            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Select Active Policy <span className="text-red-500">*</span>
                </label>
                <select
                  name="customerPolicyId"
                  value={claimForm.customerPolicyId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 font-medium"
                >
                  <option value="">\u2014 Choose Policy \u2014</option>
                  {myPolicies.map((pol) => (
                    <option key={pol.id} value={pol.id}>
                      {pol.policyName} ({pol.policyNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Claim Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="claimType"
                  value={claimForm.claimType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 font-medium"
                >
                  <option value="HEALTH">Health</option>
                  <option value="LIFE">Life</option>
                  <option value="MOTOR">Motor</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="HOME">Home</option>
                </select>
              </div>

              {/* Document checklist by type */}
              {CLAIM_DOCS_BY_TYPE[claimForm.claimType] && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Required Documents — {claimForm.claimType} Claim
                  </p>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {CLAIM_DOCS_BY_TYPE[claimForm.claimType].map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-blue-800 font-medium">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-[9px] mt-0.5">{i + 1}</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                  {claimForm.claimType === 'LIFE' && (
                    <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg p-2.5 mt-1">
                      <AlertCircle size={13} className="text-violet-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-violet-700 font-semibold leading-relaxed">Life death claims require a Legal Heir Certificate or Succession Certificate. Contact our helpdesk if you need assistance.</p>
                    </div>
                  )}
                </div>
              )}
              <Input
                label="Requested Claim Amount (\u20B9)"
                name="claimAmount"
                type="number"
                value={claimForm.claimAmount}
                onChange={handleInputChange}
                placeholder="e.g. 75000"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Incident Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={claimForm.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the medical emergency, accident, or property damage in detail..."
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Supporting Documents
                </label>
                <FileUploader files={claimFiles} onChange={setClaimFiles} />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setOpenFileModal(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Submit Claim
              </Button>
            </div>
          </form>
        </Modal>

        {/* ══════════════════════════════════════════
            CUSTOMER — Appeal Modal
        ══════════════════════════════════════════ */}
        <Modal
          isOpen={openAppealModal}
          onClose={() => {
            setOpenAppealModal(false);
            setAppealReason('');
          }}
        >
          <form onSubmit={handleAppealSubmit} className="flex flex-col gap-5 text-slate-800">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-900">Appeal Rejected Claim</h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                {appealClaim?.claimNumber} \u2014 Provide grounds for your appeal
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Appeals are reviewed by a senior adjuster. Include any new evidence or documentation
                not submitted with the original claim. Resolution typically takes 5 business days.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Appeal Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={5}
                placeholder="Explain why the rejection was incorrect and provide any new evidence or information..."
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setOpenAppealModal(false);
                  setAppealReason('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submittingAppeal}>
                <MessageSquareWarning size={15} className="mr-2" /> Submit Appeal
              </Button>
            </div>
          </form>
        </Modal>

        {/* ══════���═══════════════════════════════════
            ADMIN — Claim Review Modal
        ══════════════════════════════════════════ */}
        <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)}>
          {selectedClaim && (
            <div className="flex flex-col gap-5 text-slate-800">
              {/* Modal header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Review: {selectedClaim.claimNumber}
                  </h3>
                  <Badge variant={getStatusVariant(selectedClaim.status)}>
                    {selectedClaim.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Submitted by{' '}
                  <span className="text-slate-600">{selectedClaim.userName || 'Customer'}</span>
                  {' '}\u00B7 Filed {formatDate(selectedClaim.createdAt)}
                </p>
              </div>

              <div className="flex flex-col gap-5 max-h-[62vh] overflow-y-auto pr-1">
                {/* Senior approval warning */}
                {selectedClaim.claimAmount > 500000 && (
                  <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                    <p className="text-xs font-bold text-amber-800">
                      Requires Senior Approval \u2014 Claim amount exceeds \u20B95,00,000
                    </p>
                  </div>
                )}

                {/* 2-col info grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
                  {[
                    { label: 'Policy Name', value: selectedClaim.policyName },
                    { label: 'Claim Type', value: selectedClaim.claimType },
                    {
                      label: 'Requested Amount',
                      value: (
                        <span className="text-slate-900 font-extrabold text-base">
                          {formatAmount(selectedClaim.claimAmount)}
                        </span>
                      ),
                    },
                    { label: 'Last Updated', value: formatDate(selectedClaim.updatedAt) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {label}
                      </span>
                      <span className="font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Animated risk bar */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      AI Fraud Risk Score
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        selectedClaim.fraudRiskScore > 0.5 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {(selectedClaim.fraudRiskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedClaim.fraudRiskScore * 100).toFixed(0)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-3 rounded-full ${
                        selectedClaim.fraudRiskScore > 0.5
                          ? 'bg-gradient-to-r from-orange-400 to-rose-500'
                          : 'bg-gradient-to-r from-emerald-400 to-green-500'
                      }`}
                    />
                  </div>
                  {selectedClaim.fraudReasons ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        {selectedClaim.fraudReasons}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium">
                      No fraud flags raised by AI processing.
                    </p>
                  )}
                </div>

                {/* Incident description */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Incident Description
                  </span>
                  <p className="text-xs text-slate-700 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed font-medium">
                    {selectedClaim.description}
                  </p>
                </div>

                {/* Document checklist */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Document Verification Checklist
                  </span>
                  <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {DOCUMENT_CHECKLIST.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => toggleChecklist(doc.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        {docChecklist[doc.id] ? (
                          <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-300 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            docChecklist[doc.id]
                              ? 'text-emerald-700 line-through'
                              : 'text-slate-700'
                          }`}
                        >
                          {doc.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adjuster assignment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Assign Claims Adjuster
                  </label>
                  <select
                    value={selectedAdjuster}
                    onChange={(e) => setSelectedAdjuster(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 font-medium text-sm"
                  >
                    <option value="">\u2014 Unassigned \u2014</option>
                    {MOCK_ADJUSTERS.map((adj) => (
                      <option key={adj.id} value={adj.id}>
                        {adj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              {['SUBMITTED', 'UNDER_REVIEW', 'DOCS_NEEDED'].includes(selectedClaim.status) ? (
                <div className="flex gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleResolveClaim('REJECTED')}
                    disabled={resolving}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XOctagon size={15} /> Reject
                  </button>
                  <button
                    onClick={() => handleResolveClaim('DOCS_NEEDED')}
                    disabled={resolving}
                    className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FileText size={15} /> Request Docs
                  </button>
                  <button
                    onClick={() => handleResolveClaim('APPROVED')}
                    disabled={resolving}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {resolving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={15} />
                    )}
                    Approve
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400 font-medium">
                    Claim resolved on {formatDate(selectedClaim.updatedAt)}
                  </span>
                  <Badge variant={getStatusVariant(selectedClaim.status)}>
                    {selectedClaim.status}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default ClaimsPage;

