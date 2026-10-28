import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Sliders, Check } from 'lucide-react';

export const SlidersManager = ({ slides, onAdd, onUpdate, onDelete }) => {
  const [editingSlide, setEditingSlide] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    badge: 'PRO APPROVED SERVICES',
    title: '',
    subtitle: '',
    buttonText: 'Request Service Now',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80',
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.title) return;
    onAdd(form);
    setForm({
      badge: 'PRO APPROVED SERVICES',
      title: '',
      subtitle: '',
      buttonText: 'Request Service Now',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80',
    });
    setShowAddModal(false);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingSlide) return;
    onUpdate(editingSlide.id, editingSlide);
    setEditingSlide(null);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hero Header Sliders Management</h2>
          <p className="text-xs text-slate-500">Manage sliding headers displayed on the customer home page.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Slide</span>
        </button>
      </div>

      {/* Add Slide Modal / Form */}
      {showAddModal && (
        <form onSubmit={handleAddSubmit} className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Create New Hero Slide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Slide Title</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Master Carpentry & Woodwork"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Badge Text</label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Subtitle Description</label>
              <input
                required
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Button Label</label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Image URL</label>
              <input
                required
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <button type="submit" className="bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded">
              Save Slide to Database
            </button>
            <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Standard Enterprise Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="p-3.5">Image</th>
              <th className="p-3.5">Badge & Title</th>
              <th className="p-3.5">Subtitle</th>
              <th className="p-3.5">Button</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slides.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="p-3.5">
                  <img src={s.imageUrl} alt={s.title} className="w-16 h-12 object-cover rounded border border-slate-200" />
                </td>
                <td className="p-3.5 font-bold text-slate-900">
                  <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mr-2 uppercase">{s.badge}</span>
                  {s.title}
                </td>
                <td className="p-3.5 text-slate-600 max-w-xs truncate">{s.subtitle}</td>
                <td className="p-3.5 text-slate-700 font-medium">{s.buttonText}</td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
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
  );
};
