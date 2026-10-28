import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const LegalModal = ({ isOpen, type, onClose }) => {
  if (!isOpen || !type) return null;

  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How ApexServices protects your data & privacy',
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      body: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            At <strong>ApexServices</strong>, we value the trust you place in us. This Privacy Policy outlines how your personal information is collected, used, and secured during the booking and fulfillment of on-demand home craftsmanship services.
          </p>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Information We Collect
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Contact Details: Full name, verified mobile number, and email address.</li>
              <li>Service Address: Physical location where certified repair or installation will take place.</li>
              <li>Service History: Diagnostics, technician notes, quotes, and payment completion status.</li>
            </ul>
          </div>
          <p>
            We never sell, rent, or trade your personal data with third-party data brokers. Data is shared exclusively with the certified partner dispatched to complete your requested service.
          </p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'Platform agreement & guarantee policies',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      body: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            By booking a service through <strong>ApexServices</strong>, you agree to our standard customer charter and platform policies:
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <strong className="text-white block mb-0.5">1. Verified Technician Guarantee</strong>
              <p className="text-slate-400">All dispatched partners pass background checks and platform verification before onboarding.</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <strong className="text-white block mb-0.5">2. Secure Completion OTP</strong>
              <p className="text-slate-400">Services are officially signed off only when you provide your 4-digit completion OTP to the technician upon satisfactory inspection.</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <strong className="text-white block mb-0.5">3. Transparent Pricing</strong>
              <p className="text-slate-400">Diagnostic price estimates provided during booking are finalized before any physical repair begins.</p>
            </div>
          </div>
        </div>
      )
    },
    cookies: {
      title: 'Cookie & Tracking Notice',
      subtitle: 'Transparency on session handling & storage',
      icon: <CheckCircle2 className="w-5 h-5 text-purple-400" />,
      body: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            ApexServices utilizes browser storage strictly for functional application integrity:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400">
            <li><strong className="text-white">Authentication State:</strong> Storing authenticated user sessions to maintain your active account.</li>
            <li><strong className="text-white">Booking Draft Preservation:</strong> Protecting unsubmitted service request forms against accidental reloads.</li>
            <li><strong className="text-white">Live Tracking Identifier:</strong> Allowing you to track dispatched technicians without re-authenticating every visit.</li>
          </ul>
        </div>
      )
    }
  };

  const activeContent = contentMap[type] || contentMap.privacy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#0A2540] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              {activeContent.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{activeContent.title}</h3>
              <p className="text-xs text-slate-400">{activeContent.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 max-h-[60vh] overflow-y-auto pr-1">
          {activeContent.body}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
