import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/common/Button';

const SettingsPage = () => {
  const [mfa, setMfa] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);

  return (
    <DashboardLayout>
      <div className="max-w-2xl bg-white border border-slate-100 shadow-sm p-8 rounded-2xl flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">System Preferences</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Configure security settings, two-factor auth and notification delivery channels</p>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-50 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-800">Two-Factor Authentication (MFA)</span>
              <span className="text-xs text-slate-400 font-semibold">Secure your login attempts using OTP authenticator apps</span>
            </div>
            <input 
              type="checkbox" 
              checked={mfa} 
              onChange={() => setMfa(!mfa)} 
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-800">Email Notifications</span>
              <span className="text-xs text-slate-400 font-semibold">Receive policy statements, premium bills and claim approvals via email</span>
            </div>
            <input 
              type="checkbox" 
              checked={emailNotif} 
              onChange={() => setEmailNotif(!emailNotif)} 
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => alert('Settings saved successfully.')}>Save Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
