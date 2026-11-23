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
  ClipboardList,
  CheckCircle2,
  Clock,
  History,
  Radio,
  CheckCheck,
  ChevronRight,
  Plus
} from 'lucide-react';

export const Navbar = () => {
  const {
    activePage,
    setActivePage,
    customerUser,
    logoutCustomer,
    handleInitiateRequestWork,
    siteBranding,
    liveRequests = [],
    historyRequests = [],
    hasLiveRequest,
    mostRecentLiveRequest,
    handleViewAllRequests,
    handleTrackLiveRequest,
    submitWorkRequest,
    data,
    toast,
    setActiveTrackingRequestId,
    setActiveBookingStep,
    setCustomerViewMode,
    notifications = [],
    unreadNotificationCount = 0,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);
  const confirm = useConfirm();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recently';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

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
    if (!customerUser) {
      toast?.info('Please sign in to view your service requests.', 'Sign In Required');
      setActivePage('login');
      setMobileMenuOpen(false);
      return;
    }
    if (setCustomerViewMode) setCustomerViewMode('history');
    setActivePage('request-work');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 text-slate-800 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-2">
          
          {/* Logo with Stylized Purple Geometric Mark */}
          <div
            className="flex items-center cursor-pointer group space-x-1.5 sm:space-x-2.5 shrink-0 select-none min-w-0"
            onClick={() => handleNavClick('home')}
          >
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={brandName}
                className="h-7 sm:h-9 max-h-10 max-w-[110px] sm:max-w-[150px] object-contain rounded shrink-0"
              />
            ) : (
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#5B46F6] to-[#8C7BFF] flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current">
                  <path d="M12 2L2 22h20L12 2zm0 5l6.5 13H5.5L12 7z" />
                </svg>
              </div>
            )}
            {(siteBranding?.showBrandNameWithLogo !== false || !logoImageUrl) && (
              <span className="text-sm sm:text-2xl font-black tracking-tight text-slate-900 shrink-0 whitespace-nowrap">
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

          {/* Desktop Right Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
            {/* [ My Requests ] Solid Purple Pill Button - hidden on mobile screens, shown on tablet/desktop */}
            {activePage !== 'request-work' && (
              <button
                onClick={handleMyRequestsClick}
                className="hidden sm:inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#6355F6] hover:bg-[#5244E8] text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                title="View all your service requests"
              >
                <span className="whitespace-nowrap">My Requests</span>
              </button>
            )}

            {/* Real-Time Notification Bell & Dropdown */}
            {customerUser && (
              <div className="relative shrink-0" ref={notificationsDropdownRef}>
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="hidden md:inline-flex relative p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-600" />
                  {unreadNotificationCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  ) : notifications.length > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  ) : null}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        {unreadNotificationCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#6355F6] text-white text-[10px] font-bold">
                            {unreadNotificationCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-semibold text-[#6355F6] hover:text-[#5244E8] cursor-pointer transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="w-10 h-10 rounded-full bg-purple-50 text-[#6355F6] flex items-center justify-center mx-auto mb-2">
                            <CheckCheck className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">You're all caught up!</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Real-time status updates will appear here as your requests progress.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnread = !notif.read;
                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (isUnread && markNotificationAsRead) markNotificationAsRead(notif.id);
                                if (notif.requestId) {
                                  handleTrackLiveRequest(notif.requestId);
                                  setNotificationsOpen(false);
                                }
                              }}
                              className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                                isUnread ? 'bg-purple-50/40 hover:bg-purple-50/80' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                notif.type === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : notif.type === 'IN_PROGRESS'
                                  ? 'bg-amber-100 text-amber-700'
                                  : notif.type === 'ASSIGNED'
                                  ? 'bg-purple-100 text-[#6355F6]'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {notif.type === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatRelativeTime(notif.time)}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                              </div>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[#6355F6] shrink-0 mt-1.5" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                      <button
                        onClick={() => {
                          handleMyRequestsClick();
                          setNotificationsOpen(false);
                        }}
                        className="text-xs font-bold text-[#6355F6] hover:text-[#5244E8] py-1 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Requests</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Profile Avatar Chip & Dashboard Dropdown */}
            {customerUser ? (
              <div className="relative shrink-0" ref={profileDropdownRef}>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-1 sm:gap-2 p-0.5 sm:pl-1 sm:pr-2.5 sm:py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                >
                  {customerUser.avatar ? (
                    <img
                      src={customerUser.avatar}
                      alt={customerUser.fullName || 'Customer'}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-purple-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#6355F6] text-white flex items-center justify-center text-[11px] sm:text-xs font-black shadow-2xs">
                      {customerUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[120px] truncate">
                    {customerUser.fullName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Profile Dashboard Menu with Live Requests, History & Logout */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* User Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50/80 via-slate-50 to-indigo-50/80 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        {customerUser.avatar ? (
                          <img
                            src={customerUser.avatar}
                            alt={customerUser.fullName || 'Customer'}
                            className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#6355F6] text-white flex items-center justify-center text-sm font-black shadow-xs">
                            {customerUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{customerUser.fullName || 'Valued Customer'}</p>
                          <p className="text-[11px] text-slate-500 truncate">{customerUser.email || customerUser.mobileNumber || ''}</p>
                          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Customer Account
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Live Requests */}
                    <div className="p-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Live Requests</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          liveRequests.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {liveRequests.length} Active
                        </span>
                      </div>

                      {liveRequests.length > 0 ? (
                        <div className="space-y-1.5">
                          {liveRequests.slice(0, 3).map((req) => (
                            <div
                              key={req.id}
                              onClick={() => {
                                handleTrackLiveRequest(req.id);
                                setProfileDropdownOpen(false);
                              }}
                              className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{req.serviceCategory || 'Service'}</p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  #{req.id} • {req.status === 'ASSIGNED' ? (req.assignedPartnerName || 'Partner Assigned') : req.status === 'IN_PROGRESS' ? 'Work Started' : 'Finding Partner'}
                                </p>
                              </div>
                              <span className="px-2 py-1 rounded-lg bg-[#6355F6] text-white text-[10px] font-bold shrink-0 shadow-2xs hover:bg-[#5244E8]">
                                Track
                              </span>
                            </div>
                          ))}
                          {liveRequests.length > 3 && (
                            <button
                              onClick={() => {
                                handleViewAllRequests('live');
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-center py-1 text-[11px] font-semibold text-[#6355F6] hover:underline cursor-pointer"
                            >
                              +{liveRequests.length - 3} more active requests
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="px-2 py-2 text-center bg-slate-50 rounded-xl">
                          <p className="text-[11px] text-slate-500">No active service requests right now.</p>
                          <button
                            onClick={() => {
                              handleInitiateRequestWork();
                              setProfileDropdownOpen(false);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#6355F6] hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Book a Service</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section 2: History & Invoices */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handleViewAllRequests('history');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Request History</p>
                            <p className="text-[10px] text-slate-400">Past bookings, invoices & receipts</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {historyRequests.length}
                        </span>
                      </button>
                    </div>

                    {/* Divider & Logout */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Log Out</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sleek Sign In Button (When Logged Out) */
              <button
                onClick={() => handleNavClick('login')}
                className="inline-flex items-center gap-1 px-2 sm:px-3.5 py-1 sm:py-2 rounded-full border border-slate-300 hover:border-[#6355F6] hover:bg-purple-50/60 text-slate-700 hover:text-[#6355F6] text-[10px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                title="Sign in to your customer account"
              >
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 sm:p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
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
