import React, { useEffect, useState, useRef } from 'react';
import claimService from '../../services/claimService';
import { FileText, Search, FileCheck, CheckCircle, CreditCard, XCircle } from 'lucide-react';

const steps = [
    { id: 'SUBMITTED', label: 'Submitted', icon: FileText },
    { id: 'UNDER_REVIEW', label: 'Under Review', icon: Search },
    { id: 'DOCUMENTS_VERIFIED', label: 'Docs Verified', icon: FileCheck },
    { id: 'APPROVED', label: 'Approved', icon: CheckCircle },
    { id: 'PAID', label: 'Payment Settled', icon: CreditCard }
];

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
};

export const ClaimTracker = ({ claimId, initialStatus }) => {
    const [currentStatus, setCurrentStatus] = useState(initialStatus || 'SUBMITTED');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef(null);

    const fetchHistory = async () => {
        try {
            const response = await claimService.getClaimHistory(claimId);
            if (response?.data) {
                setHistory(response.data);
                if (response.data.length > 0) {
                    setCurrentStatus(response.data[response.data.length - 1].status);
                }
            }
        } catch (error) {
            console.error('Failed to fetch claim history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();

        // Native WebSocket with STOMP framing (no library required)
        try {
            const ws = new WebSocket(`ws://localhost:8080/ws-insurance/websocket`);
            wsRef.current = ws;

            ws.onopen = () => {
                // STOMP CONNECT frame
                ws.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0');
            };

            ws.onmessage = (event) => {
                const raw = event.data;
                if (raw.startsWith('CONNECTED')) {
                    // Subscribe after connected
                    ws.send(`SUBSCRIBE\nid:sub-0\ndestination:/topic/claims/${claimId}\n\n\0`);
                } else if (raw.startsWith('MESSAGE')) {
                    try {
                        // Extract JSON body after the blank line
                        const body = raw.split('\n\n')[1]?.replace('\0', '');
                        if (body) {
                            const update = JSON.parse(body);
                            if (update.status) setCurrentStatus(update.status);
                            fetchHistory();
                        }
                    } catch { /* ignore parse errors */ }
                }
            };

            ws.onerror = () => { /* silent fail — polling is fallback */ };
        } catch { /* WebSocket not available */ }

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimId]);

    if (loading) return (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading tracker...
        </div>
    );

    const isRejected = currentStatus === 'REJECTED';
    let currentStepIndex = steps.findIndex(s => s.id === currentStatus);
    if (isRejected) currentStepIndex = steps.findIndex(s => s.id === 'APPROVED');

    return (
        <div className="w-full py-6">
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded" />
                <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded transition-all duration-500 ${isRejected ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((step, index) => {
                    const Icon = step.id === 'APPROVED' && isRejected ? XCircle : step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    let bgColor = isActive ? 'bg-blue-600' : 'bg-gray-200';
                    let textColor = isActive ? 'text-white' : 'text-gray-500';
                    const labelColor = isActive ? 'text-gray-900 font-semibold' : 'text-gray-500';
                    if (isRejected && index === currentStepIndex) bgColor = 'bg-red-500';

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${bgColor} ${textColor} ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                                <Icon size={20} />
                            </div>
                            <div className={`absolute top-12 text-xs text-center w-24 whitespace-normal ${labelColor}`}>
                                {step.id === 'APPROVED' && isRejected ? 'Rejected' : step.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* History Timeline */}
            <div className="mt-16 bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Status History</h4>
                <div className="space-y-4">
                    {history.length === 0 && (
                        <p className="text-sm text-gray-500">No history available.</p>
                    )}
                    {history.map((record, index) => (
                        <div key={record.id || index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                                {index !== history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                            </div>
                            <div className="pb-4">
                                <p className="text-sm font-medium text-gray-900">{record.status}</p>
                                <p className="text-xs text-gray-500">{formatDate(record.createdAt)} • by {record.updatedBy}</p>
                                {record.notes && <p className="text-sm text-gray-600 mt-1 italic">"{record.notes}"</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
