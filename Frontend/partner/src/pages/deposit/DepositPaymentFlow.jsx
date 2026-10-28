import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { api } from '../../services/api';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lock,
  FileText,
  HelpCircle,
  ExternalLink,
  Receipt
} from 'lucide-react';

export const DepositPaymentFlow = () => {
  const { partner, payDeposit, depositTransactions, setActiveTab } = usePartner();

  // Sub-screens: 'INTRO' (Screen 7), 'METHOD' (Screen 8), 'PROCESSING' (Screen 9), 'RESULT' (Screen 10), 'HISTORY' (Screen 11)
  const [currentStep, setCurrentStep] = useState(
    partner?.depositStatus === 'VERIFIED' ? 'HISTORY' : 'INTRO'
  );

  const [policy, setPolicy] = useState({ amount: 5000, formatted: '₹5,000' });
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // UPI, CARD, NETBANKING
  const [upiVpa, setUpiVpa] = useState('partner@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const accountType = partner?.accountType || 'INDIVIDUAL';
  const isOrg = accountType === 'ORGANIZATION';

  useEffect(() => {
    const fetchPolicy = async () => {
      const p = await api.getDepositPolicy(accountType);
      setPolicy(p);
    };
    fetchPolicy();
  }, [accountType]);

  const handleStartPayment = async () => {
    setCurrentStep('PROCESSING');
    setIsProcessing(true);
    setErrorMessage('');

    // Payment Gateway processing & server-side verification
    setTimeout(async () => {
      try {
        const res = await payDeposit({
          method: selectedMethod === 'UPI' ? `UPI (${upiVpa})` : selectedMethod === 'CARD' ? 'Debit/Credit Card' : 'Net Banking',
          amount: policy.amount
        });
        setPaymentResult({
          success: true,
          status: 'VERIFIED',
          transactionId: res.transaction.id,
          gatewayRef: res.transaction.gatewayRef,
          amount: policy.amount,
          date: new Date().toLocaleString('en-IN')
        });
        setCurrentStep('RESULT');
      } catch (err) {
        setErrorMessage(err.message || 'Payment gateway declined transaction');
        setPaymentResult({
          success: false,
          status: 'PAYMENT_FAILED',
          amount: policy.amount
        });
        setCurrentStep('RESULT');
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Progress Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3867FF]" />
            <span>Security Deposit Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            INR escrow reserve governing partner dispatch eligibility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep('INTRO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentStep === 'INTRO' || currentStep === 'METHOD'
                ? 'bg-[#3867FF] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Deposit Details
          </button>
          <button
            onClick={() => setCurrentStep('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentStep === 'HISTORY'
                ? 'bg-[#3867FF] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            History & Ledger
          </button>
        </div>
      </div>

      {/* SCREEN 7: DEPOSIT INTRODUCTION */}
      {currentStep === 'INTRO' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            partner?.depositStatus === 'VERIFIED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <ShieldCheck className={`w-5 h-5 shrink-0 ${partner?.depositStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {partner?.depositStatus === 'VERIFIED' ? 'Security Deposit Verified' : 'Mandatory Security Deposit Required'}
                </span>
                <StatusBadge status={partner?.depositStatus || 'NOT_STARTED'} />
              </div>
              <p className="leading-relaxed">
                {partner?.depositStatus === 'VERIFIED'
                  ? 'Your security deposit is active in platform escrow. Your account meets the financial activation requirement.'
                  : 'A partner account cannot receive live job offers or appear in dispatch until the mandatory security deposit has been confirmed by the backend.'}
              </p>
            </div>
          </div>

          {/* Amount Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Authoritative Required Deposit
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline justify-center sm:justify-start gap-2">
                <CurrencyDisplay amount={policy.amount} />
                <span className="text-sm font-semibold text-slate-500">INR</span>
              </div>
              <p className="text-xs text-slate-500">
                Applicable for <strong className="text-slate-800">{isOrg ? 'Organization / Agency' : 'Individual Partner'}</strong> account.
              </p>
            </div>

            {partner?.depositStatus !== 'VERIFIED' ? (
              <button
                onClick={() => setCurrentStep('METHOD')}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#3867FF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fully Funded & Protected</span>
              </div>
            )}
          </div>

          {/* Policy Terms & Explanation */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-600 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Official Security Deposit Policy & Escrow Terms</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Separation of Funds</h4>
                <p className="text-slate-500">
                  The security deposit is strictly separated from platform commissions, customer repair payments, and partner earnings. It does not constitute a fee.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Dispatch Eligibility Barrier</h4>
                <p className="text-slate-500">
                  Unpaid partners cannot toggle availability online, cannot claim job offers, and cannot accept customer bookings.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Escrow Holding</h4>
                <p className="text-slate-500">
                  Funds are secured against customer safety protocols, property damage liabilities, and platform warranty adherence.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Refundability & Settlement</h4>
                <p className="text-slate-500">
                  Upon voluntary account termination with zero open disputes or liabilities, deposit refund may be requested subject to standard audit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 8: CHOOSE PAYMENT METHOD */}
      {currentStep === 'METHOD' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep('INTRO')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              ← Back to Overview
            </button>
            <span className="text-xs font-bold text-slate-400">Step 2: Payment Gateway Selection</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-slate-500">Total Payable Amount</p>
                <div className="text-2xl font-black text-slate-900">
                  <CurrencyDisplay amount={policy.amount} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {/* Methods Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 block">Select Preferred Payment Channel</label>

              {/* UPI Option */}
              <div
                onClick={() => setSelectedMethod('UPI')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  selectedMethod === 'UPI' ? 'border-[#3867FF] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    UPI
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">UPI Instant (Google Pay / PhonePe / Paytm / BHIM)</h4>
                    <p className="text-[11px] text-slate-500">Zero surcharge. Instant real-time server verification.</p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={selectedMethod === 'UPI'}
                  onChange={() => setSelectedMethod('UPI')}
                  className="text-[#3867FF]"
                />
              </div>

              {/* Card Option */}
              <div
                onClick={() => setSelectedMethod('CARD')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  selectedMethod === 'CARD' ? 'border-[#3867FF] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#3867FF] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Debit / Credit Card (Visa, RuPay, Mastercard)</h4>
                    <p className="text-[11px] text-slate-500">Supports all major Indian and international corporate cards.</p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={selectedMethod === 'CARD'}
                  onChange={() => setSelectedMethod('CARD')}
                  className="text-[#3867FF]"
                />
              </div>

              {/* Net Banking Option */}
              <div
                onClick={() => setSelectedMethod('NETBANKING')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  selectedMethod === 'NETBANKING' ? 'border-[#3867FF] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Net Banking (SBI, HDFC, ICICI, Axis & 50+ Banks)</h4>
                    <p className="text-[11px] text-slate-500">Direct authorized corporate and retail bank checkout.</p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={selectedMethod === 'NETBANKING'}
                  onChange={() => setSelectedMethod('NETBANKING')}
                  className="text-[#3867FF]"
                />
              </div>
            </div>

            {/* Input Details */}
            {selectedMethod === 'UPI' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">Enter UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="e.g. mobile@upi"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-[#3867FF]"
                />
              </div>
            )}

            <button
              onClick={handleStartPayment}
              className="w-full mt-4 py-3.5 px-4 bg-[#3867FF] hover:bg-blue-600 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Pay <CurrencyDisplay amount={policy.amount} /> Securely</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 9: PAYMENT PROCESSING */}
      {currentStep === 'PROCESSING' && (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Processing Security Deposit Payment</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Connecting to secure payment gateway and verifying signature. Please do not refresh or close this window.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Authoritative verification in progress...</span>
          </div>
        </div>
      )}

      {/* SCREEN 10: DEPOSIT PAYMENT RESULT */}
      {currentStep === 'RESULT' && paymentResult && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-5 animate-in zoom-in-95">
          {paymentResult.success ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Payment Verified
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Security Deposit Confirmed!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your mandatory security deposit has been authorized and verified by the server.
                </p>
              </div>

              {/* Transaction Receipt Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-left max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentResult.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Reference:</span>
                  <span className="font-mono text-slate-700">{paymentResult.gatewayRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <CurrencyDisplay amount={paymentResult.amount} className="text-slate-900" />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Timestamp:</span>
                  <span className="text-slate-700">{paymentResult.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Escrow Status:</span>
                  <StatusBadge status="VERIFIED" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('documents')}
                  className="w-full sm:w-auto px-6 py-3 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Document Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentStep('HISTORY')}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  View Deposit Ledger
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">Payment Failed</h3>
                <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
              </div>
              <button
                onClick={() => setCurrentStep('METHOD')}
                className="px-6 py-3 bg-[#3867FF] text-white font-bold text-xs rounded-xl"
              >
                Retry Payment
              </button>
            </>
          )}
        </div>
      )}

      {/* SCREEN 11: DEPOSIT HISTORY & LEDGER */}
      {currentStep === 'HISTORY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Security Deposit Transactions</h3>
              <p className="text-xs text-slate-500">Complete historical financial record of escrow deposits</p>
            </div>
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>

          {depositTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <p>No deposit transactions recorded yet.</p>
              <button
                onClick={() => setCurrentStep('INTRO')}
                className="text-[#3867FF] font-bold hover:underline"
              >
                Pay Required Deposit Now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {depositTransactions.map((txn) => (
                <div key={txn.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{txn.id}</span>
                      <StatusBadge status={txn.status} />
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {txn.method} • Ref: {txn.gatewayRef}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      {new Date(txn.date).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="text-right">
                    <CurrencyDisplay amount={txn.amount} className="text-base font-extrabold text-slate-900" />
                    <span className="block text-[10px] text-emerald-600 font-semibold">Held in Escrow</span>
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
