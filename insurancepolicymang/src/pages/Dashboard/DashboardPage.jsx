import React, { useEffect, useState, useContext } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatsCard from '../../components/cards/StatsCard';
import RevenueChart from '../../components/charts/RevenueChart';
import { useAuth } from '../../hooks/useAuth';
import { LanguageContext } from '../../context/LanguageContext';
import policyService from '../../services/policyService';
import claimService from '../../services/claimService';
import paymentService from '../../services/paymentService';
import adminService from '../../services/adminService';
import { useNotification } from '../../hooks/useNotification';
import {
  ShieldAlert, FileText, CreditCard, Clock, Users, CheckSquare,
  History, Settings2, Trash2, ArrowUpCircle, Loader2, AlertCircle, ArrowRightLeft
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { normalizeList } from '../../utils/helpers';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const DashboardPage = () => {
  const { user } = useAuth();
  const { t, lang } = useContext(LanguageContext);
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const notification = useNotification();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDynamicGreeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return { text: lang === 'en' ? 'Good morning' : 'காலை வணக்கம்', emoji: '☀️' };
    if (hr < 17) return { text: lang === 'en' ? 'Good afternoon' : 'மதிய வணக்கம்', emoji: '🌤️' };
    return { text: lang === 'en' ? 'Good evening' : 'மாலை வணக்கம்', emoji: '🌙' };
  };

  // Customer State
  const [myPolicies, setMyPolicies] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [payments, setPayments] = useState([]);

  // Admin State
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    totalClaims: 0,
    totalPolicies: 0,
    totalRevenue: 0,
  });
  const [allClaims, setAllClaims] = useState([]);

  // Policy Management Modal State
  const [managingPolicy, setManagingPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'endorsement' | 'cancel' | 'reinstatement'
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Endorsement Wizard State
  const [endorsements, setEndorsements] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [endorseForm, setEndorseForm] = useState({
    nomineeName: '',
    nomineeRelationship: '',
    nomineePhone: '',
    sumAssured: '',
    selectedRiderIds: []
  });
  const [endorseQuote, setEndorseQuote] = useState(null);
  const [calculatingQuote, setCalculatingQuote] = useState(false);
  const [applyingEndorsement, setApplyingEndorsement] = useState(false);

  // Cancellation State
  const [surrenderQuote, setSurrenderQuote] = useState(null);
  const [loadingSurrender, setLoadingSurrender] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reinstatement State
  const [reinstatementPremium, setReinstatementPremium] = useState('');
  const [submittingReinstatement, setSubmittingReinstatement] = useState(false);

  // Porting State
  const [targetPolicyTemplateId, setTargetPolicyTemplateId] = useState('');
  const [porting, setPorting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchUserData();
    }
  }, [isAdmin]);

  const fetchUserData = async () => {
    try {
      const polRes = await policyService.getMyPolicies();
      setMyPolicies(normalizeList(polRes));
      const claimRes = await claimService.getMyClaims();
      setMyClaims(normalizeList(claimRes));
      const payRes = await paymentService.getPaymentHistory();
      setPayments(normalizeList(payRes));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const stats = await adminService.getStats();
      if (stats) {
        setAdminStats({
          totalUsers: stats.totalUsers || 0,
          pendingKyc: stats.pendingKyc || 0,
          totalClaims: stats.totalClaims || 0,
          totalPolicies: stats.totalPolicies || 0,
          totalRevenue: stats.totalRevenue || 0,
        });
      }
      const claims = await claimService.getAllClaims();
      setAllClaims(normalizeList(claims));
    } catch (e) {
      console.error(e);
    }
  };

  // ── Policy Management Actions ──────────────────────────────────────────────
  const handleOpenManager = async (policy) => {
    setManagingPolicy(policy);
    setActiveTab('timeline');
    setEndorseQuote(null);
    setSurrenderQuote(null);
    setCancelReason('');
    setReinstatementPremium('');
    setTargetPolicyTemplateId('');
    
    // Fetch History
    setLoadingHistory(true);
    try {
      const history = await policyService.getStatusHistory(policy.id);
      setStatusHistory(Array.isArray(history) ? history : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }

    // Pre-populate Nominee details if available
    setEndorseForm({
      nomineeName: policy.nomineeName || '',
      nomineeRelationship: policy.nomineeRelationship || '',
      nomineePhone: policy.nomineePhone || '',
      sumAssured: policy.sumAssured || '',
      selectedRiderIds: []
    });

    // Load available riders
    try {
      const riders = await policyService.getRiders();
      setAvailableRiders(Array.isArray(riders) ? riders : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'endorsement') {
      try {
        const list = await policyService.getEndorsements(managingPolicy.id);
        setEndorsements(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
      }
    } else if (tab === 'cancel') {
      setLoadingSurrender(true);
      try {
        const quote = await policyService.getSurrenderValue(managingPolicy.id);
        setSurrenderQuote(quote);
      } catch (e) {
        notification.error(e?.response?.data?.message || 'Failed to calculate surrender value.');
      } finally {
        setLoadingSurrender(false);
      }
    } else if (tab === 'port') {
      try {
        const templates = await policyService.getAllPolicies();
        const filtered = normalizeList(templates).filter(t => t.active !== false && t.id !== managingPolicy.policyId);
        setAvailableTemplates(filtered);
      } catch (e) {
        notification.error('Failed to load available policies for porting.');
      }
    }
  };

  // Endorsement Actions
  const handleQuoteEndorsement = async () => {
    setCalculatingQuote(true);
    setEndorseQuote(null);
    try {
      const payload = {
        sumAssured: endorseForm.sumAssured ? Number(endorseForm.sumAssured) : null,
        selectedRiderIds: endorseForm.selectedRiderIds.length > 0 ? endorseForm.selectedRiderIds : null
      };
      const quote = await policyService.quoteEndorsement(managingPolicy.id, payload);
      setEndorseQuote(quote);
    } catch (e) {
      notification.error(e?.response?.data?.message || 'Failed to calculate endorsement premium impact.');
    } finally {
      setCalculatingQuote(false);
    }
  };

  const handleApplyEndorsement = async (e) => {
    e.preventDefault();
    setApplyingEndorsement(true);
    try {
      const payload = {
        nomineeName: endorseForm.nomineeName || null,
        nomineeRelationship: endorseForm.nomineeRelationship || null,
        nomineePhone: endorseForm.nomineePhone || null,
        sumAssured: endorseForm.sumAssured ? Number(endorseForm.sumAssured) : null,
        selectedRiderIds: endorseForm.selectedRiderIds.length > 0 ? endorseForm.selectedRiderIds : null
      };
      await policyService.applyEndorsement(managingPolicy.id, payload);
      notification.success('Policy endorsement applied successfully!');
      setManagingPolicy(null);
      fetchUserData();
    } catch (e) {
      notification.error(e?.response?.data?.message || 'Failed to apply endorsement.');
    } finally {
      setApplyingEndorsement(false);
    }
  };

  // Cancellation Actions
  const handleCancelPolicy = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to cancel/surrender this policy? This action is permanent.')) return;
    setCancelling(true);
    try {
      await policyService.cancelPolicy(managingPolicy.id, cancelReason);
      notification.success('Policy surrendered successfully.');
      setManagingPolicy(null);
      fetchUserData();
    } catch (e) {
      notification.error(e?.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  // Reinstatement Actions
  const handleRequestReinstatement = async (e) => {
    e.preventDefault();
    if (!reinstatementPremium) {
      notification.error('Please enter payment amount.');
      return;
    }
    setSubmittingReinstatement(true);
    try {
      await policyService.requestReinstatement(managingPolicy.id, Number(reinstatementPremium));
      notification.success('Reinstatement requested! Pending admin review.');
      setManagingPolicy(null);
      fetchUserData();
    } catch (e) {
      notification.error(e?.response?.data?.message || 'Reinstatement request failed.');
    } finally {
      setSubmittingReinstatement(false);
    }
  };

  // Porting Action
  const handlePortPolicy = async (e) => {
    e.preventDefault();
    if (!targetPolicyTemplateId) {
      notification.error('Please select a target plan to port into.');
      return;
    }
    if (!window.confirm('Porting will create a new policy under the selected plan and cancel the current one. Continue?')) return;
    setPorting(true);
    try {
      await policyService.portPolicy(managingPolicy.id, targetPolicyTemplateId);
      notification.success('Policy ported successfully! Your new policy is now active.');
      setManagingPolicy(null);
      fetchUserData();
    } catch (e) {
      notification.error(e?.response?.data?.message || 'Portability request failed.');
    } finally {
      setPorting(false);
    }
  };

  const totalPremiumPaid = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <div className="relative bg-gradient-to-r from-indigo-900/90 to-blue-800/90 text-white rounded-3xl p-6 shadow-lg shadow-indigo-950/20 overflow-hidden backdrop-blur-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-blue-500/25 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-1 z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                {currentTime.toLocaleDateString(lang === 'en' ? 'en-IN' : 'ta-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
                <span>{getDynamicGreeting().emoji}</span>
                <span>
                  {getDynamicGreeting().text}, {user?.firstName || 'Admin'}!
                </span>
              </h1>
              <p className="text-xs font-bold text-indigo-100/80">
                {t('adminSub')}
              </p>
            </div>

            <div className="flex flex-col md:items-end gap-1 z-10">
              <span className="text-lg md:text-xl font-black font-mono tracking-wider bg-white/10 px-3.5 py-1 rounded-xl border border-white/5 shadow-inner">
                {currentTime.toLocaleTimeString(lang === 'en' ? 'en-IN' : 'ta-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50" />
                <span>Systems Secure & Online</span>
              </div>
            </div>
          </div>
 
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title={t('totalUsers')} value={adminStats.totalUsers} icon={Users} trend={t('activeAccounts')} variant="blue" />
            <StatsCard title={t('pendingKyc')} value={adminStats.pendingKyc} icon={CheckSquare} trend={t('requiresReview')} trendType="down" variant="amber" />
            <StatsCard title={t('totalClaims')} value={adminStats.totalClaims} icon={ShieldAlert} trend={t('systemWide')} variant="rose" />
            <StatsCard title={t('totalRevenue')} value={`₹${Number(adminStats.totalRevenue).toLocaleString()}`} icon={CreditCard} trend={t('premiumCollected')} variant="emerald" />
          </div>
 
          {/* Chart + Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
 
            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl shadow-sm flex flex-col gap-4 transition-all duration-300">
              <h3 className="text-lg font-black bg-gradient-to-r from-blue-900 to-indigo-950 bg-clip-text text-transparent">{t('recentClaims')}</h3>
              <div className="flex flex-col gap-3">
                {allClaims.length === 0 ? (
                  <div className="text-center text-sm font-semibold text-slate-400 py-8">
                    {t('noClaims')}
                  </div>
                ) : (
                  allClaims.slice(0, 4).map((claim) => {
                    const isSuccess = claim.status === 'APPROVED' || claim.status === 'PAID';
                    const isFailed = claim.status === 'REJECTED';
                    const itemStyle = isSuccess
                      ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50 border-y border-r border-slate-100/70'
                      : isFailed
                        ? 'border-l-4 border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/50 border-y border-r border-slate-100/70'
                        : 'border-l-4 border-l-amber-500 bg-amber-50/30 hover:bg-amber-50/50 border-y border-r border-slate-100/70';

                    return (
                      <div key={claim.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-all shadow-sm ${itemStyle}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-800">{claim.claimType}</span>
                          <span className="text-xs text-slate-450 font-semibold">{claim.claimNumber}</span>
                        </div>
                        <Badge variant={isSuccess ? 'success' : isFailed ? 'error' : 'warning'}>
                          {claim.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
 
          {/* System Claims Table */}
          <div className="bg-violet-50/80 backdrop-blur-sm border border-violet-200/50 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-violet-100/50 flex items-center justify-between">
              <h3 className="text-lg font-black bg-gradient-to-r from-violet-900 to-indigo-950 bg-clip-text text-transparent">{t('claimsOverview')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-indigo-950/80 font-black tracking-wide text-xs uppercase border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 pl-6">{t('claimNo')}</th>
                    <th className="p-4">{t('customerName')}</th>
                    <th className="p-4">{t('claimType')}</th>
                    <th className="p-4">{t('amountRequested')}</th>
                    <th className="p-4">{t('submissionDate')}</th>
                    <th className="p-4 pr-6">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm font-semibold text-slate-700 dark:text-slate-305">
                  {allClaims.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400 dark:text-slate-500">
                        No claims filed in the system yet.
                      </td>
                    </tr>
                  ) : (
                    allClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 pl-6 text-blue-600 dark:text-indigo-400 font-bold">{claim.claimNumber}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{claim.userName || 'Customer'}</td>
                        <td className="p-4">{claim.claimType}</td>
                        <td className="p-4">₹{Number(claim.claimAmount || 0).toLocaleString()}</td>
                        <td className="p-4">{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-4 pr-6">
                          <Badge variant={claim.status === 'APPROVED' || claim.status === 'PAID' ? 'success' : claim.status === 'REJECTED' ? 'error' : 'warning'}>
                            {claim.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Customer Dashboard
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="relative bg-gradient-to-r from-indigo-900/90 to-blue-800/90 text-white rounded-3xl p-6 shadow-lg shadow-indigo-950/20 overflow-hidden backdrop-blur-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-blue-500/25 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col gap-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                {currentTime.toLocaleDateString(lang === 'en' ? 'en-IN' : 'ta-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {user?.customerId && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-md border border-white/5">
                  {t('customerId')}: <span className="text-indigo-200">{user.customerId}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <span>{getDynamicGreeting().emoji}</span>
              <span>
                {getDynamicGreeting().text}, {user?.firstName || 'User'}!
              </span>
            </h1>
            <p className="text-xs font-bold text-indigo-100/80">
              {t('customerSub')}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-1 z-10">
            <span className="text-lg md:text-xl font-black font-mono tracking-wider bg-white/10 px-3.5 py-1 rounded-xl border border-white/5 shadow-inner">
              {currentTime.toLocaleTimeString(lang === 'en' ? 'en-IN' : 'ta-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50" />
              <span>Systems Secure & Online</span>
            </div>
          </div>
        </div>
 
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title={t('activePolicies')} value={myPolicies.filter(p => p.status === 'ACTIVE').length} icon={FileText} trend={t('normalStatus')} variant="blue" />
          <StatsCard title={t('pendingClaims')} value={myClaims.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length} icon={ShieldAlert} trend={t('underVerification')} trendType="down" variant="amber" />
          <StatsCard title={t('totalPremium')} value={`₹${totalPremiumPaid.toLocaleString()}`} icon={CreditCard} trend={t('autoRenewal')} variant="emerald" />
          <StatsCard title={t('policiesOwned')} value={myPolicies.length} icon={Clock} trend={t('noExpiry')} variant="violet" />
        </div>
 
        {/* Chart + Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
 
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl shadow-sm flex flex-col gap-4 transition-all duration-300">
            <h3 className="text-lg font-black bg-gradient-to-r from-blue-900 to-indigo-950 bg-clip-text text-transparent">{t('recentClaims')}</h3>
            <div className="flex flex-col gap-3">
              {myClaims.length === 0 ? (
                <div className="text-center text-sm font-semibold text-slate-400 py-8">
                  {t('noClaimsUser')}
                </div>
              ) : (
                myClaims.slice(0, 4).map((claim) => {
                  const isSuccess = claim.status === 'APPROVED' || claim.status === 'PAID';
                  const isFailed = claim.status === 'REJECTED';
                  const itemStyle = isSuccess
                    ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50 border-y border-r border-slate-100/70'
                    : isFailed
                      ? 'border-l-4 border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/50 border-y border-r border-slate-100/70'
                      : 'border-l-4 border-l-amber-500 bg-amber-50/30 hover:bg-amber-50/50 border-y border-r border-slate-100/70';

                  return (
                    <div key={claim.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-all shadow-sm ${itemStyle}`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-800">{claim.claimType}</span>
                        <span className="text-xs text-slate-450 font-semibold">{claim.claimNumber}</span>
                      </div>
                      <Badge variant={isSuccess ? 'success' : isFailed ? 'error' : 'warning'}>
                        {claim.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
 
        {/* Insurance Policies Table */}
        <div className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300">
          <div className="p-6 border-b border-indigo-100/50 flex items-center justify-between">
            <h3 className="text-lg font-black bg-gradient-to-r from-indigo-900 to-indigo-950 bg-clip-text text-transparent">{t('yourPolicies')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-indigo-950/80 font-black tracking-wide text-xs uppercase border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 pl-6">{t('policyNo')}</th>
                  <th className="p-4">{t('name')}</th>
                  <th className="p-4">{t('category')}</th>
                  <th className="p-4">{t('coverage')}</th>
                  <th className="p-4">{t('expiryDate')}</th>
                  <th className="p-4">{t('status')}</th>
                  <th className="p-4 pr-6 text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {myPolicies.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      {t('noPoliciesOwned')}
                    </td>
                  </tr>
                ) : (
                  myPolicies.map((pol) => (
                    <tr key={pol.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 pl-6 text-blue-650 dark:text-indigo-400 font-bold">{pol.policyNumber}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{pol.policyName}</td>
                      <td className="p-4">{pol.policyTypeName}</td>
                      <td className="p-4">₹{Number(pol.coverageAmount || 0).toLocaleString()}</td>
                      <td className="p-4">{new Date(pol.endDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            pol.status === 'ACTIVE'
                              ? 'success'
                              : pol.status === 'PENDING_PAYMENT'
                              ? 'warning'
                              : pol.status === 'GRACE_PERIOD'
                              ? 'warning'
                              : pol.status === 'LAPSED'
                              ? 'error'
                              : 'neutral'
                          }
                        >
                          {pol.status}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleOpenManager(pol)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-indigo-950/40 hover:bg-blue-100 dark:hover:bg-indigo-900/50 text-blue-750 dark:text-indigo-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-indigo-900/30 transition-all shadow-sm"
                        >
                          {t('manage')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {managingPolicy && (
          <Modal isOpen={!!managingPolicy} onClose={() => setManagingPolicy(null)}>
            <div className="flex flex-col gap-5 text-slate-800 dark:text-slate-200" style={{ minWidth: 500, maxWidth: 620 }}>
              {/* Header */}
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('managePolicy')}</h3>
                <span className="text-xs font-bold text-slate-405 dark:text-slate-500">
                  {managingPolicy.policyName} · {managingPolicy.policyNumber}
                </span>
              </div>
 
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                {[
                  { id: 'timeline', label: t('timeline'), icon: History },
                  { id: 'endorsement', label: t('endorsement'), icon: Settings2 },
                  { id: 'cancel', label: t('cancel'), icon: Trash2 },
                  ...(managingPolicy.status === 'LAPSED'
                    ? [{ id: 'reinstatement', label: t('reinstate'), icon: ArrowUpCircle }]
                    : []),
                  ...(managingPolicy.status === 'ACTIVE'
                    ? [{ id: 'port', label: 'Port Plan', icon: ArrowRightLeft }]
                    : []),
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-all ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 dark:border-indigo-405 dark:text-indigo-400'
                          : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB: TIMELINE & STATUS HISTORY */}
              {activeTab === 'timeline' && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status History Timeline</h4>
                  {loadingHistory ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                    </div>
                  ) : statusHistory.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-semibold text-sm">
                      No status transitions recorded yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 relative pl-4 border-l border-slate-100 dark:border-slate-800 ml-2">
                      {statusHistory.map((hist, index) => (
                        <div key={hist.id} className="relative flex flex-col gap-1">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-slate-900 ${
                            index === 0 ? 'border-blue-600 dark:border-indigo-400 scale-125' : 'border-slate-300 dark:border-slate-700'
                          }`} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {hist.newStatus || 'INIT'}
                            </span>
                            {hist.oldStatus && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                (from {hist.oldStatus})
                              </span>
                            )}
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded ml-auto">
                              {new Date(hist.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">{hist.reason}</p>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Triggered by: {hist.triggeredBy}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: ENDORSEMENT FORM */}
              {activeTab === 'endorsement' && (
                <form onSubmit={handleApplyEndorsement} className="flex flex-col gap-4">
                  {endorsements.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">APPLIED ENDORSEMENTS</span>
                      {endorsements.map(e => (
                        <div key={e.id} className="text-xs text-slate-650 dark:text-slate-400 flex justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1 last:border-b-0">
                          <span>{e.description}</span>
                          <span className="font-bold text-slate-400 dark:text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-xs flex flex-col gap-1 transition-colors">
                    <span className="text-slate-400 dark:text-slate-505 font-bold">CURRENT VALUES:</span>
                    <div className="grid grid-cols-2 gap-2 font-bold text-slate-700 dark:text-slate-300 mt-1">
                      <div>Nominee: <span className="text-slate-900 dark:text-white">{managingPolicy.nomineeName || 'None'}</span></div>
                      <div>Sum Assured: <span className="text-slate-900 dark:text-white">{fmt(managingPolicy.sumAssured || managingPolicy.coverageAmount)}</span></div>
                      <div>Premium: <span className="text-slate-900 dark:text-white">{fmt(managingPolicy.quotedPremium || 0)}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Request Changes</h5>
                    <Input
                      label="Nominee Name"
                      value={endorseForm.nomineeName}
                      onChange={(e) => setEndorseForm((p) => ({ ...p, nomineeName: e.target.value }))}
                      placeholder="Nominee Full Name"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Relationship"
                        value={endorseForm.nomineeRelationship}
                        onChange={(e) => setEndorseForm((p) => ({ ...p, nomineeRelationship: e.target.value }))}
                        placeholder="e.g. Spouse"
                      />
                      <Input
                        label="Nominee Phone"
                        value={endorseForm.nomineePhone}
                        onChange={(e) => setEndorseForm((p) => ({ ...p, nomineePhone: e.target.value }))}
                        placeholder="e.g. +91-..."
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">New Sum Assured</label>
                      <input
                        type="number"
                        value={endorseForm.sumAssured}
                        onChange={(e) => {
                          setEndorseForm((p) => ({ ...p, sumAssured: e.target.value }));
                          setEndorseQuote(null);
                        }}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white transition-colors"
                        placeholder="e.g. 5000000"
                      />
                    </div>
                  </div>

                  {/* Rider Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Riders (Toggle selection)</label>
                    <div className="flex flex-wrap gap-2">
                      {availableRiders.map((rider) => {
                        const isSelected = endorseForm.selectedRiderIds.includes(rider.id);
                        return (
                          <button
                            key={rider.id}
                            type="button"
                            onClick={() => {
                              setEndorseQuote(null);
                              setEndorseForm((p) => ({
                                ...p,
                                selectedRiderIds: isSelected
                                  ? p.selectedRiderIds.filter((id) => id !== rider.id)
                                  : [...p.selectedRiderIds, rider.id],
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-405'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-100 dark:hover:border-indigo-900/50'
                            }`}
                          >
                            {rider.name} (+{rider.ratePercent}%)
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quote Breakdown */}
                  {endorseQuote && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between font-bold text-indigo-900 dark:text-indigo-300">
                        <span>Current Annual Premium:</span>
                        <span>{fmt(endorseQuote.currentPremium)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-indigo-900 dark:text-indigo-300">
                        <span>New Annual Premium:</span>
                        <span>{fmt(endorseQuote.newPremium)}</span>
                      </div>
                      <div className="flex justify-between font-black text-indigo-700 dark:text-indigo-400 text-sm border-t border-indigo-100 dark:border-indigo-900/30 pt-2">
                        <span>Net Premium Impact:</span>
                        <span>
                          {endorseQuote.premiumImpact >= 0 ? '+' : ''}
                          {fmt(endorseQuote.premiumImpact)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button
                      type="button"
                      disabled={calculatingQuote}
                      onClick={handleQuoteEndorsement}
                      className="px-4 py-2 bg-indigo-55 dark:bg-indigo-955/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-755 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-all flex items-center gap-1"
                    >
                      {calculatingQuote && <Loader2 size={12} className="animate-spin" />}
                      Preview Premium Impact
                    </button>
                    <Button type="submit" loading={applyingEndorsement}>
                      Apply Changes
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB: CANCELLATION & SURRENDER */}
              {activeTab === 'cancel' && (
                <form onSubmit={handleCancelPolicy} className="flex flex-col gap-4">
                  {loadingSurrender ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                    </div>
                  ) : surrenderQuote ? (
                    <div className="flex flex-col gap-4">
                      {/* Notice */}
                      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                        surrenderQuote.isFreeLook 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400' 
                          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-400'
                      }`}>
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div className="text-xs">
                          {surrenderQuote.isFreeLook ? (
                            <p className="font-bold">Free-Look Window Active! You are eligible for a 100% full refund of all premiums paid (within 15 days of purchase).</p>
                          ) : (
                            <p className="font-bold">Policy Surrender Window: You are cancelling outside the 15-day free-look window. Surrender charge and coefficients apply.</p>
                          )}
                          <p className="mt-1">Days Elapsed since start: {surrenderQuote.daysElapsed} days.</p>
                        </div>
                      </div>

                      {/* Refund Calculation Table */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-xs flex flex-col gap-2 font-bold text-slate-700 dark:text-slate-300 transition-colors">
                        <div className="flex justify-between">
                          <span>Total Premiums Paid:</span>
                          <span className="text-slate-900 dark:text-white">{fmt(surrenderQuote.totalPremiumsPaid)}</span>
                        </div>
                        {!surrenderQuote.isFreeLook && (
                          <>
                            <div className="flex justify-between">
                              <span>Gross Surrender Value:</span>
                              <span className="text-slate-900 dark:text-white">{fmt(surrenderQuote.surrenderValue)}</span>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                              <span>Surrender Charge:</span>
                              <span>-{fmt(surrenderQuote.surrenderCharge)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between text-sm text-blue-700 dark:text-indigo-400 border-t border-slate-200/60 dark:border-slate-800 pt-2 font-black">
                          <span>Net Refund Due:</span>
                          <span>{fmt(surrenderQuote.refundAmount)}</span>
                        </div>
                      </div>

                      {/* Reason text */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason for Cancellation</label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={2}
                          placeholder="e.g. Higher cover elsewhere, no longer need..."
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white transition-colors"
                        />
                      </div>

                      <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <button
                          type="button"
                          onClick={() => setManagingPolicy(null)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-all"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          disabled={cancelling}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1"
                        >
                          {cancelling && <Loader2 size={12} className="animate-spin" />}
                          Confirm Surrender & Cancel Policy
                        </button>
                      </div>
                    </div>
                  ) : null}
                </form>
              )}

              {/* TAB: REINSTATEMENT REQUEST */}
              {activeTab === 'reinstatement' && (
                <form onSubmit={handleRequestReinstatement} className="flex flex-col gap-4">
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 rounded-xl p-4 text-xs flex items-start gap-3">
                    <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Lapsed Policy Reinstatement</p>
                      <p className="mt-1 font-semibold text-rose-700 dark:text-rose-400">Your policy is currently LAPSED. You can restore your full coverage by paying the overdue premiums, subject to Admin review and a verified KYC status.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Premium Payment Amount (INR) *</label>
                    <input
                      type="number"
                      value={reinstatementPremium}
                      onChange={(e) => setReinstatementPremium(e.target.value)}
                      placeholder="e.g. 20000"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white transition-colors"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setManagingPolicy(null)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 text-sm font-bold rounded-xl transition-all"
                    >
                      Close
                    </button>
                    <Button type="submit" loading={submittingReinstatement}>
                      Submit Reinstatement Request
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB: PORTABILITY */}
              {activeTab === 'port' && (
                <form onSubmit={handlePortPolicy} className="flex flex-col gap-4">
                  {/* Info banner */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-400 rounded-xl p-4 text-xs flex items-start gap-3">
                    <ArrowRightLeft size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Internal Plan Portability</p>
                      <p className="mt-1 font-semibold text-indigo-700 dark:text-indigo-400">
                        Switch your current policy to a different plan within our product portfolio. Your risk profile and existing lock-in period will be transferred. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  {/* Current policy summary */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col gap-1 transition-colors">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Plan</span>
                    <div className="flex justify-between">
                      <span>{managingPolicy.policyName}</span>
                      <span className="text-slate-500 dark:text-slate-400">{managingPolicy.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sum Assured:</span>
                      <span className="text-slate-900 dark:text-white">{fmt(managingPolicy.sumAssured || managingPolicy.coverageAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Premium:</span>
                      <span className="text-slate-900 dark:text-white">{fmt(managingPolicy.quotedPremium || 0)}</span>
                    </div>
                  </div>

                  {/* Target plan selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Select Target Plan *
                    </label>
                    {availableTemplates.length === 0 ? (
                      <div className="text-sm text-slate-400 dark:text-slate-500 font-semibold py-2">
                        Loading available plans…
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {availableTemplates.map((tmpl) => (
                          <label
                            key={tmpl.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              targetPolicyTemplateId === String(tmpl.id)
                                ? 'border-indigo-400 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30'
                                : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60'
                            }`}
                          >
                            <input
                              type="radio"
                              name="targetPlan"
                              value={String(tmpl.id)}
                              checked={targetPolicyTemplateId === String(tmpl.id)}
                              onChange={() => setTargetPolicyTemplateId(String(tmpl.id))}
                              className="accent-indigo-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.name || tmpl.policyName}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{tmpl.description || tmpl.category}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-indigo-700 dark:text-indigo-400">{fmt(tmpl.basePremium || tmpl.quotedPremium || 0)}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">/ yr</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Warning if active claim exists — shown as static advisory */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 rounded-xl p-3 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p className="font-semibold">Portability is blocked if you have a pending or under-review claim on this policy. Ensure all claims are resolved before proceeding.</p>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setManagingPolicy(null)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-all"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={porting || !targetPolicyTemplateId}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1"
                    >
                      {porting && <Loader2 size={12} className="animate-spin" />}
                      Confirm Port to Selected Plan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
