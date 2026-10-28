import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Eye
} from 'lucide-react';

export const DocumentsManagerScreen = () => {
  const {
    partner,
    docRequirements,
    uploadDocument
  } = usePartner();

  const [activeUploadModal, setActiveUploadModal] = useState(null); // requirement object
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // Filter requirements applicable to partner's account type
  const partnerType = partner?.accountType || 'INDIVIDUAL';
  const applicableRequirements = docRequirements.filter(
    r => r.applicableType === 'ALL' || r.applicableType === partnerType
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');

    // File validation: Size
    const maxBytes = (activeUploadModal.maxSizeMb || 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`File exceeds maximum allowed size of ${activeUploadModal.maxSizeMb} MB.`);
      return;
    }

    // File validation: Extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = activeUploadModal.acceptedTypes || ['.pdf', '.jpg', '.png'];
    if (!allowed.includes(ext)) {
      setUploadError(`Invalid file format. Accepted formats: ${allowed.join(', ')}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !activeUploadModal) return;

    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);
      try {
        await uploadDocument(activeUploadModal.id, {
          name: selectedFile.name,
          size: selectedFile.size
        });
        setActiveUploadModal(null);
        setSelectedFile(null);
      } catch (err) {
        setUploadError(err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#3867FF]" />
            <span>Document Verification Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-mandated credential compliance for customer protection
          </p>
        </div>
      </div>

      {/* Compliance Warning / Guide */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#3867FF] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Administrative Verification Guard:</span>
          <p className="text-blue-800 leading-relaxed">
            All submitted credentials are reviewed by ApexServices compliance officers within 2-4 hours. Live job dispatches will only be enabled after both the mandatory security deposit is verified and all required documents are marked APPROVED.
          </p>
        </div>
      </div>

      {/* SCREEN 12: REQUIRED DOCUMENTS LIST */}
      <div className="space-y-3">
        {applicableRequirements.map((req) => {
          const submission = partner?.documents?.[req.id];
          const status = submission ? submission.status : 'NOT_SUBMITTED';
          const isRejected = status === 'REJECTED';
          const isApproved = status === 'APPROVED';

          return (
            <div
              key={req.id}
              className={`bg-white p-5 rounded-2xl border transition-all ${
                isRejected
                  ? 'border-rose-300 bg-rose-50/20'
                  : isApproved
                  ? 'border-emerald-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{req.name}</h3>
                    {req.isMandatory && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                        Mandatory
                      </span>
                    )}
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    {req.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Accepted: {req.acceptedTypes.join(', ')} • Max size: {req.maxSizeMb} MB
                  </p>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {status === 'NOT_SUBMITTED' ? (
                    <button
                      onClick={() => {
                        setActiveUploadModal(req);
                        setSelectedFile(null);
                        setUploadError('');
                      }}
                      className="px-4 py-2 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  ) : isRejected ? (
                    <button
                      onClick={() => {
                        setActiveUploadModal(req);
                        setSelectedFile(null);
                        setUploadError('');
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resubmit Replacement</span>
                    </button>
                  ) : status === 'UNDER_REVIEW' ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Review in Progress</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Document</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SCREEN 15: REJECTION DETAILS & RESUBMISSION NOTICE */}
              {isRejected && submission.rejectionReason && (
                <div className="mt-4 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Admin Rejection Reason:</span>
                  </div>
                  <p className="leading-relaxed pl-5">{submission.rejectionReason}</p>
                </div>
              )}

              {/* Uploaded File Metadata */}
              {submission && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>File: <strong className="text-slate-700">{submission.fileName}</strong></span>
                  </span>
                  <span>Submitted: {new Date(submission.uploadedAt || Date.now()).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SCREEN 13: DOCUMENT UPLOAD MODAL */}
      {activeUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upload Credential Document</h3>
                <p className="text-xs text-slate-500">{activeUploadModal.name}</p>
              </div>
              <button
                onClick={() => setActiveUploadModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div className="border-2 border-dashed border-slate-200 hover:border-[#3867FF] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50">
              <input
                type="file"
                id="doc-file-input"
                className="hidden"
                accept={activeUploadModal.acceptedTypes?.join(',')}
                onChange={handleFileSelect}
              />
              <label htmlFor="doc-file-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3867FF] mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#3867FF] hover:underline">Click to browse file</span> or drag & drop here
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepted formats: {activeUploadModal.acceptedTypes?.join(', ')} • Max {activeUploadModal.maxSizeMb} MB
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex items-center justify-between text-blue-900">
                <span className="truncate font-semibold">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                <span className="text-emerald-600 font-bold">Ready</span>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-500 font-semibold">{uploadError}</p>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Uploading securely...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#3867FF] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveUploadModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handleUploadSubmit}
                className="px-5 py-2.5 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
