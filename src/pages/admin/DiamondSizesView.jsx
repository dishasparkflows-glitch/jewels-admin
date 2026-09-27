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
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function DiamondSizesView() {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.ceil(filteredSizes.length / limit) || 1;

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
    if (!window.confirm(`Are you sure you want to delete diamond size range "${name}"?`)) return;
    try {
      await api.delete(`/diamond-sizes/${id}`);
      toast.success(`Diamond size range "${name}" deleted`);
      setSizes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Top Header (Matches Screenshot 1 - Zero Sync Button) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Diamond Size Configuration
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage and define physical side diamond size ranges (mm).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD NEW SIZE</span>
        </button>
      </div>

      {/* ─── Diamond Size Table Card ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 space-y-4">
        {/* Table Search (Full width inside card matching Screenshot 1) */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <HiOutlineSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search size ranges..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6 whitespace-nowrap">SIZE NAME</th>
                <th className="py-4 px-6 whitespace-nowrap">SIZE FROM (MM)</th>
                <th className="py-4 px-6 whitespace-nowrap">SIZE TO (MM)</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">VISIBILITY</th>
                <th className="py-4 px-6 whitespace-nowrap">CREATED DATE</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-stone-400">
                    Loading diamond sizes...
                  </td>
                </tr>
              ) : filteredSizes.length === 0 ? (
                /* ─── Empty State (Matches Screenshot 1 Exactly) ─── */
                <tr>
                  <td colSpan="6" className="py-16">
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 shadow-2xs mb-1">
                        <IoDiamondOutline className="w-7 h-7 text-stone-300 stroke-1" />
                      </div>
                      <h3 className="font-bold text-stone-700 text-xs tracking-wider uppercase">
                        NO SIZES FOUND
                      </h3>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider max-w-sm">
                        START BY ADDING DIAMOND SIZE RANGES FOR THE CATALOGUE.
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-3 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-[11px] font-bold tracking-wider uppercase rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        ADD SIZE +
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSizes.map((s) => {
                  const isActive = s.status === 'active';
                  const formattedDate = s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '15/07/2026';

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Size Name */}
                      <td className="py-4 px-6 whitespace-nowrap font-bold text-stone-900 text-xs">
                        {s.name}
                      </td>

                      {/* Size From (mm) */}
                      <td className="py-4 px-6 whitespace-nowrap font-semibold text-stone-700 text-xs">
                        {s.sizeFrom} mm
                      </td>

                      {/* Size To (mm) */}
                      <td className="py-4 px-6 whitespace-nowrap font-semibold text-stone-700 text-xs">
                        {s.sizeTo} mm
                      </td>

                      {/* Visibility Toggle Switch (Matches Screenshot 1) */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(s)}
                          className={`w-11 h-6 rounded-full transition-colors relative inline-block cursor-pointer focus:outline-none ${
                            isActive ? 'bg-[#8f6d43]' : 'bg-stone-300'
                          }`}
                          title={`Visibility: ${isActive ? 'Visible' : 'Hidden'}`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 absolute top-0.5 left-0.5 ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-6 whitespace-nowrap text-stone-500 font-medium">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingSize(s)}
                            title="View Size Details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Size Range"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id, s.name)}
                            title="Delete Size Range"
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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

        {/* ─── Footer Pagination (Matches Screenshot 1) ─── */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 border-t border-stone-100">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              LIMIT
            </span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 bg-white focus:outline-none focus:border-[#8f6d43]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {filteredSizes.length} SIZES INDEXED
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            {filteredSizes.length > 0 && (
              <span className="w-7 h-7 rounded-full bg-[#8f6d43] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {page}
              </span>
            )}
            <button
              disabled={filteredSizes.length <= limit}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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

            <div className="pt-2">
              <button
                onClick={() => setViewingSize(null)}
                className="w-full h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
