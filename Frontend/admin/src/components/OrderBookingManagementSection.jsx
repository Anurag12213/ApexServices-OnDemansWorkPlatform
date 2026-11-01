import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  User,
  Wrench,
  DollarSign,
  MapPin,
  Eye,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Phone,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { adminFetch } from '../utils/api';

export default function OrderBookingManagementSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [overrideReason, setOverrideReason] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/admin/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to load bookings from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.technician || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleManualOverride = async () => {
    if (!selectedBooking) return;
    if (!overrideReason.trim()) {
      toast.error('Please enter a justification reason for manual status override.', 'Reason Required');
      return;
    }

    try {
      const res = await adminFetch(`/admin/bookings/${selectedBooking.id}/override`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason: overrideReason })
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? {
                  ...b,
                  status: newStatus,
                  timeline: [
                    ...(b.timeline || []),
                    {
                      time: 'Just now (Admin Override)',
                      text: `Status manually changed to ${newStatus}. Reason: ${overrideReason}`
                    }
                  ]
                }
              : b
          )
        );

        toast.success(`Booking ${selectedBooking.id} status updated to ${newStatus}`, 'Override Applied');
        setShowOverrideModal(false);
        setSelectedBooking(null);
        setOverrideReason('');
      } else {
        toast.error('Failed to apply override to server.');
      }
    } catch (e) {
      toast.error('Network connection error.');
    }
  };

  const handleResolveDispute = async (booking, action) => {
    const confirmed = await confirm({
      title: `${action === 'REFUND' ? 'Refund Customer & Close Dispute' : 'Schedule Warranty Revisit'}?`,
      message: `Are you sure you want to resolve dispute for ${booking.id}? This will update the escrow status in database.`,
      confirmText: action === 'REFUND' ? 'Issue Refund' : 'Assign Revisit',
      variant: action === 'REFUND' ? 'danger' : 'primary'
    });

    if (confirmed) {
      try {
        await adminFetch(`/admin/bookings/${booking.id}/override`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: action === 'REFUND' ? 'REFUNDED' : 'IN_PROGRESS',
            reason: action === 'REFUND' ? 'Admin dispute resolution: customer full refund' : 'Admin dispute resolution: warranty revisit'
          })
        });

        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? {
                  ...b,
                  status: action === 'REFUND' ? 'REFUNDED' : 'IN_PROGRESS',
                  hasDispute: false,
                  paymentStatus: action === 'REFUND' ? 'REFUNDED' : 'PAID'
                }
              : b
          )
        );
        toast.success(`Dispute on ${booking.id} resolved successfully!`, 'Dispute Resolved');
        setSelectedBooking(null);
      } catch (e) {
        toast.error('Failed to resolve dispute on server');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>;
      case 'PENDING_DISPATCH':
      case 'BROADCASTED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Pending Dispatch</span>;
      case 'DISPUTED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Disputed</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      case 'REFUNDED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Refunded</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order & Booking Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time booking dispatch lifecycle directly queried from database, dispute arbitration, and emergency status manual overrides.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Orders</span>
            <span className="font-extrabold text-slate-900">
              {bookings.filter((b) => b.status === 'IN_PROGRESS' || b.status === 'PENDING_DISPATCH' || b.status === 'BROADCASTED').length}
            </span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-red-200 text-xs shadow-xs">
            <span className="text-red-500 block text-[10px] font-bold uppercase">Disputes</span>
            <span className="font-extrabold text-red-600">
              {bookings.filter((b) => b.hasDispute).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order ID, customer, technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'PENDING_DISPATCH', 'IN_PROGRESS', 'DISPUTED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Bookings' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Querying live database work requests...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service Category</th>
                  <th className="py-3.5 px-4">Assigned Partner</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No bookings found in database matching current search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {b.id}
                        {b.hasDispute && (
                          <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" title="Open Dispute" />
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.customer}</div>
                        <div className="text-[10px] text-slate-400">{b.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {b.category}
                      </td>
                      <td className="py-3.5 px-4">
                        {b.technician === 'Unassigned' ? (
                          <span className="text-amber-600 font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Auto-Seeking...
                          </span>
                        ) : (
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-blue-500" />
                            <span>{b.technician}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{b.amount}
                        <span className="block text-[10px] text-emerald-600 font-bold">{b.paymentStatus}</span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="font-bold text-slate-700">{b.scheduledDate}</div>
                        <div className="text-slate-400">{b.scheduledTime}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[11px] transition cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setNewStatus(b.status);
                              setShowOverrideModal(true);
                            }}
                            className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded font-bold text-[11px] transition cursor-pointer"
                            title="Manual Override"
                          >
                            Override
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && !showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedBooking.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedBooking.category}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedBooking.hasDispute && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Active Dispute Raised by Customer
                </div>
                <p className="text-xs text-red-600">{selectedBooking.disputeReason}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleResolveDispute(selectedBooking, 'REFUND')}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                  >
                    Issue Full Refund
                  </button>
                  <button
                    onClick={() => handleResolveDispute(selectedBooking, 'REVISIT')}
                    className="px-3 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold text-[11px] rounded-lg transition cursor-pointer"
                  >
                    Schedule Warranty Revisit
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Customer Details</span>
                <p className="font-bold text-slate-900">{selectedBooking.customer}</p>
                <p className="text-slate-600">{selectedBooking.phone}</p>
                <p className="text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> {selectedBooking.address}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Technician Details</span>
                <p className="font-bold text-slate-900">{selectedBooking.technician}</p>
                <p className="text-slate-500">Service Fee: ₹{selectedBooking.amount}</p>
                <p className="text-emerald-600 font-bold">Payment: {selectedBooking.paymentStatus}</p>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Problem Description</span>
                <p className="text-slate-700 font-medium">{selectedBooking.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setNewStatus(selectedBooking.status);
                  setShowOverrideModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Manual Status Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Override Action Modal */}
      {showOverrideModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                Manual Override: {selectedBooking.id}
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Order Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold outline-none"
                >
                  <option value="PENDING_DISPATCH">PENDING_DISPATCH (Reset auto-dispatch)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Technician on site)</option>
                  <option value="COMPLETED">COMPLETED (Force completion)</option>
                  <option value="DISPUTED">DISPUTED (Hold escrow & arbitrate)</option>
                  <option value="CANCELLED">CANCELLED (Cancel order)</option>
                  <option value="REFUNDED">REFUNDED (Mark refunded)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mandatory Override Justification (Logged to Audit)</label>
                <textarea
                  rows="3"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Customer contacted support confirming job completed manually."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManualOverride}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Apply Override to Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
