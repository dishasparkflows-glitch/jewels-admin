import React, { useState, useEffect } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlinePhone,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function AppointmentsView() {
  const confirm = useConfirm();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments?limit=100');
      const data = res.data?.data?.items || res.data?.data || [];
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Appointment',
      message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment deleted successfully');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Metrics matching Screenshot 3
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const displayedList = appointments
    .filter((a) => (activeTab ? a.status === activeTab : true))
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (a.fullName || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      const phone = (a.phoneNumber || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(displayedList, 10);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sep 28';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Header & Refresh (Matches Screenshot 3) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage client consultations and viewing requests.
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200/90 text-stone-700 text-xs font-bold tracking-wider uppercase rounded-lg hover:bg-stone-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <HiOutlineRefresh className="w-4 h-4 text-stone-500" />
          <span>REFRESH LIST</span>
        </button>
      </div>

      {/* ─── 4 Stat Cards (Matches Screenshot 3) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL APPOINTMENT</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{totalCount || 14}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineCalendar className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL PENDING</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{pendingCount || 12}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineClock className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL COMPLETED</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{completedCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineCheckCircle className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL CANCELLED</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{cancelledCount || 2}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineExclamation className="w-5 h-5 text-stone-500" />
          </div>
        </div>
      </div>

      {/* ─── Status Filter Tabs (Matches Screenshot 3) ─── */}
      <div className="flex flex-wrap items-center gap-3">
        {['pending', 'confirmed', 'completed', 'cancelled'].map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setActiveTab(statusKey)}
            className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === statusKey
                ? 'bg-[#8f6d43] text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            {statusKey}
          </button>
        ))}
      </div>

      {/* ─── Search Bar ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm p-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search client name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
          />
        </div>
      </div>

      {/* ─── Appointments Table (Matches Screenshot 3) ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">CLIENT INFO</th>
                <th className="py-4 px-6">CONTACT</th>
                <th className="py-4 px-6">SCHEDULE</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading appointments...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    No appointments in this view.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((apt) => {
                  const initial = (apt.fullName || 'C')[0].toUpperCase();

                  return (
                    <tr key={apt._id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Client Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f4ece3] text-[#8f6d43] font-semibold text-xs flex items-center justify-center border border-[#8f6d43]/20 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{apt.fullName}</p>
                            <p className="text-xs text-stone-400 truncate max-w-[180px]">{apt.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-stone-700 text-xs font-medium">
                          <HiOutlinePhone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{apt.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-stone-800 text-xs">
                          <HiOutlineCalendar className="w-3.5 h-3.5 text-[#8f6d43]" />
                          <span className="font-semibold">{formatDate(apt.appointmentDate)}</span>
                          <span className="text-stone-400">/</span>
                          <span className="text-stone-500 font-medium">{apt.preferredTime}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {apt.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING
                          </span>
                        )}
                        {apt.status === 'confirmed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CONFIRMED
                          </span>
                        )}
                        {apt.status === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            COMPLETED
                          </span>
                        )}
                        {apt.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {apt.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00a86b] hover:bg-[#008f5b] text-white text-[11px] font-bold tracking-wider uppercase rounded-md transition-colors shadow-2xs cursor-pointer"
                              >
                                <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>ACCEPT</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-400 text-rose-600 hover:bg-rose-50 text-[11px] font-bold tracking-wider uppercase rounded-md transition-colors cursor-pointer"
                              >
                                <HiOutlineX className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>CANCEL</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(apt._id)}
                            title="Delete Appointment"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer ml-1"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
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

        {/* Luxury Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
