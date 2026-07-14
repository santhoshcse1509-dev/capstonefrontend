import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Download, TrendingDown, TrendingUp, AlertTriangle, BarChart3, Filter } from 'lucide-react';

// ── Mock analytics data ─────────────────────────────────────────────────────
const CLAIM_TAT = [
  { month: 'Aug', health: 4.2, motor: 6.8, life: 12.4, home: 8.1 },
  { month: 'Sep', health: 3.9, motor: 6.1, life: 11.8, home: 7.4 },
  { month: 'Oct', health: 3.4, motor: 5.5, life: 10.9, home: 6.8 },
  { month: 'Nov', health: 3.7, motor: 5.9, life: 11.2, home: 7.1 },
  { month: 'Dec', health: 3.1, motor: 5.2, life: 9.8, home: 6.3 },
  { month: 'Jan', health: 2.8, motor: 4.9, life: 8.6, home: 5.9 },
];

const LOSS_RATIO = [
  { month: 'Aug', ratio: 68.4, premium: 4200000, claims: 2873000 },
  { month: 'Sep', ratio: 71.2, premium: 4650000, claims: 3311000 },
  { month: 'Oct', ratio: 65.8, premium: 5100000, claims: 3356000 },
  { month: 'Nov', ratio: 73.1, premium: 4900000, claims: 3582000 },
  { month: 'Dec', ratio: 62.3, premium: 5600000, claims: 3489000 },
  { month: 'Jan', ratio: 69.4, premium: 5280000, claims: 3664000 },
];

const POLICY_ISSUANCE = [
  { month: 'Aug', health: 1.2, motor: 0.4, life: 2.8, home: 1.8 },
  { month: 'Sep', health: 1.1, motor: 0.5, life: 2.6, home: 1.7 },
  { month: 'Oct', health: 0.9, motor: 0.4, life: 2.4, home: 1.5 },
  { month: 'Nov', health: 0.8, motor: 0.3, life: 2.1, home: 1.3 },
  { month: 'Dec', health: 0.7, motor: 0.3, life: 1.9, home: 1.1 },
  { month: 'Jan', health: 0.6, motor: 0.3, life: 1.7, home: 1.0 },
];

const POLICY_DIST = [
  { name: 'Health', value: 38, color: '#3b82f6' },
  { name: 'Term Life', value: 27, color: '#6366f1' },
  { name: 'Motor', value: 22, color: '#8b5cf6' },
  { name: 'Home', value: 9, color: '#a78bfa' },
  { name: 'Travel', value: 4, color: '#c4b5fd' },
];

const REVENUE_TREND = [
  { month: 'Aug', revenue: 4200000, target: 4500000 },
  { month: 'Sep', revenue: 4650000, target: 4600000 },
  { month: 'Oct', revenue: 5100000, target: 4800000 },
  { month: 'Nov', revenue: 4900000, target: 5000000 },
  { month: 'Dec', revenue: 5600000, target: 5200000 },
  { month: 'Jan', revenue: 5280000, target: 5500000 },
];

const ANOMALIES = [
  { id: 1, type: 'SPIKE', metric: 'Claim Rejections', description: '28% spike in motor claim rejections detected in Jan vs Dec baseline', severity: 'HIGH', detectedAt: '2024-01-14T08:30:00Z', status: 'OPEN' },
  { id: 2, type: 'DROP', metric: 'Policy Renewals', description: 'Health policy renewal rate dropped from 94% to 88% in Jan', severity: 'MEDIUM', detectedAt: '2024-01-13T12:00:00Z', status: 'INVESTIGATING' },
  { id: 3, type: 'SPIKE', metric: 'Fraud Flags', description: 'Unusual cluster of motor claims from Mumbai region — 14 in 48 hours', severity: 'HIGH', detectedAt: '2024-01-12T16:00:00Z', status: 'RESOLVED' },
  { id: 4, type: 'THRESHOLD', metric: 'Loss Ratio', description: 'Health segment loss ratio crossed 75% threshold for the first time in 6 months', severity: 'LOW', detectedAt: '2024-01-10T09:00:00Z', status: 'OPEN' },
];

const REPORT_FIELDS = [
  'Claim Number', 'Customer Name', 'Policy Number', 'Claim Type', 'Claim Amount',
  'Fraud Risk Score', 'Status', 'Submission Date', 'Settlement Date', 'Adjuster Name',
  'TAT (Days)', 'Branch', 'Agent ID', 'Rejection Reason'
];

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtL = (n) => `₹${(n / 100000).toFixed(1)}L`;

const KPI = ({ label, value, sub, trend, trendVal, color = 'blue' }) => (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="text-2xl font-black text-slate-900">{value}</span>
    <div className={`flex items-center gap-1.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
      {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
      {sub}
    </div>
  </div>
);

const AnalyticsPage = () => {
  const [tab, setTab] = useState('overview');
  const [reportFields, setReportFields] = useState(['Claim Number', 'Customer Name', 'Claim Amount', 'Status']);
  const [reportDateRange, setReportDateRange] = useState({ from: '2024-01-01', to: '2024-01-31' });
  const [reportType, setReportType] = useState('CLAIMS');

  const toggleField = (f) => {
    setReportFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleExport = (format) => {
    alert(`Exporting ${reportType} report for ${reportDateRange.from} to ${reportDateRange.to} in ${format} format with fields: ${reportFields.join(', ')}`);
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'claims', label: 'Claims Analytics' },
    { key: 'policies', label: 'Policy Analytics' },
    { key: 'anomalies', label: `Anomalies ${ANOMALIES.filter(a => a.status === 'OPEN').length > 0 ? `(${ANOMALIES.filter(a => a.status === 'OPEN').length})` : ''}` },
    { key: 'reports', label: 'Report Builder' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Analytics & Reporting</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Claims TAT, loss ratios, policy trends, anomaly detection and custom report builder</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
              <Filter size={14} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Avg Claims TAT" value="3.4 Days" sub="↓ 0.6 days vs last month" trend="up" />
          <KPI label="Loss Ratio (Jan)" value="69.4%" sub="↑ 7.1% vs Dec" trend="down" />
          <KPI label="Avg Policy Issuance" value="0.8 Days" sub="↓ 18% from last year" trend="up" />
          <KPI label="Fraud Detection Rate" value="94.2%" sub="AI-assisted review" trend="up" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-5">Revenue vs Target</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={REVENUE_TREND}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtL} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2.5} name="Revenue" />
                    <Line type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Policy Distribution */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-5">Policy Portfolio Distribution</h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={POLICY_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                        {POLICY_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2">
                    {POLICY_DIST.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-bold text-slate-700">{name}</span>
                        <span className="text-sm font-black text-slate-500 ml-auto">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Loss Ratio */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-900">Monthly Loss Ratio</h3>
                <span className="text-xs font-bold text-slate-400">Target: &lt;70% | Red Zone: &gt;80%</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={LOSS_RATIO}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 90]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => [n === 'ratio' ? `${v}%` : fmt(v), n === 'ratio' ? 'Loss Ratio' : n]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} />
                  <Bar dataKey="ratio" radius={[6, 6, 0, 0]} name="ratio"
                    fill="#3b82f6"
                    label={{ position: 'top', fontSize: 10, fontWeight: 700, fill: '#64748b', formatter: v => `${v}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Tab: Claims Analytics ── */}
        {tab === 'claims' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Claims Turnaround Time by Type (Days)</h3>
              <p className="text-xs text-slate-400 font-semibold mb-5">Lower is better. IRDAI mandate: all claims within 30 days.</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={CLAIM_TAT}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${v}d`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v} days`]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} />
                  <Legend />
                  <Line type="monotone" dataKey="health" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="Health" />
                  <Line type="monotone" dataKey="motor" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Motor" />
                  <Line type="monotone" dataKey="life" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Life" />
                  <Line type="monotone" dataKey="home" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Home" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Health Avg TAT', value: '2.8 days', sub: '↓ 0.3d from Dec', trend: 'up' },
                { label: 'Motor Avg TAT', value: '4.9 days', sub: '↓ 0.3d from Dec', trend: 'up' },
                { label: 'Life Avg TAT', value: '8.6 days', sub: '↓ 1.2d from Dec', trend: 'up' },
                { label: 'Home Avg TAT', value: '5.9 days', sub: '↓ 0.4d from Dec', trend: 'up' },
              ].map(props => <KPI key={props.label} {...props} />)}
            </div>
          </div>
        )}

        {/* ── Tab: Policy Analytics ── */}
        {tab === 'policies' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Policy Issuance Time by Type (Days)</h3>
              <p className="text-xs text-slate-400 font-semibold mb-5">Time from application submission to policy issuance</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={POLICY_ISSUANCE} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${v}d`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v} days`]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} />
                  <Legend />
                  <Bar dataKey="health" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Health" />
                  <Bar dataKey="motor" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Motor" />
                  <Bar dataKey="life" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Life" />
                  <Bar dataKey="home" fill="#10b981" radius={[3, 3, 0, 0]} name="Home" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Premium Renewal Rate', value: '94.2%', sub: '↑ 2.1% from last year', trend: 'up' },
                { label: 'Active Customers', value: '12,847', sub: '+342 new this month', trend: 'up' },
                { label: 'Policies Issued (Jan)', value: '1,243', sub: '↑ 8% vs Dec', trend: 'up' },
                { label: 'Lapsed Rate', value: '3.1%', sub: '↓ from 3.8% in Dec', trend: 'up' },
              ].map(props => <KPI key={props.label} {...props} />)}
            </div>
          </div>
        )}

        {/* ── Tab: Anomalies ── */}
        {tab === 'anomalies' && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Anomaly Detection Active</p>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">System monitors 14 metrics for statistical deviations. Alerts generated when values exceed 2σ from 90-day baseline.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {ANOMALIES.map(a => (
                <div key={a.id} className={`bg-white border rounded-2xl shadow-sm p-5 flex items-start justify-between gap-4 ${a.severity === 'HIGH' ? 'border-rose-100' : a.severity === 'MEDIUM' ? 'border-amber-100' : 'border-slate-100'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-xl ${a.severity === 'HIGH' ? 'bg-rose-50 text-rose-600' : a.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${a.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : a.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {a.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{a.type} · {a.metric}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{a.description}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Detected: {new Date(a.detectedAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${a.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : a.status === 'INVESTIGATING' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                      {a.status}
                    </span>
                    <button className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all">
                      Investigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Report Builder ── */}
        {tab === 'reports' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-5">Custom Report Builder</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Report Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Type</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="CLAIMS">Claims Report</option>
                    <option value="POLICIES">Policy Issuance Report</option>
                    <option value="PAYMENTS">Premium Payments Report</option>
                    <option value="AGENTS">Agent Performance Report</option>
                    <option value="FRAUD">Fraud Analysis Report</option>
                  </select>
                </div>

                {/* Date From */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date From</label>
                  <input
                    type="date"
                    value={reportDateRange.from}
                    onChange={e => setReportDateRange(p => ({ ...p, from: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Date To */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date To</label>
                  <input
                    type="date"
                    value={reportDateRange.to}
                    onChange={e => setReportDateRange(p => ({ ...p, to: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Field Selector */}
              <div className="mt-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Select Fields to Include ({reportFields.length} selected)</label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_FIELDS.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleField(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${reportFields.includes(f) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-600">Export as:</span>
                <button
                  onClick={() => handleExport('EXCEL')}
                  disabled={reportFields.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Download size={14} /> Excel / CSV
                </button>
                <button
                  onClick={() => handleExport('PDF')}
                  disabled={reportFields.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all"
                >
                  <BarChart3 size={14} /> PDF Report
                </button>
                {reportFields.length === 0 && (
                  <span className="text-xs text-rose-500 font-bold">Select at least one field</span>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Preview (First 5 rows)</h3>
                <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-lg">{reportFields.length} columns selected</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      {reportFields.map(f => <th key={f} className="p-3 pl-4 whitespace-nowrap">{f}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {[
                      ['CLM-2024-001', 'Arjun Nair', 'POL-2024-0012', 'HEALTH', '₹75,000', '12%', 'APPROVED', '10-Jan', '14-Jan', 'Ramesh Kumar', '4', 'Mumbai', 'AG-001', 'N/A'],
                      ['CLM-2024-002', 'Meera Pillai', 'POL-2024-0034', 'MOTOR', '₹1,20,000', '67%', 'DOCS_NEEDED', '08-Jan', '—', 'Priya Sharma', '—', 'Pune', 'AG-002', 'N/A'],
                      ['CLM-2024-003', 'Vikram Bose', 'POL-2024-0023', 'LIFE', '₹25,00,000', '4%', 'APPROVED', '05-Jan', '12-Jan', 'Anil Mehta', '7', 'Delhi', 'AG-003', 'N/A'],
                      ['CLM-2024-004', 'Lakshmi Patel', 'POL-2024-0089', 'HOME', '₹1,80,000', '22%', 'REJECTED', '01-Jan', '03-Jan', 'Sunita Verma', '2', 'Bangalore', 'AG-004', 'PRE_EXISTING_DAMAGE'],
                      ['CLM-2024-005', 'Rohit Malhotra', 'POL-2024-0067', 'HEALTH', '₹45,000', '8%', 'SUBMITTED', '15-Jan', '—', 'Unassigned', '—', 'Chennai', 'AG-005', 'N/A'],
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {reportFields.map((f, j) => {
                          const allFields = ['Claim Number', 'Customer Name', 'Policy Number', 'Claim Type', 'Claim Amount', 'Fraud Risk Score', 'Status', 'Submission Date', 'Settlement Date', 'Adjuster Name', 'TAT (Days)', 'Branch', 'Agent ID', 'Rejection Reason'];
                          const idx = allFields.indexOf(f);
                          return <td key={f} className="p-3 pl-4 whitespace-nowrap">{idx >= 0 ? row[idx] : '—'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
