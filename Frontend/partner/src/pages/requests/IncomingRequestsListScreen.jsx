import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { Zap, Clock, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';

export const IncomingRequestsListScreen = () => {
  const {
    partner,
    offers,
    acceptOffer,
    declineOffer,
    soundEnabled,
    setSoundEnabled
  } = usePartner();

  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, ACCEPTED, DECLINED, EXPIRED
  const [loadingAction, setLoadingAction] = useState(null);

  const pendingOffers = (offers || []).filter(o => o.status === 'PENDING' && o.expiresAt > Date.now());

  const filteredOffers = (offers || []).filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return o.status === 'PENDING' && o.expiresAt > Date.now();
    if (filter === 'EXPIRED') return o.status === 'EXPIRED' || (o.status === 'PENDING' && o.expiresAt <= Date.now());
    return o.status === filter;
  });

  const handleAccept = async (id) => {
    setLoadingAction(id);
    try {
      await acceptOffer(id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = async (id) => {
    setLoadingAction(id);
    try {
      await declineOffer(id);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Live Dispatch Queue
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Radar Active (2s Poll)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#3867FF]" />
            <span>Incoming Service Requests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coverage: <strong className="text-slate-800">{partner?.serviceCategories?.length ? partner.serviceCategories.join(', ') : (partner?.category || 'Custom Carpentry')}</strong> • Online status: <strong className={partner?.isAvailable !== false ? 'text-emerald-600' : 'text-slate-500'}>{partner?.isAvailable !== false ? 'ELIGIBLE & ONLINE' : 'OFFLINE'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>
        </div>
      </div>


      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              filter === tab
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Offers Feed */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center">
            <Zap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-base">
              No Active Service Offers Right Now
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Job offers feature an authoritative <strong>2-minute countdown</strong>. Once expired or claimed by another partner, they are automatically removed from this queue.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Radar Active • Waiting for live incoming customer requests...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const isPending = offer.status === 'PENDING' && offer.expiresAt > Date.now();
            const isExpired = offer.status === 'EXPIRED' || (offer.status === 'PENDING' && offer.expiresAt <= Date.now());

            return (
              <div
                key={offer.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
                  isPending
                    ? 'border-[#3867FF] ring-2 ring-[#3867FF]/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Row: Category, Area, Fee */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#3867FF] border border-blue-200">
                        {offer.serviceCategory}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {offer.serviceArea} ({offer.approxDistance})
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {offer.problemTitle}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Fixed Category Fee</p>
                    <div className="text-xl font-black text-slate-900">
                      <CurrencyDisplay amount={offer.fixedServiceFee} />
                    </div>
                    <p className="text-[11px] text-emerald-600 font-bold">
                      Net: <CurrencyDisplay amount={Math.round(offer.fixedServiceFee * 0.8)} />
                    </p>
                  </div>
                </div>

                {/* Problem Description & Customer Notes */}
                <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                  <p>{offer.problemDescription}</p>
                  {offer.notes && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                      <strong>Customer Special Note: </strong> {offer.notes}
                    </div>
                  )}
                </div>

                {/* Time Slot & Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Slot: <strong className="text-slate-800">{offer.timeSlot}</strong></span>
                  </div>

                  {/* Actions depending on offer status */}
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecline(offer.id)}
                        disabled={loadingAction === offer.id}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors text-xs"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(offer.id)}
                        disabled={loadingAction === offer.id}
                        className="px-5 py-2 bg-[#3867FF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept Offer</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        offer.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : offer.status === 'DECLINED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
