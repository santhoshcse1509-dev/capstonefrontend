import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// Encode a QR code URI via QuickChart
const buildQrUrl = (otpauthUri) =>
  `https://quickchart.io/qr?text=${encodeURIComponent(otpauthUri)}&size=200&margin=1`;

const LoginPage = () => {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  // Step 1: credentials
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Step 2: MFA
  const [mfaState, setMfaState] = useState({
    tempToken: '',
    mfaSetupUri: '',   // only for accounts that haven't set up MFA yet
    totpCode: '',
  });

  const [step, setStep] = useState(1); // 1 = credentials, 2 = TOTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Step 1: Email + Password ───────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login({ email: formData.email, password: formData.password });

      if (data.mfaRequired) {
        // Move to MFA step
        setMfaState({
          tempToken: data.tempToken || '',
          mfaSetupUri: data.mfaSetupUri || '',
          totpCode: '',
        });
        setStep(2);
        return;
      }
      // No MFA — navigate straight in
      const isAdmin = data?.user?.roles?.includes('ROLE_ADMIN');
      navigate(isAdmin ? '/admin/users' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: TOTP Code ──────────────────────────────────────────
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await verifyMfa({
        tempToken: mfaState.tempToken,
        totpCode: mfaState.totpCode,
      });
      const isAdmin = data?.user?.roles?.includes('ROLE_ADMIN');
      navigate(isAdmin ? '/admin/users' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render: Step 1 — credentials ──────────────────────────────
  if (step === 1) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign in to manage your policy dashboard</p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-sm p-4 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3.5 text-slate-800 dark:text-slate-100">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. name@insurance.com"
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ── Render: Step 2 — TOTP ──────────────────────────────────────
  const isSetupFlow = !!mfaState.mfaSetupUri; // true if account hasn't completed MFA setup yet

  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/20 border border-blue-400/30 mb-3">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-wide text-slate-900 dark:text-white">
            {isSetupFlow ? 'Set Up Authenticator' : 'Two-Factor Authentication'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {isSetupFlow
              ? 'Scan the QR code to complete your account setup'
              : 'Enter the 6-digit code from Google Authenticator'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-sm p-4 rounded-xl text-center font-bold">
            {error}
          </div>
        )}

        {isSetupFlow && (
          <>
            {/* Instructions */}
            <ol className="text-sm text-slate-600 dark:text-slate-350 space-y-3 list-none">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">1</span>
                <span>Install <span className="font-bold text-slate-900 dark:text-white">Google Authenticator</span> on your phone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">2</span>
                <span>Tap <span className="font-bold text-slate-900 dark:text-white">+ → Scan QR code</span> in the app</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">3</span>
                <span>Scan the QR code below and enter the code</span>
              </li>
            </ol>
            <div className="flex justify-center my-2">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                <img
                  src={buildQrUrl(mfaState.mfaSetupUri)}
                  alt="Google Authenticator QR Code"
                  className="w-[180px] h-[180px] dark:brightness-95 dark:invert dark:mix-blend-screen"
                />
              </div>
            </div>
          </>
        )}

        {/* TOTP code form */}
        <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
          <div className="text-slate-800 dark:text-slate-100">
            <Input
              id="totp-login-code"
              label="6-Digit Authentication Code"
              name="totpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={mfaState.totpCode}
              onChange={(e) => setMfaState((prev) => ({ ...prev, totpCode: e.target.value }))}
              placeholder="000000"
              required
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {isSetupFlow ? 'Verify & Sign In' : 'Verify Code'}
          </Button>
        </form>

        <button
          type="button"
          className="text-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors font-bold mt-2"
          onClick={() => { setStep(1); setError(null); }}
        >
          &larr; Back to login
        </button>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
