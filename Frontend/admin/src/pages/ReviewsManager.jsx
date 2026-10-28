import React, { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';

export const ReviewsManager = ({ reviews, onAdd, onDelete }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'Homeowner',
    rating: 5,
    comment: '',
    serviceUsed: 'Custom Carpentry',
    date: 'Just now',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.comment) return;
    onAdd(form);
    setForm({
      name: '',
      role: 'Homeowner',
      rating: 5,
      comment: '',
      serviceUsed: 'Custom Carpentry',
      date: 'Just now',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Reviews Management</h2>
          <p className="text-xs text-slate-500">Manage customer testimonials and star ratings.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Review</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddSubmit} className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs text-xs">
          <h3 className="font-bold text-slate-900 uppercase">Create New Review</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sarah Jenkins"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Service Used</label>
              <input
                type="text"
                value={form.serviceUsed}
                onChange={(e) => setForm({ ...form, serviceUsed: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Review Comment</label>
              <textarea
                required
                rows="3"
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Enter review text..."
                className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-slate-900 outline-none"
              ></textarea>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-1.5 rounded">Save Review</button>
            <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-200 text-slate-700 font-semibold px-4 py-1.5 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Service</th>
              <th className="p-3.5">Rating</th>
              <th className="p-3.5">Comment</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900 flex items-center space-x-2">
                  <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <span>{r.name}</span>
                </td>
                <td className="p-3.5 text-slate-600 font-medium">{r.serviceUsed}</td>
                <td className="p-3.5 flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 mr-1" /> {r.rating}/5
                </td>
                <td className="p-3.5 text-slate-600 max-w-xs truncate">"{r.comment}"</td>
                <td className="p-3.5 text-right">
                  <button onClick={() => onDelete(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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
