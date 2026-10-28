import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useConfirm } from './ConfirmDialog';
import { Menu, X, Sparkles, User, LogOut, ArrowRight, Activity, Calendar, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const {
    activePage,
    setActivePage,
    customerUser,
    logoutCustomer,
    handleInitiateRequestWork,
    siteBranding,
    liveRequests,
    hasLiveRequest,
    mostRecentLiveRequest,
    handleViewAllRequests,
    handleTrackLiveRequest
  } = useData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const confirm = useConfirm();

  const handleLogoutClick = async () => {
    const isConfirmed = await confirm({
      title: 'Are you sure you want to log out?',
      message: 'You will need to sign in again to view your active service requests and saved details.',
      confirmText: 'Yes, Log Out',
      cancelText: 'Stay Logged In',
      variant: 'warning'
    });
    if (isConfirmed) {
      logoutCustomer();
      setMobileMenuOpen(false);
    }
  };

  const brandName = siteBranding?.brandName || 'ApexServices';
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';
  const logoImageUrl = siteBranding?.logoImageUrl;
  const ctaText = siteBranding?.headerCtaText || 'REQUEST NOW';

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer group space-x-2 shrink-0 select-none"
            onClick={() => handleNavClick('home')}
          >
            {logoImageUrl && (
              <img
                src={logoImageUrl}
                alt={brandName}
                className="h-8 sm:h-10 max-h-11 max-w-[150px] sm:max-w-[180px] object-contain rounded shrink-0"
              />
            )}
            {(siteBranding?.showBrandNameWithLogo !== false || !logoImageUrl) && (
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 shrink-0 whitespace-nowrap">
                {brandName}<span style={{ color: brandDotColor }}>.</span>
              </span>
            )}
          </div>

          {/* Clean Nav Links (Desktop >= 1024px) */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 shrink-0">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-sm font-semibold transition-colors relative py-1 cursor-pointer ${
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                  style={isActive ? { color: brandDotColor } : {}}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: brandDotColor }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {customerUser ? (
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                {/* User Pill */}
                <div className="hidden sm:flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 transition-colors shrink-0">
                  <div className="w-5 h-5 rounded-full bg-[#0A2540] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {customerUser.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[90px] md:max-w-[120px] truncate">
                    {customerUser.fullName}
                  </span>
                </div>
                
                {/* My Requests (Desktop >= 1024px) */}
                <button
                  onClick={() => handleViewAllRequests(hasLiveRequest ? 'live' : 'history')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden lg:inline cursor-pointer whitespace-nowrap shrink-0"
                >
                  My Requests
                </button>

                {/* Sign Out (Desktop >= 1024px) */}
                <button
                  onClick={handleLogoutClick}
                  className="text-xs font-medium text-slate-400 hover:text-[#ff3b47] px-2 py-1 transition-colors hidden lg:inline cursor-pointer whitespace-nowrap shrink-0"
                  title="Sign Out of Customer Account"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="hidden sm:inline-block text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                Sign In
              </button>
            )}

            {/* Request CTA Button */}
            <button
              onClick={() => {
                handleInitiateRequestWork();
                setMobileMenuOpen(false);
              }}
              className="text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer hover:opacity-90 shrink-0 whitespace-nowrap"
              style={{ backgroundColor: brandDotColor }}
            >
              {ctaText}
            </button>

            {/* Mobile/Tablet Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE / TABLET NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {/* User Status Bar */}
          {customerUser ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0A2540] text-white flex items-center justify-center text-xs font-bold">
                  {customerUser.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{customerUser.fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{customerUser.email || customerUser.mobileNumber}</div>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                className="text-xs font-bold text-[#ff3b47] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="text-xs text-slate-600 font-medium">Have a customer account?</div>
              <button
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 bg-[#0A2540] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* Quick Shortcuts for Live Requests & My Requests */}
          {customerUser && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handleViewAllRequests('live');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Live Requests ({liveRequests.length})</span>
              </button>
              <button
                onClick={() => {
                  handleViewAllRequests('history');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Past History</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-red-50 text-[#ff3b47]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandDotColor }} />}
                </button>
              );
            })}
          </div>

          {/* Mobile Full-Width CTA */}
          <button
            onClick={() => {
              handleInitiateRequestWork();
              setMobileMenuOpen(false);
            }}
            className="w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: brandDotColor }}
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
