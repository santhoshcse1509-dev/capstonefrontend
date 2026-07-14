import React, { createContext, useState, useEffect, useCallback } from 'react';

const translations = {
  en: {
    // Layout
    dashboard: "Dashboard",
    users: "User Management",
    kyc: "KYC Review",
    claimsOps: "Claims Operations",
    underwriting: "Underwriting",
    reinstatements: "Reinstatements",
    grievances: "Grievance Mgmt",
    agents: "Agent Oversight",
    finance: "Finance & Comm.",
    settings: "System Settings",
    logs: "Audit Logs",
    rates: "Rate Config",
    analytics: "Analytics",
    profile: "Profile",
    logout: "Logout",
    notifications: "Notifications",
    commissions: "Commissions",
    bankDetails: "Bank Details",

    // Dashboard Page (Admin)
    helloAdmin: "Hello, Admin {name}!",
    adminSub: "Here is the system-wide overview and metrics summary",
    totalUsers: "Total Users",
    activeAccounts: "Active Accounts",
    pendingKyc: "Pending KYC",
    requiresReview: "Requires Review",
    totalClaims: "Total Claims Filed",
    systemWide: "System Wide",
    totalRevenue: "Total Revenue",
    premiumCollected: "Premium Collected",
    recentClaims: "Recent Claims",
    noClaims: "No claims filed in the system yet.",
    claimsOverview: "Recent Claims Overview",
    claimNo: "Claim No",
    customerName: "Customer Name",
    claimType: "Claim Type",
    amountRequested: "Amount Requested",
    submissionDate: "Submission Date",
    status: "Status",

    // Dashboard Page (Customer)
    helloUser: "Hello, {name}!",
    customerId: "Customer ID",
    customerSub: "Here is a summary of your policy coverages and status",
    activePolicies: "Active Policies",
    normalStatus: "Normal Status",
    pendingClaims: "Pending Claims",
    underVerification: "Under Verification",
    totalPremium: "Total Premium Paid",
    autoRenewal: "Auto Renewal Enabled",
    policiesOwned: "Total Policies Owned",
    noExpiry: "No Expiry Pending",
    noClaimsUser: "No claims filed yet.",
    yourPolicies: "Your Insurance Policies",
    getQuote: "Get a Quote",
    policyNo: "Policy No",
    name: "Name",
    category: "Category",
    coverage: "Coverage",
    expiryDate: "Expiry Date",
    action: "Action",
    manage: "Manage",
    noPoliciesOwned: "No policies owned. Buy one from the explore page!",

    // Manage Policy Modal
    managePolicy: "Manage Policy",
    timeline: "History & Timeline",
    endorsement: "Endorsements",
    cancel: "Surrender/Cancel",
    reinstate: "Reinstate Cover",
    statusHistory: "Status History Timeline",
    noTransitions: "No status transitions recorded yet.",
    triggeredBy: "Triggered by",
    appliedEndorsements: "APPLIED ENDORSEMENTS",
    currentValues: "CURRENT VALUES",
    nominee: "Nominee",
    sumAssured: "Sum Assured",
    premium: "Premium",
    requestChanges: "Request Changes",
    nomineeName: "Nominee Name",
    relationship: "Relationship",
    nomineePhone: "Nominee Phone",
    newSumAssured: "New Sum Assured",
    riders: "Riders (Toggle selection)",
    currentAnnual: "Current Annual Premium",
    newAnnual: "New Annual Premium",
    netImpact: "Net Premium Impact",
    previewImpact: "Preview Premium Impact",
    applyChanges: "Apply Changes",
    freeLook: "Free-Look Window Active! You are eligible for a 100% full refund of all premiums paid (within 15 days of purchase).",
    surrenderWindow: "Policy Surrender Window: You are cancelling outside the 15-day free-look window. Surrender charge and coefficients apply.",
    daysElapsed: "Days Elapsed since start",
    premiumsPaid: "Total Premiums Paid",
    grossSurrender: "Gross Surrender Value",
    surrenderCharge: "Surrender Charge",
    netRefund: "Net Refund Due",
    reasonCancel: "Reason for Cancellation",
    close: "Close",
    confirmSurrender: "Confirm Surrender & Cancel Policy",
    lapsedReinstatement: "Lapsed Policy Reinstatement",
    lapsedNotice: "Your policy is currently LAPSED. You can restore your full coverage by paying the overdue premiums, subject to Admin review and a verified KYC status.",
    overduePremium: "Premium Payment Amount (INR) *",
    submitReinstatement: "Submit Reinstatement Request",
    ragAssistant: "Text RAG Assistant",
    loadDataset: "Load Dataset",
    noDataset: "No custom dataset loaded. Using default policy database.",
    datasetLoaded: "Dataset Loaded: {name}",
    uploadTxt: "Upload .txt dataset",
    askBotPlaceholder: "Ask a question about the policies...",
    botWelcome: "Welcome to the InsurePro AI Policy Assistant. Ask a question or upload a .txt document to begin!",
    ingestingText: "Ingesting document. Please wait...",
    aiThinking: "AI is thinking...",
    send: "Send"
  },
  ta: {
    // Layout
    dashboard: "முகப்பு",
    users: "பயனர் மேலாண்மை",
    kyc: "KYC சரிபார்ப்பு",
    claimsOps: "பரிந்துரைகள் மேலாண்மை",
    underwriting: "காப்பீட்டு மதிப்பீடு",
    reinstatements: "காப்பீடு புதுப்பித்தல்",
    grievances: "புகார்கள் மேலாண்மை",
    agents: "முகவர்கள் மேற்பார்வை",
    finance: "நிதி & கமிஷன்",
    settings: "அமைப்பு அமைப்புகள்",
    logs: "தணிக்கை பதிவுகள்",
    rates: "விகித கட்டமைப்பு",
    analytics: "பகுப்பாய்வு",
    profile: "சுயவிவரம்",
    logout: "வெளியேறு",
    notifications: "அறிவிப்புகள்",
    commissions: "கமிஷன்கள்",
    bankDetails: "வங்கி விவரங்கள்",

    // Dashboard Page (Admin)
    helloAdmin: "வணக்கம், நிர்வாகி {name}!",
    adminSub: "கணினி அளவிலான மேலோட்டம் மற்றும் அளவீட்டு சுருக்கம் இங்கே உள்ளது",
    totalUsers: "மொத்த பயனர்கள்",
    activeAccounts: "செயலில் உள்ள கணக்குகள்",
    pendingKyc: "நிலுவையில் உள்ள KYC",
    requiresReview: "மதிப்பாய்வு தேவை",
    totalClaims: "மொத்த கோரிக்கைகள்",
    systemWide: "கணினி முழுவதும்",
    totalRevenue: "மொத்த வருவாய்",
    premiumCollected: "பிரீமியம் வசூலிக்கப்பட்டது",
    recentClaims: "சமீபத்திய கோரிக்கைகள்",
    noClaims: "கணினியில் இன்னும் எந்த கோரிக்கைகளும் தாக்கல் செய்யப்படவில்லை.",
    claimsOverview: "சமீபத்திய கோரிக்கைகள் மேலோட்டம்",
    claimNo: "கோரிக்கை எண்",
    customerName: "வாடிக்கையாளர் பெயர்",
    claimType: "கோரிக்கை வகை",
    amountRequested: "கோரப்பட்ட தொகை",
    submissionDate: "சமர்ப்பிக்கப்பட்ட தேதி",
    status: "நிலைமை",

    // Dashboard Page (Customer)
    helloUser: "வணக்கம், {name}!",
    customerId: "வாடிக்கையாளர் ஐடி",
    customerSub: "உங்கள் காப்பீட்டு வரம்புகள் மற்றும் நிலைமையின் சுருக்கம் இங்கே",
    activePolicies: "செயலில் உள்ள காப்பீடுகள்",
    normalStatus: "சாதாரண நிலை",
    pendingClaims: "நிலுவையில் உள்ள கோரிக்கைகள்",
    underVerification: "சரிபார்ப்பில் உள்ளது",
    totalPremium: "மொத்த பிரீமியம் செலுத்தியது",
    autoRenewal: "தானியங்கி புதுப்பித்தல் இயங்கும்",
    policiesOwned: "மொத்த காப்பீடுகள்",
    noExpiry: "காலாவதி இல்லை",
    noClaimsUser: "கோரிக்கைகள் எதுவும் தாக்கல் செய்யப்படவில்லை.",
    yourPolicies: "உங்கள் காப்பீட்டு கொள்கைகள்",
    getQuote: "புதிய காப்பீட்டு விண்ணப்பம்",
    policyNo: "காப்பீடு எண்",
    name: "பெயர்",
    category: "வகை",
    coverage: "காப்பீட்டு தொகை",
    expiryDate: "காலாவதி தேதி",
    action: "செயல்பாடு",
    manage: "நிர்வகி",
    noPoliciesOwned: "காப்பீடுகள் ஏதும் இல்லை. காப்பீடுகள் பக்கத்திலிருந்து ஒன்றை வாங்கவும்!",

    // Manage Policy Modal
    managePolicy: "காப்பீட்டை நிர்வகி",
    timeline: "வரலாறு & காலவரிசை",
    endorsement: "மாற்றங்கள்",
    cancel: "ரத்து செய் / திரும்பப் பெறு",
    reinstate: "காப்பீட்டை மீட்டெடு",
    statusHistory: "நிலை மாற்ற காலவரிசை",
    noTransitions: "நிலை மாற்றங்கள் ஏதும் பதிவு செய்யப்படவில்லை.",
    triggeredBy: "செயல்படுத்தியவர்",
    appliedEndorsements: "செயல்படுத்தப்பட்ட மாற்றங்கள்",
    currentValues: "தற்போதைய மதிப்புகள்",
    nominee: "வாரிசுதாரர்",
    sumAssured: "உறுதியளிக்கப்பட்ட தொகை",
    premium: "பிரீமியம்",
    requestChanges: "மாற்றங்களை கோருங்கள்",
    nomineeName: "வாரிசுதாரர் பெயர்",
    relationship: "உறவுமுறை",
    nomineePhone: "தொலைபேசி எண்",
    newSumAssured: "புதிய காப்பீட்டு தொகை",
    riders: "கூடுதல் பலன்கள் (தேர்வு செய்க)",
    currentAnnual: "தற்போதைய ஆண்டு பிரீமியம்",
    newAnnual: "புதிய ஆண்டு பிரீமியம்",
    netImpact: "பிரீமியம் நிகர தாக்கம்",
    previewImpact: "தாக்கத்தை முன்கூட்டியே காண்",
    applyChanges: "மாற்றங்களைப் பயன்படுத்து",
    freeLook: "இலவச ரத்து காலம் செயலில் உள்ளது! நீங்கள் செலுத்திய 100% பிரீமியத்தையும் திரும்பப் பெற தகுதியுடையவர் (வாங்கிய 15 நாட்களுக்குள்).",
    surrenderWindow: "காப்பீட்டை திரும்பப் பெறும் காலம்: 15 நாட்களுக்கு வெளியே ரத்து செய்கிறீர்கள். ரத்து கட்டணம் பொருந்தும்.",
    daysElapsed: "கடந்த நாட்கள்",
    premiumsPaid: "மொத்த பிரீமியம் செலுத்தியது",
    grossSurrender: "மொத்த ரத்து மதிப்பு",
    surrenderCharge: "ரத்து கட்டணம்",
    netRefund: "திரும்பப் பெற வேண்டிய நிகர தொகை",
    reasonCancel: "ரத்து செய்வதற்கான காரணம்",
    close: "மூடு",
    confirmSurrender: "ரத்து செய்வதை உறுதிசெய்",
    lapsedReinstatement: "காலாவதியான காப்பீட்டை மீட்டெடுத்தல்",
    lapsedNotice: "உங்கள் காப்பீடு தற்போது காலாவதியாகியுள்ளது. நிலுவையில் உள்ள பிரீமியங்களை செலுத்தி மீட்டெடுக்கலாம், இது நிர்வாகி சரிபார்ப்புக்கு உட்பட்டது.",
    overduePremium: "நிலுவை பிரீமியம் தொகை (INR) *",
    submitReinstatement: "மீட்டெடுப்பு கோரிக்கையை சமர்ப்பி",
    ragAssistant: "உரை RAG உதவியாளர்",
    loadDataset: "தரவுத்தொகுப்பை ஏற்றுக",
    noDataset: "தனிப்பயன் தரவுத்தொகுப்பு எதுவும் ஏற்றப்படவில்லை. இயல்புநிலை காப்பீட்டுத் தரவுத்தளம் பயன்படுத்தப்படுகிறது.",
    datasetLoaded: "தரவுத்தொகுப்பு ஏற்றப்பட்டது: {name}",
    uploadTxt: ".txt தரவுத்தொகுப்பை பதிவேற்றுக",
    askBotPlaceholder: "காப்பீடுகள் பற்றி ஒரு கேள்வியைக் கேளுங்கள்...",
    botWelcome: "காப்பீட்டு உதவியாளருக்கு வரவேற்கிறோம். தொடங்க ஒரு கேள்வியைக் கேளுங்கள் அல்லது ஒரு .txt ஆவணத்தை பதிவேற்றவும்!",
    ingestingText: "ஆவணம் பதிவேற்றப்படுகிறது. தயவுசெய்து காத்திருக்கவும்...",
    aiThinking: "செயற்கை நுண்ணறிவு யோசிக்கிறது...",
    send: "அனுப்பு"
  }
};

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('insurepro_lang');
    return saved === 'ta' ? 'ta' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('insurepro_lang', lang);
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ta' : 'en'));
  }, []);

  const t = useCallback((key, replacements = {}) => {
    const dict = translations[lang] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    Object.keys(replacements).forEach((k) => {
      text = text.replace(`{${k}}`, replacements[k]);
    });
    return text;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
