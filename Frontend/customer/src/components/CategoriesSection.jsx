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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.filter(c => !c.isSoftDeleted && c.active !== false).map((cat) => {
              const isDown = cat.isTemporaryDown;
              const serverImages = siteBranding?.categoryImages || data?.siteBranding?.categoryImages || data?.publicConfig?.categoryImages || {};
              const serverImg = serverImages[String(cat.id)] || serverImages[cat.name] || serverImages[cat.slug];
              const imageUrl = cat.bannerImageUrl || cat.imageUrl || serverImg || '';
              const hasImage = Boolean(imageUrl);

              return (
                <div
                  key={cat.id}
                  onClick={() => !isDown && handleInitiateRequestWork(cat.name)}
                  className={`bg-white rounded-[26px] border transition-all duration-300 shadow-sm flex flex-col justify-between overflow-hidden text-left group cursor-pointer ${
                    isDown
                      ? 'border-amber-200 bg-amber-50/20 opacity-80 cursor-not-allowed'
                      : 'border-slate-200/90 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div>
                    {/* Top Section: Category Image Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200">
                      {hasImage ? (
                        <img
                          src={imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-300 group-hover:text-blue-400 transition-colors bg-gradient-to-b from-slate-50 to-slate-100">
                          <CategoryIcon
                            icon={cat.icon}
                            iconName={cat.iconName}
                            iconValue={cat.icon?.iconValue || cat.iconValue}
                            className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-300"
                            imgClassName="w-16 h-16 object-contain opacity-40"
                          />
                        </div>
                      )}

                      {/* Gentle Wave SVG Curve seamlessly cutting into image */}
                      <div className="absolute -bottom-1 left-0 right-0 pointer-events-none text-white leading-none">
                        <svg
                          viewBox="0 0 400 38"
                          fill="currentColor"
                          preserveAspectRatio="none"
                          className="w-full h-7 block"
                        >
                          <path d="M0,0 C120,38 280,38 400,0 L400,38 L0,38 Z"></path>
                        </svg>
                      </div>

                      {/* Tag pill at top right if present */}
                      {cat.tag && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-xs border border-white/80">
                            {cat.tag}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Middle Section: Floating Icon + Content */}
                    <div className="px-5 pt-0 pb-2 relative">
                      {/* Floating Category Icon Badge */}
                      <div className="relative -mt-6 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center p-2.5 shadow-sm border transition-colors ${
                            isDown
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                          }`}
                        >
                          <CategoryIcon
                            icon={cat.icon}
                            iconName={cat.iconName}
                            iconValue={cat.icon?.iconValue || cat.iconValue}
                            className="w-5 h-5 transition-transform group-hover:scale-110"
                            imgClassName="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 font-normal">
                        {cat.description || 'Professional home repairs and maintenance solutions.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Footer with Circular Arrow */}
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100/80 mt-2">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                      {isDown ? 'Service Paused' : 'Request Service'}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isDown
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-1 shadow-xs'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
