import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { enrichCategory } from '../data/servicesData';
import { ServiceCard } from './ServiceCard';
import { ArrowRight } from 'lucide-react';

export const CategoriesSection = () => {
  const { data, loading, setActivePage, handleInitiateRequestWork, siteBranding } = useData();

  const currencySymbol = data?.publicConfig?.currencySymbol || siteBranding?.currencySymbol || '₹';
  const rawCategories = data?.categories || [];

  const activeCategories = useMemo(() => {
    return rawCategories
      .filter((c) => !c.isSoftDeleted && c.active !== false)
      .map((c) => enrichCategory(c, currencySymbol));
  }, [rawCategories, currencySymbol]);

  const badge = siteBranding?.categoriesBadge || 'OUR SPECIALTIES';
  const heading = siteBranding?.categoriesHeading || 'Featured Service Categories';
  const subtitle = siteBranding?.categoriesSubtitle || 'From custom carpentry to emergency plumbing and electrical care.';

  const handleServiceSelect = (category, step = 2) => {
    const catName = typeof category === 'string' ? category : category?.name;
    handleInitiateRequestWork(catName, step);
  };

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

        {/* Categories Grid with Direct Booking Navigation */}
        {loading && activeCategories.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="w-full max-w-[360px] h-[410px] bg-slate-100 rounded-[24px] animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="bg-white border border-slate-200 text-slate-500 p-8 rounded-2xl text-center text-sm shadow-xs">
            No service categories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {activeCategories.map((cat) => (
              <ServiceCard
                key={cat.id || cat.slug}
                category={cat}
                onView={(c, step) => handleServiceSelect(c, step || 1)}
                onBook={(c, step) => handleServiceSelect(c, step || 2)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
