import React, { useState } from 'react';
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
  Tag
} from 'lucide-react';
import { useToast } from './Toast';

export default function SupportTicketManagementSection() {
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const [tickets, setTickets] = useState([
    {
      id: 'TCK-501',
      subject: 'Technician 30 minutes late for Emergency Plumbing',
      customer: 'Siddharth Rao',
      email: 'siddharth.r@gmail.com',
      phone: '+91 98840 12345',
      userType: 'CUSTOMER',
      priority: 'URGENT',
      category: 'DISPATCH_DELAY',
      status: 'OPEN',
      assignedTo: 'Karan Singhal',
      createdAt: '15 mins ago',
      relatedOrder: 'ORD-9022',
      messages: [
        {
          sender: 'Siddharth Rao (Customer)',
          text: 'I booked emergency plumbing 45m guaranteed dispatch. It has been 1 hour and the partner is not picking up his phone. Main line is leaking water.',
          timestamp: '15 mins ago',
          isStaff: false
        }
      ]
    },
    {
      id: 'TCK-502',
      subject: 'Security Deposit refund status inquiry',
      customer: 'Vikram Singh (Technician)',
      email: 'vikram.singh@gmail.com',
      phone: '+91 99123 44556',
      userType: 'PARTNER',
      priority: 'MEDIUM',
      category: 'DEPOSIT_REFUND',
      status: 'IN_PROGRESS',
      assignedTo: 'Megha Nair',
      createdAt: '2 hours ago',
      relatedOrder: 'N/A',
      messages: [
        {
          sender: 'Vikram Singh (Partner)',
          text: 'I have deactivated my partner account and cleared all pending orders. When will my ₹5,000 security deposit be credited to my bank?',
          timestamp: '2 hours ago',
          isStaff: false
        },
        {
          sender: 'Megha Nair (Finance Staff)',
          text: 'Hello Vikram, we are performing the standard 7-day liability audit on past completed jobs. If no customer complaints are pending, transfer will initiate tomorrow.',
          timestamp: '1 hour ago',
          isStaff: true
        }
      ]
    },
    {
      id: 'TCK-503',
      subject: 'Double charge on Razorpay UPI payment',
      customer: 'Deepa Krishnan',
      email: 'deepa.k@outlook.com',
      phone: '+91 97110 55667',
      userType: 'CUSTOMER',
      priority: 'HIGH',
      category: 'BILLING_DISPUTE',
      status: 'RESOLVED',
      assignedTo: 'Megha Nair',
      createdAt: 'Yesterday',
      relatedOrder: 'ORD-8941',
      messages: [
        {
          sender: 'Deepa Krishnan',
          text: 'Money was deducted twice from my GPay for order #ORD-8941 (₹599 x 2). Please refund the duplicate.',
          timestamp: 'Yesterday 10:14 AM',
          isStaff: false
        },
        {
          sender: 'Megha Nair (Finance Staff)',
          text: 'Refund of ₹599 processed via Razorpay API (Ref: RFND-88219). Funds should reflect in 24-48 hours.',
          timestamp: 'Yesterday 11:30 AM',
          isStaff: true
        }
      ]
    }
  ]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.relatedOrder.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    const newMessage = {
      sender: 'ApexServices Support Team',
      text: replyMessage,
      timestamp: 'Just now',
      isStaff: true
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status,
              messages: [...t.messages, newMessage]
            }
          : t
      )
    );

    setSelectedTicket((prev) => ({
      ...prev,
      status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status,
      messages: [...prev.messages, newMessage]
    }));

    toast.success(`Reply dispatched to ${selectedTicket.customer}`, 'Message Sent');
    setReplyMessage('');
  };

  const handleResolveTicket = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'RESOLVED' } : t))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => ({ ...prev, status: 'RESOLVED' }));
    }
    toast.success(`Ticket ${ticketId} resolved and closed.`, 'Ticket Resolved');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 8 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support & Ticket Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Omnichannel customer and partner support ticketing desk. Track inquiries, assign staff, reply in real-time, and monitor SLAs.
          </p>
        </div>

        {/* Quick Ticket Stats */}
        <div className="flex items-center gap-3">
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
          {filteredTickets.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              No support tickets found matching criteria.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
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
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.id}
                    </span>
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
                    {t.messages[t.messages.length - 1]?.text}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700">{t.customer}</span>
                    <span>{t.createdAt}</span>
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
                      {selectedTicket.relatedOrder !== 'N/A' && (
                        <span className="text-[11px] font-bold text-slate-500">
                          Ref: {selectedTicket.relatedOrder}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">{selectedTicket.subject}</h3>
                    <p className="text-[11px] text-slate-500">
                      User: {selectedTicket.customer} ({selectedTicket.email} • {selectedTicket.phone})
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
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        msg.isStaff
                          ? 'bg-blue-50/70 border border-blue-200 text-blue-900 ml-8'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${msg.isStaff ? 'text-blue-700' : 'text-slate-600'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-slate-400">{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 space-y-2">
                <textarea
                  rows="3"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={`Write official support reply to ${selectedTicket.customer}...`}
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
