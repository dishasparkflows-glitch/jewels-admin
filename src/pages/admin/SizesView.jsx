import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineCube,
  HiOutlineSparkles,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import Dropdown from '../../components/common/Dropdown';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import useCategoryLookup from '../../hooks/useCategoryLookup';

export default function SizesView() {
  const confirm = useConfirm();
  const { categories } = useCategoryLookup();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [viewingSize, setViewingSize] = useState(null);
  const [sizeName, setSizeName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all Sizes and Categories from API
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [serverTotal, setServerTotal] = useState(null);

  const fetchData = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const sizesRes = await api.get('/sizes?limit=100');

      const sizeItems =
        sizesRes.data?.data?.items ||
        (Array.isArray(sizesRes.data?.data) ? sizesRes.data.data : []);
      setSizes(sizeItems);
    } catch (err) {
      console.error('Failed to load sizes:', err);
      toast.error('Failed to load sizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Category theme styling helper
  const getCategoryBadgeStyle = (categoryName = '') => {
    const lower = (categoryName || '').toLowerCase();

    // Rings: Warm Amber / Champagne Gold
    if (lower.includes('ring')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200/90',
        dot: 'bg-amber-500',
      };
    }

    // Bangles & Bracelets: Sophisticated Emerald / Jade
    if (lower.includes('bangle') || lower.includes('bracelet')) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200/90',
        dot: 'bg-emerald-500',
      };
    }

    // Pendants, Necklaces, Chains: Royal Sapphire / Indigo
    if (lower.includes('pendant') || lower.includes('neck') || lower.includes('chain')) {
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200/90',
        dot: 'bg-indigo-500',
      };
    }

    // Earrings: Elegant Coral / Rose
    if (lower.includes('earring') || lower.includes('stud')) {
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200/90',
        dot: 'bg-rose-500',
      };
    }

    // Default Luxury Warm Bronze
    return {
      bg: 'bg-[#faf5ee]',
      text: 'text-[#8f6d43]',
      border: 'border-[#ecdccb]',
      dot: 'bg-[#8f6d43]',
    };
  };

  // Helper to reliably resolve human category name
  const resolveCategoryName = (s) => {
    if (s?.categoryId?.name) return s.categoryId.name;
    if (s?.category?.name) return s.category.name;
    const catId = s?.categoryId?._id || s?.categoryId || s?.category?._id || s?.category;
    if (catId) {
      const match = categories.find((c) => String(c._id) === String(catId) || String(c.id) === String(catId));
      if (match?.name) return match.name;
    }
    const nameLower = (s?.name || '').toLowerCase();
    if (nameLower.includes('bangle') || nameLower.includes('bracelet') || nameLower.includes('mm')) {
      return 'Bangles & Bracelets';
    }
    if (nameLower.includes('chain') || nameLower.includes('pendant') || nameLower.includes('inch')) {
      return 'Pendant & Necklaces';
    }
    return 'Rings';
  };

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Group unique categories with item counts
  const uniqueCategories = useMemo(() => {
    const map = new Map();
    sizes.forEach((s) => {
      const catName = resolveCategoryName(s);
      map.set(catName, (map.get(catName) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [sizes, categories]);

  // Options for Category Filter Dropdown
  const categoryOptions = useMemo(() => {
    const opts = [
      {
        value: 'all',
        label: `All Categories (${sizes.length})`,
      },
    ];

    uniqueCategories.forEach((cat) => {
      const badge = getCategoryBadgeStyle(cat.name);
      opts.push({
        value: cat.name,
        label: `${cat.name} (${cat.count})`,
        dotColor: badge.dot,
      });
    });

    return opts;
  }, [uniqueCategories, sizes.length]);

  // Search & Category filtering
  const filteredSizes = useMemo(() => {
    let list = sizes;

    if (selectedCategory !== 'all') {
      list = list.filter((s) => resolveCategoryName(s) === selectedCategory);
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (resolveCategoryName(s).toLowerCase().includes(q))
    );
  }, [sizes, search, selectedCategory, categories]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(filteredSizes, pageSize, serverTotal);

  // Quick stat cards
  const activeCount = useMemo(() => sizes.filter(s => s.status === 'active').length, [sizes]);
  const ringSizesCount = useMemo(
    () => sizes.filter(s => resolveCategoryName(s).toLowerCase().includes('ring') || !isNaN(Number(s.name))).length,
    [sizes, categories]
  );
  const bangleChainSizesCount = useMemo(
    () => Math.max(0, sizes.length - ringSizesCount),
    [sizes, ringSizesCount]
  );

  const statCardsData = [
    {
      label: 'Total Sizes',
      value: sizes.length,
      icon: HiOutlineCube,
      color: 'bronze',
      onClick: () => setSelectedCategory('all'),
    },
    {
      label: 'Active Sizes',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'green',
    },
    {
      label: 'Ring Sizes',
      value: ringSizesCount,
      icon: HiOutlineCube,
      color: 'peach',
      onClick: () => setSelectedCategory((prev) => (prev === 'Rings' ? 'all' : 'Rings')),
    },
    {
      label: 'Bangle / Chain Sizes',
      value: bangleChainSizesCount,
      icon: HiOutlineCube,
      color: 'gold',
      onClick: () => setSelectedCategory((prev) => (prev === 'Bangles & Bracelets' ? 'all' : 'Bangles & Bracelets')),
    },
  ];

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
    setCategoryId(s.categoryId?._id || s.categoryId || s.category?._id || s.category || categories[0]?._id || '');
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
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((s) => s._id));
    } else {
      setSelectedIds([]);
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
      toast.error('Please select sizes to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Sizes',
      message: `Are you sure you want to delete ${count} selected size${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/sizes/${id}`))
      );
      setSizes((prev) => prev.filter((s) => !selectedIds.includes(s._id)));
      setSelectedIds([]);
      toast.success(`${count} size${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete some sizes');
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
        categoryId,
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
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Product Config', 'Sizes']}
        title="Sizes"
        subtitle="Manage jewelry sizes, finger diameters, bracelet inner circumferences and necklace chain lengths."
        onAdd={handleOpenAdd}
        addLabel="Add Size"
        exportData={sizes}
        exportFileName="sizes_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        placeholder="Search sizes..."
        onFilterClick={() => {
          if (selectedCategory !== 'all') {
            setSelectedCategory('all');
            setCurrentPage(1);
          }
        }}
        filterActive={selectedCategory !== 'all'}
        extraActions={
          <div className="flex items-center gap-2">
            {/* Category Filter Dropdown */}
            <Dropdown
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
              options={categoryOptions}
              size="sm"
              showStatusDot
              className="w-48 sm:w-56"
              buttonClassName="h-7.5 px-2.5 text-xs rounded-md bg-white border-stone-200/90 text-stone-700 font-medium hover:border-stone-300 shadow-2xs"
              placeholder="All Categories"
            />

            {/* Bulk Delete Button */}
            <button
              type="button"
              onClick={handleBulkDelete}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-[#fdeeed] text-[#d93025] border-[#fadbd8] hover:bg-[#fadbd8] active:scale-95'
                  : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
              }`}
              title={
                selectedIds.length > 0
                  ? `Delete ${selectedIds.length} selected size${selectedIds.length > 1 ? 's' : ''}`
                  : 'Select sizes to delete'
              }
            >
              <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
              <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
            </button>
          </div>
        }
      />

      {/* ─── Sizes Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((s) => selectedIds.includes(s._id))
                    }
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">SIZE</th>
                <th className="py-2 px-3 whitespace-nowrap">CATEGORY</th>
                <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    Loading sizes...
                  </td>
                </tr>
              ) : filteredSizes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    No jewelry sizes found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((s, idx) => {
                  const isGoldSize = s.name === '18 inch';
                  const categoryName = resolveCategoryName(s);

                  const formattedDate = s.meta?.createdAt
                    ? new Date(s.meta.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '12 Jun 2026';

                  return (
                    <tr
                      key={s._id}
                      onClick={() => setViewingSize(s)}
                      className="hover:bg-[#faf7f2] transition-colors cursor-pointer group"
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
                      <td className="py-2.5 px-3 whitespace-nowrap text-xs">
                        <span
                          className={`font-bold tracking-wide ${
                            isGoldSize ? 'text-[#8f6d43]' : 'text-stone-900'
                          }`}
                        >
                          {s.name}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {(() => {
                          const badge = getCategoryBadgeStyle(categoryName);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs tracking-wide ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shrink-0`} />
                              <span>{categoryName}</span>
                            </span>
                          );
                        })()}
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
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="sizes"
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                  Size Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sizeName}
                  onChange={(e) => setSizeName(e.target.value)}
                  placeholder="e.g. Size 7 or 2.4"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                  Category <span className="text-rose-500 font-bold">*</span>
                </label>
                <Dropdown
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  options={categories.map((cat) => ({
                    value: cat._id,
                    label: cat.name,
                  }))}
                  placeholder="Select Category"
                  buttonClassName="w-full h-10 rounded-xl text-xs sm:text-[13px] font-medium border border-[#d6cfc2] hover:border-[#bdae99] bg-white text-stone-900"
                />
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
              <div className="flex items-center justify-between py-2 border-b border-stone-100">
                <span className="text-stone-400">Category:</span>
                {(() => {
                  const catName = resolveCategoryName(viewingSize);
                  const badge = getCategoryBadgeStyle(catName);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shrink-0`} />
                      <span>{catName}</span>
                    </span>
                  );
                })()}
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Created Date:</span>
                <span className="font-medium text-stone-600">
                  {viewingSize.meta?.createdAt
                    ? new Date(viewingSize.meta.createdAt).toLocaleDateString('en-GB', {
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
