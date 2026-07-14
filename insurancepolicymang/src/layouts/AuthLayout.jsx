import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Left side: Branding & Marketing (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-indigo-50 via-slate-50 to-sky-50 text-slate-800 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-100">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#6366f10b_1px,transparent_1px)] [background-size:20px_20px] opacity-100"></div>
        
        {/* Logo/Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">InsurancePro</span>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-auto max-w-md flex flex-col gap-6">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight mb-4 text-slate-800">
            Simplify your insurance, <br />secure your future.
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/70 border border-slate-200/50 shadow-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">AI-Powered Policy Assistance</h4>
                <p className="text-sm text-slate-500 mt-1">Instant support and personalized policy recommendations from our chatbot helper.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/70 border border-slate-200/50 shadow-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Interactive Analytics</h4>
                <p className="text-sm text-slate-500 mt-1">Track policy value, premiums, and claims from a clean dashboard.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/70 border border-slate-200/50 shadow-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Multi-Factor Security</h4>
                <p className="text-sm text-slate-500 mt-1">Industry-standard TOTP MFA protection keeps your policy documents safe.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-400 font-semibold">
          &copy; {new Date().getFullYear()} InsurancePro. All rights reserved.
        </div>
      </div>

      {/* Right side: Form (Centered) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:w-1/2 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Logo for mobile view */}
          <div className="flex items-center gap-2 mb-8 md:hidden justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">InsurancePro</span>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
