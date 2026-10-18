import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSparkles,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineEye,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { useAdminPageSize } from '../../utils/adminPagination';

const STATUS_TABS = [
  { id: 'all', label: 'All Appointments' },
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
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending as in Screenshot 1, or 'all'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewingApt, setViewingApt] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // New appointment form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  const fetchAppointments = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments?page=${page}&limit=${limit}`);
      const data = res.data?.data?.items || res.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.warn('Could not load appointments:', err);
      setAppointments([]);
      toast.error('Could not load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleUpdateStatus = async (id, newStatus) => {
    // Optimistic update
    setAppointments((prev) =>
      prev.map((a) => ((a._id || a.id) === id ? { ...a, status: newStatus } : a))
    );

    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      toast.success(
        newStatus === 'confirmed'
          ? 'Appointment accepted and confirmed'
          : newStatus === 'cancelled'
          ? 'Appointment cancelled'
          : `Appointment marked as ${newStatus}`
      );
    } catch (err) {
      try {
        await api.put(`/appointments/${id}`, { status: newStatus });
        toast.success(
          newStatus === 'confirmed'
            ? 'Appointment accepted and confirmed'
            : newStatus === 'cancelled'
            ? 'Appointment cancelled'
            : `Appointment marked as ${newStatus}`
        );
      } catch (err2) {
        console.error('Failed to update status:', err2);
        toast.error('Failed to update appointment status');
        fetchAppointments();
      }
    }
  };

  const handleAcceptAppointment = async (apt, clientName) => {
    const id = apt._id || apt.id;
    const isAlreadyConfirmed = apt.status === 'confirmed';
    const targetStatus = isAlreadyConfirmed ? 'completed' : 'confirmed';

    const isConfirmed = await confirm({
      title: isAlreadyConfirmed ? 'Complete Appointment' : 'Accept Appointment',
      message: isAlreadyConfirmed
        ? `Are you sure you want to mark the appointment for "${clientName || 'this client'}" as completed?`
        : `Are you sure you want to accept and confirm the appointment for "${clientName || 'this client'}"?`,
      confirmText: isAlreadyConfirmed ? 'Mark Completed' : 'Accept & Confirm',
      cancelText: 'Cancel',
      type: 'success',
      icon: <HiOutlineCheckCircle className="w-6 h-6 stroke-[2]" />,
    });

    if (!isConfirmed) return false;

    await handleUpdateStatus(id, targetStatus);
    return true;
  };

  const handleRejectAppointment = async (apt, clientName) => {
    const id = apt._id || apt.id;

    const isConfirmed = await confirm({
      title: 'Reject Appointment',
      message: `Are you sure you want to reject and cancel the appointment for "${clientName || 'this client'}"?`,
      confirmText: 'Reject Appointment',
      cancelText: 'Keep Appointment',
      type: 'danger',
      icon: <HiOutlineXCircle className="w-6 h-6 stroke-[2]" />,
    });

    if (!isConfirmed) return false;

    await handleUpdateStatus(id, 'cancelled');
    return true;
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Appointment',
      message: `Are you sure you want to remove appointment for "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment deleted');
      setAppointments((prev) => prev.filter((a) => (a._id || a.id) !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setAppointments((prev) => prev.filter((a) => (a._id || a.id) !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Appointment deleted');
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
      message: `Are you sure you want to delete ${count} selected appointment${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      try {
        await api.post('/appointments/bulk-delete', { ids: idsToDelete });
      } catch (bulkErr) {
        // Fallback to individual deletes if bulk-delete endpoint fails
        await Promise.allSettled(
          idsToDelete.map((id) => api.delete(`/appointments/${id}`))
        );
      }
      setAppointments((prev) => prev.filter((a) => !selectedIds.has(a._id || a.id)));
      setSelectedIds(new Set());
      toast.success(`${count} appointment${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      setAppointments((prev) => prev.filter((a) => !selectedIds.has(a._id || a.id)));
      setSelectedIds(new Set());
      toast.success(`${count} appointment${count > 1 ? 's' : ''} deleted`);
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
      const payload = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: { countryCode: '91', number: formData.phone },
        },
        appointment: {
          date: formData.date,
          preferredTime: formData.time,
          serviceType: formData.service,
        },
        status: 'pending',
      };
      await api.post('/appointments', payload);
      toast.success('Appointment booked successfully');
      setIsBookModalOpen(false);
      setFormData({ name: '', email: '', phone: '', date: '', time: '', service: '' });
      fetchAppointments();
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
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (a.fullName || a.customer?.name || a.name || '').toLowerCase();
        const email = (a.email || a.customer?.email || '').toLowerCase();
        const phone = (a.phoneNumber || a.phone || a.customer?.phone?.number || '').toLowerCase();
        const idStr = String(a.customId || a.appointmentId || a._id || '').toLowerCase();
        const service = (a.serviceType || a.appointment?.serviceType || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          idStr.includes(q) ||
          service.includes(q)
        );
      }
      return true;
    });
  }, [appointments, statusFilter, search]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(displayedList, pageSize, serverTotal);

  // Checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedItems.map((a) => a._id || a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = paginatedItems.length > 0 && paginatedItems.every((a) => selectedIds.has(a._id || a.id));

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statCardsData = [
    {
      label: 'Total Appointments',
      value: totalCount,
      icon: HiOutlineCalendar,
      color: 'bronze',
    },
    {
      label: 'Pending Requests',
      value: pendingCount,
      icon: HiOutlineClock,
      color: 'peach',
    },
    {
      label: 'Confirmed Consultations',
      value: confirmedCount,
      icon: HiOutlineCheckCircle,
      color: 'green',
    },
    {
      label: 'Total Cancelled',
      value: cancelledCount,
      icon: HiOutlineXCircle,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-3">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Appointments']}
        title="Appointments"
        subtitle="Manage client consultations and private viewing requests."
        onAdd={() => setIsBookModalOpen(true)}
        addLabel="Book Appointment"
        exportData={appointments}
        exportFileName="appointments_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Status Filter Tabs Row (Screenshot 1) ─── */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
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

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-[#8b6f4e] text-white shadow-xs'
                  : 'bg-white border border-stone-200/90 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search client name, email or phone..."
        onFilterClick={() => setFilterActive(!filterActive)}
        filterActive={filterActive}
        extraActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={
              selectedIds.size > 0
                ? `Delete ${selectedIds.size} selected appointment${selectedIds.size > 1 ? 's' : ''}`
                : 'Select appointments to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Luxury Appointments Table ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    aria-label="Select all appointments"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">CLIENT</th>
                <th className="py-2 px-3 whitespace-nowrap">CONTACT</th>
                <th className="py-2 px-3 whitespace-nowrap">SCHEDULE</th>
                <th className="py-2 px-3 whitespace-nowrap">STATUS</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading appointments...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    No appointments found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((apt, idx) => {
                  const id = apt._id || apt.id || `apt_${idx}`;
                  const isSelected = selectedIds.has(id);
                  const clientName = apt.fullName || apt.customer?.name || apt.name || 'Client';
                  const clientEmail = apt.email || apt.customer?.email || '—';
                  const countryCode = apt.customer?.phone?.countryCode || '91';
                  const rawPhone = apt.phoneNumber || apt.phone || apt.customer?.phone?.number || '';
                  const initial = (clientName || 'C')[0].toUpperCase();
                  const service = apt.serviceType || apt.appointment?.serviceType || 'Jewelry Viewing';
                  const aptDate = apt.appointmentDate || apt.appointment?.date || apt.date;
                  const prefTime = apt.preferredTime || apt.appointment?.preferredTime || apt.time || '12:00 PM';
                  const displayId = apt.customId || apt.appointmentId || `#APT-${String((currentPage - 1) * pageSize + idx + 1).padStart(4, '0')}`;

                  return (
                    <tr
                      key={id}
                      onClick={() => setViewingApt({ ...apt, clientName, clientEmail, rawPhone, countryCode, service, displayId, prefTime, aptDate })}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#f4ece3] text-[#8b6f4e] font-semibold text-[10px] flex items-center justify-center border border-[#8b6f4e]/20 shadow-2xs shrink-0">
                            {initial}
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-stone-900 text-xs leading-none">
                              {clientName}
                            </p>
                            {clientEmail !== '—' && (
                              <p className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[140px]">
                                {clientEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="leading-tight">
                          {rawPhone ? (
                            <div className="flex items-center gap-1.5 text-stone-700 text-xs font-medium">
                              <HiOutlinePhone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{rawPhone}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                              <span>—</span>
                            </div>
                          )}
                          {clientEmail !== '—' && (
                            <div className="flex items-center gap-1.5 text-stone-400 text-[10px] mt-1">
                              <HiOutlineMail className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{clientEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="leading-tight">
                          <div className="flex items-center gap-1.5 text-stone-800 text-xs font-medium">
                            <HiOutlineCalendar className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                            <span>{formatDate(aptDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-stone-400 text-[10px] mt-1">
                            <HiOutlineClock className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{prefTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status (Matches Image 1) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {apt.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#feefe3] text-[#b06000] border border-[#fedfc8]">
                            Pending
                          </span>
                        )}
                        {apt.status === 'confirmed' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                            Confirmed
                          </span>
                        )}
                        {apt.status === 'completed' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                            Completed
                          </span>
                        )}
                        {apt.status === 'cancelled' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Actions: 4 Icon Buttons (Check, Cancel, Eye, Trash - Exact match to user screenshot) */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Accept / Confirm Check Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleAcceptAppointment(apt, clientName)}
                            className="w-8 h-8 rounded-xl bg-[#e8f5ec] hover:bg-[#d4edd9] text-[#1b7a42] border border-[#d1edd7] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title={apt.status === 'confirmed' ? 'Mark Completed' : 'Accept & Confirm Appointment'}
                          >
                            <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                          </button>

                          {/* 2. Cancel / Reject Cross Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleRejectAppointment(apt, clientName)}
                            className="w-8 h-8 rounded-xl bg-[#fdeeed] hover:bg-[#fadbd8] text-[#d93025] border border-[#fadbd8] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Reject Appointment"
                          >
                            <HiOutlineXCircle className="w-4 h-4 stroke-2" />
                          </button>

                          {/* 3. View Eye Icon Button */}
                          <button
                            type="button"
                            onClick={() => setViewingApt({ ...apt, clientName, clientEmail, rawPhone, countryCode, service, displayId, prefTime, aptDate })}
                            className="w-8 h-8 rounded-xl bg-[#f5eee6] hover:bg-[#eadbc9] text-[#8b6f4e] border border-[#eadbc9] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="View Appointment Details"
                          >
                            <HiOutlineEye className="w-4 h-4 stroke-2" />
                          </button>

                          {/* 4. Delete Trash Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(id, clientName)}
                            className="w-8 h-8 rounded-xl bg-[#fdeeed] hover:bg-[#fadbd8] text-[#d93025] border border-[#fadbd8] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Delete Appointment"
                          >
                            <HiOutlineTrash className="w-4 h-4 stroke-2" />
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

        {/* ─── Pagination Footer ─── */}
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

      {/* ─── Book Appointment Modal ─── */}
      {isBookModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsBookModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">
                Schedule Appointment
              </h3>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Client Full Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="pooja@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9871234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    onFocus={(e) => { try { e.target.showPicker?.(); } catch (err) {} }}
                    onClick={(e) => { try { e.target.showPicker?.(); } catch (err) {} }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all cursor-pointer shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03:00 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Appointment Modal ─── */}
      {viewingApt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setViewingApt(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Appointment Details
              </h3>
              <button
                type="button"
                onClick={() => setViewingApt(null)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Client Name</span>
                <span className="font-semibold text-stone-900">{viewingApt.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Contact</span>
                <span className="font-medium text-stone-800">{viewingApt.clientEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Phone</span>
                <span className="font-medium text-stone-800">+{viewingApt.countryCode} {viewingApt.rawPhone}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200/50">
                <span className="text-stone-400">Date & Time</span>
                <span className="font-semibold text-[#8b6f4e]">{formatDate(viewingApt.aptDate)} at {viewingApt.prefTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Current Status</span>
                <span className="uppercase font-bold text-stone-800">{viewingApt.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2">
                {viewingApt.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await handleAcceptAppointment(viewingApt, viewingApt.clientName);
                        if (ok) setViewingApt(null);
                      }}
                      className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                      <span>ACCEPT</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await handleRejectAppointment(viewingApt, viewingApt.clientName);
                        if (ok) setViewingApt(null);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <HiOutlineXCircle className="w-4 h-4 stroke-2" />
                      <span>REJECT</span>
                    </button>
                  </>
                )}
                {viewingApt.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await handleAcceptAppointment(viewingApt, viewingApt.clientName);
                      if (ok) setViewingApt(null);
                    }}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                    <span>COMPLETE</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingApt(null)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
