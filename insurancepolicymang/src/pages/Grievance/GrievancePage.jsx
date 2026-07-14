import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import SLATimer from '../../components/common/SLATimer';
import FileUploader from '../../components/common/FileUploader';
import { useNotification } from '../../hooks/useNotification';
import grievanceService from '../../services/grievanceService';
import {
  MessageCircle, Plus, ChevronRight, AlertCircle,
  CheckCircle2, Clock
} from 'lucide-react';

const CATEGORY_CONFIG = {
  CLAIMS_DELAY: { label: 'Claims Delay', color: 'bg-rose-100 text-rose-700' },
  BILLING_ERROR: { label: 'Billing Error', color: 'bg-amber-100 text-amber-700' },
  MIS_SELLING: { label: 'Mis-Selling', color: 'bg-purple-100 text-purple-700' },
  SERVICE_QUALITY: { label: 'Service Quality', color: 'bg-blue-100 text-blue-700' },
  OTHER: { label: 'Other', color: 'bg-slate-100 text-slate-700' },
};

const STATUS_CONFIG = {
  OPEN: { label: 'Open', variant: 'error' },
  ACKNOWLEDGED: { label: 'Acknowledged', variant: 'warning' },
  IN_REVIEW: { label: 'In Review', variant: 'warning' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  ESCALATED: { label: 'Escalated', variant: 'error' },
};

const STATUS_STEPS = ['OPEN', 'ACKNOWLEDGED', 'IN_REVIEW', 'RESOLVED'];

const GrievancePage = () => {
  const notification = useNotification();
  const [tickets, setTickets] = useState([]);
  const [openRaise, setOpenRaise] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  const [form, setForm] = useState({
    issueType: 'CLAIM_DELAY',
    subject: '',
    description: '',
  });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await grievanceService.getMyTickets();
      if (res.success) {
        setTickets(res.data);
      }
    } catch (err) {
      notification.error('Failed to load grievances');
    }
  }, [notification]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketHistory([]);
    try {
      const res = await grievanceService.getTicketHistory(ticket.id);
      if (res.success) {
        setTicketHistory(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stats = {
    open: tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    avgDays: '6.4',
  };

  const handleFormChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        channel: 'APP',
        issueType: form.issueType,
        subject: form.subject,
        description: form.description
      };
      const res = await grievanceService.createTicket(payload);
      if (res.success) {
        notification.success('Grievance submitted successfully!');
        setTickets(p => [res.data, ...p]);
        setOpenRaise(false);
        setForm({ issueType: 'CLAIM_DELAY', subject: '', description: '' });
      }
    } catch (err) {
      notification.error('Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Grievances</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Raise and track complaints about claims, billing, or service quality</p>
          </div>
          <button
            onClick={() => setOpenRaise(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus size={16} /> Raise Grievance
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Tickets', value: stats.open, icon: AlertCircle, color: 'rose' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'emerald' },
            { label: 'Avg Resolution', value: `${stats.avgDays} days`, icon: Clock, color: 'blue' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Escalation Info Banner */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 font-semibold">
            <strong>Escalation Policy:</strong> Unresolved grievances automatically escalate to the Divisional Manager after 7 days, and to the IRDAI Insurance Ombudsman after 15 days per IRDAI regulations (IRDA/CAGR/GDL/MISC/173/10/2017).
          </div>
        </div>

        {/* Ticket Cards */}
        <div className="flex flex-col gap-4">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white border border-slate-100 rounded-2xl">
              <MessageCircle size={40} className="text-slate-300" />
              <p className="text-slate-500 font-semibold">No grievances raised yet.</p>
              <p className="text-xs text-slate-400 font-medium">If you have a complaint about claims, billing, or service, raise a grievance here.</p>
            </div>
          ) : (
            tickets.map(ticket => {
              const catCfg = CATEGORY_CONFIG[ticket.issueType] || CATEGORY_CONFIG.OTHER;
              const statusCfg = STATUS_CONFIG[ticket.status] || { label: ticket.status, variant: 'neutral' };
              const stepIdx = STATUS_STEPS.indexOf(ticket.status);

              return (
                <div key={ticket.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-500">{ticket.ticketId}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catCfg.color}`}>{catCfg.label}</span>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-400 font-semibold">Ref: {ticket.policyRef}</span>
                        <span className="text-xs text-slate-400 font-semibold">Raised: {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <SLATimer deadline={ticket.slaDueDate} label="SLA" />
                      <button
                        onClick={() => handleOpenTicket(ticket)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-1">
                      {STATUS_STEPS.map((step, i) => {
                        const isComplete = i < stepIdx || (ticket.status === 'RESOLVED' && i <= 3);
                        const isCurrent = i === stepIdx && ticket.status !== 'RESOLVED';
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-2 h-2 rounded-full transition-all ${isComplete || ticket.status === 'RESOLVED' ? 'bg-blue-600' : isCurrent ? 'bg-blue-400 ring-2 ring-blue-200' : 'bg-slate-200'}`} />
                              <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap capitalize">{step.replace('_', ' ').toLowerCase()}</span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mb-3 ${i < stepIdx || ticket.status === 'RESOLVED' ? 'bg-blue-600' : 'bg-slate-200'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Escalation Path */}
                  <div className="px-5 pb-4">
                    <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <ChevronRight size={10} />
                      Auto-escalates: Branch Officer → Divisional Manager → IRDAI Ombudsman if unresolved
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Raise Grievance Modal ── */}
      <Modal isOpen={openRaise} onClose={() => setOpenRaise(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-500" /> Raise a Grievance
            </h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Your complaint will be acknowledged within 24 hours</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              name="issueType"
              value={form.issueType}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 text-sm font-semibold"
            >
              <option value="CLAIM_DELAY">Claims Delay</option>
              <option value="BILLING_ERROR">Billing Error</option>
              <option value="MIS_SELLING">Mis-Selling</option>
              <option value="TECHNICAL_ISSUE">Technical Issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <Input
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={handleFormChange}
            placeholder="Brief summary of your complaint"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows={4}
              placeholder="Describe your issue in detail — include dates, amounts, and any communication you've had..."
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 text-sm font-semibold resize-none"
            />
          </div>

          <Input
            label="Reference Policy Number (optional)"
            name="policyRef"
            value={form.policyRef}
            onChange={handleFormChange}
            placeholder="e.g. POL-2024-0012"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Supporting Evidence (optional)</label>
            <FileUploader
              files={evidenceFiles}
              onChange={setEvidenceFiles}
              maxFiles={3}
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 font-semibold">SLA: 7 days for resolution. You'll receive email updates at every stage. Unresolved grievances auto-escalate per IRDAI guidelines.</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setOpenRaise(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Grievance</Button>
          </div>
        </form>
      </Modal>

      {/* ── Ticket Detail Modal ── */}
      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)}>
        {selectedTicket && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedTicket.ticketId}</h3>
                <p className="text-sm text-slate-500 font-medium">{selectedTicket.subject}</p>
              </div>
              <Badge variant={STATUS_CONFIG[selectedTicket.status]?.variant || 'neutral'}>
                {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 text-sm">
              {[
                ['Category', CATEGORY_CONFIG[selectedTicket.issueType]?.label || selectedTicket.issueType],
                ['Policy Ref', selectedTicket.policyRef || 'N/A'],
                ['Raised On', new Date(selectedTicket.createdAt).toLocaleDateString('en-IN')],
                ['SLA Deadline', selectedTicket.slaDueDate ? new Date(selectedTicket.slaDueDate).toLocaleDateString('en-IN') : 'N/A'],
              ].map(([label, val]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
                  <span className="font-bold text-slate-800">{val}</span>
                </div>
              ))}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Description</span>
              <p className="text-sm text-slate-700 font-medium mt-1.5 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {/* Comment Thread */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-3">Updates</span>
              <div className="flex flex-col gap-3">
                {ticketHistory?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold">No updates yet.</p>
                ) : (
                  ticketHistory.map((c, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-600">{c.updatedBy}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{c.notes}</p>
                      <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-800`}>
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Escalation Path */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-800 mb-1">Escalation Path</p>
              <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold">
                <span className="bg-amber-100 px-2 py-0.5 rounded">Branch Officer</span>
                <ChevronRight size={12} />
                <span className="bg-amber-100 px-2 py-0.5 rounded">Divisional Manager</span>
                <ChevronRight size={12} />
                <span className="bg-amber-100 px-2 py-0.5 rounded">IRDAI Ombudsman</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default GrievancePage;
