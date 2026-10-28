import React, { useState } from 'react';
import { Download, Upload, FileText, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function ReportsSection() {
  const [downloadMsg, setDownloadMsg] = useState('');

  const reports = [
    {
      name: 'Q3 Financial & Service Revenue Report',
      format: 'PDF',
      size: '2.4 MB',
      date: 'Oct 01, 2026',
      icon: FileText,
      color: 'text-red-600 bg-red-50',
    },
    {
      name: 'Customer Request & Booking Audit',
      format: 'CSV / Excel',
      size: '1.8 MB',
      date: 'Oct 05, 2026',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      name: 'Technician Dispatch & Review Log',
      format: 'CSV / Excel',
      size: '4.1 MB',
      date: 'Oct 08, 2026',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  const handleDownload = (name) => {
    setDownloadMsg(`Downloading ${name}...`);
    setTimeout(() => setDownloadMsg(''), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Business Intelligence</h1>
          <p className="text-sm text-slate-500">Export financial summaries, import service spreadsheets, and download audit logs</p>
        </div>

        {downloadMsg && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> {downloadMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Download className="w-5 h-5 mr-2 text-blue-600" /> Export Business Reports
          </h2>
          <p className="text-xs text-slate-500">Generate instantly downloadable PDF or CSV financial and customer service reports.</p>

          <div className="space-y-3 pt-2">
            {reports.map((report, idx) => {
              const Icon = report.icon;
              return (
                <div key={idx} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${report.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{report.name}</p>
                      <p className="text-[11px] text-slate-400">{report.format} • {report.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(report.name)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-indigo-600" /> Import Data Spreadsheets
          </h2>
          <p className="text-xs text-slate-500">Bulk upload technician logs, customer inquiries, or inventory catalog in CSV / XLSX.</p>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 hover:border-blue-400 transition cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Drag & Drop CSV / Excel File Here</p>
            <p className="text-[11px] text-slate-400">or click to browse local files (max 25MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
