import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  AlertTriangle, CheckCircle,
  Search, Download, Users, IndianRupee, ArrowUpRight,
  ArrowDownRight, CircleDollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// ── Mock data ───────────────────────────────────────────────────────────────
const MONTHLY_COLLECTION = [
  { month: 'Aug', collected: 4200000, due: 4800000 },
  { month: 'Sep', collected: 4650000, due: 5000000 },
  { month: 'Oct', collected: 5100000, due: 5300000 },
  { month: 'Nov', collected: 4900000, due: 5200000 },
  { month: 'Dec', collected: 5600000, due: 5700000 },
  { month: 'Jan', collected: 5280000, due: 5800000 },
];

const AGENT_COMMISSIONS = [
  { id: 'AG-001', agentName: 'Ramesh Kumar', branch: 'Mumbai', policiesSold: 48, premiumGenerated: 1840000, commissionRate: 7.5, commissionEarned: 138000, status: 'PAID', disputes: 0 },
  { id: 'AG-002', agentName: 'Priya Sharma', branch: 'Pune', policiesSold: 62, premiumGenerated: 2430000, commissionRate: 7.5, commissionEarned: 182250, status: 'PAID', disputes: 1 },
  { id: 'AG-003', agentName: 'Anil Mehta', branch: 'Delhi', policiesSold: 35, premiumGenerated: 1120000, commissionRate: 6.5, commissionEarned: 72800, status: 'PENDING', disputes: 0 },
  { id: 'AG-004', agentName: 'Sunita Verma', branch: 'Bangalore', policiesSold: 54, premiumGenerated: 2100000, commissionRate: 7.5, commissionEarned: 157500, status: 'PENDING', disputes: 2 },
  { id: 'AG-005', agentName: 'Kiran Patel', branch: 'Chennai', policiesSold: 41, premiumGenerated: 1560000, commissionRate: 6.5, commissionEarned: 101400, status: 'DISPUTED', disputes: 3 },
  { id: 'AG-006', agentName: 'Mohan Das', branch: 'Hyderabad', policiesSold: 29, premiumGenerated: 980000, commissionRate: 6.5, commissionEarned: 63700, status: 'PAID', disputes: 0 },
];

const GATEWAY_RECON = [
  { id: 'TXN-2024-8821', policyNumber: 'POL-2024-0012', customerName: 'Arjun Nair', gateway: 'Razorpay', gatewayTxnId: 'RZP_9kJH2M', amount: 18400, gatewayStatus: 'SUCCESS', ledgerStatus: 'POSTED', date: '2024-01-15T10:30:00Z', matched: true },
  { id: 'TXN-2024-8822', policyNumber: 'POL-2024-0034', customerName: 'Meera Pillai', gateway: 'Stripe', gatewayTxnId: 'STR_ch_3Pm', amount: 32000, gatewayStatus: 'SUCCESS', ledgerStatus: 'POSTED', date: '2024-01-15T11:15:00Z', matched: true },
  { id: 'TXN-2024-8823', policyNumber: 'POL-2024-0067', customerName: 'Vikram Bose', gateway: 'UPI', gatewayTxnId: 'UPI_9823HB', amount: 9600, gatewayStatus: 'SUCCESS', ledgerStatus: 'PENDING', date: '2024-01-15T12:00:00Z', matched: false },
  { id: 'TXN-2024-8824', policyNumber: 'POL-2024-0089', customerName: 'Lakshmi Patel', gateway: 'Razorpay', gatewayTxnId: 'RZP_7xKL9N', amount: 14800, gatewayStatus: 'FAILED', ledgerStatus: 'NOT_POSTED', date: '2024-01-15T13:20:00Z', matched: false },
  { id: 'TXN-2024-8825', policyNumber: 'POL-2024-0023', customerName: 'Rohit Malhotra', gateway: 'NetBanking', gatewayTxnId: 'NB_HDFCx912', amount: 48000, gatewayStatus: 'SUCCESS', ledgerStatus: 'POSTED', date: '2024-01-15T14:00:00Z', matched: true },
];

const DISPUTE_LOG = [
  { id: 'D-001', agentId: 'AG-002', agentName: 'Priya Sharma', type: 'UNDERPAYMENT', description: 'Commission not calculated on renewal premium for Jan batch', amount: 12400, status: 'UNDER_REVIEW', raisedAt: '2024-01-12T09:00:00Z' },
  { id: 'D-002', agentId: 'AG-004', agentName: 'Sunita Verma', type: 'MISSING_PAYMENT', description: 'Commission for Dec batch not credited despite policy issuance', amount: 8750, status: 'OPEN', raisedAt: '2024-01-10T14:00:00Z' },
  { id: 'D-003', agentId: 'AG-005', agentName: 'Kiran Patel', type: 'RATE_DISPUTE', description: 'Applied 6.5% instead of agreed 7.5% for health policies', amount: 15600, status: 'RESOLVED', raisedAt: '2024-01-05T11:00:00Z' },
];

// ── Helper ────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const getCommBadge = (s) => s === 'PAID' ? 'success' : s === 'PENDING' ? 'warning' : 'error';
const getDisputeBadge = (s) => s === 'RESOLVED' ? 'success' : s === 'UNDER_REVIEW' ? 'warning' : 'error';

const FinancialRecon = () => {
  const [tab, setTab] = useState('collection'); // collection | commission | reconciliation | disputes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const stats = {
    totalCollected: MONTHLY_COLLECTION.reduce((s, m) => s + m.collected, 0),
    totalDue: MONTHLY_COLLECTION.reduce((s, m) => s + m.due, 0),
    totalCommission: AGENT_COMMISSIONS.reduce((s, a) => s + a.commissionEarned, 0),
    unmatchedCount: GATEWAY_RECON.filter(t => !t.matched).length,
    openDisputes: DISPUTE_LOG.filter(d => d.status !== 'RESOLVED').length,
  };

  const collectionRate = ((stats.totalCollected / stats.totalDue) * 100).toFixed(1);

  const tabs = [
    { key: 'collection', label: 'Premium Collection' },
    { key: 'commission', label: 'Agent Commission' },
    { key: 'reconciliation', label: 'Gateway Reconciliation' },
    { key: 'disputes', label: `Disputes ${stats.openDisputes > 0 ? `(${stats.openDisputes})` : ''}` },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Finance & Commission</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Premium collection, agent commissions, gateway reconciliation and dispute management</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all shrink-0">
            <Download size={16} /> Export Report
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Collected', value: fmt(stats.totalCollected), icon: IndianRupee, sub: `${collectionRate}% of target`, color: 'emerald', trend: 'up' },
            { label: 'Outstanding Due', value: fmt(stats.totalDue - stats.totalCollected), icon: AlertTriangle, sub: `${(100 - parseFloat(collectionRate)).toFixed(1)}% uncollected`, color: 'amber', trend: 'down' },
            { label: 'Total Commission', value: fmt(stats.totalCommission), icon: Users, sub: `${AGENT_COMMISSIONS.length} agents`, color: 'blue', trend: 'up' },
            { label: 'Unmatched TXNs', value: stats.unmatchedCount, icon: CircleDollarSign, sub: 'Require reconciliation', color: 'rose', trend: 'down' },
          ].map(({ label, value, icon: Icon, sub, color, trend }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{value}</span>
                <div className="flex items-center gap-1 mt-1">
                  {trend === 'up' ? <ArrowUpRight size={12} className="text-emerald-500" /> : <ArrowDownRight size={12} className="text-rose-500" />}
                  <span className="text-xs font-semibold text-slate-400">{sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full overflow-x-auto">
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

        {/* ── Tab: Premium Collection ── */}
        {tab === 'collection' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Monthly Premium Collection vs Target</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">{collectionRate}% Overall Collection Rate</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MONTHLY_COLLECTION} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'collected' ? 'Collected' : 'Target']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} />
                  <Legend formatter={v => v === 'collected' ? 'Collected' : 'Target'} />
                  <Bar dataKey="due" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="due" />
                  <Bar dataKey="collected" fill="#2563eb" radius={[4, 4, 0, 0]} name="collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Live Transaction Ledger</h3>
                <div className="relative w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Transaction ID</th>
                      <th className="p-4">Policy</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                    {GATEWAY_RECON.filter(t => !searchTerm || t.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) || t.customerName.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-4 pl-6 text-blue-600 font-bold text-xs">{t.id}</td>
                        <td className="p-4 text-blue-500 font-bold">{t.policyNumber}</td>
                        <td className="p-4">{t.customerName}</td>
                        <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{t.gateway}</span></td>
                        <td className="p-4 font-bold text-slate-900">{fmt(t.amount)}</td>
                        <td className="p-4 text-xs text-slate-500">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 pr-6">
                          <Badge variant={t.gatewayStatus === 'SUCCESS' ? 'success' : 'error'}>{t.gatewayStatus}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Agent Commission ── */}
        {tab === 'commission' && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agent & Broker Commission Register</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Current month commission status for all active agents</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Agent</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Policies Sold</th>
                    <th className="p-4">Premium Generated</th>
                    <th className="p-4">Rate</th>
                    <th className="p-4">Commission</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                  {AGENT_COMMISSIONS.map(agent => (
                    <tr key={agent.id} className="hover:bg-slate-50/50">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-black flex items-center justify-center">
                            {agent.agentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{agent.agentName}</span>
                            <div className="text-xs text-slate-400">{agent.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{agent.branch}</td>
                      <td className="p-4 font-bold text-slate-900">{agent.policiesSold}</td>
                      <td className="p-4">{fmt(agent.premiumGenerated)}</td>
                      <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-extrabold">{agent.commissionRate}%</span></td>
                      <td className="p-4 font-black text-emerald-600">{fmt(agent.commissionEarned)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={getCommBadge(agent.status)}>{agent.status}</Badge>
                          {agent.disputes > 0 && <span className="text-xs bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded">{agent.disputes} dispute{agent.disputes > 1 ? 's' : ''}</span>}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button onClick={() => setSelectedAgent(agent)} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Gateway Reconciliation ── */}
        {tab === 'reconciliation' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Matched', value: GATEWAY_RECON.filter(t => t.matched).length, color: 'emerald' },
                { label: 'Unmatched', value: GATEWAY_RECON.filter(t => !t.matched).length, color: 'rose' },
                { label: 'Total', value: GATEWAY_RECON.length, color: 'blue' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-5 text-center`}>
                  <div className={`text-3xl font-black text-${color}-600`}>{value}</div>
                  <div className={`text-xs font-bold text-${color}-500 uppercase mt-1`}>{label} Transactions</div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Gateway ↔ Policy Ledger Reconciliation</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Unmatched transactions require manual investigation</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">TXN ID</th>
                      <th className="p-4">Policy</th>
                      <th className="p-4">Gateway</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Gateway Status</th>
                      <th className="p-4">Ledger Status</th>
                      <th className="p-4 pr-6">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                    {GATEWAY_RECON.map(t => (
                      <tr key={t.id} className={`${!t.matched ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="p-4 pl-6 text-blue-600 font-bold text-xs">{t.gatewayTxnId}</td>
                        <td className="p-4">{t.policyNumber}</td>
                        <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{t.gateway}</span></td>
                        <td className="p-4 font-bold">{fmt(t.amount)}</td>
                        <td className="p-4"><Badge variant={t.gatewayStatus === 'SUCCESS' ? 'success' : 'error'}>{t.gatewayStatus}</Badge></td>
                        <td className="p-4"><Badge variant={t.ledgerStatus === 'POSTED' ? 'success' : t.ledgerStatus === 'PENDING' ? 'warning' : 'error'}>{t.ledgerStatus}</Badge></td>
                        <td className="p-4 pr-6">
                          {t.matched
                            ? <span className="text-emerald-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={14} /> Matched</span>
                            : <span className="text-rose-600 font-bold text-xs flex items-center gap-1"><AlertTriangle size={14} /> Mismatch</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Disputes ── */}
        {tab === 'disputes' && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agent Commission Dispute Log</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Disputes raised by agents regarding commission calculation or payment</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Dispute ID</th>
                    <th className="p-4">Agent</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Raised</th>
                    <th className="p-4 pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                  {DISPUTE_LOG.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="p-4 pl-6 text-blue-600 font-bold">{d.id}</td>
                      <td className="p-4 font-bold text-slate-900">{d.agentName}</td>
                      <td className="p-4"><span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded">{d.type.replace('_', ' ')}</span></td>
                      <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{d.description}</td>
                      <td className="p-4 font-bold text-rose-600">{fmt(d.amount)}</td>
                      <td className="p-4 text-xs text-slate-400">{new Date(d.raisedAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 pr-6"><Badge variant={getDisputeBadge(d.status)}>{d.status.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      <Modal isOpen={!!selectedAgent} onClose={() => setSelectedAgent(null)}>
        {selectedAgent && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-black flex items-center justify-center">
                {selectedAgent.agentName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedAgent.agentName}</h3>
                <p className="text-xs text-slate-400 font-semibold">{selectedAgent.id} · {selectedAgent.branch} Branch</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
              {[
                ['Policies Sold', selectedAgent.policiesSold],
                ['Premium Generated', fmt(selectedAgent.premiumGenerated)],
                ['Commission Rate', `${selectedAgent.commissionRate}%`],
                ['Commission Earned', fmt(selectedAgent.commissionEarned)],
                ['Open Disputes', selectedAgent.disputes],
                ['Payment Status', selectedAgent.status],
              ].map(([label, val]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{label}</span>
                  <span className="text-sm font-bold text-slate-800">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all">Mark as Paid</button>
              <button className="flex-1 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm rounded-xl hover:bg-amber-100 transition-all">Raise Dispute</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default FinancialRecon;
