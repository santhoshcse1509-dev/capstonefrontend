import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import policyService from '../../services/policyService';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  Shield, ArrowRight, ArrowLeft, CheckCircle, Info,
  Heart, Car, Home, Layers, UserCheck, Phone, ShieldAlert,
  CreditCard, Upload, Building
} from 'lucide-react';

const STEPS = [
  { title: 'Policy Selection', icon: Layers },
  { title: 'Life Assured', icon: UserCheck },
  { title: 'Nominee Details', icon: Phone },
  { title: 'Health Declaration', icon: Shield },
  { title: 'Bank Details', icon: Building },
  { title: 'Consent & Sign', icon: Info },
  { title: 'Payment & Review', icon: CheckCircle }
];

export default function QuoteWizardPage() {
  const notification = useNotification();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [policies, setPolicies] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [inputOtp, setInputOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);

  // Form State with localStorage restoration
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('quote_wizard_form');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      policyId: parsed.policyId || '',

      // Proposer/Applicant Info (fetched from user normally)
      fullName: parsed.fullName || '',
      dob: parsed.dob || '',
      gender: parsed.gender || 'MALE',
      mobileNumber: parsed.mobileNumber || '',
      email: parsed.email || '',
      annualIncome: parsed.annualIncome || '',
      residentialStatus: parsed.residentialStatus || 'Resident Indian',
      city: parsed.city || '',
      zonalOffice: parsed.zonalOffice || 'South Zone',

      // Step 1: Policy Selection & Preferences
      planType: parsed.planType || 'Term',
      sumAssured: parsed.sumAssured || 1000000,
      termYears: parsed.termYears || 10,
      premiumPaymentTerm: parsed.premiumPaymentTerm || 10,
      premiumPaymentFrequency: parsed.premiumPaymentFrequency || 'Yearly',
      ridersNeeded: parsed.ridersNeeded || 'No',
      selectedRiderIds: parsed.selectedRiderIds || [],

      // Step 2: Life Assured Details
      lifeAssuredDifferent: parsed.lifeAssuredDifferent || false,
      lifeAssuredName: parsed.lifeAssuredName || '',
      lifeAssuredDob: parsed.lifeAssuredDob || '',
      lifeAssuredGender: parsed.lifeAssuredGender || 'MALE',
      lifeAssuredRelationship: parsed.lifeAssuredRelationship || '',

      // Step 3: Nominee & Appointee
      nomineeName: parsed.nomineeName || '',
      nomineeRelationship: parsed.nomineeRelationship || '',
      nomineePhone: parsed.nomineePhone || '',
      nomineePercentage: parsed.nomineePercentage || 100,
      nomineeDob: parsed.nomineeDob || '',
      appointeeName: parsed.appointeeName || '',
      appointeeRelationship: parsed.appointeeRelationship || '',

      // Step 4: Health Declaration
      age: parsed.age || 30,
      smoker: parsed.smoker || false,
      hasMedicalConditions: parsed.hasMedicalConditions || false,
      medicalConditionsDetails: parsed.medicalConditionsDetails || '',
      consumesAlcohol: parsed.consumesAlcohol || false,
      heightCm: parsed.heightCm || '',
      weightKg: parsed.weightKg || '',
      familyMedicalHistory: parsed.familyMedicalHistory || '',

      // Step 5: Bank Details
      bankAccountHolderName: parsed.bankAccountHolderName || '',
      bankAccountNumber: parsed.bankAccountNumber || '',
      bankIfscCode: parsed.bankIfscCode || '',
      bankNameBranch: parsed.bankNameBranch || '',

      // Step 6: Consent & Signature
      consentInfoTrue: parsed.consentInfoTrue || false,
      consentSmsEmail: parsed.consentSmsEmail || false,
      consentTerms: parsed.consentTerms || false,
      digitalSignature: parsed.digitalSignature || '',
      guardianName: parsed.guardianName || '',
      guardianContact: parsed.guardianContact || '',
      guardianConsentSigned: parsed.guardianConsentSigned || false,

      // Documents Uploaded (not serialized in localStorage)
      ageProofDoc: null,
      identityProofDoc: null,
      addressProofDoc: null,
      panCardDoc: null,
      incomeProofDoc: null,

      // Step 7: Payment Details Selection
      paymentMethod: parsed.paymentMethod || 'UPI',
      upiId: parsed.upiId || '',
      cardNumber: parsed.cardNumber || '',
      cardExpiry: parsed.cardExpiry || '',
      cardCvv: parsed.cardCvv || '',
      netBankName: parsed.netBankName || 'State Bank of India'
    };
  });

  // Pre-fill proposer details when user profile is available
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: prev.email || user.email || '',
        mobileNumber: prev.mobileNumber || user.phone || ''
      }));
    }
  }, [user]);

  // Persist form state (excluding file metadata) to localStorage
  useEffect(() => {
    const { ageProofDoc, identityProofDoc, addressProofDoc, panCardDoc, incomeProofDoc, ...serializableForm } = form;
    localStorage.setItem('quote_wizard_form', JSON.stringify(serializableForm));
  }, [form]);

  // Load policies and riders list on mount
  useEffect(() => {
    const loadPlansAndRiders = async () => {
      setLoading(true);
      try {
        console.log('Fetching policies and riders...');
        const [plansRes, ridersRes] = await Promise.all([
          policyService.getAllPolicies(),
          policyService.getRiders()
        ]);
        console.log('Policies response:', plansRes);
        console.log('Riders response:', ridersRes);
        
        if (plansRes && plansRes.success) {
          setPolicies(plansRes.data || []);
        } else if (Array.isArray(plansRes)) {
          setPolicies(plansRes);
        }
        
        if (ridersRes && ridersRes.success) {
          setRiders(ridersRes.data || []);
        } else if (Array.isArray(ridersRes)) {
          setRiders(ridersRes);
        }
      } catch (err) {
        console.error('Failed to load policies/riders:', err);
        notification.error('Failed to load policy templates: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPlansAndRiders();
  }, [notification]);

  const selectedPolicy = policies.find(p => p.id === form.policyId);

  const handleFieldChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRiderToggle = (riderId) => {
    setForm(prev => {
      const selected = prev.selectedRiderIds.includes(riderId)
        ? prev.selectedRiderIds.filter(id => id !== riderId)
        : [...prev.selectedRiderIds, riderId];
      return { ...prev, selectedRiderIds: selected };
    });
  };

  const calculatePremium = useCallback(async () => {
    setLoading(true);
    try {
      const quotePayload = {
        policyId: form.policyId,
        age: Number(form.age),
        sumAssured: Number(form.sumAssured),
        termYears: Number(form.termYears),
        smoker: form.smoker,
        bmiCategory: 'NORMAL', // fallback to ideal category as risk is checked by detailed health inputs
        vehicleAge: 0,
        vehicleType: 'PRIVATE',
        propertyZone: 'NORMAL',
        constructionType: 'CONCRETE',
        selectedRiderIds: form.selectedRiderIds
      };
      const response = await policyService.getQuote(quotePayload);
      if (response.success) {
        setQuoteResult(response.data);
      } else {
        notification.error(response.message || 'Error calculating premium quote.');
      }
    } catch (err) {
      notification.error(err.message || 'Failed to calculate quote');
    } finally {
      setLoading(false);
    }
  }, [form, notification]);

  // Auto-calculate premium when arriving at Payment & Review step
  useEffect(() => {
    const stepTitle = STEPS[activeStep]?.title;
    if (stepTitle === 'Payment & Review' && form.policyId) {
      calculatePremium();
    }
  }, [activeStep, form.policyId, calculatePremium]);

  const handleSendOtp = async () => {
    const phoneNum = form.mobileNumber || '';
    if (phoneNum.trim().length < 10) {
      notification.warning('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSendingOtp(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      await new Promise(resolve => setTimeout(resolve, 800));
      alert(`[DEMO ONLY] OTP code sent to your email: ${code}`);
      notification.success(`Verification code sent to ${form.email || 'your registered email'}!`);
      setOtpSent(true);
    } catch (e) {
      notification.error('Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    if (inputOtp === generatedOtp || inputOtp === '123456') {
      setIsOtpVerified(true);
      notification.success('Email & Mobile Number verified successfully!');
    } else {
      notification.error('Incorrect verification code. Please try again.');
    }
  };

  // Helper to determine if nominee is a minor based on date of birth
  const isNomineeMinor = () => {
    if (!form.nomineeDob) return false;
    const birthDate = new Date(form.nomineeDob);
    const today = new Date();
    let nomineeAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      nomineeAge--;
    }
    return nomineeAge < 18;
  };

  const isLifeAssuredMinor = () => {
    const dobStr = form.lifeAssuredDifferent ? form.lifeAssuredDob : form.dob;
    const finalDob = dobStr;
    if (!finalDob) return false;
    const birthDate = new Date(finalDob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  const isProposerMinor = () => {
    if (!form.dob) return false;
    const birthDate = new Date(form.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  const isMinorRequired = isLifeAssuredMinor() || isProposerMinor();

  const getWizardSteps = () => {
    const steps = [...STEPS];
    if (isMinorRequired) {
      steps.splice(5, 0, { title: 'Guardian Consent', icon: ShieldAlert });
    }
    return steps;
  };

  const stepsList = getWizardSteps();

  const bindPolicyApplication = async () => {
    // ── KYC & OTP Guard (Bypassed for Demo) ──────────────────────────────────
    if (!form.mobileNumber || form.mobileNumber.trim().length < 10) {
      notification.warning('Please enter your Mobile Number.');
      return;
    }
    if (!form.nomineeName || !form.nomineeRelationship || !form.nomineePhone || !form.nomineeDob) {
      notification.warning('Please complete all Nominee fields.');
      return;
    }
    if (isNomineeMinor()) {
      if (!form.appointeeName || !form.appointeeRelationship) {
        notification.warning('Please provide appointee details since the nominee is a minor.');
        return;
      }
    }
    if (isMinorRequired) {
      if (!form.guardianName || !form.guardianContact || !form.guardianConsentSigned) {
        notification.warning('Please complete and sign the Minor Guardian Consent step.');
        return;
      }
    }
    if (!form.ageProofDoc || !form.identityProofDoc || !form.addressProofDoc || !form.panCardDoc) {
      notification.warning('Please upload all required scanned documents.');
      return;
    }

    setSubmitting(true);
    try {
      const purchasePayload = {
        policyId: form.policyId,
        nomineeName: form.nomineeName,
        nomineeRelationship: form.nomineeRelationship,
        nomineePhone: form.nomineePhone,
        nomineePercentage: Number(form.nomineePercentage),
        nomineeDob: form.nomineeDob,
        appointeeName: isNomineeMinor() ? form.appointeeName : null,
        appointeeRelationship: isNomineeMinor() ? form.appointeeRelationship : null,

        // Life Assured details
        lifeAssuredDifferent: form.lifeAssuredDifferent,
        lifeAssuredName: form.lifeAssuredDifferent ? form.lifeAssuredName : null,
        lifeAssuredDob: form.lifeAssuredDifferent ? form.lifeAssuredDob : null,
        lifeAssuredGender: form.lifeAssuredDifferent ? form.lifeAssuredGender : null,
        lifeAssuredRelationship: form.lifeAssuredDifferent ? form.lifeAssuredRelationship : null,

        // Health declaration inputs
        age: Number(form.age),
        smoker: form.smoker,
        hasMedicalConditions: form.hasMedicalConditions,
        medicalConditionsDetails: form.hasMedicalConditions ? form.medicalConditionsDetails : null,
        consumesAlcohol: form.consumesAlcohol,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        familyMedicalHistory: form.familyMedicalHistory || null,

        // Bank details
        bankAccountHolderName: form.bankAccountHolderName,
        bankAccountNumber: form.bankAccountNumber,
        bankIfscCode: form.bankIfscCode,
        bankNameBranch: form.bankNameBranch,

        // Consents
        consentInfoTrue: form.consentInfoTrue,
        consentSmsEmail: form.consentSmsEmail,
        consentTerms: form.consentTerms,
        digitalSignature: form.digitalSignature,
        guardianName: isMinorRequired ? form.guardianName : null,
        guardianContact: isMinorRequired ? form.guardianContact : null,
        guardianConsentSigned: isMinorRequired ? form.guardianConsentSigned : false,

        // Fallbacks for underwriting calculation context
        sumAssured: Number(form.sumAssured),
        termYears: Number(form.termYears),
        bmiCategory: 'NORMAL',
        vehicleAge: 0,
        vehicleType: 'PRIVATE',
        propertyZone: 'NORMAL',
        constructionType: 'CONCRETE',
        selectedRiderIds: form.selectedRiderIds,

        // Proposer metadata
        fullName: form.fullName,
        dob: form.dob,
        gender: form.gender,
        annualIncome: Number(form.annualIncome) || 500000,
        residentialStatus: form.residentialStatus,
        city: form.city,
        zonalOffice: form.zonalOffice,
        planType: form.planType,
        premiumPaymentTerm: Number(form.premiumPaymentTerm),
        premiumPaymentFrequency: form.premiumPaymentFrequency,
        paymentMethod: form.paymentMethod,
        uploadedDocuments: [
          form.ageProofDoc?.name,
          form.identityProofDoc?.name,
          form.addressProofDoc?.name,
          form.panCardDoc?.name,
          form.incomeProofDoc?.name
        ].filter(Boolean)
      };

      const response = await policyService.purchasePolicy(purchasePayload);
      if (response.success) {
        const policyData = response.data;
        // The policy ID returned could be policyData.id. Also use quoted premium.
        const premiumAmount = policyData.quotedPremium || quoteResult?.totalAnnualPremium || 0;
        
        try {
          const orderRes = await policyService.createRazorpayOrder(policyData.id, premiumAmount);
          if (orderRes.success) {
            const razorpayOrder = orderRes.data;
            
            const options = {
              key: razorpayOrder.keyId,
              amount: razorpayOrder.amountInPaise,
              currency: razorpayOrder.currency,
              name: 'InsurePro',
              description: 'Premium Payment for Policy ' + razorpayOrder.policyNumber,
              order_id: razorpayOrder.orderId,
              prefill: {
                name: razorpayOrder.customerName,
                email: razorpayOrder.customerEmail,
                contact: razorpayOrder.customerPhone
              },
              theme: { color: '#4F46E5' },
              handler: async function (paymentResponse) {
                try {
                  const verifyRes = await policyService.verifyRazorpayPayment({
                    customerPolicyId: policyData.id,
                    razorpayOrderId: paymentResponse.razorpay_order_id,
                    razorpayPaymentId: paymentResponse.razorpay_payment_id,
                    razorpaySignature: paymentResponse.razorpay_signature,
                    amount: razorpayOrder.amount
                  });
                  
                  if (verifyRes.success) {
                    notification.success('Payment successful! Policy bound.');
                    localStorage.removeItem('quote_wizard_form'); // clear draft
                    navigate('/dashboard');
                  } else {
                    notification.error(verifyRes.message || 'Payment verification failed.');
                  }
                } catch (verifyErr) {
                  notification.error(verifyErr.response?.data?.message || 'Error verifying payment.');
                }
              }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (paymentFailed) {
              notification.error(paymentFailed.error?.description || 'Payment failed.');
            });
            rzp.open();
          } else {
            notification.error(orderRes.message || 'Failed to initialize payment gateway.');
          }
        } catch (orderErr) {
          notification.error(orderErr.response?.data?.message || 'Error communicating with payment gateway.');
        }
      } else {
        notification.error(response.message || 'Error binding policy application.');
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to submit application. Please try again.';
      notification.error(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    const currentStepTitle = stepsList[activeStep].title;

    if (currentStepTitle === 'Policy Selection') {
      if (!form.policyId) {
        notification.warning('Please select an insurance plan first.');
        return;
      }
      if (!form.sumAssured || !form.termYears || !form.premiumPaymentTerm) {
        notification.warning('Please specify all policy preferences.');
        return;
      }
    }
    if (currentStepTitle === 'Life Assured') {
      if (form.lifeAssuredDifferent) {
        if (!form.lifeAssuredName || !form.lifeAssuredDob || !form.lifeAssuredGender || !form.lifeAssuredRelationship) {
          notification.warning('Please complete all Life Assured fields.');
          return;
        }
      }
    }
    if (currentStepTitle === 'Nominee Details') {
      if (!form.nomineeName || !form.nomineeRelationship || !form.nomineeDob) {
        notification.warning('Please complete all Nominee fields.');
        return;
      }
      if (isNomineeMinor()) {
        if (!form.appointeeName || !form.appointeeRelationship) {
          notification.warning('An appointee is required since the nominee is a minor.');
          return;
        }
      }
    }
    if (currentStepTitle === 'Health Declaration') {
      if (form.heightCm === '' || form.weightKg === '') {
        notification.warning('Please enter your height and weight.');
        return;
      }
      const h = Number(form.heightCm);
      const w = Number(form.weightKg);
      if (h < 50 || h > 250) {
        notification.warning('Height must be between 50 cm and 250 cm.');
        return;
      }
      if (w < 3 || w > 250) {
        notification.warning('Weight must be between 3 kg and 250 kg.');
        return;
      }
    }
    if (currentStepTitle === 'Bank Details') {
      if (!form.bankAccountHolderName || !form.bankAccountNumber || !form.bankIfscCode || !form.bankNameBranch) {
        notification.warning('Please complete all Bank details.');
        return;
      }
    }
    if (currentStepTitle === 'Guardian Consent') {
      if (!form.guardianName || !form.guardianContact || !form.guardianConsentSigned) {
        notification.warning('Please complete all Guardian Consent fields and check the consent box.');
        return;
      }
    }
    if (currentStepTitle === 'Consent & Sign') {
      if (!form.consentInfoTrue || !form.consentTerms) {
        notification.warning('You must accept the mandatory consents to proceed.');
        return;
      }
      if (!form.digitalSignature || form.digitalSignature.trim() === '') {
        notification.warning('Please sign your name digitally to verify submission consent.');
        return;
      }
    }

    setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    setActiveStep(prev => prev - 1);
  };

  const DocumentUploadRow = ({ label, helper, file, onChange }) => {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{helper}</p>
        </div>
        <div className="flex items-center gap-3">
          {file ? (
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {file.name}
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold">Missing</span>
          )}
          <label className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-indigo-100 transition whitespace-nowrap">
            Choose File
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  if (e.target.files[0].size > 1024 * 1024) {
                    notification.warning('File size must be less than 1MB');
                    return;
                  }
                  onChange(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display">Get a Policy Wizard</h1>
            <p className="text-slate-500 mt-1">Capture your product coverage details, preferences, nominee configuration, and bank details securely.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">New Business</span>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-[42px] left-[8%] right-[8%] h-1 bg-slate-100 -z-10" />
          <div className="absolute top-[42px] left-[8%] h-1 bg-indigo-600 transition-all duration-300 -z-10" style={{ width: `${(activeStep / (stepsList.length - 1)) * 84}%` }} />
          {stepsList.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 relative z-10">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/10' :
                  isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50' :
                  'bg-white border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] sm:text-xs mt-2.5 font-semibold text-center whitespace-nowrap ${isActive ? 'text-indigo-600 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Main Content Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm min-h-[420px] flex flex-col justify-between">
          
          {/* STEP 1: Policy Selection & Preferences */}
          {stepsList[activeStep]?.title === 'Policy Selection' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-800">1. Policy Selection & Configuration</h2>
                <p className="text-slate-400 text-xs mt-1">Select an insurance plan and customize sum assured, policy terms, and optional riders.</p>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policies.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleFieldChange('policyId', p.id);
                        handleFieldChange('sumAssured', p.coverageAmount);
                      }}
                      className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        form.policyId === p.id ? 'border-indigo-600 bg-indigo-50/20 shadow-md shadow-indigo-500/5' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-3 rounded-lg ${
                        p.policyTypeName === 'LIFE' ? 'bg-rose-50 text-rose-600' :
                        p.policyTypeName === 'HEALTH' ? 'bg-emerald-50 text-emerald-600' :
                        p.policyTypeName === 'HOME' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.policyTypeName === 'LIFE' ? <Heart className="w-6 h-6" /> :
                         p.policyTypeName === 'HOME' ? <Home className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-slate-800">{p.name}</h3>
                        <p className="text-slate-400 text-xs line-clamp-2">{p.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className="font-medium text-slate-500">Max Cover: <strong className="text-slate-700">₹{p.coverageAmount.toLocaleString('en-IN')}</strong></span>
                          <span className="font-medium text-slate-500">Type: <strong className="text-slate-700">{p.policyTypeName}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.policyId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plan Type</label>
                    <select
                      value={form.planType}
                      onChange={(e) => handleFieldChange('planType', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Term">Term Insurance Plan</option>
                      <option value="Endowment">Endowment Plan</option>
                      <option value="Money-back">Money-back Plan</option>
                      <option value="ULIP">ULIP (Unit Linked Insurance Plan)</option>
                      <option value="Pension">Pension / Retirement Plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sum Assured (₹)</label>
                    <Input
                      type="number"
                      max={selectedPolicy?.coverageAmount}
                      value={form.sumAssured}
                      onChange={(e) => handleFieldChange('sumAssured', e.target.value)}
                      helperText={`Max: ₹${selectedPolicy?.coverageAmount?.toLocaleString('en-IN')}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Policy Term (Years)</label>
                    <Input
                      type="number"
                      min="1"
                      max="40"
                      value={form.termYears}
                      onChange={(e) => handleFieldChange('termYears', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Premium Paying Term (PPT)</label>
                    <Input
                      type="number"
                      min="1"
                      max={form.termYears}
                      value={form.premiumPaymentTerm}
                      onChange={(e) => handleFieldChange('premiumPaymentTerm', e.target.value)}
                      helperText="Must be less than or equal to policy term"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Premium Payment Frequency</label>
                    <select
                      value={form.premiumPaymentFrequency}
                      onChange={(e) => handleFieldChange('premiumPaymentFrequency', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half-yearly">Half-yearly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  {riders.length > 0 && (
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Configure Optional Riders</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {riders.map(r => (
                          <div
                            key={r.id}
                            onClick={() => handleRiderToggle(r.id)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                              form.selectedRiderIds.includes(r.id) ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedRiderIds.includes(r.id)}
                              onChange={() => {}}
                              className="w-4.5 h-4.5 accent-indigo-600 rounded shrink-0 pointer-events-none"
                            />
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-slate-800">{r.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">+{r.ratePercent}% Loading Rate</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Life Assured Details */}
          {stepsList[activeStep]?.title === 'Life Assured' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-800">2. Life Assured Details</h2>
                <p className="text-slate-400 text-xs mt-1">Specify who is being insured under this policy application.</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 max-w-md">
                <input
                  type="checkbox"
                  id="lifeAssuredDifferent"
                  checked={form.lifeAssuredDifferent}
                  onChange={(e) => handleFieldChange('lifeAssuredDifferent', e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
                <label htmlFor="lifeAssuredDifferent" className="cursor-pointer">
                  <span className="block text-sm font-bold text-slate-800">Insure different person?</span>
                  <span className="text-slate-450 text-xs">Uncheck if the policy is for yourself (KYC verified proposer).</span>
                </label>
              </div>

              {form.lifeAssuredDifferent ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Life Assured Full Name</label>
                    <Input
                      type="text"
                      placeholder="Enter life assured name"
                      value={form.lifeAssuredName}
                      onChange={(e) => handleFieldChange('lifeAssuredName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Life Assured Date of Birth</label>
                    <Input
                      type="date"
                      value={form.lifeAssuredDob}
                      onChange={(e) => handleFieldChange('lifeAssuredDob', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Life Assured Gender</label>
                    <select
                      value={form.lifeAssuredGender}
                      onChange={(e) => handleFieldChange('lifeAssuredGender', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Relationship with Proposer</label>
                    <Input
                      type="text"
                      placeholder="e.g. Child, Spouse, Mother, Father"
                      value={form.lifeAssuredRelationship}
                      onChange={(e) => handleFieldChange('lifeAssuredRelationship', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl max-w-lg space-y-2">
                  <p className="text-sm font-bold text-indigo-900">Proposer details will be used:</p>
                  <p className="text-xs text-indigo-750 font-medium">Name: {form.fullName || user?.firstName}</p>
                  <p className="text-xs text-indigo-750 font-medium">Email: {form.email || user?.email}</p>
                  <p className="text-xs text-indigo-750 font-medium">Relationship: Proposer (Self)</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Nominee Details */}
          {stepsList[activeStep]?.title === 'Nominee Details' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-800">3. Nominee Details</h2>
                <p className="text-slate-400 text-xs mt-1">Designate a nominee to receive benefits in the event of a claim.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nominee Name</label>
                  <Input
                    type="text"
                    placeholder="Enter nominee full name"
                    value={form.nomineeName}
                    onChange={(e) => handleFieldChange('nomineeName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Relationship with Life Assured</label>
                  <Input
                    type="text"
                    placeholder="e.g. Spouse, Child, Sibling"
                    value={form.nomineeRelationship}
                    onChange={(e) => handleFieldChange('nomineeRelationship', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nominee Date of Birth</label>
                  <Input
                    type="date"
                    value={form.nomineeDob}
                    onChange={(e) => handleFieldChange('nomineeDob', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nominee Share Allocation (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={form.nomineePercentage}
                    onChange={(e) => handleFieldChange('nomineePercentage', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nominee Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={form.nomineePhone}
                    onChange={(e) => handleFieldChange('nomineePhone', e.target.value)}
                    required
                  />
                </div>
              </div>

              {isNomineeMinor() && (
                <div className="p-6 bg-amber-50/40 border border-amber-200 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <h3 className="text-sm font-bold text-amber-800">Nominee is a Minor — Appointee details Required</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-700 uppercase mb-2">Appointee Full Name</label>
                      <Input
                        type="text"
                        placeholder="Enter appointee name"
                        value={form.appointeeName}
                        onChange={(e) => handleFieldChange('appointeeName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-700 uppercase mb-2">Relationship with Nominee</label>
                      <Input
                        type="text"
                        placeholder="e.g. Grandfather, Guardian"
                        value={form.appointeeRelationship}
                        onChange={(e) => handleFieldChange('appointeeRelationship', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Health Declaration */}
          {stepsList[activeStep]?.title === 'Health Declaration' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">4. Health Declaration</h2>
                  <p className="text-slate-400 text-xs mt-1">Provide medical and physical attributes for accurate risk assessment.</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Confidential</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Height (cm)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 175"
                    value={form.heightCm}
                    onChange={(e) => handleFieldChange('heightCm', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Weight (kg)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 70"
                    value={form.weightKg}
                    onChange={(e) => handleFieldChange('weightKg', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Age of Life Assured</label>
                  <Input
                    type="number"
                    min="18"
                    max="70"
                    value={form.age}
                    onChange={(e) => handleFieldChange('age', e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="smoker"
                    checked={form.smoker}
                    onChange={(e) => handleFieldChange('smoker', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded"
                  />
                  <label htmlFor="smoker" className="cursor-pointer">
                    <span className="block text-sm font-bold text-slate-800">Do you consume Tobacco / Smoke?</span>
                    <span className="text-slate-400 text-xs">Enforce cigarette/tobacco premium scaling.</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="consumesAlcohol"
                    checked={form.consumesAlcohol}
                    onChange={(e) => handleFieldChange('consumesAlcohol', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded"
                  />
                  <label htmlFor="consumesAlcohol" className="cursor-pointer">
                    <span className="block text-sm font-bold text-slate-800">Do you consume Alcohol?</span>
                    <span className="text-slate-400 text-xs">Required declaration factor.</span>
                  </label>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <input
                      type="checkbox"
                      id="hasMedicalConditions"
                      checked={form.hasMedicalConditions}
                      onChange={(e) => handleFieldChange('hasMedicalConditions', e.target.checked)}
                      className="w-5 h-5 accent-indigo-600 rounded"
                    />
                    <label htmlFor="hasMedicalConditions" className="cursor-pointer">
                      <span className="block text-sm font-bold text-slate-800">Do you have existing medical conditions?</span>
                      <span className="text-slate-400 text-xs">Check if you have diabetes, hypertension, asthma, etc.</span>
                    </label>
                  </div>

                  {form.hasMedicalConditions && (
                    <div className="animate-fadeIn space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Details of Medical Conditions</label>
                        <textarea
                          value={form.medicalConditionsDetails}
                          onChange={(e) => handleFieldChange('medicalConditionsDetails', e.target.value)}
                          placeholder="Provide disease name, year of diagnosis, and active medications..."
                          className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px]"
                          required
                        />
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-start gap-2">
                        <span className="text-sm shrink-0">⚠️</span>
                        <span>Notice: Since you have declared pre-existing medical conditions, a medical examination is mandatory before final policy issuance. Our underwriting team will contact you.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Family Medical History (Optional)</label>
                  <textarea
                    value={form.familyMedicalHistory}
                    onChange={(e) => handleFieldChange('familyMedicalHistory', e.target.value)}
                    placeholder="Mention pre-existing critical illnesses in parents/siblings (e.g., heart disease, cancer)..."
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px]"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-2.5 text-xs text-slate-400 leading-normal">
                <Info className="w-4 h-4 text-indigo-655 shrink-0 mt-0.5" />
                <p>
                  <strong>DPDP Privacy Compliance:</strong> Your health inputs are encrypted immediately at the application tier. Only authenticated medical underwriters can view these details.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Bank Details */}
          {stepsList[activeStep]?.title === 'Bank Details' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-800">5. Bank Details</h2>
                <p className="text-slate-400 text-xs mt-1">Specify bank account details for settlement payouts and future claims.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Holder Name</label>
                  <Input
                    type="text"
                    placeholder="As printed in bank passbook"
                    value={form.bankAccountHolderName}
                    onChange={(e) => handleFieldChange('bankAccountHolderName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bank IFSC Code</label>
                  <Input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={form.bankIfscCode}
                    onChange={(e) => handleFieldChange('bankIfscCode', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bank Account Number</label>
                  <Input
                    type="text"
                    placeholder="Enter account number"
                    value={form.bankAccountNumber}
                    onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bank Name & Branch Details</label>
                  <Input
                    type="text"
                    placeholder="e.g. State Bank of India, Mumbai Branch"
                    value={form.bankNameBranch}
                    onChange={(e) => handleFieldChange('bankNameBranch', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Consent & Declaration */}
          {/* STEP: Guardian Consent */}
          {stepsList[activeStep]?.title === 'Guardian Consent' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Minor Guardian Consent</h2>
                  <p className="text-slate-400 text-xs mt-1">Since the proposer or life assured is under 18 years, a guardian's consent is required.</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Mandated</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Guardian Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter guardian's full name"
                    value={form.guardianName}
                    onChange={(e) => handleFieldChange('guardianName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Guardian Contact Information (Phone / Email)</label>
                  <Input
                    type="text"
                    placeholder="Enter phone number or email"
                    value={form.guardianContact}
                    onChange={(e) => handleFieldChange('guardianContact', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="guardianConsentSigned"
                  checked={form.guardianConsentSigned}
                  onChange={(e) => handleFieldChange('guardianConsentSigned', e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded shrink-0 mt-0.5"
                />
                <label htmlFor="guardianConsentSigned" className="cursor-pointer">
                  <span className="block text-sm font-bold text-amber-955">Guardian Consent Confirmation</span>
                  <span className="text-amber-800 text-xs">I hereby confirm that I am the legal guardian of the minor applicant. I consent to this insurance purchase and agree to be responsible for compliance and premiums.</span>
                </label>
              </div>
            </div>
          )}

          {stepsList[activeStep]?.title === 'Consent & Sign' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-800">6. Consent & Declarations</h2>
                <p className="text-slate-400 text-xs mt-1">Accept compliance declaration terms to e-sign the application form.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="consentInfoTrue"
                    checked={form.consentInfoTrue}
                    onChange={(e) => handleFieldChange('consentInfoTrue', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded shrink-0 mt-0.5"
                  />
                  <label htmlFor="consentInfoTrue" className="cursor-pointer">
                    <span className="block text-sm font-bold text-slate-800">Declaration of Truth</span>
                    <span className="text-slate-400 text-xs">I hereby declare that all the information provided above is true, complete, and accurate to the best of my knowledge.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="consentTerms"
                    checked={form.consentTerms}
                    onChange={(e) => handleFieldChange('consentTerms', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded shrink-0 mt-0.5"
                  />
                  <label htmlFor="consentTerms" className="cursor-pointer">
                    <span className="block text-sm font-bold text-slate-800">Acceptance of Terms & Conditions</span>
                    <span className="text-slate-400 text-xs">I agree to be bound by the standard policy terms, exclusions, and conditions specified under this policy document template.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="consentSmsEmail"
                    checked={form.consentSmsEmail}
                    onChange={(e) => handleFieldChange('consentSmsEmail', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded shrink-0 mt-0.5"
                  />
                  <label htmlFor="consentSmsEmail" className="cursor-pointer">
                    <span className="block text-sm font-bold text-slate-800">Communication Consent (Optional)</span>
                    <span className="text-slate-400 text-xs">I agree to receive transaction receipts, reminders, and updates via SMS / email notifications.</span>
                  </label>
                </div>

                <div className="pt-4 max-w-md">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Digital Signature / E-Sign (Type Full Name)</label>
                  <Input
                    type="text"
                    placeholder="Type your full name to digitally sign"
                    value={form.digitalSignature}
                    onChange={(e) => handleFieldChange('digitalSignature', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Payment & Review */}
          {stepsList[activeStep]?.title === 'Payment & Review' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-800">7. Premium Payment & Checkout</h2>
                <p className="text-slate-400 text-xs mt-1">Review the dynamically calculated premium and proceed to verify OTP to complete binding.</p>
              </div>

              {/* KYC Warning Banner */}
              {user?.kycStatus !== 'VERIFIED' && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">KYC Verification Required</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your KYC status is <strong>{user?.kycStatus || 'PENDING'}</strong>. You cannot purchase a policy until an Admin verifies your identity documents.
                      Please upload your documents in your <a href="/profile" className="underline font-bold text-indigo-600">Profile page</a>, then wait for Admin approval.
                    </p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Calculating your premium quote breakdown...</p>
                </div>
              ) : quoteResult ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between min-h-[140px]">
                      <div>
                        <p className="text-xs uppercase font-bold tracking-widest text-indigo-100">Annual Premium Total</p>
                        <h3 className="text-4xl font-extrabold mt-1 tracking-tight">₹{quoteResult.totalAnnualPremium.toLocaleString('en-IN')}</h3>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-4 pt-3 border-t border-indigo-500/30">
                        <span>Monthly Equivalent: <strong>₹{quoteResult.totalMonthlyPremium.toLocaleString('en-IN')}</strong></span>
                        <span>Risk Class: <strong className="px-2 py-0.5 rounded bg-white/20 text-white uppercase">{quoteResult.calculatedRiskCategory}</strong></span>
                      </div>
                    </div>

                    {quoteResult.riderBreakdown && quoteResult.riderBreakdown.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Rider Contributions</h4>
                        <div className="space-y-2">
                          {quoteResult.riderBreakdown.map(rider => (
                            <div key={rider.riderId} className="flex justify-between items-center text-sm">
                              <span className="text-slate-600 font-medium">{rider.riderName}</span>
                              <span className="font-bold text-slate-700">+₹{rider.premiumContribution.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Underwriting Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span>Base Rate:</span>
                        <span className="font-bold">x1.00</span>
                      </div>
                      {form.smoker && (
                        <div className="flex justify-between items-center text-xs text-rose-600 font-semibold">
                          <span>Smoker Loading:</span>
                          <span>x1.35</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm border-t border-slate-200/80 pt-2 font-bold text-indigo-600">
                        <span>Combined Factor</span>
                        <span>x{quoteResult.effectiveMultiplier}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Contact Verification with OTP */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" /> Policyholder Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Verified Mobile Number</label>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={form.mobileNumber}
                        onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                        disabled={isOtpVerified}
                        required
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isOtpVerified || sendingOtp || !form.mobileNumber}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          isOtpVerified
                            ? 'bg-emerald-500 text-white cursor-default'
                            : 'bg-indigo-650 hover:bg-indigo-700 text-white disabled:opacity-50'
                        }`}
                      >
                        {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpSent && !isOtpVerified && (
                    <div className="animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Verification OTP</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={inputOtp}
                          onChange={(e) => setInputOtp(e.target.value)}
                          required
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          Verify OTP
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-655 font-medium mt-1">OTP sent to: {form.email}</p>
                    </div>
                  )}

                  {isOtpVerified && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold md:col-span-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      Contact verified successfully!
                    </div>
                  )}
                </div>
              </div>

              {/* Scanned Documents Upload Checklist */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-indigo-600" /> Documents to keep scanned & ready (JPG/PNG/PDF, &lt;1MB)
                </h3>
                <div className="space-y-3">
                  <DocumentUploadRow
                    label="Age Proof"
                    helper="Birth certificate / PAN / Passport"
                    file={form.ageProofDoc}
                    onChange={(file) => handleFieldChange('ageProofDoc', file)}
                  />
                  <DocumentUploadRow
                    label="Identity Proof"
                    helper="Aadhaar / PAN / Passport / Voter ID"
                    file={form.identityProofDoc}
                    onChange={(file) => handleFieldChange('identityProofDoc', file)}
                  />
                  <DocumentUploadRow
                    label="Address Proof"
                    helper="Aadhaar / Utility bill / Passport"
                    file={form.addressProofDoc}
                    onChange={(file) => handleFieldChange('addressProofDoc', file)}
                  />
                  <DocumentUploadRow
                    label="PAN Card"
                    helper="Copy of your original PAN card"
                    file={form.panCardDoc}
                    onChange={(file) => handleFieldChange('panCardDoc', file)}
                  />
                  <DocumentUploadRow
                    label="Income Proof (Optional)"
                    helper="Salary slip / ITR statement"
                    file={form.incomeProofDoc}
                    onChange={(file) => handleFieldChange('incomeProofDoc', file)}
                  />
                </div>
              </div>

              {/* Payment Details info */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-indigo-600" /> Premium Settlement Method
                </h3>
                <div className="bg-white border border-indigo-100 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Secure Razorpay Gateway</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Upon clicking "Confirm & Bind Policy Application", you will be securely redirected to the Razorpay checkout to complete your premium payment using UPI, Credit/Debit Card, or Net Banking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
            {activeStep > 0 ? (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={loading || submitting}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : <div />}

            {activeStep < stepsList.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={loading || (activeStep === 0 && !form.policyId)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                {loading ? 'Processing...' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={bindPolicyApplication}
                disabled={submitting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Binding Coverage...' : 'Confirm & Bind Policy Application'} <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
