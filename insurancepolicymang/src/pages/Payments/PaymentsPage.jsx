import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import paymentService from '../../services/paymentService';
import policyService from '../../services/policyService';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { normalizeList } from '../../utils/helpers';
import { useNotification } from '../../hooks/useNotification';
import {
  Download, Bell, BellOff, AlertCircle, CreditCard,
  Smartphone, Building2, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';

// ── Mock payments for display ────────────────────────────────────────────────
const MOCK_PAYMENTS = [
  { id: 'p1', transactionId: 'TXN-2024-8801', policyNumber: 'POL-2024-0012', policyName: 'HealthGuard Premium', amount: 18400, paymentMethod: 'UPI', paymentDate: '2024-01-05T10:30:00Z', status: 'SUCCESS', autoReminder: true },
  { id: 'p2', transactionId: 'TXN-2024-8802', policyNumber: 'POL-2024-0034', policyName: 'TermLife Secure 1 Crore', amount: 32000, paymentMethod: 'NETBANKING', paymentDate: '2023-12-05T14:15:00Z', status: 'SUCCESS', autoReminder: true },
  { id: 'p3', transactionId: 'TXN-2024-8803', policyNumber: 'POL-2024-0012', policyName: 'HealthGuard Premium', amount: 18400, paymentMethod: 'UPI', paymentDate: '2023-11-05T09:00:00Z', status: 'SUCCESS', autoReminder: false },
  { id: 'p4', transactionId: 'TXN-2023-9101', policyNumber: 'POL-2023-0067', policyName: 'MotorShield Comprehensive', amount: 12800, paymentMethod: 'STRIPE', paymentDate: '2023-10-10T11:45:00Z', status: 'FAILED', autoReminder: false },
];

// ── Upcoming Due (mock) ──────────────────────────────────────────────────────
const UPCOMING_DUE = [
  { policyId: 'p1', policyNumber: 'POL-2024-0012', policyName: 'HealthGuard Premium', amount: 18400, dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), gracePeriodEnd: new Date(Date.now() + 33 * 24 * 3600 * 1000).toISOString() },
  { policyId: 'p2', policyNumber: 'POL-2024-0034', policyName: 'TermLife Secure 1 Crore', amount: 32000, dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(), gracePeriodEnd: new Date(Date.now() + 42 * 24 * 3600 * 1000).toISOString() },
];

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI (Google Pay / PhonePe)', icon: Smartphone },
  { value: 'NETBANKING', label: 'Net Banking (HDFC / SBI / ICICI)', icon: Building2 },
  { value: 'STRIPE', label: 'Credit / Debit Card (Stripe)', icon: CreditCard },
  { value: 'RAZORPAY', label: 'Razorpay Checkout', icon: RefreshCw },
  { value: 'AUTODEBIT', label: 'Auto-Debit (NACH Mandate)', icon: CheckCircle2 },
];

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const PaymentsPage = () => {
  const notification = useNotification();
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [myPolicies, setMyPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ customerPolicyId: '', amount: '', paymentMethod: 'RAZORPAY', upiId: '' });
  const [paying, setPaying] = useState(false);
  const [reminderToggles, setReminderToggles] = useState({ p1: true, p2: true });
  const [razorpayMockData, setRazorpayMockData] = useState(null);

  useEffect(() => {
    loadPolicies();
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPaymentHistory();
      const list = normalizeList(res);
      if (list.length > 0) setPayments(list);
    } catch {
      // Keep mock data
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const res = await policyService.getMyPolicies();
      setMyPolicies(normalizeList(res));
    } catch {}
  };

  const handleInputChange = (e) => {
    setPaymentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const amountVal = parseFloat(paymentForm.amount);
      if (paymentForm.paymentMethod === 'RAZORPAY') {
        const orderRes = await paymentService.createRazorpayOrder(paymentForm.customerPolicyId, amountVal);
        const orderData = orderRes;  // createRazorpayOrder already returns the normalized data object

        if (orderData.isMock) {
          // Open simulated modal
          setPaying(false);
          setRazorpayMockData({
            orderId: orderData.orderId,
            amount: amountVal,
            policyNumber: orderData.policyNumber,
            onConfirm: async () => {
              setPaying(true);
              try {
                const randomId = Math.random().toString(36).substring(2, 12).toUpperCase();
                await paymentService.verifyRazorpayPayment({
                  razorpayOrderId: orderData.orderId,
                  razorpayPaymentId: `pay_sim_${randomId}`,
                  razorpaySignature: `sig_sim_${randomId}`,
                  customerPolicyId: paymentForm.customerPolicyId,
                  amount: amountVal
                });
                setOpenModal(false);
                setPaymentForm({ customerPolicyId: '', amount: '', paymentMethod: 'RAZORPAY', upiId: '' });
                notification.success('Simulated Razorpay payment successful! Receipt will be emailed to you.');
                loadPayments();
              } catch (err) {
                notification.error(
                  err.response?.data?.message || err.message || 'Signature verification failed.'
                );
              } finally {
                setPaying(false);
              }
            },
            onCancel: () => {
              notification.error('Simulated payment cancelled by user.');
            }
          });
        } else {
          // Open real Razorpay Checkout
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            notification.error('Failed to load Razorpay Checkout SDK. Check your internet connection.');
            setPaying(false);
            return;
          }

          const options = {
            key: orderData.keyId,
            amount: orderData.amountInPaise,
            currency: orderData.currency,
            name: 'InsurancePro',
            description: `Premium payment for policy ${orderData.policyNumber}`,
            order_id: orderData.orderId,
            handler: async (response) => {
              setPaying(true);
              try {
                await paymentService.verifyRazorpayPayment({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  customerPolicyId: paymentForm.customerPolicyId,
                  amount: amountVal
                });
                setOpenModal(false);
                setPaymentForm({ customerPolicyId: '', amount: '', paymentMethod: 'RAZORPAY', upiId: '' });
                notification.success('Razorpay payment successful! Receipt will be emailed to your registered address.');
                loadPayments();
              } catch (err) {
                notification.error(
                  err.response?.data?.message || err.message || 'Payment signature verification failed.'
                );
              } finally {
                setPaying(false);
              }
            },
            prefill: {
              name: orderData.customerName,
              email: orderData.customerEmail,
              contact: orderData.customerPhone
            },
            theme: {
              color: '#2563EB'
            },
            modal: {
              ondismiss: () => {
                notification.info('Payment window closed.');
                setPaying(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } else {
        // Standard Payment Method
        await paymentService.makePayment({
          ...paymentForm,
          amount: amountVal
        });
        setOpenModal(false);
        setPaymentForm({ customerPolicyId: '', amount: '', paymentMethod: 'RAZORPAY', upiId: '' });
        notification.success('Premium payment successful! Receipt will be emailed to your registered address.');
        loadPayments();
      }
    } catch (err) {
      notification.error(
        err.response?.data?.message || err.message || 'Payment processing failed.'
      );
    } finally {
      if (paymentForm.paymentMethod !== 'RAZORPAY') {
        setPaying(false);
      }
    }
  };

  const handleDownloadReceipt = (payment) => {
    const receipt = `INSUREPRO PAYMENT RECEIPT\n${'='.repeat(40)}\nTransaction ID: ${payment.transactionId}\nPolicy: ${payment.policyNumber}\nAmount: ${fmt(payment.amount)}\nMethod: ${payment.paymentMethod}\nDate: ${new Date(payment.paymentDate).toLocaleString('en-IN')}\nStatus: ${payment.status}\n${'='.repeat(40)}\nThank you for your payment.`;
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${payment.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notification.success('Receipt downloaded successfully!');
  };

  const toggleReminder = (policyId) => {
    setReminderToggles(prev => ({ ...prev, [policyId]: !prev[policyId] }));
    const next = !reminderToggles[policyId];
    notification.success(next ? 'Auto-reminder enabled for this policy.' : 'Auto-reminder disabled.');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Premium Payments</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage premium deposits, download receipts and set up auto-reminders</p>
          </div>
          <Button onClick={() => setOpenModal(true)}>Pay Premium</Button>
        </div>

        {/* Upcoming Due Section */}
        {UPCOMING_DUE.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Upcoming Premiums</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UPCOMING_DUE.map(due => {
                const days = daysUntil(due.dueDate);
                const graceDays = daysUntil(due.gracePeriodEnd);
                const isUrgent = days <= 5;
                return (
                  <div key={due.policyId} className={`border rounded-2xl p-5 flex items-start justify-between gap-4 ${isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'} shadow-sm`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        {isUrgent && <AlertCircle size={14} className="text-amber-500" />}
                        <span className="text-sm font-bold text-slate-900">{due.policyName}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">{due.policyNumber}</span>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xl font-black text-slate-900">{fmt(due.amount)}</span>
                        <div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                            Due in {days} days
                          </span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Grace period until: {new Date(due.gracePeriodEnd).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => { setPaymentForm(p => ({ ...p, customerPolicyId: due.policyId, amount: due.amount })); setOpenModal(true); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isUrgent ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'}`}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => toggleReminder(due.policyId)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {reminderToggles[due.policyId] ? <Bell size={11} className="text-blue-400" /> : <BellOff size={11} />}
                        {reminderToggles[due.policyId] ? 'Reminder On' : 'Reminder Off'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment History Table */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Transaction History</h2>
          {loading ? (
            <Loader />
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-4 pl-6">Transaction ID</th>
                      <th className="p-4">Policy</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-slate-400">No transactions registered yet.</td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id || payment.transactionId} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6 font-bold text-slate-900 text-xs">{payment.transactionId}</td>
                          <td className="p-4">
                            <div>
                              <div className="text-blue-600 font-bold">{payment.policyNumber}</div>
                              {payment.policyName && <div className="text-xs text-slate-400 font-semibold">{payment.policyName}</div>}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900">{fmt(payment.amount)}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-extrabold">{payment.paymentMethod}</span>
                          </td>
                          <td className="p-4 text-xs text-slate-500">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-4">
                            <Badge variant={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'error' : 'warning'}>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {payment.status === 'SUCCESS' && (
                              <button
                                onClick={() => handleDownloadReceipt(payment)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition-all ml-auto"
                              >
                                <Download size={12} /> Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Payment Modal ── */}
        <Modal isOpen={openModal} onClose={() => setOpenModal(false)}>
          <form onSubmit={handlePay} className="flex flex-col gap-5 text-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Pay Policy Premium</h3>
              <span className="text-sm text-slate-400 font-medium">Select your policy and preferred payment method</span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Policy</label>
                <select
                  name="customerPolicyId"
                  value={paymentForm.customerPolicyId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-sm font-semibold"
                >
                  <option value="">-- Choose Policy --</option>
                  {myPolicies.map((pol) => (
                    <option key={pol.id} value={pol.id}>{pol.policyName} ({pol.policyNumber})</option>
                  ))}
                  {myPolicies.length === 0 && UPCOMING_DUE.map(d => (
                    <option key={d.policyId} value={d.policyId}>{d.policyName} ({d.policyNumber})</option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount (₹)"
                name="amount"
                type="number"
                value={paymentForm.amount}
                onChange={handleInputChange}
                placeholder="e.g. 18400"
                required
              />

              {/* Payment Method Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                <div className="flex flex-col gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all ${paymentForm.paymentMethod === value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={value}
                        checked={paymentForm.paymentMethod === value}
                        onChange={handleInputChange}
                        className="text-blue-600"
                      />
                      <Icon size={16} className={paymentForm.paymentMethod === value ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`text-sm font-bold ${paymentForm.paymentMethod === value ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {paymentForm.paymentMethod === 'UPI' && (
                <Input
                  label="UPI ID"
                  name="upiId"
                  value={paymentForm.upiId}
                  onChange={handleInputChange}
                  placeholder="e.g. name@upi"
                />
              )}
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 font-semibold">Your payment is secured with 256-bit SSL encryption. A receipt will be emailed after successful payment.</p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setOpenModal(false)} type="button">Cancel</Button>
              <Button type="submit" loading={paying}>
                {paymentForm.paymentMethod === 'RAZORPAY' ? 'Pay with Razorpay' : 'Process Payment'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Razorpay Mock Simulation Modal */}
        <Modal isOpen={!!razorpayMockData} onClose={() => setRazorpayMockData(null)}>
          <div className="flex flex-col gap-5 text-slate-800 p-2">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-600 tracking-wider">RAZORPAY</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">TEST MODE</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Order: {razorpayMockData?.orderId}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2 border">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500">Policy Number:</span>
                <span className="text-slate-900 font-bold">{razorpayMockData?.policyNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500">Amount Due:</span>
                <span className="text-slate-900 font-black text-lg text-blue-600">{fmt(razorpayMockData?.amount || 0)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              This is a simulated Razorpay payment gateway because the server is running with dummy API keys. You can simulate a successful transaction signature or mock a user cancellation.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  if (razorpayMockData?.onCancel) razorpayMockData.onCancel();
                  setRazorpayMockData(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel / Fail
              </button>
              <button
                type="button"
                onClick={() => {
                  if (razorpayMockData?.onConfirm) razorpayMockData.onConfirm();
                  setRazorpayMockData(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Simulate Success Payment
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;
