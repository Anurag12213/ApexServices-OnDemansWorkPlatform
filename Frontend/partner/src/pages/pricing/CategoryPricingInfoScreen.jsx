import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { Tag, Check, X, ShieldAlert, Clock, Info, ShieldCheck } from 'lucide-react';

export const CategoryPricingInfoScreen = () => {
  const { categories } = usePartner();
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id || 'cat-1');

  const activeCategory = categories.find((c) => c.id === selectedCat) || categories[0];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Standard Service Rate Schedule
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
          <Tag className="w-6 h-6 text-[#3867FF] shrink-0" />
          <span>Authoritative Fixed Service Pricing</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Admin-enforced standard category rates. Arbitrary labor pricing or unauthorized price manipulation is strictly prohibited.
        </p>
      </div>

      {/* Strict Policy Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">No Free-Form Labor Markup:</span>
          <p className="text-amber-800 leading-relaxed">
            Customers confirm bookings based on these fixed standard service fees. Partners cannot add arbitrary labor fees or diagnostic markups. Out-of-scope requirements must be handled through formal platform category amendments.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 text-xs no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedCat === cat.id
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              selectedCat === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              ₹{cat.fixedFee}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Category Details Card */}
      {activeCategory && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3867FF]">
                Category Specifications
              </span>
              <h2 className="text-2xl font-black text-slate-900">{activeCategory.name}</h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Standard Work Duration: <strong>{activeCategory.duration}</strong></span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-right w-full sm:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Standard Fixed Customer Fee
              </span>
              <div className="text-3xl font-black text-slate-900">
                <CurrencyDisplay amount={activeCategory.fixedFee} />
              </div>
              <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                Partner 80% Net Share: <CurrencyDisplay amount={Math.round(activeCategory.fixedFee * 0.8)} />
              </p>
            </div>
          </div>

          {/* Inclusions & Exclusions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inclusions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Included in Standard Fixed Fee</span>
              </h3>
              <div className="space-y-2">
                {(activeCategory.included || []).map((inc, i) => (
                  <div key={i} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-slate-700 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <X className="w-4 h-4 text-rose-600" />
                <span>Exclusions (Billable Separately / Outside Market)</span>
              </h3>
              <div className="space-y-2">
                {(activeCategory.exclusions || []).map((exc, i) => (
                  <div key={i} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-slate-700 flex items-start gap-2">
                    <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnostic Inspection Fee rule */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800">Inspection & Cancellation Policy:</span>
            <p>
              If the visit is conducted but customer cancels upon arrival prior to physical work commencing, standard diagnostic inspection fee of{' '}
              <strong className="text-slate-900 font-bold">₹{activeCategory.diagnosisFee}</strong> applies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
