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
  UserX,
  Eye,
  X,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  Calendar,
  Lock,
  Filter
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

export default function UserManagementSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Customer',
    password: ''
  });

  const [users, setUsers] = useState([
    {
      id: 'USR-101',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@apexservices.com',
      phone: '+91 98100 12345',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      role: 'Administrator',
      status: 'Active',
      verified: true,
      joined: 'Jan 12, 2026',
      activity: '2 mins ago',
      ordersCount: 0,
      totalSpent: 'N/A',
      address: 'Corporate HQ, Connaught Place, New Delhi',
      isDeleted: false,
    },
    {
      id: 'USR-102',
      name: 'Robert Chen',
      email: 'robert.chen@apexservices.com',
      phone: '+91 98200 54321',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
      role: 'Master Craftsman',
      status: 'Active',
      verified: true,
      joined: 'Feb 04, 2026',
      activity: '1 hour ago',
      ordersCount: 48,
      totalSpent: '₹1,24,000 (Earned)',
      address: 'Andheri East, Mumbai, Maharashtra',
      isDeleted: false,
    },
    {
      id: 'USR-103',
      name: 'Marcus Vance',
      email: 'marcus.v@gmail.com',
      phone: '+91 99110 99887',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
      role: 'Customer',
      status: 'Pending Verification',
      verified: false,
      joined: 'Mar 18, 2026',
      activity: 'Yesterday',
      ordersCount: 2,
      totalSpent: '₹2,348',
      address: 'Indiranagar, Bengaluru, Karnataka',
      isDeleted: false,
    },
    {
      id: 'USR-104',
      name: 'Alex Vance',
      email: 'alex.vance@apexservices.com',
      phone: '+91 98450 11223',
      avatar: '/anurag_founder.jpg',
      role: 'Founder & Operations',
      status: 'Active',
      verified: true,
      joined: 'Dec 01, 2025',
      activity: 'Just now',
      ordersCount: 0,
      totalSpent: 'N/A',
      address: 'Executive Suite, ApexServices CyberHub, Gurugram',
      isDeleted: false,
    },
    {
      id: 'USR-105',
      name: 'Pooja Hegde',
      email: 'pooja.h@outlook.com',
      phone: '+91 97411 22334',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      role: 'Customer',
      status: 'Suspended',
      verified: true,
      joined: 'Apr 02, 2026',
      activity: '3 days ago',
      ordersCount: 5,
      totalSpent: '₹6,400',
      address: 'Jubilee Hills, Hyderabad, Telangana',
      isDeleted: false,
    }
  ]);

  const handleToggleSuspend = async (user) => {
    const isSuspending = user.status !== 'Suspended';
    const confirmed = await confirm({
      title: `${isSuspending ? 'Suspend' : 'Unsuspend'} Account for ${user.name}?`,
      message: isSuspending
        ? 'User will be barred from logging in or booking new services.'
        : 'User account will be restored to active standing immediately.',
      confirmText: isSuspending ? 'Suspend Account' : 'Reactivate Account',
      variant: isSuspending ? 'danger' : 'primary'
    });

    if (confirmed) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: isSuspending ? 'Suspended' : 'Active' }
            : u
        )
      );
      toast.info(`Account for ${user.name} is now ${isSuspending ? 'Suspended' : 'Active'}.`);
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => ({
          ...prev,
          status: isSuspending ? 'Suspended' : 'Active'
        }));
      }
    }
  };

  const handleVerifyAccount = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, verified: true, status: u.status === 'Pending Verification' ? 'Active' : u.status }
          : u
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => ({ ...prev, verified: true, status: 'Active' }));
    }
    toast.success('Account marked as officially verified!', 'Verification Complete');
  };

  const handleResetPassword = (user) => {
    toast.info(`Password reset link dispatched to ${user.email}`, 'Reset Link Sent');
  };

  const handleSoftDelete = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDeleted: true } : u))
    );
    toast.info('User moved to trash.');
  };

  const handleRestore = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDeleted: false } : u))
    );
    toast.success('User restored successfully.');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      toast.error('Please enter name and email.');
      return;
    }

    const created = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '+91 99999 00000',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      role: newUser.role,
      status: 'Active',
      verified: true,
      joined: 'Just now',
      activity: 'Just now',
      ordersCount: 0,
      totalSpent: '₹0',
      address: 'New User Account',
      isDeleted: false
    };

    setUsers([created, ...users]);
    toast.success(`User ${created.name} added successfully!`, 'User Created');
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', phone: '', role: 'Customer', password: '' });
  };

  const filteredUsers = users.filter((u) => {
    const isTrash = viewMode === 'trash';
    if (u.isDeleted !== isTrash) return false;
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchRole = roleFilter === 'All Roles' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All Statuses' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 1 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Searchable user registry with profile inspection, account verification, and immediate account suspension controls.
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name, email, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold"
          >
            <option>All Roles</option>
            <option>Administrator</option>
            <option>Master Craftsman</option>
            <option>Customer</option>
            <option>Founder & Operations</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Pending Verification</option>
            <option>Suspended</option>
          </select>
        </div>

        {/* View Toggle (Active / Trash) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'active' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Active Users ({users.filter((u) => !u.isDeleted).length})
          </button>
          <button
            onClick={() => setViewMode('trash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'trash' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Trash ({users.filter((u) => u.isDeleted).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">User Profile</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Verification</th>
              <th className="p-3.5">Account Status</th>
              <th className="p-3.5">Joined Date</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3.5 flex items-center space-x-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{user.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {user.id} • {user.email}
                    </span>
                  </div>
                </td>
                <td className="p-3.5 font-medium text-slate-700">{user.role}</td>
                <td className="p-3.5">
                  {user.verified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerifyAccount(user.id)}
                      className="text-amber-600 font-bold hover:underline text-[11px]"
                    >
                      Verify Now
                    </button>
                  )}
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      user.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : user.status === 'Suspended'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-3.5 text-slate-500">{user.joined}</td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[11px] transition cursor-pointer"
                    >
                      View Profile
                    </button>

                    {viewMode === 'active' ? (
                      <>
                        <button
                          onClick={() => handleToggleSuspend(user)}
                          className={`px-2 py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                            user.status === 'Suspended'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          }`}
                        >
                          {user.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleSoftDelete(user.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRestore(user.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Restore"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Profile Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedUser.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedUser.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                  <span className="font-bold text-slate-900">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Number</span>
                  <span className="font-bold text-slate-900">{selectedUser.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Platform Role</span>
                  <span className="font-bold text-blue-600">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Standing</span>
                  <span className="font-bold text-emerald-600">{selectedUser.status}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Registered Address</span>
                <p className="text-slate-700 font-medium">{selectedUser.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Orders / Bookings</span>
                  <span className="text-base font-black text-slate-900">{selectedUser.ordersCount}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Lifetime Value</span>
                  <span className="text-base font-black text-slate-900">{selectedUser.totalSpent}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleResetPassword(selectedUser)}
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Send Password Reset</span>
              </button>

              <button
                onClick={() => handleToggleSuspend(selectedUser)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                  selectedUser.status === 'Suspended'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {selectedUser.status === 'Suspended' ? 'Unsuspend Account' : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddUser} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add New User</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                >
                  <option value="Customer">Customer</option>
                  <option value="Master Craftsman">Master Craftsman / Partner</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
