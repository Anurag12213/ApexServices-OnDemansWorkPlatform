import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  Edit,
  Trash2,
  RotateCcw,
  RefreshCw,
  Power,
  ShieldCheck,
  Tag,
  Briefcase,
  Users,
  Archive,
  ArrowRight,
  Sparkles,
  Image,
  Upload,
  FileImage,
} from 'lucide-react';
import { RenderIcon, SYSTEM_ICONS } from './CategoryIconSelector';
import { adminFetch, API_BASE_URL } from '../utils/api';
import { useConfirm } from './ConfirmDialog';

export default function ServiceCategoriesSection() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'archived'
  const [notification, setNotification] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // New Category Form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    tag: 'Popular',
    iconName: 'Hammer',
    iconId: 1,
    bannerImageUrl: '',
  });

  // Load custom category images map from localStorage
  const getCategoryImagesMap = () => {
    try {
      const saved = localStorage.getItem('apex_category_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const compressImage = (file, maxWidth = 900, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const saveCategoryImage = async (catIdOrName, imageUrl) => {
    if (!catIdOrName) return;
    try {
      const map = getCategoryImagesMap();
      if (!imageUrl) {
        delete map[String(catIdOrName)];
      } else {
        map[String(catIdOrName)] = imageUrl;
      }
      localStorage.setItem('apex_category_images', JSON.stringify(map));

      // 1. Sync to backend MySQL database via /admin/settings so customer website receives it
      try {
        await adminFetch('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ categoryImages: map }),
        });
      } catch (err) {
        console.warn('Backend sync failed:', err);
      }

      // 2. Broadcast to other open tabs
      try {
        const syncChannel = new BroadcastChannel('apex_services_sync');
        syncChannel.postMessage({ type: 'DATA_UPDATED', categoryImages: map });
        syncChannel.close();
      } catch (err) {}
    } catch (e) {
      console.warn('Failed to save category image to storage:', e);
    }
  };

  // Direct manual image upload handler for New Category
  const handleNewCategoryFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      if (compressed) {
        setNewCategory((prev) => ({ ...prev, bannerImageUrl: compressed }));
        showToast(`Imported & optimized: ${file.name}`);
      }
    } catch {
      showToast('Failed to process image file.');
    }
  };

  // Direct manual image upload handler for Edit Category
  const handleEditCategoryFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      if (compressed) {
        setEditingCategory((prev) => ({ ...prev, bannerImageUrl: compressed }));
        showToast(`Imported & optimized: ${file.name}`);
      }
    } catch {
      showToast('Failed to process image file.');
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Fetch Categories from Spring Boot backend using admin API
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      let imgMap = getCategoryImagesMap();

      // Load server settings to merge existing category images from database
      try {
        const settingsRes = await adminFetch('/admin/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.categoryImages && typeof settings.categoryImages === 'object') {
            imgMap = { ...settings.categoryImages, ...imgMap };
            localStorage.setItem('apex_category_images', JSON.stringify(imgMap));
          } else if (Object.keys(imgMap).length > 0) {
            // Automatically push local images to server if server doesn't have them yet
            adminFetch('/admin/settings', {
              method: 'PUT',
              body: JSON.stringify({ categoryImages: imgMap }),
            }).catch(() => {});
          }
        }
      } catch (e) {}

      const res = await adminFetch('/admin/service-categories');
      if (res.ok) {
        const list = await res.json();
        const merged = (Array.isArray(list) ? list : []).map((c) => ({
          ...c,
          bannerImageUrl: c.bannerImageUrl || imgMap[String(c.id)] || imgMap[c.name] || imgMap[c.slug] || '',
        }));
        setCategories(merged);
      } else {
        // Fallback to public categories
        const publicRes = await fetch(`${API_BASE_URL}/categories`);
        if (publicRes.ok) {
          const publicList = await publicRes.json();
          const merged = (Array.isArray(publicList) ? publicList : []).map((c) => ({
            ...c,
            bannerImageUrl: c.bannerImageUrl || imgMap[String(c.id)] || imgMap[c.name] || imgMap[c.slug] || '',
          }));
          setCategories(merged);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by search and status filter
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const isArchived = c.active === false || c.isSoftDeleted === true;
      if (statusFilter === 'active' && isArchived) return false;
      if (statusFilter === 'archived' && !isArchived) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchSlug = c.slug?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      return matchName || matchSlug || matchDesc;
    });
  }, [categories, searchQuery, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.active !== false && !c.isSoftDeleted).length;
    const archived = categories.filter((c) => c.active === false || c.isSoftDeleted).length;
    const totalPartners = categories.reduce((sum, c) => sum + (c.partnerCount || 0), 0);
    return { total, active, archived, totalPartners };
  }, [categories]);

  // 1. CREATE CATEGORY HANDLER
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCategory.name.trim()) {
      setCategoryError('Category title is required.');
      return;
    }

    try {
      const payload = {
        name: newCategory.name.trim(),
        slug: newCategory.slug || newCategory.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: newCategory.description || '',
        tag: newCategory.tag || 'Popular',
        iconId: newCategory.iconId || 1,
        iconName: newCategory.iconName || 'Hammer',
        customIconValue: null,
      };

      const res = await adminFetch('/admin/service-categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        
        // Save banner image if provided
        if (newCategory.bannerImageUrl) {
          saveCategoryImage(saved.id, newCategory.bannerImageUrl);
          saveCategoryImage(saved.name, newCategory.bannerImageUrl);
          if (saved.slug) saveCategoryImage(saved.slug, newCategory.bannerImageUrl);
        }

        const savedWithImg = {
          ...saved,
          bannerImageUrl: newCategory.bannerImageUrl || '',
        };

        setCategories((prev) => [...prev, savedWithImg]);
        setShowAddModal(false);
        setNewCategory({
          name: '',
          slug: '',
          description: '',
          tag: 'Popular',
          iconName: 'Hammer',
          iconId: 1,
          bannerImageUrl: '',
        });

        // Notify other tabs via sync channel
        try {
          const syncChannel = new BroadcastChannel('apex_services_sync');
          syncChannel.postMessage({ type: 'DATA_UPDATED' });
          syncChannel.close();
        } catch (err) {}

        showToast(`Category "${saved.name}" successfully created!`);
        fetchCategories(); // Refresh to guarantee sync
      } else {
        const err = await res.json().catch(() => ({}));
        setCategoryError(err.message || 'Failed to create category. Please verify unique name/slug.');
      }
    } catch (e) {
      setCategoryError('Network error connecting to backend service.');
    }
  };

  // 2. UPDATE CATEGORY HANDLER
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!editingCategory || !editingCategory.id) return;

    try {
      const payload = {
        name: editingCategory.name.trim(),
        slug: editingCategory.slug,
        description: editingCategory.description,
        tag: editingCategory.tag || 'Popular',
        iconId: editingCategory.iconId || editingCategory.icon?.id || 1,
        iconName: editingCategory.iconName || editingCategory.icon?.name || 'Hammer',
        customIconValue: null,
      };

      const res = await adminFetch(`/admin/service-categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();

        // Save updated banner image
        saveCategoryImage(editingCategory.id, editingCategory.bannerImageUrl || '');
        saveCategoryImage(editingCategory.name, editingCategory.bannerImageUrl || '');
        if (editingCategory.slug) saveCategoryImage(editingCategory.slug, editingCategory.bannerImageUrl || '');

        const updatedWithImg = {
          ...updated,
          bannerImageUrl: editingCategory.bannerImageUrl || '',
        };

        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updatedWithImg : c)));
        setEditingCategory(null);

        try {
          const syncChannel = new BroadcastChannel('apex_services_sync');
          syncChannel.postMessage({ type: 'DATA_UPDATED' });
          syncChannel.close();
        } catch (err) {}

        showToast(`Category "${updated.name}" updated successfully!`);
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        setCategoryError(err.message || 'Failed to update category.');
      }
    } catch (e) {
      setCategoryError('Network error updating category.');
    }
  };

  // 3. TOGGLE ACTIVE STATUS
  const handleToggleActive = async (id, targetActive) => {
    try {
      const res = await adminFetch(`/admin/service-categories/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: targetActive }),
      });
      if (res.ok) {
        const updated = await res.json().catch(() => ({ id, active: targetActive }));
        const newActive = updated.active !== undefined ? updated.active : targetActive;
        setCategories((prev) =>
          prev.map((c) =>
            Number(c.id) === Number(id)
              ? { ...c, active: newActive, isSoftDeleted: !newActive }
              : c
          )
        );
        showToast(`Category status set to ${newActive ? 'ACTIVE' : 'DEACTIVATED'}.`);
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || `Failed to update status (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating category availability status.');
    }
  };

  // 4. SOFT DELETE CATEGORY (Archives category while preserving bookings/data)
  const handleSoftDelete = async (id, name) => {
    let ok = false;
    try {
      if (confirm) {
        ok = await confirm({
          title: `Soft Delete / Archive Category?`,
          message: `Are you sure you want to soft-delete "${name}"? This hides the category from customer booking and website while preserving all existing booking history and partner assignments. You can restore it anytime.`,
          confirmText: 'Soft Delete Category',
          variant: 'danger',
        });
      } else {
        ok = window.confirm(`Are you sure you want to soft-delete "${name}"?`);
      }
    } catch {
      ok = window.confirm(`Are you sure you want to soft-delete "${name}"?`);
    }
    if (!ok) return;

    try {
      const res = await adminFetch(`/admin/service-categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            Number(c.id) === Number(id) ? { ...c, active: false, isSoftDeleted: true } : c
          )
        );
        showToast(`Category "${name}" soft-deleted and archived.`);
        fetchCategories();
      } else {
        // Fallback to /categories/{id}
        const fallbackRes = await adminFetch(`/categories/${id}`, { method: 'DELETE' });
        if (fallbackRes.ok) {
          setCategories((prev) =>
            prev.map((c) =>
              Number(c.id) === Number(id) ? { ...c, active: false, isSoftDeleted: true } : c
            )
          );
          showToast(`Category "${name}" soft-deleted and archived.`);
          fetchCategories();
        } else {
          showToast('Failed to soft delete category.');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while soft deleting category.');
    }
  };

  // 5. PERMANENT DELETE CATEGORY (For already archived categories)
  const handlePermanentDelete = async (id, name) => {
    let ok = false;
    try {
      if (confirm) {
        ok = await confirm({
          title: `Permanently Delete Category?`,
          message: `Are you sure you want to permanently delete "${name}" from the database? This cannot be undone.`,
          confirmText: 'Permanently Delete',
          variant: 'danger',
        });
      } else {
        ok = window.confirm(`Permanently delete "${name}"?`);
      }
    } catch {
      ok = window.confirm(`Permanently delete "${name}"?`);
    }
    if (!ok) return;

    try {
      const res = await adminFetch(`/admin/service-categories/${id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => Number(c.id) !== Number(id)));
        showToast(`Category "${name}" permanently removed.`);
        fetchCategories();
      } else {
        showToast('Failed to permanently delete category.');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while permanently deleting category.');
    }
  };

  // 6. RESTORE SOFT-DELETED CATEGORY
  const handleRestoreCategory = async (id, name) => {
    try {
      const res = await adminFetch(`/admin/service-categories/${id}/restore`, {
        method: 'POST',
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            Number(c.id) === Number(id) ? { ...c, active: true, isSoftDeleted: false } : c
          )
        );
        showToast(`Category "${name}" successfully restored!`);
        fetchCategories();
      } else {
        // Fallback to status toggle to true
        await handleToggleActive(id, true);
      }
    } catch (e) {
      console.error(e);
      showToast('Error restoring category.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header and Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Service Categories Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized hub for all service category CRUD operations, icons, slugs, tags, active visibility, and soft delete.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchCategories}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setCategoryError('');
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Categories</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 block">{metrics.total}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Configured in database</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active & Published</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5 block">{metrics.active}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Live on booking portal</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Soft-Deleted / Archived</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5 block">{metrics.archived}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Preserved for history</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Assigned Partners</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-700 mt-0.5 block">{metrics.totalPartners}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active provider allocations</span>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto bg-slate-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({metrics.active})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'archived'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Archived / Soft-Deleted ({metrics.archived})
          </button>
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name, slug, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Data Table (Clean, Compact List matching Payment & Transactions) */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No category matches your search query "${searchQuery}".`
              : 'No categories match the selected filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Category & Trade</th>
                  <th className="p-3.5">Slug URL</th>
                  <th className="p-3.5">Allocations</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const isArchived = cat.active === false || cat.isSoftDeleted === true;

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isArchived ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Category & Icon */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {cat.bannerImageUrl ? (
                            <div className="w-12 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative group shadow-2xs">
                              <img
                                src={cat.bannerImageUrl}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center p-2 border border-blue-200 shrink-0 shadow-2xs">
                              <RenderIcon
                                icon={cat.icon}
                                iconName={cat.iconName}
                                className="w-4 h-4 text-blue-700"
                                imgClassName="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-xs leading-snug truncate">
                                {cat.name}
                              </h4>
                              {cat.tag && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                  {cat.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {cat.description || 'No description provided.'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug URL */}
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                          /{cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        </span>
                      </td>

                      {/* Allocations */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                            <Users className="w-3 h-3 text-slate-400" />
                            {cat.partnerCount != null ? cat.partnerCount : 1} Partners
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {cat.requestCount != null ? cat.requestCount : 0} Requests
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Archive className="w-3 h-3 text-amber-600" /> Soft Deleted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Deactivate */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(cat.id, isArchived)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                              isArchived
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                            title={isArchived ? 'Activate Category' : 'Deactivate Category'}
                          >
                            <Power className="w-3 h-3" />
                            <span>{isArchived ? 'Activate' : 'Deactivate'}</span>
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryError('');
                              setEditingCategory({ ...cat });
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer border border-transparent hover:border-blue-200"
                            title="Edit Category Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Restore Actions */}
                          {isArchived ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestoreCategory(cat.id, cat.name)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title="Restore Category"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentDelete(cat.id, cat.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer border border-transparent hover:border-rose-200"
                                title="Permanently Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSoftDelete(cat.id, cat.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer border border-transparent hover:border-rose-200"
                              title="Soft Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD CATEGORY MODAL (CLEAN & CONCISE)                      */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200/90 shadow-2xl overflow-hidden text-left my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Service Category</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure title, slug, tag, and display image.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert */}
            {categoryError && (
              <div className="mx-6 mt-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{categoryError}</span>
              </div>
            )}

            {/* Form Body */}
            <form id="add-category-form" onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Carpentry & Woodwork"
                  value={newCategory.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setNewCategory({
                      ...newCategory,
                      name: val,
                      slug: newCategory.slug && newCategory.slug !== autoSlug ? newCategory.slug : autoSlug,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 text-xs text-slate-800 transition"
                />
              </div>

              {/* Slug, Tag & Badge Icon in 3-column clean grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Identifier (Slug)</label>
                  <input
                    type="text"
                    placeholder="e.g. custom-carpentry"
                    value={newCategory.slug || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-xs focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Popular, 24/7 Service"
                    value={newCategory.tag || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, tag: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Badge Icon</span>
                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                      <RenderIcon iconName={newCategory.iconName || 'Hammer'} className="w-3 h-3" />
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-2.5 pointer-events-none text-blue-600">
                      <RenderIcon iconName={newCategory.iconName || 'Hammer'} className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={newCategory.iconName || 'Hammer'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = SYSTEM_ICONS.find((i) => i.iconValue === val);
                        setNewCategory({
                          ...newCategory,
                          iconName: val,
                          iconId: found ? found.id : 1,
                        });
                      }}
                      className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs focus:bg-white focus:border-blue-500 transition font-medium cursor-pointer"
                    >
                      {SYSTEM_ICONS.map((i) => (
                        <option key={i.id} value={i.iconValue}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Clean, Concise Image Upload Section */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-blue-600" />
                  Category Card Image
                </label>
                
                {newCategory.bannerImageUrl ? (
                  /* Active Image Preview Card */
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={newCategory.bannerImageUrl}
                        alt="Category Preview"
                        className="w-14 h-12 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {newCategory.bannerImageUrl.startsWith('data:') ? 'Custom Uploaded File' : 'External Image Link'}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for live card
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, bannerImageUrl: '' })}
                      className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0"
                    >
                      Change / Remove
                    </button>
                  </div>
                ) : (
                  /* Clean, Unified Image Input Options */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg text-blue-600 font-bold cursor-pointer transition text-xs shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose File from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewCategoryFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-1">OR</span>
                      <input
                        type="text"
                        placeholder="Paste image URL (https://...)"
                        value={newCategory.bannerImageUrl || ''}
                        onChange={(e) => setNewCategory({ ...newCategory, bannerImageUrl: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Service Scope Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe scope of work and services provided..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 text-xs text-slate-800 transition resize-none"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryError('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-category-form"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT CATEGORY MODAL (CLEAN & CONCISE)                     */}
      {/* ======================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200/90 shadow-2xl overflow-hidden text-left my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Edit Category</h3>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                    {editingCategory.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Manage category details and display image.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert */}
            {categoryError && (
              <div className="mx-6 mt-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{categoryError}</span>
              </div>
            )}

            {/* Form Body */}
            <form id="edit-category-form" onSubmit={handleUpdateCategory} className="p-6 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Custom Carpentry"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 text-xs text-slate-800 transition"
                />
              </div>

              {/* Slug, Tag & Badge Icon in 3-column clean grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Identifier (Slug)</label>
                  <input
                    type="text"
                    value={editingCategory.slug || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    placeholder="e.g. custom-carpentry"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-xs focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingCategory.tag || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, tag: e.target.value })}
                    placeholder="e.g. Popular, 24/7 Service"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Badge Icon</span>
                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                      <RenderIcon iconName={editingCategory.iconName || editingCategory.icon?.iconValue || 'Hammer'} className="w-3 h-3" />
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-2.5 pointer-events-none text-blue-600">
                      <RenderIcon iconName={editingCategory.iconName || editingCategory.icon?.iconValue || 'Hammer'} className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={editingCategory.iconName || editingCategory.icon?.iconValue || 'Hammer'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = SYSTEM_ICONS.find((i) => i.iconValue === val);
                        setEditingCategory({
                          ...editingCategory,
                          iconName: val,
                          iconId: found ? found.id : 1,
                          icon: { ...(editingCategory.icon || {}), iconValue: val, name: val, id: found ? found.id : 1 },
                          customIconValue: null,
                        });
                      }}
                      className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs focus:bg-white focus:border-blue-500 transition font-medium cursor-pointer"
                    >
                      {SYSTEM_ICONS.map((i) => (
                        <option key={i.id} value={i.iconValue}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Clean, Concise Image Upload Section */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-blue-600" />
                  Category Card Image
                </label>
                
                {editingCategory.bannerImageUrl ? (
                  /* Active Image Preview Card */
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={editingCategory.bannerImageUrl}
                        alt="Category Preview"
                        className="w-14 h-12 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {editingCategory.bannerImageUrl.startsWith('data:') ? 'Custom Uploaded File' : 'External Image Link'}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for live card
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, bannerImageUrl: '' })}
                      className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0"
                    >
                      Change / Remove
                    </button>
                  </div>
                ) : (
                  /* Clean, Unified Image Input Options */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg text-blue-600 font-bold cursor-pointer transition text-xs shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose File from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditCategoryFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-1">OR</span>
                      <input
                        type="text"
                        placeholder="Paste image URL (https://...)"
                        value={editingCategory.bannerImageUrl || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, bannerImageUrl: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Service Scope Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Describe scope of work and services provided..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 text-xs text-slate-800 transition resize-none"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryError('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-category-form"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
