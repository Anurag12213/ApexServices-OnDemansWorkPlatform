import React from 'react';
import { Sliders, UserCheck, LayoutGrid, MessageSquare, Bell, ArrowUpRight } from 'lucide-react';

export const DashboardOverview = ({ data, setActiveTab }) => {
  const stats = [
    { label: 'Hero Banner Sliders', count: data.heroSlides?.length || 0, tab: 'sliders', icon: Sliders, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Service Categories', count: data.categories?.length || 0, tab: 'categories', icon: LayoutGrid, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'Customer Reviews', count: data.reviews?.length || 0, tab: 'reviews', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'AI Owner Profile', count: 1, tab: 'owner', icon: UserCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(s.tab)}
              className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:border-slate-300 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">{s.label}</span>
                <p className="text-3xl font-extrabold text-slate-900">{s.count}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Status Box */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900">Current AI Owner Speech Target Text</h3>
        <p className="text-xs text-slate-500">
          This is the customizable text the AI owner image indicates toward on the main customer home page.
        </p>
        <div className="bg-slate-50 border-l-4 border-blue-600 p-4 rounded text-slate-800 text-sm italic font-medium">
          "{data.aiOwnerSection?.indicatedText || 'No text set'}"
        </div>
        <button
          onClick={() => setActiveTab('owner')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          <span>Edit AI Owner Profile & Speech Text</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
