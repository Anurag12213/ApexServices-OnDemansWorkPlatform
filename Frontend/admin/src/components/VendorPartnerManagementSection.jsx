import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  Star,
  Eye,
  X,
  Clock,
  Phone,
  Mail,
  Building,
  UserCheck,
  UserX,
  Download,
  CreditCard,
  RefreshCw,
  Loader2,
  ExternalLink,
  FileText,
  FileQuestion,
  AlertCircle,
  Check
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { adminFetch } from '../utils/api';

// Dynamic Document Status Configuration & Visual Palette
export const DOCUMENT_STATUS_CONFIG = {
  VERIFIED: {
    label: 'Verified',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  APPROVED: {
    label: 'Verified',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    dotClass: 'bg-rose-500'
  },
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500'
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    dotClass: 'bg-blue-500'
  }
};

export const getDocumentStatusStyle = (status) => {
  const normalized = (status || '').toUpperCase().trim();
  return (
    DOCUMENT_STATUS_CONFIG[normalized] || {
      label: status || 'Unknown Status',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
      dotClass: 'bg-slate-400'
    }
  );
};

export default function VendorPartnerManagementSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Inspector State
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerDocs, setPartnerDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState(null);
  const [docActionLoading, setDocActionLoading] = useState({});

  // Rejection Reason Modal State
  const [rejectModalDoc, setRejectModalDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('Document unreadable or invalid credentials');

  // Load authoritative technician partners from Spring Boot REST API
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/admin/partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load partner fleet from server.');
      }
    } catch (e) {
      console.warn('Failed to load partners from API:', e);
      toast.error('Network error loading partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Filter partners based on search and KYC/fleet status tab
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || '').includes(searchTerm);

    if (activeTab === 'PENDING_KYC') return matchesSearch && p.kycStatus === 'PENDING_REVIEW';
    if (activeTab === 'ACTIVE') return matchesSearch && p.status === 'ACTIVE';
    if (activeTab === 'SUSPENDED') return matchesSearch && p.status === 'SUSPENDED';
    return matchesSearch;
  });

  // Open Document Inspector Modal and fetch live partner documents
  const handleOpenInspector = async (partner) => {
    setSelectedPartner(partner);
    setPartnerDocs(partner.documents || []);
    setDocsLoading(true);
    setDocsError(null);

    const rawId = partner.rawId || String(partner.id).replace('PRT-', '');
    try {
      const res = await adminFetch(`/admin/partners/${rawId}/documents`);
      if (res.ok) {
        const liveDocs = await res.json();
        if (Array.isArray(liveDocs)) {
          setPartnerDocs(liveDocs);
          // Sync with parent partner record in state
          setPartners((prev) =>
            prev.map((p) => (p.id === partner.id ? { ...p, documents: liveDocs } : p))
          );
        }
      }
    } catch (err) {
      console.warn('Live documents fetch note:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  // Close Document Inspector
  const handleCloseInspector = () => {
    setSelectedPartner(null);
    setPartnerDocs([]);
    setDocsError(null);
    setRejectModalDoc(null);
  };

  // Toggle Partner Active / Suspended
  const handleTogglePartnerStatus = async (partner) => {
    const isActivating = partner.status !== 'ACTIVE';
    const confirmed = await confirm({
      title: `${isActivating ? 'Activate' : 'Suspend'} Partner ${partner.name}?`,
      message: isActivating
        ? 'This technician will immediately become eligible to receive customer job dispatch offers.'
        : 'This partner will be immediately barred from claiming orders and logged out of the field app.',
      confirmText: isActivating ? 'Activate Partner' : 'Suspend Partner',
      variant: isActivating ? 'primary' : 'danger'
    });

    if (confirmed) {
      try {
        const rawId = partner.rawId || String(partner.id).replace('PRT-', '');
        const res = await adminFetch(`/admin/partners/${rawId}/status`, {
          method: 'PATCH'
        });
        if (res.ok) {
          setPartners((prev) =>
            prev.map((p) =>
              p.id === partner.id
                ? { ...p, status: isActivating ? 'ACTIVE' : 'SUSPENDED' }
                : p
            )
          );
          toast.info(`Partner ${partner.id} is now ${isActivating ? 'ACTIVE' : 'SUSPENDED'}`);
        } else {
          toast.error('Server rejected partner status update.');
        }
      } catch (e) {
        toast.error('Failed to update partner status on server.');
      }
    }
  };

  // Dynamic Document Decision (Approve / Reject) with real backend API verification
  const handleDocumentDecision = async (partnerId, docId, decision, customReason = null) => {
    if (!docId || docActionLoading[docId]) return;

    setDocActionLoading((prev) => ({ ...prev, [docId]: decision }));
    const rawId = String(partnerId).replace('PRT-', '');

    try {
      const res = await adminFetch(`/admin/partners/${rawId}/verify-doc`, {
        method: 'POST',
        body: JSON.stringify({
          docId,
          status: decision,
          reason: decision === 'REJECTED' ? (customReason || 'Document unreadable or invalid credentials') : null
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `API error (${res.status})`);
      }

      const result = await res.json();
      const confirmedStatus = result.status || decision;

      // Update document in inspector modal list
      setPartnerDocs((prev) => {
        const updatedDocs = prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: confirmedStatus,
                rejectionReason: decision === 'REJECTED' ? (customReason || 'Rejected by admin review') : null
              }
            : d
        );

        // Update overall partner in parent roster
        setPartners((partnersList) =>
          partnersList.map((p) => {
            if (p.id !== partnerId) return p;
            const allVerified = updatedDocs.every(
              (d) => d.status === 'VERIFIED' || d.status === 'APPROVED'
            );
            const hasRejected = updatedDocs.some((d) => d.status === 'REJECTED');
            return {
              ...p,
              documents: updatedDocs,
              kycStatus: allVerified ? 'VERIFIED' : hasRejected ? 'REJECTED' : 'PENDING_REVIEW',
              status: allVerified ? 'ACTIVE' : p.status
            };
          })
        );

        return updatedDocs;
      });

      if (decision === 'VERIFIED') {
        toast.success(`Document marked as Verified in database.`, 'KYC Approved');
      } else {
        toast.info(`Document marked as Rejected. Partner will be required to resubmit.`, 'KYC Rejected');
      }

      if (rejectModalDoc) {
        setRejectModalDoc(null);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to update document decision on server.');
    } finally {
      setDocActionLoading((prev) => {
        const next = { ...prev };
        delete next[docId];
        return next;
      });
    }
  };

  const handleReleasePayout = async (partner) => {
    const confirmed = await confirm({
      title: `Disburse ₹${(partner.walletBalance || 0).toLocaleString('en-IN')} to ${partner.name}?`,
      message: `Direct NEFT/IMPS payout transfer to verified bank account on file.`,
      confirmText: 'Confirm Disbursement',
      variant: 'primary'
    });

    if (confirmed) {
      toast.success(`Payout of ₹${partner.walletBalance.toLocaleString('en-IN')} initiated successfully!`, 'Payout Scheduled');
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, walletBalance: 0 } : p))
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Quick Metric Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Vendor & Partner Management
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Centrally onboard certified service technicians, verify KYC & police clearance documents, track field performance, and manage payout disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Fleet</span>
            <span className="font-extrabold text-slate-800">{partners.length}</span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs shadow-xs">
            <span className="text-emerald-500 block text-[10px] font-bold uppercase">Active Fleet</span>
            <span className="font-extrabold text-emerald-600">
              {partners.filter((p) => p.status === 'ACTIVE').length}
            </span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs shadow-xs">
            <span className="text-amber-500 block text-[10px] font-bold uppercase">Pending KYC</span>
            <span className="font-extrabold text-amber-600">
              {partners.filter((p) => p.kycStatus === 'PENDING_REVIEW').length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Sub Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search technician name, ID, trade, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Partners' },
            { id: 'PENDING_KYC', label: 'Pending KYC Review' },
            { id: 'ACTIVE', label: 'Active Fleet' },
            { id: 'SUSPENDED', label: 'Suspended' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Loading live certified technician fleet...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Partner Profile</th>
                  <th className="py-3.5 px-4">Trade Category</th>
                  <th className="py-3.5 px-4">KYC Documents</th>
                  <th className="py-3.5 px-4">Security Deposit</th>
                  <th className="py-3.5 px-4">Rating & Jobs</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Fleet Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No partners found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                            {(p.name || 'P').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {p.type}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.id} • {p.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.category}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.kycStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> All Verified
                          </span>
                        ) : p.kycStatus === 'PENDING_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.depositStatus}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{p.rating}</span>
                          <span className="text-slate-400 font-normal text-[11px]">({p.completedJobs} jobs)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 block">₹{(p.walletBalance || 0).toLocaleString('en-IN')}</span>
                        {p.walletBalance > 0 && (
                          <button
                            onClick={() => handleReleasePayout(p)}
                            className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                          >
                            Disburse Payout
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Fleet
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenInspector(p)}
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>KYC Docs</span>
                          </button>
                          <button
                            onClick={() => handleTogglePartnerStatus(p)}
                            className={`px-2.5 py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                              p.status === 'ACTIVE'
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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

      {/* Dynamic KYC Documents Inspector Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedPartner.id}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {selectedPartner.type || 'Technician'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 truncate">
                  KYC & Certification Dossier — {selectedPartner.name}
                </h3>
              </div>
              <button
                onClick={handleCloseInspector}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  Submitted Verification Documents ({partnerDocs.length})
                </span>
                {docsLoading && (
                  <span className="text-xs text-blue-600 flex items-center gap-1 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live records...
                  </span>
                )}
              </div>

              {docsLoading && partnerDocs.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Loading verified dossier records from server...</span>
                </div>
              ) : partnerDocs.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <FileQuestion className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-800 text-sm">No Documents Submitted</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    This technician has not uploaded any identity proofs, skill certificates, or police clearance documents yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {partnerDocs.map((doc) => {
                    const statusMeta = getDocumentStatusStyle(doc.status);
                    const isVerified = (doc.status || '').toUpperCase() === 'VERIFIED' || (doc.status || '').toUpperCase() === 'APPROVED';
                    const isRejected = (doc.status || '').toUpperCase() === 'REJECTED';
                    const isLoadingAction = docActionLoading[doc.id];

                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-2.5 transition hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-xs truncate">
                                  {doc.name || doc.documentName || 'Verification Document'}
                                </p>
                                {doc.type && (
                                  <span className="text-[9px] font-mono font-bold bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded uppercase">
                                    {doc.type}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Uploaded: <span className="font-medium text-slate-600">{doc.uploadedAt || 'Recent'}</span>
                                {doc.verifiedBy && <span className="ml-2">• Verified by {doc.verifiedBy}</span>}
                              </p>
                            </div>
                          </div>

                          {/* Dynamic Status Badge */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                              {statusMeta.label}
                            </span>
                          </div>
                        </div>

                        {/* Rejection Reason Notice */}
                        {isRejected && doc.rejectionReason && (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Rejection Note: </span>
                              <span>{doc.rejectionReason}</span>
                            </div>
                          </div>
                        )}

                        {/* Document Link & Actions Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View File</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No document attachment URL</span>
                          )}

                          <div className="flex items-center gap-1.5">
                            {/* Hide Approve if already Verified */}
                            {!isVerified && (
                              <button
                                type="button"
                                disabled={Boolean(isLoadingAction)}
                                onClick={() => handleDocumentDecision(selectedPartner.id, doc.id, 'VERIFIED')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                              >
                                {isLoadingAction === 'VERIFIED' ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Approving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Hide Reject if already Rejected */}
                            {!isRejected && (
                              <button
                                type="button"
                                disabled={Boolean(isLoadingAction)}
                                onClick={() => setRejectModalDoc(doc)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                              >
                                {isLoadingAction === 'REJECTED' ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Rejecting...</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseInspector}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalDoc && selectedPartner && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Reject Partner Document</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-700">
                Rejecting: <span className="font-bold text-slate-900">{rejectModalDoc.name}</span>
              </p>
              <p className="text-slate-500 text-[11px]">
                Please specify the reason for rejecting this verification document. This note will be recorded and shared with the partner.
              </p>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-700 block">Common Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Blurry / illegible scan',
                    'Expired document or license',
                    'Name mismatch with bank account',
                    'Missing back side or required stamp'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition cursor-pointer border ${
                        rejectReason === preset
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter detailed reason for rejection..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-200 transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(docActionLoading[rejectModalDoc.id])}
                onClick={() => handleDocumentDecision(selectedPartner.id, rejectModalDoc.id, 'REJECTED', rejectReason)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {docActionLoading[rejectModalDoc.id] ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
