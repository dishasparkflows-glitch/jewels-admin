import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineBan,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useConfirm } from '../../contexts/ConfirmContext';
import { ViewActionButton, DeleteActionButton } from '../../components/common/RowActions';
import { useAdminPageSize } from '../../utils/adminPagination';
import StatCards from '../../components/common/StatCards';

const STATUS_TABS = [
  { value: 'all', label: 'ALL' },
  { value: 'pending', label: 'PENDING' },
  { value: 'confirmed', label: 'CONFIRMED' },
  { value: 'completed', label: 'COMPLETED' },
  { value: 'cancelled', label: 'CANCELLED' },
];

export default function CustomInquiriesView() {
  const confirm = useConfirm();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [confirmModalInquiry, setConfirmModalInquiry] = useState(null);
  const [cancelModalInquiry, setCancelModalInquiry] = useState(null);
  const [viewingInquiry, setViewingInquiry] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch inquiries from backend
  const fetchInquiries = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/custom-inquiries?page=${page}&limit=${limit}`);
      const data = res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(data)) {
        setInquiries(data);
      }
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      toast.error('Failed to load inquiries from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Action: Confirm inquiry
  const handleConfirmInquiry = async () => {
    if (!confirmModalInquiry) return;
    const id = confirmModalInquiry._id || confirmModalInquiry.id;
    try {
      await api.put(`/custom-inquiries/${id}`, { status: 'confirmed' });
      toast.success('Custom inquiry confirmed successfully');
      setInquiries((prev) =>
        prev.map((i) => ((i._id || i.id) === id ? { ...i, status: 'confirmed' } : i))
      );
      if (viewingInquiry && (viewingInquiry._id || viewingInquiry.id) === id) {
        setViewingInquiry((prev) => ({ ...prev, status: 'confirmed' }));
      }
    } catch (err) {
      console.error('Confirm request failed:', err);
      toast.error(err.response?.data?.message || 'Failed to confirm inquiry');
    } finally {
      setConfirmModalInquiry(null);
    }
  };

  // Action: Cancel inquiry
  const handleCancelInquiry = async () => {
    if (!cancelModalInquiry) return;
    const id = cancelModalInquiry._id || cancelModalInquiry.id;
    try {
      await api.put(`/custom-inquiries/${id}`, { status: 'cancelled' });
      toast.success('Custom inquiry cancelled');
      setInquiries((prev) =>
        prev.map((i) => ((i._id || i.id) === id ? { ...i, status: 'cancelled' } : i))
      );
      if (viewingInquiry && (viewingInquiry._id || viewingInquiry.id) === id) {
        setViewingInquiry((prev) => ({ ...prev, status: 'cancelled' }));
      }
    } catch (err) {
      console.error('Cancel request failed:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel inquiry');
    } finally {
      setCancelModalInquiry(null);
    }
  };

  // Action: Delete inquiry
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Custom Inquiry',
      message: `Are you sure you want to delete inquiry for "${name || 'Client'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/custom-inquiries/${id}`);
      toast.success('Inquiry deleted successfully');
      setInquiries((prev) => prev.filter((i) => (i._id || i.id) !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      if (viewingInquiry && (viewingInquiry._id || viewingInquiry.id) === id) {
        setViewingInquiry(null);
      }
    } catch (err) {
      console.error('Delete request failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete inquiry');
    }
  };

  // Metrics
  const totalInquiries = inquiries.length;
  const totalPending = inquiries.filter((i) => (i.status || '').toLowerCase() === 'pending').length;
  const totalCompleted = inquiries.filter((i) => (i.status || '').toLowerCase() === 'completed').length;
  const totalCancelled = inquiries.filter((i) => (i.status || '').toLowerCase() === 'cancelled').length;

  // Filtered List based on Status and Search
  const filteredInquiries = useMemo(() => {
    let list = inquiries;
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((i) => (i.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const name = (i.customer?.name || '').toLowerCase();
        const email = (i.customer?.email || '').toLowerCase();
        const phone = (i.customer?.phone?.number || '').toLowerCase();
        const stone = (i.requirements?.stoneType || '').toLowerCase();
        const metal = (i.requirements?.metalType || '').toLowerCase();
        const jTypes = Array.isArray(i.requirements?.jewelryTypes)
          ? i.requirements.jewelryTypes.join(' ').toLowerCase()
          : '';
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          stone.includes(q) ||
          metal.includes(q) ||
          jTypes.includes(q)
        );
      });
    }
    return list;
  }, [inquiries, statusFilter, search]);

  // Paginated List
  const totalItems = filteredInquiries.length;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInquiries.slice(start, start + pageSize);
  }, [filteredInquiries, currentPage, pageSize]);

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((i) => i._id || i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((i) => selectedIds.includes(i._id || i.id));

  // Helper format budget
  const formatBudget = (req) => {
    if (!req) return '—';
    if (req.budget) return req.budget;
    if (req.estimatedBudget) {
      if (typeof req.estimatedBudget === 'number') {
        return `₹${req.estimatedBudget.toLocaleString('en-IN')}`;
      }
      return req.estimatedBudget;
    }
    return 'Above ₹5,00,000+';
  };

  // Helper format phone
  const formatPhone = (phoneObj) => {
    if (!phoneObj) return '—';
    if (typeof phoneObj === 'string') return phoneObj;
    return phoneObj.number || '—';
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ─── Header Row ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Custom Design Inquiries
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage and view custom jewelry design request submissions from your storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchInquiries();
            toast.success('Inquiries list refreshed');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200/90 bg-white text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-50 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <HiOutlineRefresh className="w-3.5 h-3.5 text-stone-400" />
          <span>REFRESH LIST</span>
        </button>
      </div>

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards
        cards={[
          {
            label: 'Total Inquiries',
            value: totalInquiries,
            icon: HiOutlineSparkles,
            color: 'bronze',
            onClick: () => {
              setStatusFilter('all');
              setCurrentPage(1);
            },
            active: statusFilter === 'all',
          },
          {
            label: 'Total Pending',
            value: totalPending,
            icon: HiOutlineClock,
            color: 'peach',
            onClick: () => {
              setStatusFilter('pending');
              setCurrentPage(1);
            },
            active: statusFilter === 'pending',
          },
          {
            label: 'Total Completed',
            value: totalCompleted,
            icon: HiOutlineCheckCircle,
            color: 'green',
            onClick: () => {
              setStatusFilter('completed');
              setCurrentPage(1);
            },
            active: statusFilter === 'completed',
          },
          {
            label: 'Total Cancelled',
            value: totalCancelled,
            icon: HiOutlineExclamation,
            color: 'rose',
            onClick: () => {
              setStatusFilter('cancelled');
              setCurrentPage(1);
            },
            active: statusFilter === 'cancelled',
          },
        ]}
      />

      {/* ─── Status Filter Tabs & Search Bar Row ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#8a6d4b] text-white shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-500 border border-stone-200/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full sm:w-80 md:w-96 shrink-0">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search client name or contact..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-stone-200/90 focus:border-[#8f6d43] text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* ─── Luxury Inquiries Table ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-white text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 whitespace-nowrap">CLIENT INFO</th>
                <th className="py-3 px-4 whitespace-nowrap">CONTACT</th>
                <th className="py-3 px-4 whitespace-nowrap">DESIGN DETAILS</th>
                <th className="py-3 px-4 whitespace-nowrap">BUDGET</th>
                <th className="py-3 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3 pr-5 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading custom design inquiries...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    No custom design inquiries found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((inq) => {
                  const id = inq._id || inq.id;
                  const isSelected = selectedIds.includes(id);
                  const clientName = inq.customer?.name || '—';
                  const clientEmail = inq.customer?.email || '—';
                  const phoneNum = formatPhone(inq.customer?.phone);
                  const initial = (clientName === '—' ? '' : clientName)
                    .split(' ')
                    .map((s) => s[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const stone = inq.requirements?.stoneType || '—';
                  const metal = inq.requirements?.metalType || '—';
                  const jTypes = Array.isArray(inq.requirements?.jewelryTypes)
                    ? inq.requirements.jewelryTypes.join(', ')
                    : '—';

                  const budgetStr = formatBudget(inq.requirements);
                  const statusVal = (inq.status || 'pending').toLowerCase();

                  return (
                    <tr
                      key={id}
                      onClick={() => setViewingInquiry(inq)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Client Info */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f6f2ec] text-[#8a6d4b] font-bold text-xs flex items-center justify-center shrink-0 border border-[#ecd9c3]">
                            {initial}
                          </div>
                          <div className="leading-tight">
                            <p className="font-bold text-stone-900 text-xs">
                              {clientName}
                            </p>
                            <p className="text-[11px] text-stone-400 font-normal mt-0.5 max-w-[190px] truncate">
                              {clientEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-400">
                            <HiOutlinePhone className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-stone-700 text-xs font-mono">
                            {phoneNum}
                          </span>
                        </div>
                      </td>

                      {/* Design Details */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-bold text-stone-900 text-xs">
                            {stone} <span className="font-normal text-stone-400">·</span> {metal}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">
                            {jTypes}
                          </p>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-stone-800 text-xs">
                          {budgetStr}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {statusVal === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                            PENDING
                          </span>
                        )}
                        {statusVal === 'confirmed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
                            CONFIRMED
                          </span>
                        )}
                        {statusVal === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            COMPLETED
                          </span>
                        )}
                        {statusVal === 'cancelled' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Actions: View, Confirm, Cancel, Delete */}
                      <td className="py-3 pr-5 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Eye Button */}
                          <ViewActionButton
                            onClick={() => setViewingInquiry(inq)}
                            title="View inquiry details"
                          />

                          {/* 2. Confirm Blue Check Button (Triggers Confirm Modal) */}
                          <button
                            type="button"
                            onClick={() => setConfirmModalInquiry(inq)}
                            title="Confirm Inquiry"
                            className="w-7 h-7 rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            <HiOutlineCheckCircle className="w-3.5 h-3.5 stroke-2" />
                          </button>

                          {/* 3. Cancel Ban Button */}
                          <button
                            type="button"
                            onClick={() => setCancelModalInquiry(inq)}
                            title="Cancel Inquiry"
                            className="w-7 h-7 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            <HiOutlineBan className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete Trash Button */}
                          <DeleteActionButton
                            onClick={() => handleDelete(id, clientName)}
                            title="Delete Inquiry"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Luxury Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="inquiries"
        />
      </div>

      {/* ─── Confirm Inquiry Modal (Screenshot 2) ─── */}
      {confirmModalInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setConfirmModalInquiry(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-stone-100 space-y-4 text-center relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setConfirmModalInquiry(null)}
              className="absolute top-5 right-5 text-stone-300 hover:text-stone-600 transition-colors cursor-pointer"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>

            {/* Alert Icon in amber box */}
            <div className="w-14 h-14 rounded-2xl bg-[#fff7ed] border border-[#ffedd5] mx-auto flex items-center justify-center text-[#d97706] shadow-2xs">
              <HiOutlineExclamation className="w-7 h-7 stroke-2" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                Confirm Inquiry
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Confirm this custom design inquiry request?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setConfirmModalInquiry(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                NO, KEEP IT
              </button>
              <button
                type="button"
                onClick={handleConfirmInquiry}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#d97706] hover:bg-[#b45309] shadow-sm transition-colors cursor-pointer"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Inquiry Modal ─── */}
      {cancelModalInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setCancelModalInquiry(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-stone-100 space-y-4 text-center relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCancelModalInquiry(null)}
              className="absolute top-5 right-5 text-stone-300 hover:text-stone-600 transition-colors cursor-pointer"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#fff1f2] border border-[#ffe4e6] mx-auto flex items-center justify-center text-[#e11d48] shadow-2xs">
              <HiOutlineBan className="w-7 h-7 stroke-2" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                Cancel Inquiry
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to cancel this custom design inquiry request?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCancelModalInquiry(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                NO, KEEP IT
              </button>
              <button
                type="button"
                onClick={handleCancelInquiry}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#e11d48] hover:bg-[#be123c] shadow-sm transition-colors cursor-pointer"
              >
                CANCEL REQUEST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Details Modal ─── */}
      {viewingInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingInquiry(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Custom Jewelry Inquiry Details
                </h3>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                  Request ID: {(viewingInquiry._id || viewingInquiry.id || '').slice(-8)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingInquiry(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-semibold">Client Name</span>
                  <span className="font-bold text-stone-900">{viewingInquiry.customer?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-semibold">Email</span>
                  <span className="font-medium text-stone-800">{viewingInquiry.customer?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-semibold">Phone</span>
                  <span className="font-medium text-stone-800 font-mono">
                    {formatPhone(viewingInquiry.customer?.phone)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/50">
                  <span className="text-stone-400 font-semibold">Status</span>
                  <span className="font-bold uppercase tracking-wider text-[#8f6d43]">
                    {viewingInquiry.status || 'pending'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-semibold">Stone Type</span>
                  <span className="font-bold text-stone-900">{viewingInquiry.requirements?.stoneType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-semibold">Metal Type</span>
                  <span className="font-bold text-stone-900">{viewingInquiry.requirements?.metalType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-semibold">Jewelry Type</span>
                  <span className="font-bold text-stone-900">
                    {Array.isArray(viewingInquiry.requirements?.jewelryTypes)
                      ? viewingInquiry.requirements.jewelryTypes.join(', ')
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/50">
                  <span className="text-stone-400 font-semibold">Target Budget</span>
                  <span className="font-bold text-[#8f6d43] text-sm">
                    {formatBudget(viewingInquiry.requirements)}
                  </span>
                </div>
              </div>

              {viewingInquiry.requirements?.comments && (
                <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e8d9c2] space-y-1">
                  <span className="block text-[10px] font-bold text-[#8f6d43] uppercase tracking-wider">
                    Client Design Notes
                  </span>
                  <p className="text-xs text-stone-700 italic leading-relaxed">
                    &quot;{viewingInquiry.requirements.comments}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const inq = viewingInquiry;
                  setViewingInquiry(null);
                  setConfirmModalInquiry(inq);
                }}
                className="flex-1 py-2.5 bg-[#8f6d43] hover:bg-[#785e40] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
              >
                Confirm Request
              </button>
              <button
                type="button"
                onClick={() => setViewingInquiry(null)}
                className="px-5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
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
