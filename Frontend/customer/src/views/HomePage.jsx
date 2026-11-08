import React from 'react';
import { HeroSlider } from '../components/HeroSlider';
import { AIOwnerSection } from '../components/AIOwnerSection';
import { CategoriesSection } from '../components/CategoriesSection';
import { ReviewsSlider } from '../components/ReviewsSlider';
import { useData } from '../context/DataContext';
import { ShieldCheck, PhoneCall, ArrowRight, Clock, Award, Zap } from 'lucide-react';

export const HomePage = () => {
  const {
    handleInitiateRequestWork,
    siteBranding,
    submitWorkRequest,
    data,
    toast,
    setActiveTrackingRequestId,
    setActiveBookingStep,
    setCustomerViewMode,
    setActivePage,
    customerUser
  } = useData();

  const [isFastTesting, setIsFastTesting] = React.useState(false);

  const handleFastTestClick = async () => {
    try {
      setIsFastTesting(true);
      const activeCat = data?.categories?.find(c => c.active !== false) || {
        id: 1,
        name: 'Custom Carpentry',
        slug: 'custom-carpentry'
      };

      const testPayload = {
        serviceCategoryId: activeCat.id,
        serviceCategory: activeCat.name,
        customerName: customerUser?.fullName || 'Fast Test Customer',
        customerEmail: customerUser?.email || 'test.customer@apexservices.com',
        contactPhone: customerUser?.mobileNumber || customerUser?.phone || '+919876543210',
        problemType: 'General Maintenance & Diagnosis',
        problemTitle: `Fast Test: ${activeCat.name} Quick Inspection`,
        problemDescription: 'Automated test request generated via 1-Click Fast Test Dispatch for rapid verification.',
        urgency: 'Standard',
        serviceAddress: 'Flat 402, Green Glen Layout, Outer Ring Road, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        preferredTime: 'Morning (9 AM - 12 PM)',
        timeSlot: 'Morning (9 AM - 12 PM)',
        estimatedCost: 499,
        notes: 'Fast test dispatch - instant 1-click test from Home'
      };

      const res = await submitWorkRequest(testPayload);
      if (res && res.success) {
        if (setActiveTrackingRequestId) setActiveTrackingRequestId(res.request.id);
        if (setActiveBookingStep) setActiveBookingStep(9);
        if (setCustomerViewMode) setCustomerViewMode('booking');
        setActivePage('request-work');
        toast?.success(`⚡ Fast Test Request dispatched! Ticket #${res.request.id}`, 'Fast Test Created');
      } else {
        toast?.error(res?.error || 'Failed to dispatch fast test request', 'Test Dispatch Error');
      }
    } catch (e) {
      console.error('Fast test error:', e);
      toast?.error('Error generating fast test request.', 'Dispatch Error');
    } finally {
      setIsFastTesting(false);
    }
  };

  const supportPhone = siteBranding?.supportPhone || '+91 1800 200 4567';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 0. FAST TESTING MODE BANNER CARD (PROMINENT AT TOP OF HOME) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-md border border-amber-300">
                  ⚡ Fast Testing Mode
                </span>
                <span className="text-[11px] font-bold text-amber-800">1-Click Instant Dispatch</span>
              </div>
              <p className="text-xs text-amber-900 font-medium mt-1">
                Skip the 6-step form and dispatch a test request in 1 click.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isFastTesting}
            onClick={handleFastTestClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Zap className={`w-4 h-4 fill-current ${isFastTesting ? 'animate-spin' : ''}`} />
            <span>{isFastTesting ? 'Dispatching Test Job...' : '⚡ 1-Click Fast Test'}</span>
          </button>
        </div>
      </div>

      {/* 1. Hero Showcase Carousel */}
      <HeroSlider />

      {/* 2. Trust Value Props Strip */}
      <section className="bg-white border-b border-slate-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="flex items-center space-x-3.5 p-2 rounded-xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">100% Certified</h4>
                <p className="text-xs text-slate-500 font-medium truncate">Verified master pros</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-2 rounded-xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">Rapid Dispatch</h4>
                <p className="text-xs text-slate-500 font-medium truncate">Under 60 min response</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-2 rounded-xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">Apex Warranty</h4>
                <p className="text-xs text-slate-500 font-medium truncate">30-day work guarantee</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-2 rounded-xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/80">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">24/7 Hotline</h4>
                <p className="text-xs text-slate-500 font-medium truncate">{supportPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Founder Direct Guarantee */}
      <AIOwnerSection />

      {/* 4. Service Categories Catalog */}
      <CategoriesSection />

      {/* 5. Verified Reviews Testimonials */}
      <ReviewsSlider />

      {/* 6. Sober & Authoritative Bottom Action Banner */}
      <section className="bg-[#0A2540] text-white py-10 sm:py-14 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
              Emergency & Scheduled Dispatch
            </span>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ready To Book A Certified Professional?
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm font-normal">
              Instant appointment scheduling with zero upfront consultation fee. Fully insured work across all categories.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleInitiateRequestWork()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book Service Online</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
