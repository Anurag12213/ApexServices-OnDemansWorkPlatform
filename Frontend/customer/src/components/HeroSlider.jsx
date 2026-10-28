import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const HeroSlider = () => {
  const { data, handleInitiateRequestWork, siteBranding } = useData();
  const slides = data.heroSlides || [];
  const brandDotColor = siteBranding?.brandDotColor || '#ff3b47';
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative bg-slate-50 overflow-hidden border-b border-slate-200">
      
      {/* Slider Left Arrow Control (Hidden on small mobile to avoid text overlapping) */}
      {slides.length > 1 && (
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md items-center justify-center transition-colors border border-slate-200 cursor-pointer"
          title="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Slider Right Arrow Control (Hidden on small mobile to avoid text overlapping) */}
      {slides.length > 1 && (
        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md items-center justify-center transition-colors border border-slate-200 cursor-pointer"
          title="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px] py-8 sm:py-12 md:py-16">
          
          {/* Left Column: Coral Tag, Big Black Title, Paragraph, Solid Red Button */}
          <div className="lg:col-span-6 text-left space-y-4 sm:space-y-6 z-10 pl-0 lg:pl-6">
            
            {/* Coral Accent Line + Category Badge */}
            <div className="flex items-center space-x-3">
              <span className="w-8 h-0.5" style={{ backgroundColor: brandDotColor }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandDotColor }}>
                {currentSlide.badge || 'COMMITTED TO SUCCESS'}
              </span>
            </div>

            {/* Big Bold Headline matching reference image */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight break-words">
              {currentSlide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              {currentSlide.subtitle}
            </p>

            {/* Solid Coral Red CTA Button responsive on small screens */}
            <div className="pt-2">
              <button
                onClick={() => handleInitiateRequestWork()}
                className="w-full sm:w-auto text-center font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center hover:opacity-90"
                style={{ backgroundColor: brandDotColor }}
              >
                {currentSlide.buttonText || 'OUR SERVICES'}
              </button>
            </div>

          </div>

          {/* Right Column: Full-Height Image matching reference image */}
          <div className="lg:col-span-6 relative flex justify-end">
            <div className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src={currentSlide.imageUrl || '/ai_owner.jpg'}
                alt={currentSlide.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="flex justify-center space-x-2 pb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx ? 'w-6' : 'bg-slate-300 w-2'
              }`}
              style={currentIndex === idx ? { backgroundColor: brandDotColor } : {}}
            />
          ))}
        </div>
      )}

    </section>
  );
};
