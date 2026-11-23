import React, { useEffect } from 'react';
import { X, CheckCircle2, Zap, ArrowRight, Star, ShieldCheck, Clock } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

/**
 * Dynamic Category Detail & Booking Modal
 * Displays category overview, active pros, rating, itemized subservices with transparent prices,
 * and a direct booking dispatch CTA.
 */
export const CategoryDetailModal = ({ category, isOpen, onClose, onBook }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !category) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-left border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50/30 to-white">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-md bg-blue-600 shrink-0 p-3">
              <CategoryIcon
                icon={category.icon}
                iconName={category.iconName}
                iconValue={category.icon?.iconValue || category.iconValue}
                className="w-7 h-7 text-white"
                imgClassName="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {category.name}
                </h3>
                {category.badge && (
                  <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    {category.badge}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{category.rating || 4.8}</span>
                  <span className="text-slate-400 font-normal">({category.reviewCount || 950})</span>
                </span>
                <span className="text-slate-500 font-medium text-[11px] sm:text-xs">
                  {category.activePros || 80}+ Certified Experts
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Service Overview */}
          <div>
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Service Scope & Standards
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {category.description || 'Certified master technicians for premium residential maintenance and repairs.'}
            </p>
          </div>

          {/* Dynamic Subservices List with Live Prices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Services Included ({category.subservices?.length || 0})
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">Upfront Transparent Rates</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(category.subservices || []).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{sub.name}</span>
                  </div>
                  <span className="font-extrabold text-blue-600 shrink-0">{sub.startingPrice}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upfront Pricing Card */}
          <div className="bg-blue-50/70 rounded-2xl p-4 sm:p-4.5 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] text-blue-700 font-bold uppercase tracking-wider block">
                Base Inspection Rate
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {category.startingPrice || '₹299'}{' '}
                <span className="text-xs font-normal text-slate-500">/ service visit</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>Priority Arrival</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block">
                Guaranteed response window
              </span>
            </div>
          </div>

          {/* Apex Quality Assurance Checklist */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-slate-600 font-semibold border-t border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Insured & Certified Pros</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>30-Day Service Guarantee</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => onBook(category)}
            className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all text-center cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Book {category.name} Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all text-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
