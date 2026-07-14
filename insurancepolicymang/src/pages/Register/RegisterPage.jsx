import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// Encode a QR code URI via QuickChart (reliable open source alternative to Google Charts)
const buildQrUrl = (otpauthUri) =>
  `https://quickchart.io/qr?text=${encodeURIComponent(otpauthUri)}&size=220&margin=1`;

const RegisterPage = () => {
  const { register, verifyMfa } = useAuth();
  const navigate = useNavigate();

  // Step 1 form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
  });

  // Step 2 MFA setup fields
  const [mfaData, setMfaData] = useState({
    mfaSetupUri: '',
    tempToken: '',
    totpCode: '',
  });

  const [step, setStep] = useState(1); // 1 = registration form, 2 = MFA setup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const password = formData.password || '';
  const meetsLength = password.length >= 8;
  const meetsUpper = /[A-Z]/.test(password);
  const meetsLower = /[a-z]/.test(password);
  const meetsNumber = /\d/.test(password);
  const meetsSpecial = /[@$!%*?&]/.test(password);
  const isPasswordValid = meetsLength && meetsUpper && meetsLower && meetsNumber && meetsSpecial;

  // ── Step 1: Submit registration form ───────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not meet the security criteria. Please follow the requirements checklist.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await register(formData);
      // Backend returns mfaRequired=true + mfaSetupUri + tempToken
      if (data.mfaRequired || data.mfaSetupUri) {
        setMfaData({
          mfaSetupUri: data.mfaSetupUri || '',
          tempToken: data.tempToken || '',
          totpCode: '',
        });
        setStep(2);
      } else {
        // If no MFA required, proceed to dashboard
        const isAdmin = data?.user?.roles?.includes('ROLE_ADMIN');
        navigate(isAdmin ? '/admin/users' : '/dashboard');
      }
    } catch (err) {
      // 405 errors are handled by demo mode fallback, so only show other errors
      if (err.response?.status !== 405) {
        const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Try again.';
        setError(errorMsg);
      }
      console.error('[v0] Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify TOTP code to complete setup ─────────────────
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await verifyMfa({
        tempToken: mfaData.tempToken,
        totpCode: mfaData.totpCode,
      });
      const isAdmin = data?.user?.roles?.includes('ROLE_ADMIN');
      navigate(isAdmin ? '/admin/users' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Registration Form ──────────────────────────────────
  if (step === 1) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Get custom policy plans and AI assistance</p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-sm p-4 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 text-slate-800 dark:text-slate-100">
            <div className="flex gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last"
                required
              />
            </div>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. user@insurance.com"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              required
            />
            {password.length > 0 && (
              <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold -mt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Password Requirements</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${meetsLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{meetsLength ? '✓' : '•'}</span>
                    <span>Min 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${meetsUpper ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{meetsUpper ? '✓' : '•'}</span>
                    <span>1 uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${meetsLower ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{meetsLower ? '✓' : '•'}</span>
                    <span>1 lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${meetsNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{meetsNumber ? '✓' : '•'}</span>
                    <span>1 number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${meetsSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{meetsSpecial ? '✓' : '•'}</span>
                    <span>1 symbol (@$!%*?&)</span>
                  </div>
                </div>
              </div>
            )}
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91-XXXXX-XXXXX"
            />


            <Button type="submit" loading={loading} className="w-full mt-2">
              Continue to MFA Setup
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-650 dark:text-indigo-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ── Step 2: Google Authenticator Setup ─────────────────────────
  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-400/30 mb-3">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-wide text-slate-900 dark:text-white">Set Up Authenticator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Secure your account with Google Authenticator</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-sm p-4 rounded-xl text-center font-bold">
            {error}
          </div>
        )}

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
            <span>Scan the QR code below</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">4</span>
            <span>Enter the <span className="font-bold text-slate-900 dark:text-white">6-digit code</span> to confirm</span>
          </li>
        </ol>

        {/* QR Code */}
        {mfaData.mfaSetupUri && (
          <div className="flex justify-center my-2">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <img
                src={buildQrUrl(mfaData.mfaSetupUri)}
                alt="Google Authenticator QR Code"
                className="w-[180px] h-[180px] dark:brightness-95 dark:invert dark:mix-blend-screen"
              />
            </div>
          </div>
        )}

        {/* Code input + submit */}
        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
          <div className="text-slate-850 dark:text-slate-100">
            <Input
              id="totp-code"
              label="6-Digit Verification Code"
              name="totpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={mfaData.totpCode}
              onChange={(e) => setMfaData((prev) => ({ ...prev, totpCode: e.target.value }))}
              placeholder="000000"
              required
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Verify &amp; Complete Setup
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
          QR code expires in 5 minutes. If it expires,{' '}
          <button
            type="button"
            className="text-indigo-650 dark:text-indigo-400 hover:underline font-bold"
            onClick={() => { setStep(1); setError(null); }}
          >
            start over
          </button>.
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
