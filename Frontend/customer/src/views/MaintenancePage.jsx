import React, { useState } from 'react';
import { Clock, Shield, AlertTriangle, RefreshCw, Mail, Phone, ExternalLink } from 'lucide-react';

export const MaintenancePage = ({ config = {}, supportEmail, supportPhone, onRefresh }) => {
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    setChecking(true);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setChecking(false), 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A2540] text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#ff3b47] selection:text-white text-left">
      {/* Brand Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff3b47] flex items-center justify-center text-white font-black text-lg shadow-md">
            A.
          </div>
          <div>
            <span className="font-black text-xl text-white tracking-tight block">ApexServices<span className="text-[#ff3b47]">.</span></span>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">Certified Master Home Solutions</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>System Maintenance</span>
        </div>
      </div>

      {/* Main Notice Box */}
      <div className="max-w-2xl mx-auto w-full my-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
          <Clock className="w-10 h-10 animate-pulse text-[#ff3b47]" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/15 border border-blue-400/30 px-3.5 py-1 rounded-full inline-block">
            Under Scheduled Maintenance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {config.title || "We'll be back shortly."}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            {config.message || "ApexServices is currently undergoing scheduled platform upgrades to improve service dispatch performance. We apologize for the temporary inconvenience."}
          </p>
        </div>

        {/* Schedule & Times */}
        {(config.plannedStart || config.expectedEnd) && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs">
            {config.plannedStart && (
              <div className="text-center sm:text-left">
                <span className="text-slate-400 block uppercase text-[10px] font-bold tracking-wider">Maintenance Started</span>
                <span className="font-semibold text-slate-200 font-mono">{config.plannedStart}</span>
              </div>
            )}
            {config.plannedStart && config.expectedEnd && (
              <div className="hidden sm:block w-px h-8 bg-slate-800"></div>
            )}
            {config.expectedEnd && (
              <div className="text-center sm:text-left">
                <span className="text-amber-400 block uppercase text-[10px] font-bold tracking-wider">Estimated Completion</span>
                <span className="font-bold text-white font-mono">{config.expectedEnd}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full sm:w-auto bg-[#ff3b47] hover:bg-[#e62e3a] text-white font-bold px-7 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check Status Again'}</span>
          </button>

          {config.supportLink && (
            <a
              href={config.supportLink}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#ff3b47]" />
              <span>Contact Emergency Support</span>
            </a>
          )}
        </div>

        {/* Support Direct Contacts */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="hover:text-white flex items-center gap-1.5 transition">
              <Mail className="w-3.5 h-3.5 text-[#ff3b47]" />
              <span>{supportEmail}</span>
            </a>
          )}
          {supportPhone && (
            <a href={`tel:${supportPhone}`} className="hover:text-white flex items-center gap-1.5 transition">
              <Phone className="w-3.5 h-3.5 text-[#ff3b47]" />
              <span>{supportPhone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400 border-t border-slate-800/80 pt-6">
        <p>&copy; {new Date().getFullYear()} ApexServices Platform. All rights reserved.</p>
      </div>
    </div>
  );
};
