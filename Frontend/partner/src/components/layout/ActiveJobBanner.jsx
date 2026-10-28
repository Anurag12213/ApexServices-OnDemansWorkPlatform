import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Wrench, ArrowRight, MapPin } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const ActiveJobBanner = () => {
  const { activeJob, setActiveTab } = usePartner();

  if (!activeJob) return null;

  return (
    <div className="bg-gradient-to-r from-[#172033] to-[#1E293B] text-white shadow-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-bold text-white whitespace-nowrap">Active Assignment:</span>
            <span className="text-blue-200 font-medium whitespace-nowrap">{activeJob.category}</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 truncate max-w-[180px] sm:max-w-xs md:max-w-md">{activeJob.title}</span>
          </div>
          <StatusBadge status={activeJob.status} size="sm" />
        </div>

        <button
          onClick={() => setActiveTab('jobs')}
          className="w-full sm:w-auto px-4 py-1.5 bg-[#3867FF] hover:bg-blue-600 rounded-full font-bold text-white flex items-center justify-center gap-1.5 transition-colors text-xs shrink-0 self-stretch sm:self-auto"
        >
          <span>Open Execution Flow</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
