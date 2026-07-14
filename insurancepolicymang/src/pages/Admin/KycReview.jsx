import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../hooks/useNotification';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { FileText, Eye, CheckCircle2, XCircle, Search, Mail, Phone, Calendar, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

const KycReview = () => {
  const notification = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Document preview modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // POI reference panel toggle
  const [showPoiRef, setShowPoiRef] = useState(false);

  useEffect(() => {
    fetchPendingKyc();
  }, []);

  const fetchPendingKyc = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingKyc();
      setRequests(data || []);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to fetch pending KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this KYC?')) return;
    try {
      await adminService.verifyKyc(userId);
      notification.success('KYC documents verified successfully.');
      fetchPendingKyc();
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to approve KYC');
    }
  };

  const handleOpenRejectModal = (user) => {
    setSelectedUser(user);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      notification.warning('Please enter a rejection reason.');
      return;
    }
    try {
      await adminService.rejectKyc(selectedUser.userId, rejectionReason);
      notification.success('KYC submission rejected.');
      setIsRejectModalOpen(false);
      fetchPendingKyc();
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to reject KYC');
    }
  };

  const handlePreview = (doc) => {
    setPreviewDoc(doc);
    setIsPreviewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">KYC Document Review</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review uploaded customer identification documents for identity verification</p>
        </div>

        {/* POI Reference Panel */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPoiRef(prev => !prev)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Info size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Accepted Proof of Identity (POI) Documents</p>
                <p className="text-xs text-slate-500 font-medium">Click to {showPoiRef ? 'hide' : 'view'} accepted document types</p>
              </div>
            </div>
            {showPoiRef ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          {showPoiRef && (
            <div className="px-6 pb-5 border-t border-blue-50">
              <p className="text-xs text-slate-500 font-semibold mt-4 mb-3">
                Customers must submit <span className="font-bold text-slate-700">one</span> of the following officially valid documents:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { icon: '🪪', label: 'Aadhaar Card', note: null },
                  { icon: '💳', label: 'PAN Card (Mandatory for financial transactions)', note: 'Required for financial transactions' },
                  { icon: '📘', label: 'Passport', note: null },
                  { icon: '🚗', label: 'Driving License', note: null },
                  { icon: '🗳️', label: "Voter's Identity Card", note: null },
                ].map((doc) => (
                  <div key={doc.label} className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-base mt-0.5">{doc.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.label}</p>
                      {doc.note && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{doc.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/10 border-t-blue-600"></div>
            <span className="text-sm font-bold text-slate-400">Loading pending KYC files...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mt-1">No pending KYC document verification requests exist right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div key={req.userId} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6 hover:shadow-md hover:border-slate-200/60 transition-all duration-300">
                {/* User Info */}
                <div className="flex items-start justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/10">
                      {req.firstName.charAt(0)}{req.lastName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-lg">{req.firstName} {req.lastName}</span>
                      <span className="text-xs text-slate-400 font-semibold">User ID: {req.userId}</span>
                    </div>
                  </div>
                  <Badge variant="warning">PENDING</Badge>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-bold bg-slate-50/50 p-3 rounded-xl">
                  <span className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    {req.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    {req.phone || 'No phone number'}
                  </span>
                </div>

                {/* Documents list */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Documents ({req.documents?.length || 0})</span>
                  {req.documents?.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold border border-amber-100">
                      <AlertCircle size={16} />
                      No documents found with documentType=KYC.
                    </div>
                  ) : (
                    req.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/60 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={18} className="text-blue-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate">{doc.fileName}</span>
                            {doc.description && (
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide truncate">{doc.description}</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{doc.mimeType || 'unknown'} • {(doc.fileSize / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreview(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                        >
                          <Eye size={13} />
                          Preview
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Approve/Reject actions */}
                <div className="flex gap-3 pt-2 border-t border-slate-50 mt-auto">
                  <button
                    onClick={() => handleOpenRejectModal(req)}
                    className="flex-1 py-2.5 text-xs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <XCircle size={16} />
                    Reject Submission
                  </button>
                  <button
                    onClick={() => handleApprove(req.userId)}
                    disabled={req.documents?.length === 0}
                    className={`flex-1 py-2.5 text-xs font-extrabold text-white rounded-xl flex items-center justify-center gap-2 shadow-md transition-all ${
                      req.documents?.length === 0
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    Verify & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Document Preview */}
        <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)}>
          <div className="flex flex-col gap-4 max-w-full p-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{previewDoc?.fileName}</h3>
                <span className="text-[10px] text-slate-400 font-semibold">{previewDoc?.mimeType}</span>
              </div>
            </div>
            
            {/* View container */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden min-h-[300px] max-h-[500px] flex items-center justify-center p-2">
              {previewDoc?.mimeType?.startsWith('image/') ? (
                <img 
                  src={previewDoc.fileUrl} 
                  alt={previewDoc.fileName}
                  className="max-w-full max-h-[450px] object-contain rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 gap-3">
                  <FileText size={48} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Non-Image Document Format</span>
                  <p className="text-xs text-slate-400 max-w-xs font-semibold">This document is not a direct image format (likely a PDF or doc). Click below to view or download.</p>
                  <a
                    href={previewDoc?.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all"
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Rejection Reason */}
        <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)}>
          <div className="flex flex-col gap-4 p-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject KYC Submission</h3>
                <p className="text-xs text-slate-400 font-semibold">For {selectedUser?.firstName} {selectedUser?.lastName}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reason for Rejection</label>
              <textarea
                placeholder="Explain why these documents were rejected (e.g. Blurry photo, mismatch with profile name, expired ID...)"
                rows="4"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />
              <p className="text-xs text-slate-400 font-semibold mt-1">
                * The customer will receive an email stating their submission was rejected along with this explanation.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-500/10 transition-all"
              >
                Reject Submission
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default KycReview;
