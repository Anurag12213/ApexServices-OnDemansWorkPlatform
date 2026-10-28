import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Menu,
  PanelLeftClose,
  UserPlus,
  ShoppingBag,
  Database,
} from 'lucide-react';

export default function Navbar({ setActiveTab, sidebarCollapsed, setSidebarCollapsed, adminUser, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(3);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '3 New Service Inquiries',
      desc: 'David and 2 other homeowners requested custom carpentry.',
      time: '10 mins ago',
      icon: UserPlus,
      color: 'text-blue-600 bg-blue-50',
      unread: true,
    },
    {
      id: 2,
      title: 'Order #ORD-7812 Completed',
      desc: 'Emergency plumbing payment of $240.00 cleared.',
      time: '45 mins ago',
      icon: ShoppingBag,
      color: 'text-emerald-600 bg-emerald-50',
      unread: true,
    },
    {
      id: 3,
      title: 'Spring Boot REST Sync',
      desc: 'H2 database auto-seeded and sync operational.',
      time: '2 hours ago',
      icon: Database,
      color: 'text-blue-600 bg-blue-50',
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 relative z-40 text-left">
      {/* Toast Logout Notification */}
      {isLoggedOut && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center space-x-2 z-50">
          <LogOut className="w-4 h-4 text-blue-400" />
          <span>Successfully logged out. Redirecting...</span>
        </div>
      )}

      {/* Left: Sidebar Toggle Button & Search Input */}
      <div className="flex items-center space-x-4 w-full max-w-md">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition focus:outline-none"
        >
          {sidebarCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search data, users, orders, services..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition relative"
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
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className={`p-3 flex items-start space-x-3 hover:bg-slate-50 cursor-pointer ${
                        n.unread ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${n.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{n.desc}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
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
            }}
            className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="Admin"
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Sarah Jenkins</p>
                <p className="text-[10px] text-slate-500">sarah@apexservices.com</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>System Settings</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to end your current administrator session?
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg text-xs"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-xs"
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
