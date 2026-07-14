import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import claimService from '../../services/claimService';
import Modal from '../../components/common/Modal';
import SLATimer from '../../components/common/SLATimer';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Flag,
  Search,
  User,
  Users,
  XCircle,
  ChevronDown,
  Inbox,
  CreditCard,
  FilePlus,
  Activity,
} from 'lucide-react';

const MOCK_ADJUSTERS = ['Ramesh Kumar', 'Priya Sharma', 'Anil Mehta', 'Sunita Verma'];

const FILTER_TABS = ['All', 'Pending', 'Under Review', 'High Risk', 'Overdue'];

const STATUS_MAP = {
  SUBMITTED: { label: 'Submitted', color: 'blue' },
  UNDER_REVIEW: { label: 'Under Review', color: 'amber' },
  DOCS_NEEDED: { label: 'Docs Needed', color: 'purple' },
  APPROVED: { label: 'Approved', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
};

const TYPE_COLORS = {
  HEALTH: 'bg-emerald-100 text-emerald-700',
  MOTOR: 'bg-blue-100 text-blue-700',
  LIFE: 'bg-purple-100 text-purple-700',
  HOME: 'bg-amber-100 text-amber-700',
};

const TRIAGE_BADGES = {
  AUTO_APPROVED: { label: 'Auto Approved', style: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  ESCALATED: { label: 'Escalated', style: 'bg-purple-100 text-purple-800 border border-purple-200' },
  PENDING: { label: 'Standard Queue', style: 'bg-slate-100 text-slate-800 border border-slate-200' },
};

function getSlaRowClass(slaDeadline) {
  if (!slaDeadline) return 'bg-white border-l-4 border-slate-300';
  const now = Date.now();
  const deadline = new Date(slaDeadline).getTime();
  const diffDays = (deadline - now) / (1000 * 3600 * 24);
  if (diffDays < 0) return 'bg-rose-50 border-l-4 border-rose-400';
  if (diffDays <= 3) return 'bg-amber-50 border-l-4 border-amber-400';
  return 'bg-green-50 border-l-4 border-green-400';
}

function RiskBar({ score }) {
  const pct = Math.round(score * 100);
  let barColor = 'bg-emerald-500';
  if (pct > 50) barColor = 'bg-rose-500';
  else if (pct > 25) barColor = 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${pct > 50 ? 'text-rose-600' : pct > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
        {pct}%
      </span>
    </div>
  );
}

function RiskGauge({ score }) {
  const pct = Math.round(score * 100);
  const circumference = Math.PI * 48;
  const dashOffset = circumference - (circumference * pct) / 100;
  let strokeColor = '#10b981';
  let label = 'Low';
  if (pct > 50) { strokeColor = '#ef4444'; label = 'High'; }
  else if (pct > 25) { strokeColor = '#f59e0b'; label = 'Medium'; }
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <text x="60" y="58" textAnchor="middle" fontSize="16" fontWeight="bold" fill={strokeColor}>{pct}%</text>
      </svg>
      <span className="text-xs font-semibold" style={{ color: strokeColor }}>{label} Risk</span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtext, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

export default function ClaimsOperations() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalClaim, setModalClaim] = useState(null);
  const [docChecks, setDocChecks] = useState({ idProof: false, medicalReport: false, firReport: false });
  const [fraudFlagged, setFraudFlagged] = useState({});
  const [adjusterMap, setAdjusterMap] = useState({});

  const fetchClaims = () => {
    setLoading(true);
    claimService.getAllClaims()
      .then((res) => {
        setClaims(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch claims', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const openModal = (claim) => {
    setModalClaim(claim);
    setDocChecks({ idProof: false, medicalReport: false, firReport: false });
  };
  const closeModal = () => setModalClaim(null);

  const filteredClaims = useMemo(() => {
    let list = claims;
    if (search.trim()) {
      list = list.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
          c.userName.toLowerCase().includes(search.toLowerCase())
      );
    }
    const now = Date.now();
    if (activeTab === 'Pending') list = list.filter((c) => c.status === 'SUBMITTED');
    else if (activeTab === 'Under Review') list = list.filter((c) => c.status === 'UNDER_REVIEW');
    else if (activeTab === 'High Risk') list = list.filter((c) => c.fraudRiskScore > 0.5);
    else if (activeTab === 'Overdue') {
      list = list.filter((c) => {
        const sla = c.submittedAt ? new Date(c.submittedAt).getTime() + 7 * 24 * 3600 * 1000 : now;
        return sla < now && c.status !== 'APPROVED' && c.status !== 'REJECTED' && c.status !== 'PAID';
      });
    }
    return list;
  }, [claims, activeTab, search]);

  const totalPendingPayout = claims.reduce(
    (s, c) => (c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED' ? s + c.claimAmount : s),
    0
  );

  const stpMetrics = useMemo(() => {
    const total = claims.length;
    const autoApproved = claims.filter(c => c.triageResult === 'AUTO_APPROVED').length;
    const escalated = claims.filter(c => c.triageResult === 'ESCALATED').length;
    const pending = claims.filter(c => !c.triageResult || c.triageResult === 'PENDING').length;
    const resolved = autoApproved + escalated;

    const autoPct = resolved > 0 ? Math.round((autoApproved / resolved) * 100) : 0;
    const escPct = resolved > 0 ? Math.round((escalated / resolved) * 100) : 0;

    return { total, autoApproved, escalated, pending, autoPct, escPct, resolved };
  }, [claims]);

  const handleAction = async (action, claim) => {
    try {
      let statusUpdate = {};
      if (action === 'approve') {
        statusUpdate = { status: 'APPROVED', approvedAmount: claim.claimAmount, notes: 'Claim approved by claims operations team.' };
      } else if (action === 'reject') {
        statusUpdate = { status: 'REJECTED', notes: 'Claim rejected by claims operations team.' };
      } else if (action === 'docs') {
        statusUpdate = { status: 'DOCS_NEEDED', notes: 'Additional documentation requested.' };
      }
      await claimService.updateClaimStatus(claim.id, statusUpdate);
      fetchClaims();
      closeModal();
    } catch (err) {
      console.error('Failed to update claim status', err);
    }
  };

  const currentAdjuster = modalClaim ? (adjusterMap[modalClaim.id] ?? modalClaim.adjuster ?? '') : '';
  const isFraudFlagged = modalClaim ? !!fraudFlagged[modalClaim.id] : false;
  const isHighValue = modalClaim && modalClaim.claimAmount >= 500000;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Claims Operations</h1>
            <p className="text-sm text-slate-500 mt-0.5">Admin queue for claim adjudication and SLA management</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Admin Only</span>
        </div>

        {/* Top Widgets Grid: KPIs + STP resolution chart */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* KPIs Section */}
          <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard icon={Inbox} label="Total in Queue" value={claims.length} subtext="Active claims" color="bg-blue-500" />
            <KpiCard icon={AlertTriangle} label="High Risk Flagged" value={claims.filter((c) => c.fraudRiskScore > 0.5).length} subtext="Fraud risk >50%" color="bg-rose-500" />
            <KpiCard
              icon={CreditCard}
              label="Pending Payouts"
              value={`₹${(totalPendingPayout / 100000).toFixed(1)}L`}
              subtext="Awaiting approval"
              color="bg-emerald-500"
            />
          </div>

          {/* STP Automated Triage Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Automated Triage (STP)</span>
              <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>STP Run Rate</span>
                <span className="font-bold text-slate-800">{stpMetrics.resolved} triaged</span>
              </div>
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100">
                <div className="bg-emerald-500 h-full" style={{ width: `${stpMetrics.autoPct}%` }} title={`Auto Approved: ${stpMetrics.autoPct}%`} />
                <div className="bg-purple-500 h-full" style={{ width: `${stpMetrics.escPct}%` }} title={`Escalated: ${stpMetrics.escPct}%`} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                  <span className="block text-xl font-bold text-emerald-700">{stpMetrics.autoPct}%</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Auto Resolved</span>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                  <span className="block text-xl font-bold text-purple-700">{stpMetrics.escPct}%</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Escalated</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs + Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 gap-4 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search claim or customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Inbox className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No claims found</p>
                <p className="text-sm mt-1">Try changing the filter or search query</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Claim No', 'Customer', 'Type', 'Amount', 'Risk Score', 'Triage Status', 'SLA Status', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => {
                    const slaDeadline = claim.submittedAt ? new Date(new Date(claim.submittedAt).getTime() + 7 * 24 * 3600 * 1000).toISOString() : null;
                    return (
                      <tr key={claim.id} className={`border-b border-slate-100 ${getSlaRowClass(slaDeadline)} hover:brightness-95 transition-all`}>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">{claim.claimNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-800">{claim.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[claim.claimType] || 'bg-slate-100 text-slate-600'}`}>
                            {claim.claimType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">₹{claim.claimAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3"><RiskBar score={claim.fraudRiskScore} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold w-max ${TRIAGE_BADGES[claim.triageResult]?.style || TRIAGE_BADGES.PENDING.style}`}>
                              {TRIAGE_BADGES[claim.triageResult]?.label || TRIAGE_BADGES.PENDING.label}
                            </span>
                            {claim.triageReason && (
                              <span className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={claim.triageReason}>
                                {claim.triageReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{slaDeadline ? <SLATimer deadline={slaDeadline} /> : <span className="text-slate-400">-</span>}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                            ${claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                              claim.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                              claim.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
                              claim.status === 'DOCS_NEEDED' ? 'bg-purple-100 text-purple-700' :
                              claim.status === 'PAID' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-blue-100 text-blue-700'}`}>
                            {STATUS_MAP[claim.status]?.label || claim.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openModal(claim)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {modalClaim && (
        <Modal isOpen={!!modalClaim} onClose={closeModal} title={`Review Claim — ${modalClaim.claimNumber}`} size="xl">
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Claim Info Grid */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Claim Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-slate-50 rounded-xl p-4">
                {[
                  ['Claim Number', modalClaim.claimNumber],
                  ['Customer', modalClaim.userName],
                  ['Claim Type', modalClaim.claimType],
                  ['Claim Amount', `₹${modalClaim.claimAmount.toLocaleString('en-IN')}`],
                  ['Status', STATUS_MAP[modalClaim.status]?.label || modalClaim.status],
                  ['Submitted On', new Date(modalClaim.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['Triage Status', TRIAGE_BADGES[modalClaim.triageResult]?.label || TRIAGE_BADGES.PENDING.label],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400 font-medium">{k}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{v}</p>
                  </div>
                ))}
                {modalClaim.triageReason && (
                  <div className="col-span-2 bg-slate-100 border border-slate-200 text-slate-700 p-3 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider">Triage Assessment</p>
                    <p className="text-sm mt-0.5">{modalClaim.triageReason}</p>
                  </div>
                )}
                {modalClaim.fraudReasons && (
                  <div className="col-span-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider">Fraud Risk Assessment Reasons</p>
                    <p className="text-sm mt-0.5">{modalClaim.fraudReasons}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-medium">Description</p>
                  <p className="text-sm text-slate-700 mt-0.5">{modalClaim.description}</p>
                </div>
              </div>
            </div>

            {/* Risk Gauge + Fraud Toggle */}
            <div className="flex items-start gap-6 flex-wrap">
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center min-w-fit">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Fraud Risk Score</p>
                <RiskGauge score={modalClaim.fraudRiskScore} />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Fraud Flag</p>
                  {isFraudFlagged ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-rose-600 text-sm font-semibold">
                        <Flag className="w-4 h-4" /> Manually Flagged for Fraud Investigation
                      </span>
                      <button
                        onClick={() => setFraudFlagged((f) => ({ ...f, [modalClaim.id]: false }))}
                        className="text-xs text-slate-500 underline hover:text-slate-700"
                      >
                        Remove Flag
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setFraudFlagged((f) => ({ ...f, [modalClaim.id]: true }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors"
                    >
                      <Flag className="w-4 h-4" /> Manual Fraud Flag
                    </button>
                  )}
                </div>
                <div>
                  {isHighValue ? (
                    <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-700 text-sm font-semibold border border-amber-200">
                      <AlertTriangle className="w-4 h-4" /> Requires Senior Manager Approval (≥ ₹5L)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold border border-emerald-200">
                      <CheckCircle className="w-4 h-4" /> Auto-Approve Eligible (&lt; ₹5L)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Document Checklist */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Document Verification Checklist
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'idProof', label: 'Identity Proof (Aadhaar / PAN)' },
                  { key: 'medicalReport', label: 'Medical / Incident Report' },
                  { key: 'firReport', label: 'FIR / Police Report (if applicable)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docChecks[key]}
                      onChange={(e) => setDocChecks((d) => ({ ...d, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className={`text-sm ${docChecks[key] ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                      {label}
                    </span>
                    {docChecks[key] && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </label>
                ))}
              </div>
            </div>

            {/* Adjuster Assignment */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Adjuster Assignment
              </h3>
              <div className="relative max-w-xs">
                <select
                  value={currentAdjuster}
                  onChange={(e) => setAdjusterMap((m) => ({ ...m, [modalClaim.id]: e.target.value }))}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                >
                  <option value="">— Select Adjuster —</option>
                  {MOCK_ADJUSTERS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Payout Details */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" /> Payout Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Payout Route</p>
                  <p className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                    Direct Bank Transfer (NEFT/IMPS)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Payout Amount</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                    ₹{modalClaim.claimAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {modalClaim.status !== 'APPROVED' && modalClaim.status !== 'REJECTED' && modalClaim.status !== 'PAID' && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
                <button
                  onClick={() => handleAction('approve', modalClaim)}
                  disabled={isHighValue}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                    isHighValue
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" /> Approve Claim
                </button>
                <button
                  onClick={() => handleAction('reject', modalClaim)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
                >
                  <XCircle className="w-4 h-4" /> Reject Claim
                </button>
                <button
                  onClick={() => handleAction('docs', modalClaim)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <FilePlus className="w-4 h-4" /> Request Additional Documents
                </button>
                <button onClick={closeModal} className="ml-auto text-sm text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
