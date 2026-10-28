import React, { useState } from 'react';
import { X, User, Users, Check, ArrowRight, ShieldCheck, Briefcase, Award } from 'lucide-react';

export const PartnerOnboardingModal = ({ isOpen, onClose, onSelectType }) => {
  const [selectedType, setSelectedType] = useState('individual');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
            PARTNER REGISTRATION
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Choose Your Partner Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apex Services supports both solo technicians and established service companies. Select how you want to work:
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Individual Partner Card */}
          <div
            onClick={() => setSelectedType('individual')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedType === 'individual'
                ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            {selectedType === 'individual' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <User className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Individual Partner</h4>
            <p className="text-xs text-slate-500 font-semibold mb-3">Work Independently</p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Direct customer bookings in your locality</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Daily instant payout to your UPI/bank</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero team management overhead</span>
              </li>
            </ul>
          </div>

          {/* Organization Partner Card */}
          <div
            onClick={() => setSelectedType('organization')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedType === 'organization'
                ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            {selectedType === 'organization' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Organization Partner</h4>
            <p className="text-xs text-slate-500 font-semibold mb-3">Build a Team & Grow</p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Add multiple technicians under 1 company</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Centralized dispatch & operations dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Corporate GST invoices & volume contracts</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Selected: <strong className="text-emerald-700 uppercase font-bold">{selectedType} Partner</strong>
          </span>
          <button
            onClick={() => onSelectType(selectedType)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <span>Proceed to Registration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboardingModal;
