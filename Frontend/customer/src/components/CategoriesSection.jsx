import React, { useMemo, useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { enrichCategory } from '../data/servicesData';
import { CategoryIcon } from './CategoryIcon';
import { CategoryDetailModal } from './CategoryDetailModal';
import { ArrowRight, ArrowUpRight, Star } from 'lucide-react';

// Cloudinary automatic format and resolution optimization helper
const optimizeImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto')) {
      return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`);
    }
  }
  return url;
};

// Polished card skeleton loader matching exact dimensions to eliminate CLS
const CategoryCardSkeleton = () => (
  <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs h-80 flex flex-col justify-end animate-pulse relative">
    <div className="absolute inset-0 bg-slate-200" />
    <div className="relative z-10 p-5 space-y-3 bg-gradient-to-t from-slate-950/80 via-slate-950/50 to-transparent">
      <div className="h-5 bg-slate-300 rounded-md w-3/5" />
      <div className="h-3 bg-slate-400 rounded-md w-2/5" />
      <div className="h-3 bg-slate-400 rounded-md w-4/5" />
    </div>
  </div>
);

// Dynamic Category Card with Hover Zoom and Ambient Scrim
const CategoryCard = React.memo(({ category, onSelect, onBookNow }) => {
  const [imageError, setImageError] = useState(false);
  const isDown = category.isTemporaryDown;

  const rawUrl = category.imageUrl || category.bannerImageUrl || '';
  const imageUrl = optimizeImageUrl(rawUrl, 800);
  const fallbackUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
  const displayImage = !imageError && imageUrl ? imageUrl : fallbackUrl;

  const isEmergency =
    (category.badge && category.badge.includes('EMERGENCY')) ||
    (category.tags && category.tags.includes('emergency'));

  return (
    <div
      onClick={() => onSelect(category)}
      className={`group relative bg-slate-950 rounded-3xl overflow-hidden shadow-xs hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer h-80 flex flex-col justify-end border ${
        isDown
          ? 'border-amber-300 opacity-80'
          : 'border-slate-800/40 hover:border-blue-500'
      }`}
    >
      {/* Background Image with Dynamic Binding and Smooth Scale */}
      <img
        src={displayImage}
        alt={category.name}
        loading="lazy"
        decoding="async"
        onError={() => setImageError(true)}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-108 group-hover:opacity-85 opacity-75"
      />

      {/* Dark Ambient Gradient Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent transition-opacity group-hover:from-slate-950/90" />

      {/* Top Section: Badges & Circular Action Arrow */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        {category.badge ? (
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${
              isEmergency
                ? 'bg-rose-500/90 text-white border-rose-400/40'
                : 'bg-amber-500/95 text-slate-950 border-amber-300 font-extrabold'
            }`}
          >
            {isEmergency ? '⚡ ' : '🔥 '}
            {category.badge}
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          aria-label={`View ${category.name} details`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(category);
          }}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-blue-600 backdrop-blur-md flex items-center justify-center text-white text-xs border border-white/25 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:scale-110 transition-all shadow-sm cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content Overlay */}
      <div className="relative z-10 p-5 text-white text-left">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/90 backdrop-blur-md flex items-center justify-center text-white shrink-0 p-1.5 shadow-xs border border-blue-400/30">
            <CategoryIcon
              icon={category.icon}
              iconName={category.iconName}
              iconValue={category.icon?.iconValue || category.iconValue}
              className="w-4 h-4 text-white"
              imgClassName="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-blue-200 transition-colors drop-shadow-xs truncate">
            {category.name}
          </h3>
        </div>

        {/* Rating and Starting Rate Metrics */}
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-2">
          <span className="flex items-center gap-1 text-amber-300">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>{category.rating}</span>
            <span className="text-slate-400 font-normal">({category.reviewCount})</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">From {category.startingPrice}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 text-[11px]">{category.serviceCount} services</span>
        </div>

        {/* Subservices Dynamic Preview Chips */}
        <p className="text-xs text-slate-300/90 line-clamp-1 font-normal">
          {(category.subservices || []).map((s) => s.name).slice(0, 3).join(' • ')}...
        </p>

        {/* Action Link Footer */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 group-hover:text-blue-300 transition-colors">
            {isDown ? 'Temporarily Paused' : 'View Scope & Book'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBookNow(category.name);
            }}
            className="text-[11px] font-bold uppercase tracking-wider text-white hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});
CategoryCard.displayName = 'CategoryCard';

export const CategoriesSection = () => {
  const { data, loading, setActivePage, handleInitiateRequestWork, siteBranding } = useData();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = useCallback((category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleBookFromModal = useCallback(
    (category) => {
      setIsModalOpen(false);
      handleInitiateRequestWork(category.name);
    },
    [handleInitiateRequestWork]
  );

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

        {/* Categories Grid or Skeleton State */}
        {loading && activeCategories.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="bg-white border border-slate-200 text-slate-500 p-8 rounded-2xl text-center text-sm shadow-xs">
            No service categories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeCategories.map((cat) => (
              <CategoryCard
                key={cat.id || cat.slug}
                category={cat}
                onSelect={handleOpenModal}
                onBookNow={handleInitiateRequestWork}
              />
            ))}
          </div>
        )}

        {/* Dynamic Detail Modal */}
        <CategoryDetailModal
          category={selectedCategory}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onBook={handleBookFromModal}
        />
      </div>
    </section>
  );
};

export default CategoriesSection;
