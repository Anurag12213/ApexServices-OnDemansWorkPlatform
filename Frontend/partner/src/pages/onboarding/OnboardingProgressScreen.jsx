import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { CheckCircle2, Clock, AlertCircle, ArrowRight, ShieldCheck, FileText, UserCheck, Zap } from 'lucide-react';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';

export const OnboardingProgressScreen = () => {
  const { partner, docRequirements, setActiveTab } = usePartner();

  const partnerType = partner?.accountType || 'INDIVIDUAL';
  const applicableReqs = docRequirements.filter(
    r => r.applicableType === 'ALL' || r.applicableType === partnerType
  );

  // Calculate actual completion of each step
  const step1_AccountCreated = !!partner;
  const step2_DepositVerified = partner?.depositStatus === 'VERIFIED';
  
  const submittedDocsCount = applicableReqs.filter(r => partner?.documents?.[r.id]).length;
  const step3_DocsSubmitted = applicableReqs.length > 0 && submittedDocsCount >= applicableReqs.length;

  const approvedDocsCount = applicableReqs.filter(r => partner?.documents?.[r.id]?.status === 'APPROVED').length;
  const step4_DocsApproved = applicableReqs.length > 0 && approvedDocsCount >= applicableReqs.length;

  const step5_ProfileCompleted = !!(partner?.fullName && partner?.phone && partner?.email);
  const step6_AreaConfigured = !!(partner?.territory && partner?.category);
  const step7_AccountApproved = partner?.onboardingState === 'APPROVED';
  const step8_ReadyForRequests = step7_AccountApproved && step2_DepositVerified && step4_DocsApproved;

  const steps = [
    {
      id: 1,
      title: 'Partner Account Created',
      description: `Registered as ${partner?.fullName || 'Technician'} (${partner?.accountType || 'Individual'})`,
      completed: step1_AccountCreated,
      actionTab: null
    },
    {
      id: 2,
      title: 'Security Deposit Paid & Verified',
      description: `Mandatory ₹${partner?.depositAmount?.toLocaleString('en-IN') || '5,000'} escrow reserve verified on backend`,
      completed: step2_DepositVerified,
      actionTab: 'deposit',
      actionLabel: 'Pay / Verify Deposit'
    },
    {
      id: 3,
      title: 'Required Credentials Submitted',
      description: `${submittedDocsCount} of ${applicableReqs.length} mandatory trade credentials uploaded`,
      completed: step3_DocsSubmitted,
      actionTab: 'documents',
      actionLabel: 'Upload Credentials'
    },
    {
      id: 4,
      title: 'Documents Approved by Compliance',
      description: `${approvedDocsCount} of ${applicableReqs.length} documents officially approved by Admin`,
      completed: step4_DocsApproved,
      actionTab: 'documents',
      actionLabel: 'Check Review Status'
    },
    {
      id: 5,
      title: 'Partner Profile Completed',
      description: 'Contact verification, photo, and legal identity recorded',
      completed: step5_ProfileCompleted,
      actionTab: 'profile',
      actionLabel: 'Edit Profile'
    },
    {
      id: 6,
      title: 'Service Category & Radius Configured',
      description: `${partner?.category || 'Primary Trade'} in ${partner?.territory || 'Operating Zone'}`,
      completed: step6_AreaConfigured,
      actionTab: 'profile',
      actionLabel: 'Configure Territory'
    },
    {
      id: 7,
      title: 'Partner Account Approved',
      description: 'Authoritative administrative authorization and clear background check',
      completed: step7_AccountApproved,
      actionTab: null
    },
    {
      id: 8,
      title: 'Ready to Receive Live Job Offers',
      description: 'Online availability enabled, sound alerts configured, 80% net payouts active',
      completed: step8_ReadyForRequests,
      actionTab: 'home',
      actionLabel: 'Go to Dashboard'
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Partner Activation Milestones
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Partner Activation Checklist
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          The backend requires all 8 criteria to be fulfilled before dispatching live customer service requests to your device.
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Overall Activation Completion</span>
          <span className="text-base text-[#3867FF]">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#3867FF] to-[#7C3AED] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{completedCount} of {steps.length} Milestones Verified</span>
          {step8_ReadyForRequests ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Eligible for Live Dispatch
            </span>
          ) : (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Activation In Progress
            </span>
          )}
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              step.completed
                ? 'bg-emerald-50/40 border-emerald-200/80'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                step.completed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {step.completed ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>

              <div>
                <h3 className={`text-xs sm:text-sm font-bold ${step.completed ? 'text-slate-900' : 'text-slate-700'}`}>
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Action if pending */}
            {!step.completed && step.actionTab && (
              <button
                onClick={() => setActiveTab(step.actionTab)}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
