import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import { useNotification } from '../../hooks/useNotification';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { UserCheck, ShieldAlert, Key, UserCog, Search, Mail, Phone, Plus, UserPlus } from 'lucide-react';

const AgentOversight = () => {
  const notification = useNotification();
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected agent for actions
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);

  // Action forms state
  const [targetStatus, setTargetStatus] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [newAgentData, setNewAgentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'AGENT'
  });
  const [addingAgent, setAddingAgent] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      // Filter out only users with ROLE_AGENT
      const agentList = (data || []).filter(user => 
        user.roles?.some(role => role === 'ROLE_AGENT')
      );
      setAgents(agentList);
      setFilteredAgents(agentList);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = agents.filter(u => 
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
    setFilteredAgents(filtered);
  }, [searchTerm, agents]);

  const handleOpenStatusModal = (agent, status) => {
    setSelectedAgent(agent);
    setTargetStatus(status);
    setIsStatusModalOpen(true);
  };

  const handleOpenRoleModal = (agent) => {
    setSelectedAgent(agent);
    const currentRole = agent.roles?.[0]?.replace('ROLE_', '') || 'AGENT';
    setTargetRole(currentRole);
    setIsRoleModalOpen(true);
  };

  const handleOpenPasswordModal = (agent) => {
    setSelectedAgent(agent);
    setIsPasswordModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.updateUserStatus(selectedAgent.id, targetStatus);
      notification.success(`Agent status updated to ${targetStatus} successfully.`);
      fetchAgents();
      setIsStatusModalOpen(false);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to update agent status');
    }
  };

  const handleChangeRole = async () => {
    try {
      await adminService.changeRole(selectedAgent.id, targetRole);
      notification.success(`Agent role changed to ${targetRole} successfully.`);
      fetchAgents();
      setIsRoleModalOpen(false);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to update agent role');
    }
  };

  const handleResetPassword = async () => {
    try {
      await adminService.resetPassword(selectedAgent.id);
      notification.success('Password reset email triggered successfully.');
      setIsPasswordModalOpen(false);
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to trigger password reset');
    }
  };

  const handleAddAgentChange = (e) => {
    setNewAgentData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddAgentSubmit = async (e) => {
    e.preventDefault();
    setAddingAgent(true);
    try {
      await authService.register(newAgentData);
      notification.success('Agent registered successfully! MFA setup initiated on backend.');
      setIsAddAgentModalOpen(false);
      setNewAgentData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'AGENT'
      });
      fetchAgents();
    } catch (err) {
      notification.error(err.response?.data?.message || 'Failed to register agent. Check password criteria.');
    } finally {
      setAddingAgent(false);
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Agent Oversight</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Monitor sales agents, update statuses, reset credentials, and onboard new agents</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <Button onClick={() => setIsAddAgentModalOpen(true)} className="shrink-0 flex items-center gap-2">
              <Plus size={18} />
              Onboard Agent
            </Button>
          </div>
        </div>

        {/* Agents Table Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/10 border-t-blue-600"></div>
              <span className="text-sm font-bold text-slate-400">Loading agent list...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 pl-6">Agent Name</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Life Commission</th>
                    <th className="p-4">Customers</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                        No agents registered in the system yet.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((u) => {
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/10">
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
                          <td className="p-4 text-slate-800">
                            ₹{Number(u.lifetimeCommission || 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-600">
                            {u.customerCount || 0}
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
                                  title="Activate Agent"
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                >
                                  <UserCheck size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenStatusModal(u, 'SUSPENDED')}
                                  title="Suspend Agent"
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
                {targetStatus === 'ACTIVE' ? 'Activate Agent' : 'Suspend Agent'}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1.5">
                Are you sure you want to change the status of agent <strong>{selectedAgent?.firstName} {selectedAgent?.lastName}</strong> to <strong className="uppercase">{targetStatus}</strong>?
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="flex-1" type="button">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                className={`flex-1 ${targetStatus === 'ACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                Confirm
              </Button>
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
                <h3 className="text-lg font-bold text-slate-900">Change Agent Role</h3>
                <p className="text-xs text-slate-400 font-semibold">Updating role for {selectedAgent?.firstName}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Role</label>
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
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsRoleModalOpen(false)} className="flex-1" type="button">
                Cancel
              </Button>
              <Button onClick={handleChangeRole} className="flex-1">
                Save Role
              </Button>
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
                Generate a temporary token and send a password reset link to <strong>{selectedAgent?.email}</strong>?
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="flex-1" type="button">
                Cancel
              </Button>
              <Button onClick={handleResetPassword} className="flex-1">
                Send Email
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Onboard New Agent */}
        <Modal isOpen={isAddAgentModalOpen} onClose={() => setIsAddAgentModalOpen(false)}>
          <form onSubmit={handleAddAgentSubmit} className="flex flex-col gap-4 p-2 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Onboard New Agent</h3>
                <p className="text-xs text-slate-400 font-semibold">Create a new sales agent profile</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={newAgentData.firstName}
                onChange={handleAddAgentChange}
                placeholder="First"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={newAgentData.lastName}
                onChange={handleAddAgentChange}
                placeholder="Last"
                required
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={newAgentData.email}
              onChange={handleAddAgentChange}
              placeholder="agent@insurepro.com"
              required
            />

            <Input
              label="Onboarding Password"
              name="password"
              type="password"
              value={newAgentData.password}
              onChange={handleAddAgentChange}
              placeholder="e.g. TempPass@123"
              required
            />
            <span className="text-[10px] text-slate-400 -mt-2.5 ml-1">
              * Must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
            </span>

            <Input
              label="Phone Number"
              name="phone"
              value={newAgentData.phone}
              onChange={handleAddAgentChange}
              placeholder="+91-XXXXX-XXXXX"
            />

            <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setIsAddAgentModalOpen(false)} className="flex-1" type="button">
                Cancel
              </Button>
              <Button type="submit" loading={addingAgent} className="flex-1">
                Register Agent
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AgentOversight;
