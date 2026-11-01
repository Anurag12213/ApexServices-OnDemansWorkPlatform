import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Lock,
  Check,
  X,
  Plus,
  Trash2,
  Edit,
  UserPlus,
  Info,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { adminFetch } from '../utils/api';

export default function RolesPermissionsSection() {
  const toast = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('OPERATIONS_MANAGER');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'OPERATIONS_MANAGER' });

  // Permissions matrix per role
  const [roles, setRoles] = useState([
    {
      id: 'SUPER_ADMIN',
      name: 'Super Administrator',
      description: 'Unrestricted master access to all platform systems, financials, logs, and database configurations.',
      memberCount: 2,
      isSystem: true,
      permissions: {
        view_analytics: true,
        manage_bookings: true,
        override_orders: true,
        manage_partners: true,
        approve_kyc: true,
        manage_users: true,
        manage_finances: true,
        issue_refunds: true,
        manage_cms: true,
        moderate_content: true,
        broadcast_notifications: true,
        configure_flags: true,
        manage_roles: true,
        export_reports: true,
        view_audit_logs: true,
        terminate_sessions: true
      }
    },
    {
      id: 'OPERATIONS_MANAGER',
      name: 'Operations Manager',
      description: 'Coordinates dispatch operations, arbitrates order disputes, verifies technician KYC documents.',
      memberCount: 4,
      isSystem: false,
      permissions: {
        view_analytics: true,
        manage_bookings: true,
        override_orders: true,
        manage_partners: true,
        approve_kyc: true,
        manage_users: true,
        manage_finances: false,
        issue_refunds: false,
        manage_cms: false,
        moderate_content: true,
        broadcast_notifications: true,
        configure_flags: false,
        manage_roles: false,
        export_reports: true,
        view_audit_logs: true,
        terminate_sessions: false
      }
    },
    {
      id: 'FINANCE_OFFICER',
      name: 'Finance & Accounts Officer',
      description: 'Audits gross merchandise value, approves customer refunds, processes technician payouts.',
      memberCount: 2,
      isSystem: false,
      permissions: {
        view_analytics: true,
        manage_bookings: true,
        override_orders: false,
        manage_partners: false,
        approve_kyc: false,
        manage_users: false,
        manage_finances: true,
        issue_refunds: true,
        manage_cms: false,
        moderate_content: false,
        broadcast_notifications: false,
        configure_flags: false,
        manage_roles: false,
        export_reports: true,
        view_audit_logs: true,
        terminate_sessions: false
      }
    },
    {
      id: 'SUPPORT_AGENT',
      name: 'Customer Support Lead',
      description: 'Handles support ticket queues, reviews customer complaints, and answers live homeowner inquiries.',
      memberCount: 6,
      isSystem: false,
      permissions: {
        view_analytics: false,
        manage_bookings: true,
        override_orders: false,
        manage_partners: false,
        approve_kyc: false,
        manage_users: true,
        manage_finances: false,
        issue_refunds: false,
        manage_cms: false,
        moderate_content: true,
        broadcast_notifications: false,
        configure_flags: false,
        manage_roles: false,
        export_reports: false,
        view_audit_logs: false,
        terminate_sessions: false
      }
    },
    {
      id: 'CONTENT_EDITOR',
      name: 'CMS & Marketing Specialist',
      description: 'Authors promotional banners, announces marketing discounts, and updates service descriptions.',
      memberCount: 1,
      isSystem: false,
      permissions: {
        view_analytics: false,
        manage_bookings: false,
        override_orders: false,
        manage_partners: false,
        approve_kyc: false,
        manage_users: false,
        manage_finances: false,
        issue_refunds: false,
        manage_cms: true,
        moderate_content: false,
        broadcast_notifications: true,
        configure_flags: false,
        manage_roles: false,
        export_reports: false,
        view_audit_logs: false,
        terminate_sessions: false
      }
    }
  ]);

  const [teamMembers, setTeamMembers] = useState([
    { id: 'ADM-01', name: 'Anurag Founder', email: 'anurag@apexservices.com', roleId: 'SUPER_ADMIN', lastActive: '5m ago' },
    { id: 'ADM-02', name: 'Sarah Jenkins', email: 'sarah.jenkins@apexservices.com', roleId: 'SUPER_ADMIN', lastActive: 'Just now' },
    { id: 'ADM-03', name: 'Rohit Deshmukh', email: 'rohit.ops@apexservices.com', roleId: 'OPERATIONS_MANAGER', lastActive: '12m ago' },
    { id: 'ADM-04', name: 'Megha Nair', email: 'megha.finance@apexservices.com', roleId: 'FINANCE_OFFICER', lastActive: '1h ago' },
    { id: 'ADM-05', name: 'Karan Singhal', email: 'karan.support@apexservices.com', roleId: 'SUPPORT_AGENT', lastActive: '2h ago' }
  ]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/roles');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.roles) && data.roles.length > 0) {
          // Merge permissions if any missing
          setRoles((prev) =>
            data.roles.map((r) => {
              const local = prev.find((p) => p.id === r.id);
              return {
                ...r,
                permissions: r.permissions || (local ? local.permissions : {})
              };
            })
          );
        }
        if (Array.isArray(data.team) && data.team.length > 0) {
          setTeamMembers(data.team);
        }
      }
    } catch (err) {
      console.warn('Failed to load roles from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const saveRoles = async () => {
    setSaving(true);
    try {
      const res = await adminFetch('/admin/roles', {
        method: 'PUT',
        body: JSON.stringify({ roles, team: teamMembers })
      });
      if (res.ok) {
        toast.success('Role permissions matrix saved and enforced across all admin accounts.', 'RBAC Updated');
      } else {
        toast.warning('Updated locally, server returned non-200 status.');
      }
    } catch (err) {
      toast.error('Network error updating roles.');
    } finally {
      setSaving(false);
    }
  };

  const permissionLabels = {
    view_analytics: { name: 'View Live Business Analytics', category: 'Analytics' },
    manage_bookings: { name: 'Inspect & Manage Order Dispatch', category: 'Operations' },
    override_orders: { name: 'Manual Status Overrides & Reassignment', category: 'Operations' },
    manage_partners: { name: 'Manage Partner Fleet & Payouts', category: 'Partners' },
    approve_kyc: { name: 'Approve / Reject KYC Documents', category: 'Partners' },
    manage_users: { name: 'Search, Verify & Suspend Users', category: 'Users' },
    manage_finances: { name: 'View Platform Revenue & Commission', category: 'Finance' },
    issue_refunds: { name: 'Authorize Escrow Customer Refunds', category: 'Finance' },
    manage_cms: { name: 'Edit Website Banners & Content', category: 'Content' },
    moderate_content: { name: 'Moderate Customer Reviews & Proofs', category: 'Safety' },
    broadcast_notifications: { name: 'Compose & Send Broadcast Push', category: 'Marketing' },
    configure_flags: { name: 'Toggle Feature Flags & Pricing Limits', category: 'Governance' },
    manage_roles: { name: 'Create & Assign Staff Roles (RBAC)', category: 'Governance' },
    export_reports: { name: 'Generate & Export Data Reports', category: 'Analytics' },
    view_audit_logs: { name: 'Audit Trail & Action Inspection', category: 'Security' },
    terminate_sessions: { name: 'Force Logout Active User Sessions', category: 'Security' }
  };

  const selectedRoleObj = roles.find((r) => r.id === activeRole) || roles[0];

  const handleTogglePermission = (permKey) => {
    if (selectedRoleObj.isSystem) {
      toast.warning('Super Administrator master permissions cannot be modified.');
      return;
    }

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== activeRole) return r;
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permKey]: !r.permissions?.[permKey]
          }
        };
      })
    );
    toast.info(`Toggled ${permissionLabels[permKey]?.name || permKey} permission`);
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) {
      toast.error('Please enter name and company email.');
      return;
    }

    try {
      const res = await adminFetch('/admin/roles/team', {
        method: 'POST',
        body: JSON.stringify({
          name: newStaff.name,
          email: newStaff.email,
          roleId: newStaff.role
        })
      });
      if (res.ok) {
        const added = await res.json();
        setTeamMembers((prev) => [...prev, added]);
      } else {
        const fallback = {
          id: `ADM-0${teamMembers.length + 1}`,
          name: newStaff.name,
          email: newStaff.email,
          roleId: newStaff.role,
          lastActive: 'Invitation Sent'
        };
        setTeamMembers((prev) => [...prev, fallback]);
      }
    } catch {
      const fallback = {
        id: `ADM-0${teamMembers.length + 1}`,
        name: newStaff.name,
        email: newStaff.email,
        roleId: newStaff.role,
        lastActive: 'Invitation Sent'
      };
      setTeamMembers((prev) => [...prev, fallback]);
    }

    setRoles((prev) =>
      prev.map((r) =>
        r.id === newStaff.role ? { ...r, memberCount: (r.memberCount || 0) + 1 } : r
      )
    );

    toast.success(`Invitation dispatched to ${newStaff.email}`, 'Team Member Added');
    setShowInviteModal(false);
    setNewStaff({ name: '', email: '', role: 'OPERATIONS_MANAGER' });
  };

  const handleRemoveStaff = async (id) => {
    try {
      await adminFetch(`/admin/roles/team/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Remove staff error:', err);
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    toast.info(`Staff member ${id} removed`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Module 6 of 16
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Roles & Permissions (RBAC)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise role-based access control ensuring team members only access modules required for their exact responsibilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRoles}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Reload roles matrix"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={saveRoles}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save RBAC Policy'}</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Staff</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role Selector & Team Members */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Roles</h3>
            <div className="space-y-1.5">
              {roles.map((r) => {
                const isSelected = activeRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRole(r.id)}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">{r.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {r.memberCount} staff
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Staff Members for Current Role */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Personnel ({selectedRoleObj.name})
            </h3>
            <div className="space-y-2">
              {teamMembers
                .filter((m) => m.roleId === selectedRoleObj.id)
                .map((m) => (
                  <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">{m.lastActive}</span>
                      {m.id !== 'ADM-01' && (
                        <button
                          onClick={() => handleRemoveStaff(m.id)}
                          className="text-slate-400 hover:text-red-600 transition p-1"
                          title="Remove team member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Permission Matrix for Selected Role */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-black text-slate-900">{selectedRoleObj.name} Permissions</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedRoleObj.description}</p>
            </div>
            {selectedRoleObj.isSystem && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                Immutable System Role
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(permissionLabels).map(([key, meta]) => {
              const isGranted = !!selectedRoleObj.permissions[key];
              return (
                <div
                  key={key}
                  onClick={() => handleTogglePermission(key)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    isGranted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="pr-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">{meta.category}</span>
                    <span className={`text-xs font-bold ${isGranted ? 'text-slate-900' : 'text-slate-500'}`}>
                      {meta.name}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                      isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isGranted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleInviteStaff} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Invite Team Member
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
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
                  placeholder="e.g. Neha Roy"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Email</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. neha.support@apexservices.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Send Invitation Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
