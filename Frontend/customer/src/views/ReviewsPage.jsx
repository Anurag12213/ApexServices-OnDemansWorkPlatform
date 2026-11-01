import React from 'react';
import { ReviewsSlider } from '../components/ReviewsSlider';
import { useData } from '../context/DataContext';
import { Star, CheckCircle2, Award, ArrowRight } from 'lucide-react';

export const ReviewsPage = () => {
  const { data, handleInitiateRequestWork } = useData();
  const reviews = data.reviews || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-left">
      
      {/* 1. Header Banner */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Verified Feedback
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Real Experiences From Real Homeowners
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every review listed here represents an authenticated home service completed by an Apex certified technician. Read unfiltered feedback from our neighborhood clients.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-black text-slate-900 text-sm sm:text-base">4.9 out of 5.0</span>
              <span className="text-xs text-slate-500 font-medium">Based on 1,400+ customer reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Reviews Slider Component */}
      <ReviewsSlider />

      {/* 3. All Verified Testimonials Wall */}
      <section className="py-8 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complete Testimonials Catalog
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Browse authentic feedback across all specialized trade categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl space-y-4 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {rev.date || 'Recent'}
                  </span>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed italic font-medium">
                  "{rev.comment}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <img
                  src={rev.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    <span>{rev.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </h4>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    {rev.serviceUsed || rev.role || 'Verified Customer'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Bottom Booking CTA */}
      <section className="bg-[#0A2540] text-white py-10 sm:py-12 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">Experience the Apex Standard in your own home</h3>
            <p className="text-slate-300 text-xs">Join thousands of satisfied homeowners with guaranteed satisfaction.</p>
          </div>
          <button
            onClick={() => handleInitiateRequestWork()}
            className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Book A Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
};
