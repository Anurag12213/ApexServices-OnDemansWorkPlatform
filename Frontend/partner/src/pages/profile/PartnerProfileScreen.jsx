import React, { useState, useRef, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { api } from '../../services/api';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  User,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Bell,
  KeyRound,
  LogOut,
  AlertTriangle,
  Award,
  Phone,
  Mail,
  Volume2,
  Smartphone,
  Save,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

export const PartnerProfileScreen = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const {
    partner,
    logout,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    setActiveTab,
    refreshState
  } = usePartner();

  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('DETAILS'); // DETAILS, HOURS, NOTIFICATIONS, SECURITY
  const [phone, setPhone] = useState(partner?.phone || '+91 98234 11200');
  const [email, setEmail] = useState(partner?.email || 'rajesh.partner@apexservices.in');
  const [territory, setTerritory] = useState(partner?.territory || 'Mumbai West (Andheri - Bandra)');
  const [radiusKm, setRadiusKm] = useState(partner?.serviceRadiusKm || 15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.fetchPartnerProfile().then(() => {
      refreshState();
    });
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('File size exceeds 5MB limit.', 'File Too Large');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      await api.uploadPartnerAvatar(file);
      await api.fetchPartnerProfile();
      refreshState();
      toast.success('Profile avatar uploaded successfully!', 'Photo Updated');
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed.', 'Upload Failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const isOrg = partner?.accountType === 'ORGANIZATION';

  const handleSave = () => {
    const state = api.getState();
    if (state.partner) {
      state.partner.phone = phone;
      state.partner.territory = territory;
      state.partner.serviceRadiusKm = radiusKm;
      api.saveState(state);
    }
    setSaveSuccess(true);
    refreshState();
    toast.success('Profile details saved successfully!', 'Saved');
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* SCREEN 68: RESTRICTED / SUSPENDED ACCOUNT BANNER (IF SUSPENDED) */}
      {partner?.onboardingState === 'SUSPENDED' && (
        <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Account Operational Status: SUSPENDED</h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              Your partner account has been temporarily restricted by ApexServices compliance review due to reported quality or safety policy violations. You cannot receive live dispatches or accept service requests while suspended. Please contact Partner Grievance Support.
            </p>
            <button
              onClick={() => setActiveTab('support')}
              className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Contact Compliance Support
            </button>
          </div>
        </div>
      )}

      {/* Top Profile Card (Screen 55 & 56) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {partner?.avatarUrl ? (
              <img
                src={partner.avatarUrl.startsWith('http') ? partner.avatarUrl : `http://localhost:8080${partner.avatarUrl}`}
                alt={partner?.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#3867FF] flex items-center justify-center font-black text-xl shadow-xs">
                {partner?.fullName?.charAt(0) || 'P'}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3867FF] hover:bg-blue-700 text-white flex items-center justify-center shadow cursor-pointer transition-transform hover:scale-110"
              title="Upload Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{partner?.fullName}</h1>
              <StatusBadge status={partner?.onboardingState} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOrg ? partner?.orgName : 'Individual Certified Specialist'} • ID: {partner?.id}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                ★ {partner?.rating != null ? Number(partner.rating).toFixed(1) : '5.0'}
              </span>
              <span>•</span>
              <span>{partner?.reviewCount || 0} Customer Reviews</span>
              <span>•</span>
              <span>{partner?.jobsCompleted || 0} Completed Jobs</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                partner?.idVerificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                <span>ID: {partner?.idVerificationStatus || 'VERIFIED'}</span>
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                partner?.backgroundVerificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                <span>Background: {partner?.backgroundVerificationStatus || 'VERIFIED'}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            const ok = await confirm({
              title: 'Sign Out of Partner Portal?',
              message: 'Are you sure you want to log out of Apex Certified Partner? You will need to sign in again to receive new dispatch requests.',
              confirmText: 'Sign Out',
              variant: 'danger',
              icon: 'logout'
            });
            if (ok) {
              logout();
            }
          }}
          className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'DETAILS', label: 'Trade & Territory' },
          { id: 'HOURS', label: 'Working Hours' },
          { id: 'NOTIFICATIONS', label: 'Notification Settings' },
          { id: 'SECURITY', label: 'Security & 2FA' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
              activeSubTab === tab.id
                ? 'bg-[#3867FF] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SCREEN 56, 57 & 58: TRADE & TERRITORY DETAILS */}
      {activeSubTab === 'DETAILS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm">Professional Skills & Service Territory</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary Trade Skill</label>
              <input
                type="text"
                disabled
                value={partner?.category || 'Custom Carpentry'}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-semibold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Managed via trade certification verification</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary Operating Territory</label>
              <input
                type="text"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-[#3867FF]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dispatch Operating Radius (KM)</label>
              <input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-[#3867FF]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Accepts job offers within {radiusKm} km radius</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-[#3867FF]"
              />
            </div>
          </div>

          {/* Org details if applicable */}
          {isOrg && (
            <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
              <span className="font-bold text-slate-800">Corporate Information</span>
              <p className="text-slate-500">GSTIN: <strong className="text-slate-700">{partner?.gstin || '27AABCA1234F1Z5'}</strong></p>
              <p className="text-slate-500">Company Legal Name: <strong className="text-slate-700">{partner?.orgName}</strong></p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved!
              </span>
            )}
            <button
              onClick={handleSave}
              className="ml-auto px-5 py-2 bg-[#3867FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 59: WORKING HOURS */}
      {activeSubTab === 'HOURS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm">Weekly Dispatch Operating Hours</h3>
          <p className="text-xs text-slate-500">
            ApexServices dispatch algorithms match you with customer requests only during your active shifts.
          </p>

          <div className="divide-y divide-slate-100 text-xs">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <div key={day} className="py-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800 w-28">{day}</span>
                <span className="text-slate-600 font-mono">09:00 AM — 07:00 PM</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 62: NOTIFICATION PREFERENCES */}
      {activeSubTab === 'NOTIFICATIONS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm">Alert & Vibration Preferences</h3>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">High-Priority Alert Sound</span>
                <span className="text-slate-500 text-[11px]">Play incoming job alert sound when offer is dispatched</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-[#3867FF]"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Mobile Device Haptic Vibration</span>
                <span className="text-slate-500 text-[11px]">Vibrate on incoming request (supported Android/mobile devices)</span>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-4 h-4 text-[#3867FF]"
              />
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 63: PASSWORD & SECURITY */}
      {activeSubTab === 'SECURITY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm">Security & Access Controls</h3>
          <p className="text-xs text-slate-500">Manage account credentials and security authentication.</p>

          <div className="space-y-3 text-xs max-w-md">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2 bg-slate-50 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">New Password</label>
              <input type="password" placeholder="At least 6 characters" className="w-full px-3 py-2 bg-slate-50 border rounded-lg" />
            </div>
            <button
              onClick={() => toast.success('Password successfully updated!', 'Security Updated')}
              className="px-4 py-2 bg-[#3867FF] text-white font-bold text-xs rounded-xl"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
