import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  MessageSquare,
  Hammer,
  Wrench,
  Zap,
  Paintbrush,
  Fan,
  Tv
} from 'lucide-react';

export const IncomingRequestOverlay = () => {
  const {
    currentIncomingAlert,
    acceptOffer,
    declineOffer,
    soundEnabled,
    setSoundEnabled,
    partner
  } = usePartner();

  const [timeLeft, setTimeLeft] = useState(120);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (currentIncomingAlert) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isAccepting && !isDeclining) {
          handleDecline();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [currentIncomingAlert, isAccepting, isDeclining]);

  // Synchronized countdown from backend expiresAt timestamp
  useEffect(() => {
    if (!currentIncomingAlert) return;

    const calculateTime = () => {
      const remainingMs = Math.max(0, currentIncomingAlert.expiresAt - Date.now());
      const secs = Math.ceil(remainingMs / 1000);
      setTimeLeft(secs);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 500);
    return () => clearInterval(interval);
  }, [currentIncomingAlert]);

  if (!currentIncomingAlert) return null;

  const isExpired = timeLeft <= 0;

  const handleAccept = async () => {
    if (isExpired || isAccepting || isDeclining) return;
    setIsAccepting(true);
    setErrorMessage('');
    try {
      const res = await acceptOffer(currentIncomingAlert.id);
      if (res && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to accept request. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (isDeclining || isAccepting) return;
    setIsDeclining(true);
    setErrorMessage('');
    try {
      await declineOffer(currentIncomingAlert.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleViewMap = (e) => {
    e.preventDefault();
    const address = currentIncomingAlert.serviceArea || currentIncomingAlert.serviceAddress || 'Mumbai, Maharashtra';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('carpentry')) return <Hammer className="w-5 h-5 text-[#3563F6]" />;
    if (cat.includes('plumb')) return <Wrench className="w-5 h-5 text-[#3563F6]" />;
    if (cat.includes('electr')) return <Zap className="w-5 h-5 text-[#3563F6]" />;
    if (cat.includes('paint')) return <Paintbrush className="w-5 h-5 text-[#3563F6]" />;
    if (cat.includes('hvac') || cat.includes('ac')) return <Fan className="w-5 h-5 text-[#3563F6]" />;
    if (cat.includes('appliance')) return <Tv className="w-5 h-5 text-[#3563F6]" />;
    return <Wrench className="w-5 h-5 text-[#3563F6]" />;
  };

  const getCategoryDescription = (category, problemDesc) => {
    if (problemDesc && problemDesc.length > 5) return problemDesc;
    const cat = (category || '').toLowerCase();
    if (cat.includes('carpentry')) return 'Wood work, furniture repair, installation';
    if (cat.includes('plumb')) return 'Pipe leaks, tap replacement, drain clogs';
    if (cat.includes('electr')) return 'Short circuit, rewiring, appliance installation';
    if (cat.includes('paint')) return 'Interior & exterior painting, wall touch-ups';
    if (cat.includes('hvac') || cat.includes('ac')) return 'AC repair, deep cleaning, cooling check';
    if (cat.includes('appliance')) return 'Domestic appliance inspection & repair';
    return 'Professional certified home service';
  };

  // Dynamic Financial Calculations (Driven by Admin Commission Rate & Fixed Category Fee)
  const serviceFee = Number(currentIncomingAlert.fixedServiceFee) || 499;
  const commissionRate = Number(partner?.commissionRate) || 80; // Admin-configured Partner Payout %
  const partnerNetEarning = Math.round(serviceFee * (commissionRate / 100));
  const platformFee = serviceFee - partnerNetEarning;

  // Dynamic Distance / Coverage (Zero Hardcoding)
  const dynamicDistance = currentIncomingAlert.distanceKm
    ? `${currentIncomingAlert.distanceKm} km`
    : currentIncomingAlert.approxDistance && currentIncomingAlert.approxDistance !== '2.5 km'
    ? currentIncomingAlert.approxDistance
    : null;

  // Safe customer note extraction without address duplication
  const rawNote = currentIncomingAlert.notes || currentIncomingAlert.customerNote || '';
  const isDuplicateAddress = rawNote && (rawNote === currentIncomingAlert.serviceArea || rawNote === currentIncomingAlert.serviceAddress);
  const displayNote = !isDuplicateAddress && rawNote.trim().length > 0 ? rawNote.trim() : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-service-category"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E2E8F0] my-auto max-h-[92vh] flex flex-col">
        {/* Compact Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
              {getCategoryIcon(currentIncomingAlert.serviceCategory)}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#3563F6] block">
                New Service Request
              </span>
              <h2
                id="modal-service-category"
                className="text-base sm:text-lg font-bold text-[#0F172A] leading-tight truncate"
              >
                {currentIncomingAlert.serviceCategory || 'Custom Carpentry'}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 truncate">
                {getCategoryDescription(currentIncomingAlert.serviceCategory, currentIncomingAlert.problemDescription)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sound alert mute toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute alert sound' : 'Unmute alert sound'}
              aria-label={soundEnabled ? 'Mute alert sound' : 'Unmute alert sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Close modal button */}
            <button
              type="button"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Close and decline"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5 overflow-y-auto">
          {/* Error Message Notice if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Service Summary: 3 Essential Details (Dynamically Calculated) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Service Fee (Customer Paid) */}
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center font-bold text-sm shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#64748B]">Service Fee</p>
                <p className="text-base font-bold text-[#0F172A] leading-tight">
                  ₹{serviceFee}
                </p>
                <p className="text-[10px] text-[#64748B]">Fixed Standard</p>
              </div>
            </div>

            {/* 2. Dynamic Distance or Coverage Zone */}
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#3563F6] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#64748B]">
                  {dynamicDistance ? 'Distance' : 'Coverage Area'}
                </p>
                <p className="text-base font-bold text-[#0F172A] leading-tight">
                  {dynamicDistance ? dynamicDistance : 'In Service Radius'}
                </p>
                <p className="text-[10px] text-[#64748B] truncate">
                  {dynamicDistance ? 'From your location' : `Within ${partner?.serviceRadiusKm || 15} km territory`}
                </p>
              </div>
            </div>

            {/* 3. Your Net Payout (Direct 80% Payout from Admin Commission Policy) */}
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#64748B]">Your Net Payout</p>
                <p className="text-base font-bold text-[#059669] leading-tight">
                  ₹{partnerNetEarning}
                </p>
                <p className="text-[10px] text-[#64748B] font-medium">
                  {commissionRate}% Net (₹{platformFee} fee)
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Slot Details */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#64748B] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#64748B]">Appointment</p>
              <p className="text-xs sm:text-sm font-semibold text-[#0F172A] mt-0.5 truncate">
                {currentIncomingAlert.timeSlot
                  ? currentIncomingAlert.timeSlot.replace(',', ' · ')
                  : '26 Oct 2026 · 6:00 PM–9:00 PM'}
              </p>
            </div>
          </div>

          {/* Service Location */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#64748B]">Service Location</p>
                <p className="text-xs sm:text-sm font-semibold text-[#0F172A] mt-0.5 truncate">
                  {currentIncomingAlert.serviceArea || currentIncomingAlert.serviceAddress || 'Will be provided in Step 4'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleViewMap}
              className="shrink-0 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-blue-300 bg-white hover:bg-[#EFF6FF] text-[#3563F6] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Open location in Google Maps"
            >
              <span>View on Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Customer Note */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-[#64748B]">Customer Note</p>
              {displayNote ? (
                <p className="text-xs text-[#0F172A] font-medium leading-relaxed mt-0.5 break-words">
                  {displayNote}
                </p>
              ) : (
                <p className="text-xs text-[#64748B] italic mt-0.5">
                  No additional notes
                </p>
              )}
            </div>
          </div>

          {/* Reassignment Countdown Banner */}
          <div className="p-3 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <Clock className="w-4 h-4 text-[#3563F6] shrink-0" />
              <span className="text-xs">
                {isExpired ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Auto-reassigned (Offer Expired)
                  </span>
                ) : (
                  <span>
                    Auto-reassigns in{' '}
                    <strong className={`font-bold ${timeLeft <= 15 ? 'text-rose-600' : 'text-[#3563F6]'}`}>
                      {timeLeft >= 60 ? `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : `${timeLeft}s`}
                    </strong>
                  </span>
                )}
              </span>
            </div>

            <span className="text-[11px] text-[#64748B]">
              Accept this request to start earning and help a customer.
            </span>
          </div>

          {/* Action Buttons: Decline & Accept Request */}
          <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] active:bg-slate-100 text-[#0F172A] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4 text-[#64748B]" />
              <span>{isDeclining ? 'Declining...' : 'Decline'}</span>
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={isExpired || isAccepting || isDeclining}
              className="w-full py-2.5 sm:py-3 px-5 rounded-xl bg-[#3563F6] hover:bg-[#2554E5] active:bg-[#1D47C9] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>{isAccepting ? 'Claiming...' : isExpired ? 'Expired' : 'Accept Request'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
