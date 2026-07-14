import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LanguageContext } from '../context/LanguageContext';
import NotificationPanel from '../components/common/NotificationPanel';
import FloatingChatBot from '../components/ai/FloatingChatBot';
import {
  LayoutDashboard,
  Calculator,
  ShieldAlert,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  UserCheck,
  Users,
  Sliders,
  History,
  Bell,
  MessageCircle,
  IndianRupee,
} from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'claim', title: 'Claim Status Updated', message: 'Your claim CLM-2024-001 moved to Under Review', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), read: false },
  { id: 'n2', type: 'payment', title: 'Premium Due Reminder', message: 'POL-2024-0012 premium of \u20B918,400 is due in 3 days', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), read: false },
  { id: 'n3', type: 'policy', title: 'Policy Document Ready', message: 'Your HealthGuard policy document is ready for download', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), read: true },
  { id: 'n4', type: 'grievance', title: 'Grievance Acknowledged', message: 'Ticket GRV-2024-001 has been acknowledged by the team', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), read: true },
  { id: 'n5', type: 'claim', title: 'Documents Required', message: 'Additional documents needed for CLM-2024-002', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), read: true },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLanguage, t } = useContext(LanguageContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isAgent = user?.roles?.includes('ROLE_AGENT');
  const unreadCount = notifications.filter(n => !n.read).length;

  const clientMenuItems = [
    { name: 'Dashboard', translationKey: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Get a Quote', translationKey: 'getQuote', path: '/quotes/wizard', icon: Calculator },
    { name: 'Policies', translationKey: 'yourPolicies', path: '/policies', icon: FileText },
    { name: 'Claims', translationKey: 'totalClaims', path: '/claims', icon: ShieldAlert },
    { name: 'Payments', translationKey: 'premium', path: '/payments', icon: CreditCard },
    { name: 'Grievances', translationKey: 'grievances', path: '/grievances', icon: MessageCircle },
    { name: 'Analytics', translationKey: 'analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Profile', translationKey: 'profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', translationKey: 'settings', path: '/settings', icon: Settings },
  ];

  const agentMenuItems = [
    { name: 'Dashboard', translationKey: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Commissions', translationKey: 'commissions', path: '/agent/commissions', icon: CreditCard },
    { name: 'Bank Details', translationKey: 'bankDetails', path: '/agent/bank-details', icon: Sliders },
    { name: 'Profile', translationKey: 'profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', translationKey: 'settings', path: '/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', translationKey: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', translationKey: 'users', path: '/admin/users', icon: Users },
    { name: 'KYC Review', translationKey: 'kyc', path: '/admin/kyc', icon: UserCheck, highlight: true },
    { name: 'Claims Operations', translationKey: 'claimsOps', path: '/admin/claims-ops', icon: ShieldAlert, highlight: true },
    { name: 'Underwriting', translationKey: 'underwriting', path: '/admin/underwriting', icon: FileText, highlight: true },
    { name: 'Reinstatements', translationKey: 'reinstatements', path: '/admin/reinstatements', icon: UserCheck, highlight: true },
    { name: 'Grievance Mgmt', translationKey: 'grievances', path: '/admin/grievances', icon: MessageCircle },
    { name: 'Agent Oversight', translationKey: 'agents', path: '/admin/agents', icon: Users },
    { name: 'Finance & Comm.', translationKey: 'finance', path: '/admin/financials', icon: IndianRupee },
    { name: 'System Settings', translationKey: 'settings', path: '/admin/system-settings', icon: Sliders },
    { name: 'Audit Logs', translationKey: 'logs', path: '/admin/audit-logs', icon: History },
    { name: 'Rate Config', translationKey: 'rates', path: '/admin/rate-configs', icon: Settings, highlight: true },
    { name: 'Analytics', translationKey: 'analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Profile', translationKey: 'profile', path: '/profile', icon: UserIcon },
  ];

  const menuItems = (isAdmin ? adminMenuItems : (isAgent ? agentMenuItems : clientMenuItems)).map(item => ({
    ...item,
    name: t(item.translationKey)
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen flex text-slate-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-indigo-50/90 backdrop-blur-md border-r border-indigo-200/60 shadow-sm flex flex-col justify-between fixed h-full z-20 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[72px]'}`}
      >
        <div className="flex flex-col gap-4">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800/50 h-[65px]">
            <span
              className={`font-black text-lg bg-gradient-to-r from-indigo-650 to-blue-600 bg-clip-text text-transparent tracking-wider transition-all duration-200 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}
            >
              INSUREPRO
            </span>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-0.5 px-3 overflow-y-auto max-h-[calc(100vh-200px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={!sidebarOpen ? item.name : undefined}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-100/80 scale-[1.01]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  } ${item.highlight && !isActive ? 'text-indigo-650 hover:bg-indigo-50/50' : ''}`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <span
                    className={`transition-all duration-200 whitespace-nowrap ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}
                  >
                    {item.name}
                  </span>
                  {item.highlight && sidebarOpen && (
                    <span className={`ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'}`}>NEW</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-2">
          <div className={`flex items-center gap-3 px-2 py-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="h-9 w-9 rounded-xl object-cover shrink-0" onError={(e) => { e.target.style.display='none'; }} />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                {(user?.firstName?.charAt(0) || 'U').toUpperCase()}
              </div>
            )}
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.firstName} {user?.lastName}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  {user?.roles?.[0]?.replace('ROLE_', '') || 'CUSTOMER'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? t('logout') : undefined}
            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all w-full ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              {t('logout')}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'pl-60' : 'pl-[72px]'}`}>
        {/* Top Navbar */}
        <header className="bg-sky-50/90 backdrop-blur-md border-b border-sky-200/60 shadow-sm py-3.5 px-6 flex items-center justify-between sticky top-0 z-10 h-[65px] transition-all">
          <h2 className="text-base font-black bg-gradient-to-r from-indigo-950 to-blue-900 bg-clip-text text-transparent">
            {menuItems.find(item => item.path === location.pathname)?.name || t('dashboard')}
          </h2>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-150 transition-all shadow-sm flex items-center justify-center gap-1"
              title="Change Language / மொழியை மாற்றுக"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c-.006 1.849-.24 3.666-.69 5.412m-.69-5.412A17.962 17.962 0 006.412 9m6.339 0c-.57 2.328-1.547 4.522-2.88 6.49M7.88 15.5H6.412" />
              </svg>
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 text-indigo-650 hover:text-indigo-850 hover:bg-indigo-50/50 rounded-xl transition-all"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Link */}
            <Link
              to="/profile"
              className="p-0.5 border border-indigo-100 hover:border-indigo-300 rounded-full transition-all overflow-hidden flex-shrink-0 shadow-sm bg-white"
              title="Profile"
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="h-7 w-7 rounded-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-[11px]">
                  {(user?.firstName?.charAt(0) || 'U').toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 flex-1">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Floating Chat Bot Widget */}
      <FloatingChatBot />
    </div>
  );
};

export default DashboardLayout;
