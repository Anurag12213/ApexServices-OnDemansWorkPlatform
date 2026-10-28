import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Power,
  Zap,
  Wrench,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  BellRing,
  Award,
  AlertTriangle,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

export const PartnerDashboardScreen = () => {
  const {
    partner,
    activeJob,
    offers,
    toggleOnline,
    setActiveTab
  } = usePartner();

  const isDepositPaid = partner?.depositStatus === 'VERIFIED';
  const isApproved = partner?.onboardingState === 'APPROVED';
  const isEligible = isDepositPaid && isApproved;

  const pendingOffers = (offers || []).filter(o => o.status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Ineligible Warning or Activation Alert */}
      {!isEligible && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
              <h2 className="text-base font-extrabold tracking-tight">
                Account Activation Incomplete
              </h2>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed max-w-xl">
              You cannot receive live customer job requests or turn online until your mandatory security deposit is verified and credential documents are approved.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isDepositPaid ? (
              <button
                onClick={() => setActiveTab('deposit')}
                className="w-full sm:w-auto px-4 py-2.5 bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Complete Deposit Now
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('documents')}
                className="w-full sm:w-auto px-4 py-2.5 bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Submit Documents
              </button>
            )}
            <button
              onClick={() => setActiveTab('onboarding')}
              className="px-3 py-2.5 bg-amber-700/60 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl"
            >
              Checklist
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Greeting, Online Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {partner?.fullName || 'Technician'}
            </h1>
            <StatusBadge status={partner?.onboardingState} />
          </div>
          <p className="text-xs text-slate-500">
            {partner?.category} • {partner?.territory} • Rating: <strong className="text-slate-800">{partner?.rating || '5.0'} ★</strong>
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={toggleOnline}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
              partner?.isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : isEligible
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{partner?.isAvailable ? 'AVAILABLE (ONLINE)' : 'GO ONLINE'}</span>
          </button>
        </div>
      </div>

      {/* 3. INR Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Net Earnings */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Today's Earnings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            <CurrencyDisplay amount={partner?.earnings?.today || 0} />
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>80% Net Credited</span>
          </p>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">This Month</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#3867FF] flex items-center justify-center font-bold text-xs">
              M
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            <CurrencyDisplay amount={partner?.earnings?.thisMonth || 0} />
          </div>
          <p className="text-[11px] text-slate-500">
            {partner?.jobsCompleted || 0} Total Completed Jobs
          </p>
        </div>

        {/* Available for Payout */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Available Balance</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
              P
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            <CurrencyDisplay amount={partner?.earnings?.availableBalance || 0} />
          </div>
          <button
            onClick={() => setActiveTab('earnings')}
            className="text-[11px] text-[#3867FF] font-bold hover:underline block"
          >
            Request Payout →
          </button>
        </div>

        {/* Escrow Deposit Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Security Escrow</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            <CurrencyDisplay amount={partner?.depositAmount || 5000} />
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={partner?.depositStatus} size="sm" />
          </div>
        </div>
      </div>

      {/* 4. Active Job Card (if assigned) */}
      {activeJob && (
        <div className="bg-white rounded-2xl border-2 border-[#3867FF]/30 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3867FF]">
                  Live Assignment in Progress
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {activeJob.title}
                </h3>
              </div>
            </div>
            <StatusBadge status={activeJob.status} size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Customer & Contact</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{activeJob.customerName}</p>
              <p className="text-slate-500">{activeJob.customerPhone}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Service Address</p>
              <p className="font-semibold text-slate-800 mt-0.5">{activeJob.address}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Fixed Category Fee</p>
              <div className="text-base font-black text-slate-900 mt-0.5">
                <CurrencyDisplay amount={activeJob.fixedFee} />
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">
                Your 80% Share: <CurrencyDisplay amount={activeJob.financials.partnerNetEarning} />
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className="px-6 py-2.5 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors"
            >
              <span>Manage Job Execution Flow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Live Pending Offers Box */}
      {pendingOffers.length > 0 && (
        <div className="bg-blue-50/60 rounded-2xl border border-blue-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#3867FF]" />
              <span>Incoming Live Offers Awaiting Your Decision ({pendingOffers.length})</span>
            </h3>
            <button
              onClick={() => setActiveTab('requests')}
              className="text-xs font-bold text-[#3867FF] hover:underline"
            >
              View Full Screen Alert →
            </button>
          </div>

          {pendingOffers.map((o) => (
            <div
              key={o.id}
              onClick={() => setActiveTab('requests')}
              className="bg-white p-4 rounded-xl border border-blue-100 flex items-center justify-between gap-4 cursor-pointer hover:border-[#3867FF] transition-colors"
            >
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">{o.serviceCategory}</span>
                <h4 className="font-bold text-slate-900 text-sm">{o.problemTitle}</h4>
                <p className="text-xs text-slate-500">{o.serviceArea} • {o.approxDistance}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-black text-slate-900">
                  <CurrencyDisplay amount={o.fixedServiceFee} />
                </div>
                <span className="text-[11px] font-bold text-rose-600">2m Timer Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Quick Operations Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('schedule')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors space-y-2"
        >
          <Calendar className="w-5 h-5 text-[#3867FF]" />
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Calendar</h4>
            <p className="text-[11px] text-slate-400">View upcoming appointments</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors space-y-2"
        >
          <Award className="w-5 h-5 text-[#7C3AED]" />
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Fixed Pricing</h4>
            <p className="text-[11px] text-slate-400">Category scope & exclusions</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors space-y-2"
        >
          <PhoneCall className="w-5 h-5 text-emerald-600" />
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Partner Support</h4>
            <p className="text-[11px] text-slate-400">Help center & dispute tickets</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors space-y-2"
        >
          <BellRing className="w-5 h-5 text-amber-500" />
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Notifications</h4>
            <p className="text-[11px] text-slate-400">Alerts, broadcasts & updates</p>
          </div>
        </button>
      </div>
    </div>
  );
};
