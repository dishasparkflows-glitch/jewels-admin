import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineFlag,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlinePlus,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import DatePicker, { formatDateToISO } from '../../components/common/DatePicker';
import CountryCodeSelect from '../../components/common/CountryCodeSelect';
import { useAdminPageSize } from '../../utils/adminPagination';
import StatCards from '../../components/common/StatCards';


const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AppointmentsView() {
  const confirm = useConfirm();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'upcoming'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingApt, setEditingApt] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    date: formatDateToISO(new Date()),
    time: '12:00 PM',
    status: 'pending',
    notes: '',
  });
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dateMenuRef = useRef(null);

  // New appointment form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    date: formatDateToISO(new Date()),
    time: '12:00 PM',
    notes: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setIsDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchAppointments = useCallback(async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments?page=${page}&limit=${limit}`);
      const data = res.data?.data?.items || res.data?.data || [];
      const list = Array.isArray(data) ? data : [];
      setAppointments(list);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      } else {
        setServerTotal(list.length);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setAppointments([]);
      setServerTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchAppointments(currentPage, pageSize);
  }, [fetchAppointments, currentPage, pageSize]);

  const handleUpdateStatus = async (id, newStatus) => {
    const previousAppointments = appointments;
    setAppointments((prev) =>
      prev.map((a) => ((a._id || a.id) === id ? { ...a, status: newStatus } : a))
    );

    try {
      try {
        await api.patch(`/appointments/${id}/status`, { status: newStatus });
      } catch {
        await api.put(`/appointments/${id}`, { status: newStatus });
      }
      toast.success(
        newStatus === 'confirmed'
          ? 'Appointment confirmed'
          : newStatus === 'completed'
          ? 'Appointment marked as completed'
          : newStatus === 'cancelled'
          ? 'Appointment cancelled'
          : `Appointment status updated to ${newStatus}`
      );
    } catch (err) {
      setAppointments(previousAppointments);
      toast.error(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleAcceptAppointment = async (apt) => {
    const id = apt._id || apt.id;
    const clientName = apt.customer?.name || apt.fullName || apt.name || 'Client';
    const isAlreadyConfirmed = apt.status === 'confirmed';
    const targetStatus = isAlreadyConfirmed ? 'completed' : 'confirmed';

    const isConfirmed = await confirm({
      title: isAlreadyConfirmed ? 'Complete Appointment' : 'Accept Appointment',
      message: isAlreadyConfirmed
        ? `Mark the appointment for "${clientName}" as completed?`
        : `Accept and confirm the appointment for "${clientName}"?`,
      confirmText: isAlreadyConfirmed ? 'Mark Completed' : 'Accept & Confirm',
      cancelText: 'Cancel',
      type: 'success',
      icon: <HiOutlineCheckCircle className="w-6 h-6 stroke-[2]" />,
    });

    if (!isConfirmed) return false;
    await handleUpdateStatus(id, targetStatus);
    return true;
  };

  const handleRejectAppointment = async (apt) => {
    const id = apt._id || apt.id;
    const clientName = apt.customer?.name || apt.fullName || apt.name || 'Client';

    const isConfirmed = await confirm({
      title: 'Cancel Appointment',
      message: `Are you sure you want to cancel the appointment for "${clientName}"?`,
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Active',
      type: 'danger',
      icon: <HiOutlineXCircle className="w-6 h-6 stroke-[2]" />,
    });

    if (!isConfirmed) return false;
    await handleUpdateStatus(id, 'cancelled');
    return true;
  };

  const handleDelete = async (apt) => {
    const id = apt._id || apt.id;
    const clientName = apt.customer?.name || apt.fullName || apt.name || 'this client';

    const isConfirmed = await confirm({
      title: 'Delete Appointment',
      message: `Are you sure you want to remove appointment for "${clientName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => (a._id || a.id) !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setServerTotal((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      toast.success('Appointment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.error('Please select appointments to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Appointments',
      message: `Are you sure you want to delete ${count} selected appointment${count > 1 ? 's' : ''}?`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await api.post('/appointments/bulk-delete', { ids: idsToDelete });
      setAppointments((prev) => prev.filter((a, idx) => !selectedIds.has(a._id || a.id || `apt_${idx}`)));
      setSelectedIds(new Set());
      setServerTotal((prev) => (prev !== null ? Math.max(0, prev - idsToDelete.length) : 0));
      toast.success(`${count} appointment${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected appointments');
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginatedItems.forEach((apt, idx) => {
        const id = apt._id || apt.id || `apt_${idx}`;
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenEdit = (apt, idx) => {
    const extracted = extractAptData(apt, idx);
    const rawCountry = String(extracted.countryCode || '91').replace('+', '');
    setEditingApt({ ...apt, ...extracted });
    setEditFormData({
      name: extracted.clientName === 'Client' ? '' : extracted.clientName,
      email: extracted.clientEmail === '—' ? '' : extracted.clientEmail,
      countryCode: `+${rawCountry || '91'}`,
      phone: extracted.rawPhone === '98200 00000' ? '' : extracted.rawPhone,
      date: extracted.aptDate ? formatDateToISO(new Date(extracted.aptDate)) : formatDateToISO(new Date()),
      time: extracted.prefTime || '12:00 PM',
      status: apt.status || 'pending',
      notes: apt.notes || '',
    });
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!editFormData.name?.trim() || !editFormData.email?.trim()) {
      toast.error('Client name and email required');
      return;
    }
    try {
      setSubmitting(true);
      const aptId = editingApt._id || editingApt.id;
      const cleanCountry = String(editFormData.countryCode || '91').replace('+', '').trim();
      const payload = {
        customer: {
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          phone: {
            countryCode: cleanCountry || '91',
            number: editFormData.phone.trim(),
          },
        },
        appointment: {
          date: editFormData.date ? new Date(editFormData.date).toISOString() : new Date().toISOString(),
          preferredTime: editFormData.time || '12:00 PM',
        },
        status: editFormData.status,
        notes: editFormData.notes?.trim() || '',
      };

      await api.put(`/appointments/${aptId}`, payload);

      setAppointments((prev) =>
        prev.map((a) => {
          const aId = a._id || a.id;
          return aId === aptId ? { ...a, ...payload } : a;
        })
      );

      toast.success('Appointment updated successfully');
      setEditingApt(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Client name and email required');
      return;
    }
    try {
      setSubmitting(true);
      const rawCountryCode = (formData.countryCode || '+91').replace('+', '').trim() || '91';
      const payload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: { countryCode: rawCountryCode, number: formData.phone.trim() },
        },
        appointment: {
          date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
          preferredTime: formData.time || '12:00 PM',
        },
        status: 'pending',
        notes: formData.notes?.trim() || '',
      };

      const res = await api.post('/appointments', payload);
      const created = res.data?.data || payload;
      setAppointments((prev) => [created, ...prev]);
      setServerTotal((prev) => (prev !== null ? prev + 1 : 1));

      toast.success('Appointment booked successfully');
      setIsBookModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        countryCode: '+91',
        date: formatDateToISO(new Date()),
        time: '12:00 PM',
        notes: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  // Filtered List
  const displayedList = useMemo(() => {
    return appointments.filter((a) => {
      // Tab status filter
      if (statusFilter !== 'all' && a.status !== statusFilter) {
        return false;
      }
      // Date filter
      if (dateFilter === 'today') {
        const aptDate = a.appointment?.date || a.appointmentDate || a.date;
        if (aptDate) {
          const d = new Date(aptDate);
          const now = new Date();
          if (
            d.getDate() !== now.getDate() ||
            d.getMonth() !== now.getMonth() ||
            d.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (a.customer?.name || a.fullName || a.name || '').toLowerCase();
        const email = (a.customer?.email || a.email || '').toLowerCase();
        const phone = (a.customer?.phone?.number || a.phoneNumber || a.phone || '').toLowerCase();
        const idStr = String(a.customId || a.appointmentId || a._id || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          idStr.includes(q)
        );
      }
      return true;
    });
  }, [appointments, statusFilter, dateFilter, search]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(displayedList, pageSize, serverTotal);

  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((apt, idx) => {
      const id = apt._id || apt.id || `apt_${idx}`;
      return selectedIds.has(id);
    });

  // Initials generator
  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return 'AP';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Date formatter matching screenshot: "27 Oct 2026"
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '21 Oct 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Extract apt data helper
  const extractAptData = (apt, idx) => {
    const id = apt._id || apt.id || `apt_${idx}`;
    const clientName = apt.customer?.name || apt.fullName || apt.name || 'Client';
    const clientEmail = apt.customer?.email || apt.email || '—';
    const countryCode = apt.customer?.phone?.countryCode || '91';
    const rawPhone = apt.customer?.phone?.number || apt.phoneNumber || apt.phone || '98200 00000';
    const aptDate = apt.appointment?.date || apt.appointmentDate || apt.date;
    const prefTime = apt.appointment?.preferredTime || apt.preferredTime || apt.time || '12:00 PM';
    const displayId =
      apt.customId ||
      apt.appointmentId ||
      `#APT-${String(10 - ((currentPage - 1) * pageSize + idx)).padStart(4, '0')}`;
    return { id, clientName, clientEmail, countryCode, rawPhone, aptDate, prefTime, displayId };
  };

  const statCardsData = [
    {
      id: 'total',
      label: 'Total Appointments',
      value: totalCount,
      icon: HiOutlineCalendar,
      color: 'bronze',
      onClick: () => {
        setStatusFilter('all');
        setCurrentPage(1);
      },
      active: statusFilter === 'all',
    },
    {
      id: 'pending',
      label: 'Pending Requests',
      value: pendingCount,
      icon: HiOutlineClock,
      color: 'peach',
      onClick: () => {
        setStatusFilter('pending');
        setCurrentPage(1);
      },
      active: statusFilter === 'pending',
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      value: confirmedCount,
      icon: HiOutlineCheckCircle,
      color: 'green',
      onClick: () => {
        setStatusFilter('confirmed');
        setCurrentPage(1);
      },
      active: statusFilter === 'confirmed',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completedCount,
      icon: HiOutlineFlag,
      color: 'blue',
      onClick: () => {
        setStatusFilter('completed');
        setCurrentPage(1);
      },
      active: statusFilter === 'completed',
    },
  ];

  // Status Badge Helper matching the screenshot with bullet dot
  const renderStatusPill = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Header: Icon Box + Title + Subtitle + Book Appointment Button ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#faf3ea] border border-[#f2e2cf] flex items-center justify-center text-[#8b6f4e] shadow-2xs shrink-0">
            <HiOutlineCalendar className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Appointments</h1>
            <p className="text-xs sm:text-sm text-stone-400 font-medium">
              Manage consultations and client bookings
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              date: prev.date || formatDateToISO(new Date()),
            }));
            setIsBookModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-98 shrink-0"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-2" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* ─── Appointment summary cards ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Controls Row: Status Filters, Search, and Dropdown Filters ─── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pt-1">
        {/* Left: Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            const count =
              tab.id === 'all'
                ? totalCount
                : tab.id === 'pending'
                ? pendingCount
                : tab.id === 'confirmed'
                ? confirmedCount
                : tab.id === 'completed'
                ? completedCount
                : cancelledCount;

            const badgeColor =
              tab.id === 'pending'
                ? 'text-amber-600 bg-amber-50'
                : tab.id === 'confirmed'
                ? 'text-emerald-600 bg-emerald-50'
                : tab.id === 'completed'
                ? 'text-blue-600 bg-blue-50'
                : tab.id === 'cancelled'
                ? 'text-rose-600 bg-rose-50'
                : 'text-stone-500 bg-stone-100';

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                    : 'bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center ${
                    isActive ? 'bg-white/20 text-white' : badgeColor
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Date Range + More Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client, email, phone..."
              className="w-full sm:w-56 md:w-64 pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Dropdown Button */}
          <div className="relative" ref={dateMenuRef}>
            <button
              type="button"
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <HiOutlineCalendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{dateFilter === 'today' ? 'Today' : dateFilter === 'upcoming' ? 'Upcoming' : 'Date range'}</span>
              <HiOutlineChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {isDateMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('all');
                    setIsDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium cursor-pointer ${
                    dateFilter === 'all' ? 'text-[#8b6f4e] bg-[#faf5ed] font-semibold' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('today');
                    setIsDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium cursor-pointer ${
                    dateFilter === 'today' ? 'text-[#8b6f4e] bg-[#faf5ed] font-semibold' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  Today&apos;s Bookings
                </button>
              </div>
            )}
          </div>

          {/* Bulk Delete Button */}
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs whitespace-nowrap ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50 cursor-pointer'
                : 'bg-white text-stone-300 border-stone-200/90 cursor-not-allowed opacity-60'
            }`}
          >
            <HiOutlineTrash className="w-3.5 h-3.5 shrink-0" />
            <span>Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
          </button>
        </div>
      </div>


      {/* ─── Main Content: Appointment Table ─── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-[3px] border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400 font-medium">Loading consultations...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#faf3ea] flex items-center justify-center text-[#8b6f4e]">
            <HiOutlineCalendar className="w-6 h-6 stroke-[1.8]" />
          </div>
          <p className="text-sm text-stone-600 font-bold">No appointments found</p>
          <p className="text-xs text-stone-400">Try adjusting your status tabs or search criteria</p>
        </div>
      ) : (
        /* ─── TABLE VIEW ─── */
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-1 w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                  <th className="py-3 px-4 whitespace-nowrap">CLIENT</th>
                  <th className="py-3 px-4 whitespace-nowrap">CONTACT</th>
                  <th className="py-3 px-4 whitespace-nowrap">DATE & TIME</th>
                  <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                  <th className="py-3 pr-5 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {paginatedItems.map((apt, idx) => {
                  const {
                    id,
                    clientName,
                    clientEmail,
                    countryCode,
                    rawPhone,
                    aptDate,
                    prefTime,
                  } = extractAptData(apt, idx);

                  const isSelected = selectedIds.has(id);

                  return (
                    <tr
                      key={id}
                      onClick={() => handleOpenEdit(apt, idx)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#faf6f0]/70' : 'hover:bg-[#faf7f2]/60'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3.5 pl-4 pr-1 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* SR NO */}
                      <td className="py-3.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#fdf3e7] text-[#8b6f4e] font-bold text-xs flex items-center justify-center border border-[#f5e3ce] shrink-0">
                            {getInitials(clientName)}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-xs leading-none">
                              {clientName}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-1 leading-none">
                              {clientEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-stone-800">
                        +{countryCode} {rawPhone}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-stone-800 leading-none">
                          {formatDateDisplay(aptDate)}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1 leading-none">{prefTime}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusPill(apt.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-5 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAcceptAppointment(apt)}
                            title={apt.status === 'confirmed' ? 'Mark Completed' : 'Accept & Confirm'}
                            className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectAppointment(apt)}
                            title="Cancel Appointment"
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <HiOutlineXCircle className="w-4 h-4 stroke-2" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(apt)}
                            title="Delete Appointment"
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <HiOutlineTrash className="w-4 h-4 stroke-[1.8]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={serverTotal ?? totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemLabel="appointments"
          />
        </div>
      )}

      {/* ─── Book Appointment Modal ─── */}
      {isBookModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsBookModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-stone-200/90 space-y-4 sm:space-y-5 animate-scaleUp max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#faf3ea] border border-[#f2e2cf] flex items-center justify-center text-[#8b6f4e]">
                  <HiOutlineCalendar className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Book New Appointment</h3>
                  <p className="text-[11px] text-stone-400">Fill in client details to schedule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Client Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Merchant"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">Phone Number</label>
                  <div className="flex items-center gap-1.5">
                    <div className="shrink-0">
                      <CountryCodeSelect
                        value={formData.countryCode || '+91'}
                        onChange={(dialCode) => setFormData({ ...formData, countryCode: dialCode })}
                        size="sm"
                        buttonClassName="flex items-center justify-between gap-1 px-2 text-xs font-semibold text-stone-800 bg-white border border-stone-200 hover:border-[#bdae99] rounded-xl h-[38px] min-w-[76px] shadow-2xs focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all cursor-pointer"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="98200 99880"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="min-w-0 flex-1 px-2.5 py-2 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs h-[38px]"
                    />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">Date</label>
                  <DatePicker
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">Time</label>
                  <input
                    type="text"
                    placeholder="12:00 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any client preferences, special requests, or consultation notes..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── Edit Appointment Details Modal ─── */}
      {editingApt && (
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
            onClick={() => setEditingApt(null)}
          >
            <div
              className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200/90 animate-scaleUp overflow-hidden max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#faf3ea] border-b border-[#ebdcc9] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-white text-[#8b6f4e] font-bold text-sm flex items-center justify-center border border-[#ebdcc9] shadow-2xs">
                    {getInitials(editFormData.name || editingApt.clientName)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 leading-tight">
                      Edit Appointment
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {editingApt.clientName} &bull; {editingApt.clientEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-stone-400 hover:text-stone-700 flex items-center justify-center border border-stone-200 transition-colors cursor-pointer"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleUpdateAppointment} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  {/* Client Name */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Client Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Merchant"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="client@gmail.com"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">Phone Number</label>
                      <div className="flex items-center gap-1.5">
                        <div className="shrink-0">
                          <CountryCodeSelect
                            value={editFormData.countryCode || '+91'}
                            onChange={(dialCode) => setEditFormData({ ...editFormData, countryCode: dialCode })}
                            size="sm"
                            buttonClassName="flex items-center justify-between gap-1 px-2 text-xs font-semibold text-stone-800 bg-white border border-stone-200 hover:border-[#bdae99] rounded-xl h-[38px] min-w-[76px] shadow-2xs focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all cursor-pointer"
                          />
                        </div>
                        <input
                          type="tel"
                          placeholder="98200 99880"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="min-w-0 flex-1 px-2.5 py-2 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs h-[38px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">Date</label>
                      <DatePicker
                        value={editFormData.date}
                        onChange={(val) => setEditFormData({ ...editFormData, date: val })}
                        placeholder="Select date"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">Time</label>
                      <input
                        type="text"
                        placeholder="12:00 PM"
                        value={editFormData.time}
                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">Notes</label>
                    <textarea
                      rows={2}
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Any client preferences, special requests, or consultation notes..."
                      className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs resize-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/60 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {editingApt.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await handleAcceptAppointment(editingApt);
                            if (ok) setEditingApt(null);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                          <span>Accept & Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await handleRejectAppointment(editingApt);
                            if (ok) setEditingApt(null);
                          }}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <HiOutlineXCircle className="w-4 h-4 stroke-2" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                    {editingApt.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await handleAcceptAppointment(editingApt);
                          if (ok) setEditingApt(null);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
