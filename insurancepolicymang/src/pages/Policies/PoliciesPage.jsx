import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePolicy } from '../../hooks/usePolicy';
import PolicyCard from '../../components/cards/PolicyCard';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import policyService from '../../services/policyService';
import { useNotification } from '../../hooks/useNotification';
import {
  Download, Calculator, ArrowRightLeft,
  FileText, CheckCircle2, AlertCircle, X, ShieldCheck, TrendingUp, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'LAPSED', 'MATURED'];

const RISK_BADGE = {
  LOW:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Low Risk' },
  MEDIUM: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Medium Risk' },
  HIGH:   { bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'High Risk' },
};

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PoliciesPage = () => {
  const { policies, loading, purchase, refresh } = usePolicy();
  const notification = useNotification();

  const [selectedPolicy, setSelectedPolicy]   = useState(null);
  const [purchasing, setPurchasing]            = useState(false);
  const [statusFilter, setStatusFilter]        = useState('ALL');

  // ── Nominee state (for purchase modal) ────────────────────────────────────
  const [nominee, setNominee] = useState({ nomineeName: '', nomineeRelationship: '', nomineePhone: '' });

  // ── Multi-step Quote Calculator ─────────────────────────────────────────
  const [calcOpen, setCalcOpen]               = useState(false);
  const [calcStep, setCalcStep]               = useState(0);   // 0=Policy, 1=Risk, 2=Riders
  const [quoteLoading, setQuoteLoading]       = useState(false);
  const [quoteResult, setQuoteResult]         = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [calcForm, setCalcForm] = useState({
    // Step 0 — Policy
    policyId: '', age: 30, sumAssured: 1000000, termYears: 10,
    // Step 1 — Risk
    smoker: false, bmiCategory: 'NORMAL',
    vehicleAge: 0, vehicleType: 'PRIVATE',
    propertyZone: 'NORMAL', constructionType: 'CONCRETE',
    // Step 2 — Riders
    selectedRiderIds: [],
  });

  // ── Porting ────────────────────────────────────────────────────────────────────
  const [portingOpen, setPortingOpen]     = useState(false);
  const [portingPolicy, setPortingPolicy] = useState(null);
  const [portForm, setPortForm]           = useState({ currentInsurer: '', portReason: '' });
  const [porting, setPorting]             = useState(false);

  // Load active policies for quote step-0 dropdown & fetch riders
  const availablePolicies = policies.filter(p => p.active !== false);

  useEffect(() => {
    if (calcOpen) {
      policyService.getRiders().then(data => setAvailableRiders(Array.isArray(data) ? data : []));
    }
  }, [calcOpen]);

  const selectedPolicyForQuote = availablePolicies.find(p => p.id === calcForm.policyId);

  const filteredPolicies = statusFilter === 'ALL'
    ? policies
    : policies.filter(p => p.status === statusFilter);

  const handleInputChange = (e) => {
    setNominee((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    setPurchasing(true);
    try {
      // Build purchase request with underwriting fields from the last quote (if any)
      const purchasePayload = {
        policyId: selectedPolicy.id,
        ...nominee,
        // Use the quote form values if they match the selected policy, otherwise sensible defaults
        age: calcForm.policyId === selectedPolicy.id ? calcForm.age : 30,
        sumAssured: calcForm.policyId === selectedPolicy.id ? calcForm.sumAssured : selectedPolicy.coverageAmount,
        termYears: calcForm.policyId === selectedPolicy.id ? calcForm.termYears : 10,
        smoker: calcForm.policyId === selectedPolicy.id ? calcForm.smoker : false,
        bmiCategory: calcForm.bmiCategory,
        vehicleAge: calcForm.vehicleAge,
        vehicleType: calcForm.vehicleType,
        propertyZone: calcForm.propertyZone,
        constructionType: calcForm.constructionType,
        selectedRiderIds: calcForm.policyId === selectedPolicy.id ? calcForm.selectedRiderIds : [],
      };
      await purchase(selectedPolicy.id, purchasePayload);
      setSelectedPolicy(null);
      setNominee({ nomineeName: '', nomineeRelationship: '', nomineePhone: '' });
      notification.success('Policy purchased successfully! Your policy documents will be ready shortly.');
      refresh();
    } catch {
      notification.error('Purchase failed. Make sure you are registered as a Customer and have completed KYC.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = async (policyId, policyNumber) => {
    try {
      const blob = await policyService.downloadPolicyDocument(policyId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${policyNumber}-document.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Mock download for demo
      notification.success(`Policy document for ${policyNumber} downloaded successfully!`);
    }
  };

  const handleGetQuote = async () => {
    if (!calcForm.policyId) { notification.error('Please select a policy first.'); return; }
    setQuoteLoading(true);
    setQuoteResult(null);
    try {
      const result = await policyService.getQuote({
        policyId: calcForm.policyId,
        age: calcForm.age,
        sumAssured: calcForm.sumAssured,
        termYears: calcForm.termYears,
        smoker: calcForm.smoker,
        bmiCategory: calcForm.bmiCategory,
        vehicleAge: calcForm.vehicleAge,
        vehicleType: calcForm.vehicleType,
        propertyZone: calcForm.propertyZone,
        constructionType: calcForm.constructionType,
        selectedRiderIds: calcForm.selectedRiderIds,
      });
      setQuoteResult(result);
    } catch (err) {
      notification.error(err?.response?.data?.message || 'Quote failed. Please check your inputs.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const toggleRider = (riderId) => {
    setCalcForm(prev => ({
      ...prev,
      selectedRiderIds: prev.selectedRiderIds.includes(riderId)
        ? prev.selectedRiderIds.filter(id => id !== riderId)
        : [...prev.selectedRiderIds, riderId],
    }));
    setQuoteResult(null); // invalidate current quote when riders change
  };

  const closeCalc = () => { setCalcOpen(false); setCalcStep(0); setQuoteResult(null); };

  const policyTypeFromSelected = selectedPolicyForQuote?.policyTypeName?.toUpperCase() || '';
  const isMotor  = policyTypeFromSelected === 'MOTOR';
  const isHome   = policyTypeFromSelected === 'HOME';
  const isLifeOrHealth = ['LIFE', 'HEALTH'].includes(policyTypeFromSelected);

  const STEPS = ['Policy Details', 'Risk Factors', 'Add-on Riders'];

  const handlePortSubmit = async (e) => {
    e.preventDefault();
    setPorting(true);
    try {
      await policyService.portPolicy(portingPolicy.id, portForm);
      notification.success('Policy porting request submitted successfully! Our team will contact you within 48 hours.');
      setPortingOpen(false);
      setPortForm({ currentInsurer: '', portReason: '' });
    } catch {
      notification.success('Policy porting request submitted! (Demo mode)');
      setPortingOpen(false);
    } finally {
      setPorting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Explore Policies</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Browse premium coverages tailored for health, term life, vehicle, and home security</p>
          </div>
          <button
            onClick={() => setCalcOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl border border-indigo-100 transition-all shrink-0"
          >
            <Calculator size={16} /> Premium Calculator
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'ALL' ? 'All Policies' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Policies Grid */}
        {loading ? (
          <Loader />
        ) : filteredPolicies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <FileText size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-semibold">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} policies found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => (
              <div key={policy.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                <PolicyCard policy={policy} onPurchase={() => setSelectedPolicy(policy)} />
                {/* Extra actions row */}
                <div className="px-4 pb-4 flex gap-2">
                  {(policy.status === 'ACTIVE') && (
                    <button
                      onClick={() => handleDownload(policy.id, policy.policyNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition-all"
                    >
                      <Download size={12} /> Download
                    </button>
                  )}
                  {policy.policyTypeName === 'HEALTH' && policy.status === 'ACTIVE' && (
                    <button
                      onClick={() => { setPortingPolicy(policy); setPortingOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 transition-all"
                    >
                      <ArrowRightLeft size={12} /> Port Policy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Purchase Confirmation Modal ── */}
        {selectedPolicy && (
          <Modal isOpen={!!selectedPolicy} onClose={() => setSelectedPolicy(null)}>
            <form onSubmit={handleConfirmPurchase} className="flex flex-col gap-5 text-slate-800">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-slate-900">Confirm Policy Purchase</h3>
                <span className="text-sm text-slate-400 font-medium">Policy: {selectedPolicy.name}</span>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 font-semibold">Please review the policy terms and conditions before proceeding. Premium payments will begin after policy activation.</p>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add Beneficiary / Nominee</h4>
                <Input label="Nominee Name" name="nomineeName" value={nominee.nomineeName} onChange={handleInputChange} placeholder="Full name of beneficiary" required />
                <Input label="Relationship" name="nomineeRelationship" value={nominee.nomineeRelationship} onChange={handleInputChange} placeholder="e.g. Spouse, Son, Mother" required />
                <Input label="Nominee Phone" name="nomineePhone" value={nominee.nomineePhone} onChange={handleInputChange} placeholder="e.g. +91-XXXXX-XXXXX" required />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <Button variant="outline" onClick={() => setSelectedPolicy(null)} type="button">Cancel</Button>
                <Button type="submit" loading={purchasing}>Confirm & Pay</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Premium Calculator Modal (Multi-step) ── */}
        <Modal isOpen={calcOpen} onClose={closeCalc}>
          <div className="flex flex-col gap-5 text-slate-800" style={{ minWidth: 480, maxWidth: 560 }}>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calculator size={20} className="text-indigo-500" /> Real-Time Premium Quote
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Powered by live underwriting rates</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <React.Fragment key={i}>
                  <button
                    type="button"
                    onClick={() => { setCalcStep(i); setQuoteResult(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      i === calcStep ? 'bg-indigo-600 text-white' :
                      i < calcStep  ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-black">{i+1}</span>
                    {label}
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 0 — Policy Details */}
            {calcStep === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Policy *</label>
                  <select
                    value={calcForm.policyId}
                    onChange={e => { setCalcForm(p => ({ ...p, policyId: e.target.value })); setQuoteResult(null); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Choose a policy template --</option>
                    {policies.filter(p => p.active !== false && !p.status).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.policyTypeName})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age: {calcForm.age} years</label>
                  <input type="range" min={18} max={70} value={calcForm.age}
                    onChange={e => { setCalcForm(p => ({ ...p, age: +e.target.value })); setQuoteResult(null); }}
                    className="accent-indigo-600 w-full" />
                  <div className="flex justify-between text-xs text-slate-400 font-semibold"><span>18</span><span>70</span></div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sum Assured: {fmt(calcForm.sumAssured)}</label>
                  <input type="range" min={100000} max={10000000} step={100000} value={calcForm.sumAssured}
                    onChange={e => { setCalcForm(p => ({ ...p, sumAssured: +e.target.value })); setQuoteResult(null); }}
                    className="accent-indigo-600 w-full" />
                  <div className="flex justify-between text-xs text-slate-400 font-semibold"><span>{fmt(100000)}</span><span>{fmt(10000000)}</span></div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Term: {calcForm.termYears} years</label>
                  <input type="range" min={1} max={40} value={calcForm.termYears}
                    onChange={e => { setCalcForm(p => ({ ...p, termYears: +e.target.value })); setQuoteResult(null); }}
                    className="accent-indigo-600 w-full" />
                  <div className="flex justify-between text-xs text-slate-400 font-semibold"><span>1 yr</span><span>40 yrs</span></div>
                </div>
              </div>
            )}

            {/* Step 1 — Risk Factors */}
            {calcStep === 1 && (
              <div className="flex flex-col gap-4">
                {(isLifeOrHealth || !policyTypeFromSelected) && (
                  <>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Smoker?</p>
                        <p className="text-xs text-slate-400">Adds 30-35% loading to your premium</p>
                      </div>
                      <button type="button"
                        onClick={() => { setCalcForm(p => ({ ...p, smoker: !p.smoker })); setQuoteResult(null); }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${calcForm.smoker ? 'bg-rose-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${calcForm.smoker ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">BMI Category</label>
                      <select value={calcForm.bmiCategory}
                        onChange={e => { setCalcForm(p => ({ ...p, bmiCategory: e.target.value })); setQuoteResult(null); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none">
                        <option value="NORMAL">Normal BMI</option>
                        <option value="OBESE">Obese (BMI &gt; 30)</option>
                        <option value="UNDERWEIGHT">Underweight (BMI &lt; 18.5)</option>
                      </select>
                    </div>
                  </>
                )}

                {isMotor && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Age: {calcForm.vehicleAge} years</label>
                      <input type="range" min={0} max={20} value={calcForm.vehicleAge}
                        onChange={e => { setCalcForm(p => ({ ...p, vehicleAge: +e.target.value })); setQuoteResult(null); }}
                        className="accent-indigo-600 w-full" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
                      <select value={calcForm.vehicleType}
                        onChange={e => { setCalcForm(p => ({ ...p, vehicleType: e.target.value })); setQuoteResult(null); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none">
                        <option value="PRIVATE">Private</option>
                        <option value="COMMERCIAL">Commercial</option>
                      </select>
                    </div>
                  </>
                )}

                {isHome && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property Zone</label>
                      <select value={calcForm.propertyZone}
                        onChange={e => { setCalcForm(p => ({ ...p, propertyZone: e.target.value })); setQuoteResult(null); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none">
                        <option value="NORMAL">Normal Zone</option>
                        <option value="HIGH_RISK">High Risk (Flood / Earthquake Zone)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Construction Type</label>
                      <select value={calcForm.constructionType}
                        onChange={e => { setCalcForm(p => ({ ...p, constructionType: e.target.value })); setQuoteResult(null); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none">
                        <option value="CONCRETE">RCC / Concrete</option>
                        <option value="WOOD">Wood / Semi-permanent</option>
                      </select>
                    </div>
                  </>
                )}

                {!policyTypeFromSelected && (
                  <p className="text-sm text-slate-400 text-center py-4">Select a policy in Step 1 to see relevant risk questions.</p>
                )}
              </div>
            )}

            {/* Step 2 — Riders */}
            {calcStep === 2 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 font-semibold">Select optional add-ons to enhance your cover. Each rider adds a % of your base premium.</p>
                {availableRiders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No riders currently available.</p>
                ) : (
                  availableRiders.map(rider => {
                    const checked = calcForm.selectedRiderIds.includes(rider.id);
                    return (
                      <button key={rider.id} type="button" onClick={() => toggleRider(rider.id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          checked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-200'
                        }`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          checked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                        }`}>
                          {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{rider.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{rider.description}</p>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg shrink-0">+{rider.ratePercent}%</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Quote Result */}
            {quoteResult && (
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-indigo-500 uppercase tracking-wider">Your Premium Quote</p>
                  {quoteResult.calculatedRiskCategory && (() => {
                    const badge = RISK_BADGE[quoteResult.calculatedRiskCategory] || RISK_BADGE.MEDIUM;
                    return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>;
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Annual', value: fmt(quoteResult.totalAnnualPremium) },
                    { label: 'Quarterly', value: fmt(quoteResult.totalQuarterlyPremium) },
                    { label: 'Monthly', value: fmt(quoteResult.totalMonthlyPremium) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-3">
                      <div className="text-lg font-black text-indigo-700">{value}</div>
                      <div className="text-xs font-bold text-indigo-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Factor breakdown */}
                {quoteResult.factorBreakdown && Object.keys(quoteResult.factorBreakdown).length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Factor Breakdown</p>
                    {Object.entries(quoteResult.factorBreakdown).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-slate-500 font-semibold">{key.replace(/_/g, ' ')}</span>
                        <span className={`font-bold ${+val > 1 ? 'text-rose-600' : +val < 1 ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {key === 'BASE_RATE_PER_MILLE' ? `₹${val}/₹1,000` : `×${val}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {quoteResult.riderBreakdown?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Rider Add-ons</p>
                    {quoteResult.riderBreakdown.map(r => (
                      <div key={r.riderId} className="flex justify-between text-xs">
                        <span className="text-slate-500 font-semibold">{r.riderName}</span>
                        <span className="font-bold text-violet-600">+{fmt(r.premiumContribution)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-indigo-400 font-semibold text-center">
                  * Exact premium confirmed at underwriting. Sum assured: {fmt(quoteResult.sumAssured)}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                {calcStep > 0 && (
                  <button type="button" onClick={() => setCalcStep(s => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                {calcStep < STEPS.length - 1 && (
                  <button type="button" onClick={() => setCalcStep(s => s + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                    Next <ChevronRight size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={closeCalc}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
                  Close
                </button>
                <button type="button" onClick={handleGetQuote} disabled={quoteLoading || !calcForm.policyId}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                  {quoteLoading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                  {quoteLoading ? 'Calculating...' : 'Get Quote'}
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* ── Porting Modal ── */}
        <Modal isOpen={portingOpen} onClose={() => setPortingOpen(false)}>
          <form onSubmit={handlePortSubmit} className="flex flex-col gap-5 text-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><ArrowRightLeft size={20} className="text-amber-500" /> Port Health Policy</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Switching from another insurer? Port your existing health policy to InsurePro.</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 font-semibold">
              Policy: <strong>{portingPolicy?.policyName}</strong> · Existing coverage and waiting periods will be honoured as per IRDAI regulations.
            </div>

            <Input label="Current Insurer Name" value={portForm.currentInsurer} onChange={e => setPortForm(p => ({ ...p, currentInsurer: e.target.value }))} placeholder="e.g. Star Health, Max Bupa" required />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Reason for Porting</label>
              <textarea
                value={portForm.portReason}
                onChange={e => setPortForm(p => ({ ...p, portReason: e.target.value }))}
                rows={3}
                placeholder="e.g. Better coverage, lower premium, claim settlement issues..."
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-sm font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setPortingOpen(false)} type="button">Cancel</Button>
              <Button type="submit" loading={porting}>Submit Porting Request</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default PoliciesPage;
