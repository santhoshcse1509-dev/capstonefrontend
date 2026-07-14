import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useNotification } from '../../hooks/useNotification';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Sliders, Shield, Key, Server, Save,
  Activity, AlertCircle,
  Settings2, RefreshCw, Lock, EyeOff
} from 'lucide-react';

// ── Integration health mock ───────────────────────────────────────────────
const INTEGRATIONS = [
  { id: 'razorpay', name: 'Razorpay Payment Gateway', lastPing: '2 minutes ago', latency: '124ms', status: 'HEALTHY', icon: '💳' },
  { id: 'stripe', name: 'Stripe Gateway', lastPing: '3 minutes ago', latency: '198ms', status: 'HEALTHY', icon: '💳' },
  { id: 'twilio', name: 'Twilio SMS Provider', lastPing: '1 minute ago', latency: '89ms', status: 'HEALTHY', icon: '📱' },
  { id: 'sendgrid', name: 'SendGrid Email Service', lastPing: '5 minutes ago', latency: '211ms', status: 'DEGRADED', icon: '📧' },
  { id: 'irdai', name: 'IRDAI Regulatory API', lastPing: '12 minutes ago', latency: 'N/A', status: 'DOWN', icon: '🏛️' },
  { id: 'nsdl', name: 'NSDL KYC Verification', lastPing: '4 minutes ago', latency: '340ms', status: 'HEALTHY', icon: '🪪' },
  { id: 'firebase', name: 'Firebase Push Notifications', lastPing: '1 minute ago', latency: '55ms', status: 'HEALTHY', icon: '🔔' },
  { id: 'aws-s3', name: 'AWS S3 Document Storage', lastPing: '2 minutes ago', latency: '78ms', status: 'HEALTHY', icon: '☁️' },
];

// ── Business Rules mock ───────────────────────────────────────────────────
const DEFAULT_RULES = {
  autoApproveThreshold: 500000,
  slaStandardDays: 7,
  slaEscalationDays: 15,
  fraudFlagThreshold: 50,
  gracePeriodDays: 30,
  commissionRateHealth: 7.5,
  commissionRateTerm: 6.5,
  commissionRateMotor: 5.0,
  maxNominees: 4,
  otpExpiryMinutes: 10,
};

// ── Data masking config ───────────────────────────────────────────────────
const ROLES = ['Super Admin', 'Underwriter', 'Claims Adjuster', 'Call Centre', 'Compliance Officer'];
const SENSITIVE_FIELDS = [
  { key: 'aadhaar', label: 'Aadhaar Number' },
  { key: 'pan', label: 'PAN Number' },
  { key: 'bankAccount', label: 'Bank Account Number' },
  { key: 'phone', label: 'Mobile Number' },
  { key: 'medicalHistory', label: 'Medical History' },
  { key: 'claimAmount', label: 'Claim Amount (high-value)' },
];

const getIntegrationBadge = (status) =>
  status === 'HEALTHY' ? 'success' : status === 'DEGRADED' ? 'warning' : 'error';

const StatusDot = ({ status }) => {
  const colors = { HEALTHY: 'bg-emerald-500', DEGRADED: 'bg-amber-500', DOWN: 'bg-rose-500' };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} ${status !== 'HEALTHY' ? 'animate-pulse' : ''}`} />
  );
};

const Toggle = ({ value, onChange }) => (
  <button
    onClick={onChange}
    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${value ? 'bg-blue-600' : 'bg-slate-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const SystemSettings = () => {
  const notification = useNotification();
  const [activeTab, setActiveTab] = useState('security');
  const [saving, setSaving] = useState(false);
  const [pingLoading, setPingLoading] = useState(null);

  // Security settings
  const [security, setSecurity] = useState({
    mfaEnforced: true,
    passwordComplexity: true,
    minPasswordLength: 8,
    sessionTimeout: '30',
    emailNotifications: true,
    allowedSelfRegistration: true,
    ipWhitelistEnabled: false,
    auditLogRetentionDays: 365,
  });

  // Business rules
  const [rules, setRules] = useState(DEFAULT_RULES);

  // Data masking — role x field matrix
  const [masking, setMasking] = useState(() => {
    const m = {};
    ROLES.forEach(r => {
      m[r] = {};
      SENSITIVE_FIELDS.forEach(f => {
        // Super Admin sees all; Call Centre & Compliance masked more
        m[r][f.key] = r === 'Super Admin' ? false : r === 'Claims Adjuster' ? (f.key === 'medicalHistory' ? false : true) : true;
      });
    });
    return m;
  });

  // Integrations (with local override status)
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sys_security');
      if (saved) setSecurity(JSON.parse(saved));
      const savedRules = localStorage.getItem('sys_rules');
      if (savedRules) setRules(JSON.parse(savedRules));
    } catch (e) { /* ignore */ }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem('sys_security', JSON.stringify(security));
    localStorage.setItem('sys_rules', JSON.stringify(rules));
    notification.success('System configuration saved successfully.');
    setSaving(false);
  };

  const handlePing = async (id) => {
    setPingLoading(id);
    await new Promise(r => setTimeout(r, 1200));
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, lastPing: 'just now' } : i));
    setPingLoading(null);
    notification.success(`Integration "${integrations.find(i => i.id === id)?.name}" ping successful.`);
  };

  const toggleMask = (role, field) => {
    setMasking(prev => ({
      ...prev,
      [role]: { ...prev[role], [field]: !prev[role][field] }
    }));
  };

  const tabs = [
    { key: 'security', label: 'Security & Auth', icon: Shield },
    { key: 'rules', label: 'Business Rules', icon: Settings2 },
    { key: 'integrations', label: 'Integration Health', icon: Activity },
    { key: 'masking', label: 'Data Masking', icon: EyeOff },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Administration</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Business rules, integration health monitoring, data masking and security configuration</p>
          </div>
          <Button onClick={handleSave} loading={saving} className="flex items-center gap-2 shrink-0">
            <Save size={16} /> Save Changes
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Security & Auth ── */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Shield size={18} /></div>
                <h3 className="text-base font-bold text-slate-900">Authentication</h3>
              </div>
              {[
                { key: 'mfaEnforced', label: 'Enforce MFA for all users', sub: 'Force Google Authenticator setup on first login' },
                { key: 'allowedSelfRegistration', label: 'Allow Customer Self-Registration', sub: 'Enable public /register route' },
                { key: 'ipWhitelistEnabled', label: 'Enable IP Whitelist (Admin)', sub: 'Restrict admin panel to trusted IPs' },
                { key: 'emailNotifications', label: 'Security Email Alerts', sub: 'Notify users on login, profile changes, resets' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>
                  </div>
                  <Toggle value={security[key]} onChange={() => setSecurity(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>

            {/* Password Policy */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Key size={18} /></div>
                <h3 className="text-base font-bold text-slate-900">Password Policy</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800">Enforce Complexity Rules</span>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Require uppercase, lowercase, numbers & symbols</p>
                </div>
                <Toggle value={security.passwordComplexity} onChange={() => setSecurity(p => ({ ...p, passwordComplexity: !p.passwordComplexity }))} />
              </div>
              {[
                { key: 'minPasswordLength', label: 'Min Password Length', min: 6, max: 32, unit: 'chars' },
                { key: 'auditLogRetentionDays', label: 'Audit Log Retention', min: 30, max: 730, unit: 'days' },
              ].map(({ key, label, min, max, unit }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Currently set to {security[key]} {unit}</p>
                  </div>
                  <input
                    type="number" min={min} max={max} value={security[key]}
                    onChange={e => setSecurity(p => ({ ...p, [key]: parseInt(e.target.value) || min }))}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800">Session Timeout</span>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Auto-logout inactive sessions</p>
                </div>
                <select
                  value={security.sessionTimeout}
                  onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl shadow-sm p-6 md:col-span-2 flex items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl mt-0.5"><Server size={20} /></div>
                <div>
                  <h3 className="text-base font-bold text-rose-900">Maintenance Mode</h3>
                  <p className="text-sm text-rose-700 font-medium mt-1">Restrict all non-admin access. Use during deployments or critical maintenance windows. All customer-facing routes will show a maintenance page.</p>
                </div>
              </div>
              <Toggle value={security.maintenanceMode || false} onChange={() => setSecurity(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))} />
            </div>
          </div>
        )}

        {/* ── Tab: Business Rules ── */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Claims Processing', icon: Shield, color: 'blue',
                fields: [
                  { key: 'autoApproveThreshold', label: 'Auto-Approve Threshold (₹)', sub: 'Claims below this are auto-approved', prefix: '₹' },
                  { key: 'slaStandardDays', label: 'Standard SLA (days)', sub: 'Target resolution time for claims' },
                  { key: 'slaEscalationDays', label: 'Escalation SLA (days)', sub: 'Trigger senior escalation after this many days' },
                  { key: 'fraudFlagThreshold', label: 'Fraud Flag Threshold (%)', sub: 'Risk score above this flags for manual review' },
                ]
              },
              {
                title: 'Policy & Payments', icon: Settings2, color: 'indigo',
                fields: [
                  { key: 'gracePeriodDays', label: 'Grace Period (days)', sub: 'Days after due date before policy lapses' },
                  { key: 'maxNominees', label: 'Max Nominees per Policy', sub: 'Maximum number of nominee additions' },
                  { key: 'otpExpiryMinutes', label: 'OTP Expiry (minutes)', sub: 'OTP validity window for transactions' },
                ]
              },
              {
                title: 'Commission Rates', icon: Sliders, color: 'emerald',
                fields: [
                  { key: 'commissionRateHealth', label: 'Health Insurance Rate (%)', sub: 'Agent commission rate for health policies' },
                  { key: 'commissionRateTerm', label: 'Term Life Rate (%)', sub: 'Agent commission rate for term life policies' },
                  { key: 'commissionRateMotor', label: 'Motor Insurance Rate (%)', sub: 'Agent commission rate for motor policies' },
                ]
              },
            ].map(({ title, icon: Icon, color, fields }) => (
              <div key={title} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                  <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-xl`}><Icon size={18} /></div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                </div>
                {fields.map(({ key, label, sub, prefix }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-bold text-slate-800">{label}</span>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {prefix && <span className="text-sm font-bold text-slate-500">{prefix}</span>}
                      <input
                        type="number"
                        value={rules[key]}
                        onChange={e => setRules(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 md:col-span-2 text-sm text-amber-800 font-semibold flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              Changes to business rules take effect immediately for new transactions. Existing in-progress claims and policies are not retroactively affected.
            </div>
          </div>
        )}

        {/* ── Tab: Integration Health ── */}
        {activeTab === 'integrations' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Operational', value: integrations.filter(i => i.status === 'HEALTHY').length, color: 'emerald' },
                { label: 'Degraded', value: integrations.filter(i => i.status === 'DEGRADED').length, color: 'amber' },
                { label: 'Down', value: integrations.filter(i => i.status === 'DOWN').length, color: 'rose' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-5 text-center`}>
                  <div className={`text-3xl font-black text-${color}-600`}>{value}</div>
                  <div className={`text-xs font-bold text-${color}-500 uppercase mt-1`}>{label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Third-Party Integration Monitor</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Live status of all external API integrations</p>
              </div>
              <div className="divide-y divide-slate-50">
                {integrations.map(int => (
                  <div key={int.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{int.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusDot status={int.status} />
                          <span className="text-sm font-bold text-slate-900">{int.name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="text-xs text-slate-400 font-semibold">Last ping: {int.lastPing}</span>
                          <span className="text-xs text-slate-400 font-semibold">Latency: {int.latency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getIntegrationBadge(int.status)}>{int.status}</Badge>
                      <button
                        onClick={() => handlePing(int.id)}
                        disabled={pingLoading === int.id}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                        title="Ping"
                      >
                        <RefreshCw size={14} className={pingLoading === int.id ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Data Masking ── */}
        {activeTab === 'masking' && (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 font-semibold flex items-start gap-3">
              <EyeOff size={18} className="text-blue-500 shrink-0 mt-0.5" />
              Configure which sensitive fields are masked (hidden/partially shown) for each role. Toggle ON = field is masked for that role.
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6 w-48">Sensitive Field</th>
                      {ROLES.map(r => <th key={r} className="p-4 text-center whitespace-nowrap">{r}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {SENSITIVE_FIELDS.map(({ key, label }) => (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            <Lock size={13} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{label}</span>
                          </div>
                        </td>
                        {ROLES.map(role => (
                          <td key={role} className="p-4 text-center">
                            <div className="flex justify-center">
                              <Toggle
                                value={masking[role]?.[key] || false}
                                onChange={() => toggleMask(role, key)}
                              />
                            </div>
                          </td>
                        ))}
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

export default SystemSettings;
