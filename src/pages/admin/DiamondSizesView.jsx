import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles,
  HiOutlineCube,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

export default function DiamondSizesView() {
  const confirm = useConfirm();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [viewingSize, setViewingSize] = useState(null);
  const [sizeFrom, setSizeFrom] = useState('');
  const [sizeTo, setSizeTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all Diamond Sizes from API
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diamond-sizes?limit=100');
      const items =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setSizes(items);
    } catch (err) {
      console.error('Failed to load diamond sizes:', err);
      toast.error('Failed to load diamond sizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  // Search filtering
  const filteredSizes = useMemo(() => {
    if (!search.trim()) return sizes;
    const q = search.toLowerCase();
    return sizes.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.sizeFrom !== undefined && String(s.sizeFrom).includes(q)) ||
        (s.sizeTo !== undefined && String(s.sizeTo).includes(q))
    );
  }, [sizes, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredSizes, 10);

  // Quick stat cards
  const activeCount = useMemo(() => sizes.filter(s => s.status === 'active').length, [sizes]);
  const minSize = useMemo(() => {
    if (!sizes.length) return '0.8 mm';
    const minVal = Math.min(...sizes.map(s => Number(s.sizeFrom) || 999));
    return `${minVal} mm`;
  }, [sizes]);
  const maxSize = useMemo(() => {
    if (!sizes.length) return '3.5 mm';
    const maxVal = Math.max(...sizes.map(s => Number(s.sizeTo) || 0));
    return `${maxVal} mm`;
  }, [sizes]);

  const statCardsData = [
    {
      label: 'Size Ranges',
      value: sizes.length,
      icon: HiOutlineCube,
      color: 'bronze',
    },
    {
      label: 'Active Ranges',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'green',
    },
    {
      label: 'Smallest Gauge',
      value: minSize,
      icon: IoDiamondOutline,
      color: 'peach',
    },
    {
      label: 'Largest Gauge',
      value: maxSize,
      icon: IoDiamondOutline,
      color: 'gold',
    },
  ];

  // Open modal to add new size
  const handleOpenAdd = () => {
    setEditingSize(null);
    setSizeFrom('');
    setSizeTo('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing size
  const handleOpenEdit = (s) => {
    setEditingSize(s);
    setSizeFrom(s.sizeFrom !== undefined ? String(s.sizeFrom) : '');
    setSizeTo(s.sizeTo !== undefined ? String(s.sizeTo) : '');
    setIsModalOpen(true);
  };

  // Toggle active/inactive status (Visibility)
  const handleToggleVisibility = async (sizeItem) => {
    try {
      const nextStatus = sizeItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/diamond-sizes/${sizeItem._id}`, { status: nextStatus });
      toast.success(`${sizeItem.name} visibility set to ${nextStatus}`);
      setSizes((prev) =>
        prev.map((item) =>
          item._id === sizeItem._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  // Delete Diamond Size
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Diamond Size Range',
      message: `Are you sure you want to delete diamond size range "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Range',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/diamond-sizes/${id}`);
      toast.success(`Diamond size range "${name}" deleted`);
      setSizes((prev) => prev.filter((item) => item._id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Selection handlers
  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((s) => selectedIds.includes(s._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedItems.some((s) => s._id === id))
      );
    } else {
      const pageIds = paginatedItems.map((s) => s._id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) {
      toast.error('Please select size ranges to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Size Ranges',
      message: `Are you sure you want to delete ${count} selected size range${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/diamond-sizes/${id}`))
      );
      const successfulIds = selectedIds.filter((_, idx) => results[idx].status === 'fulfilled');
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      if (successfulIds.length > 0) {
        setSizes((prev) => prev.filter((item) => !successfulIds.includes(item._id)));
        setSelectedIds((prev) => prev.filter((id) => !successfulIds.includes(id)));
        toast.success(`${successfulIds.length} size range${successfulIds.length > 1 ? 's' : ''} deleted successfully`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} size range${failedCount > 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete selected size ranges');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sizeFrom || !sizeTo) {
      toast.error('Please enter both size from and size to values');
      return;
    }

    const fromNum = Number(sizeFrom);
    const toNum = Number(sizeTo);

    if (isNaN(fromNum) || isNaN(toNum)) {
      toast.error('Please enter valid numeric values for size range');
      return;
    }

    if (fromNum > toNum) {
      toast.error('"Size From" cannot be greater than "Size To"');
      return;
    }

    try {
      setSubmitting(true);
      const name = `${fromNum} - ${toNum} mm`;
      const payload = {
        name,
        sizeFrom: fromNum,
        sizeTo: toNum,
        status: 'active',
      };

      if (editingSize?._id) {
        await api.put(`/diamond-sizes/${editingSize._id}`, payload);
        toast.success(`Size range "${payload.name}" updated successfully`);
      } else {
        await api.post('/diamond-sizes', payload);
        toast.success(`Size range "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchSizes();
    } catch (err) {
      console.error('Error saving diamond size:', err);
      toast.error(err.response?.data?.message || 'Failed to save diamond size');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Diamond Config', 'Diamond Sizes']}
        title="Diamond Sizes"
        subtitle="Manage and define physical side diamond size ranges, calibrations and millimeter tolerances."
        onAdd={handleOpenAdd}
        addLabel="Add Size Range"
        exportData={sizes}
        exportFileName="diamond_sizes_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search size ranges..."
        extraActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={
              selectedIds.length > 0
                ? `Delete ${selectedIds.length} selected size range${selectedIds.length > 1 ? 's' : ''}`
                : 'Select size ranges to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Diamond Size Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">SIZE NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">SIZE FROM (MM)</th>
                <th className="py-2 px-3 whitespace-nowrap">SIZE TO (MM)</th>
                <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    Loading diamond sizes...
                  </td>
                </tr>
              ) : filteredSizes.length === 0 ? (
                /* ─── Empty State (Matches Screenshot 1 Exactly) ─── */
                <tr>
                  <td colSpan="7" className="py-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 shadow-2xs mb-0.5">
                        <IoDiamondOutline className="w-5 h-5 text-stone-300 stroke-1" />
                      </div>
                      <h3 className="font-bold text-stone-700 text-xs tracking-wider uppercase">
                        NO SIZES FOUND
                      </h3>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider max-w-sm">
                        START BY ADDING DIAMOND SIZE RANGES FOR THE CATALOGUE.
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 px-3 py-1 bg-[#8b6f4e] hover:bg-[#7b5b33] text-white text-[10px] font-bold tracking-wider uppercase rounded shadow-xs transition-colors cursor-pointer"
                      >
                        ADD SIZE +
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((s, idx) => {
                  const formattedDate = s.meta?.createdAt
                    ? new Date(s.meta.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '15 Jul 2026';

                  return (
                    <tr
                      key={s._id}
                      onClick={() => setViewingSize(s)}
                      className={`transition-colors cursor-pointer group ${
                        selectedIds.includes(s._id) ? 'bg-[#fcfaf7]' : 'hover:bg-[#faf7f2]'
                      }`}
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s._id)}
                          onChange={() => handleSelectItem(s._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Size Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-900 text-xs">
                        {s.name}
                      </td>

                      {/* Size From (mm) */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-stone-700 text-xs">
                        {s.sizeFrom} mm
                      </td>

                      {/* Size To (mm) */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-stone-700 text-xs">
                        {s.sizeTo} mm
                      </td>

                      {/* Created Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingSize(s)}
                          onEdit={() => handleOpenEdit(s)}
                          onDelete={() => handleDelete(s._id, s.name)}
                          viewTitle="View Details"
                        />
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

      {/* ─── Add / Edit Modal (Matches Screenshot 2 Exactly) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-lg tracking-tight">
                  {editingSize ? 'Edit Size Range' : 'Add Size Range'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8f6d43] block mt-0.5">
                  MANAGEMENT SYSTEM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Size Range Fields: 2 Columns (Matches Screenshot 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    SIZE FROM (MM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sizeFrom}
                    onChange={(e) => setSizeFrom(e.target.value)}
                    placeholder="e.g. 0.18"
                    className="w-full h-11 px-4 text-xs font-semibold rounded-lg border border-[#8f6d43]/60 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    SIZE TO (MM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sizeTo}
                    onChange={(e) => setSizeTo(e.target.value)}
                    placeholder="e.g. 0.22"
                    className="w-full h-11 px-4 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer Actions (Matches Screenshot 2) */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 h-11 bg-[#f7f7f9] hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 h-11 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSize ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Size Details Modal ─── */}
      {viewingSize && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingSize(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Diamond Size Range</h3>
              <button
                onClick={() => setViewingSize(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-[#8f6d43]">
                <IoDiamondOutline className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-base">{viewingSize.name}</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Range: <span className="font-semibold text-stone-800">{viewingSize.sizeFrom} mm - {viewingSize.sizeTo} mm</span>
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Visibility:{' '}
                  <span className="font-semibold text-[#8f6d43] uppercase">
                    {viewingSize.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const current = viewingSize;
                  setViewingSize(null);
                  handleOpenEdit(current);
                }}
                className="flex-1 h-10 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Edit Size
              </button>
              <button
                onClick={() => setViewingSize(null)}
                className="px-4 h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
