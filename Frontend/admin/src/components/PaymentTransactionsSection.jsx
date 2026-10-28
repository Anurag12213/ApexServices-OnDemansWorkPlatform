import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  RotateCcw,
  AlertOctagon,
  Filter,
  Search,
  Users,
  User,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Briefcase,
  X,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';

export default function PaymentTransactionsSection() {
  const [activePaymentTab, setActivePaymentTab] = useState('partner'); // 'partner' | 'user'
  const [notification, setNotification] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const broadcastSync = (type, payload = {}) => {
    try {
      const channel = new BroadcastChannel('apex_services_sync');
      channel.postMessage({ type, ...payload });
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel sync error:', e);
    }
  };

  // ==========================================
  // 1. PARTNER PAYMENT MANAGEMENT
  // ==========================================
  const defaultPartnerPayouts = [
    {
      id: 'PAY-PRT-801',
      partnerName: 'Rajesh Sharma',
      category: 'Custom Carpentry',
      grossBilled: '₹1,420.00',
      platformCut: '₹284.00 (20%)',
      netPayout: '₹1,136.00',
      paymentMethod: 'Bank Transfer (HDFC Bank ••4102)',
      status: 'Settled', // 'Pending Approval' | 'Approved' | 'Settled'
      date: 'Oct 09, 2026',
    },
    {
      id: 'PAY-PRT-802',
      partnerName: 'Vikram Rathore',
      category: 'Emergency Plumbing',
      grossBilled: '₹1,880.00',
      platformCut: '₹376.00 (20%)',
      netPayout: '₹1,504.00',
      paymentMethod: 'UPI Direct (vikram@okhdfcbank)',
      status: 'Pending Approval',
      date: 'Oct 08, 2026',
    },
    {
      id: 'PAY-PRT-803',
      partnerName: 'Amit Verma',
      category: 'Electrical Maintenance',
      grossBilled: '₹950.00',
      platformCut: '₹190.00 (20%)',
      netPayout: '₹760.00',
      paymentMethod: 'Bank Transfer (SBI ••9912)',
      status: 'Approved',
      date: 'Oct 07, 2026',
    },
    {
      id: 'PAY-PRT-804',
      partnerName: 'Sunil Jadhav',
      category: 'Painting & Decor',
      grossBilled: '₹640.00',
      platformCut: '₹128.00 (20%)',
      netPayout: '₹512.00',
      paymentMethod: 'UPI Direct (sunil@okicici)',
      status: 'Settled',
      date: 'Oct 06, 2026',
    },
  ];

  const [partnerPayouts, setPartnerPayouts] = useState(() => {
    try {
      const stored = localStorage.getItem('apex_partner_payouts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultPartnerPayouts;
  });

  const [partnerFilter, setPartnerFilter] = useState('All');
  const [partnerSearch, setPartnerSearch] = useState('');

  // Multi-step Process Partner Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutStep, setPayoutStep] = useState(1);
  const [payoutForm, setPayoutForm] = useState({
    partnerName: 'Vikram Rathore',
    category: 'Emergency Plumbing',
    grossBilled: 1200,
    platformRate: 20,
    channel: 'Bank NEFT Transfer',
    accountNumber: 'HDFC •••• 9921',
    notes: 'Bi-weekly settlement for completed service requests',
  });

  // Step 1: Admin Approves Partner Withdrawal Request (Confirms request is valid with no issues)
  const handleApprovePartnerPayout = (id) => {
    let updatedPayout;
    setPartnerPayouts((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedPayout = { ...p, status: 'Approved' };
          return updatedPayout;
        }
        return p;
      });
      try {
        localStorage.setItem('apex_partner_payouts', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    broadcastSync('PARTNER_PAYOUT_APPROVED', {
      payoutId: id,
      partnerName: updatedPayout?.partnerName,
      status: 'Approved',
    });

    showToast(`Step 1 Complete: Payout ${id} APPROVED. Notification dispatched to Partner. Ready for payment disbursement.`);
  };

  // Step 2: Admin Makes Payment and Marks it Settled / Done
  const handleSettlePartnerPayout = (id) => {
    let settledPayout;
    setPartnerPayouts((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          settledPayout = { ...p, status: 'Settled' };
          return settledPayout;
        }
        return p;
      });
      try {
        localStorage.setItem('apex_partner_payouts', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    broadcastSync('PARTNER_PAYOUT_SETTLED', {
      payoutId: id,
      partnerName: settledPayout?.partnerName,
      netPayout: settledPayout?.netPayout,
      status: 'Settled',
    });

    showToast(`Step 2 Complete: Payment for ${id} transferred & SETTLED! Partner notified of fund arrival.`);
  };

  const handleExecutePartnerPayout = (e) => {
    e.preventDefault();
    const net = payoutForm.grossBilled * (1 - payoutForm.platformRate / 100);
    const cut = payoutForm.grossBilled * (payoutForm.platformRate / 100);

    const newPayout = {
      id: 'PAY-PRT-' + Math.floor(100 + Math.random() * 900),
      partnerName: payoutForm.partnerName,
      category: payoutForm.category,
      grossBilled: `₹${payoutForm.grossBilled.toFixed(2)}`,
      platformCut: `₹${cut.toFixed(2)} (${payoutForm.platformRate}%)`,
      netPayout: `₹${net.toFixed(2)}`,
      paymentMethod: payoutForm.channel,
      status: 'Pending Approval',
      date: 'Today',
    };

    const next = [newPayout, ...partnerPayouts];
    setPartnerPayouts(next);
    try {
      localStorage.setItem('apex_partner_payouts', JSON.stringify(next));
    } catch (e) {}

    showToast(`Payout request ${newPayout.id} logged. Awaiting Step 1 Admin Approval.`);
    setShowPayoutModal(false);
    setPayoutStep(1);
  };

  // ==========================================
  // 2. USER PAYMENT & REFUND MANAGEMENT
  // ==========================================
  const defaultUserTransactions = [
    {
      id: 'TXN-90812',
      customer: 'Anurag Sharma',
      email: 'customer@example.com',
      serviceTicket: 'REQ-1001',
      service: 'Custom Carpentry',
      gateway: 'UPI Instant (GPay)',
      amount: '₹499.00',
      status: 'Completed', // 'Completed' | 'Dispute / Refund Requested' | 'Refund Approved' | 'Refunded'
      date: 'Oct 09, 2026 14:20',
      disputeReason: '',
    },
    {
      id: 'TXN-90813',
      customer: 'Priya Sharma',
      email: 'priya.s@yahoo.com',
      serviceTicket: 'REQ-1002',
      service: 'Emergency Plumbing',
      gateway: 'UPI Instant (PhonePe)',
      amount: '₹399.00',
      status: 'Dispute / Refund Requested',
      date: 'Oct 08, 2026 11:15',
      disputeReason: 'Technician was delayed by 1 hour and required partial re-work.',
    },
    {
      id: 'TXN-90814',
      customer: 'David Miller',
      email: 'dmiller@tech.io',
      serviceTicket: 'REQ-1003',
      service: 'Electrical Maintenance',
      gateway: 'Razorpay Credit Card',
      amount: '₹349.00',
      status: 'Refund Approved',
      date: 'Oct 08, 2026 09:30',
      disputeReason: 'Billed twice due to bank gateway timeout.',
    },
    {
      id: 'TXN-90815',
      customer: 'Rohan Mehta',
      email: 'rohan.mehta@outlook.com',
      serviceTicket: 'REQ-1004',
      service: 'Painting & Decor',
      gateway: 'HDFC Net Banking',
      amount: '₹599.00',
      status: 'Refunded',
      date: 'Oct 07, 2026 16:05',
      disputeReason: 'Cancelled prior to partner arrival.',
    },
  ];

  const [userTransactions, setUserTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem('apex_user_refunds');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultUserTransactions;
  });

  const [userFilter, setUserFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');

  // Step 1: Admin Approves Customer Refund Request
  const handleApproveUserRefund = (id) => {
    let approvedTxn;
    setUserTransactions((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          approvedTxn = { ...t, status: 'Refund Approved' };
          return approvedTxn;
        }
        return t;
      });
      try {
        localStorage.setItem('apex_user_refunds', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    broadcastSync('USER_REFUND_APPROVED', {
      txnId: id,
      ticket: approvedTxn?.serviceTicket,
      customer: approvedTxn?.customer,
      amount: approvedTxn?.amount,
      status: 'Refund Approved',
    });

    showToast(`Step 1 Complete: Refund claim for ${id} APPROVED. Notification sent to customer.`);
  };

  // Step 2: Admin Settles Payment & Marks Refund Done
  const handleSettleUserRefund = (id) => {
    let settledTxn;
    setUserTransactions((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          settledTxn = { ...t, status: 'Refunded' };
          return settledTxn;
        }
        return t;
      });
      try {
        localStorage.setItem('apex_user_refunds', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    broadcastSync('USER_REFUND_SETTLED', {
      txnId: id,
      ticket: settledTxn?.serviceTicket,
      customer: settledTxn?.customer,
      amount: settledTxn?.amount,
      status: 'Refunded',
    });

    showToast(`Step 2 Complete: Refund for ${id} SETTLED & MARKED DONE! Money returned to customer source.`);
  };

  // Cross-portal Broadcast Listener
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('apex_services_sync');
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        // When a partner requests a withdrawal
        if (data.type === 'PARTNER_PAYOUT_REQUESTED' && data.payout) {
          setPartnerPayouts((prev) => {
            if (prev.some((p) => p.id === data.payout.id)) return prev;
            const updated = [data.payout, ...prev];
            try {
              localStorage.setItem('apex_partner_payouts', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
          showToast(`New Partner Withdrawal Request received: ${data.payout.id} (${data.payout.partnerName})`);
        }

        // When a customer raises a support dispute / refund
        if (data.type === 'USER_REFUND_REQUESTED' && data.ticket) {
          setUserTransactions((prev) => {
            const matchIndex = prev.findIndex((t) => t.serviceTicket === data.ticket.serviceTicket || t.id === data.ticket.id);
            let updated;
            if (matchIndex >= 0) {
              updated = prev.map((t, idx) =>
                idx === matchIndex
                  ? { ...t, status: 'Dispute / Refund Requested', disputeReason: data.ticket.reason || 'Customer Support Dispute' }
                  : t
              );
            } else {
              updated = [
                {
                  id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
                  customer: data.ticket.customerName || 'Customer',
                  email: data.ticket.customerEmail || 'customer@example.com',
                  serviceTicket: data.ticket.serviceTicket || data.ticket.id,
                  service: data.ticket.serviceCategory || 'Home Service',
                  gateway: 'UPI / Online Gateway',
                  amount: data.ticket.amount || '₹499.00',
                  status: 'Dispute / Refund Requested',
                  date: 'Just now',
                  disputeReason: data.ticket.reason || 'Customer raised service ticket',
                },
                ...prev,
              ];
            }
            try {
              localStorage.setItem('apex_user_refunds', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
          showToast(`Customer Dispute Ticket logged for ${data.ticket.serviceTicket || data.ticket.id}. Awaiting Admin Review.`);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  // Multi-step Refund Modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundStep, setRefundStep] = useState(1);
  const [selectedTxnForRefund, setSelectedTxnForRefund] = useState(null);
  const [refundForm, setRefundForm] = useState({
    reason: 'Customer Cancellation prior to arrival',
    type: 'Full Refund',
    amount: '',
    deductFee: false,
  });

  const handleOpenRefund = (txn) => {
    setSelectedTxnForRefund(txn);
    setRefundForm({
      reason: 'Customer Cancellation prior to arrival',
      type: 'Full Refund',
      amount: txn.amount.replace('$', ''),
      deductFee: false,
    });
    setRefundStep(1);
    setShowRefundModal(true);
  };

  const handleExecuteRefund = (e) => {
    e.preventDefault();
    setUserTransactions((prev) =>
      prev.map((t) => (t.id === selectedTxnForRefund.id ? { ...t, status: 'Refunded' } : t))
    );
    showToast(`Refund processed for ${selectedTxnForRefund.id} (${selectedTxnForRefund.customer}).`);
    setShowRefundModal(false);
    setSelectedTxnForRefund(null);
    setRefundStep(1);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment & Transaction Operations</h1>
          <p className="text-sm text-slate-500">
            Reconcile specialist payouts and monitor customer gateway collections
          </p>
        </div>

        {/* 2 Options Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActivePaymentTab('partner')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activePaymentTab === 'partner'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Partner Payment Management</span>
          </button>

          <button
            onClick={() => setActivePaymentTab('user')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activePaymentTab === 'user'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-purple-600" />
            <span>User Payment Management</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* OPTION 1: PARTNER PAYMENT MANAGEMENT                     */}
      {/* ======================================================== */}
      {activePaymentTab === 'partner' && (
        <div className="space-y-6">
          {/* Partner Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Settled to Partners</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">$14,850.00</p>
              <p className="text-[11px] text-slate-400 mt-0.5">80% Specialist direct earnings</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Pending Payout Approvals</span>
              <p className="text-xl font-bold text-amber-600 mt-1">
                {partnerPayouts.filter((p) => p.status === 'Pending Approval').length} Requests ($2,264.00)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting admin dispatch clearance</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Platform Share Collected (20%)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">$3,712.50</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Net platform margin retainage</p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search partner or payout ID..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium"
              >
                <option value="All">All Settlements</option>
                <option value="Settled">Settled</option>
                <option value="Pending Approval">Pending Approval</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowPayoutModal(true);
                setPayoutStep(1);
              }}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
            >
              <DollarSign className="w-4 h-4" />
              <span>Process Partner Payout</span>
            </button>
          </div>

          {/* Partner Payouts Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Payout Reference</th>
                  <th className="p-3.5">Partner & Trade</th>
                  <th className="p-3.5">Gross Billing</th>
                  <th className="p-3.5">Platform Cut</th>
                  <th className="p-3.5">Net Payout</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerPayouts
                  .filter((p) => {
                    const matchSearch =
                      p.id.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                      p.partnerName.toLowerCase().includes(partnerSearch.toLowerCase());
                    const matchStatus = partnerFilter === 'All' || p.status === partnerFilter;
                    return matchSearch && matchStatus;
                  })
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900">{p.id}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.date}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{p.partnerName}</p>
                        <p className="text-[11px] text-slate-500">{p.category}</p>
                      </td>

                      <td className="p-3.5 font-medium text-slate-700">{p.grossBilled}</td>

                      <td className="p-3.5 text-slate-500">{p.platformCut}</td>

                      <td className="p-3.5 font-bold text-slate-900 text-sm">{p.netPayout}</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            p.status === 'Settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'Approved'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {p.status === 'Settled' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {p.status === 'Approved' && <Check className="w-3 h-3 text-blue-600" />}
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        {p.status === 'Pending Approval' ? (
                          <button
                            onClick={() => handleApprovePartnerPayout(p.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[11px] shadow-xs transition cursor-pointer"
                            title="Step 1: Confirm payment has no problem and approve"
                          >
                            Approve Payout
                          </button>
                        ) : p.status === 'Approved' ? (
                          <button
                            onClick={() => handleSettlePartnerPayout(p.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] shadow-xs transition cursor-pointer inline-flex items-center gap-1"
                            title="Step 2: Make payout and mark done"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Make Payment & Settle</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cleared & Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* OPTION 2: USER PAYMENT MANAGEMENT                        */}
      {/* ======================================================== */}
      {activePaymentTab === 'user' && (
        <div className="space-y-6">
          {/* User Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Customer Payments</span>
              <p className="text-xl font-bold text-slate-900 mt-1">$18,562.50</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Card, UPI & Gateway Settlements</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Gateway Success Rate</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">98.4%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Average settlement latency &lt; 2.5s</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Refunds & Disputed Adjustments</span>
              <p className="text-xl font-bold text-rose-600 mt-1">$330.00 (1.8%)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">2 customer refund reversals</p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, ticket or TXN ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium"
              >
                <option value="All">All Transactions</option>
                <option value="Completed">Completed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* User Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Transaction ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Service Order</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userTransactions
                  .filter((t) => {
                    const matchSearch =
                      t.id.toLowerCase().includes(userSearch.toLowerCase()) ||
                      t.customer.toLowerCase().includes(userSearch.toLowerCase()) ||
                      t.serviceTicket.toLowerCase().includes(userSearch.toLowerCase());
                    const matchStatus = userFilter === 'All' || t.status === userFilter;
                    return matchSearch && matchStatus;
                  })
                  .map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900">{txn.id}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{txn.date}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{txn.customer}</p>
                        <p className="text-[11px] text-slate-400">{txn.email}</p>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-blue-600 font-bold">{txn.serviceTicket}</span>
                        <p className="text-[11px] text-slate-500">{txn.service}</p>
                      </td>

                      <td className="p-3.5 font-medium text-slate-600">{txn.gateway}</td>

                      <td className="p-3.5 font-bold text-slate-900">{txn.amount}</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            txn.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : txn.status === 'Refund Approved'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : txn.status === 'Refunded'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {txn.status === 'Refunded' && <RotateCcw className="w-3 h-3 text-rose-600" />}
                          {txn.status === 'Refund Approved' && <Check className="w-3 h-3 text-blue-600" />}
                          {txn.status}
                        </span>
                        {txn.disputeReason && (
                          <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate" title={txn.disputeReason}>
                            Reason: {txn.disputeReason}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        {txn.status === 'Dispute / Refund Requested' ? (
                          <button
                            onClick={() => handleApproveUserRefund(txn.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[11px] shadow-xs transition cursor-pointer"
                            title="Step 1: Admin verifies problem and approves refund"
                          >
                            Approve Refund
                          </button>
                        ) : txn.status === 'Refund Approved' ? (
                          <button
                            onClick={() => handleSettleUserRefund(txn.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] shadow-xs transition cursor-pointer inline-flex items-center gap-1"
                            title="Step 2: Admin settles payment back to user and marks it done"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Settle & Mark Refunded</span>
                          </button>
                        ) : txn.status === 'Completed' ? (
                          <button
                            onClick={() => handleOpenRefund(txn)}
                            className="px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-md font-semibold text-[11px] transition cursor-pointer"
                          >
                            Refund / Adjust
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Reversed & Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: MULTI-STEP PARTNER PAYOUT WORKFLOW              */}
      {/* ======================================================== */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Release Partner Settlement</h3>
                <p className="text-xs text-slate-500">Step {payoutStep} of 3</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(payoutStep / 3) * 100}%` }}
              />
            </div>

            {/* STEP 1: PARTNER SELECTION & BILLING */}
            {payoutStep === 1 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Specialist</label>
                  <select
                    value={payoutForm.partnerName}
                    onChange={(e) => setPayoutForm({ ...payoutForm, partnerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option>Vikram Rathore (Emergency Plumbing)</option>
                    <option>Rajesh Sharma (Custom Carpentry)</option>
                    <option>Amit Verma (Electrical Maintenance)</option>
                    <option>Sunil Jadhav (Painting & Decor)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gross Jobs Billed ($)</label>
                    <input
                      type="number"
                      value={payoutForm.grossBilled}
                      onChange={(e) =>
                        setPayoutForm({ ...payoutForm, grossBilled: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Platform Share %</label>
                    <input
                      type="number"
                      value={payoutForm.platformRate}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg outline-none text-slate-500 font-bold"
                    />
                  </div>
                </div>

                {/* Calculation Snapshot */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Billings:</span>
                    <span className="font-bold text-slate-800">${payoutForm.grossBilled.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Platform Cut (20%):</span>
                    <span className="text-rose-600 font-medium">
                      -${(payoutForm.grossBilled * 0.2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-xs font-bold">
                    <span className="text-slate-900">Net Partner Payout:</span>
                    <span className="text-emerald-600">${(payoutForm.grossBilled * 0.8).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPayoutStep(2)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Continue to Payment Channel ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHANNEL & ACCOUNT */}
            {payoutStep === 2 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disbursement Gateway</label>
                  <select
                    value={payoutForm.channel}
                    onChange={(e) => setPayoutForm({ ...payoutForm, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                  >
                    <option>Bank NEFT Transfer</option>
                    <option>Instant UPI Settlement</option>
                    <option>Stripe Connect Payout</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account / UPI Verification</label>
                  <input
                    type="text"
                    value={payoutForm.accountNumber}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Internal Reference Notes</label>
                  <textarea
                    rows={2}
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setPayoutStep(1)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Review & Authorize ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AUTHORIZATION & RELEASE */}
            {payoutStep === 3 && (
              <form onSubmit={handleExecutePartnerPayout} className="space-y-3.5 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Authorize Net Transfer: ${(payoutForm.grossBilled * 0.8).toFixed(2)}</span>
                  </div>
                  <p className="text-emerald-700 text-[11px] leading-relaxed">
                    Beneficiary: <strong>{payoutForm.partnerName}</strong> ({payoutForm.category}) via {payoutForm.channel}.
                  </p>
                </div>

                <p className="text-[11px] text-slate-500">
                  By confirming, this amount will be debited from company merchant balance and sent via automated payout dispatch.
                </p>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setPayoutStep(2)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs"
                  >
                    Confirm & Release Payout
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: MULTI-STEP CUSTOMER REFUND WORKFLOW             */}
      {/* ======================================================== */}
      {showRefundModal && selectedTxnForRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Process User Refund</h3>
                <p className="text-xs text-slate-500">Step {refundStep} of 3</p>
              </div>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-300"
                style={{ width: `${(refundStep / 3) * 100}%` }}
              />
            </div>

            {/* STEP 1: TRANSACTION & REASON */}
            {refundStep === 1 && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Selected Transaction</span>
                  <p className="font-bold text-slate-900">{selectedTxnForRefund.id} ({selectedTxnForRefund.amount})</p>
                  <p className="text-slate-500">Customer: {selectedTxnForRefund.customer} • Ticket: {selectedTxnForRefund.serviceTicket}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Refund / Adjustment</label>
                  <select
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                  >
                    <option>Customer Cancellation prior to arrival</option>
                    <option>Technician delayed / reschedule failed</option>
                    <option>Founder Guarantee Quality Dispute</option>
                    <option>Duplicate Payment Charge</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRefundStep(2)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Continue to Refund Amount ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: AMOUNT CALCULATION */}
            {refundStep === 2 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund Type</label>
                  <div className="flex gap-2">
                    {['Full Refund', 'Partial Adjustment'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setRefundForm({ ...refundForm, type: t })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${
                          refundForm.type === t
                            ? 'border-rose-600 bg-rose-50 text-rose-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund Amount ($)</label>
                  <input
                    type="number"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setRefundStep(1)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundStep(3)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    Authorize Reversal ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AUTHORIZATION */}
            {refundStep === 3 && (
              <form onSubmit={handleExecuteRefund} className="space-y-3.5 text-xs">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                    <span>Confirm Gateway Reversal: ${refundForm.amount}</span>
                  </div>
                  <p className="text-rose-700 text-[11px]">
                    Destination: Original source payment method via {selectedTxnForRefund.gateway}.
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setRefundStep(2)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-lg text-xs"
                  >
                    Execute Refund Reversal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
