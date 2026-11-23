import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { enrichCategory } from '../data/servicesData';
import { CategoryIcon } from '../components/CategoryIcon';
import { CategoryDetailModal } from '../components/CategoryDetailModal';
import {
  Search,
  X,
  Star,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

/**
 * Cloudinary & asset URL optimization helper
 */
const optimizeImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto')) {
      return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`);
    }
  }
  return url;
};

/**
 * Animated Category Card Skeleton Loader (Eliminates CLS)
 */
const CategorySkeletonCard = () => (
  <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs h-80 flex flex-col justify-end animate-pulse relative">
    <div className="absolute inset-0 bg-slate-200" />
    <div className="relative z-10 p-5 space-y-3 bg-gradient-to-t from-slate-950/80 via-slate-950/50 to-transparent">
      <div className="h-5 bg-slate-300 rounded-md w-3/5" />
      <div className="h-3 bg-slate-400 rounded-md w-2/5" />
      <div className="h-3 bg-slate-400 rounded-md w-4/5" />
    </div>
  </div>
);

/**
 * Dynamic Category Card with Hover Zoom, Dark Gradient Scrim, and Live Metrics
 */
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

      {/* Dark Ambient Gradient Scrim for High-Contrast Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent transition-opacity group-hover:from-slate-950/90" />

      {/* Top Section: Dynamic Badges & Action Arrow */}
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

        {/* Direct Booking Link on Card Hover */}
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

/**
 * Modern Dynamic Services Page Component
 */
export const ServicesPage = () => {
  const { data, loading, handleInitiateRequestWork, siteBranding } = useData();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Modal State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currencySymbol = data?.publicConfig?.currencySymbol || siteBranding?.currencySymbol || '₹';
  const supportPhone = siteBranding?.supportPhone || data?.publicConfig?.supportPhone || '+91 1800 200 4567';

  // Extract raw categories from DataContext and enrich with data schema
  const rawCategories = data?.categories || [];
  const enrichedCategories = useMemo(() => {
    return rawCategories
      .filter((c) => !c.isSoftDeleted && c.active !== false)
      .map((c) => enrichCategory(c, currencySymbol));
  }, [rawCategories, currencySymbol]);

  // Reactive Real-Time Search, Filter & Sort Engine
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return enrichedCategories
      .filter((cat) => {
        // Search Matching (Category name, description, or any subservice name)
        const matchesSearch =
          !query ||
          cat.name.toLowerCase().includes(query) ||
          (cat.description && cat.description.toLowerCase().includes(query)) ||
          (Array.isArray(cat.subservices) &&
            cat.subservices.some((sub) => sub.name.toLowerCase().includes(query)));

        if (!matchesSearch) return false;

        // Tag Filter Matching
        if (selectedFilterTag === 'popular') {
          return (
            (cat.tags && cat.tags.includes('popular')) ||
            (cat.badge && cat.badge.toLowerCase().includes('popular'))
          );
        }
        if (selectedFilterTag === 'emergency') {
          return (
            (cat.tags && cat.tags.includes('emergency')) ||
            (cat.badge && cat.badge.toLowerCase().includes('emergency')) ||
            (cat.tag && cat.tag.toLowerCase().includes('24/7'))
          );
        }
        if (selectedFilterTag === 'top_rated') {
          return (cat.rating || 0) >= 4.85;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') {
          const numA = parseInt(String(a.startingPrice).replace(/[^0-9]/g, '') || '0', 10);
          const numB = parseInt(String(b.startingPrice).replace(/[^0-9]/g, '') || '0', 10);
          return numA - numB;
        }
        return 0; // Default order
      });
  }, [enrichedCategories, searchQuery, selectedFilterTag, sortBy]);

  // Modal Handlers
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedFilterTag('all');
    setSortBy('default');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-left flex flex-col">
      {/* 1. Top Search & Filter Bar (Clean & Compact) */}
      <section className="bg-white border-b border-slate-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-4 text-center">
            {/* Real-time Search Input */}
            <div className="relative flex items-center shadow-md shadow-slate-200/60 rounded-2xl bg-white border border-slate-200 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <Search className="w-5 h-5 absolute left-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by trade, problem (e.g. Leak, Wiring, Furniture)..."
                className="w-full pl-12 pr-11 py-3.5 bg-transparent rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Interactive Filter Pills */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'popular', label: '🔥 Popular' },
                { id: 'emergency', label: '⚡ 24/7 Service' },
                { id: 'top_rated', label: '⭐ Top Rated' },
              ].map((pill) => {
                const active = selectedFilterTag === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSelectedFilterTag(pill.id)}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 shadow-xs'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Catalog Grid & Controls */}
      <section className="py-10 sm:py-14 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
        {/* Results Counter & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Available Trades</h2>
            <span className="text-xs font-extrabold px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full">
              {loading && enrichedCategories.length === 0
                ? 'Loading...'
                : `${filteredCategories.length} Categories`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xs:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="default">Featured</option>
              <option value="rating">Top Rated (High to Low)</option>
              <option value="name">Alphabetical (A - Z)</option>
              <option value="price_asc">Starting Rate (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Categories Grid or Skeletons / Empty State */}
        {loading && enrichedCategories.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CategorySkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          /* Empty Search Results State */
          <div className="bg-white border border-slate-200 text-center p-10 sm:p-14 rounded-3xl shadow-xs max-w-md mx-auto my-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No categories found matching your query</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              We couldn't find any service matching "{searchQuery}". Try adjusting your keywords or clearing the filter pills.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        ) : (
          /* Active Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id || category.slug}
                category={category}
                onSelect={handleOpenModal}
                onBookNow={handleInitiateRequestWork}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Service Quality Assurance Grid */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              The Apex Standard
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Why Homeowners Trust Our Professionals
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 text-left shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Background Checked & Certified</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Every trade partner undergoes identity authentication, criminal background verification, and vocational skill assessment.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 text-left shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Punctual & Rapid Response</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                We respect your busy routine with guaranteed arrival windows and emergency dispatch across all major service zones.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 text-left shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">30-Day Service Guarantee</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                If our craftsmanship or repair fails to satisfy your standards, we return to rectify the work free of charge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Support CTA */}
      <section className="py-10 sm:py-12 bg-[#0A2540] text-white border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-base sm:text-lg font-black tracking-tight">Need assistance with a custom project or large renovation?</h4>
            <p className="text-slate-300 text-xs mt-0.5">Speak with our senior project estimator today for personalized assessment.</p>
          </div>
          <a
            href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto justify-center bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <span>{supportPhone}</span>
          </a>
        </div>
      </section>

      {/* 5. Dynamic Detail Modal */}
      <CategoryDetailModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBook={handleBookFromModal}
      />
    </div>
  );
};

export default ServicesPage;
