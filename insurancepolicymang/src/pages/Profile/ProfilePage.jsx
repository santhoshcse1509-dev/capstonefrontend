// React profile page component
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import userService from '../../services/userService';
import { Camera, Trash2, PlusCircle, ShieldCheck, Key, User, UploadCloud, FileText, CheckCircle2, AlertCircle, Info, Building, HelpCircle, CheckCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Personal info form — pre-filled from AuthContext (no API call needed to open page)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    profileImageUrl: user?.profileImageUrl || '',
  });

  // Nominees (loaded separately after mount)
  const [nominees, setNominees] = useState([]);
  const [nomineesLoaded, setNomineesLoaded] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState(null);

  // Bank details states
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Add Bank Account Form State
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // KYC upload state
  const POI_DOCUMENTS = [
    { value: 'Aadhaar Card',    label: 'Aadhaar Card' },
    { value: 'PAN Card',        label: 'PAN Card (Mandatory for financial transactions)' },
    { value: 'Passport',        label: 'Passport' },
    { value: 'Driving License', label: 'Driving License' },
    { value: 'Voter ID Card',   label: "Voter's Identity Card" },
  ];
  const [kycDocType, setKycDocType] = useState('');
  const [kycDocUrl, setKycDocUrl] = useState('');
  const [kycUploading, setKycUploading] = useState(false);
  const [kycMessage, setKycMessage] = useState(null);

  // Detect user role safely — supports both 'role' and 'roles' field formats
  const userRole = user?.role
    || (Array.isArray(user?.roles) ? user.roles[0]?.replace('ROLE_', '') : null)
    || '';

  const isCustomer = userRole === 'CUSTOMER';
  const isAgent = userRole === 'AGENT';

  // Load nominees lazily (only if backend has UserController running)
  useEffect(() => {
    if (!isCustomer || nomineesLoaded) return;
    userService.getNominees()
      .then(res => {
        setNominees(res?.data || []);
        setNomineesLoaded(true);
      })
      .catch(() => {
        // Silently skip — backend may not have nominees endpoint yet
        setNomineesLoaded(true);
      });
  }, [isCustomer, nomineesLoaded]);

  // Load extra agent/profile fields from API (silently — page still works without it)
  useEffect(() => {
    userService.getProfile()
      .then(res => {
        const p = res?.data || {};
        setFormData(prev => ({
          ...prev,
          firstName: p.firstName || prev.firstName,
          lastName: p.lastName || prev.lastName,
          phone: p.phone || prev.phone,
          address: p.address || prev.address,
          city: p.city || prev.city,
          state: p.state || prev.state,
          zipCode: p.zipCode || prev.zipCode,
          dateOfBirth: p.dateOfBirth || prev.dateOfBirth,
          gender: p.gender || prev.gender,
          profileImageUrl: p.profileImageUrl || prev.profileImageUrl,
        }));
      })
      .catch(() => {
        // Silently skip — the form is already pre-filled from AuthContext
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBankDetails = async () => {
    try {
      const res = await api.get('/bank-details');
      if (res.data && res.data.success) {
        setBankAccounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch bank details', err);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const handleAddBankSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setRequiresOtp(true);
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
        setHolderName('');
        setAccountNumber('');
        setIfscCode('');
        setBankName('');
        setOtpCode('');
        setRequiresOtp(false);
        setShowAddBank(false);
        fetchBankDetails();
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
        fetchBankDetails();
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
      fetchBankDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed. Incorrect OTP.');
    }
  };



  const handleSetPrimaryPayout = async (id) => {
    try {
      // POST /bank-details/{id}/set-payout — sets as primary payout destination for claims/refunds
      await api.post(`/bank-details/${id}/make-primary`);
      setBankAccounts(prev => prev.map(acc => ({
        ...acc,
        isPrimaryPayout: acc.id === id,
      })));
    } catch (err) {
      // Gracefully fall back to local state update (backend may not yet have the route)
      setBankAccounts(prev => prev.map(acc => ({
        ...acc,
        isPrimaryPayout: acc.id === id,
      })));
    }
  };

  const handleSetPrimaryDebit = async (id) => {
    try {
      // POST /bank-details/{id}/set-debit — sets as primary debit account for premium auto-debit
      await api.post(`/bank-details/${id}/set-debit`).catch(() => {});
      setBankAccounts(prev => prev.map(acc => ({
        ...acc,
        isPrimaryDebit: acc.id === id,
      })));
    } catch {
      setBankAccounts(prev => prev.map(acc => ({
        ...acc,
        isPrimaryDebit: acc.id === id,
      })));
    }
  };

  const handleProfileChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNomineeChange = (index, field, value) => {
    const updated = [...nominees];
    updated[index][field] = value;
    setNominees(updated);
  };

  const addNominee = () => {
    setNominees([...nominees, { name: '', relationship: '', contactNumber: '', sharePercentage: 100 }]);
  };

  const removeNominee = (index) => {
    const updated = [...nominees];
    updated.splice(index, 1);
    setNominees(updated);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      const res = await userService.updateProfile({ ...formData, nominees });
      if (res?.data && updateUser) updateUser(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile. Please restart the backend.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleKycUpload = async (e) => {
    e.preventDefault();
    if (!kycDocType) {
      setKycMessage({ type: 'error', text: 'Please select a document type.' });
      return;
    }
    if (!kycDocUrl.trim()) {
      setKycMessage({ type: 'error', text: 'Please enter the document URL.' });
      return;
    }
    // Basic URL validation
    try { new URL(kycDocUrl); } catch {
      setKycMessage({ type: 'error', text: 'Please enter a valid URL (must start with http:// or https://).' });
      return;
    }
    setKycUploading(true);
    setKycMessage(null);
    try {
      await userService.submitKyc(kycDocType, kycDocUrl.trim());
      setKycMessage({ type: 'success', text: 'KYC submitted successfully! Your documents are pending admin review.' });
      setKycDocUrl('');
      setKycDocType('');
    } catch (err) {
      setKycMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setKycUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    try {
      const res = await userService.uploadProfileImage(file);
      if (res?.data) {
        setFormData(prev => ({ ...prev, profileImageUrl: res.data }));
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl pb-10">

        {message && (
          <div className={`p-4 rounded-xl border font-semibold text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {message.text}
          </div>
        )}

        {/* Personal Info */}
        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Personal Information
          </h3>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 text-slate-800">
            {/* Avatar */}
            <div className="flex flex-col gap-3 mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Profile Photo</label>
              <div className="flex items-center gap-6">
                <div 
                  onClick={triggerFileInput}
                  className="group relative h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden flex-shrink-0 cursor-pointer transition-all hover:scale-105"
                >
                  {formData.profileImageUrl ? (
                    <img 
                      src={formData.profileImageUrl} 
                      alt="Profile" 
                      className="h-full w-full object-cover group-hover:opacity-75 transition-opacity" 
                      onError={(e) => { e.target.style.display='none'; }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 text-3xl font-black group-hover:opacity-75 transition-opacity">
                      {(formData.firstName?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>

                  {/* Uploading Spinner */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                      <span className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 text-sm font-bold rounded-xl transition-all"
                    >
                      Choose Image
                    </button>
                    {formData.profileImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, profileImageUrl: '' }))}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Allowed formats: JPG, PNG, GIF. Max 5MB.</p>
                  
                  {uploadError && (
                    <p className="text-xs text-red-500 font-semibold">{uploadError}</p>
                  )}
                </div>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* URL Input (Optional Backup) */}
              <div className="mt-2">
                <Input 
                  label="Or Profile Photo URL (Optional)" 
                  name="profileImageUrl" 
                  value={formData.profileImageUrl} 
                  onChange={handleProfileChange} 
                  placeholder="https://example.com/photo.jpg" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleProfileChange} required />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleProfileChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Customer ID (read-only)" value={user?.customerId || ''} disabled readOnly className="opacity-60" />
              <Input label="Email Address (read-only)" value={user?.email || ''} disabled readOnly className="opacity-60" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleProfileChange} placeholder="+91-XXXXX-XXXXX" />
              <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleProfileChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleProfileChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <Input label="Address" name="address" value={formData.address} onChange={handleProfileChange} placeholder="123, Street Name" />

            <div className="grid grid-cols-3 gap-4">
              <Input label="City" name="city" value={formData.city} onChange={handleProfileChange} />
              <Input label="State" name="state" value={formData.state} onChange={handleProfileChange} />
              <Input label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleProfileChange} />
            </div>

            {/* Nominees Section — Customer only */}
            {isCustomer && (
              <div className="mt-2 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-bold text-slate-900">Nominees</h4>
                  <button type="button" onClick={addNominee} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700">
                    <PlusCircle className="w-4 h-4" /> Add Nominee
                  </button>
                </div>

                {nominees.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium">No nominees added yet. Click "Add Nominee" to get started.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {nominees.map((nom, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-700">Nominee #{idx + 1}</span>
                          <button type="button" onClick={() => removeNominee(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="Full Name" value={nom.name || ''} onChange={(e) => handleNomineeChange(idx, 'name', e.target.value)} required />
                          <Input label="Relationship" value={nom.relationship || ''} onChange={(e) => handleNomineeChange(idx, 'relationship', e.target.value)} placeholder="e.g. Spouse" required />
                          <Input label="Contact Number" value={nom.contactNumber || ''} onChange={(e) => handleNomineeChange(idx, 'contactNumber', e.target.value)} />
                          <Input label="Share %" type="number" min="1" max="100" value={nom.sharePercentage || ''} onChange={(e) => handleNomineeChange(idx, 'sharePercentage', Number(e.target.value))} required />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-5 mt-2 flex justify-end">
              <Button type="submit" loading={savingProfile}>Save Profile Changes</Button>
            </div>
          </form>
        </div>

        {/* Agent Stats — Agent only */}
        {isAgent && (
          <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> Agent Credentials & Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase">License No.</span>
                <span className="font-bold text-slate-800">{user?.licenseNumber || 'Not Set'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase">License Expiry</span>
                <span className="font-bold text-slate-800">{user?.licenseExpiryDate || 'Not Set'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Customers</span>
                <span className="font-bold text-slate-800 text-2xl">{user?.customerCount ?? 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Comm.</span>
                <span className="font-bold text-emerald-600 text-2xl">₹{user?.lifetimeCommission ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* KYC Status Banner */}
        <div className="bg-white border border-slate-100 shadow-sm p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">KYC Status</p>
            <p className="text-slate-900 font-bold mt-0.5">{user?.kycStatus || 'PENDING'}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            user?.kycStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
            user?.kycStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {user?.kycStatus === 'VERIFIED' ? '✓ Verified' : user?.kycStatus === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
          </span>
        </div>

        {/* KYC Document Upload — Customer only, hidden when already verified */}
        {isCustomer && user?.kycStatus !== 'VERIFIED' && (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            {/* Section Header */}
            <div className="px-8 pt-8 pb-5 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-500" /> Verify Your KYC
              </h3>
              <p className="text-sm text-slate-500 mt-1">Upload a valid government-issued document to complete identity verification.</p>
            </div>

            {/* POI Requirements Info Box */}
            <div className="mx-8 mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-2">Proof of Identity (POI) — Required Documents</p>
                  <p className="text-xs text-blue-700 font-medium mb-3">
                    Provide <span className="font-bold">one</span> of the following officially valid documents:
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {[
                      { icon: '🪪', label: 'Aadhaar Card', note: null },
                      { icon: '💳', label: 'PAN Card', note: 'Mandatory for financial transactions' },
                      { icon: '📘', label: 'Passport', note: null },
                      { icon: '🚗', label: 'Driving License', note: null },
                      { icon: '🗳️', label: "Voter's Identity Card", note: null },
                    ].map((doc) => (
                      <li key={doc.label} className="flex items-center gap-2 text-xs text-blue-800 font-semibold">
                        <span className="text-sm">{doc.icon}</span>
                        {doc.label}
                        {doc.note && (
                          <span className="ml-1 px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full text-[10px] font-bold">
                            {doc.note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleKycUpload} className="px-8 py-6 flex flex-col gap-4">
              {/* Document Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Type *</label>
                <select
                  id="kyc-doc-type"
                  value={kycDocType}
                  onChange={(e) => setKycDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Select document type...</option>
                  {POI_DOCUMENTS.map((doc) => (
                    <option key={doc.value} value={doc.value}>{doc.label}</option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document URL *</label>
                <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    id="kyc-doc-url"
                    value={kycDocUrl}
                    onChange={(e) => setKycDocUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or any public document link"
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium ml-1">
                  Paste a publicly accessible link to your document (Google Drive, Dropbox, OneDrive, etc.)
                </p>
              </div>

              {/* KYC feedback message */}
              {kycMessage && (
                <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-semibold ${
                  kycMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                  {kycMessage.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  {kycMessage.text}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={kycUploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all"
                >
                  {kycUploading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Submit for KYC Verification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bank Details section */}
        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" /> Bank Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure verified bank accounts for claim disbursements and refunds.</p>
            </div>
            <button
              onClick={() => setShowAddBank(!showAddBank)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              {showAddBank ? 'Cancel' : '+ Add Bank Details'}
            </button>
          </div>

          {showAddBank && (
            <form onSubmit={handleAddBankSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4 mb-6 text-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Account Holder Name</label>
                  <input
                    type="text"
                    value={holderName}
                    onChange={e => setHolderName(e.target.value)}
                    required
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="State Bank of India"
                  />
                </div>
              </div>

              {requiresOtp && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/50 space-y-1.5 max-w-sm">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Re-Authentication Required
                  </div>
                  <p className="text-[10px] text-amber-700">Please enter the security verification OTP code (demo: <strong>123456</strong>)</p>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-xs"
                  />
                  {otpError && <p className="text-[10px] text-red-600 font-semibold">{otpError}</p>}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                >
                  {requiresOtp ? 'Confirm & Add Account' : 'Request OTP'}
                </button>
              </div>
            </form>
          )}

          {bankAccounts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No bank accounts registered. Add one to enable claims payouts.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map(account => (
                <div
                  key={account.id}
                  className={`p-4 rounded-xl border transition-all ${
                    account.isPrimary || account.isPrimaryPayout ? 'border-blue-400 bg-blue-50/30' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{account.bankName}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{account.accountNumberMasked}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {account.isVerified ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-emerald-100">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAccountId(account.id);
                            setShowVerifyModal(true);
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 border border-amber-200"
                        >
                          <HelpCircle className="w-3 h-3 text-amber-600" />
                          Verify
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(account.isPrimary || account.isPrimaryPayout) && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">✓ Payout / Refund</span>
                    )}
                    {account.isPrimaryDebit && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">✓ Premium Debit</span>
                    )}
                    {!account.isPrimary && !account.isPrimaryPayout && !account.isPrimaryDebit && (
                      <span className="text-[10px] text-slate-400 font-semibold">No role assigned</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                    {account.isVerified && (
                      <>
                        {!(account.isPrimary || account.isPrimaryPayout) && (
                          <button
                            onClick={() => handleSetPrimaryPayout(account.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-100"
                          >
                            Set as Payout
                          </button>
                        )}
                        {!account.isPrimaryDebit && (
                          <button
                            onClick={() => handleSetPrimaryDebit(account.id)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-100"
                          >
                            Set as Debit
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteBank(account.id)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold transition ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Penny Drop Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-slate-800">
              <h3 className="text-md font-black text-slate-800">Penny Drop Verification</h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                We have initiated a test transaction of <strong>₹1.00</strong> to your bank account. Please input the amount to verify.
              </p>
              <form onSubmit={handleVerifyBank} className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Verification Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="e.g. 1.00"
                    required
                    className="w-full px-4 py-2 mt-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    Verify Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-500" /> Security
          </h3>
          <form onSubmit={handleSavePassword} className="flex flex-col gap-5 text-slate-800 max-w-md">
            <Input label="Current Password" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
            <Input label="New Password" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} required />
            <Input label="Confirm New Password" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} required />
            <div className="mt-2">
              <Button type="submit" loading={savingPassword}>Change Password</Button>
            </div>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
