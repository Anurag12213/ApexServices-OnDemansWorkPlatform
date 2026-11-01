import React, { useState } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import ApexLogo from '../../components/common/ApexLogo';

export const SignupScreen = ({ accountType = 'INDIVIDUAL', onBack, onComplete }) => {
  const { register } = usePartner();

  const isOrg = accountType === 'ORGANIZATION';

  // State for Individual
  const [individualForm, setIndividualForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // State for Organization
  const [orgForm, setOrgForm] = useState({
    orgName: '',
    businessAddress: '',
    contactPerson: '',
    regNumber: '',
    businessEmail: '',
    businessMobile: '',
    password: 'password123',
    confirmPassword: 'password123',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isOrg) {
      if (!individualForm.fullName.trim()) {
        setError('Full name is required');
        return;
      }
      if (!individualForm.email.trim() && !individualForm.phone.trim()) {
        setError('Please provide email or phone');
        return;
      }
      if (individualForm.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (individualForm.password !== individualForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      if (!orgForm.orgName.trim()) {
        setError('Organization name is required');
        return;
      }
      if (!orgForm.contactPerson.trim()) {
        setError('Contact person name is required');
        return;
      }
      if (!orgForm.businessEmail.trim() && !orgForm.businessMobile.trim()) {
        setError('Please provide business email or phone');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = isOrg
        ? {
            fullName: orgForm.contactPerson,
            email: orgForm.businessEmail,
            phone: orgForm.businessMobile,
            orgName: orgForm.orgName,
            gstin: orgForm.regNumber,
            password: orgForm.password,
            accountType: 'ORGANIZATION',
          }
        : {
            fullName: individualForm.fullName,
            email: individualForm.email,
            phone: individualForm.phone,
            password: individualForm.password,
            accountType: 'INDIVIDUAL',
          };

      const res = await register(payload);
      if (res.success) {
        onComplete(res.partner);
      } else {
        setError('Registration could not be completed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[720px] rounded-[32px] bg-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-100 text-left">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <ApexLogo portal="partner" />
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Type</span>
          </button>
        </div>

        {/* 4-Step Wizard Indicator */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-8 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Account</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">2</span>
            <span>Profile</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">3</span>
            <span>Services</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">4</span>
            <span>Review</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isOrg ? 'Business Details' : 'Personal Details'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOrg ? 'Tell us about your organization' : 'Tell us about yourself'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOrg ? (
            /* ==================== INDIVIDUAL FORM (NO DOCUMENT UPLOAD) ==================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={individualForm.fullName}
                  onChange={(e) => setIndividualForm({ ...individualForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={individualForm.email}
                  onChange={(e) => setIndividualForm({ ...individualForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Mobile Number
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    value={individualForm.phone}
                    onChange={(e) => setIndividualForm({ ...individualForm, phone: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-r-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={individualForm.password}
                    onChange={(e) => setIndividualForm({ ...individualForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={individualForm.confirmPassword}
                    onChange={(e) => setIndividualForm({ ...individualForm, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== ORGANIZATION FORM (NO DOCUMENT UPLOAD) ==================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgForm.orgName}
                  onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                  placeholder="Enter business name"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={orgForm.businessAddress}
                  onChange={(e) => setOrgForm({ ...orgForm, businessAddress: e.target.value })}
                  placeholder="Enter address"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={orgForm.contactPerson}
                  onChange={(e) => setOrgForm({ ...orgForm, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Registration Number (Optional)
                </label>
                <input
                  type="text"
                  value={orgForm.regNumber}
                  onChange={(e) => setOrgForm({ ...orgForm, regNumber: e.target.value })}
                  placeholder="GST / Business Registration No."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={orgForm.businessEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, businessEmail: e.target.value })}
                  placeholder="business@example.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Business Mobile
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    value={orgForm.businessMobile}
                    onChange={(e) => setOrgForm({ ...orgForm, businessMobile: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-r-xl focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Registering...' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SignupScreen;
