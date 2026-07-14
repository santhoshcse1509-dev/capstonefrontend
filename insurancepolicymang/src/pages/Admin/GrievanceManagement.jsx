import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/common/Modal';
import SLATimer from '../../components/common/SLATimer';
import grievanceService from '../../services/grievanceService';
import { useNotification } from '../../hooks/useNotification';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Search,
  TrendingDown,
  User,
  XCircle,
  Inbox,
  CalendarCheck,
  BarChart3,
  ArrowUpCircle,
  MessageCircle,
} from 'lucide-react';

const ROOT_CAUSE_OPTIONS = [
  '— Select Root Cause —',
  'Processing backlog',
  'System/technical error',
  'Agent misconduct',
  'Documentation missing',
  'Policy terms dispute',
  'Third-party delay',
  'Fraud investigation hold',
  'Server outage',
];

const STATUS_ACTIONS = [
  { key: 'IN_PROGRESS', label: 'Mark In Progress', color: 'bg-amber-500 text-white hover:bg-amber-600' },
  { key: 'RESOLVED', label: 'Resolve', color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  { key: 'ESCALATED', label: 'Escalate', color: 'bg-rose-600 text-white hover:bg-rose-700' },
  { key: 'CLOSED', label: 'Close', color: 'bg-slate-600 text-white hover:bg-slate-700' },
];

const STATUS_STYLE = {
  OPEN: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  ESCALATED: 'bg-rose-100 text-rose-700',
  CLOSED: 'bg-slate-200 text-slate-800',
};

const STATUS_LABEL = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
};

const CATEGORY_STYLE = {
  CLAIM_DELAY: 'bg-rose-100 text-rose-700',
  BILLING_ERROR: 'bg-amber-100 text-amber-700',
  MIS_SELLING: 'bg-purple-100 text-purple-700',
  TECHNICAL_ISSUE: 'bg-blue-100 text-blue-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

const CATEGORY_LABEL = {
  CLAIM_DELAY: 'Claims Delay',
  BILLING_ERROR: 'Billing Error',
  MIS_SELLING: 'Mis-selling',
  TECHNICAL_ISSUE: 'Technical Issue',
  OTHER: 'Other',
};

const CHANNEL_FILTERS = ['All', 'App', 'Email', 'Call Centre'];
const CATEGORY_FILTERS = ['All', 'Claims Delay', 'Billing Error', 'Mis-selling', 'Technical Issue', 'Other'];
const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Escalated', 'Closed'];

function ChannelIcon({ channel }) {
  const base = 'w-4 h-4';
  if (channel === 'APP') return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
      <MessageSquare className={base} /> App
    </span>
  );
  if (channel === 'EMAIL') return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
      <Mail className={base} /> Email
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
      <Phone className={base} /> Call
    </span>
  );
}

function isOverdue(slaDeadline) {
  if (!slaDeadline) return false;
  return new Date(slaDeadline).getTime() < Date.now();
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

export default function GrievanceManagement() {
  const notification = useNotification();
  const [grievances, setGrievances] = useState([]);
  const [modalGrievance, setModalGrievance] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal state
  const [rootCause, setRootCause] = useState({});
  const [internalNote, setInternalNote] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await grievanceService.getAdminTickets();
      if (res.success) {
        setGrievances(res.data);
      }
    } catch (err) {
      notification.error('Failed to load tickets');
      console.error(err);
    }
  };

  const openModal = async (g) => {
    setModalGrievance(g);
    setActionFeedback(null);
    setTicketHistory([]);
    try {
      const res = await grievanceService.getTicketHistory(g.id);
      if (res.success) {
        setTicketHistory(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const closeModal = () => { setModalGrievance(null); setActionFeedback(null); };

  const filteredGrievances = useMemo(() => {
    let list = grievances;

    if (search.trim()) {
      list = list.filter(
        (g) =>
          g.ticketId?.toLowerCase().includes(search.toLowerCase()) ||
          g.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          g.subject?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const chanMap = { App: 'APP', Email: 'EMAIL', 'Call Centre': 'CALL_CENTER' };
    if (channelFilter !== 'All') list = list.filter((g) => g.channel === chanMap[channelFilter]);

    const catMap = {
      'Claims Delay': 'CLAIM_DELAY',
      'Billing Error': 'BILLING_ERROR',
      'Mis-selling': 'MIS_SELLING',
      'Technical Issue': 'TECHNICAL_ISSUE',
      'Other': 'OTHER'
    };
    if (categoryFilter !== 'All') list = list.filter((g) => g.issueType === catMap[categoryFilter]);

    const statMap = {
      Open: 'OPEN',
      'In Progress': 'IN_PROGRESS',
      Resolved: 'RESOLVED',
      Escalated: 'ESCALATED',
      Closed: 'CLOSED'
    };
    if (statusFilter !== 'All') list = list.filter((g) => g.status === statMap[statusFilter]);

    return list;
  }, [grievances, search, channelFilter, categoryFilter, statusFilter]);

  const totalOpen = grievances.filter((g) => g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
  const slaBreached = grievances.filter((g) => isOverdue(g.slaDueDate) && g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
  const resolvedThisMonth = grievances.filter((g) => g.status === 'RESOLVED' || g.status === 'CLOSED').length;

  const handleStatusAction = async (newStatus) => {
    if (!modalGrievance) return;
    try {
      const note = internalNote[modalGrievance.id] || `Status changed to ${newStatus}`;
      const res = await grievanceService.updateTicketStatus(modalGrievance.id, {
        status: newStatus,
        notes: note,
        resolutionNotes: (newStatus === 'RESOLVED' || newStatus === 'CLOSED') ? note : null
      });
      if (res.success) {
        setGrievances((prev) => prev.map((g) => (g.id === modalGrievance.id ? res.data : g)));
        setActionFeedback({
          type: newStatus === 'ESCALATED' ? 'warning' : newStatus === 'RESOLVED' ? 'success' : 'info',
          message: `Ticket ${modalGrievance.ticketId} marked as ${STATUS_LABEL[newStatus]}.`,
        });
        notification.success(`Ticket marked as ${STATUS_LABEL[newStatus]}`);
        setInternalNote(n => ({...n, [modalGrievance.id]: ''}));
        setTimeout(closeModal, 1500);
      }
    } catch (err) {
      notification.error('Failed to update status');
      console.error(err);
    }
  };

  const currentRootCause = modalGrievance ? (rootCause[modalGrievance.id] ?? '') : '';
  const currentNote = modalGrievance ? (internalNote[modalGrievance.id] ?? '') : '';

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Grievance Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track, assign, and resolve customer grievances with SLA compliance</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Admin Only</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard icon={Inbox} label="Total Open" value={totalOpen} subtext="Unresolved tickets" color="bg-blue-500" />
          <KpiCard icon={AlertTriangle} label="SLA Breached" value={slaBreached} subtext="Overdue & unresolved" color="bg-rose-500" />
          <KpiCard icon={CalendarCheck} label="Resolved This Month" value={resolvedThisMonth} subtext="Closed tickets" color="bg-emerald-500" />
          <KpiCard icon={BarChart3} label="Avg Resolution Days" value="5.3" subtext="IRDAI target: 15 days" color="bg-amber-500" />
        </div>

        {/* Filters + Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, customer or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Channel Filter */}
            <div className="relative">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7"
              >
                {CHANNEL_FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7"
              >
                {CATEGORY_FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7"
              >
                {STATUS_FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            {filteredGrievances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Inbox className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No grievances found</p>
                <p className="text-sm mt-1">Adjust your filters or search query</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Ticket ID', 'Customer', 'Channel', 'Category', 'Subject', 'Status', 'SLA Deadline', 'Assigned To', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGrievances.map((g) => {
                    const overdue = isOverdue(g.slaDeadline) && g.status !== 'RESOLVED';
                    return (
                      <tr
                        key={g.id}
                        className={`border-b border-slate-100 transition-colors ${overdue ? 'bg-rose-50 border-l-4 border-rose-400 hover:bg-rose-100' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">{g.ticketId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="font-medium text-slate-800">{g.customerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><ChannelIcon channel={g.channel} /></td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_STYLE[g.issueType] || 'bg-slate-100 text-slate-600'}`}>
                            {CATEGORY_LABEL[g.issueType] || g.issueType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={g.subject}>{g.subject}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[g.status] || 'bg-slate-100 text-slate-600'}`}>
                            {STATUS_LABEL[g.status] || g.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <SLATimer deadline={g.slaDueDate} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{g.assignedToName}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openModal(g)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                          >
                            Handle
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

      {/* Handle Modal */}
      {modalGrievance && (
        <Modal isOpen={!!modalGrievance} onClose={closeModal} title={`Handle Ticket — ${modalGrievance.ticketId}`} size="xl">
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Ticket Details */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Ticket Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-slate-50 rounded-xl p-4">
                {[
                  ['Ticket ID', modalGrievance.ticketId],
                  ['Customer', modalGrievance.customerName],
                  ['Channel', modalGrievance.channel],
                  ['Category', CATEGORY_LABEL[modalGrievance.issueType] || modalGrievance.issueType],
                  ['Current Status', STATUS_LABEL[modalGrievance.status] || modalGrievance.status],
                  ['Assigned To', modalGrievance.assignedToName],
                  ['Raised On', new Date(modalGrievance.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['SLA Deadline', modalGrievance.slaDueDate ? new Date(modalGrievance.slaDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400 font-medium">{k}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{v}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-medium">Subject / Complaint</p>
                  <p className="text-sm text-slate-700 mt-0.5">{modalGrievance.subject}</p>
                </div>
              </div>
            </div>

            {/* SLA Breach Warning */}
            {isOverdue(modalGrievance.slaDueDate) && modalGrievance.status !== 'RESOLVED' && modalGrievance.status !== 'CLOSED' && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-rose-800">SLA Breached</p>
                  <p className="text-xs text-rose-600 mt-0.5">This ticket has exceeded its response SLA. Immediate action required to avoid IRDAI non-compliance.</p>
                </div>
              </div>
            )}

            {/* Comment Thread */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-600" /> Comment Thread
              </h3>
              <div className="space-y-3">
                {ticketHistory.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-3 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">{c.updatedBy}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                          {new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{c.notes}</p>
                      <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[c.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </div>
                  </div>
                ))}
                {ticketHistory.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No history available.</p>
                )}
              </div>
            </div>

            {/* Root Cause + Internal Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Root Cause Tag</h3>
                <div className="relative">
                  <select
                    value={currentRootCause}
                    onChange={(e) => setRootCause((r) => ({ ...r, [modalGrievance.id]: e.target.value }))}
                    className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    {ROOT_CAUSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt === '— Select Root Cause —' ? '' : opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Internal Note</h3>
                <textarea
                  rows={3}
                  value={currentNote}
                  onChange={(e) => setInternalNote((n) => ({ ...n, [modalGrievance.id]: e.target.value }))}
                  placeholder="Add an internal note (not visible to customer)…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Escalation Path */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" /> Escalation Path
              </h3>
              <div className="flex items-center gap-2 text-sm text-amber-700 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-semibold">Branch Manager</span>
                <span className="text-amber-400">→</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-semibold">Regional Head</span>
                <span className="text-amber-400">→</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-semibold">IRDAI Ombudsman</span>
              </div>
              <p className="text-xs text-amber-600 mt-2">Unresolved SLA-breached tickets are automatically flagged to IRDAI after 30 days.</p>
            </div>

            {/* Action Feedback */}
            {actionFeedback && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                actionFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                actionFeedback.type === 'warning' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {actionFeedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {actionFeedback.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
              {STATUS_ACTIONS.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => handleStatusAction(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${color}`}
                >
                  {key === 'RESOLVED' && <CheckCircle className="w-4 h-4" />}
                  {key === 'CLOSED' && <CheckCircle className="w-4 h-4" />}
                  {key === 'ESCALATED' && <ArrowUpCircle className="w-4 h-4" />}
                  {key === 'IN_PROGRESS' && <Clock className="w-4 h-4" />}
                  {label}
                </button>
              ))}
              <button onClick={closeModal} className="ml-auto text-sm text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
