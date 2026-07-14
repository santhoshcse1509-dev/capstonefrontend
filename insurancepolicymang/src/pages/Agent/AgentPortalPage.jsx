import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Building,
  Key,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const AgentPortalPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bank details states
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [actionType, setActionType] = useState(''); // 'add', 'delete', 'update'
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Add Bank Account Form State
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/commissions/portal-stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
      
      const bankRes = await api.get('/bank-details');
      if (bankRes.data && bankRes.data.success) {
        setBankAccounts(bankRes.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch portal details. Make sure the backend server is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleAddBankSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setRequiresOtp(true);
      setActionType('add');
      return;
    }

    try {
      setOtpError('');
      const res = await api.post('/bank-details', {
        accountHolderName: holderName,
        accountNumber,
        ifscCode,
        bankName,
        otpCode
      });

      if (res.data && res.data.success) {
        // Reset states
        setHolderName('');
        setAccountNumber('');
        setIfscCode('');
        setBankName('');
        setOtpCode('');
        setRequiresOtp(false);
        setShowAddBank(false);
        fetchPortalData();
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'OTP authentication failed.');
    }
  };

  const handleVerifyBank = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/bank-details/${selectedAccountId}/verify`, {
        amount: verificationCode
      });

      if (res.data && res.data.success) {
        setShowVerifyModal(false);
        setVerificationCode('');
        fetchPortalData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed. Input the correct penny drop amount.');
    }
  };

  const handleDeleteBank = async (id) => {
    const otp = prompt('Please enter OTP (123456) to confirm deletion:');
    if (!otp) return;

    try {
      await api.delete(`/bank-details/${id}`, { params: { otpCode: otp } });
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed. Incorrect OTP.');
    }
  };

  const handleMakePrimary = async (id) => {
    try {
      await api.post(`/bank-details/${id}/make-primary`);
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update primary account.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-indigo-650 w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl flex items-center gap-4">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agent Portal Dashboard</h1>
          <p className="text-slate-500">Welcome back, {stats?.agentName}. Manage your book of business and commissions.</p>
        </div>
        <div className="bg-indigo-600/10 text-indigo-750 px-4 py-2 rounded-2xl border border-indigo-200/50 flex items-center gap-2">
          <Award className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">{stats?.tier || 'AGENT'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-650 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Book of Business</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.customerCount} Clients</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Lifetime Earnings</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">₹{stats?.lifetimeCommission?.toLocaleString() || '0'}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Verified Outlets</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {bankAccounts.filter(b => b.isVerified).length} Accounts
            </h3>
          </div>
        </div>
      </div>

      {/* Bank Details Management Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bank Details Management</h2>
            <p className="text-sm text-slate-500">Configure verified destinations for commission payouts.</p>
          </div>
          <button 
            onClick={() => setShowAddBank(!showAddBank)}
            className="bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-sm"
          >
            {showAddBank ? 'Cancel' : 'Add Bank Account'}
          </button>
        </div>

        {showAddBank && (
          <form onSubmit={handleAddBankSubmit} className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Add New Verified Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Account Holder Name</label>
                <input 
                  type="text" 
                  value={holderName} 
                  onChange={e => setHolderName(e.target.value)}
                  required 
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber} 
                  onChange={e => setAccountNumber(e.target.value)}
                  required 
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">IFSC Code</label>
                <input 
                  type="text" 
                  value={ifscCode} 
                  onChange={e => setIfscCode(e.target.value)}
                  required 
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  placeholder="SBIN0001234"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Bank Name</label>
                <input 
                  type="text" 
                  value={bankName} 
                  onChange={e => setBankName(e.target.value)}
                  required 
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  placeholder="State Bank of India"
                />
              </div>
            </div>

            {requiresOtp && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/50 space-y-2 max-w-md">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  Re-Authentication Required
                </div>
                <p className="text-xs text-amber-700">For security, please enter the OTP sent to your registered credentials (demo: <strong>123456</strong>)</p>
                <input 
                  type="text" 
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full px-4 py-2.5 mt-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                {otpError && <p className="text-xs text-red-600 font-semibold">{otpError}</p>}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:bg-indigo-700 transition"
              >
                {requiresOtp ? 'Confirm & Add Account' : 'Request OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="p-6">
          {bankAccounts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No bank accounts registered. Add one to receive commission payouts.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map(account => (
                <div 
                  key={account.id} 
                  className={`p-5 rounded-2xl border transition-all ${account.isPrimary ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-100 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{account.bankName}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{account.accountNumberMasked}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {account.isVerified ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200/50">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedAccountId(account.id);
                            setShowVerifyModal(true);
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          Verify Account
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-5 pt-3 border-t border-slate-100/50">
                    <div className="flex items-center gap-2">
                      {account.isPrimary ? (
                        <span className="text-xs font-bold text-indigo-650 bg-indigo-55/20 px-2.5 py-1 rounded-lg">Primary Payout</span>
                      ) : (
                        <button 
                          disabled={!account.isVerified}
                          onClick={() => handleMakePrimary(account.id)}
                          className="text-xs text-slate-500 hover:text-indigo-650 font-bold transition disabled:opacity-50"
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteBank(account.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-bold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commission Ledger Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Commission Ledger</h2>
          <p className="text-sm text-slate-500">Chronological history of personal sales, overrides, and clawbacks.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="p-4 text-xs font-bold uppercase text-slate-400">Date</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-400">Transaction</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-400">Policy Number</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-400">Amount</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats?.ledger?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-slate-500 text-sm text-center">No ledger records available.</td>
                </tr>
              ) : (
                stats?.ledger?.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition">
                    <td className="p-4 text-sm text-slate-600 font-mono">
                      {new Date(item.processedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800">
                      {item.transactionType}
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-mono">
                      {item.customerPolicy?.policyNumber || 'N/A'}
                    </td>
                    <td className="p-4 text-sm font-black text-slate-800">
                      ₹{item.calculatedAmount?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        item.status === 'CLAWED_BACK' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Penny Drop Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-scaleUp">
            <h3 className="text-lg font-black text-slate-800">Penny Drop Verification</h3>
            <p className="text-slate-500 text-sm mt-2">
              We have initiated a test transaction of <strong>₹1.00</strong> to your bank account. Please input the amount to verify.
            </p>
            <form onSubmit={handleVerifyBank} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Verification Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="e.g. 1.00"
                  required
                  className="w-full px-4 py-2.5 mt-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
                >
                  Verify Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPortalPage;
