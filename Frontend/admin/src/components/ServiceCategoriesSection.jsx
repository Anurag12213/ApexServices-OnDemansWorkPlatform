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
} from 'lucide-react';
import CategoryIconSelector, { RenderIcon } from './CategoryIconSelector';
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
    iconId: 1,
    iconName: 'Hammer',
    customIconValue: '',
    description: '',
  });

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Fetch Categories from Spring Boot backend using admin API
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/admin/service-categories');
      if (res.ok) {
        const list = await res.json();
        setCategories(list);
      } else {
        // Fallback to public categories
        const publicRes = await fetch(`${API_BASE_URL}/categories`);
        if (publicRes.ok) {
          const publicList = await publicRes.json();
          setCategories(publicList);
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
      const res = await adminFetch('/admin/service-categories', {
        method: 'POST',
        body: JSON.stringify(newCategory),
      });

      if (res.ok) {
        const saved = await res.json();
        setCategories((prev) => [...prev, saved]);
        setShowAddModal(false);
        setNewCategory({
          name: '',
          slug: '',
          iconId: 1,
          iconName: 'Hammer',
          customIconValue: '',
          description: '',
        });
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
      const res = await adminFetch(`/admin/service-categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCategory(null);
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
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center p-2 border border-blue-200 shrink-0 shadow-2xs">
                            <RenderIcon
                              icon={cat.icon}
                              iconName={cat.iconName}
                              className="w-4 h-4 text-blue-700"
                              imgClassName="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-slate-900 text-xs leading-snug truncate">
                              {cat.name}
                            </h4>
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
      {/* ADD CATEGORY MODAL (COMPLETELY VISIBLE & SCROLLABLE)      */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden text-left animate-fade-in">
            {/* Modal Header (Pinned / Sticky) */}
            <div className="px-5 py-4 border-b border-slate-200 shrink-0 bg-white sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Service Category</h3>
                <p className="text-[11px] text-slate-500">Configure title, URL identifier slug, badge tag, and icon representation.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {categoryError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{categoryError}</span>
              </div>
            )}

            {/* Modal Form Body (Scrollable!) */}
            <form id="add-category-form" onSubmit={handleCreateCategory} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs overscroll-contain">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Identifier / Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. custom-carpentry"
                    value={newCategory.slug || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Icon Representation</label>
                <CategoryIconSelector
                  selectedIconId={newCategory.iconId}
                  selectedIconName={newCategory.iconName}
                  customIconValue={newCategory.customIconValue}
                  onSelectIcon={({ iconId, iconName, customIconValue }) => {
                    setNewCategory((prev) => ({
                      ...prev,
                      iconId,
                      iconName,
                      customIconValue,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Service Scope Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe scope of work, typical technician tasks, and service expectations..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </form>

            {/* Modal Footer (Pinned / Sticky) */}
            <div className="px-5 py-3.5 border-t border-slate-200 shrink-0 bg-slate-50 sticky bottom-0 z-10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryError('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-category-form"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT CATEGORY MODAL (COMPLETELY VISIBLE & SCROLLABLE)     */}
      {/* ======================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden text-left animate-fade-in">
            {/* Modal Header (Pinned / Sticky) */}
            <div className="px-5 py-4 border-b border-slate-200 shrink-0 bg-white sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit: {editingCategory.name}</h3>
                <p className="text-[11px] text-slate-500">Update category details, slug, badge tag, or assigned icon.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {categoryError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{categoryError}</span>
              </div>
            )}

            {/* Modal Form Body (Scrollable!) */}
            <form id="edit-category-form" onSubmit={handleUpdateCategory} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs overscroll-contain">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Identifier / Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Icon Representation</label>
                <CategoryIconSelector
                  selectedIconId={editingCategory.iconId || editingCategory.icon?.id}
                  selectedIconName={editingCategory.iconName || editingCategory.icon?.iconValue}
                  customIconValue={
                    editingCategory.customIconValue ||
                    (editingCategory.icon?.iconType === 'CUSTOM' ? editingCategory.icon?.iconValue : '')
                  }
                  onSelectIcon={({ iconId, iconName, customIconValue }) => {
                    setEditingCategory((prev) => ({
                      ...prev,
                      iconId,
                      iconName,
                      customIconValue,
                      icon: {
                        ...(prev.icon || {}),
                        id: iconId,
                        name: iconName,
                        iconValue: customIconValue || iconName,
                        iconType: customIconValue ? 'CUSTOM' : 'SYSTEM',
                      },
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Service Scope Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </form>

            {/* Modal Footer (Pinned / Sticky) */}
            <div className="px-5 py-3.5 border-t border-slate-200 shrink-0 bg-slate-50 sticky bottom-0 z-10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryError('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-category-form"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
