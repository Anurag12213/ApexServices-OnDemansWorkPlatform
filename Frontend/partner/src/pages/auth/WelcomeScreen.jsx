import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { ShieldCheck, Zap, IndianRupee, Users, ArrowRight, Award, CheckCircle } from 'lucide-react';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';

export const WelcomeScreen = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Hero Badge & Title */}
      <div className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#3867FF] text-xs font-bold">
          <Award className="w-4 h-4" />
          <span>India's Premier On-Demand Home Service Network</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Grow Your Trade with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3867FF] to-[#7C3AED]">
            ApexServices Partner Program
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Join thousands of certified carpentering, plumbing, electrical, and appliance professionals. Get direct verified customer requests, guaranteed fixed pricing in INR, and 80% weekly net payouts.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3867FF] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Instant Live Dispatch</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Real-time incoming job alerts nearby with exact distance, fixed category fee, and 45s direct response.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">80% Net Payouts</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Zero hidden deductions. Keep 80% of all fixed category fees with automated UPI or Bank NEFT settlement.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Transparent Escrow Deposit</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ₹5,000 (Individual) or ₹10,000 (Organization) mandatory security deposit held securely in partner escrow.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Call to Action */}
      <div className="bg-gradient-to-br from-[#172033] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 my-4">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold">Ready to Start Receiving Work?</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Sign up in 3 minutes, complete security deposit, submit trade verification, and start earning today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#3867FF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <span>Register as Partner</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 flex items-center justify-center transition-all"
          >
            Existing Partner Login
          </button>
        </div>
      </div>

      {/* Footer Info & Legal */}
      <div className="text-center pt-6 text-xs text-slate-500 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 ApexServices Technologies Private Limited. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#terms" className="hover:text-slate-900 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#deposit-policy" className="hover:text-slate-900 transition-colors">Security Deposit Policy</a>
        </div>
      </div>
    </div>
  );
};
