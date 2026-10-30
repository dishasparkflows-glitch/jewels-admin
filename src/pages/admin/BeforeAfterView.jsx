import { createPortal } from "react-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineSparkles,
  HiOutlineCube,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Dropdown from '../../components/common/Dropdown';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useAdminPageSize } from '../../utils/adminPagination';

export default function BeforeAfterView() {
  const confirm = useConfirm();

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields (Matches Exact User Screenshot)
  const [altText, setAltText] = useState('');
  const [position, setPosition] = useState(1);
  const [status, setStatus] = useState('active');

  // Before & After Image States
  const [beforeImage, setBeforeImage] = useState({ url: '', key: '' });
  const [afterImage, setAfterImage] = useState({ url: '', key: '' });
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const beforeFileRef = useRef(null);
  const afterFileRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch items from backend
  const fetchItems = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/cust-jewellery-before-after?page=${page}&limit=${limit}`);
      const dataItems =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setItems(dataItems);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load before/after showcase items:', err);
      toast.error('Failed to load before/after items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        (item.alt && item.alt.toLowerCase().includes(search.toLowerCase()));
      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  // Pagination
  const {
    totalItems,
    paginatedItems,
  } = usePagination(filteredItems, pageSize, serverTotal);

  // Stat Cards Data
  const activeCount = useMemo(
    () => items.filter((i) => i.status === 'active').length,
    [items]
  );
  const statCardsData = [
    {
      label: 'Total Pairs',
      value: items.length,
      icon: HiOutlineCube,
      color: 'bronze',
    },
    {
      label: 'Active Showcases',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'green',
    },
    {
      label: 'Draft / Inactive',
      value: Math.max(0, items.length - activeCount),
      icon: HiOutlinePhotograph,
      color: 'peach',
    },
    {
      label: 'Curated Designs',
      value: items.length,
      icon: IoDiamondOutline,
      color: 'gold',
    },
  ];

  // Open Modal to Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setAltText('');
    setPosition(items.length + 1);
    setStatus('active');
    setBeforeImage({ url: '', key: '' });
    setAfterImage({ url: '', key: '' });
    setBeforePreview('');
    setAfterPreview('');
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setAltText(item.alt || '');
    setPosition(item.position || 1);
    setStatus(item.status || 'active');
    setBeforeImage({
      url: item.beforeImage?.url || '',
      key: item.beforeImage?.key || '',
    });
    setAfterImage({
      url: item.afterImage?.url || '',
      key: item.afterImage?.key || '',
    });
    setBeforePreview(item.beforeImage?.url || '');
    setAfterPreview(item.afterImage?.url || '');
    setIsModalOpen(true);
  };

  // Open View Details Modal
  const handleOpenView = (item) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  // Handle Image Upload with Presigned URL and local preview fallback
  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'before') {
        setBeforePreview(reader.result);
      } else {
        setAfterPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      if (type === 'before') setUploadingBefore(true);
      else setUploadingAfter(true);

      const uploaded = await uploadWithPresignedUrl(file, 'before-after');
      const imgData = {
        url: uploaded.fileUrl,
        key: uploaded.key || '',
      };

      if (type === 'before') {
        setBeforeImage(imgData);
        setBeforePreview(imgData.url);
      } else {
        setAfterImage(imgData);
        setAfterPreview(imgData.url);
      }

      toast.success(`${type === 'before' ? 'Before' : 'After'} image uploaded`);
    } catch (err) {
      toast.error(err.message || 'Image upload failed. Please try again.');
      if (type === 'before') setBeforePreview(beforeImage.url || '');
      else setAfterPreview(afterImage.url || '');
    } finally {
      if (type === 'before') setUploadingBefore(false);
      else setUploadingAfter(false);
    }
  };

  // Submit Modal (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!beforeImage.url && !beforePreview) {
      toast.error('Please upload Before Image');
      return;
    }
    if (!afterImage.url && !afterPreview) {
      toast.error('Please upload After Image');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        beforeImage: {
          url: beforeImage.url || beforePreview,
          key: beforeImage.key || '',
        },
        afterImage: {
          url: afterImage.url || afterPreview,
          key: afterImage.key || '',
        },
        alt: altText.trim(),
        position: Number(position) || 0,
        status,
      };

      if (editingItem?._id) {
        await api.put(`/cust-jewellery-before-after/${editingItem._id}`, payload);
        toast.success('Before/After pair updated successfully');
      } else {
        await api.post('/cust-jewellery-before-after', payload);
        toast.success('Before/After pair created successfully');
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Failed to save before/after item:', err);
      toast.error(err.response?.data?.message || 'Failed to save showcase pair');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      await api.put(`/cust-jewellery-before-after/${item._id}`, { status: nextStatus });
      toast.success(`Showcase set to ${nextStatus}`);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, status: nextStatus } : i))
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete single item
  const handleDelete = async (id, title) => {
    const isConfirmed = await confirm({
      title: 'Delete Showcase Pair',
      message: `Are you sure you want to delete "${title || 'this Before/After pair'}"? This action cannot be undone.`,
      confirmText: 'Delete Pair',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/cust-jewellery-before-after/${id}`);
      toast.success('Showcase pair deleted');
      setItems((prev) => prev.filter((i) => i._id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;

    const isConfirmed = await confirm({
      title: 'Delete Selected Pairs',
      message: `Are you sure you want to delete ${count} selected Before/After pair${count > 1 ? 's' : ''}?`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/cust-jewellery-before-after/${id}`))
      );
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i._id)));
      setSelectedIds([]);
      toast.success(`${count} showcase pairs deleted`);
    } catch (err) {
      toast.error('Failed to delete some items');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((i) => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Marketing', 'Custom Before/After']}
        title="Custom Before/After Gallery"
        subtitle="Manage customer before/after jewelry designs showcased on the Custom Design atelier."
        onAdd={handleOpenAdd}
        addLabel="Add New Pair"
        exportData={items}
        exportFileName="before_after_gallery_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (Single Slim Row, Space-Saving) ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex-1">
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by alt description..."
            extraActions={
              <button
                type="button"
                onClick={handleBulkDelete}
                className={`flex items-center gap-2 h-[42px] px-3.5 sm:px-4 rounded-xl text-xs sm:text-[13px] font-semibold transition-all border shadow-2xs cursor-pointer ${
                  selectedIds.length > 0
                    ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                    : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
                }`}
                title={
                  selectedIds.length > 0
                    ? `Delete ${selectedIds.length} selected pair${selectedIds.length > 1 ? 's' : ''}`
                    : 'Select pairs to delete'
                }
              >
                <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
                <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
              </button>
            }
          />
        </div>

        {/* Compact Right Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Dropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active', dotColor: 'bg-emerald-500' },
              { value: 'inactive', label: 'Inactive', dotColor: 'bg-stone-400' },
            ]}
            showStatusDot
            size="sm"
            placeholder="Status"
            buttonClassName="h-7.5 px-2.5 rounded-md text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 shadow-2xs"
          />

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center p-0.5 bg-stone-100 rounded-md border border-stone-200/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#8b6f4e] shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Dual Cards Grid View"
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#8b6f4e] shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Table View"
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content Display: Grid Mode vs Table Mode ─── */}
      {loading ? (
        <div className="bg-white rounded-lg border border-stone-200/90 p-16 text-center text-stone-400 shadow-2xs">
          <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Loading before/after gallery...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200/90 p-16 text-center shadow-2xs">
          <HiOutlinePhotograph className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-stone-800">No before/after showcases found</h3>
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── Grid Mode: Dual Image Luxury Cards (Matches Screenshot Background) ─── */
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {paginatedItems.map((item, idx) => {
              const isSelected = selectedIds.includes(item._id);
              const createdDate = item.meta?.createdAt
                ? new Date(item.meta.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '12 Oct 2026';

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group ${
                    isSelected ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30' : 'border-stone-200/90'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3 border-b border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item._id)}
                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-wider">
                        #{item.position || (currentPage - 1) * pageSize + idx + 1}
                      </span>
                    </div>

                    {/* Status Badge & Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide transition-all border cursor-pointer ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                      }`}
                      title="Click to toggle status"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      />
                      <span>{item.status?.toUpperCase() || 'ACTIVE'}</span>
                    </button>
                  </div>

                  {/* Card Body: Dual Images Side-by-Side */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                    {/* Alt Description in quotes */}
                    {item.alt ? (
                      <p className="text-xs text-stone-700 font-medium italic line-clamp-2 min-h-[32px] leading-tight" title={item.alt}>
                        &ldquo;{item.alt}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 italic min-h-[32px] leading-tight">
                        &ldquo;Custom Jewelry Redesign Transformation&rdquo;
                      </p>
                    )}

                    {/* Dual Before / After Image Containers */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* BEFORE IMAGE CONTAINER */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block text-center">
                          Before
                        </span>
                        <div
                          onClick={() => handleOpenView(item)}
                          className="relative aspect-[3/4] rounded-lg overflow-hidden bg-stone-50 border border-stone-200/80 shadow-2xs flex items-center justify-center cursor-pointer group/img"
                        >
                          {item.beforeImage?.url ? (
                            <img
                              src={item.beforeImage.url}
                              alt="Before Transformation"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <HiOutlinePhotograph className="w-6 h-6 text-stone-300" />
                          )}
                        </div>
                      </div>

                      {/* AFTER IMAGE CONTAINER */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[#8b6f4e] uppercase tracking-widest block text-center">
                          After
                        </span>
                        <div
                          onClick={() => handleOpenView(item)}
                          className="relative aspect-[3/4] rounded-lg overflow-hidden bg-stone-50 border border-stone-200/80 shadow-2xs flex items-center justify-center cursor-pointer group/img"
                        >
                          {item.afterImage?.url ? (
                            <img
                              src={item.afterImage.url}
                              alt="After Transformation"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <HiOutlinePhotograph className="w-6 h-6 text-stone-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-3 py-2 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-stone-400 font-medium">
                      {createdDate}
                    </span>
                    <RowActions
                      record={item}
                      onView={() => handleOpenView(item)}
                      onEdit={() => handleOpenEdit(item)}
                      onDelete={() => handleDelete(item._id, item.alt)}
                      viewTitle="View Pair Details"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Luxury Common Pagination */}
          <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={serverTotal ?? totalItems}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="pairs"
            />
          </div>
        </div>
      ) : (
        /* ─── Table Mode ─── */
        <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-2 pl-4 pr-1 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedItems.length > 0 &&
                        paginatedItems.every((i) => selectedIds.includes(i._id))
                      }
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-2 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                  <th className="py-2 px-3 whitespace-nowrap">PAIR PREVIEW</th>
                  <th className="py-2 px-3 whitespace-nowrap">ALT TEXT (DESCRIPTION)</th>
                  <th className="py-2 px-3 text-center whitespace-nowrap">STATUS</th>
                  <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                  <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {paginatedItems.map((item, idx) => {
                  const isSelected = selectedIds.includes(item._id);
                  const createdDate = item.meta?.createdAt
                    ? new Date(item.meta.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '12 Oct 2026';

                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleOpenView(item)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(item._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Dual Thumbnails (Before & After) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* Before Thumbnail */}
                          <div className="relative w-8 h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden shadow-2xs shrink-0" title="Before Image">
                            <img
                              src={item.beforeImage?.url}
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] font-bold text-center uppercase">B</span>
                          </div>
                          <span className="text-stone-300 font-bold">›</span>
                          {/* After Thumbnail */}
                          <div className="relative w-8 h-10 rounded bg-stone-100 border border-[#8b6f4e]/40 overflow-hidden shadow-2xs shrink-0" title="After Image">
                            <img
                              src={item.afterImage?.url}
                              alt="After"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-[#8b6f4e] text-white text-[7px] font-bold text-center uppercase">A</span>
                          </div>
                        </div>
                      </td>

                      {/* Alt Description */}
                      <td className="py-2.5 px-3 text-xs">
                        <span className="font-semibold text-stone-900 block max-w-sm truncate" title={item.alt}>
                          {item.alt || 'Untitled Transformation'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          Position #{item.position || idx + 1}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          <span>{item.status?.toUpperCase() || 'ACTIVE'}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {createdDate}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          record={item}
                          onView={() => handleOpenView(item)}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item._id, item.alt)}
                          viewTitle="View Details"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Luxury Common Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={serverTotal ?? totalItems}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemLabel="pairs"
          />
        </div>
      )}

      {/* ─── Add / Edit Modal (Matches User's Screenshot EXACTLY) ─── */}
      {isModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base sm:text-lg tracking-tight">
                {editingItem ? 'Edit Before/After Pair' : 'Add New Before/After Pair'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dual Upload Boxes Row (Before Image & After Image) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. BEFORE IMAGE BOX */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                    BEFORE IMAGE
                  </label>

                  {beforePreview ? (
                    <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center h-44 shadow-2xs">
                      <img
                        src={beforePreview}
                        alt="Before Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-all gap-1.5 font-semibold text-xs">
                        <HiOutlineUpload className="w-4 h-4" />
                        <span>Replace Image</span>
                        <input
                          type="file"
                          ref={beforeFileRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'before')}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="h-44 rounded-xl bg-stone-50/70 border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] flex flex-col items-center justify-center text-stone-400 hover:text-[#8b6f4e] cursor-pointer transition-all shadow-inner group">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-2 border border-stone-200">
                        <HiOutlinePlus className="w-4 h-4 text-[#8b6f4e]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 group-hover:text-[#8b6f4e]">
                        {uploadingBefore ? 'Uploading...' : 'UPLOAD BEFORE IMAGE'}
                      </span>
                      <input
                        type="file"
                        ref={beforeFileRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'before')}
                        required={!editingItem}
                      />
                    </label>
                  )}
                </div>

                {/* 2. AFTER IMAGE BOX */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                    AFTER IMAGE
                  </label>

                  {afterPreview ? (
                    <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center h-44 shadow-2xs">
                      <img
                        src={afterPreview}
                        alt="After Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-all gap-1.5 font-semibold text-xs">
                        <HiOutlineUpload className="w-4 h-4" />
                        <span>Replace Image</span>
                        <input
                          type="file"
                          ref={afterFileRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'after')}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="h-44 rounded-xl bg-stone-50/70 border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] flex flex-col items-center justify-center text-stone-400 hover:text-[#8b6f4e] cursor-pointer transition-all shadow-inner group">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-2 border border-stone-200">
                        <HiOutlinePlus className="w-4 h-4 text-[#8b6f4e]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 group-hover:text-[#8b6f4e]">
                        {uploadingAfter ? 'Uploading...' : 'UPLOAD AFTER IMAGE'}
                      </span>
                      <input
                        type="file"
                        ref={afterFileRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'after')}
                        required={!editingItem}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 3. ALT TEXT (DESCRIPTION) Input Box (Matches Screenshot) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                  ALT TEXT (DESCRIPTION)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. Lozenge diamond ring design"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Position & Status Row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
                    DISPLAY POSITION / ORDER
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-[#8f6d43]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
                    STATUS
                  </label>
                  <Dropdown
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={[
                      { value: 'active', label: 'Active', dotColor: 'bg-emerald-500' },
                      { value: 'inactive', label: 'Inactive', dotColor: 'bg-stone-400' },
                    ]}
                    showStatusDot
                    size="sm"
                    buttonClassName="h-9 px-3 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Modal Action Buttons (Matches Screenshot: CANCEL & SAVE CHANGES) */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 h-10 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── View Showcase Details Modal ─── */}
      {isViewModalOpen && viewingItem && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Transformation Details</h3>
                <span className="text-[10px] font-bold text-[#8b6f4e] uppercase tracking-wider">
                  Position #{viewingItem.position || 1} &bull; {viewingItem.status?.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Description */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                Alt Description
              </span>
              <p className="font-semibold text-stone-800 italic">
                &ldquo;{viewingItem.alt || 'Untitled Redesign'}&rdquo;
              </p>
            </div>

            {/* Side by side large comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Before Transformation
                </span>
                <div className="aspect-[3/4] max-h-72 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={viewingItem.beforeImage?.url}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b6f4e]">
                  After Transformation
                </span>
                <div className="aspect-[3/4] max-h-72 rounded-xl bg-stone-100 border border-[#8b6f4e]/30 overflow-hidden flex items-center justify-center">
                  <img
                    src={viewingItem.afterImage?.url}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const itm = viewingItem;
                  setIsViewModalOpen(false);
                  handleOpenEdit(itm);
                }}
                className="px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Edit Pair
              </button>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}
