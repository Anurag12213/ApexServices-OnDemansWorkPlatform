import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { api } from '../../services/api';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Navigation,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Package,
  Wrench,
  Camera,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  UserX
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export const JobExecutionFlow = () => {
  const { activeJob, updateJobStatus, setActiveTab, refreshState } = usePartner();
  const { toast } = useToast();

  // Sub-step views: 'OVERVIEW', 'DIAGNOSIS', 'PRODUCTS', 'OUT_OF_SCOPE', 'COMPLETION'
  const [activeSubStep, setActiveSubStep] = useState('OVERVIEW');

  // Diagnosis state (Screen 27 & 39)
  const [diagnosisNotes, setDiagnosisNotes] = useState(
    activeJob?.diagnosis?.notes || 'Inspection reveals internal door hinge latch plate misalignment causing lock jam.'
  );
  const [safetyConcerns, setSafetyConcerns] = useState('None observed. Work area clear of hazardous wiring.');

  // Required Products state (Screens 28, 29, 30)
  const [requiredParts, setRequiredParts] = useState(
    activeJob?.requiredProducts || [
      {
        id: 'PART-1',
        name: 'Heavy Duty Mortise Latch Plate & Screws',
        specs: 'Godrej / Yale Compatible 65mm Brass Plated',
        quantity: 1,
        reason: 'Original plate screw holes stripped',
        procurementSource: 'OUTSIDE_MARKET', // 'OUTSIDE_MARKET' or 'DIRECT_PARTNER'
        status: 'PRODUCT_IDENTIFIED' // PRODUCT_IDENTIFIED, AWAITING_CUSTOMER, CUSTOMER_REPORTED_PURCHASED, PRODUCT_AVAILABLE
      }
    ]
  );
  const [newPartName, setNewPartName] = useState('');
  const [newPartSpecs, setNewPartSpecs] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartSource, setNewPartSource] = useState('OUTSIDE_MARKET');

  // Delay / Customer unavailable modals
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('Heavy traffic congestion on Western Express Highway');

  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  // Completion state (Screen 44)
  const [completionSummary, setCompletionSummary] = useState(
    'Re-aligned mortise strike plate, installed new reinforced fasteners, lubricated lock tumbler, and tested 5 smooth key cycles.'
  );
  const [customerFeedbackCode, setCustomerFeedbackCode] = useState(''); // Authoritative OTP input from customer
  const [isVerifyingCompletion, setIsVerifyingCompletion] = useState(false);

  if (!activeJob) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Wrench className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Active Job In Execution</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You currently have no active assigned service requests. Check live offers or your appointment calendar.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setActiveTab('requests')}
            className="px-4 py-2 bg-[#3867FF] text-white font-bold text-xs rounded-xl"
          >
            Check Live Offers
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
          >
            View Calendar Schedule
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = activeJob.status;

  // Lifecycle Progression handlers
  const handleStartTravel = () => {
    updateJobStatus(activeJob.id, 'EN_ROUTE', { note: 'Technician departed for customer location' });
  };

  const handleMarkArrived = () => {
    updateJobStatus(activeJob.id, 'ARRIVED', { note: 'Technician reached customer premises' });
  };

  const handleStartDiagnosis = () => {
    updateJobStatus(activeJob.id, 'DIAGNOSING', {
      note: 'Diagnostic assessment commenced',
      diagnosis: { notes: diagnosisNotes, safetyConcerns }
    });
    setActiveSubStep('DIAGNOSIS');
  };

  const handleSaveDiagnosis = () => {
    updateJobStatus(activeJob.id, 'IN_PROGRESS', {
      note: 'Diagnosis recorded, standard physical service initiated',
      diagnosis: { notes: diagnosisNotes, safetyConcerns }
    });
    setActiveSubStep('OVERVIEW');
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const newPart = {
      id: 'PART-' + Date.now(),
      name: newPartName,
      specs: newPartSpecs || 'Standard specifications',
      quantity: Number(newPartQty) || 1,
      reason: 'Necessary replacement for repair',
      procurementSource: newPartSource,
      status: 'AWAITING_CUSTOMER'
    };
    const updated = [...requiredParts, newPart];
    setRequiredParts(updated);
    setNewPartName('');
    setNewPartSpecs('');
    updateJobStatus(activeJob.id, 'AWAITING_PARTS', {
      note: `Paused waiting for customer parts: ${newPart.name}`,
      products: updated
    });
  };

  const handleTogglePartStatus = (partId, nextStatus) => {
    const updated = requiredParts.map(p => p.id === partId ? { ...p, status: nextStatus } : p);
    setRequiredParts(updated);
    updateJobStatus(activeJob.id, activeJob.status, { products: updated });
  };

  const handleCompleteJob = async () => {
    if (!customerFeedbackCode || customerFeedbackCode.trim().length !== 4) {
      toast.warning('Please enter the 4-digit completion code provided by the customer.', 'Code Required');
      return;
    }
    setIsVerifyingCompletion(true);
    try {
      await api.verifyJobCompletion(activeJob.id, customerFeedbackCode.trim());
      refreshState();
      toast.success('Task completion verified with customer code! Awaiting customer payment confirmation.', 'Work Completed');
      setActiveSubStep('OVERVIEW');
    } catch (err) {
      toast.error(err.message || 'Verification code mismatch or expired. Please check with customer.', 'Verification Failed');
    } finally {
      setIsVerifyingCompletion(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#3867FF] border border-blue-200">
              {activeJob.category}
            </span>
            <StatusBadge status={currentStatus} size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {activeJob.title}
          </h1>
          <p className="text-xs text-slate-500">
            Booking ID: <strong className="text-slate-800">{activeJob.id}</strong> • Slot: {activeJob.timeSlot}
          </p>
        </div>

        {/* Sub-step navigation pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs no-scrollbar">
          <button
            onClick={() => setActiveSubStep('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              activeSubStep === 'OVERVIEW' ? 'bg-[#3867FF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Visit Overview
          </button>
          <button
            onClick={() => setActiveSubStep('DIAGNOSIS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              activeSubStep === 'DIAGNOSIS' ? 'bg-[#3867FF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Diagnosis
          </button>
          <button
            onClick={() => setActiveSubStep('PRODUCTS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              activeSubStep === 'PRODUCTS' ? 'bg-[#3867FF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Replacement Parts
          </button>
          <button
            onClick={() => setActiveSubStep('COMPLETION')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              activeSubStep === 'COMPLETION' ? 'bg-[#3867FF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Complete Job
          </button>
        </div>
      </div>

      {/* SUB-STEP: OVERVIEW & ACTIVE STATE TRANSITION BAR */}
      {activeSubStep === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Customer & Location Card (Screens 34 & 32) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">Customer Details</p>
                <h3 className="text-lg font-black text-slate-900">{activeJob.customerName}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#3867FF]" />
                  <span>{activeJob.customerPhone}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${activeJob.customerPhone}`}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Customer</span>
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeJob.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#3867FF] font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open Maps</span>
                </a>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block">Service Address:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{activeJob.address}</span>
                </p>
              </div>

              <div className="pt-2">
                <span className="font-semibold text-slate-400 block">Customer Reported Problem:</span>
                <p className="text-slate-700 leading-relaxed mt-0.5">{activeJob.description}</p>
              </div>
            </div>
          </div>

          {/* Execution Action Bar (Progress buttons) */}
          <div className="bg-gradient-to-r from-[#172033] to-[#1E293B] text-white p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Current Operational Stage
              </span>
              <StatusBadge status={currentStatus} size="sm" />
            </div>

            {/* Stage Actions */}
            <div className="space-y-3">
              {currentStatus === 'ASSIGNED' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You have accepted this job. Tap below when you start driving or travelling to customer premises.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartTravel}
                      className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Travel (Mark En Route)</span>
                    </button>
                    <button
                      onClick={() => setShowDelayModal(true)}
                      className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
                      title="Report delay in arrival"
                    >
                      Report Delay
                    </button>
                  </div>
                </div>
              )}

              {currentStatus === 'EN_ROUTE' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Travelling to site. Mark arrived when physically at customer gate or door.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkArrived}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Arrived On-Site</span>
                    </button>
                    <button
                      onClick={() => setShowUnavailableModal(true)}
                      className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
                    >
                      Customer Unavailable
                    </button>
                  </div>
                </div>
              )}

              {currentStatus === 'ARRIVED' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    You have arrived on-site. Commence physical inspection and record diagnosis findings.
                  </p>
                  <button
                    onClick={handleStartDiagnosis}
                    className="w-full py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Begin Inspection & Diagnosis</span>
                  </button>
                </div>
              )}

              {currentStatus === 'DIAGNOSING' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Inspection in progress. Record findings and determine if replacement products are needed.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveSubStep('DIAGNOSIS')}
                      className="w-full py-3 bg-[#3867FF] text-white font-bold text-xs rounded-xl"
                    >
                      Open Diagnosis Form
                    </button>
                    <button
                      onClick={() => setActiveSubStep('PRODUCTS')}
                      className="w-full py-3 bg-purple-600 text-white font-bold text-xs rounded-xl"
                    >
                      Add Required Parts
                    </button>
                  </div>
                </div>
              )}

              {currentStatus === 'AWAITING_PARTS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs text-amber-200">
                    ⚠️ Service paused. Awaiting customer replacement part acquisition (Outside Market or Direct Partner).
                  </div>
                  <button
                    onClick={() => {
                      updateJobStatus(activeJob.id, 'IN_PROGRESS', { note: 'Parts ready. Work resumed.' });
                    }}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Customer Reports Parts Ready — Resume Service</span>
                  </button>
                </div>
              )}

              {currentStatus === 'IN_PROGRESS' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Service work is currently in progress. Complete all standard checklist items.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateJobStatus(activeJob.id, 'AWAITING_PARTS', { note: 'Service paused for customer parts' });
                      }}
                      className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
                    >
                      <PauseCircle className="w-4 h-4 inline mr-1" /> Pause Service
                    </button>
                    <button
                      onClick={() => setActiveSubStep('COMPLETION')}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Submit Work Completion</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SINGLE AUTHORITATIVE COMPLETION CARD: AWAITING PAYMENT */}
              {currentStatus === 'COMPLETED' && !activeJob.customerPaid && (
                <div className="space-y-4 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Work Completed — Awaiting Customer Payment</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    You have successfully submitted work completion. Customer has been presented with the final invoice of <strong className="text-white">₹{activeJob.fixedFee || 499}</strong>.
                  </p>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Gross Customer Invoice:</span>
                      <span className="text-white font-bold">₹{activeJob.fixedFee || 499}</span>
                    </div>
                    <div className="flex justify-between text-rose-300">
                      <span>Platform Commission (20%):</span>
                      <span>-₹{Math.round((activeJob.fixedFee || 499) * 0.20)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-white/10">
                      <span>Net Partner Payout (80%):</span>
                      <span>₹{Math.round((activeJob.fixedFee || 499) * 0.80)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    Net ₹{Math.round((activeJob.fixedFee || 499) * 0.80)} will be credited to your wallet automatically as soon as customer payment is confirmed.
                  </p>
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={async () => {
                        const res = await api.confirmJobPayment(activeJob.id, { method: 'CASH' });
                        if (res.success) {
                          toast.success('Customer cash payment confirmed! Cash receipt generated & earnings credited.', 'Cash Settled');
                          setActiveTab('earnings');
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Received Cash On-Site (₹{activeJob.fixedFee || 499})</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const res = await api.confirmJobPayment(activeJob.id, { method: 'UPI' });
                          if (res.success) {
                            toast.success('Online payment verified & earnings credited to your wallet!', 'Payment Confirmed');
                            setActiveTab('earnings');
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Online Payment (UPI / Card)</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('earnings')}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Ledger
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SINGLE AUTHORITATIVE COMPLETION CARD: SETTLED & PAID */}
              {currentStatus === 'COMPLETED' && activeJob.customerPaid && (
                <div className="space-y-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Work Completed & Payment Settled! 🎉</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Customer has confirmed payment. Net earnings of <strong className="text-emerald-400 font-bold">₹{activeJob.financials?.partnerNetEarning || Math.round((activeJob.fixedFee || 499) * 0.80)}</strong> have been released directly to your verified wallet.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('earnings')}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View Wallet & Ledger</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Next Job
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-STEP: DIAGNOSIS & FINDINGS */}
      {activeSubStep === 'DIAGNOSIS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#3867FF]">Diagnostic Inspection</span>
              <h3 className="text-lg font-bold text-slate-900">Partner Diagnostic Assessment</h3>
            </div>
            <button
              onClick={() => setActiveSubStep('OVERVIEW')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reported Issue & Physical Findings *
              </label>
              <textarea
                rows={3}
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Describe exact mechanical or electrical faults observed..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Safety or Site Access Considerations
              </label>
              <input
                type="text"
                value={safetyConcerns}
                onChange={(e) => setSafetyConcerns(e.target.value)}
                placeholder="e.g. Main circuit breaker isolated prior to work..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Are Replacement Products Required?</span>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Remember: ApexServices does not sell products or collect product payment.
                </p>
              </div>
              <button
                onClick={() => setActiveSubStep('PRODUCTS')}
                className="px-3.5 py-1.5 bg-[#3867FF] text-white font-bold rounded-xl text-xs"
              >
                Configure Parts →
              </button>
            </div>

            <button
              onClick={handleSaveDiagnosis}
              className="w-full py-3 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Save Diagnosis & Proceed to Physical Service
            </button>
          </div>
        </div>
      )}

      {/* SUB-STEP: REPLACEMENT PRODUCT WORKFLOW */}
      {activeSubStep === 'PRODUCTS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#3867FF]">Replacement Parts Workflow</span>
              <h3 className="text-lg font-bold text-slate-900">Replacement Product Workflow</h3>
            </div>
            <button
              onClick={() => setActiveSubStep('OVERVIEW')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Critical Part 10 Policy Callout */}
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShoppingBag className="w-4 h-4 text-[#7C3AED]" />
              <span>Independent Product Commerce Rule</span>
            </div>
            <p className="text-purple-800 leading-relaxed text-[11px]">
              ApexServices does not participate in product sales. The customer may purchase required products independently from an outside market or directly from you. Product prices are negotiated directly between customer and seller and are NEVER added to ApexServices's service fee or platform commission.
            </p>
          </div>

          {/* Add Required Part Form (Screen 28) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Add Required Replacement Product
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product / Part Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mortise Latch Cylinder"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-[#3867FF]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Specifications / Model No.</label>
                <input
                  type="text"
                  placeholder="e.g. 60mm Brass Finish"
                  value={newPartSpecs}
                  onChange={(e) => setNewPartSpecs(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-[#3867FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-[#3867FF]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Procurement Channel</label>
                <select
                  value={newPartSource}
                  onChange={(e) => setNewPartSource(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-[#3867FF]"
                >
                  <option value="OUTSIDE_MARKET">Customer Outside Market Purchase</option>
                  <option value="DIRECT_PARTNER">Direct Purchase from Partner (Outside Platform)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAddPart}
              className="px-4 py-2 bg-[#3867FF] hover:bg-blue-600 text-white font-bold rounded-lg transition-colors text-xs"
            >
              + Record Required Part (Notify Customer)
            </button>
          </div>

          {/* Recorded Parts List & Operational Availability Tracker */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Identified Replacement Products Tracker
            </h4>

            {requiredParts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No replacement products recorded for this service.</p>
            ) : (
              <div className="space-y-2">
                {requiredParts.map((part) => (
                  <div
                    key={part.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{part.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                          Qty: {part.quantity}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-[#7C3AED]">
                          {part.procurementSource === 'OUTSIDE_MARKET' ? 'Outside Market' : 'Direct from Partner'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {part.specs} • {part.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={part.status}
                        onChange={(e) => handleTogglePartStatus(part.id, e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <option value="PRODUCT_IDENTIFIED">Product Identified</option>
                        <option value="AWAITING_CUSTOMER">Awaiting Customer Purchase</option>
                        <option value="CUSTOMER_REPORTED_PURCHASED">Customer Reports Purchased</option>
                        <option value="PRODUCT_AVAILABLE">Product Available (Ready to Fit)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-STEP: SCREEN 44 WORK COMPLETION SUBMISSION */}
      {activeSubStep === 'COMPLETION' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#3867FF]">Job Closeout</span>
              <h3 className="text-lg font-bold text-slate-900">Submit Work Completion</h3>
            </div>
            <button
              onClick={() => setActiveSubStep('OVERVIEW')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Financial Settlement Breakdown */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
              Authoritative Earnings Settlement
            </h4>
            <div className="flex justify-between text-slate-600">
              <span>Gross Fixed Category Service Fee:</span>
              <CurrencyDisplay amount={activeJob.fixedFee} className="text-slate-800" />
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Service Commission (20%):</span>
              <CurrencyDisplay amount={activeJob.financials.platformFee} className="text-slate-500" />
            </div>
            <div className="flex justify-between font-black text-sm text-emerald-800 pt-1 border-t border-emerald-200">
              <span>Your Net 80% Credit:</span>
              <CurrencyDisplay amount={activeJob.financials.partnerNetEarning} />
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Summary of Physical Work Performed *
              </label>
              <textarea
                rows={3}
                value={completionSummary}
                onChange={(e) => setCompletionSummary(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Customer Verification Completion Code (4 Digits) *
              </label>
              <input
                type="text"
                maxLength={4}
                value={customerFeedbackCode}
                onChange={(e) => setCustomerFeedbackCode(e.target.value)}
                className="w-32 px-3 py-2 text-center font-mono font-bold tracking-widest text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-[#3867FF]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Provided by the customer upon satisfactory completion inspection.
              </p>
            </div>

            <button
              onClick={handleCompleteJob}
              disabled={isVerifyingCompletion}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerifyingCompletion ? 'Verifying Code...' : 'Verify Completion with Customer Code'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Delay Modal (Screen 37) */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Report Travel Delay</h3>
            <div className="text-xs space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">Estimated Additional Minutes:</label>
                <select
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Reason for Customer Notice:</label>
                <input
                  type="text"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowDelayModal(false)}
                className="px-3 py-1.5 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.info(`Delay of ${delayMinutes} mins broadcast to customer.`, 'Delay Transmitted');
                  setShowDelayModal(false);
                }}
                className="px-4 py-2 bg-[#3867FF] text-white font-bold rounded-lg"
              >
                Transmit Delay Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Unavailable Modal (Screen 38) */}
      {showUnavailableModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <UserX className="w-5 h-5" />
              <span>Customer Not Responding</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard protocol requires ringing door bell twice and placing at least 2 phone calls with a mandatory 15-minute grace period before no-show fee can be recorded.
            </p>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="px-3 py-1.5 text-slate-500 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.warning('Grace period timer started (15 mins). Support dispatch alerted.', 'Grace Period Active');
                  setShowUnavailableModal(false);
                }}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg"
              >
                Start 15-Min Grace Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
