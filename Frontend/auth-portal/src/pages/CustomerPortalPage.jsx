import React, { useState } from 'react';
import { CustomerPortalCard } from '../components/portal/CustomerPortalCard';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerPortalPage = () => {
  const [activeSession, setActiveSession] = useState(null);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col justify-between selection:bg-blue-100">
      {/* Top Bar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Show All 3 Portals</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Customer Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - Centered & Aligned Card */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center">
        {activeSession && (
          <div className="w-full max-w-[420px] mb-5 p-3.5 rounded-2xl bg-white border border-emerald-300 shadow-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-900">Signed in as {activeSession.fullName}</p>
              <p className="text-slate-500">{activeSession.email || activeSession.mobileNumber}</p>
            </div>
          </div>
        )}

        <CustomerPortalCard onLoginSuccess={(res) => setActiveSession(res.user)} />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-400">
        Apex Services &copy; {new Date().getFullYear()} • Customer Portal Authentication
      </footer>
    </div>
  );
};

export default CustomerPortalPage;
