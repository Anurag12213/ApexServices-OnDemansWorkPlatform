import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useConfirm } from './ConfirmDialog';
import { 
  Menu, 
  X, 
  Sparkles, 
  User, 
  LogOut, 
  ArrowRight, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Bell, 
  ChevronDown, 
  ClipboardList 
} from 'lucide-react';

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
    handleTrackLiveRequest,
    submitWorkRequest,
    data,
    toast,
    setActiveTrackingRequestId,
    setActiveBookingStep,
    setCustomerViewMode
  } = useData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const confirm = useConfirm();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setProfileDropdownOpen(false);
    }
  };

  const brandName = siteBranding?.brandName || 'ApexServices';
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';
  const logoImageUrl = siteBranding?.logoImageUrl;
  const ctaText = siteBranding?.headerCtaText || 'REQUEST NOW';

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services', hasDropdown: true },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' },
  ];

  const [isFastTesting, setIsFastTesting] = useState(false);

  const handleFastTestClick = async () => {
    try {
      setIsFastTesting(true);
      const activeCat = data?.categories?.find(c => c.active !== false) || {
        id: 1,
        name: 'Custom Carpentry',
        slug: 'custom-carpentry'
      };

      const testPayload = {
        serviceCategoryId: activeCat.id,
        serviceCategory: activeCat.name,
        customerName: customerUser?.fullName || 'Verified Customer',
        customerEmail: customerUser?.email || 'customer@apexservices.com',
        contactPhone: customerUser?.mobileNumber || customerUser?.phone || '+919876543210',
        problemType: 'General Maintenance & Diagnosis',
        problemTitle: `Fast Test: ${activeCat.name} Quick Inspection`,
        problemDescription: 'Automated test request generated via 1-Click Fast Test Dispatch for rapid verification.',
        urgency: 'Standard',
        serviceAddress: 'Flat 402, Green Glen Layout, Outer Ring Road, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        preferredTime: 'Morning (9 AM - 12 PM)',
        timeSlot: 'Morning (9 AM - 12 PM)',
        estimatedCost: 599,
        notes: 'Fast test dispatch - instant 1-click test from Navbar'
      };

      const res = await submitWorkRequest(testPayload);
      if (res && res.success) {
        if (setActiveTrackingRequestId) setActiveTrackingRequestId(res.request.id);
        if (setActiveBookingStep) setActiveBookingStep(9);
        if (setCustomerViewMode) setCustomerViewMode('booking');
        setActivePage('request-work');
        toast?.success(`⚡ Fast Test Request dispatched! Ticket #${res.request.id}`, 'Fast Test Created');
      } else {
        toast?.error(res?.error || 'Failed to dispatch fast test request', 'Test Dispatch Error');
      }
    } catch (e) {
      console.error('Fast test error:', e);
      toast?.error('Error generating fast test request.', 'Dispatch Error');
    } finally {
      setIsFastTesting(false);
      setMobileMenuOpen(false);
    }
  };

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  const handleMyRequestsClick = () => {
    if (setCustomerViewMode) setCustomerViewMode('history');
    setActivePage('request-work');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo with Stylized Purple Geometric Mark */}
          <div
            className="flex items-center cursor-pointer group space-x-2.5 shrink-0 select-none"
            onClick={() => handleNavClick('home')}
          >
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={brandName}
                className="h-8 sm:h-9 max-h-10 max-w-[150px] object-contain rounded shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#5B46F6] to-[#8C7BFF] flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 2L2 22h20L12 2zm0 5l6.5 13H5.5L12 7z" />
                </svg>
              </div>
            )}
            {(siteBranding?.showBrandNameWithLogo !== false || !logoImageUrl) && (
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 shrink-0 whitespace-nowrap">
                {brandName}
              </span>
            )}
          </div>

          {/* Clean Nav Links (Desktop >= 1024px) */}
          <nav className="hidden lg:flex items-center space-x-7 xl:space-x-9 shrink-0">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-sm font-semibold transition-colors relative py-1 cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'text-[#6355F6]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform group-hover:translate-y-0.5" />
                  )}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#6355F6]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Actions matching Reference Image */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* [ My Requests ] Solid Purple Pill Button matching mockup */}
            <button
              onClick={handleMyRequestsClick}
              className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#6355F6] hover:bg-[#5244E8] text-white text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              title="View all your service requests"
            >
              <span className="whitespace-nowrap">My Requests</span>
            </button>

            {/* Notification Bell Button with Red Alert Dot */}
            <button
              onClick={() => {
                toast?.info('You are up to date! Real-time notifications will show here.', 'Notifications');
              }}
              className="hidden xs:inline-flex relative p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Customer Profile Avatar Chip with Dropdown */}
            <div className="relative shrink-0" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 p-0.5 sm:pl-1 sm:pr-2.5 sm:py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt={customerUser?.fullName || 'Anurag Sharma'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-purple-200 shadow-2xs"
                />
                <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[120px] truncate">
                  {customerUser?.fullName || 'Anurag Sharma'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{customerUser?.fullName || 'Anurag Sharma'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{customerUser?.email || 'anurag.sharma@apexservices.com'}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleMyRequestsClick();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6355F6] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>My Service Requests</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFastTestClick();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>1-Click Test Request</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  {customerUser ? (
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleNavClick('login');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Switch Account</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
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

          {/* Mobile 1-Click Fast Test Button */}
          <button
            onClick={handleFastTestClick}
            disabled={isFastTesting}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            title="Instant 1-Click Request Dispatch for Fast Testing"
          >
            <Zap className={`w-4 h-4 fill-current ${isFastTesting ? 'animate-spin' : ''}`} />
            <span>{isFastTesting ? 'Dispatching...' : '⚡ 1-Click Fast Test Request'}</span>
          </button>

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
