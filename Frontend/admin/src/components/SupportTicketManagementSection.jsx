import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  User,
  Send,
  X,
  Phone,
  Mail,
  ArrowRight,
  ShieldAlert,
  Tag,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import { adminFetch } from '../utils/api';

export default function SupportTicketManagementSection() {
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const fetchTickets = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await adminFetch('/admin/tickets');
      if (res.ok) {
        const data = await res.json();
        const incoming = Array.isArray(data) ? data : [];
        setTickets(incoming);
        // If a ticket is currently selected, keep its messages updated in sync
        setSelectedTicket((current) => {
          if (!current) return null;
          const fresh = incoming.find((t) => t.id === current.id);
          return fresh || current;
        });
      }
    } catch (e) {
      console.warn('Failed to load tickets:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(false);

    // Real-time cross-tab synchronization
    let channel;
    try {
      channel = new BroadcastChannel('apex_services_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'TICKET_UPDATED' || event.data?.type === 'DATA_UPDATED') {
          fetchTickets(true);
        }
      };
    } catch (e) {}

    // Rapid background polling every 4s to catch cross-browser/cross-device partner tickets
    const interval = setInterval(() => fetchTickets(true), 4000);

    // Auto sync when admin tab regains focus
    const handleFocus = () => fetchTickets(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (channel) channel.close();
    };
  }, []);

  const getCustomerName = (t) => t?.customerName || t?.customer || 'User';
  const getWorkRequestId = (t) => t?.workRequestId || t?.relatedOrder || '';
  const getEmail = (t) => t?.customerEmail || t?.email || '';
  const getPhone = (t) => t?.customerPhone || t?.phone || '';
  const getUserType = (t) => (t?.userType || 'CUSTOMER').toUpperCase();
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(t).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getWorkRequestId(t).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserType(t).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      const res = await adminFetch(`/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text: replyMessage })
      });

      if (res.ok) {
        const data = await res.json();
        const serverMsg = data.message || {};
        const newMessage = {
          senderName: serverMsg.senderName || 'ApexServices Official Support',
          messageText: serverMsg.messageText || replyMessage,
          createdAt: serverMsg.createdAt || new Date().toISOString(),
          isStaff: true
        };

        const updatedMessages = [...(selectedTicket.messages || []), newMessage];
        const nextStatus = selectedTicket.status === 'OPEN' ? 'IN_PROGRESS' : selectedTicket.status;

        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? {
                  ...t,
                  status: nextStatus,
                  messages: updatedMessages
                }
              : t
          )
        );

        setSelectedTicket((prev) => ({
          ...prev,
          status: nextStatus,
          messages: updatedMessages
        }));

        toast.success(`Reply dispatched to ${getCustomerName(selectedTicket)}`, 'Message Sent');
        setReplyMessage('');

        // Notify partner portal instantly if open in another tab
        try {
          const bc = new BroadcastChannel('apex_services_sync');
          bc.postMessage({ type: 'TICKET_UPDATED', ticketId: selectedTicket.id });
          bc.close();
        } catch (err) {}
      } else {
        toast.error('Failed to send reply to backend');
      }
    } catch (e) {
      toast.error('Network error sending response');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await adminFetch(`/admin/tickets/${ticketId}/resolve`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: 'RESOLVED' } : t))
        );
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket((prev) => ({ ...prev, status: 'RESOLVED' }));
        }
        toast.success(`Ticket ${ticketId} resolved and closed.`, 'Ticket Resolved');

        // Notify partner portal instantly
        try {
          const bc = new BroadcastChannel('apex_services_sync');
          bc.postMessage({ type: 'TICKET_UPDATED', ticketId });
          bc.close();
        } catch (err) {}
      }
    } catch (e) {
      toast.error('Network error updating ticket');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support & Ticket Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Omnichannel customer and partner support ticketing desk. Track inquiries, assign staff, reply in real-time, and monitor SLAs.
          </p>
        </div>

        {/* Quick Ticket Stats & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-red-200 text-xs shadow-xs">
            <span className="text-red-500 block text-[10px] font-bold uppercase">Urgent Tickets</span>
            <span className="font-extrabold text-red-600">
              {tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'RESOLVED').length}
            </span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 text-xs shadow-xs">
            <span className="text-blue-500 block text-[10px] font-bold uppercase">Open Tickets</span>
            <span className="font-extrabold text-blue-600">
              {tickets.filter((t) => t.status === 'OPEN').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket, customer, subject, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Pane Ticket Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List (Left Pane) */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold">Querying support tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              No support tickets found matching criteria.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const lastMsg = (t.messages && t.messages.length > 0) ? t.messages[t.messages.length - 1] : null;
              const lastText = lastMsg ? (lastMsg.messageText || lastMsg.text) : 'No messages yet';
              const userType = getUserType(t);
              const customerName = getCustomerName(t);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {t.id}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        userType === 'PARTNER'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {userType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          t.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700 animate-pulse'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {lastText}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700">{customerName}</span>
                    <span>{formatDateTime(t.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ticket Chat & Details Inspector (Right Pane) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between min-h-[500px]">
          {selectedTicket ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {selectedTicket.id}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        getUserType(selectedTicket) === 'PARTNER'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {getUserType(selectedTicket)}
                      </span>
                      {getWorkRequestId(selectedTicket) && getWorkRequestId(selectedTicket) !== 'N/A' && (
                        <span className="text-[11px] font-bold text-slate-500">
                          Ref: {getWorkRequestId(selectedTicket)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">{selectedTicket.subject}</h3>
                    <p className="text-[11px] text-slate-500">
                      User: <strong className="text-slate-700">{getCustomerName(selectedTicket)}</strong> • {getEmail(selectedTicket) || 'No Email'} • {getPhone(selectedTicket) || 'No Phone'}
                    </p>
                  </div>

                  {selectedTicket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>

                {/* Conversation Thread */}
                <div className="my-4 space-y-3 max-h-72 overflow-y-auto pr-2">
                  {(selectedTicket.messages || []).map((msg, idx) => {
                    const isStaff = msg.isStaff || msg.staff;
                    const sender = msg.senderName || msg.sender || (isStaff ? 'Official Support Desk' : getCustomerName(selectedTicket));
                    const text = msg.messageText || msg.text || '';
                    const time = formatDateTime(msg.createdAt) || msg.timestamp || 'Just now';

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl text-xs space-y-1 ${
                          isStaff
                            ? 'bg-blue-50/70 border border-blue-200 text-blue-900 ml-8'
                            : 'bg-slate-50 border border-slate-200 text-slate-800 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-bold ${isStaff ? 'text-blue-700' : 'text-slate-600'}`}>
                            {sender}
                          </span>
                          <span className="text-slate-400">{time}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 space-y-2">
                <textarea
                  rows="3"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={`Write official support reply to ${getCustomerName(selectedTicket)}...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Support Response</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <LifeBuoy className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-600 text-sm">Select a support ticket to review</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Choose an inquiry from the left pane to view customer message thread and compose replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
