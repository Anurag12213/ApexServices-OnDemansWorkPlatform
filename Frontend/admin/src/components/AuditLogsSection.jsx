import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Shield,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useToast } from './Toast';

export default function AuditLogsSection() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'AUD-8801',
      actor: 'Anurag Founder',
      role: 'Super Administrator',
      action: 'FEATURE_FLAG_TOGGLED',
      details: 'Enabled dynamic surge pricing during peak evening slots.',
      target: 'CONFIG:surge_pricing',
      ip: '103.21.244.18',
      status: 'SUCCESS',
      timestamp: '10 mins ago',
      category: 'GOVERNANCE'
    },
    {
      id: 'AUD-8802',
      actor: 'Megha Nair',
      role: 'Finance Officer',
      action: 'REFUND_AUTHORIZED',
      details: 'Issued full refund ₹599 to customer Deepa Krishnan (Duplicate UPI charge).',
      target: 'ORDER:ORD-8941',
      ip: '14.139.122.9',
      status: 'SUCCESS',
      timestamp: '45 mins ago',
      category: 'FINANCE'
    },
    {
      id: 'AUD-8803',
      actor: 'Rohit Deshmukh',
      role: 'Operations Manager',
      action: 'PARTNER_KYC_APPROVED',
      details: 'Verified Police Clearance Certificate & Aadhaar for PRT-104 (Ramesh Patel).',
      target: 'PARTNER:PRT-104',
      ip: '49.36.18.22',
      status: 'SUCCESS',
      timestamp: '2 hours ago',
      category: 'PARTNERS'
    },
    {
      id: 'AUD-8804',
      actor: 'Sarah Jenkins',
      role: 'Super Administrator',
      action: 'USER_SUSPENDED',
      details: 'Suspended fraudulent account attempting repeated chargebacks.',
      target: 'USER:USR-912',
      ip: '103.21.244.18',
      status: 'WARNING',
      timestamp: 'Yesterday 04:30 PM',
      category: 'SECURITY'
    },
    {
      id: 'AUD-8805',
      actor: 'Content Specialist',
      role: 'Content Editor',
      action: 'CMS_BANNER_PUBLISHED',
      details: 'Updated Diwali Festival promotional headline and 20% discount marquee.',
      target: 'CMS:hero_banner',
      ip: '115.99.201.44',
      status: 'SUCCESS',
      timestamp: 'Oct 30, 2026',
      category: 'CONTENT'
    },
    {
      id: 'AUD-8806',
      actor: 'SYSTEM_DAEMON',
      role: 'System Automated Job',
      action: 'AUTO_DISPATCH_TIMEOUT',
      details: 'Order #ORD-9022 exceeded 45s broadcast timeout without acceptance. Retried radius 15km.',
      target: 'ORDER:ORD-9022',
      ip: '127.0.0.1',
      status: 'INFO',
      timestamp: 'Oct 30, 2026',
      category: 'OPERATIONS'
    }
  ]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target', 'IP Address', 'Status', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.actor,
      l.role,
      l.action,
      l.target,
      l.ip,
      l.status,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apexservices_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Audit trail exported as CSV file.', 'Audit Export Ready');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">SUCCESS</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">WARNING</span>;
      case 'INFO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">SYSTEM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 10 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs & Activity History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system-wide compliance audit trail tracking administrative mutations, financial refunds, configuration changes, and IP addresses.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actor, action, IP, target ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'GOVERNANCE', 'FINANCE', 'PARTNERS', 'SECURITY', 'CONTENT', 'OPERATIONS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Event & Timestamp</th>
                <th className="py-3.5 px-4">Admin Actor</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Event Description</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No audit records matching search and category filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-900 font-bold">{log.id}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {log.timestamp}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.actor}</div>
                      <div className="text-[10px] text-slate-400">{log.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.ip}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getStatusBadge(log.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
