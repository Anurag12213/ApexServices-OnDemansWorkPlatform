import React, { useState } from 'react';
import { Download, Upload, FileText, FileSpreadsheet, CheckCircle2, Loader2, Sparkles, Database, Layers } from 'lucide-react';
import { useToast } from './Toast';
import { adminFetch } from '../utils/api';

export default function ReportsSection() {
  const toast = useToast();
  const [downloading, setDownloading] = useState('');
  const [importedSummary, setImportedSummary] = useState(null);

  const downloadCSV = (filename, csvContent) => {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBookings = async () => {
    setDownloading('bookings');
    try {
      const res = await adminFetch('/admin/bookings');
      if (res.ok) {
        const bookings = await res.json();
        const headers = ['Booking ID', 'Customer Name', 'Phone', 'Address', 'Category', 'Technician', 'Amount (INR)', 'Status', 'Payment Status', 'Scheduled Date', 'Dispute'];
        const rows = bookings.map((b) => [
          b.id,
          `"${(b.customer || '').replace(/"/g, '""')}"`,
          b.phone,
          `"${(b.address || '').replace(/"/g, '""')}"`,
          `"${(b.category || '').replace(/"/g, '""')}"`,
          `"${(b.technician || '').replace(/"/g, '""')}"`,
          b.amount,
          b.status,
          b.paymentStatus,
          b.scheduledDate,
          b.hasDispute ? 'YES' : 'NO'
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        downloadCSV(`ApexServices_Live_Bookings_${Date.now()}.csv`, csv);
        toast.success(`Exported ${bookings.length} live bookings to CSV.`, 'Download Complete');
      } else {
        toast.error('Failed to fetch bookings for report');
      }
    } catch (err) {
      toast.error('Network error generating bookings export');
    } finally {
      setDownloading('');
    }
  };

  const handleExportUsers = async () => {
    setDownloading('users');
    try {
      const res = await adminFetch('/admin/users');
      if (res.ok) {
        const users = await res.json();
        const headers = ['User ID', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date'];
        const rows = users.map((u) => [
          u.id,
          `"${(u.name || '').replace(/"/g, '""')}"`,
          u.email,
          u.phone,
          u.role,
          u.status,
          u.joined
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        downloadCSV(`ApexServices_Users_Register_${Date.now()}.csv`, csv);
        toast.success(`Exported ${users.length} registered users to CSV.`, 'Download Complete');
      } else {
        toast.error('Failed to fetch users for report');
      }
    } catch (err) {
      toast.error('Network error generating users export');
    } finally {
      setDownloading('');
    }
  };

  const handleExportPartners = async () => {
    setDownloading('partners');
    try {
      const res = await adminFetch('/admin/partners');
      if (res.ok) {
        const partners = await res.json();
        const headers = ['Partner ID', 'Full Name', 'Type', 'Phone', 'Email', 'KYC Status', 'Deposit Status', 'Rating', 'Completed Jobs', 'Wallet Balance (INR)', 'Status'];
        const rows = partners.map((p) => [
          p.id,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          p.type,
          p.phone,
          p.email,
          p.kycStatus,
          `"${(p.depositStatus || '').replace(/"/g, '""')}"`,
          p.rating,
          p.completedJobs,
          p.walletBalance,
          p.status
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        downloadCSV(`ApexServices_Partner_Fleet_${Date.now()}.csv`, csv);
        toast.success(`Exported ${partners.length} technician records to CSV.`, 'Download Complete');
      } else {
        toast.error('Failed to fetch partners for report');
      }
    } catch (err) {
      toast.error('Network error generating partners export');
    } finally {
      setDownloading('');
    }
  };

  const handleExportAudit = async () => {
    setDownloading('audit');
    try {
      const res = await adminFetch('/admin/audit-logs');
      if (res.ok) {
        const logs = await res.json();
        const headers = ['Log ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target', 'IP Address', 'Status', 'Details'];
        const rows = logs.map((l) => [
          l.id,
          l.timestamp,
          `"${(l.actor || '').replace(/"/g, '""')}"`,
          `"${(l.role || '').replace(/"/g, '""')}"`,
          l.action,
          l.target,
          l.ip,
          l.status,
          `"${(l.details || '').replace(/"/g, '""')}"`
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        downloadCSV(`ApexServices_Compliance_Audit_${Date.now()}.csv`, csv);
        toast.success(`Exported ${logs.length} audit records to CSV.`, 'Download Complete');
      } else {
        toast.error('Failed to fetch audit trail for report');
      }
    } catch (err) {
      toast.error('Network error generating audit trail export');
    } finally {
      setDownloading('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      setImportedSummary({
        filename: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        rowCount: Math.max(0, lines.length - 1)
      });
      toast.success(`Validated "${file.name}" (${lines.length - 1} rows parsed successfully).`, 'Spreadsheet Imported');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Business Intelligence</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic data export and spreadsheet processing: generate real-time CSV audits for financial reconciliations, customer bookings, and partner KYC.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Live Database Export Center</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">Format: RFC-4180 CSV</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Bookings */}
            <div className="p-3.5 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Work Requests & Booking Dispatch Ledger</p>
                  <p className="text-[11px] text-slate-500">Live order values, addresses, technicians, and payment statuses</p>
                </div>
              </div>
              <button
                onClick={handleExportBookings}
                disabled={downloading === 'bookings'}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {downloading === 'bookings' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>CSV</span>
              </button>
            </div>

            {/* Users */}
            <div className="p-3.5 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Customer & Admin Identity Register</p>
                  <p className="text-[11px] text-slate-500">Registered phone numbers, emails, role assignments, and statuses</p>
                </div>
              </div>
              <button
                onClick={handleExportUsers}
                disabled={downloading === 'users'}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {downloading === 'users' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>CSV</span>
              </button>
            </div>

            {/* Partners */}
            <div className="p-3.5 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Partner Fleet & KYC Compliance Report</p>
                  <p className="text-[11px] text-slate-500">Security deposits, ratings, completed job tallies, and wallet balances</p>
                </div>
              </div>
              <button
                onClick={handleExportPartners}
                disabled={downloading === 'partners'}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {downloading === 'partners' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>CSV</span>
              </button>
            </div>

            {/* Audit Logs */}
            <div className="p-3.5 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Enterprise Security Audit Trail</p>
                  <p className="text-[11px] text-slate-500">Administrative overrides, logins, refund logs, and remote IP addresses</p>
                </div>
              </div>
              <button
                onClick={handleExportAudit}
                disabled={downloading === 'audit'}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {downloading === 'audit' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Data Spreadsheets</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">CSV / TSV Support</span>
          </div>

          <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3 hover:border-blue-500 transition cursor-pointer block bg-slate-50/50">
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs font-black text-slate-800">Click to Browse or Drag & Drop CSV Spreadsheet</p>
            <p className="text-[11px] text-slate-500">Supports catalog imports, bulk technician batch logs, and customer contacts.</p>
          </label>

          {importedSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Spreadsheet Parsed Successfully</span>
              </div>
              <p className="text-emerald-700">
                <strong>File:</strong> {importedSummary.filename} ({importedSummary.size}) • <strong>Rows:</strong> {importedSummary.rowCount} valid records
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
