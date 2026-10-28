import React from 'react';
import { useData } from '../context/DataContext';
import { ArrowRight, Briefcase } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

export const CategoriesSection = () => {
  const { data, setActivePage, handleInitiateRequestWork, siteBranding } = useData();
  const categories = data.categories || [];
  const badge = siteBranding?.categoriesBadge || 'OUR SPECIALTIES';
  const heading = siteBranding?.categoriesHeading || 'Featured Service Categories';
  const subtitle = siteBranding?.categoriesSubtitle || 'From custom carpentry to emergency plumbing and electrical care.';

  return (
    <section className="py-12 md:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 text-left">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              {badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {heading}
            </h2>
            <p className="text-slate-600 mt-1 text-sm max-w-xl">
              {subtitle}
            </p>
          </div>

          <button
            onClick={() => setActivePage('services')}
            className="mt-3 md:mt-0 inline-flex items-center space-x-1.5 text-slate-900 hover:text-blue-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>View All Services</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>

        {/* Categories Grid */}
        {categories.filter(c => !c.isSoftDeleted && c.active !== false).length === 0 ? (
          <div className="bg-white border border-slate-200 text-slate-500 p-8 rounded-2xl text-center text-sm shadow-xs">
            No service categories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(c => !c.isSoftDeleted && c.active !== false).map((cat) => {
              const isDown = cat.isTemporaryDown;
              return (
                <div
                  key={cat.id}
                  className={`bg-white border p-6 rounded-2xl transition-all shadow-xs flex flex-col justify-between text-left group ${
                    isDown ? 'border-amber-200 bg-amber-50/20 opacity-80' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-2 transition-colors ${
                        isDown ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-50 border border-blue-200 text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                      }`}>
                        <CategoryIcon
                          icon={cat.icon}
                          iconName={cat.iconName}
                          iconValue={cat.icon?.iconValue || cat.iconValue}
                          className="w-5 h-5"
                          imgClassName="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isDown && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                            Temporarily Paused
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                      {cat.description}
                    </p>
                  </div>

                  <button
                    disabled={isDown}
                    onClick={() => !isDown && handleInitiateRequestWork(cat.name)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
                      isDown
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-800 border border-slate-200 hover:border-blue-600 group-hover:border-blue-200 shadow-xs cursor-pointer'
                    }`}
                  >
                    <span>{isDown ? 'Service Paused for Maintenance' : 'Request Service'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
