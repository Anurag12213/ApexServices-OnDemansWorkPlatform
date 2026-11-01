import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Menu,
  PanelLeftClose,
  LayoutGrid,
  Calendar,
  Wrench,
  Users,
  CreditCard,
  Tag,
  BarChart3,
  LifeBuoy,
  Mail,
  Palette,
  ShieldAlert,
  Layers,
  ShieldCheck,
  History,
  Sliders,
  Smartphone,
  ArrowUpCircle,
  PieChart,
  X,
  ExternalLink
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  adminUser,
  onLogout
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [modulesMenuOpen, setModulesMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(3);
  const [navSearch, setNavSearch] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Complete registry of all 16 Founder's Admin Panel Checklist modules
  const allModules = [
    { id: 'dashboard', num: 9, name: 'Live Analytics Dashboard', category: 'Operations', icon: PieChart, desc: 'Real-time revenue, active dispatches, and conversion metrics' },
    { id: 'bookings', num: 7, name: 'Order / Booking Management', category: 'Operations', icon: Calendar, desc: 'Full dispatch lifecycle, manual overrides, and dispute arbitration' },
    { id: 'partners', num: 13, name: 'Vendor / Partner Management', category: 'Operations', icon: Wrench, desc: 'Technician onboarding, KYC verification, and payout disbursement' },
    { id: 'users', num: 1, name: 'User Management', category: 'Operations', icon: Users, desc: 'Searchable registry, profile inspection, and suspension controls' },
    { id: 'payments', num: 3, name: 'Payments & Transactions', category: 'Finance', icon: CreditCard, desc: 'Escrow balances, automated refunds, and platform commission' },
    { id: 'coupons', num: 12, name: 'Coupons & Discount Management', category: 'Finance', icon: Tag, desc: 'Promo codes, discount rules, expiry, and usage limits' },
    { id: 'reports', num: 5, name: 'Reports & Exports', category: 'Finance', icon: BarChart3, desc: 'Pre-built exportable CSV/PDF reports for revenue and activity' },
    { id: 'support', num: 8, name: 'Support & Ticket Management', category: 'Communications', icon: LifeBuoy, desc: 'Customer issue inbox, agent assignment, and SLA tracking' },
    { id: 'notifications', num: 4, name: 'Notifications & Push Center', category: 'Communications', icon: Mail, desc: 'Targeted broadcast push notifications and email campaigns' },
    { id: 'content', num: 2, name: 'Content Management (CMS)', category: 'Content', icon: Palette, desc: 'Direct website hero copy, banners, and announcement editing' },
    { id: 'moderation', num: 14, name: 'Content Moderation Tools', category: 'Content', icon: ShieldAlert, desc: 'Review approval queues and partner job proof verification' },
    { id: 'categories', num: 0, name: 'Service Catalog & Pricing', category: 'Content', icon: Layers, desc: 'Fixed rates, duration, and diagnosis fee rules' },
    { id: 'roles', num: 6, name: 'Roles & Permissions (RBAC)', category: 'Governance', icon: ShieldCheck, desc: 'Granular role assignments and administrative access matrices' },
    { id: 'audit', num: 10, name: 'Audit Logs & Activity History', category: 'Governance', icon: History, desc: 'Immutable security log tracking admin actions and client IPs' },
    { id: 'feature-flags', num: 11, name: 'Feature Flags & App Config', category: 'Governance', icon: Sliders, desc: 'Runtime fee adjustments, surge switches, and circuit breakers' },
    { id: 'sessions', num: 15, name: 'Session & Device Management', category: 'Security', icon: Smartphone, desc: 'Active logins monitor, device inspection, and force-logout' },
    { id: 'versions', num: 16, name: 'Force-Update & Version Control', category: 'Security', icon: ArrowUpCircle, desc: 'Minimum client app versions and maintenance mode gates' },
  ];

  // Quick horizontal navigation bar modules (for 1-click jump right under navbar)
  const quickPillModules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'bookings', name: 'Bookings' },
    { id: 'partners', name: 'Partners' },
    { id: 'users', name: 'Users' },
    { id: 'payments', name: 'Payments' },
    { id: 'coupons', name: 'Coupons' },
    { id: 'support', name: 'Support' },
    { id: 'content', name: 'CMS' },
    { id: 'moderation', name: 'Moderation' },
    { id: 'roles', name: 'Roles (RBAC)' },
    { id: 'audit', name: 'Audit Logs' },
    { id: 'feature-flags', name: 'Feature Flags' },
    { id: 'sessions', name: 'Sessions' },
    { id: 'versions', name: 'Versions' },
    { id: 'reports', name: 'Reports' },
    { id: 'notifications', name: 'Notifications' },
  ];

  const searchFilteredModules = allModules.filter(
    (m) =>
      m.name.toLowerCase().includes(navSearch.toLowerCase()) ||
      m.desc.toLowerCase().includes(navSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(navSearch.toLowerCase())
  );

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Emergency Plumbing Alert',
      desc: 'Booking #ORD-9022 is awaiting technician claim.',
      time: '10 mins ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Partner KYC Submitted',
      desc: 'PRT-102 uploaded Business Registration & PCC.',
      time: '45 mins ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Customer Escrow Settlement',
      desc: 'Payment of ₹1,499 confirmed via Razorpay API.',
      time: '2 hours ago',
      unread: true,
    },
  ]);

  const markAllRead = () => {
    setUnreadNotif(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    setShowLogoutModal(false);
    setDropdownOpen(false);
    setTimeout(() => {
      setIsLoggedOut(false);
      if (onLogout) onLogout();
    }, 800);
  };

  const currentModule = allModules.find((m) => m.id === activeTab) || allModules[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 text-left">
      {/* Toast Logout Notification */}
      {isLoggedOut && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center space-x-2 z-50">
          <LogOut className="w-4 h-4 text-blue-400" />
          <span>Successfully logged out. Redirecting...</span>
        </div>
      )}

      {/* Main Top Header Row */}
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left: Sidebar Toggle, All Modules Menu Button & Quick Search */}
        <div className="flex items-center space-x-3 w-full max-w-xl">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition focus:outline-none cursor-pointer"
          >
            {sidebarCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          {/* All 16 Modules Dropdown Mega-Menu Button */}
          <div className="relative">
            <button
              onClick={() => {
                setModulesMenuOpen(!modulesMenuOpen);
                setDropdownOpen(false);
                setNotifOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition cursor-pointer select-none"
            >
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              <span>All 16 Modules</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Mega-Menu Grid Popover */}
            {modulesMenuOpen && (
              <div className="absolute left-0 mt-2 w-[680px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Founder's Admin Panel — Complete 16 Modules
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Direct single-click navigation to every business operations system
                    </p>
                  </div>
                  <button
                    onClick={() => setModulesMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {allModules.map((m) => {
                    const Icon = m.icon;
                    const isActive = activeTab === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setActiveTab(m.id);
                          setModulesMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                          isActive
                            ? 'bg-blue-50/90 border-blue-300 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-blue-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {m.num > 0 ? `${m.num}. ` : ''}{m.name.replace(/^\d+\.\s*/, '')}
                            </span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                              {m.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Global Interactive Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search or jump to any module (e.g. coupons, tickets, refunds, audit)..."
              value={navSearch}
              onChange={(e) => {
                setNavSearch(e.target.value);
                setShowSearchSuggestions(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (navSearch.trim().length > 0) setShowSearchSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchFilteredModules.length > 0) {
                  setActiveTab(searchFilteredModules[0].id);
                  setShowSearchSuggestions(false);
                  setNavSearch('');
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />

            {/* Instant Search Suggestions Dropdown */}
            {showSearchSuggestions && (
              <div className="absolute left-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">
                  Matching Modules (Press Enter to open first)
                </div>
                {searchFilteredModules.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">No matching module found.</div>
                ) : (
                  searchFilteredModules.slice(0, 6).map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setActiveTab(m.id);
                          setShowSearchSuggestions(false);
                          setNavSearch('');
                        }}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-xs text-slate-800">{m.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{m.category}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Notifications Icon & Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setDropdownOpen(false);
                setModulesMenuOpen(false);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotif > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadNotif > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-slate-50 cursor-pointer ${
                        n.unread ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{n.desc}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setNotifOpen(false);
                setModulesMenuOpen(false);
              }}
              className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <img
                src="/anurag_founder.jpg"
                alt="Admin"
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Anurag Founder</p>
                  <p className="text-[10px] text-slate-500">anurag@apexservices.com</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('feature-flags');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Settings</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Quick-Pill Navigation Bar (Direct 1-Click Access to Every Tab) */}
      <div className="px-6 py-2 bg-slate-50/80 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1.5 whitespace-nowrap">
          Quick Jump:
        </span>
        {quickPillModules.map((pill) => {
          const isActive = activeTab === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveTab(pill.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {pill.name}
            </button>
          );
        })}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to end your administrator session?
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
