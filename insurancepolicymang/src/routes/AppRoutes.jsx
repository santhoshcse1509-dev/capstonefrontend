import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleBasedRoute from './RoleBasedRoute';

// Customer Pages
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import PoliciesPage from '../pages/Policies/PoliciesPage';
import ClaimsPage from '../pages/Claims/ClaimsPage';
import PaymentsPage from '../pages/Payments/PaymentsPage';
import AnalyticsPage from '../pages/Analytics/AnalyticsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import SettingsPage from '../pages/Settings/SettingsPage';
import GrievancePage from '../pages/Grievance/GrievancePage';
import QuoteWizardPage from '../pages/Quote/QuoteWizardPage';

// Agent Pages
import AgentPortalPage from '../pages/Agent/AgentPortalPage';

// Admin Pages
import UserManagement from '../pages/Admin/UserManagement';
import AgentOversight from '../pages/Admin/AgentOversight';
import FinancialRecon from '../pages/Admin/FinancialRecon';
import SystemSettings from '../pages/Admin/SystemSettings';
import AuditLogs from '../pages/Admin/AuditLogs';
import ClaimsOperations from '../pages/Admin/ClaimsOperations';
import UnderwritingConsole from '../pages/Admin/UnderwritingConsole';
import GrievanceManagement from '../pages/Admin/GrievanceManagement';
import AdminRateConfigPage from '../pages/Admin/AdminRateConfigPage';
import AdminReinstatementPage from '../pages/Admin/AdminReinstatementPage';
import KycReview from '../pages/Admin/KycReview';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Private/Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/claims" element={<ClaimsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/grievances" element={<GrievancePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/quotes/wizard" element={<QuoteWizardPage />} />

        {/* Agent-only Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['ROLE_AGENT']} />}>
          <Route path="/agent/commissions" element={<AgentPortalPage />} />
          <Route path="/agent/bank-details" element={<AgentPortalPage />} />
        </Route>

        {/* Admin-only Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['ROLE_ADMIN']} />}>
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/kyc" element={<KycReview />} />
          <Route path="/admin/agents" element={<AgentOversight />} />
          <Route path="/admin/financials" element={<FinancialRecon />} />
          <Route path="/admin/system-settings" element={<SystemSettings />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/claims-ops" element={<ClaimsOperations />} />
          <Route path="/admin/underwriting" element={<UnderwritingConsole />} />
          <Route path="/admin/reinstatements" element={<AdminReinstatementPage />} />
          <Route path="/admin/grievances" element={<GrievanceManagement />} />
          <Route path="/admin/rate-configs" element={<AdminRateConfigPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
