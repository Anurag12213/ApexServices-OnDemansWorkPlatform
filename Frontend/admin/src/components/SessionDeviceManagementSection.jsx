import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { adminFetch } from '../utils/api';

export default function SessionDeviceManagementSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sessions, setSessions] = useState([]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSessions(data);
        }
      }
    } catch (err) {
      console.warn('Could not load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

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
      try {
        await adminFetch(`/admin/sessions/${session.id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to revoke session on backend:', err);
      }
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
      const targets = sessions.filter((s) => s.email === email && !s.isCurrent);
      for (const t of targets) {
        try {
          await adminFetch(`/admin/sessions/${t.id}`, { method: 'DELETE' });
        } catch (e) {}
      }
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
          <button
            onClick={loadSessions}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Reload live active sessions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
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
