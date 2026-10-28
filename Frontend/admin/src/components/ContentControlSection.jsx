import React, { useState, useEffect } from 'react';
import {
  Image,
  Plus,
  Trash2,
  Megaphone,
  Layers,
  Save,
  CheckCircle2,
  UserCheck,
  MessageSquare,
  ExternalLink,
  Edit2,
  X,
  Palette,
  Eye,
  Type,
  Clock,
  Phone,
  Mail,
  Sparkles,
  Layout,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import CategoryIconSelector, { RenderIcon } from './CategoryIconSelector';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { adminFetch, API_BASE_URL } from '../utils/api';

const defaultFallbackData = {
  announcement: {
    enabled: true,
    text: "🔥 Seasonal Offer: Get 20% OFF on all Carpentry, Plumbing & AC Services this week! Use Code: APEX20",
  },
  heroSlides: [
    {
      id: "slide-1",
      badge: "PRO APPROVED SERVICES",
      title: "Expert Home Services At Your Doorstep",
      subtitle: "From precision carpentry to emergency plumbing and electrical solutions — reliable professionals ready 24/7.",
      buttonText: "Request Service Now",
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80",
    },
    {
      id: "slide-2",
      badge: "CRAFT & REPAIR EXCELLENCE",
      title: "Master Carpentry & Custom Woodwork",
      subtitle: "Custom furniture fitting, door restoration, cabinetry, and structural repair by certified craftsmen.",
      buttonText: "Book Woodwork Special",
      imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80",
    },
    {
      id: "slide-3",
      badge: "RAPID RESPONSE",
      title: "Fast Plumbing & Electrical Repairs",
      subtitle: "Zero hassle leakage repair, wiring upgrades, breaker fixes, and full maintenance packages.",
      buttonText: "Explore Emergency Care",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80",
    }
  ],
  aiOwnerSection: {
    ownerName: "Anurag Vijaywargiy",
    ownerTitle: "Founder & Master Operations Director",
    badge: "FOUNDER'S DIRECT GUARANTEE",
    headingText: "Your Peace of Mind is Our Top Priority!",
    indicatedText: "We personally guarantee top-quality workmanship on every job. If you're not 100% satisfied with our carpentry, plumbing, or electrical repair, we'll fix it completely free of charge!",
    buttonText: "REQUEST NOW -> LOGIN",
    imageUrl: "/anurag_founder.jpg"
  },
  categories: [
    { id: "cat-1", name: "Custom Carpentry", iconName: "Hammer", description: "Custom cabinets, door installation, furniture repair, and precision wood craftsmanship." },
    { id: "cat-2", name: "Emergency Plumbing", iconName: "Wrench", description: "Pipe leak fixes, drain cleaning, tap replacement, and complete bathroom fitting." },
    { id: "cat-3", name: "Electrical Maintenance", iconName: "Zap", description: "Short circuit repair, wiring, light installations, and circuit breaker upgrades." },
    { id: "cat-4", name: "Painting & Decor", iconName: "Paintbrush", description: "Interior wall painting, texture finish, weatherproof exterior coatings." },
    { id: "cat-5", name: "HVAC & AC Service", iconName: "Fan", description: "AC installation, chemical cleaning, gas refill, and heating system tune-ups." },
    { id: "cat-6", name: "Appliance Care", iconName: "Tv", description: "Washing machine, refrigerator, oven, and microwave diagnostics and repair." }
  ],
  reviews: [
    { id: "rev-1", name: "Sarah Jenkins", role: "Homeowner", rating: 5, comment: "The carpentry team redesigned our custom kitchen cabinets flawlessly! Fast, polite, and very clean work.", serviceUsed: "Custom Carpentry", date: "2 days ago", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
    { id: "rev-2", name: "David Miller", role: "Property Manager", rating: 5, comment: "Called their emergency plumbing team at 11 PM for a burst pipe. They arrived in 25 minutes and fixed it completely!", serviceUsed: "Emergency Plumbing", date: "1 week ago", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
    { id: "rev-3", name: "Elena Rostova", role: "Interior Designer", rating: 5, comment: "Outstanding electrical and lighting installation. Their attention to safety and detail is unmatched in the area.", serviceUsed: "Electrical Maintenance", date: "3 weeks ago", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }
  ],
  siteBranding: {
    brandName: "ApexServices",
    brandDotColor: "#ff3b47",
    logoImageUrl: "",
    showBrandNameWithLogo: true,
    headerCtaText: "REQUEST NOW",
    headerOperatingHours: "MON - SAT: 7:00 AM - 9:00 PM | SUN: EMERGENCY DISPATCH",
    supportPhone: "+91 1800 200 4567",
    supportEmail: "support@apexservices.com",
    categoriesBadge: "OUR SPECIALTIES",
    categoriesHeading: "Featured Service Categories",
    categoriesSubtitle: "From custom carpentry to emergency plumbing and electrical care.",
    reviewsBadge: "VERIFIED REVIEWS",
    reviewsHeading: "What Our Customers Say",
    footerTagline: "Premium home repair, custom carpentry, plumbing, and electrical solutions.",
    footerAddress: "124 Executive Parkway, Suite 400",
    footerCopyright: "ApexServices. All rights reserved."
  }
};

export default function ContentControlSection({ onNavigateTab }) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState('branding');
  const [savedNotice, setSavedNotice] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [data, setData] = useState(defaultFallbackData);

  // Branding & Header settings form state with saved local cache fallback
  const [brandingForm, setBrandingForm] = useState(() => {
    try {
      const cached = localStorage.getItem('apex_custom_branding');
      if (cached) {
        return { ...defaultFallbackData.siteBranding, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return defaultFallbackData.siteBranding;
  });

  // Slide inline edit modal / state
  const [editingSlide, setEditingSlide] = useState(null);

  // Icons library from database
  const [iconsList, setIconsList] = useState([]);

  // Fetch icons library from Spring Boot REST backend
  const fetchIcons = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/icons`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setIconsList(json);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch icons from database:', e);
    }
  };

  // Fetch data from Spring Boot REST backend
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/data`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({
          ...prev,
          ...json,
          heroSlides: json.heroSlides?.length ? json.heroSlides : prev.heroSlides,
          categories: json.categories?.length ? json.categories : prev.categories,
          reviews: json.reviews?.length ? json.reviews : prev.reviews,
        }));
        const branding = json.siteBranding || json.publicConfig;
        if (branding) {
          setBrandingForm((prev) => ({
            ...prev,
            ...branding,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch from Spring Boot API, using local fallback:', e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchIcons();
  }, []);

  const triggerSaveNotice = (msg = 'Changes published live to customer website!') => {
    setSavedNotice(msg);
    try {
      const syncChannel = new BroadcastChannel('apex_services_sync');
      syncChannel.postMessage({ type: 'DATA_UPDATED' });
      syncChannel.close();
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
    setTimeout(() => setSavedNotice(false), 3500);
  };

  // Handle local logo file upload (PNG, JPG, SVG, WebP)
  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be under 2MB.', 'File Size Exceeded');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setBrandingForm((prev) => ({ ...prev, logoImageUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // 1. BRANDING & HEADER SETTINGS HANDLER
  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    const payload = {
      ...brandingForm,
      id: 'global-settings',
      updatedAt: new Date().toISOString(),
    };

    // Persist to local cache for instant availability
    try {
      localStorage.setItem('apex_custom_branding', JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to write to localStorage:', err);
    }

    try {
      // Send to Spring Boot REST backend with Admin Bearer authentication
      const res = await adminFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json().catch(() => payload);
        setBrandingForm((prev) => ({ ...prev, ...saved }));
        await fetchData();
        triggerSaveNotice('Header, Logo & Branding saved and live on website!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || `Failed to save branding (HTTP ${res.status}).`, 'Save Failed');
      }
    } catch (err) {
      console.error('Failed to update backend branding settings:', err);
      toast.error('Network error updating branding settings.', 'Error');
    } finally {
      setSavingSettings(false);
    }
  };

  // 2. SLIDES STATE & HANDLERS
  const [newSlide, setNewSlide] = useState({
    badge: 'COMMITTED TO SUCCESS',
    title: '',
    subtitle: '',
    buttonText: 'OUR SERVICES',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80',
  });

  const handleAddSlide = async (e) => {
    e.preventDefault();
    if (!newSlide.title) return;
    try {
      const res = await adminFetch('/slides', {
        method: 'POST',
        body: JSON.stringify(newSlide),
      });
      if (res.ok) {
        await fetchData();
        setNewSlide({
          badge: 'COMMITTED TO SUCCESS',
          title: '',
          subtitle: '',
          buttonText: 'OUR SERVICES',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80',
        });
        triggerSaveNotice('Hero banner slide added and published live!');
      } else {
        toast.error('Failed to add slide to server.', 'Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error adding slide.', 'Error');
    }
  };

  const handleUpdateSlide = async (e) => {
    e.preventDefault();
    if (!editingSlide || !editingSlide.id) return;
    try {
      const res = await adminFetch(`/slides/${editingSlide.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingSlide),
      });
      if (res.ok) {
        await fetchData();
        setEditingSlide(null);
        triggerSaveNotice('Hero slide updated and published live!');
      } else {
        toast.error('Failed to update slide on server.', 'Error');
      }
    } catch (e) {
      console.error('Failed to update slide:', e);
      toast.error('Network error updating slide.', 'Error');
    }
  };

  const handleDeleteSlide = async (id) => {
    const ok = await confirm({
      title: 'Delete Hero Slide?',
      message: 'Are you sure you want to delete this hero showcase slide? It will immediately disappear from the homepage slider.',
      confirmText: 'Delete Slide',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await adminFetch(`/slides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        triggerSaveNotice('Hero slide deleted.');
      } else {
        toast.error('Failed to delete slide from server.', 'Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error deleting slide.', 'Error');
    }
  };

  // 3. AI OWNER STATE & HANDLERS
  const [ownerForm, setOwnerForm] = useState({});

  useEffect(() => {
    if (data.aiOwnerSection) {
      setOwnerForm(data.aiOwnerSection);
    }
  }, [data.aiOwnerSection]);

  const handleSaveOwner = async (e) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/ai-owner', {
        method: 'PUT',
        body: JSON.stringify(ownerForm),
      });
      if (res.ok) {
        await fetchData();
        triggerSaveNotice('AI Founder profile updated and published live!');
      } else {
        toast.error('Failed to update founder profile.', 'Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error updating founder profile.', 'Error');
    }
  };

  // 5. REVIEWS STATE & HANDLERS
  const [newReview, setNewReview] = useState({
    name: '',
    role: 'Homeowner',
    rating: 5,
    comment: '',
    serviceUsed: 'Custom Carpentry',
    date: 'Just now',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  });

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;
    try {
      const res = await adminFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
      });
      if (res.ok) {
        await fetchData();
        setNewReview({
          name: '',
          role: 'Homeowner',
          rating: 5,
          comment: '',
          serviceUsed: 'Custom Carpentry',
          date: 'Just now',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        });
        triggerSaveNotice('Customer review published live!');
      } else {
        toast.error('Failed to add review.', 'Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error adding review.', 'Error');
    }
  };

  const handleDeleteReview = async (id) => {
    const ok = await confirm({
      title: 'Delete Customer Review?',
      message: 'Are you sure you want to delete this customer review testimonial? It will no longer appear on the home page.',
      confirmText: 'Delete Review',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await adminFetch(`/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        triggerSaveNotice('Customer review deleted.');
      } else {
        toast.error('Failed to delete review.', 'Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error deleting review.', 'Error');
    }
  };

  // 6. ANNOUNCEMENT STATE & HANDLERS
  const [announcementForm, setAnnouncementForm] = useState({ enabled: true, text: '' });

  useEffect(() => {
    if (data.announcement) {
      setAnnouncementForm(data.announcement);
    }
  }, [data.announcement]);

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/announcement', {
        method: 'PUT',
        body: JSON.stringify(announcementForm),
      });
      if (res.ok) {
        await fetchData();
        triggerSaveNotice('Top announcement bar published live!');
      } else {
        toast.error('Failed to update announcement.', 'Error');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error updating announcement.', 'Error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Website Customization & Content Control</h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Real-time Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Customize header branding, logo, banner slides & images, section headings, reviews, and footer in the customer portal.
          </p>
        </div>

        {savedNotice && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center shadow-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> {typeof savedNotice === 'string' ? savedNotice : 'Changes published live to customer website!'}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('branding')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition shrink-0 px-2 ${
            activeSubTab === 'branding'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Header, Logo & Branding</span>
        </button>

        <button
          onClick={() => setActiveSubTab('banners')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition shrink-0 px-2 ${
            activeSubTab === 'banners'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Hero Header Slides ({data.heroSlides?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('owner')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition shrink-0 px-2 ${
            activeSubTab === 'owner'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>AI Founder & Speech</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition shrink-0 px-2 ${
            activeSubTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Service Categories ({data.categories?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition shrink-0 px-2 ${
            activeSubTab === 'reviews'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Reviews ({data.reviews?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('announcement')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition shrink-0 px-2 ${
            activeSubTab === 'announcement'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcement Bar</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: HEADER, LOGO & SITE BRANDING CUSTOMIZATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6">
          {/* Live Customer Header Preview Card */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                Live Customer Portal Header Preview
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">Dynamic Preview</span>
            </div>

            {/* TopBar Mini Preview */}
            <div className="bg-[#002336] text-slate-300 text-[11px] py-1.5 px-4 rounded-t-lg flex flex-wrap items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-[#ff3b47]" />
                <span className="truncate max-w-sm">{brandingForm.headerOperatingHours || 'MON - SAT: 7:00 AM - 9:00 PM | SUN: EMERGENCY DISPATCH'}</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" style={{ color: brandingForm.brandDotColor || '#ff3b47' }} />
                  {brandingForm.supportPhone || '+91 1800 200 4567'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" style={{ color: brandingForm.brandDotColor || '#ff3b47' }} />
                  {brandingForm.supportEmail || 'support@apexservices.com'}
                </span>
              </div>
            </div>

            {/* Navbar Mini Preview */}
            <div className="bg-white text-slate-800 px-5 py-3 rounded-b-lg flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                {brandingForm.logoImageUrl && (
                  <img
                    src={brandingForm.logoImageUrl}
                    alt={brandingForm.brandName}
                    className="h-8 max-h-9 max-w-[150px] object-contain rounded bg-white/20 p-0.5"
                  />
                )}
                {(brandingForm.showBrandNameWithLogo !== false || !brandingForm.logoImageUrl) && (
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {brandingForm.brandName || 'ApexServices'}
                    <span style={{ color: brandingForm.brandDotColor || '#ff3b47' }}>.</span>
                  </span>
                )}
              </div>

              <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
                <span className="text-slate-900 font-bold border-b-2" style={{ borderColor: brandingForm.brandDotColor || '#ff3b47' }}>Home</span>
                <span>Services</span>
                <span>About</span>
                <span>Reviews</span>
                <span>Contact</span>
              </div>

              <button
                className="text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition"
                style={{ backgroundColor: brandingForm.brandDotColor || '#ff3b47' }}
              >
                {brandingForm.headerCtaText || 'REQUEST NOW'}
              </button>
            </div>
          </div>

          {/* Branding Customization Form */}
          <form onSubmit={handleSaveBranding} className="space-y-6">
            {/* Header & Logo Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layout className="w-4 h-4 text-blue-600" />
                  Header & Brand Identity
                </h3>
                <span className="text-xs text-slate-400">Controls top bar & navigation bar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.brandName || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, brandName: e.target.value })}
                    placeholder="e.g. ApexServices"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Displayed in Navbar, Footer, and Page Titles</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Brand Accent / Dot Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={brandingForm.brandDotColor || '#ff3b47'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, brandDotColor: e.target.value })}
                      className="w-10 h-9 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={brandingForm.brandDotColor || '#ff3b47'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, brandDotColor: e.target.value })}
                      placeholder="#ff3b47"
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none font-mono focus:border-blue-500"
                    />
                  </div>
                  {/* Preset Color Swatches */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[
                      { label: 'Apex Red', color: '#ff3b47' },
                      { label: 'Sapphire Blue', color: '#1E40AF' },
                      { label: 'Navy Dark', color: '#002336' },
                      { label: 'Emerald Green', color: '#059669' },
                      { label: 'Royal Purple', color: '#7C3AED' },
                      { label: 'Amber Orange', color: '#D97706' },
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setBrandingForm({ ...brandingForm, brandDotColor: preset.color })}
                        className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition shadow-xs"
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Header CTA Button Text</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.headerCtaText || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, headerCtaText: e.target.value })}
                    placeholder="REQUEST NOW"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Top-right action button in Navbar</p>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Custom Logo Image (URL or Local File Upload)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">Option 1: Paste Logo Image URL</span>
                        <input
                          type="text"
                          value={brandingForm.logoImageUrl || ''}
                          onChange={(e) => setBrandingForm({ ...brandingForm, logoImageUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">Option 2: Upload File (PNG / SVG / JPG / WebP)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded p-1 bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>

                  {brandingForm.logoImageUrl && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={brandingForm.logoImageUrl}
                          alt="Logo Preview"
                          className="h-9 max-w-[140px] object-contain border border-slate-200 rounded p-1 bg-white"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                        <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={brandingForm.showBrandNameWithLogo !== false}
                            onChange={(e) => setBrandingForm({ ...brandingForm, showBrandNameWithLogo: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Display Brand Name text next to logo</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBrandingForm({ ...brandingForm, logoImageUrl: '' })}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition"
                      >
                        Clear Custom Logo
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Leave blank to use stylized brand text <b>{brandingForm.brandName || 'ApexServices'}</b> with colored dot.
                  </p>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">TopBar Operating Hours Text</label>
                  <input
                    type="text"
                    value={brandingForm.headerOperatingHours || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, headerOperatingHours: e.target.value })}
                    placeholder="MON - SAT: 7:00 AM - 9:00 PM | SUN: EMERGENCY DISPATCH"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Displayed in the dark top notification strip</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Support Phone</label>
                  <input
                    type="text"
                    value={brandingForm.supportPhone || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, supportPhone: e.target.value })}
                    placeholder="+91 1800 200 4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Support Email</label>
                  <input
                    type="email"
                    value={brandingForm.supportEmail || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, supportEmail: e.target.value })}
                    placeholder="support@apexservices.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section Headings & Subtitles Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-600" />
                  Section Headings & Titles Customization
                </h3>
                <span className="text-xs text-slate-400">Controls section titles across the homepage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Categories Badge</label>
                  <input
                    type="text"
                    value={brandingForm.categoriesBadge || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, categoriesBadge: e.target.value })}
                    placeholder="OUR SPECIALTIES"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Categories Heading</label>
                  <input
                    type="text"
                    value={brandingForm.categoriesHeading || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, categoriesHeading: e.target.value })}
                    placeholder="Featured Service Categories"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Categories Subtitle</label>
                  <input
                    type="text"
                    value={brandingForm.categoriesSubtitle || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, categoriesSubtitle: e.target.value })}
                    placeholder="From custom carpentry to emergency plumbing..."
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reviews Section Badge</label>
                  <input
                    type="text"
                    value={brandingForm.reviewsBadge || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, reviewsBadge: e.target.value })}
                    placeholder="VERIFIED REVIEWS"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reviews Section Heading</label>
                  <input
                    type="text"
                    value={brandingForm.reviewsHeading || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, reviewsHeading: e.target.value })}
                    placeholder="What Our Customers Say"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Footer Customization */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Footer Text & Address Customization
                </h3>
                <span className="text-xs text-slate-400">Controls bottom footer section</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Footer Tagline</label>
                  <input
                    type="text"
                    value={brandingForm.footerTagline || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, footerTagline: e.target.value })}
                    placeholder="Premium home repair, custom carpentry, plumbing, and electrical solutions."
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={brandingForm.footerAddress || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, footerAddress: e.target.value })}
                    placeholder="124 Executive Parkway, Suite 400"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Copyright Statement</label>
                  <input
                    type="text"
                    value={brandingForm.footerCopyright || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, footerCopyright: e.target.value })}
                    placeholder="ApexServices. All rights reserved."
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between bg-slate-100 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">
                Changes will sync instantaneously across all active customer browsers.
              </span>
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save & Publish Live to Customer Website
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: HERO HEADER SLIDES WITH INLINE EDITING */}
      {/* ========================================================================= */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          {/* Edit Slide Modal / Panel */}
          {editingSlide && (
            <div className="bg-blue-50/70 border-2 border-blue-400 p-5 rounded-xl shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  Edit Hero Slide ({editingSlide.id})
                </h3>
                <button
                  onClick={() => setEditingSlide(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateSlide} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Slide Title</label>
                  <input
                    required
                    type="text"
                    value={editingSlide.title}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editingSlide.badge}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                  <input
                    required
                    type="text"
                    value={editingSlide.subtitle}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={editingSlide.buttonText}
                    onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Header Image URL</label>
                  <div className="flex items-center space-x-2">
                    <input
                      required
                      type="text"
                      value={editingSlide.imageUrl}
                      onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                    />
                    {editingSlide.imageUrl && (
                      <img
                        src={editingSlide.imageUrl}
                        alt="Preview"
                        className="w-10 h-8 object-cover rounded border border-slate-300 shrink-0"
                      />
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlide(null)}
                    className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Slide Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Slide Form */}
          <form onSubmit={handleAddSlide} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Add New Hero Slide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Slide Title</label>
                <input
                  required
                  type="text"
                  value={newSlide.title}
                  onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                  placeholder="e.g. Master Carpentry & Custom Woodwork"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                <input
                  type="text"
                  value={newSlide.badge}
                  onChange={(e) => setNewSlide({ ...newSlide, badge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                <input
                  required
                  type="text"
                  value={newSlide.subtitle}
                  onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
                  placeholder="Slide description..."
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Button Label</label>
                <input
                  type="text"
                  value={newSlide.buttonText}
                  onChange={(e) => setNewSlide({ ...newSlide, buttonText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Header Image URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    required
                    type="text"
                    value={newSlide.imageUrl}
                    onChange={(e) => setNewSlide({ ...newSlide, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                  {newSlide.imageUrl && (
                    <img
                      src={newSlide.imageUrl}
                      alt="Thumbnail"
                      className="w-10 h-8 object-cover rounded border border-slate-300 shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Slide to Home Carousel
            </button>
          </form>

          {/* Slides Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Active Header Carousel Slides ({data.heroSlides?.length || 0})
              </span>
              <span className="text-[11px] text-slate-400">Click Edit to change text or images anytime</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Image Preview</th>
                  <th className="p-3.5">Title & Badge</th>
                  <th className="p-3.5">Subtitle</th>
                  <th className="p-3.5">CTA Button</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.heroSlides?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="relative group w-20 h-14 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={s.imageUrl}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 max-w-xs">
                      <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mr-2 uppercase block sm:inline-block w-fit mb-1 sm:mb-0">
                        {s.badge}
                      </span>
                      {s.title}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-sm truncate">{s.subtitle}</td>
                    <td className="p-3.5 text-slate-700 font-semibold">{s.buttonText || 'OUR SERVICES'}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setEditingSlide({ ...s })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Slide Content & Image"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(s.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: AI FOUNDER & POINTING TEXT */}
      {/* ========================================================================= */}
      {activeSubTab === 'owner' && (
        <form onSubmit={handleSaveOwner} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 max-w-3xl">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            AI Founder Profile & Pointing Speech Text
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Founder / Owner Name</label>
              <input
                type="text"
                value={ownerForm.ownerName || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Designation</label>
              <input
                type="text"
                value={ownerForm.ownerTitle || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, ownerTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Section Badge</label>
              <input
                type="text"
                value={ownerForm.badge || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, badge: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Section Heading</label>
              <input
                type="text"
                value={ownerForm.headingText || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, headingText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Founder Image URL / Path</label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={ownerForm.imageUrl || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, imageUrl: e.target.value })}
                  placeholder="/anurag_founder.jpg or custom image URL"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                />
                {ownerForm.imageUrl && (
                  <img
                    src={ownerForm.imageUrl}
                    alt="Founder Preview"
                    className="w-10 h-10 object-cover rounded-full border border-slate-300 shrink-0"
                  />
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-blue-700 uppercase mb-1">
                👉 Pointing Speech Text (Indicated by Founder Image)
              </label>
              <textarea
                rows="4"
                value={ownerForm.indicatedText || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, indicatedText: e.target.value })}
                className="w-full bg-slate-50 border-2 border-blue-200 rounded p-3 text-slate-900 text-sm font-medium outline-none focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded text-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save AI Founder Profile Live</span>
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SERVICE CATEGORIES (CENTRALIZED MANAGEMENT) */}
      {/* ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl shadow-xs text-left">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Single Authoritative Tab</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Service Categories Management Hub</h3>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  To eliminate duplicate modifications and prevent data fragmentation, all category CRUD operations, icons, active status, and soft-delete are now consolidated in the dedicated <strong>Service Categories</strong> front-page tab.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('categories') : null}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer shrink-0"
              >
                <span>Go to Service Categories</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Read-only Summary Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Configured Service Categories ({data.categories?.length || 0})
                </h4>
                <p className="text-[11px] text-slate-500">Live system categories catalog</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('categories') : null}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Manage in Categories Tab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Icon</th>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.categories?.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center p-1 shrink-0">
                        <RenderIcon
                          icon={c.icon}
                          iconName={c.iconName}
                          className="w-4 h-4 text-blue-700"
                          imgClassName="w-6 h-6 object-contain"
                        />
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      /{c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    </td>
                    <td className="p-3.5">
                      {c.active === false ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateTab ? onNavigateTab('categories') : null}
                        className="px-2.5 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded text-xs font-semibold cursor-pointer"
                      >
                        Edit in Categories Tab &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: CUSTOMER REVIEWS */}
      {/* ========================================================================= */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-6">
          <form onSubmit={handleAddReview} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Add Customer Review
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                <input
                  required
                  type="text"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Service Used</label>
                <input
                  type="text"
                  value={newReview.serviceUsed}
                  onChange={(e) => setNewReview({ ...newReview, serviceUsed: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Review Comment</label>
                <textarea
                  required
                  rows="3"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-slate-900 outline-none"
                ></textarea>
              </div>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Review
            </button>
          </form>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Service</th>
                  <th className="p-3.5">Comment</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.reviews?.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{r.name}</td>
                    <td className="p-3.5 text-slate-600">{r.serviceUsed}</td>
                    <td className="p-3.5 text-slate-600 max-w-sm truncate">"{r.comment}"</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => handleDeleteReview(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: ANNOUNCEMENT BAR */}
      {/* ========================================================================= */}
      {activeSubTab === 'announcement' && (
        <form onSubmit={handleSaveAnnouncement} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            Top Announcement Bar
          </h3>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={announcementForm.enabled ?? true}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
            <span className="font-bold text-slate-900 text-sm">Enable Ticker on Customer Website</span>
          </label>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Announcement Text</label>
            <input
              required
              type="text"
              value={announcementForm.text || ''}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3.5 py-2.5 text-slate-900 outline-none"
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            <span>Save Announcement</span>
          </button>
        </form>
      )}

    </div>
  );
}
