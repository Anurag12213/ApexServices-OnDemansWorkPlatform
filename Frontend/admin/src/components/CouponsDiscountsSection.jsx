import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Filter,
  X,
  DollarSign,
  Copy,
  Users,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { adminFetch } from '../utils/api';

export default function CouponsDiscountsSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderValue: 499,
    maxDiscountCap: 200,
    validUntil: '2026-12-31',
    usageLimitPerUser: 1,
    totalUsageCap: 500,
    applicableCategory: 'ALL'
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to load coupons:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = coupons.filter(
    (c) =>
      (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.applicableCategory || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) {
      toast.error('Please specify a promotional code.');
      return;
    }

    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        discountType: newCoupon.discountType,
        discountValue: Number(newCoupon.discountValue),
        minOrderValue: Number(newCoupon.minOrderValue),
        maxDiscountCap: Number(newCoupon.maxDiscountCap),
        validUntil: newCoupon.validUntil,
        maxRedemptions: Number(newCoupon.totalUsageCap),
        applicableCategory: newCoupon.applicableCategory === 'ALL' ? 'All Services' : newCoupon.applicableCategory
      };

      const res = await adminFetch('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setCoupons([created, ...coupons]);
        toast.success(`Coupon "${created.code}" is live in database!`, 'Coupon Created');
        setShowCreateModal(false);
        setNewCoupon({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minOrderValue: 499,
          maxDiscountCap: 200,
          validUntil: '2026-12-31',
          usageLimitPerUser: 1,
          totalUsageCap: 500,
          applicableCategory: 'ALL'
        });
      }
    } catch (e) {
      toast.error('Failed to create coupon on server.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await adminFetch(`/admin/coupons/${id}/status`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: data.status } : c))
        );
        toast.info(`Coupon status updated to ${data.status}`);
      }
    } catch (e) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    const confirmed = await confirm({
      title: `Retire Coupon ${coupon.code}?`,
      message: 'This will permanently deactivate this promotional code. Existing orders will not be affected.',
      confirmText: 'Retire Coupon',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        const res = await adminFetch(`/admin/coupons/${coupon.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
          toast.success(`Coupon ${coupon.code} retired.`);
        }
      } catch (e) {
        toast.error('Failed to delete coupon on server');
      }
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.info(`Copied "${code}" to clipboard!`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 12 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coupons & Discount Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empower marketing teams to launch, schedule, and retire promotional discount campaigns with realtime usage caps without engineering dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh Coupons"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Promo Code</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Campaigns</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {coupons.filter((c) => c.status === 'ACTIVE').length} Campaigns
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Redemptions</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">
            {coupons.reduce((sum, c) => sum + (Number(c.totalRedemptions) || 0), 0).toLocaleString()} Used
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Promotional Savings</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            ₹{coupons.reduce((sum, c) => sum + (Number(c.totalDiscountGiven) || 0), 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search promo code, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Loading promotional coupon database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Min Order & Cap</th>
                  <th className="py-3.5 px-4">Applicable Category</th>
                  <th className="py-3.5 px-4">Redemptions Progress</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No active discount coupons found in database.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((c) => {
                    const maxR = Number(c.maxRedemptions) || 100;
                    const totR = Number(c.totalRedemptions) || 0;
                    const pct = Math.round((totR / maxR) * 100);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                              {c.code}
                            </span>
                            <button
                              onClick={() => copyCode(c.code)}
                              title="Copy Code"
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">Min: ₹{c.minOrderValue}</div>
                          <div className="text-[10px] text-slate-400">Max Cap: ₹{c.maxDiscountCap}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{c.applicableCategory}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex justify-between text-[11px] font-bold mb-1">
                            <span>{totR} / {maxR}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{c.validUntil}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(c.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[11px] cursor-pointer"
                            >
                              {c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(c)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Retire Coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                Create New Promotional Code
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase)</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. APEXSUMMER"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                <select
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Discount Value ({newCoupon.discountType === 'PERCENTAGE' ? '%' : '₹'})
                </label>
                <input
                  required
                  type="number"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  value={newCoupon.minOrderValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  value={newCoupon.maxDiscountCap}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscountCap: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Redemption Cap</label>
                <input
                  type="number"
                  value={newCoupon.totalUsageCap}
                  onChange={(e) => setNewCoupon({ ...newCoupon, totalUsageCap: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Valid Until</label>
                <input
                  type="date"
                  value={newCoupon.validUntil}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Save to Database
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
