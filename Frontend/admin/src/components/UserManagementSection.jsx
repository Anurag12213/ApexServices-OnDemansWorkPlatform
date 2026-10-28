import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export default function UserManagementSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('active');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [notification, setNotification] = useState('');

  const [users, setUsers] = useState([
    {
      id: 'USR-101',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@apexservices.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      role: 'Administrator',
      status: 'Active',
      joined: 'Jan 12, 2026',
      activity: '2 mins ago',
      isDeleted: false,
    },
    {
      id: 'USR-102',
      name: 'Robert Chen',
      email: 'robert.chen@apexservices.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
      role: 'Master Craftsman',
      status: 'Active',
      joined: 'Feb 04, 2026',
      activity: '1 hour ago',
      isDeleted: false,
    },
    {
      id: 'USR-103',
      name: 'Marcus Vance',
      email: 'marcus.v@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
      role: 'Customer',
      status: 'Pending',
      joined: 'Mar 18, 2026',
      activity: 'Yesterday',
      isDeleted: false,
    },
    {
      id: 'USR-104',
      name: 'Alex Vance',
      email: 'alex.vance@apexservices.com',
      avatar: '/ai_owner.jpg',
      role: 'Founder & Operations',
      status: 'Active',
      joined: 'Dec 01, 2025',
      activity: 'Just now',
      isDeleted: false,
    },
  ]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSoftDelete = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDeleted: true } : u))
    );
    showToast('User moved to trash.');
  };

  const handleRestore = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDeleted: false } : u))
    );
    showToast('User restored successfully.');
  };

  const filteredUsers = users.filter((u) => {
    const isTrash = viewMode === 'trash';
    if (u.isDeleted !== isTrash) return false;
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'All Roles' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All Statuses' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User & Client Management</h1>
          <p className="text-sm text-slate-500">Manage admin roles, technicians, and customer service accounts</p>
        </div>

        {notification && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> {notification}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option>All Roles</option>
            <option>Administrator</option>
            <option>Master Craftsman</option>
            <option>Customer</option>
          </select>
        </div>

        {/* View Toggle (Active / Trash) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Active Users ({users.filter((u) => !u.isDeleted).length})
          </button>
          <button
            onClick={() => setViewMode('trash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'trash' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Trash ({users.filter((u) => u.isDeleted).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Joined</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-3.5 flex items-center space-x-3">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div>
                    <span className="font-bold text-slate-900 block">{user.name}</span>
                    <span className="text-[11px] text-slate-400">{user.email}</span>
                  </div>
                </td>
                <td className="p-3.5 font-medium text-slate-700">{user.role}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      user.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-3.5 text-slate-500">{user.joined}</td>
                <td className="p-3.5 text-right">
                  {viewMode === 'active' ? (
                    <button
                      onClick={() => handleSoftDelete(user.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(user.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
