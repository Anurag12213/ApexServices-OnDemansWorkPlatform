import React, { useState, useEffect, useCallback } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { api } from '../../services/api';
import {
  Briefcase,
  Navigation,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  X,
  FileText,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

export const IncomingRequestsListScreen = () => {
  const { partner, toast, refreshState, setActiveTab } = usePartner();

  // Mode: 'ALL_JOBS' vs 'NEARBY_JOBS'
  const [activeMarketMode, setActiveMarketMode] = useState('ALL_JOBS');
  const [selectedRadiusKm, setSelectedRadiusKm] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // GPS Coordinates
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Jobs data
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState(null);
  const [acceptingJobId, setAcceptingJobId] = useState(null);
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);

  // Temporary: 1-Click Fast Test Request Dispatch
  const handleQuickTestDispatch = async () => {
    try {
      setIsDispatchingTest(true);
      const testCategory = partner?.serviceCategories?.[0]?.name || partner?.categories?.[0]?.name || 'Air Conditioner Service';
      const lat = userLocation?.lat || 12.9716;
      const lng = userLocation?.lng || 77.5946;

      const apiUrl = (
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
        '/api'
      ).replace(/\/+$/, '');

      const payload = {
        serviceCategory: testCategory,
        customerName: 'Quick Test Customer',
        customerEmail: 'quicktest.customer@apexservices.com',
        contactPhone: '+919876543210',
        problemType: 'General Maintenance & Diagnosis',
        problemTitle: `Fast Test: ${testCategory} Inspection`,
        problemDescription: 'Automated test request generated via 1-Click Fast Test Dispatch for rapid partner acceptance testing.',
        urgency: 'Immediate',
        serviceAddress: 'Flat 402, Green Glen Layout, Outer Ring Road, Bangalore',
        latitude: lat,
        longitude: lng,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: 'Morning (9 AM - 12 PM)',
        timeSlot: 'Morning (9 AM - 12 PM)',
        estimatedCost: 499
      };

      const res = await fetch(`${apiUrl}/work-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`⚡ Test job dispatched! Ticket #${data.id}`, 'Dispatched');
        await fetchJobs();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to dispatch test request.', 'Dispatch Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error dispatching test request.', 'Dispatch Error');
    } finally {
      setIsDispatchingTest(false);
    }
  };

  // Request GPS position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS permission denied or unavailable:', err.message);
        setGeoError('GPS location unavailable. You can still browse and accept jobs in All Jobs.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Fetch Jobs from backend API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let token = await api.getPartnerAuthToken();
      const apiUrl = (
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
        '/api'
      ).replace(/\/+$/, '');

      let endpoint = `${apiUrl}/partner/jobs`;
      const params = new URLSearchParams();

      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }

      if (activeMarketMode === 'NEARBY_JOBS' && userLocation) {
        endpoint = `${apiUrl}/partner/jobs/nearby`;
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
        params.append('radiusKm', selectedRadiusKm);
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      } else {
        // Fallback to partner feed
        const feed = await api.fetchLiveFeed();
        setJobs(feed || []);
      }
    } catch (e) {
      console.warn('Failed to fetch published jobs marketplace:', e);
      const feed = await api.fetchLiveFeed();
      setJobs(feed || []);
    } finally {
      setLoading(false);
    }
  }, [activeMarketMode, userLocation, selectedRadiusKm, selectedCategory]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filter jobs by search
  const displayedJobs = jobs.filter((j) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (j.problemTitle || '').toLowerCase().includes(term) ||
      (j.serviceCategory || '').toLowerCase().includes(term) ||
      (j.problemDescription || '').toLowerCase().includes(term) ||
      (j.serviceAddress || '').toLowerCase().includes(term) ||
      (j.id || '').toLowerCase().includes(term)
    );
  });

  // Handle Atomic Job Acceptance
  const handleAcceptJob = async (job) => {
    setAcceptingJobId(job.id);
    try {
      await api.acceptOffer(job.id);
      toast.success(
        `Job Accepted! You are assigned to ${job.serviceCategory || 'Service'} (${job.id}).`,
        'Job Claimed'
      );
      setSelectedJobForDetail(null);
      refreshState();
      if (setActiveTab) {
        setActiveTab('my-jobs');
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'ALREADY_CLAIMED') {
        toast.warning(
          err.message || 'This job was already accepted by another technician.',
          'Job No Longer Available'
        );
      } else {
        toast.error(err.message || 'Failed to accept job. Please try again.', 'Error');
      }
      fetchJobs();
    } finally {
      setAcceptingJobId(null);
    }
  };

  const categories = [
    'ALL',
    ...(partner?.serviceCategories && partner.serviceCategories.length
      ? partner.serviceCategories
      : ['Carpentry', 'Electrical', 'Plumbing', 'Cleaning', 'Appliances'])
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Open Marketplace (Post & Pick)
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Available Requests
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#3867FF]" />
            <span>Available Jobs Marketplace</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse published requests from customers. The first verified technician to accept wins the job.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Temporary 1-Click Fast Test Dispatch Button */}
          <button
            onClick={handleQuickTestDispatch}
            disabled={isDispatchingTest}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
            title="Instant 1-Click Request Dispatch for Fast Testing"
          >
            <Zap className={`w-3.5 h-3.5 fill-current ${isDispatchingTest ? 'animate-spin' : ''}`} />
            <span>{isDispatchingTest ? 'Dispatching...' : '⚡ 1-Click Test Dispatch'}</span>
          </button>

          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3867FF]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Mode Toggle: All Jobs vs Nearby Jobs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveMarketMode('ALL_JOBS')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMarketMode === 'ALL_JOBS'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>All Published Jobs ({jobs.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveMarketMode('NEARBY_JOBS');
              if (!userLocation) requestLocation();
            }}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMarketMode === 'NEARBY_JOBS'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Nearby Jobs</span>
          </button>
        </div>

        {/* Radius filter pills when in Nearby mode */}
        {activeMarketMode === 'NEARBY_JOBS' && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap pl-1">Radius:</span>
            {[5, 10, 20, 50, 100].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedRadiusKm === r
                    ? 'bg-[#0A2540] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocation status / error notice */}
      {geoError && activeMarketMode === 'NEARBY_JOBS' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{geoError}</p>
            <p className="text-amber-700 mt-0.5">Switch back to "All Published Jobs" to view all requests without distance filters.</p>
          </div>
          <button
            onClick={requestLocation}
            disabled={isLocating}
            className="underline font-bold hover:text-amber-900 shrink-0"
          >
            {isLocating ? 'Detecting...' : 'Retry GPS'}
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by problem, category, or locality..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3867FF]/20 focus:border-[#3867FF]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3867FF]/20 focus:border-[#3867FF] text-slate-700 font-medium"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#3867FF] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading published marketplace jobs...</p>
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3867FF] flex items-center justify-center mx-auto border border-blue-100">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Published Jobs Right Now</h3>
            <p className="text-xs text-slate-500">
              {activeMarketMode === 'NEARBY_JOBS'
                ? `No available jobs found within ${selectedRadiusKm} km. Try expanding the radius or switching to All Published Jobs.`
                : 'There are currently no open work requests matching your filter criteria. Check back shortly!'}
            </p>
          </div>
          {activeMarketMode === 'NEARBY_JOBS' && (
            <button
              onClick={() => setActiveMarketMode('ALL_JOBS')}
              className="px-4 py-2 rounded-xl bg-[#3867FF] text-white text-xs font-bold hover:bg-[#2f55db] transition-colors"
            >
              View All Published Jobs
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedJobs.map((job) => {
            const gross = job.estimatedCost || 499;
            const netEarning = job.partnerNetEarning || Math.round(gross * 0.8);
            const isAccepting = acceptingJobId === job.id;

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#3867FF]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category & Distance Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#3867FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {job.serviceCategory || 'Service'}
                    </span>
                    {job.distanceKm != null ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3 text-[#ff3b47]" />
                        <span>{job.distanceKm} km away</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Standard Locality</span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight line-clamp-1">
                      {job.problemTitle || `${job.serviceCategory || 'Service'} Request`}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {job.problemDescription || 'Standard service request requiring certified technician.'}
                    </p>
                  </div>

                  {/* Meta Tags */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1 font-medium text-slate-700">
                        {job.serviceAddress || 'Approximate Local Area'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        {job.preferredDate || 'Flexible'} • {job.preferredTime || 'Standard Hours'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Net Take-Home (80%)
                    </span>
                    <span className="text-base font-black text-emerald-600">
                      ₹{Number(netEarning).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedJobForDetail(job)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleAcceptJob(job)}
                      disabled={isAccepting}
                      className="px-4 py-2 rounded-xl text-xs font-black text-white bg-[#ff3b47] hover:bg-[#e62e3a] disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      {isAccepting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Job</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Inspection Modal */}
      {selectedJobForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3867FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {selectedJobForDetail.serviceCategory || 'Service Request'}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {selectedJobForDetail.problemTitle || 'Service Details'}
                </h2>
                <p className="text-xs text-slate-500 font-mono">Reference: {selectedJobForDetail.id}</p>
              </div>
              <button
                onClick={() => setSelectedJobForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Problem Description</h4>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedJobForDetail.problemDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Preferred Schedule</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {selectedJobForDetail.preferredDate || 'Immediate'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {selectedJobForDetail.preferredTime || 'Standard'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Service Area</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {selectedJobForDetail.serviceAddress}
                  </span>
                  {selectedJobForDetail.distanceKm != null && (
                    <span className="text-emerald-700 text-[11px] font-bold">
                      📍 {selectedJobForDetail.distanceKm} km from your GPS
                    </span>
                  )}
                </div>
              </div>

              {/* Privacy Notice Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#3867FF] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Customer Privacy Protected:</strong> Customer full name, exact street address, and phone number will be revealed immediately once you accept this job.
                </p>
              </div>

              {/* Payout Breakdown */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Gross Customer Service Charge:</span>
                  <span>₹{Number(selectedJobForDetail.estimatedCost || 499).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Platform Fee (20%):</span>
                  <span>-₹{Math.round(Number(selectedJobForDetail.estimatedCost || 499) * 0.2).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-emerald-400">
                  <span>Your Net Take-Home Payout:</span>
                  <span>₹{Number(selectedJobForDetail.partnerNetEarning || Math.round(Number(selectedJobForDetail.estimatedCost || 499) * 0.8)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedJobForDetail(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleAcceptJob(selectedJobForDetail)}
                disabled={acceptingJobId === selectedJobForDetail.id}
                className="flex-1 py-2.5 rounded-xl font-black text-xs text-white bg-[#ff3b47] hover:bg-[#e62e3a] transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {acceptingJobId === selectedJobForDetail.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Accept Job</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
