import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('apex_cookie_consent');
    if (!consent) {
      // Delay slightly so page loads cleanly first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('apex_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('apex_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#0A2540] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/20">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Cookie & Privacy Policy</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h4>
            <button
              onClick={handleAcceptEssential}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              aria-label="Close cookie banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            We use strictly necessary cookies to ensure secure authentication, session management, and reliable booking dispatch.
          </p>
          <div className="flex items-center gap-2.5 mt-3 pt-1">
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-lg bg-[#ff3b47] hover:bg-[#e62e3a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Accept All
            </button>
            <button
              onClick={handleAcceptEssential}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
