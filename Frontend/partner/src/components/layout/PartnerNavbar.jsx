import React, { useState, useRef, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Bell, ShieldCheck, Power, Wrench, Menu, CheckCircle2, AlertCircle, ChevronDown, LogOut, Check, User } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const PartnerNavbar = ({ onOpenMenu }) => {
  const {
    partner,
    activeJob,
    unreadNotificationCount,
    toggleOnline,
    setActiveTab,
    login,
    logout
  } = usePartner();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isEligible = partner?.depositStatus === 'VERIFIED' && partner?.onboardingState === 'APPROVED';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Mobile View: Hamburger Menu + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                  Apex<span className="text-blue-600">Services</span>
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                  Partner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View: Empty spacer to balance header */}
        <div className="hidden lg:block min-w-0" />

        {/* Center: Active Job Quick Access (if active) */}
        {activeJob && (
          <button
            onClick={() => setActiveTab('jobs')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#3867FF] rounded-full text-xs font-semibold animate-pulse transition-colors max-w-xs truncate shrink-0"
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Active Job: {activeJob.category}</span>
            <span className="bg-[#3867FF] text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
              {activeJob.status}
            </span>
          </button>
        )}

        {/* Right Actions: Availability Toggle, Notifications, Account status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Availability Toggle */}
          {partner && (
            <div className="flex items-center">
              <button
                onClick={toggleOnline}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full font-bold text-xs transition-all shadow-xs shrink-0 ${
                  partner.isAvailable
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : isEligible
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
                title={
                  !isEligible
                    ? 'Account activation requirements incomplete'
                    : partner.isAvailable
                    ? 'You are online and eligible for live job dispatches'
                    : 'You are offline'
                }
              >
                <Power className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {partner.isAvailable ? 'Online' : isEligible ? 'Offline' : 'Incomplete'}
                </span>
              </button>
            </div>
          )}

          {/* Notifications Bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3867FF] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Quick Profile Pill with Account Switcher Dropdown */}
          {partner ? (
            <div className="relative shrink-0" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 py-1 cursor-pointer border-l border-slate-200 hover:opacity-80 transition-opacity select-none"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center ring-2 ring-white shrink-0">
                  {partner.fullName?.charAt(0) || 'P'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                    <span className="truncate max-w-[120px]">{partner.fullName}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {partner.category}
                  </p>
                </div>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{partner.fullName}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold truncate">{partner.category}</p>
                    <p className="text-[10px] text-slate-400 truncate">{partner.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setActiveTab('profile');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Partner Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setActiveTab('documents');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Document Verification</span>
                    </button>
                  </div>

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="text-xs font-bold text-[#3867FF] hover:underline"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
