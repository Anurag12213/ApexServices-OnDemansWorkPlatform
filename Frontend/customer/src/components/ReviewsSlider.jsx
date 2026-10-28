import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export const ReviewsSlider = () => {
  const { data, siteBranding } = useData();
  const reviews = data.reviews || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviewsBadge = siteBranding?.reviewsBadge || 'VERIFIED REVIEWS';
  const reviewsHeading = siteBranding?.reviewsHeading || 'What Our Customers Say';

  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const currentReview = reviews[currentIndex] || reviews[0];

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <section className="py-12 md:py-16 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            {reviewsBadge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {reviewsHeading}
          </h2>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl text-left shadow-xs">
          <div className="flex flex-col md:flex-row items-center gap-5">
            
            <img
              src={currentReview.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={currentReview.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />

            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-1">
                {[...Array(currentReview.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-slate-800 text-base italic leading-relaxed font-medium">
                "{currentReview.comment}"
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{currentReview.name}</span>
                  <span className="text-slate-500">{currentReview.role}</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                  {currentReview.serviceUsed} • {currentReview.date}
                </div>
              </div>

            </div>
          </div>

          {reviews.length > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <div className="flex space-x-1.5 items-center">
                {reviews.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx ? 'bg-[#ff3b47] w-6' : 'bg-slate-300 w-2 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={prevReview}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  title="Previous Review"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextReview}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  title="Next Review"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
