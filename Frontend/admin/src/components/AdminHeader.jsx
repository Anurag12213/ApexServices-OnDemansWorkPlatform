import React from 'react';
import { RefreshCw, Server, CheckCircle } from 'lucide-react';

export const AdminHeader = ({ title, onRefresh, loading }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500 font-medium">Standalone Enterprise Administration Console</p>
      </div>

      <div className="flex items-center space-x-4">
        {/* API Status Badge */}
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded text-xs font-semibold">
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span>Spring Boot REST API Connected (Port 8080)</span>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          title="Refresh Data from Spring Boot REST API"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
