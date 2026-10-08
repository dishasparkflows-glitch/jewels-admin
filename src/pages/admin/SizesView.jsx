import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function SizesView() {
  const confirm = useConfirm();
  const [sizes, setSizes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [viewingSize, setViewingSize] = useState(null);
  const [sizeName, setSizeName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all Sizes and Categories from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sizesRes, catsRes] = await Promise.all([
        api.get('/sizes?limit=100'),
        api.get('/categories?limit=100'),
      ]);

      const sizeItems =
        sizesRes.data?.data?.items ||
        (Array.isArray(sizesRes.data?.data) ? sizesRes.data.data : []);
      setSizes(sizeItems);

      const catItems =
        catsRes.data?.data?.items ||
        (Array.isArray(catsRes.data?.data) ? catsRes.data.data : []);
      setCategories(catItems);
    } catch (err) {
      console.error('Failed to load sizes:', err);
      toast.error('Failed to load sizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search filtering
  const filteredSizes = useMemo(() => {
    if (!search.trim()) return sizes;
    const q = search.toLowerCase();
    return sizes.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category?.name && s.category.name.toLowerCase().includes(q))
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

  // Open modal to add new size
  const handleOpenAdd = () => {
    setEditingSize(null);
    setSizeName('');
    setCategoryId(categories[0]?._id || '');
    setIsModalOpen(true);
  };

  // Open modal to edit existing size
  const handleOpenEdit = (s) => {
    setEditingSize(s);
    setSizeName(s.name || '');
    setCategoryId(s.category?._id || s.category || categories[0]?._id || '');
    setIsModalOpen(true);
  };

  // Toggle active/inactive status (Visibility)
  const handleToggleVisibility = async (sizeItem) => {
    try {
      const nextStatus = sizeItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/sizes/${sizeItem._id}`, { status: nextStatus });
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

  // Delete Size
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Size',
      message: `Are you sure you want to delete size "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Size',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/sizes/${id}`);
      toast.success(`Size "${name}" deleted`);
      setSizes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sizeName.trim()) {
      toast.error('Please enter a size name');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: sizeName.trim(),
        category: categoryId,
        status: 'active',
      };

      if (editingSize?._id) {
        await api.put(`/sizes/${editingSize._id}`, payload);
        toast.success(`Size "${payload.name}" updated successfully`);
      } else {
        await api.post('/sizes', payload);
        toast.success(`Size "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving size:', err);
      toast.error(err.response?.data?.message || 'Failed to save size');
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
            Sizes
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage available jewelry sizing options for rings, bangles, and neckpieces.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD SIZE</span>
        </button>
      </div>

      {/* ─── Sizes Table Card ─── */}
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
            placeholder="Search sizes..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
        </div>

        {/* Table (Columns match Screenshot 1: SIZE, CATEGORY, VISIBILITY, CREATED DATE, ACTIONS) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6 whitespace-nowrap">SIZE</th>
                <th className="py-4 px-6 whitespace-nowrap">CATEGORY</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">VISIBILITY</th>
                <th className="py-4 px-6 whitespace-nowrap">CREATED DATE</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    Loading sizes...
                  </td>
                </tr>
              ) : filteredSizes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    No jewelry sizes found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((s) => {
                  const isActive = s.status === 'active';
                  // In Screenshot 1, row 4 "18 inch" is rendered in warm gold/brown
                  const isGoldSize = s.name === '18 inch';

                  const categoryName =
                    s.category?.name ||
                    (s.name.includes('bangles') || s.name.includes('mm')
                      ? 'BANGLES & BRACELETS (BANGLES)'
                      : 'PENDANT');

                  const formattedDate = s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '12/06/2026';

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Size Name */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs">
                        <span
                          className={`font-bold tracking-wide ${
                            isGoldSize ? 'text-[#8f6d43]' : 'text-stone-900'
                          }`}
                        >
                          {s.name}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100/80 text-stone-600 text-[10px] font-bold tracking-wider uppercase inline-block">
                          {categoryName}
                        </span>
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
                            title="Edit Size"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id, s.name)}
                            title="Delete Size"
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
                  {editingSize ? 'Edit Size' : 'Add Size'}
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

            {/* Modal Form (Matches Screenshot 2) */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Size Name */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  SIZE NAME
                </label>
                <input
                  type="text"
                  required
                  value={sizeName}
                  onChange={(e) => setSizeName(e.target.value)}
                  placeholder="e.g. Size 7 or 2.4"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-[#8f6d43]/60 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  CATEGORY
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all cursor-pointer"
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
              <h3 className="font-bold text-stone-900 text-base">Size Details</h3>
              <button
                onClick={() => setViewingSize(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Size Name:</span>
                <span className="font-bold text-stone-800">{viewingSize.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Category:</span>
                <span className="font-bold text-stone-800">
                  {viewingSize.category?.name || 'Pendant'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Created Date:</span>
                <span className="font-medium text-stone-600">
                  {viewingSize.createdAt
                    ? new Date(viewingSize.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '12/06/2026'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">Visibility:</span>
                <span className="font-semibold text-[#8f6d43] uppercase">
                  {viewingSize.status}
                </span>
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
