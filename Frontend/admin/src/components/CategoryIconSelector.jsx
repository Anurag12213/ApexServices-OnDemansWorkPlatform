import React, { useState, useMemo } from 'react';
import {
  Hammer,
  Wrench,
  Zap,
  Paintbrush,
  Fan,
  Tv,
  Sparkles,
  ShieldCheck,
  Droplets,
  Flame,
  Lock,
  Truck,
  Scissors,
  Wind,
  Camera,
  Layers,
  Cpu,
  Bug,
  Home,
  Package,
  Search,
  Upload,
  Check,
  Image as ImageIcon,
  HelpCircle,
  X
} from 'lucide-react';
import { useToast } from './Toast';

export const SYSTEM_ICONS = [
  { id: 1, name: 'Hammer (Carpentry)', iconValue: 'Hammer', iconType: 'SYSTEM', iconComponent: Hammer },
  { id: 2, name: 'Wrench (Plumbing)', iconValue: 'Wrench', iconType: 'SYSTEM', iconComponent: Wrench },
  { id: 3, name: 'Zap (Electrical)', iconValue: 'Zap', iconType: 'SYSTEM', iconComponent: Zap },
  { id: 4, name: 'Paintbrush (Painting & Decor)', iconValue: 'Paintbrush', iconType: 'SYSTEM', iconComponent: Paintbrush },
  { id: 5, name: 'Fan (HVAC & AC Service)', iconValue: 'Fan', iconType: 'SYSTEM', iconComponent: Fan },
  { id: 6, name: 'Tv (Appliance Care)', iconValue: 'Tv', iconType: 'SYSTEM', iconComponent: Tv },
  { id: 7, name: 'Sparkles (Deep Cleaning)', iconValue: 'Sparkles', iconType: 'SYSTEM', iconComponent: Sparkles },
  { id: 8, name: 'ShieldCheck (Security & Inspection)', iconValue: 'ShieldCheck', iconType: 'SYSTEM', iconComponent: ShieldCheck },
  { id: 9, name: 'Droplets (Water Purification)', iconValue: 'Droplets', iconType: 'SYSTEM', iconComponent: Droplets },
  { id: 10, name: 'Flame (Gas & Water Heater)', iconValue: 'Flame', iconType: 'SYSTEM', iconComponent: Flame },
  { id: 11, name: 'Lock (Locksmith & Security)', iconValue: 'Lock', iconType: 'SYSTEM', iconComponent: Lock },
  { id: 12, name: 'Truck (Moving & Relocation)', iconValue: 'Truck', iconType: 'SYSTEM', iconComponent: Truck },
  { id: 13, name: 'Scissors (Gardening & Lawn)', iconValue: 'Scissors', iconType: 'SYSTEM', iconComponent: Scissors },
  { id: 14, name: 'Wind (Ventilation & Duct Cleaning)', iconValue: 'Wind', iconType: 'SYSTEM', iconComponent: Wind },
  { id: 15, name: 'Camera (CCTV & Smart Security)', iconValue: 'Camera', iconType: 'SYSTEM', iconComponent: Camera },
  { id: 16, name: 'Layers (Flooring & Tiling)', iconValue: 'Layers', iconType: 'SYSTEM', iconComponent: Layers },
  { id: 17, name: 'Cpu (Smart Home Automation)', iconValue: 'Cpu', iconType: 'SYSTEM', iconComponent: Cpu },
  { id: 18, name: 'Bug (Pest Control & Fumigation)', iconValue: 'Bug', iconType: 'SYSTEM', iconComponent: Bug },
  { id: 19, name: 'Home (Full Renovation)', iconValue: 'Home', iconType: 'SYSTEM', iconComponent: Home },
  { id: 20, name: 'Package (Furniture Assembly)', iconValue: 'Package', iconType: 'SYSTEM', iconComponent: Package },
];

export const SYSTEM_ICON_MAP = {
  Hammer,
  Wrench,
  Zap,
  Paintbrush,
  Fan,
  Tv,
  Sparkles,
  ShieldCheck,
  Droplets,
  Flame,
  Lock,
  Truck,
  Scissors,
  Wind,
  Camera,
  Layers,
  Cpu,
  Bug,
  Home,
  Package,
};

export const RenderIcon = ({ icon, iconName, className = "w-5 h-5", imgClassName = "w-6 h-6 object-contain" }) => {
  const iconType = icon?.iconType;
  const iconValue = icon?.iconValue || iconName;

  if (iconType === 'CUSTOM' || (iconValue && (iconValue.startsWith('data:image') || iconValue.startsWith('http') || iconValue.startsWith('/')))) {
    return (
      <img
        src={iconValue}
        alt={icon?.name || 'Category Icon'}
        className={`${imgClassName} rounded`}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }

  const Comp = SYSTEM_ICON_MAP[iconValue] || SYSTEM_ICON_MAP[iconName] || Hammer;
  return <Comp className={className} />;
};

export default function CategoryIconSelector({
  selectedIconId,
  selectedIconName,
  customIconValue,
  onSelectIcon,
  dbIcons = [],
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(customIconValue ? 'upload' : 'library');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState(customIconValue && customIconValue.startsWith('http') ? customIconValue : '');

  // Combine system default icons with icons from database table
  const allLibraryIcons = useMemo(() => {
    if (!dbIcons || dbIcons.length === 0) return SYSTEM_ICONS;

    const merged = [...SYSTEM_ICONS];
    for (const d of dbIcons) {
      if (!merged.some(m => m.id === d.id || m.iconValue === d.iconValue)) {
        merged.push({
          id: d.id,
          name: d.name,
          iconValue: d.iconValue,
          iconType: d.iconType || 'SYSTEM',
        });
      }
    }
    return merged;
  }, [dbIcons]);

  // Filter icons based on search keyword
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return allLibraryIcons;
    const q = searchQuery.toLowerCase();
    return allLibraryIcons.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.iconValue && i.iconValue.toLowerCase().includes(q))
    );
  }, [allLibraryIcons, searchQuery]);

  // Currently active icon info
  const currentIcon = useMemo(() => {
    if (customIconValue) {
      return {
        id: null,
        name: 'Custom Uploaded Icon',
        iconType: 'CUSTOM',
        iconValue: customIconValue,
      };
    }
    const found = allLibraryIcons.find(
      (i) => (selectedIconId && i.id === Number(selectedIconId)) || (selectedIconName && i.iconValue === selectedIconName)
    );
    return found || SYSTEM_ICONS[0];
  }, [customIconValue, selectedIconId, selectedIconName, allLibraryIcons]);

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Icon image must be under 2MB.', 'File Size Exceeded');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        onSelectIcon({
          iconId: null,
          iconName: file.name.replace(/\.[^/.]+$/, ""),
          iconType: 'CUSTOM',
          customIconValue: base64,
          customIconName: file.name.replace(/\.[^/.]+$/, ""),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    onSelectIcon({
      iconId: null,
      iconName: 'Custom Web Icon',
      iconType: 'CUSTOM',
      customIconValue: customUrl.trim(),
      customIconName: 'Custom Web Icon',
    });
  };

  const handlePickLibraryIcon = (item) => {
    onSelectIcon({
      iconId: item.id,
      iconName: item.iconValue,
      iconType: item.iconType || 'SYSTEM',
      customIconValue: '',
      customIconName: '',
    });
  };

  return (
    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
      {/* Current Icon Preview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-200 gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center p-1.5 border border-blue-200 shadow-xs shrink-0">
            <RenderIcon
              icon={currentIcon}
              iconName={currentIcon?.iconValue}
              className="w-6 h-6 text-blue-700"
              imgClassName="w-7 h-7 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-bold text-xs text-slate-800 truncate">{currentIcon?.name || 'Selected Icon'}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                currentIcon?.iconType === 'CUSTOM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {currentIcon?.iconType === 'CUSTOM' ? 'Custom Upload' : 'Library Icon'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">{currentIcon?.iconValue?.slice(0, 40) || 'Hammer'}</p>
          </div>
        </div>

        {customIconValue && (
          <button
            type="button"
            onClick={() => handlePickLibraryIcon(SYSTEM_ICONS[0])}
            className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 bg-red-50 border border-red-200 rounded self-start sm:self-auto cursor-pointer"
          >
            Reset to Library
          </button>
        )}
      </div>

      {/* Selector Mode Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap border-b border-slate-200 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`pb-1.5 font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'library'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>System Icons ({allLibraryIcons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`pb-1.5 font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Custom Icon / URL</span>
        </button>
      </div>

      {/* Tab 1: Library Grid with Search */}
      {activeTab === 'library' && (
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons (carpentry, plumbing, cleaning...)"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-white scrollbar-thin">
            {filteredIcons.map((item) => {
              const isSelected =
                !customIconValue &&
                ((selectedIconId && Number(selectedIconId) === item.id) ||
                  (selectedIconName && selectedIconName === item.iconValue));
              const Comp = SYSTEM_ICON_MAP[item.iconValue] || Hammer;

              return (
                <button
                  key={item.id || item.iconValue}
                  type="button"
                  onClick={() => handlePickLibraryIcon(item)}
                  className={`p-1.5 rounded-lg border text-left flex items-center space-x-2 transition cursor-pointer min-w-0 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500/30 font-bold text-blue-800'
                      : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Comp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] truncate leading-tight font-medium">{item.name}</p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Upload Custom Icon */}
      {activeTab === 'upload' && (
        <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Option A: Upload Local Image File (SVG, PNG, JPG, WebP)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded p-1 bg-slate-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">Recommended size: 64x64 or 128x128 pixels (square transparent SVG/PNG)</p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700 mb-1">
              Option B: Paste Image URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/icon.svg"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-xs focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded shrink-0"
              >
                Apply URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
