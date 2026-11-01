import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  IndianRupee,
  TrendingUp,
  Download,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export const EarningsManagerScreen = () => {
  const { partner, refreshState } = usePartner();
  const { toast } = useToast();

  // Sub-tabs: 'DASHBOARD' (Sc. 46), 'HISTORY' (Sc. 47 & 48), 'METHODS' (Sc. 50 & 51), 'PAYOUTS' (Sc. 52, 53, 54)
  const [subTab, setSubTab] = useState('DASHBOARD');

  // Payout Method State (Screen 50 & 51)
  const [payoutType, setPayoutType] = useState('UPI'); // UPI or BANK
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState(partner?.fullName || '');
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [isVerifyingMethod, setIsVerifyingMethod] = useState(false);

  // Request Payout State
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Authoritative payout records (Starts empty, records populate on actual payouts)
  const [payoutsList, setPayoutsList] = useState(partner?.payouts || []);

  const earnings = partner?.earnings || {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    lifetime: 0,
    pendingPayout: 0,
    availableBalance: 0
  };

  // Sync Payouts from local storage & BroadcastChannel
  useEffect(() => {
    let syncChannel;
    try {
      syncChannel = new BroadcastChannel('apex_services_sync');
      syncChannel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'PARTNER_PAYOUT_APPROVED') {
          setPayoutsList((prev) =>
            prev.map((p) =>
              p.id === data.payoutId ? { ...p, status: 'Approved', notes: 'Admin confirmed & approved. Disbursing shortly.' } : p
            )
          );
          toast.info(
            `Withdrawal Request #${data.payoutId} has been APPROVED by Admin! Money will be credited shortly.`,
            'Withdrawal Approved'
          );
        }

        if (data.type === 'PARTNER_PAYOUT_SETTLED') {
          setPayoutsList((prev) =>
            prev.map((p) =>
              p.id === data.payoutId ? { ...p, status: 'Settled', notes: 'Payment transfer complete & cleared.' } : p
            )
          );
          if (partner?.earnings) {
            partner.earnings.pendingPayout = Math.max(0, (partner.earnings.pendingPayout || 0) - (data.netPayout || 0));
          }
          refreshState();
          toast.success(
            `Payment Done! Funds of ${data.netPayout || ''} transferred and settled into your account.`,
            'Payment Settled & Done'
          );
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    return () => {
      if (syncChannel) syncChannel.close();
    };
  }, [partner, refreshState, toast]);

  const handleRequestPayout = () => {
    if (earnings.availableBalance <= 0) {
      toast.warning('Available balance is ₹0. No balance currently eligible for payout.', 'Zero Balance');
      return;
    }

    setIsRequestingPayout(true);
    setTimeout(() => {
      const payoutAmount = earnings.availableBalance;
      const newPayout = {
        id: 'PAY-PRT-' + Math.floor(1000 + Math.random() * 9000),
        partnerName: partner?.fullName || 'Certified Specialist',
        category: partner?.tradeCategory || 'Apex Partner Service',
        date: new Date().toLocaleString('en-IN'),
        gross: `₹${Math.round(payoutAmount / 0.8).toLocaleString('en-IN')}`,
        grossBilled: `₹${Math.round(payoutAmount / 0.8).toLocaleString('en-IN')}`,
        platformCut: `₹${Math.round((payoutAmount / 0.8) * 0.2).toLocaleString('en-IN')} (20%)`,
        platformFee: Math.round((payoutAmount / 0.8) * 0.2),
        net: payoutAmount,
        netPayout: `₹${payoutAmount.toLocaleString('en-IN')}`,
        channel: payoutType === 'UPI' ? 'UPI Direct' : 'Bank NEFT',
        paymentMethod: payoutType === 'UPI' ? `UPI Direct (${upiId || 'partner@okhdfcbank'})` : `${bankName || 'HDFC Bank'} •••• ${accountNo ? accountNo.slice(-4) : '4102'}`,
        destination: payoutType === 'UPI' ? upiId || 'partner@okhdfcbank' : `${bankName || 'HDFC Bank'} •••• ${accountNo ? accountNo.slice(-4) : '4102'}`,
        status: 'Pending Approval',
        notes: 'Withdrawal requested — awaiting admin approval'
      };

      const updatedList = [newPayout, ...payoutsList];
      setPayoutsList(updatedList);

      // Save to shared localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('apex_partner_payouts') || '[]');
        localStorage.setItem('apex_partner_payouts', JSON.stringify([newPayout, ...stored]));
      } catch (e) {}

      // Broadcast to Admin Payment Operations
      try {
        const ch = new BroadcastChannel('apex_services_sync');
        ch.postMessage({ type: 'PARTNER_PAYOUT_REQUESTED', payout: newPayout });
        ch.close();
      } catch (e) {}

      if (partner) {
        if (!partner.earnings) partner.earnings = { availableBalance: 0, pendingPayout: 0 };
        partner.earnings.pendingPayout = (partner.earnings.pendingPayout || 0) + payoutAmount;
        partner.earnings.availableBalance = 0;
      }
      refreshState();
      setIsRequestingPayout(false);
      toast.info(
        `Withdrawal request for ₹${newPayout.net.toLocaleString('en-IN')} sent to Admin! Admin will review & approve it shortly.`,
        'Request Submitted'
      );
    }, 1000);
  };

  const handleAddPayoutMethod = () => {
    setIsVerifyingMethod(true);
    setTimeout(() => {
      setIsVerifyingMethod(false);
      setShowAddMethod(false);
      toast.success('Penny-drop test verified! Payout destination authenticated.', 'Account Verified');
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#3867FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Financial & Settlement Center
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-[#3867FF] shrink-0" />
            <span>Earnings, Commission & Payouts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Transparent 80% net trade payouts with direct UPI and Bank NEFT settlements
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto max-w-full no-scrollbar shrink-0 text-xs self-start lg:self-auto">
          <button
            onClick={() => setSubTab('DASHBOARD')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
              subTab === 'DASHBOARD'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Earnings Overview
          </button>
          <button
            onClick={() => setSubTab('METHODS')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
              subTab === 'METHODS'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Payout Methods
          </button>
          <button
            onClick={() => setSubTab('PAYOUTS')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
              subTab === 'PAYOUTS'
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Disbursement Ledger
          </button>
        </div>
      </div>

      {/* SCREEN 46: EARNINGS DASHBOARD */}
      {subTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Available Balance Hero Card */}
          <div className="bg-gradient-to-r from-[#172033] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Available Settlement Balance
              </span>
              <div className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2 flex-wrap">
                <CurrencyDisplay amount={earnings.availableBalance} />
                <span className="text-sm font-semibold text-slate-400">INR</span>
              </div>
              <p className="text-xs text-slate-300">
                Eligible for instant release to verified UPI/Bank destination.
              </p>
            </div>

            <button
              onClick={handleRequestPayout}
              disabled={isRequestingPayout || earnings.availableBalance <= 0}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#3867FF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <IndianRupee className="w-4 h-4 shrink-0" />
              <span>{isRequestingPayout ? 'Processing Payout...' : 'Request Instant Payout'}</span>
            </button>
          </div>

          {/* Periodical Earnings Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Today</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                <CurrencyDisplay amount={earnings.today} />
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">Net 80%</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">This Week</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                <CurrencyDisplay amount={earnings.thisWeek} />
              </div>
              <p className="text-[10px] text-slate-400">Weekly cycle</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">This Month</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                <CurrencyDisplay amount={earnings.thisMonth} />
              </div>
              <p className="text-[10px] text-slate-400">Current calendar</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Lifetime</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                <CurrencyDisplay amount={earnings.lifetime} />
              </div>
              <p className="text-[10px] text-slate-400">All-time earned</p>
            </div>
          </div>

          {/* SCREEN 49: COMMISSION BREAKDOWN & RULES */}
          <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">Platform Commission Policy Breakdown</h3>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 self-start sm:self-auto">
                80% Partner / 20% ApexServices
              </span>
            </div>

            <p className="leading-relaxed">
              Every completed service booking is governed by a flat, transparent 20% platform infrastructure fee. The partner retains 80% of the fixed category service fee.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Customer Payment</span>
                <p className="text-slate-500">Fixed category fee collected directly through ApexServices customer payment gateway.</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">20% Platform Cut</span>
                <p className="text-slate-500">Covers 24/7 customer support, warranty insurance, background checks & dispatch routing.</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">80% Net Credited</span>
                <p className="text-slate-500">Transferred automatically to your settlement ledger upon customer satisfaction OTP.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 50 & 51: PAYOUT METHOD SETUP & VERIFICATION */}
      {subTab === 'METHODS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Configured Payout Destinations</h3>
            <button
              onClick={() => setShowAddMethod(!showAddMethod)}
              className="px-3.5 py-1.5 bg-[#3867FF] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Destination</span>
            </button>
          </div>

          {/* Active Methods */}
          <div className="space-y-3">
            {upiId ? (
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    UPI
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{upiId}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Default Payout
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Verified Destination</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            ) : null}

            {bankName ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#3867FF] flex items-center justify-center font-bold text-xs">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{bankName} •••• {accountNo ? accountNo.slice(-4) : 'Account'}</h4>
                    <p className="text-xs text-slate-400">IFSC: {ifsc} • Holder: {accountHolder}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400">Linked Bank</span>
              </div>
            ) : null}

            {!upiId && !bankName && (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">No Payout Destination Linked</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Link your UPI VPA ID or Direct Bank Account to receive automatic 80% earnings settlements upon customer payment.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMethod(true)}
                  className="px-4 py-2 bg-[#3867FF] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Payout Method</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Method Form Modal / Inline */}
          {showAddMethod && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <h4 className="font-bold text-slate-900 text-sm">Add New Payout Destination</h4>

              <div className="flex gap-2">
                <button
                  onClick={() => setPayoutType('UPI')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    payoutType === 'UPI' ? 'bg-[#3867FF] text-white' : 'bg-white border text-slate-600'
                  }`}
                >
                  UPI VPA ID
                </button>
                <button
                  onClick={() => setPayoutType('BANK')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    payoutType === 'BANK' ? 'bg-[#3867FF] text-white' : 'bg-white border text-slate-600'
                  }`}
                >
                  Direct Bank Account
                </button>
              </div>

              {payoutType === 'UPI' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Enter UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@okhdfcbank"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleAddPayoutMethod}
                disabled={isVerifyingMethod}
                className="px-5 py-2.5 bg-[#3867FF] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isVerifyingMethod ? 'Verifying with ₹1 Penny-Drop...' : 'Verify & Link Destination'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 52, 53 & 54: DISBURSEMENT LEDGER */}
      {subTab === 'PAYOUTS' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Disbursement & Payout History</h3>
              <p className="text-xs text-slate-500">Authoritative audit record of settled NEFT and UPI disbursements</p>
            </div>
            <Receipt className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          {payoutsList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Disbursements Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                As service requests are completed and customer payments are verified, your 80% payout settlements will appear in this authoritative ledger.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payoutsList.map((p) => (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900">{p.id}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-slate-600 mt-1 break-words">
                      {p.channel} → <strong className="text-slate-800">{p.destination}</strong>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{p.date} • {p.notes}</p>
                  </div>

                  <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      <CurrencyDisplay amount={p.net} />
                    </div>
                    <span className="text-[10px] text-slate-400">Gross: ₹{p.gross} (20% Fee: ₹{p.platformFee})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
