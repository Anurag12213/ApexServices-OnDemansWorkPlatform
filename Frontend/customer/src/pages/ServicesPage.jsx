import React from 'react';
import { useData } from '../context/DataContext';
import { CategoriesSection } from '../components/CategoriesSection';
import { ShieldCheck, Clock, ArrowRight, CheckCircle2, Wrench, Sparkles, PhoneCall } from 'lucide-react';

export const ServicesPage = () => {
  const { handleInitiateRequestWork, siteBranding } = useData();
  const supportPhone = siteBranding?.supportPhone || '+91 1800 200 4567';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-left">
      
      {/* 1. Page Header Banner */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Full Spectrum Home Solutions
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Certified Home Repairs & Master Craftsmanship
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Explore our full catalog of residential maintenance services. Every technician is background-checked, insured, and verified under the Apex Quality Guarantee.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <button
                onClick={() => handleInitiateRequestWork()}
                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Book A Service Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Upfront transparent estimates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Embedded Dynamic Categories Catalog */}
      <CategoriesSection />

      {/* 3. Service Quality Assurance Grid */}
      <section className="py-14 bg-white border-b border-slate-200">
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
    </div>
  );
};
