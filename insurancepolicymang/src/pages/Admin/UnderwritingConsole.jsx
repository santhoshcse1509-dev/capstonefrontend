import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/common/Modal';
import underwritingService from '../../services/underwritingService';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  TrendingUp,
  User,
  XCircle,
  Activity,
  Inbox,
  ClipboardList,
  ArrowUpCircle,
} from 'lucide-react';

const FILTER_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Escalated'];

const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  ESCALATED: 'bg-purple-100 text-purple-700',
};

const DOCS_LIST = [
  { key: 'identity', label: 'Identity Proof (Aadhaar / PAN)' },
  { key: 'income', label: 'Income Proof (Salary Slip / ITR)' },
  { key: 'medical', label: 'Medical Examination Report' },
  { key: 'address', label: 'Address Proof' },
  { key: 'nominee', label: 'Nominee Verification Document' },
];

function getRiskLabel(score) {
  if (score >= 60) return { label: 'High', color: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' };
  if (score >= 30) return { label: 'Medium', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' };
  return { label: 'Low', color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' };
}

function RiskBadge({ score }) {
  const { label, color } = getRiskLabel(score);
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label}</span>
      <span className="text-xs text-slate-400">{score}%</span>
    </div>
  );
}

function RiskProgressBar({ score }) {
  const { bar } = getRiskLabel(score);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">Risk Score</span>
        <span className="font-bold text-slate-700">{score}/100</span>
      </div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div className={`${bar} h-3 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
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

export default function UnderwritingConsole() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalApp, setModalApp] = useState(null);
  const [docChecks, setDocChecks] = useState({});
  const [riskNotes, setRiskNotes] = useState({});
  const [actionResult, setActionResult] = useState(null); // { type: 'success'|'error', message }

  const fetchApplications = () => {
    setLoading(true);
    underwritingService.getApplicationQueue()
      .then((res) => {
        setApplications(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load applications', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openModal = (app) => {
    setModalApp(app);
    setDocChecks({ identity: false, income: false, medical: false, address: false, nominee: false });
    setActionResult(null);
  };
  const closeModal = () => { setModalApp(null); setActionResult(null); };

  const filteredApps = useMemo(() => {
    let list = applications;
    if (search.trim()) {
      list = list.filter(
        (a) =>
          a.appId.toLowerCase().includes(search.toLowerCase()) ||
          a.applicantName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (activeTab !== 'All') {
      list = list.filter((a) => a.status === activeTab.toUpperCase());
    }
    return list;
  }, [applications, activeTab, search]);

  const avgRisk = applications.length
    ? Math.round(applications.reduce((s, a) => s + a.riskScore, 0) / applications.length)
    : 0;
  const highValue = applications.filter((a) => a.sumAssured > 1000000).length;

  const allDocsChecked = modalApp
    ? DOCS_LIST.every(({ key }) => docChecks[key])
    : false;
  const isHighValueCase = modalApp && modalApp.sumAssured > 5000000;

  const handleAction = async (action) => {
    if (!modalApp) return;
    try {
      if (action === 'approve') {
        await underwritingService.approveApplication(modalApp.id);
      } else if (action === 'reject') {
        const reason = riskNotes[modalApp.id] || 'Rejected by Underwriter';
        await underwritingService.rejectApplication(modalApp.id, { reason });
      } else if (action === 'escalate') {
        await underwritingService.escalateApplication(modalApp.id);
      }

      setActionResult({
        type: action === 'reject' ? 'error' : 'success',
        message:
          action === 'approve'
            ? `Application ${modalApp.appId} approved successfully.`
            : action === 'reject'
            ? `Application ${modalApp.appId} has been rejected.`
            : `Application ${modalApp.appId} escalated to Senior Underwriter.`,
      });
      fetchApplications();
      setTimeout(closeModal, 1500);
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err.message || 'Underwriting operation failed'
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Underwriting Console</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review and adjudicate new insurance applications</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Admin Only</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={ClipboardList} label="Pending Applications" value={applications.filter((a) => a.status === 'PENDING' || a.status === 'ESCALATED').length} subtext="Awaiting decision" color="bg-blue-500" />
          <KpiCard icon={Activity} label="Avg Risk Score" value={`${avgRisk}/100`} subtext="Portfolio risk level" color="bg-amber-500" />
          <KpiCard icon={TrendingUp} label="High Value Cases" value={highValue} subtext="Sum Assured > ₹10L" color="bg-purple-500" />
        </div>

        {/* Table Card */}
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
                placeholder="Search application or applicant…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Inbox className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No applications found</p>
                <p className="text-sm mt-1">Try adjusting filters or search query</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['App ID', 'Applicant', 'Product', 'Sum Assured', 'Risk Score', 'Submitted', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-700">{app.appId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{app.applicantName}</p>
                            <p className="text-xs text-slate-400">Age {app.age} · {app.occupation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{app.product}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        ₹{app.sumAssured.toLocaleString('en-IN')}
                        {app.sumAssured > 5000000 && (
                          <span className="ml-1 text-xs text-purple-600 font-medium">(High Value)</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><RiskBadge score={app.riskScore} /></td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[app.status] || 'bg-slate-100 text-slate-600'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal(app)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {modalApp && (
        <Modal isOpen={!!modalApp} onClose={closeModal} title={`Underwriting Review — ${modalApp.appId}`} size="xl">
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Applicant Details */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Applicant Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-slate-50 rounded-xl p-4">
                {[
                  ['Application ID', modalApp.appId],
                  ['Applicant Name', modalApp.applicantName],
                  ['Age', `${modalApp.age} years`],
                  ['Occupation', modalApp.occupation],
                  ['Product', modalApp.product],
                  ['Sum Assured', `₹${modalApp.sumAssured.toLocaleString('en-IN')}`],
                  ['Current Status', modalApp.status],
                  ['Submitted', new Date(modalApp.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400 font-medium">{k}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{v}</p>
                  </div>
                ))}
                {modalApp.rejectionReason && (
                  <div className="col-span-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl">
                    <p className="text-xs font-bold uppercase">Rejection Reason</p>
                    <p className="text-sm mt-0.5">{modalApp.rejectionReason}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-medium">Medical History</p>
                  <p className="text-sm text-slate-700 mt-0.5">{modalApp.medicalHistory}</p>
                </div>
              </div>
            </div>

            {/* Risk Score Visual */}
            <div className="bg-slate-50 rounded-xl p-4">
              <RiskProgressBar score={modalApp.riskScore} />
              <p className="text-xs text-slate-400 mt-2">
                Risk Level: <span className="font-semibold text-slate-600">{getRiskLabel(modalApp.riskScore).label}</span> — Score calculated from smoker status, BMI category, age, and risk zone values.
              </p>
            </div>

            {/* High Value Warning */}
            {isHighValueCase && (
              <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-800">High Value Case: Requires Chief Underwriter Sign-off</p>
                  <p className="text-xs text-purple-600 mt-0.5">Sum Assured exceeds ₹50L. Direct approval is disabled. Use the Escalate button below.</p>
                </div>
              </div>
            )}

            {/* Document Checklist */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Document Verification Checklist
              </h3>
              {!allDocsChecked && (
                <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> All documents must be verified before approving.
                </p>
              )}
              <div className="space-y-2">
                {DOCS_LIST.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!docChecks[key]}
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

            {/* Risk Notes */}
            {modalApp.status !== 'APPROVED' && modalApp.status !== 'REJECTED' && (
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Underwriter Risk / Rejection Notes</h3>
                <textarea
                  rows={3}
                  value={riskNotes[modalApp.id] ?? ''}
                  onChange={(e) => setRiskNotes((n) => ({ ...n, [modalApp.id]: e.target.value }))}
                  placeholder="Add internal risk notes or rejection reason here…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* Action Result Inline */}
            {actionResult && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${actionResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {actionResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {actionResult.message}
              </div>
            )}

            {/* Action Buttons */}
            {modalApp.status !== 'APPROVED' && modalApp.status !== 'REJECTED' && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={!allDocsChecked || isHighValueCase}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                    !allDocsChecked || isHighValueCase
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleAction('escalate')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm"
                >
                  <ArrowUpCircle className="w-4 h-4" /> Escalate
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
