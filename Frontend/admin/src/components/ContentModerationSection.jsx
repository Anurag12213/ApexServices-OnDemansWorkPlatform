import React, { useState } from 'react';
import {
  ShieldAlert,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  Search,
  MessageSquare,
  Image as ImageIcon,
  User,
  Wrench,
  AlertTriangle,
  Flag,
  Trash2
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

export default function ContentModerationSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState('REVIEWS'); // REVIEWS or JOB_PHOTOS
  const [filterStatus, setFilterStatus] = useState('FLAGGED'); // FLAGGED, PENDING, APPROVED, REJECTED
  const [searchTerm, setSearchTerm] = useState('');

  // Customer Reviews Moderation Queue
  const [reviews, setReviews] = useState([
    {
      id: 'REV-401',
      customerName: 'Kunal Kapoor',
      rating: 1,
      serviceName: 'Emergency Plumbing',
      technicianName: 'Vikram Singh (PRT-103)',
      comment: 'Terrible attitude. Left tools behind and charged extra cash unprofessionally.',
      status: 'FLAGGED',
      flagReason: 'Partner flagged: Allegation of cash extortion without evidence',
      timestamp: '2 hours ago',
      orderId: 'ORD-8941'
    },
    {
      id: 'REV-402',
      customerName: 'Meenakshi Sundaram',
      rating: 5,
      serviceName: 'Deep Home Cleaning',
      technicianName: 'Vikram Singh (PRT-102)',
      comment: 'Exceptional perfection! Whole villa looks brand new. Very respectful team.',
      status: 'APPROVED',
      flagReason: null,
      timestamp: 'Yesterday',
      orderId: 'ORD-8910'
    },
    {
      id: 'REV-403',
      customerName: 'Anonymous Homeowner',
      rating: 1,
      serviceName: 'Electrical Maintenance',
      technicianName: 'Ramesh Patel (PRT-104)',
      comment: 'Call 9811223344 for cheap direct service without platform commission scam.',
      status: 'FLAGGED',
      flagReason: 'Automated filter: External contact phone number solicitation',
      timestamp: 'Oct 30, 2026',
      orderId: 'ORD-8876'
    }
  ]);

  // Partner Job Completion Proof Photos
  const [proofPhotos, setProofPhotos] = useState([
    {
      id: 'PRF-701',
      technicianName: 'Rajesh Sharma',
      serviceName: 'Custom Carpentry & Shelf Fitting',
      orderId: 'ORD-9018',
      beforePhoto: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80',
      afterPhoto: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80',
      status: 'PENDING',
      timestamp: '3 hours ago'
    },
    {
      id: 'PRF-702',
      technicianName: 'Anil Kumar',
      serviceName: 'AC Jet Wash Deep Service',
      orderId: 'ORD-9024',
      beforePhoto: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80',
      afterPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      status: 'APPROVED',
      timestamp: 'Oct 31, 2026'
    }
  ]);

  const handleReviewAction = (id, newStatus) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    toast.success(`Review ${id} marked as ${newStatus}`, 'Moderation Action Taken');
  };

  const handlePhotoAction = (id, newStatus) => {
    setProofPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    toast.success(`Proof photo ${id} marked as ${newStatus}`, 'Photo Audit Updated');
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 14 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Content Moderation Tools</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain platform trust and quality: review reported customer feedback, filter abusive ratings, and audit technician job completion photos.
          </p>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab('REVIEWS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REVIEWS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Reviews ({reviews.filter((r) => r.status === 'FLAGGED').length} Flagged)</span>
          </button>
          <button
            onClick={() => setActiveTab('JOB_PHOTOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'JOB_PHOTOS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Job Proof Photos ({proofPhotos.filter((p) => p.status === 'PENDING').length} Pending)</span>
          </button>
        </div>
      </div>

      {activeTab === 'REVIEWS' ? (
        <div className="space-y-4">
          {/* Status filter bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search review text, customer, order #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'FLAGGED', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterStatus === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
                No reviews found for this moderation filter.
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 bg-white rounded-xl border transition ${
                    r.status === 'FLAGGED' ? 'border-amber-300 shadow-xs bg-amber-50/20' : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {r.id}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{r.customerName}</span>
                      <span className="text-[10px] text-slate-400">for {r.serviceName} ({r.orderId})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500 font-bold text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          r.status === 'FLAGGED'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">"{r.comment}"</p>

                  {r.flagReason && (
                    <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{r.flagReason}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400">Partner: {r.technicianName} • {r.timestamp}</span>

                    <div className="flex items-center gap-2">
                      {r.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleReviewAction(r.id, 'APPROVED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      )}
                      {r.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleReviewAction(r.id, 'REJECTED')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject & Hide</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Job Proof Photos Queue */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proofPhotos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {p.id} • {p.orderId}
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 mt-1">{p.serviceName}</h4>
                  <p className="text-[10px] text-slate-400">Technician: {p.technicianName} • {p.timestamp}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Before Service</span>
                  <img
                    src={p.beforePhoto}
                    alt="Before Service"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">After Completion</span>
                  <img
                    src={p.afterPhoto}
                    alt="After Service"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {p.status !== 'APPROVED' && (
                  <button
                    onClick={() => handlePhotoAction(p.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                  >
                    Verify & Release Payout
                  </button>
                )}
                {p.status !== 'REJECTED' && (
                  <button
                    onClick={() => handlePhotoAction(p.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
                  >
                    Reject Quality Proof
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
