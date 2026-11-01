import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

export default function VendorPartnerManagementSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_KYC, ACTIVE, SUSPENDED
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [verificationModalDoc, setVerificationModalDoc] = useState(null);

  const [partners, setPartners] = useState([
    {
      id: 'PRT-101',
      name: 'Rajesh Sharma',
      type: 'INDIVIDUAL',
      phone: '+91 98765 11223',
      email: 'rajesh.sharma@apexservices.com',
      category: 'Custom Carpentry & Woodwork',
      joinedDate: 'Jan 15, 2026',
      kycStatus: 'VERIFIED',
      depositStatus: 'PAID (₹5,000)',
      rating: 4.9,
      completedJobs: 142,
      walletBalance: 12450,
      activeJobs: 1,
      status: 'ACTIVE',
      documents: [
        { id: 'DOC-1', name: 'Aadhaar Card (Front/Back)', status: 'VERIFIED', url: '#', uploadedAt: 'Jan 15, 2026' },
        { id: 'DOC-2', name: 'Trade Skill Certification', status: 'VERIFIED', url: '#', uploadedAt: 'Jan 15, 2026' },
        { id: 'DOC-3', name: 'Police Clearance Certificate', status: 'VERIFIED', url: '#', uploadedAt: 'Jan 16, 2026' }
      ]
    },
    {
      id: 'PRT-102',
      name: 'Apex Pro Cleaners LLP',
      type: 'ORGANIZATION',
      phone: '+91 98450 77889',
      email: 'ops@apexprocleaners.in',
      category: 'Deep Home Cleaning, Sanitization',
      joinedDate: 'Feb 10, 2026',
      kycStatus: 'PENDING_REVIEW',
      depositStatus: 'PAID (₹15,000)',
      rating: 4.7,
      completedJobs: 89,
      walletBalance: 34800,
      activeJobs: 2,
      status: 'PENDING_VERIFICATION',
      documents: [
        { id: 'DOC-4', name: 'GSTIN & Incorporation Certificate', status: 'PENDING_REVIEW', url: '#', uploadedAt: 'Oct 28, 2026' },
        { id: 'DOC-5', name: 'Director Aadhaar & PAN Card', status: 'VERIFIED', url: '#', uploadedAt: 'Oct 28, 2026' },
        { id: 'DOC-6', name: 'Commercial Liability Insurance', status: 'PENDING_REVIEW', url: '#', uploadedAt: 'Oct 29, 2026' }
      ]
    },
    {
      id: 'PRT-103',
      name: 'Vikram Singh',
      type: 'INDIVIDUAL',
      phone: '+91 99123 44556',
      email: 'vikram.singh@gmail.com',
      category: 'Emergency Plumbing, Pipeline Repair',
      joinedDate: 'Mar 02, 2026',
      kycStatus: 'REJECTED',
      depositStatus: 'PENDING (₹5,000)',
      rating: 3.4,
      completedJobs: 12,
      walletBalance: 1200,
      activeJobs: 0,
      status: 'SUSPENDED',
      rejectionReason: 'PCC copy was blurry and expired beyond 12 months.',
      documents: [
        { id: 'DOC-7', name: 'Aadhaar Card', status: 'VERIFIED', url: '#', uploadedAt: 'Mar 02, 2026' },
        { id: 'DOC-8', name: 'Police Clearance Certificate', status: 'REJECTED', url: '#', uploadedAt: 'Mar 02, 2026' }
      ]
    },
    {
      id: 'PRT-104',
      name: 'Ramesh Patel',
      type: 'INDIVIDUAL',
      phone: '+91 98234 66778',
      email: 'ramesh.electrician@gmail.com',
      category: 'Electrical Maintenance',
      joinedDate: 'Mar 20, 2026',
      kycStatus: 'VERIFIED',
      depositStatus: 'PAID (₹5,000)',
      rating: 4.8,
      completedJobs: 98,
      walletBalance: 8600,
      activeJobs: 1,
      status: 'ACTIVE',
      documents: [
        { id: 'DOC-9', name: 'Govt Electrical License', status: 'VERIFIED', url: '#', uploadedAt: 'Mar 20, 2026' },
        { id: 'DOC-10', name: 'Aadhaar Card', status: 'VERIFIED', url: '#', uploadedAt: 'Mar 20, 2026' }
      ]
    }
  ]);

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);

    if (activeTab === 'PENDING_KYC') return matchesSearch && p.kycStatus === 'PENDING_REVIEW';
    if (activeTab === 'ACTIVE') return matchesSearch && p.status === 'ACTIVE';
    if (activeTab === 'SUSPENDED') return matchesSearch && p.status === 'SUSPENDED';
    return matchesSearch;
  });

  const handleDocumentDecision = (partnerId, docId, decision) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id !== partnerId) return p;
        const updatedDocs = p.documents.map((d) =>
          d.id === docId ? { ...d, status: decision } : d
        );
        const allVerified = updatedDocs.every((d) => d.status === 'VERIFIED');
        return {
          ...p,
          documents: updatedDocs,
          kycStatus: allVerified ? 'VERIFIED' : decision === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
          status: allVerified ? 'ACTIVE' : p.status
        };
      })
    );
    toast.success(`Document marked as ${decision}`, 'KYC Update');
    setVerificationModalDoc(null);
  };

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
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partner.id
            ? { ...p, status: isActivating ? 'ACTIVE' : 'SUSPENDED' }
            : p
        )
      );
      toast.info(`Partner ${partner.id} is now ${isActivating ? 'ACTIVE' : 'SUSPENDED'}`);
    }
  };

  const handleReleasePayout = async (partner) => {
    const confirmed = await confirm({
      title: `Disburse ₹${partner.walletBalance.toLocaleString('en-IN')} to ${partner.name}?`,
      message: `Direct NEFT/IMPS payout transfer to verified bank account on file.`,
      confirmText: 'Process Payout Now',
      variant: 'primary'
    });

    if (confirmed) {
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partner.id
            ? { ...p, walletBalance: 0 }
            : p
        )
      );
      toast.success(`Payout of ₹${partner.walletBalance.toLocaleString('en-IN')} processed successfully!`, 'Payout Disbursed');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 13 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vendor & Partner Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally onboard certified service technicians, verify KYC & police clearance documents, track field performance, and manage payout disbursements.
          </p>
        </div>

        {/* Fleet KPI Quick Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Fleet</span>
            <span className="font-extrabold text-slate-900">
              {partners.filter((p) => p.status === 'ACTIVE').length} / {partners.length}
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

        <div className="flex items-center gap-2 w-full md:w-auto">
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
                          {p.name.substring(0, 2).toUpperCase()}
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
                      <span className="font-black text-slate-900 block">₹{p.walletBalance.toLocaleString('en-IN')}</span>
                      {p.walletBalance > 0 && (
                        <button
                          onClick={() => handleReleasePayout(p)}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
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
                          onClick={() => setSelectedPartner(p)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[11px] transition cursor-pointer"
                        >
                          KYC Docs
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
      </div>

      {/* KYC Documents Inspector Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedPartner.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  KYC & Certification Dossier — {selectedPartner.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Submitted Verification Documents</span>
              {selectedPartner.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">Uploaded on {doc.uploadedAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doc.status}
                    </span>

                    {doc.status !== 'VERIFIED' && (
                      <button
                        onClick={() => handleDocumentDecision(selectedPartner.id, doc.id, 'VERIFIED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded"
                      >
                        Approve
                      </button>
                    )}
                    {doc.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleDocumentDecision(selectedPartner.id, doc.id, 'REJECTED')}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-blue-900">Platform Assurance Policy:</span>
              <p className="text-blue-700">
                Approving all 3 core credentials automatically enables the partner account for instant background matching and customer dispatch.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
