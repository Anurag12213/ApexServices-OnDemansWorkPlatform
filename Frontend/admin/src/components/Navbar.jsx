import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Menu,
  ShieldCheck,
  Settings,
  ExternalLink,
  CheckCircle2
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
  const [navSearch, setNavSearch] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const dropdownRef = useRef(null);

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

  const allModules = [
    { id: 'users', name: 'User Management' },
    { id: 'content', name: 'Content Management (CMS)' },
    { id: 'payments', name: 'Payments & Transactions' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'reports', name: 'Reports & Exports' },
    { id: 'roles', name: 'Roles & Permissions (RBAC)' },
    { id: 'bookings', name: 'Order / Booking Management' },
    { id: 'support', name: 'Support & Ticket Management' },
    { id: 'dashboard', name: 'Live Analytics Dashboard' },
    { id: 'audit', name: 'Audit Logs & Activity History' },
    { id: 'feature-flags', name: 'Feature Flags & App Configuration' },
    { id: 'coupons', name: 'Coupons & Discount Management' },
    { id: 'partners', name: 'Vendor / Partner Management' },
    { id: 'moderation', name: 'Content Moderation Tools' },
    { id: 'sessions', name: 'Session & Device Management' },
    { id: 'versions', name: 'Force-Update & App Version Control' },
    { id: 'categories', name: 'Service Catalog & Pricing' },
  ];

  const searchFilteredModules = allModules.filter((m) =>
    m.name.toLowerCase().includes(navSearch.toLowerCase())
  );

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Emergency Dispatch Alert', desc: 'New high-priority plumbing request logged.', time: '10 mins ago', unread: true },
    { id: 2, title: 'Technician KYC Submitted', desc: 'Partner PRT-102 uploaded documents for review.', time: '45 mins ago', unread: true },
    { id: 3, title: 'Escrow Settlement Cleared', desc: 'Payment of ₹1,499 held securely in escrow.', time: '2 hours ago', unread: true },
  ]);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Sidebar Toggle + Live Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search admin modules, tickets, users..."
              value={navSearch}
              onChange={(e) => {
                setNavSearch(e.target.value);
                setShowSearchSuggestions(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (navSearch.trim().length > 0) setShowSearchSuggestions(true);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 transition"
            />

            {showSearchSuggestions && (
              <div className="absolute left-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                {searchFilteredModules.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">No matching module found.</div>
                ) : (
                  searchFilteredModules.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setActiveTab(m.id);
                        setShowSearchSuggestions(false);
                        setNavSearch('');
                      }}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-800 flex items-center justify-between"
                    >
                      <span>{m.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions matching screenshot */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Green Online Status Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white font-bold text-xs rounded-full shadow-xs select-none">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Online</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setDropdownOpen(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3867FF]" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-left">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <button
                    onClick={() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 cursor-pointer">
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500">{n.desc}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill with Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <div
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 py-1 cursor-pointer border-l border-slate-200 hover:opacity-80 transition-opacity select-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center ring-2 ring-white shrink-0">
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                  <span>Anurag Founder</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </p>
                <p className="text-[10px] text-slate-400">
                  Master Admin
                </p>
              </div>
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900">Anurag Founder</p>
                  <p className="text-[11px] text-blue-600 font-semibold">Master Administrator</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveTab('roles');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Roles & Permissions</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveTab('feature-flags');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>App Configuration</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
