import React, { useState } from 'react';
import { CustomerPortalCard } from '../components/portal/CustomerPortalCard';
import { PartnerPortalCard } from '../components/portal/PartnerPortalCard';
import { AdminPortalCard } from '../components/portal/AdminPortalCard';
import { Layers, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MultiPortalShowcasePage = () => {
  const [activeSession, setActiveSession] = useState(null);

  const handleLoginSuccess = (response) => {
    setActiveSession(response.user);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-16 selection:bg-blue-100">
      {/* Top Global Bar */}
      <header className="w-full bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  APEX SERVICES
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Multi-Portal Auth
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Unified Authentication Architecture • Production Portal
              </p>
            </div>
          </div>

          {/* Quick Portal Switcher Links */}
          <nav className="flex items-center gap-2 flex-wrap text-xs font-bold">
            <Link
              to="/customer"
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Customer Portal</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <Link
              to="/partner"
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Partner Hub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/60 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Admin Operations</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Active User Notification Banner (if logged in) */}
      {activeSession && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-md flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Session Authenticated Successfully:</p>
                <p className="text-sm font-bold text-slate-900">
                  {activeSession.fullName} <span className="text-xs text-slate-400 font-normal">({activeSession.email || activeSession.mobileNumber})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                Role: {activeSession.role}
              </span>
              <button
                onClick={() => setActiveSession(null)}
                className="px-3 py-1 rounded-md text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-COLUMN PRODUCTION PORTAL GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 justify-items-center items-start">
          <CustomerPortalCard onLoginSuccess={handleLoginSuccess} />
          <PartnerPortalCard onLoginSuccess={handleLoginSuccess} />
          <AdminPortalCard onLoginSuccess={handleLoginSuccess} />
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 mt-8">
        Apex Services Multi-Portal Authentication System • Clean JavaScript & Tailwind CSS
      </footer>
    </div>
  );
};

export default MultiPortalShowcasePage;
