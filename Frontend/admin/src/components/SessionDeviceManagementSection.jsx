import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Globe,
  LogOut,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

export default function SessionDeviceManagementSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [sessions, setSessions] = useState([
    {
      id: 'SES-9901',
      user: 'Anurag Founder',
      email: 'anurag@apexservices.com',
      role: 'ADMIN',
      device: 'MacBook Pro 16" (macOS 15.1)',
      browser: 'Chrome 130.0',
      ip: '103.21.244.18',
      location: 'New Delhi, India',
      deviceType: 'DESKTOP',
      lastActive: 'Active Now',
      isCurrent: true,
      createdAt: 'Oct 31, 2026, 09:12 AM'
    },
    {
      id: 'SES-9902',
      user: 'Sarah Jenkins',
      email: 'sarah.jenkins@apexservices.com',
      role: 'ADMIN',
      device: 'ThinkPad X1 Carbon (Windows 11)',
      browser: 'Edge 129.0',
      ip: '49.36.18.22',
      location: 'Gurugram, India',
      deviceType: 'DESKTOP',
      lastActive: '8 mins ago',
      isCurrent: false,
      createdAt: 'Nov 01, 2026, 08:00 AM'
    },
    {
      id: 'SES-9903',
      user: 'Rajesh Sharma',
      email: 'rajesh.partner@apexservices.com',
      role: 'PARTNER',
      device: 'Samsung Galaxy S24 Ultra (Android 15)',
      browser: 'ApexServices Partner App v1.4.2',
      ip: '115.99.201.44',
      location: 'Noida, Sector 62',
      deviceType: 'MOBILE',
      lastActive: '2 mins ago (Live GPS Broadcast)',
      isCurrent: false,
      createdAt: 'Oct 29, 2026, 07:45 AM'
    },
    {
      id: 'SES-9904',
      user: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      role: 'CUSTOMER',
      device: 'iPhone 15 Pro (iOS 18.1)',
      browser: 'Mobile Safari',
      ip: '103.44.11.89',
      location: 'Bengaluru, India',
      deviceType: 'MOBILE',
      lastActive: '45 mins ago',
      isCurrent: false,
      createdAt: 'Nov 01, 2026, 11:30 AM'
    },
    {
      id: 'SES-9905',
      user: 'Suspicious Bot Account',
      email: 'crawler_check@tempmail.io',
      role: 'CUSTOMER',
      device: 'Headless Linux (Ubuntu 22.04)',
      browser: 'Python Requests / Scraper',
      ip: '185.220.101.5',
      location: 'Frankfurt, Germany (Tor Exit Node)',
      deviceType: 'DESKTOP',
      lastActive: '3 hours ago',
      isCurrent: false,
      createdAt: 'Nov 01, 2026, 04:10 AM'
    }
  ]);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ip.includes(searchTerm) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleForceLogout = async (session) => {
    if (session.isCurrent) {
      toast.warning('Cannot terminate your active administrative session from here.');
      return;
    }

    const confirmed = await confirm({
      title: `Terminate Session for ${session.user}?`,
      message: `Revokes OAuth token and force-logs out device "${session.device}" at ${session.ip}.`,
      confirmText: 'Revoke Access & Logout',
      variant: 'danger'
    });

    if (confirmed) {
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      toast.success(`Session for ${session.user} (${session.ip}) revoked immediately.`, 'Session Terminated');
    }
  };

  const handleRevokeAllUserSessions = async (email) => {
    const confirmed = await confirm({
      title: `Revoke All Active Sessions for ${email}?`,
      message: 'This user will be logged out of all web browsers and mobile apps globally.',
      confirmText: 'Revoke All Devices',
      variant: 'danger'
    });

    if (confirmed) {
      setSessions((prev) => prev.filter((s) => s.email !== email || s.isCurrent));
      toast.success(`All external sessions for ${email} terminated.`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 15 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Session & Device Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cross-platform security radar: monitor live device logins, geographic origins, IP addresses, and instantaneously terminate compromised sessions.
          </p>
        </div>

        {/* Security Overview Card */}
        <div className="flex items-center gap-3">
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Sessions</span>
            <span className="font-extrabold text-slate-900">{sessions.length} Live Logins</span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-red-200 text-xs shadow-xs">
            <span className="text-red-500 block text-[10px] font-bold uppercase">Tor / VPN Nodes</span>
            <span className="font-extrabold text-red-600">1 Detected</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search user, device, IP, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'ADMIN', 'PARTNER', 'CUSTOMER'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Active Sessions Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User & Role</th>
                <th className="py-3.5 px-4">Device & OS</th>
                <th className="py-3.5 px-4">Browser / App Client</th>
                <th className="py-3.5 px-4">IP Address & Origin</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{s.user}</span>
                      {s.isCurrent && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {s.email} • <span className="font-bold text-blue-600">{s.role}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {s.deviceType === 'MOBILE' ? (
                        <Smartphone className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Laptop className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-bold text-slate-800">{s.device}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{s.browser}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-900 font-bold">{s.ip}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {s.location}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-600 block">{s.lastActive}</span>
                    <span className="text-[10px] text-slate-400">{s.createdAt}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!s.isCurrent ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleForceLogout(s)}
                          className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                          title="Force Logout"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">This Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
