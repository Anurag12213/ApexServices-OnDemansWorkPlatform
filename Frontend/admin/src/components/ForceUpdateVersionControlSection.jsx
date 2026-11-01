import React, { useState } from 'react';
import {
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Save,
  Download,
  ShieldAlert,
  ArrowUpCircle,
  FileCode,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { useToast } from './Toast';

export default function ForceUpdateVersionControlSection() {
  const toast = useToast();

  const [platforms, setPlatforms] = useState({
    customer_web: {
      name: 'Customer Web Portal',
      currentVersion: '2.1.0',
      minRequiredVersion: '2.0.0',
      forceUpdateEnabled: true,
      maintenanceMode: false,
      updateUrl: 'https://apexservicesondemand.netlify.app',
      promptTitle: 'Major Experience Upgrade Available',
      promptMessage: 'Please refresh your browser to load our high-speed Next.js SSR service engine.',
      lastReleased: 'Nov 01, 2026'
    },
    partner_web: {
      name: 'Technician Field Web App',
      currentVersion: '2.0.4',
      minRequiredVersion: '1.9.0',
      forceUpdateEnabled: true,
      maintenanceMode: false,
      updateUrl: 'https://apexservices-partner-portal.netlify.app',
      promptTitle: 'Mandatory Field Dispatch Update',
      promptMessage: 'Critical audio alert synchronization and background geofencing patch required for job dispatching.',
      lastReleased: 'Nov 01, 2026'
    },
    android_app: {
      name: 'Android Mobile Application (APK/Play Store)',
      currentVersion: '1.5.2',
      minRequiredVersion: '1.4.0',
      forceUpdateEnabled: false,
      maintenanceMode: false,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.apexservices.app',
      promptTitle: 'Update to Latest ApexServices Version',
      promptMessage: 'Includes biometric login and live technician map tracking.',
      lastReleased: 'Oct 24, 2026'
    },
    ios_app: {
      name: 'iOS Mobile Application (App Store)',
      currentVersion: '1.4.8',
      minRequiredVersion: '1.3.5',
      forceUpdateEnabled: false,
      maintenanceMode: false,
      updateUrl: 'https://apps.apple.com/app/apexservices/id123456789',
      promptTitle: 'Performance and Security Patch',
      promptMessage: 'Recommended update for iOS 18 compatibility.',
      lastReleased: 'Oct 20, 2026'
    }
  });

  const [changelog, setChangelog] = useState([
    {
      version: 'v2.1.0 (Next.js Turbo)',
      date: 'Nov 01, 2026',
      notes: 'Full migration of Customer and Partner applications to Next.js Turbopack with SSR and SEO OpenGraph tags.'
    },
    {
      version: 'v2.0.0 (Unified Escrow)',
      date: 'Oct 28, 2026',
      notes: 'Customer upfront payments held securely in escrow until OTP completion verification.'
    },
    {
      version: 'v1.4.0 (Emergency Dispatch)',
      date: 'Oct 15, 2026',
      notes: '45-minute guaranteed plumbing & electrical emergency response system.'
    }
  ]);

  const handleToggleForceUpdate = (platformKey) => {
    setPlatforms((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        forceUpdateEnabled: !prev[platformKey].forceUpdateEnabled
      }
    }));
    toast.info(`Force-update ${!platforms[platformKey].forceUpdateEnabled ? 'ENABLED' : 'DISABLED'} for ${platforms[platformKey].name}`);
  };

  const handleToggleMaintenance = (platformKey) => {
    setPlatforms((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        maintenanceMode: !prev[platformKey].maintenanceMode
      }
    }));
    toast.warning(`Maintenance mode ${!platforms[platformKey].maintenanceMode ? 'ACTIVATED' : 'DEACTIVATED'} on ${platforms[platformKey].name}`);
  };

  const handleSaveVersions = (e) => {
    e.preventDefault();
    localStorage.setItem('apex_version_control', JSON.stringify(platforms));
    toast.success('App version policies and update gates deployed globally.', 'Version Control Synchronized');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 16 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Force-Update & App Version Control</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Safeguard platform integrity: enforce minimum client software versions, prompt users with breaking-change warnings, and toggle emergency maintenance mode.
          </p>
        </div>

        <button
          onClick={handleSaveVersions}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Publish Version Rules</span>
        </button>
      </div>

      {/* Platform Version Gates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(platforms).map(([key, plat]) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {key.includes('web') ? <Globe className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900">{plat.name}</h3>
                  <span className="text-[10px] text-slate-400">Last deployed {plat.lastReleased}</span>
                </div>
              </div>

              {plat.maintenanceMode && (
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black uppercase animate-pulse">
                  Maintenance Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Latest Version Released</label>
                <input
                  type="text"
                  value={plat.currentVersion}
                  onChange={(e) =>
                    setPlatforms({
                      ...platforms,
                      [key]: { ...plat, currentVersion: e.target.value }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Required Version</label>
                <input
                  type="text"
                  value={plat.minRequiredVersion}
                  onChange={(e) =>
                    setPlatforms({
                      ...platforms,
                      [key]: { ...plat, minRequiredVersion: e.target.value }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold outline-none text-red-600"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Force-Update Prompt Title</label>
                <input
                  type="text"
                  value={plat.promptTitle}
                  onChange={(e) =>
                    setPlatforms({
                      ...platforms,
                      [key]: { ...plat, promptTitle: e.target.value }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Prompt Body Message</label>
                <textarea
                  rows="2"
                  value={plat.promptMessage}
                  onChange={(e) =>
                    setPlatforms({
                      ...platforms,
                      [key]: { ...plat, promptMessage: e.target.value }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-medium text-[11px]"
                />
              </div>
            </div>

            {/* Action Toggles */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleForceUpdate(key)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    plat.forceUpdateEnabled
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {plat.forceUpdateEnabled ? 'Force Update Active' : 'Soft Prompt Only'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMaintenance(key)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    plat.maintenanceMode
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {plat.maintenanceMode ? 'Lockdown Active' : 'Normal Traffic'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Release Notes Changelog Audit */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCode className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-black text-slate-900 uppercase">Production Changelog & Deployment Records</h2>
        </div>

        <div className="space-y-3">
          {changelog.map((entry, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                    {entry.version}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.date}</span>
                </div>
                <p className="text-slate-700 font-medium pt-1">{entry.notes}</p>
              </div>
              <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Deployed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
