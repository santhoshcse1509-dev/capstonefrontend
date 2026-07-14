import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../hooks/useNotification';
import { History, Calendar, Search, RefreshCw, Filter, ShieldAlert } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const AuditLogs = () => {
  const notification = useNotification();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyClientFilters();
  }, [searchTerm, logs]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (dateFrom) {
        // Convert to ISO-8601 LocalDateTime format (e.g. YYYY-MM-DDTHH:MM:SS)
        filters.from = new Date(dateFrom).toISOString().slice(0, 19);
      }
      if (dateTo) {
        filters.to = new Date(dateTo).toISOString().slice(0, 19);
      }
      if (entityTypeFilter) {
        filters.entityType = entityTypeFilter;
      }

      const data = await adminService.getAuditLogs(filters);
      setLogs(data || []);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const applyClientFilters = () => {
    const term = searchTerm.toLowerCase();
    const filtered = logs.filter(log => 
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.entityId && log.entityId.toLowerCase().includes(term)) ||
      (log.entityType && log.entityType.toLowerCase().includes(term))
    );
    setFilteredLogs(filtered);
  };

  const handleApplyServerFilters = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setEntityTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    // Re-fetch all logs
    setLoading(true);
    adminService.getAuditLogs().then(data => {
      setLogs(data || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Audit Logs</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Trace administrative changes, authentication audits, and state updates across system entities</p>
          </div>
          
          <button 
            onClick={fetchLogs} 
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all self-end md:self-auto"
            title="Refresh Logs"
          >
            <RefreshCw size={18} className="text-slate-600 animate-hover" />
          </button>
        </div>

        {/* Server Filters Panel */}
        <form onSubmit={handleApplyServerFilters} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end text-slate-700">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">-- All Entities --</option>
              <option value="User">User</option>
              <option value="Policy">Policy</option>
              <option value="Claim">Claim</option>
              <option value="Payment">Payment</option>
              <option value="Kyc">Kyc</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 transition-all"
            >
              <Filter size={16} />
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-all"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Client Search Bar */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search current logs by action, details, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Logs Table Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/10 border-t-blue-600"></div>
              <span className="text-sm font-bold text-slate-400">Loading audit records...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 pl-6">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity Type</th>
                    <th className="p-4">Entity ID</th>
                    <th className="p-4 pr-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold text-sm">
                        No audit records found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6 text-slate-500 font-bold shrink-0 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              {formatDateTime(log.timestamp)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wide border border-slate-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-slate-800">
                            {log.entityType || 'N/A'}
                          </td>
                          <td className="p-4 text-slate-500 font-mono">
                            {log.entityId ? `${log.entityId.substring(0, 16)}...` : 'N/A'}
                          </td>
                          <td className="p-4 pr-6 text-slate-600 max-w-sm truncate" title={log.details}>
                            {log.details || 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
