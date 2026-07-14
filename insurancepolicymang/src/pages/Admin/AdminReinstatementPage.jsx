import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../hooks/useNotification';
import { CheckCircle, XCircle, FileText, User, ShieldAlert, Loader2 } from 'lucide-react';
import Badge from '../../components/common/Badge';

const AdminReinstatementPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [rejectionModalId, setRejectionModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const notification = useNotification();

  useEffect(() => {
    fetchReinstatements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReinstatements = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingReinstatements();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      notification.error('Failed to load reinstatement requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this reinstatement? This will restore the policy to ACTIVE status.')) return;
    setProcessingId(id);
    try {
      await adminService.approveReinstatement(id);
      notification.success('Reinstatement approved successfully!');
      fetchReinstatements();
    } catch (err) {
      notification.error(err?.response?.data?.message || 'Approval failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectionModalId(id);
    setRejectionReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      notification.error('Please enter a rejection reason.');
      return;
    }
    const id = rejectionModalId;
    setProcessingId(id);
    setRejectionModalId(null);
    try {
      await adminService.rejectReinstatement(id, rejectionReason);
      notification.success('Reinstatement request rejected successfully.');
      fetchReinstatements();
    } catch (err) {
      notification.error(err?.response?.data?.message || 'Rejection failed.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Reinstatement Approvals</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Review and approve reinstatement requests for lapsed customer policies
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-slate-700 font-bold text-lg">All caught up!</p>
              <p className="text-slate-400 text-sm mt-1">No pending policy reinstatement requests found.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6">Policy details</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">KYC Status</th>
                    <th className="p-4">Overdue Premium Paid</th>
                    <th className="p-4">Request Date</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{req.policyNumber}</span>
                            <span className="text-xs text-slate-400 font-semibold block">ID: {req.customerPolicyId?.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span className="font-bold text-slate-900">{req.customerName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={req.kycStatus === 'VERIFIED' ? 'success' : 'warning'}>
                          {req.kycStatus}
                        </Badge>
                      </td>
                      <td className="p-4 font-black text-slate-900">
                        ₹{Number(req.overduePremiumPaid || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {req.requestDate ? new Date(req.requestDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleApprove(req.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 transition-all disabled:opacity-50"
                          >
                            {processingId === req.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle size={12} />
                            )}
                            Approve
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleOpenRejectModal(req.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-100 transition-all disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Rejection Reason Modal ── */}
        {rejectionModalId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 w-full max-w-md shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reject Reinstatement</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Please provide a reason for rejecting this reinstatement request.</p>
                </div>
              </div>

              <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Overdue payment amount mismatch, pending medical verification, etc..."
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 text-sm font-semibold"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectionModalId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow transition-all"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReinstatementPage;
