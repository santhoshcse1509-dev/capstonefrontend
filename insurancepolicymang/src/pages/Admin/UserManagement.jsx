import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../hooks/useNotification';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { UserCheck, ShieldAlert, Key, UserCog, Search, Mail, Phone, MapPin, Calendar } from 'lucide-react';

const UserManagement = () => {
  const notification = useNotification();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Action forms state
  const [targetStatus, setTargetStatus] = useState('');
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(u => 
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (user, status) => {
    setSelectedUser(user);
    setTargetStatus(status);
    setIsStatusModalOpen(true);
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    // Find current role and set as default select value
    const currentRole = user.roles?.[0]?.replace('ROLE_', '') || 'CUSTOMER';
    setTargetRole(currentRole);
    setIsRoleModalOpen(true);
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.updateUserStatus(selectedUser.id, targetStatus);
      notification.success(`User status updated to ${targetStatus} successfully.`);
      fetchUsers();
      setIsStatusModalOpen(false);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleChangeRole = async () => {
    try {
      await adminService.changeRole(selectedUser.id, targetRole);
      notification.success(`User role changed to ${targetRole} successfully.`);
      fetchUsers();
      setIsRoleModalOpen(false);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleResetPassword = async () => {
    try {
      await adminService.resetPassword(selectedUser.id);
      notification.success('Password reset email triggered successfully.');
      setIsPasswordModalOpen(false);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to trigger password reset');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'DEACTIVATED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getKycVariant = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage user account statuses, assign roles, and trigger password resets</p>
          </div>
          
          <div className="relative max-w-sm w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/10 border-t-blue-600"></div>
              <span className="text-sm font-bold text-slate-400">Loading user database...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 pl-6">Name</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">KYC Status</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const primaryRole = u.roles?.[0]?.replace('ROLE_', '') || 'CUSTOMER';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/10">
                                {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-900 font-bold text-base">{u.firstName} {u.lastName}</span>
                                <span className="text-xs text-slate-400 font-semibold">ID: {u.id.substring(0, 8)}...</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                                <Mail size={13} className="text-slate-400" />
                                {u.email}
                              </span>
                              {u.phone && (
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <Phone size={13} className="text-slate-400" />
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {primaryRole}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge variant={getKycVariant(u.kycStatus)}>
                              {u.kycStatus || 'PENDING'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={getStatusVariant(u.accountStatus)}>
                              {u.accountStatus || 'ACTIVE'}
                            </Badge>
                          </td>
                          <td className="p-4 pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.accountStatus === 'SUSPENDED' || u.accountStatus === 'DEACTIVATED' ? (
                                <button
                                  onClick={() => handleOpenStatusModal(u, 'ACTIVE')}
                                  title="Activate User"
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                >
                                  <UserCheck size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenStatusModal(u, 'SUSPENDED')}
                                  title="Suspend User"
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                >
                                  <ShieldAlert size={18} />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenPasswordModal(u)}
                                title="Reset Password"
                                className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                              >
                                <Key size={18} />
                              </button>

                              <button
                                onClick={() => handleOpenRoleModal(u)}
                                title="Change Role"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <UserCog size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Status Confirmation */}
        <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
          <div className="flex flex-col gap-4 text-center p-2">
            <div className={`mx-auto h-12 w-12 rounded-2xl flex items-center justify-center ${
              targetStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {targetStatus === 'ACTIVE' ? <UserCheck size={24} /> : <ShieldAlert size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {targetStatus === 'ACTIVE' ? 'Activate Account' : 'Suspend Account'}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1.5">
                Are you sure you want to change the status of <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong> to <strong className="uppercase">{targetStatus}</strong>?
              </p>
              {targetStatus === 'SUSPENDED' && (
                <p className="text-xs text-rose-500 font-bold mt-2">
                  * This will temporarily lock their account and prevent login access.
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-md transition-all ${
                  targetStatus === 'ACTIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Change Role */}
        <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)}>
          <div className="flex flex-col gap-4 p-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCog size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Change User Role</h3>
                <p className="text-xs text-slate-400 font-semibold">Updating role for {selectedUser?.firstName}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Primary Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="AGENT">Agent</option>
                <option value="CLAIMS_OFFICER">Claims Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                * Note: Changing a user's role immediately adjusts their permissions. Demotions of the last remaining administrator are automatically blocked.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all"
              >
                Save Role
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Reset Password */}
        <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
          <div className="flex flex-col gap-4 text-center p-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center">
              <Key size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Trigger Password Reset</h3>
              <p className="text-sm text-slate-500 font-medium mt-1.5">
                Generate a temporary token and send a password reset link to <strong>{selectedUser?.email}</strong>?
              </p>
              <p className="text-xs text-slate-400 font-semibold mt-2">
                * The user will receive an email containing a link valid for 15 minutes.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all"
              >
                Send Email
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
