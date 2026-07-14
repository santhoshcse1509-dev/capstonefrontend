import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../hooks/useNotification';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import {
  Settings2, PlusCircle, Pencil, ToggleLeft, ToggleRight,
  Shield, ChevronDown, ChevronUp, Search
} from 'lucide-react';

const POLICY_TYPES = ['LIFE', 'HEALTH', 'MOTOR', 'HOME'];

const EMPTY_RATE = { policyTypeName: 'LIFE', factorKey: '', factorValue: '', description: '', active: true };
const EMPTY_RIDER = { riderCode: '', name: '', description: '', ratePercent: '', active: true };

/**
 * AdminRateConfigPage — Admin panel for managing premium rate configs and riders.
 *
 * Allows admins to:
 *  - View/edit/toggle all rate factors per policy type
 *  - Create new rate factors
 *  - View/edit/toggle all rider add-ons
 *  - Create new riders
 */
const AdminRateConfigPage = () => {
  const notification = useNotification();
  const [activeTab, setActiveTab]           = useState('rates');
  const [loading, setLoading]               = useState(true);
  const [rateConfigs, setRateConfigs]       = useState([]);
  const [riders, setRiders]                 = useState([]);
  const [filterType, setFilterType]         = useState('ALL');
  const [searchTerm, setSearchTerm]         = useState('');

  // Rate config modal
  const [rateModal, setRateModal]           = useState(false);
  const [editingRate, setEditingRate]       = useState(null);
  const [rateForm, setRateForm]             = useState(EMPTY_RATE);

  // Rider modal
  const [riderModal, setRiderModal]         = useState(false);
  const [editingRider, setEditingRider]     = useState(null);
  const [riderForm, setRiderForm]           = useState(EMPTY_RIDER);

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rates, riderData] = await Promise.all([
        adminService.getRateConfigs(),
        adminService.getAllRiders(),
      ]);
      setRateConfigs(Array.isArray(rates) ? rates : []);
      setRiders(Array.isArray(riderData) ? riderData : []);
    } catch {
      notification.error('Failed to load rate configuration data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Rate Config Actions ───────────────────────────────────────────────────

  const openCreateRate = () => { setEditingRate(null); setRateForm(EMPTY_RATE); setRateModal(true); };
  const openEditRate = (rc) => {
    setEditingRate(rc);
    setRateForm({ policyTypeName: rc.policyTypeName, factorKey: rc.factorKey, factorValue: rc.factorValue, description: rc.description || '', active: rc.active });
    setRateModal(true);
  };

  const handleSaveRate = async () => {
    if (!rateForm.factorKey.trim()) { notification.error('Factor key is required.'); return; }
    if (!rateForm.factorValue)      { notification.error('Factor value is required.'); return; }
    setSaving(true);
    try {
      if (editingRate) {
        await adminService.updateRateConfig(editingRate.id, rateForm);
        notification.success('Rate config updated successfully.');
      } else {
        await adminService.createRateConfig(rateForm);
        notification.success('Rate config created successfully.');
      }
      setRateModal(false);
      loadData();
    } catch (err) {
      notification.error(err?.response?.data?.message || 'Failed to save rate config.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRate = async (id) => {
    try {
      await adminService.toggleRateConfig(id);
      notification.success('Rate config status toggled.');
      loadData();
    } catch {
      notification.error('Failed to toggle rate config.');
    }
  };

  // ── Rider Actions ─────────────────────────────────────────────────────────

  const openCreateRider = () => { setEditingRider(null); setRiderForm(EMPTY_RIDER); setRiderModal(true); };
  const openEditRider = (r) => {
    setEditingRider(r);
    setRiderForm({ riderCode: r.riderCode, name: r.name, description: r.description || '', ratePercent: r.ratePercent, active: r.active });
    setRiderModal(true);
  };

  const handleSaveRider = async () => {
    if (!riderForm.riderCode.trim()) { notification.error('Rider code is required.'); return; }
    if (!riderForm.name.trim())      { notification.error('Rider name is required.'); return; }
    if (!riderForm.ratePercent)      { notification.error('Rate percent is required.'); return; }
    setSaving(true);
    try {
      if (editingRider) {
        await adminService.updateRider(editingRider.id, riderForm);
        notification.success('Rider updated successfully.');
      } else {
        await adminService.createRider(riderForm);
        notification.success('Rider created successfully.');
      }
      setRiderModal(false);
      loadData();
    } catch (err) {
      notification.error(err?.response?.data?.message || 'Failed to save rider.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRider = async (id) => {
    try {
      await adminService.toggleRider(id);
      notification.success('Rider status toggled.');
      loadData();
    } catch {
      notification.error('Failed to toggle rider.');
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const filteredRates = rateConfigs.filter(rc => {
    const typeMatch  = filterType === 'ALL' || rc.policyTypeName === filterType;
    const termMatch  = !searchTerm || rc.factorKey.toLowerCase().includes(searchTerm.toLowerCase())
                       || (rc.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && termMatch;
  });

  const typeGroups = POLICY_TYPES.reduce((acc, t) => {
    acc[t] = filteredRates.filter(rc => rc.policyTypeName === t);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Settings2 className="text-indigo-500" size={28} />
              Premium Rate Manager
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Configure underwriting rate factors and rider add-ons without redeploying.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {['rates', 'riders'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab === 'rates' ? '📊 Rate Configs' : '🛡️ Riders'}
            </button>
          ))}
        </div>

        {loading ? <Loader /> : (
          <>
            {/* ── Rate Configs Tab ── */}
            {activeTab === 'rates' && (
              <div className="flex flex-col gap-5">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {['ALL', ...POLICY_TYPES].map(t => (
                      <button key={t} onClick={() => setFilterType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          filterType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search factor key..."
                        className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button onClick={openCreateRate}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                      <PlusCircle size={16} /> New Factor
                    </button>
                  </div>
                </div>

                {/* Rate Config Tables by type */}
                {POLICY_TYPES.map(type => {
                  const rows = typeGroups[type];
                  if ((filterType !== 'ALL' && filterType !== type) || rows.length === 0) return null;
                  return (
                    <div key={type} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" /> {type} — {rows.length} factors
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              <th className="px-6 py-3 text-left">Factor Key</th>
                              <th className="px-6 py-3 text-left">Description</th>
                              <th className="px-6 py-3 text-center">Value / Multiplier</th>
                              <th className="px-6 py-3 text-center">Status</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(rc => (
                              <tr key={rc.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${!rc.active ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-3">
                                  <code className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{rc.factorKey}</code>
                                </td>
                                <td className="px-6 py-3 text-slate-500 text-xs max-w-xs truncate">{rc.description || '—'}</td>
                                <td className="px-6 py-3 text-center">
                                  <span className={`font-black text-sm ${
                                    rc.factorKey === 'BASE_RATE_PER_MILLE' ? 'text-violet-700' :
                                    +rc.factorValue > 1 ? 'text-rose-600' :
                                    +rc.factorValue < 1 ? 'text-emerald-600' : 'text-slate-600'
                                  }`}>
                                    {rc.factorKey === 'BASE_RATE_PER_MILLE' ? `₹${rc.factorValue}/‰` : `×${rc.factorValue}`}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rc.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                    {rc.active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={() => openEditRate(rc)}
                                      className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-all" title="Edit">
                                      <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleToggleRate(rc.id)}
                                      className={`p-1.5 rounded-lg transition-all ${rc.active ? 'bg-rose-50 hover:bg-rose-100 text-rose-500' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-500'}`}
                                      title={rc.active ? 'Deactivate' : 'Activate'}>
                                      {rc.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Riders Tab ── */}
            {activeTab === 'riders' && (
              <div className="flex flex-col gap-5">
                <div className="flex justify-end">
                  <button onClick={openCreateRider}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                    <PlusCircle size={16} /> New Rider
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                          <th className="px-6 py-3 text-left">Rider Code</th>
                          <th className="px-6 py-3 text-left">Name</th>
                          <th className="px-6 py-3 text-left">Description</th>
                          <th className="px-6 py-3 text-center">Rate %</th>
                          <th className="px-6 py-3 text-center">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riders.length === 0 ? (
                          <tr><td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">No riders configured.</td></tr>
                        ) : riders.map(r => (
                          <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${!r.active ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                              <code className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">{r.riderCode}</code>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-800">{r.name}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">{r.description || '—'}</td>
                            <td className="px-6 py-4 text-center font-black text-indigo-600">+{r.ratePercent}%</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                {r.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => openEditRider(r)}
                                  className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-all" title="Edit">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => handleToggleRider(r.id)}
                                  className={`p-1.5 rounded-lg transition-all ${r.active ? 'bg-rose-50 hover:bg-rose-100 text-rose-500' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-500'}`}
                                  title={r.active ? 'Deactivate' : 'Activate'}>
                                  {r.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Rate Config Modal ── */}
        <Modal isOpen={rateModal} onClose={() => setRateModal(false)}>
          <div className="flex flex-col gap-5 text-slate-800" style={{ minWidth: 440 }}>
            <h3 className="text-xl font-bold text-slate-900">
              {editingRate ? 'Edit Rate Config Factor' : 'Create Rate Config Factor'}
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Type</label>
              <select value={rateForm.policyTypeName}
                onChange={e => setRateForm(p => ({ ...p, policyTypeName: e.target.value }))}
                disabled={!!editingRate}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none disabled:opacity-60">
                {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Factor Key</label>
              <input value={rateForm.factorKey}
                onChange={e => setRateForm(p => ({ ...p, factorKey: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                disabled={!!editingRate}
                placeholder="e.g. SMOKER, AGE_BAND_46_55"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none disabled:opacity-60" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Factor Value (multiplier)</label>
              <input type="number" step="0.001" min="0.001" value={rateForm.factorValue}
                onChange={e => setRateForm(p => ({ ...p, factorValue: e.target.value }))}
                placeholder="e.g. 1.35 (135% of current, i.e. 35% loading)"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none" />
              <p className="text-xs text-slate-400">{'Values > 1 = loading. Values < 1 = discount. BASE_RATE_PER_MILLE is ₹ per ₹1,000.'}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <input value={rateForm.description}
                onChange={e => setRateForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Human-readable explanation of this factor"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none" />
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRateForm(p => ({ ...p, active: !p.active }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${rateForm.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${rateForm.active ? 'translate-x-6' : ''}`} />
              </button>
              <span className="text-sm font-semibold text-slate-700">{rateForm.active ? 'Active' : 'Inactive'}</span>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => setRateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleSaveRate} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                {saving ? 'Saving...' : (editingRate ? 'Update Factor' : 'Create Factor')}
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Rider Modal ── */}
        <Modal isOpen={riderModal} onClose={() => setRiderModal(false)}>
          <div className="flex flex-col gap-5 text-slate-800" style={{ minWidth: 440 }}>
            <h3 className="text-xl font-bold text-slate-900">
              {editingRider ? 'Edit Rider' : 'Create New Rider'}
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rider Code</label>
              <input value={riderForm.riderCode}
                onChange={e => setRiderForm(p => ({ ...p, riderCode: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                disabled={!!editingRider}
                placeholder="e.g. CRITICAL_ILLNESS"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none disabled:opacity-60" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rider Name</label>
              <input value={riderForm.name}
                onChange={e => setRiderForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Critical Illness Cover"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea value={riderForm.description}
                onChange={e => setRiderForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="What does this rider cover?"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rate % (of base premium)</label>
              <input type="number" step="0.01" min="0.01" max="100" value={riderForm.ratePercent}
                onChange={e => setRiderForm(p => ({ ...p, ratePercent: e.target.value }))}
                placeholder="e.g. 15 adds 15% of the base premium"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none" />
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRiderForm(p => ({ ...p, active: !p.active }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${riderForm.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${riderForm.active ? 'translate-x-6' : ''}`} />
              </button>
              <span className="text-sm font-semibold text-slate-700">{riderForm.active ? 'Active — visible to customers' : 'Inactive'}</span>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => setRiderModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleSaveRider} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                {saving ? 'Saving...' : (editingRider ? 'Update Rider' : 'Create Rider')}
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default AdminRateConfigPage;
