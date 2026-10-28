import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  User,
  Radio,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Bell,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Star,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
  Power,
  RotateCcw,
  Sparkles,
  FileText,
  DollarSign,
  Briefcase,
  ArrowRight,
  AlertOctagon,
  Check,
  UserCheck,
  UserX,
  CheckCircle,
} from 'lucide-react';
import { adminFetch, API_BASE_URL } from '../utils/api';
import { useConfirm } from './ConfirmDialog';

export default function ServiceOperationsSection({ onNavigateTab }) {
  const confirm = useConfirm();
  // 3 Primary Tabs: 'partners' | 'users' | 'requests'
  const [activeSubTab, setActiveSubTab] = useState('requests'); 
  // Requests sub-views: 'live' | 'assigned' | 'past'
  const [requestView, setRequestView] = useState('live'); 
  const [notification, setNotification] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // ==========================================
  // 1. PARTNERS STATE & HANDLERS
  // ==========================================
  const [partners, setPartners] = useState([
    {
      id: 'PRT-101',
      name: 'Rajesh Sharma',
      category: 'Custom Carpentry',
      phone: '+91 98234 11200',
      email: 'rajesh.woodcraft@gmail.com',
      rating: '4.9',
      jobsCompleted: 142,
      commissionRate: 80,
      status: 'Active', // 'Active' | 'Suspended' | 'Warned' | 'Soft Deleted'
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Jan 15, 2026',
      warnings: [],
    },
    {
      id: 'PRT-102',
      name: 'Vikram Rathore',
      category: 'Emergency Plumbing',
      phone: '+91 98112 55430',
      email: 'vikram.plumbing@yahoo.com',
      rating: '4.9',
      jobsCompleted: 188,
      commissionRate: 80,
      status: 'Active',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Feb 02, 2026',
      warnings: [],
    },
    {
      id: 'PRT-103',
      name: 'Amit Verma',
      category: 'Electrical Maintenance',
      phone: '+91 98334 77810',
      email: 'amit.electric@apex.com',
      rating: '4.8',
      jobsCompleted: 115,
      commissionRate: 80,
      status: 'Warned',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Mar 10, 2026',
      warnings: ['Arrival 20 mins delayed on REQ-1004'],
    },
    {
      id: 'PRT-104',
      name: 'Sunil Jadhav',
      category: 'Painting & Decor',
      phone: '+91 98450 33211',
      email: 'sunil.decor@gmail.com',
      rating: '4.9',
      jobsCompleted: 96,
      commissionRate: 80,
      status: 'Active',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Mar 25, 2026',
      warnings: [],
    },
    {
      id: 'PRT-105',
      name: 'Deepak Nair',
      category: 'HVAC & AC Service',
      phone: '+91 98670 99420',
      email: 'deepak.hvac@apex.com',
      rating: '4.7',
      jobsCompleted: 134,
      commissionRate: 80,
      status: 'Suspended',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Jan 28, 2026',
      warnings: ['Temporary suspension pending license re-certification.'],
    },
  ]);

  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('All');

  // Multi-step Add Partner Modal
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [addPartnerStep, setAddPartnerStep] = useState(1);
  const [newPartner, setNewPartner] = useState({
    name: '',
    category: 'Emergency Plumbing',
    phone: '',
    email: '',
    experience: '5',
    licenseNo: '',
    commissionRate: 80,
    upiId: '',
    city: 'Mumbai',
  });

  // Edit Partner Modal
  const [editingPartner, setEditingPartner] = useState(null);

  // Send Warning Modal
  const [warningPartner, setWarningPartner] = useState(null);
  const [warningForm, setWarningForm] = useState({
    severity: 'Quality Warning',
    message: '',
    sendSms: true,
  });

  // Toggle Suspend / Unsuspend Partner
  const handleToggleSuspendPartner = async (partner) => {
    const isCurrentlySuspended = partner.status === 'Suspended';
    const actionLabel = isCurrentlySuspended ? 'Reactivate' : 'Suspend';
    const ok = await confirm({
      title: `${actionLabel} Specialist Partner?`,
      message: isCurrentlySuspended
        ? `Reactivate ${partner.name}? They will immediately be eligible to receive live dispatches again.`
        : `Are you sure you want to suspend ${partner.name}? They will be blocked from receiving incoming live dispatches.`,
      confirmText: actionLabel,
      variant: isCurrentlySuspended ? 'info' : 'danger',
    });
    if (!ok) return;

    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === partner.id) {
          const newStatus = isCurrentlySuspended ? 'Active' : 'Suspended';
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
    showToast(
      isCurrentlySuspended
        ? `Partner ${partner.name} has been reactivated to Active roster.`
        : `Partner ${partner.name} has been SUSPENDED.`
    );
  };

  // Toggle Soft Delete
  const handleToggleSoftDeletePartner = (id) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isDeleted = p.status === 'Soft Deleted';
          const newStatus = isDeleted ? 'Active' : 'Soft Deleted';
          showToast(`Partner ${p.name} has been ${isDeleted ? 'restored to Active' : 'soft deleted'}.`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Save Edit Partner
  const handleSaveEditPartner = (e) => {
    e.preventDefault();
    setPartners((prev) =>
      prev.map((p) => (p.id === editingPartner.id ? { ...editingPartner } : p))
    );
    showToast(`Partner ${editingPartner.name} details updated.`);
    setEditingPartner(null);
  };

  // Send Warning
  const handleSendWarning = (e) => {
    e.preventDefault();
    if (!warningForm.message.trim()) {
      showToast('Please enter a warning message before sending.');
      return;
    }
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === warningPartner.id) {
          return {
            ...p,
            status: 'Warned',
            warnings: [...(p.warnings || []), `${warningForm.severity}: ${warningForm.message}`],
          };
        }
        return p;
      })
    );
    showToast(`Official warning dispatched to ${warningPartner.name}.`);
    setWarningPartner(null);
    setWarningForm({ severity: 'Quality Warning', message: '', sendSms: true });
  };

  // Add Partner Submit
  const handleAddPartnerSubmit = (e) => {
    e.preventDefault();
    const created = {
      id: 'PRT-' + (100 + partners.length + 1),
      name: newPartner.name,
      category: newPartner.category,
      phone: newPartner.phone,
      email: newPartner.email,
      rating: '5.0',
      jobsCompleted: 0,
      commissionRate: newPartner.commissionRate,
      status: 'Active',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Oct 2026',
      warnings: [],
    };
    setPartners([created, ...partners]);
    showToast(`New certified partner ${created.name} onboarded successfully!`);
    setShowAddPartnerModal(false);
    setAddPartnerStep(1);
    setNewPartner({
      name: '',
      category: 'Emergency Plumbing',
      phone: '',
      email: '',
      experience: '5',
      licenseNo: '',
      commissionRate: 80,
      upiId: '',
      city: 'Mumbai',
    });
  };

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        p.phone.includes(partnerSearch);
      const matchStatus = partnerFilter === 'All' || p.status === partnerFilter;
      return matchSearch && matchStatus;
    });
  }, [partners, partnerSearch, partnerFilter]);

  // ==========================================
  // 2. USERS (CUSTOMERS) STATE & HANDLERS
  // ==========================================
  const [users, setUsers] = useState([
    {
      id: 'USR-201',
      name: 'Anurag Sharma',
      email: 'customer@example.com',
      phone: '+91 98765 43210',
      city: 'Mumbai, Bandra West',
      status: 'Active', // 'Active' | 'Suspended' | 'Inactive'
      totalBookings: 6,
      totalSpend: '₹4,850',
      joinDate: 'Jan 10, 2026',
      notes: 'Frequent weekend carpentry and electrical client.',
    },
    {
      id: 'USR-202',
      name: 'Priya Sharma',
      email: 'priya.s@yahoo.com',
      phone: '+91 98123 45678',
      city: 'Pune, Kothrud',
      status: 'Active',
      totalBookings: 3,
      totalSpend: '₹2,490',
      joinDate: 'Feb 14, 2026',
      notes: 'Plumbing and home improvement inquiries.',
    },
    {
      id: 'USR-203',
      name: 'David Miller',
      email: 'dmiller@tech.io',
      phone: '+91 98345 67890',
      city: 'Bangalore, Indiranagar',
      status: 'Active',
      totalBookings: 4,
      totalSpend: '₹3,750',
      joinDate: 'Mar 01, 2026',
      notes: 'Prefers same-day evening appointments.',
    },
    {
      id: 'USR-204',
      name: 'Kavita Reddy',
      email: 'kavita.r@gmail.com',
      phone: '+91 98901 23456',
      city: 'Hyderabad, Hitec City',
      status: 'Suspended',
      totalBookings: 1,
      totalSpend: '₹599',
      joinDate: 'Mar 18, 2026',
      notes: 'Account suspended due to repeated unpaid cancellation abuse.',
    },
    {
      id: 'USR-205',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@outlook.com',
      phone: '+91 98456 78901',
      city: 'Delhi, GK-II',
      status: 'Active',
      totalBookings: 2,
      totalSpend: '₹1,800',
      joinDate: 'Apr 02, 2026',
      notes: 'Painting & home decor customer.',
    },
  ]);

  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    notes: '',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUserRequests, setViewingUserRequests] = useState(null);

  // Toggle Suspend / Reactivate User
  const handleToggleSuspendUser = async (user) => {
    const isCurrentlySuspended = user.status === 'Suspended';
    const actionLabel = isCurrentlySuspended ? 'Reactivate' : 'Suspend';
    const ok = await confirm({
      title: `${actionLabel} User Account?`,
      message: isCurrentlySuspended
        ? `Reactivate account for ${user.name}? They will be allowed to book service requests again.`
        : `Are you sure you want to suspend ${user.name}? They will be prevented from placing new bookings.`,
      confirmText: actionLabel,
      variant: isCurrentlySuspended ? 'info' : 'danger',
    });
    if (!ok) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id) {
          const newStatus = isCurrentlySuspended ? 'Active' : 'Suspended';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
    showToast(
      isCurrentlySuspended
        ? `User ${user.name} reactivated successfully.`
        : `User ${user.name} has been SUSPENDED.`
    );
  };

  // Add User Submit
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.phone.trim()) {
      showToast('Name and phone are required.');
      return;
    }
    const createdUser = {
      id: 'USR-' + (200 + users.length + 1),
      name: newUser.name,
      email: newUser.email || `${newUser.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: newUser.phone,
      city: newUser.city || 'Mumbai',
      status: 'Active',
      totalBookings: 0,
      totalSpend: '₹0',
      joinDate: 'Today',
      notes: newUser.notes || 'Registered by administrator.',
    };
    setUsers([createdUser, ...users]);
    showToast(`New user ${createdUser.name} created successfully!`);
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', phone: '', city: 'Mumbai', notes: '' });
  };

  // Save Edit User
  const handleSaveEditUser = (e) => {
    e.preventDefault();
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...editingUser } : u))
    );
    showToast(`User ${editingUser.name} details updated.`);
    setEditingUser(null);
  };

  // Delete User
  const handleDeleteUser = async (id, name) => {
    const ok = await confirm({
      title: 'Remove User Record?',
      message: `Are you sure you want to remove user "${name}"?`,
      confirmText: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast(`User ${name} removed.`);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone.includes(userSearch) ||
        u.city.toLowerCase().includes(userSearch.toLowerCase());
      const matchStatus = userFilter === 'All' || u.status === userFilter;
      return matchSearch && matchStatus;
    });
  }, [users, userSearch, userFilter]);

  // ==========================================
  // 3. REQUESTS STATE (LIVE, ASSIGNED, PAST)
  // ==========================================
  const [allRequests, setAllRequests] = useState([
    // Sample Live / Unassigned Requests
    {
      id: 'REQ-1001',
      customerName: 'Anurag Sharma',
      customerEmail: 'customer@example.com',
      phone: '+91 98765 43210',
      serviceCategory: 'Custom Carpentry',
      category: 'Custom Carpentry',
      problemTitle: 'Loose Cabinet Hinges & Alignment',
      problemDescription: 'Kitchen wall cabinet door hinges are loose and sagging. Need realignment and heavy duty screws.',
      serviceAddress: 'Flat 402, Sea Breeze Apts, Bandra West, Mumbai',
      preferredDate: 'Today',
      timeSlot: 'Morning (9:00 AM - 12:00 PM)',
      urgency: 'Standard',
      status: 'FINDING_PARTNER', // Not accepted by partner yet
      assignedPartnerName: null,
      partnerPhoto: null,
      partnerPhone: null,
      estimatedFee: '₹499',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'REQ-1002',
      customerName: 'Priya Sharma',
      customerEmail: 'priya.s@yahoo.com',
      phone: '+91 98123 45678',
      serviceCategory: 'Emergency Plumbing',
      category: 'Emergency Plumbing',
      problemTitle: 'Main Bathroom Pipe Leakage',
      problemDescription: 'Water pipe joint under the sink is dripping continuously. Urgent fix required.',
      serviceAddress: 'Plot 18, Mayur Colony, Kothrud, Pune',
      preferredDate: 'Today',
      timeSlot: 'Immediate (Within 45 Mins)',
      urgency: 'Priority Same-Day',
      status: 'WAITING_ACCEPTANCE', // Broadcasted, waiting for partner
      assignedPartnerName: null,
      partnerPhoto: null,
      partnerPhone: null,
      estimatedFee: '₹399',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    // Sample Ongoing Assigned Requests
    {
      id: 'REQ-1003',
      customerName: 'David Miller',
      customerEmail: 'dmiller@tech.io',
      phone: '+91 98345 67890',
      serviceCategory: 'Electrical Maintenance',
      category: 'Electrical Maintenance',
      problemTitle: 'MCB Tripping Frequently',
      problemDescription: 'Living room circuit breaker trips whenever AC and TV run simultaneously. Need load test.',
      serviceAddress: '12th Main, HAL 2nd Stage, Indiranagar, Bangalore',
      preferredDate: 'Today',
      timeSlot: 'Afternoon (1:00 PM - 4:00 PM)',
      urgency: 'Priority Same-Day',
      status: 'IN_PROGRESS', // Ongoing working request
      assignedPartnerName: 'Amit Verma',
      partnerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      partnerPhone: '+91 98334 77810',
      estimatedFee: '₹349',
      otpVerified: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'REQ-1004',
      customerName: 'Rohan Mehta',
      customerEmail: 'rohan.mehta@outlook.com',
      phone: '+91 98456 78901',
      serviceCategory: 'Painting & Decor',
      category: 'Painting & Decor',
      problemTitle: 'Water Seepage Wall Touchup',
      problemDescription: 'Moisture patch behind living room sofa needs scraping, primer and acrylic touchup.',
      serviceAddress: 'B-44, Greater Kailash Part 2, New Delhi',
      preferredDate: 'Today',
      timeSlot: 'Morning (10:00 AM)',
      urgency: 'Standard',
      status: 'ARRIVED', // Ongoing working request
      assignedPartnerName: 'Sunil Jadhav',
      partnerPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
      partnerPhone: '+91 98450 33211',
      estimatedFee: '₹599',
      otpVerified: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    // Sample Past / Completed Requests (Newly completed come at top!)
    {
      id: 'REQ-1005',
      customerName: 'Anurag Sharma',
      customerEmail: 'customer@example.com',
      phone: '+91 98765 43210',
      serviceCategory: 'Custom Carpentry',
      category: 'Custom Carpentry',
      problemTitle: 'Wooden Door Trimming & Lock Fitting',
      problemDescription: 'Teak wood door dragging on tiles repaired and brass mortise lock installed.',
      serviceAddress: 'Flat 402, Sea Breeze Apts, Bandra West, Mumbai',
      preferredDate: 'Yesterday',
      timeSlot: 'Morning (11:00 AM)',
      urgency: 'Standard',
      status: 'COMPLETED',
      assignedPartnerName: 'Rajesh Sharma',
      partnerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      partnerPhone: '+91 98234 11200',
      estimatedFee: '₹1,420',
      invoiceAmount: '₹1,420',
      rating: 5,
      reviewComment: 'Exceptional craftsmanship! Cleaned up the sawdust afterwards.',
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: 'REQ-1006',
      customerName: 'Priya Sharma',
      customerEmail: 'priya.s@yahoo.com',
      phone: '+91 98123 45678',
      serviceCategory: 'Emergency Plumbing',
      category: 'Emergency Plumbing',
      problemTitle: 'Overhead Tank Float Valve Replacement',
      problemDescription: 'Water overflow stopped by replacing brass ball valve on roof tank.',
      serviceAddress: 'Plot 18, Mayur Colony, Kothrud, Pune',
      preferredDate: '2 Days Ago',
      timeSlot: 'Afternoon (2:00 PM)',
      urgency: 'Standard',
      status: 'COMPLETED',
      assignedPartnerName: 'Vikram Rathore',
      partnerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      partnerPhone: '+91 98112 55430',
      estimatedFee: '₹1,880',
      invoiceAmount: '₹1,880',
      rating: 5,
      reviewComment: 'Arrived within 30 minutes and resolved the overflow completely.',
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
  ]);

  const [requestSearch, setRequestSearch] = useState('');
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [assignPartnerModalReq, setAssignPartnerModalReq] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Live Work Requests from Spring Boot & Local Storage
  const fetchWorkRequests = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch(`/work-requests`);
      if (res.ok) {
        const backendList = await res.json();
        if (Array.isArray(backendList) && backendList.length > 0) {
          setAllRequests((prev) => {
            const map = new Map();
            // Preserve sample records first
            prev.forEach((r) => map.set(r.id, r));
            // Merge backend records
            backendList.forEach((b) => map.set(b.id, { ...map.get(b.id), ...b }));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {
      console.warn('Backend work-requests fetch transient issue:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkRequests();
    const interval = setInterval(fetchWorkRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter requests into 3 categories:
  // 1. LIVE REQUESTS: All new requests coming from user for service that are NOT accepted by partner yet
  const liveRequestsList = useMemo(() => {
    return allRequests
      .filter((r) => {
        const isNotAccepted =
          !r.assignedPartnerName ||
          r.status === 'FINDING_PARTNER' ||
          r.status === 'WAITING_ACCEPTANCE' ||
          r.status === 'BROADCASTED' ||
          r.status === 'OPEN' ||
          r.status === 'PENDING' ||
          r.status === 'UNASSIGNED';
        const matchSearch =
          !requestSearch ||
          (r.id && r.id.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.customerName && r.customerName.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.serviceCategory && r.serviceCategory.toLowerCase().includes(requestSearch.toLowerCase()));
        return isNotAccepted && matchSearch;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [allRequests, requestSearch]);

  // 2. ASSIGNED REQUESTS: All ongoing working requests
  const assignedRequestsList = useMemo(() => {
    return allRequests
      .filter((r) => {
        const isWorking =
          r.assignedPartnerName &&
          (r.status === 'ASSIGNED' ||
            r.status === 'PARTNER_ASSIGNED' ||
            r.status === 'EN_ROUTE' ||
            r.status === 'ARRIVED' ||
            r.status === 'IN_PROGRESS' ||
            r.status === 'WORKING');
        const matchSearch =
          !requestSearch ||
          (r.id && r.id.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.customerName && r.customerName.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.assignedPartnerName && r.assignedPartnerName.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.serviceCategory && r.serviceCategory.toLowerCase().includes(requestSearch.toLowerCase()));
        return isWorking && matchSearch;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [allRequests, requestSearch]);

  // 3. PAST REQUESTS: Completed requests, SORTED SO EVERY NEWLY COMPLETED REQUEST COMES AT TOP!
  const pastRequestsList = useMemo(() => {
    return allRequests
      .filter((r) => {
        const isPast =
          r.status === 'COMPLETED' ||
          r.status === 'CLOSED' ||
          r.status === 'RESOLVED' ||
          r.status === 'CANCELLED';
        const matchSearch =
          !requestSearch ||
          (r.id && r.id.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.customerName && r.customerName.toLowerCase().includes(requestSearch.toLowerCase())) ||
          (r.serviceCategory && r.serviceCategory.toLowerCase().includes(requestSearch.toLowerCase()));
        return isPast && matchSearch;
      })
      .sort((a, b) => {
        // Strict timestamp sorting: newest completed at the very top!
        const timeA = new Date(a.completedAt || a.date || a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.completedAt || b.date || b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [allRequests, requestSearch]);

  // Manual Assign Partner to a Live Request
  const handleManualAssign = (reqId, partner) => {
    setAllRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'PARTNER_ASSIGNED',
            assignedPartnerName: partner.name,
            partnerPhone: partner.phone,
            partnerPhoto: partner.photo,
          };
        }
        return r;
      })
    );
    showToast(`Request ${reqId} assigned directly to specialist ${partner.name}!`);
    setAssignPartnerModalReq(null);
  };

  // Advance Stage handler
  const handleAdvanceStage = (reqId) => {
    setAllRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          let nextStatus = r.status;
          let completedAt = r.completedAt;
          if (r.status === 'PARTNER_ASSIGNED' || r.status === 'ASSIGNED') nextStatus = 'EN_ROUTE';
          else if (r.status === 'EN_ROUTE') nextStatus = 'ARRIVED';
          else if (r.status === 'ARRIVED') nextStatus = 'IN_PROGRESS';
          else if (r.status === 'IN_PROGRESS') {
            nextStatus = 'COMPLETED';
            completedAt = new Date().toISOString();
          }
          const updated = { ...r, status: nextStatus, completedAt };
          if (selectedRequestDetail?.id === reqId) setSelectedRequestDetail(updated);
          return updated;
        }
        return r;
      })
    );
    showToast(`Request ${reqId} advanced to next stage.`);
  };

  // Cancel Request
  const handleCancelRequest = async (id) => {
    const ok = await confirm({
      title: 'Cancel Service Request?',
      message: `Are you sure you want to cancel request #${id}? This will terminate technician dispatch.`,
      confirmText: 'Yes, Cancel Request',
      variant: 'danger',
    });
    if (!ok) return;

    setAllRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r))
    );
    showToast(`Request ${id} has been cancelled.`);
    if (selectedRequestDetail?.id === id) {
      setSelectedRequestDetail((prev) => ({ ...prev, status: 'CANCELLED' }));
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header & 3 Primary Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Hub</h1>
          <p className="text-sm text-slate-500">
            Certified partner rosters, registered user accounts, and end-to-end service requests
          </p>
        </div>

        {/* 3 Primary Tabs: Partner, User, Request */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {/* TAB 1: PARTNER */}
          <button
            onClick={() => setActiveSubTab('partners')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'partners'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Partners</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">
              {partners.length}
            </span>
          </button>

          {/* TAB 2: USER */}
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-purple-600" />
            <span>Users</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">
              {users.length}
            </span>
          </button>

          {/* TAB 3: REQUEST */}
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Requests</span>
            {liveRequestsList.length > 0 ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                {liveRequestsList.length} Live
              </span>
            ) : (
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">
                {allRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRIMARY TAB 1: PARTNERS MANAGEMENT                       */}
      {/* ======================================================== */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Specialists</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{partners.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Active On-Call</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {partners.filter((p) => p.status === 'Active').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Suspended Partners</span>
              <p className="text-xl font-bold text-rose-600 mt-1">
                {partners.filter((p) => p.status === 'Suspended').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Under Review / Warned</span>
              <p className="text-xl font-bold text-amber-600 mt-1">
                {partners.filter((p) => p.status === 'Warned').length}
              </p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search partner by name or trade..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
                <option value="Warned">Warned Only</option>
                <option value="Soft Deleted">Soft Deleted Only</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowAddPartnerModal(true);
                setAddPartnerStep(1);
              }}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Partner</span>
            </button>
          </div>

          {/* Partners Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Specialist Profile</th>
                    <th className="p-3.5">Trade & Category</th>
                    <th className="p-3.5">Performance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Commission</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartners.map((partner) => {
                    const isSuspended = partner.status === 'Suspended';
                    return (
                      <tr
                        key={partner.id}
                        className={`hover:bg-slate-50/70 transition ${
                          isSuspended ? 'bg-rose-50/20' : partner.status === 'Soft Deleted' ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <img
                              src={partner.photo}
                              alt={partner.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{partner.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{partner.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                            {partner.category}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {partner.rating} / 5.0
                            </span>
                            <span className="text-[10px] text-slate-400">{partner.jobsCompleted} completed</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              partner.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : partner.status === 'Suspended'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : partner.status === 'Warned'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isSuspended && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                            {partner.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600 font-medium">
                          {partner.commissionRate}% Payout
                        </td>

                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Suspend / Unsuspend Action */}
                          <button
                            onClick={() => handleToggleSuspendPartner(partner)}
                            title={isSuspended ? 'Reactivate Partner' : 'Suspend Partner'}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingPartner({ ...partner })}
                            title="Edit Partner Profile"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Dispatch Official Warning */}
                          <button
                            onClick={() => {
                              setWarningPartner(partner);
                              setWarningForm({ severity: 'Quality Warning', message: '', sendSms: true });
                            }}
                            title="Dispatch Warning Notice"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          {/* Soft Delete */}
                          <button
                            onClick={() => handleToggleSoftDeletePartner(partner.id)}
                            title={partner.status === 'Soft Deleted' ? 'Restore Partner' : 'Soft Delete Partner'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              partner.status === 'Soft Deleted'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {partner.status === 'Soft Deleted' ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRIMARY TAB 2: USER MANAGEMENT (CUSTOMERS)               */}
      {/* ======================================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{users.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Active Accounts</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {users.filter((u) => u.status === 'Active').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Suspended Users</span>
              <p className="text-xl font-bold text-rose-600 mt-1">
                {users.filter((u) => u.status === 'Suspended').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Customer Bookings</span>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {users.reduce((acc, u) => acc + (u.totalBookings || 0), 0)} Orders
              </p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium"
              >
                <option value="All">All User Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Customer Profile</th>
                    <th className="p-3.5">Contact & Location</th>
                    <th className="p-3.5">Bookings & Spend</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isSuspended = user.status === 'Suspended';
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/70 transition ${isSuspended ? 'bg-rose-50/20' : ''}`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <p className="font-medium text-slate-800">{user.phone}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{user.city}</p>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{user.totalBookings} Bookings</p>
                          <p className="text-[11px] text-slate-400">{user.totalSpend} total spent</p>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              user.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isSuspended && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                            {user.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Suspend / Unsuspend */}
                          <button
                            onClick={() => handleToggleSuspendUser(user)}
                            title={isSuspended ? 'Reactivate User' : 'Suspend User'}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => setEditingUser({ ...user })}
                            title="Edit User Details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* View Bookings */}
                          <button
                            onClick={() => setViewingUserRequests(user)}
                            title="View Bookings History"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            title="Delete User"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRIMARY TAB 3: REQUESTS (LIVE, ASSIGNED, PAST)           */}
      {/* ======================================================== */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Secondary Sub-Tabs for Requests */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {/* Option 1: Live Requests */}
              <button
                onClick={() => setRequestView('live')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  requestView === 'live'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Requests</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                  {liveRequestsList.length}
                </span>
              </button>

              {/* Option 2: Assigned Requests */}
              <button
                onClick={() => setRequestView('assigned')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  requestView === 'assigned'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned Requests</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">
                  {assignedRequestsList.length}
                </span>
              </button>

              {/* Option 3: Past Requests */}
              <button
                onClick={() => setRequestView('past')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  requestView === 'past'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Past Requests</span>
                <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-extrabold">
                  {pastRequestsList.length}
                </span>
              </button>
            </div>

            {/* Live Search & Refresh */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, customer, service..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <button
                onClick={fetchWorkRequests}
                disabled={isRefreshing}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* OPTION 1: LIVE REQUESTS (NOT ACCEPTED BY PARTNER YET)    */}
          {/* ======================================================== */}
          {requestView === 'live' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>
                    <strong>Live Unassigned Requests:</strong> Service requests broadcasted by customers awaiting specialist acceptance.
                  </span>
                </div>
                <span className="font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  {liveRequestsList.length} Active
                </span>
              </div>

              {liveRequestsList.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-2">
                  <Radio className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">All Live Requests Dispatched</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    There are currently no unaccepted service requests waiting in the queue.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveRequestsList.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between text-left shadow-xs space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                            {req.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            Awaiting Partner
                          </span>
                        </div>

                        {/* Title & Scope */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {req.serviceCategory || req.category}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                            {req.problemTitle ? <strong>{req.problemTitle}: </strong> : null}
                            {req.problemDescription || req.notes || 'Service requested by customer.'}
                          </p>
                        </div>

                        {/* Customer Info */}
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{req.customerName}</span>
                            <span className="text-slate-400 font-mono">{req.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{req.serviceAddress || req.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{req.preferredDate} • {req.timeSlot || 'Morning'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setAssignPartnerModalReq(req)}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>Assign Partner</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRequestDetail(req)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION 2: ASSIGNED REQUESTS (ALL ONGOING WORKING REQUESTS)*/}
          {/* ======================================================== */}
          {requestView === 'assigned' && (
            <div className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs text-blue-950">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Ongoing Working Requests:</strong> Service dispatches actively assigned to certified partners in transit or on-site.
                  </span>
                </div>
                <span className="font-extrabold text-blue-800 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                  {assignedRequestsList.length} In Progress
                </span>
              </div>

              {assignedRequestsList.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-2">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Ongoing Working Dispatches</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When specialists accept live requests, their active progress will show here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedRequestsList.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between text-left shadow-xs space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                            {req.id}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {req.status?.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Title & Service */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {req.serviceCategory || req.category}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                            {req.problemTitle || req.problemDescription || 'Working order'}
                          </p>
                        </div>

                        {/* Assigned Partner Profile Box */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                req.partnerPhoto ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                              }
                              alt="Partner"
                              className="w-8 h-8 rounded-full object-cover border border-emerald-400 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Specialist</span>
                              <p className="font-bold text-xs text-slate-900 truncate">{req.assignedPartnerName}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 shrink-0">{req.estimatedFee || '₹399'}</span>
                        </div>

                        {/* Customer & Location */}
                        <div className="text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{req.customerName}</span>
                            <span className="text-slate-400 font-mono">{req.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{req.serviceAddress || req.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdvanceStage(req.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Advance Stage</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRequestDetail(req)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION 3: PAST REQUESTS (COMPLETED - NEWEST COME AT TOP!)*/}
          {/* ======================================================== */}
          {requestView === 'past' && (
            <div className="space-y-4">
              <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Completed & Settled Requests:</strong> Historical fulfilled orders, sorted so <strong>newly completed requests appear first at the top</strong>.
                  </span>
                </div>
                <span className="font-extrabold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-300 shrink-0">
                  {pastRequestsList.length} Completed
                </span>
              </div>

              {pastRequestsList.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Past Records Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When dispatches finish and customers rate them, they will appear here sorted chronologically.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-3.5">Ticket & Completion</th>
                          <th className="p-3.5">Customer & Service</th>
                          <th className="p-3.5">Fulfilling Specialist</th>
                          <th className="p-3.5">Amount Settled</th>
                          <th className="p-3.5">Customer Review</th>
                          <th className="p-3.5 text-right">Receipt / Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pastRequestsList.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {req.id}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {req.completedAt ? new Date(req.completedAt).toLocaleString('en-IN') : req.preferredDate || 'Recent'}
                              </p>
                            </td>

                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{req.serviceCategory || req.category}</p>
                              <p className="text-[11px] text-slate-500">{req.customerName} • {req.phone}</p>
                            </td>

                            <td className="p-3.5">
                              <p className="font-semibold text-slate-900">{req.assignedPartnerName || 'Certified Partner'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{req.partnerPhone || 'Verified'}</p>
                            </td>

                            <td className="p-3.5">
                              <span className="font-bold text-emerald-700 text-xs">
                                {req.invoiceAmount || req.estimatedFee || '₹499'}
                              </span>
                              <span className="block text-[10px] text-emerald-600 font-semibold">Paid & Settled</span>
                            </td>

                            <td className="p-3.5 max-w-xs">
                              {req.rating ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                                    <span>{req.rating} / 5</span>
                                  </div>
                                  {req.reviewComment && (
                                    <p className="text-[11px] text-slate-500 italic truncate">
                                      "{req.reviewComment}"
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No review left</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedRequestDetail(req)}
                                className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Audit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REQUEST DETAIL MODAL                            */}
      {/* ======================================================== */}
      {selectedRequestDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {selectedRequestDetail.id}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedRequestDetail.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedRequestDetail.status === 'CANCELLED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedRequestDetail.status?.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specialty & Scope */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Service Specialty
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {selectedRequestDetail.serviceCategory || selectedRequestDetail.category}
              </h2>
              {selectedRequestDetail.problemTitle && (
                <p className="text-xs font-bold text-slate-700 mt-1">
                  {selectedRequestDetail.problemTitle}
                </p>
              )}
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed mt-2">
                {selectedRequestDetail.problemDescription || selectedRequestDetail.notes || 'No extra problem description entered.'}
              </p>
            </div>

            {/* Customer Profile & Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Profile</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedRequestDetail.customerName || 'Valued Customer'}</p>
                <p className="text-slate-500">{selectedRequestDetail.customerEmail || 'No email'}</p>
                <p className="text-slate-700 font-mono mt-0.5">{selectedRequestDetail.phone || 'Phone on file'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Service Schedule</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedRequestDetail.preferredDate}</p>
                <p className="text-slate-500">{selectedRequestDetail.timeSlot || 'Morning Window'}</p>
                <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Urgency: {selectedRequestDetail.urgency || 'Standard'}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Service Address</span>
              <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-slate-700">
                  <p className="font-medium">{selectedRequestDetail.serviceAddress || selectedRequestDetail.address}</p>
                </div>
              </div>
            </div>

            {/* Specialist Details */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    selectedRequestDetail.partnerPhoto ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                  }
                  alt="Partner"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Specialist</span>
                  <p className="font-bold text-slate-900">{selectedRequestDetail.assignedPartnerName || 'Awaiting Partner Acceptance'}</p>
                  <p className="text-[11px] text-slate-500">{selectedRequestDetail.partnerPhone || 'Pending Dispatch'}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-emerald-600 text-xs">{selectedRequestDetail.estimatedFee || '₹399'}</span>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              {selectedRequestDetail.status !== 'COMPLETED' && selectedRequestDetail.status !== 'CANCELLED' ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAdvanceStage(selectedRequestDetail.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Advance Stage ({selectedRequestDetail.status})</span>
                  </button>

                  <button
                    onClick={() => handleCancelRequest(selectedRequestDetail.id)}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition font-semibold cursor-pointer"
                  >
                    Cancel Order
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 text-xs font-semibold">
                  Ticket finalized ({selectedRequestDetail.status})
                </span>
              )}

              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: MANUAL ASSIGN PARTNER MODAL                     */}
      {/* ======================================================== */}
      {assignPartnerModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assign Specialist</h3>
                <p className="text-xs text-slate-500">
                  Request {assignPartnerModalReq.id} ({assignPartnerModalReq.serviceCategory})
                </p>
              </div>
              <button
                onClick={() => setAssignPartnerModalReq(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select an active specialist to manually dispatch this service order:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {partners
                .filter((p) => p.status === 'Active')
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleManualAssign(assignPartnerModalReq.id, p)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.photo}
                        alt={p.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-xs text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.category} • ⭐ {p.rating}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Assign ➔
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignPartnerModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ONBOARD PARTNER MODAL                           */}
      {/* ======================================================== */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Onboard Certified Partner</h3>
                <p className="text-xs text-slate-500">Step {addPartnerStep} of 3</p>
              </div>
              <button
                onClick={() => setShowAddPartnerModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(addPartnerStep / 3) * 100}%` }}
              />
            </div>

            {/* STEP 1: PERSONAL INFO */}
            {addPartnerStep === 1 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                      placeholder="+91 98000 00000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newPartner.email}
                      onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                      placeholder="ramesh@trade.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational City / Territory</label>
                  <input
                    type="text"
                    value={newPartner.city}
                    onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPartner.name.trim() || !newPartner.phone.trim()) {
                        showToast('Please fill in name and phone number to continue.');
                        return;
                      }
                      setAddPartnerStep(2);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Continue to Specialty ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TRADE & SKILLS */}
            {addPartnerStep === 2 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Trade Specialty</label>
                  <select
                    value={newPartner.category}
                    onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option>Custom Carpentry</option>
                    <option>Emergency Plumbing</option>
                    <option>Electrical Maintenance</option>
                    <option>Painting & Decor</option>
                    <option>HVAC & AC Service</option>
                    <option>Appliance Care</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={newPartner.experience}
                      onChange={(e) => setNewPartner({ ...newPartner, experience: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">License / Badge ID</label>
                    <input
                      type="text"
                      value={newPartner.licenseNo}
                      onChange={(e) => setNewPartner({ ...newPartner, licenseNo: e.target.value })}
                      placeholder="CERT-8910"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Mandatory police background check will be verified.</span>
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setAddPartnerStep(1)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddPartnerStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Continue to Payout Terms ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYOUT TERMS */}
            {addPartnerStep === 3 && (
              <form onSubmit={handleAddPartnerSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner Commission Payout %</label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={newPartner.commissionRate}
                    onChange={(e) => setNewPartner({ ...newPartner, commissionRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Apex default: 80% partner payout, 20% platform share.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Settlement UPI ID / Bank Account</label>
                  <input
                    type="text"
                    value={newPartner.upiId}
                    onChange={(e) => setNewPartner({ ...newPartner, upiId: e.target.value })}
                    placeholder="partner@okhdfcbank"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setAddPartnerStep(2)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Complete Onboarding
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: EDIT PARTNER MODAL                              */}
      {/* ======================================================== */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Edit Partner: {editingPartner.name}</h3>
              <button onClick={() => setEditingPartner(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPartner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingPartner.name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade Category</label>
                <select
                  value={editingPartner.category}
                  onChange={(e) => setEditingPartner({ ...editingPartner, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option>Custom Carpentry</option>
                  <option>Emergency Plumbing</option>
                  <option>Electrical Maintenance</option>
                  <option>Painting & Decor</option>
                  <option>HVAC & AC Service</option>
                  <option>Appliance Care</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={editingPartner.phone}
                  onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commission Rate %</label>
                <input
                  type="number"
                  value={editingPartner.commissionRate}
                  onChange={(e) => setEditingPartner({ ...editingPartner, commissionRate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: SEND OFFICIAL WARNING TO PARTNER                */}
      {/* ======================================================== */}
      {warningPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-amber-700">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">Send Warning: {warningPartner.name}</h3>
              </div>
              <button onClick={() => setWarningPartner(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendWarning} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Warning Severity</label>
                <select
                  value={warningForm.severity}
                  onChange={(e) => setWarningForm({ ...warningForm, severity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option>Quality Warning</option>
                  <option>Late Arrival Advisory</option>
                  <option>Customer Complaint Notice</option>
                  <option>Account Suspension Notice</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the incident, delayed arrival, or customer feedback..."
                  value={warningForm.message}
                  onChange={(e) => setWarningForm({ ...warningForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setWarningPartner(null)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Send Official Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: ADD NEW USER (CUSTOMER)                         */}
      {/* ======================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Add New Customer Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Kapoor"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98000 00000"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="meera@domain.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Andheri East"
                  value={newUser.city}
                  onChange={(e) => setNewUser({ ...newUser, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional customer account notes..."
                  value={newUser.notes}
                  onChange={(e) => setNewUser({ ...newUser, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: EDIT USER (CUSTOMER)                            */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Edit User: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  value={editingUser.city}
                  onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 8: VIEW USER REQUESTS HISTORY                      */}
      {/* ======================================================== */}
      {viewingUserRequests && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Bookings: {viewingUserRequests.name}</h3>
                <p className="text-xs text-slate-500">{viewingUserRequests.email} • {viewingUserRequests.phone}</p>
              </div>
              <button onClick={() => setViewingUserRequests(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allRequests.filter(
                (r) =>
                  r.customerEmail === viewingUserRequests.email ||
                  r.customerName?.toLowerCase() === viewingUserRequests.name.toLowerCase()
              ).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No request history found for this user.</p>
              ) : (
                allRequests
                  .filter(
                    (r) =>
                      r.customerEmail === viewingUserRequests.email ||
                      r.customerName?.toLowerCase() === viewingUserRequests.name.toLowerCase()
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-600">{r.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {r.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 mt-0.5">{r.serviceCategory || r.category}</p>
                        <p className="text-[10px] text-slate-400">{r.preferredDate}</p>
                      </div>
                      <span className="font-bold text-slate-900">{r.estimatedFee || '₹499'}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingUserRequests(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
