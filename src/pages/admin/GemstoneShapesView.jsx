import { createPortal } from "react-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineCloudUpload,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { TbCircleOff } from 'react-icons/tb';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl, deleteUploadedFile } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import CuteLoader from '../../components/common/CuteLoader';
import { useAdminPageSize } from '../../utils/adminPagination';

/**
 * Shape Icon Helper
 * Renders SVG or uploaded shape image
 */
function VisualShapeBadge({ name = '', imageUrl, className = 'w-8 h-8' }) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = getMediaUrl(imageUrl);

  if (resolvedSrc && !imgError) {
    return (
      <div className={`${className} rounded-xl bg-stone-50 border border-stone-200/80 p-1 flex items-center justify-center shadow-2xs`}>
        <img
          src={resolvedSrc}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Predefined SVG icons for standard shapes
  const lower = name.toLowerCase();
  let path = null;
  if (lower.includes('heart')) {
    path = (
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    );
  } else if (lower.includes('round')) {
    path = <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />;
  } else if (lower.includes('oval')) {
    path = <ellipse cx="12" cy="12" rx="6.5" ry="9" fill="none" stroke="currentColor" strokeWidth="1.6" />;
  } else if (lower.includes('cushion')) {
    path = <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />;
  } else if (lower.includes('emerald') || lower.includes('rectangular')) {
    path = <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />;
  } else if (lower.includes('pear')) {
    path = (
      <path
        d="M12 3C9 8 5 13 5 17a7 7 0 0014 0c0-4-4-9-7-14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    );
  } else if (lower.includes('marquise')) {
    path = (
      <path
        d="M12 2C7 7 3 12 3 12s4 5 9 10c5-5 9-10 9-10s-4-5-9-10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    );
  } else if (lower.includes('princess')) {
    path = <rect x="4" y="4" width="16" height="16" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.6" />;
  }

  return (
    <div className={`${className} rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-2xs`}>
      {path ? (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          {path}
        </svg>
      ) : (
        <TbCircleOff className="w-4 h-4 text-stone-400" />
      )}
    </div>
  );
}

export default function GemstoneShapesView() {
  const confirm = useConfirm();
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShape, setEditingShape] = useState(null);
  const [viewingShape, setViewingShape] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [shapeImage, setShapeImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Pagination
  const [pageSize, setPageSize] = useAdminPageSize('gemstone-shapes', 10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all Gemstone Shapes
  const fetchShapes = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/gemstone-shapes?page=${page}&limit=${limit}`);
      const rawData = res.data?.data;
      const dataArr = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      const pagination = res.data?.pagination || rawData?.pagination || {};

      setShapes(dataArr);
      setTotalItems(pagination.totalDocs || pagination.total || dataArr.length);
      setTotalPages(pagination.totalPages || pagination.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load gemstone shapes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShapes(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Client filtering
  const filteredShapes = useMemo(() => {
    return shapes.filter((s) => {
      const q = search.toLowerCase();
      return !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    });
  }, [shapes, search]);

  // Stats
  const totalCount = totalItems || shapes.length;
  const activeCount = useMemo(() => shapes.filter((s) => s.status === 'active').length, [shapes]);
  const facetedCount = useMemo(() => shapes.filter((s) => !s.code?.includes('carved')).length, [shapes]);
  const specialtyCount = useMemo(() => shapes.filter((s) => s.code?.includes('carved')).length, [shapes]);

  const statCardsData = [
    {
      label: 'Total Gemstone Shapes',
      value: totalCount,
      icon: IoSparklesOutline,
      color: 'bronze',
    },
    {
      label: 'Active Shapes',
      value: activeCount,
      icon: HiOutlineEye,
      color: 'green',
    },
    {
      label: 'Faceted Cuts',
      value: facetedCount,
      icon: IoSparklesOutline,
      color: 'purple',
    },
    {
      label: 'Specialty Cuts',
      value: specialtyCount,
      icon: HiOutlineSparkles,
      color: 'peach',
    },
  ];

  // Selection handlers
  const isAllSelected =
    filteredShapes.length > 0 &&
    filteredShapes.every((s) => selectedIds.includes(s._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredShapes.some((s) => s._id === id))
      );
    } else {
      const pageIds = filteredShapes.map((s) => s._id);
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
    if (selectedIds.length === 0) {
      toast.error('Select at least one gemstone shape to delete');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Bulk Delete Gemstone Shapes',
      message: `Are you sure you want to delete ${selectedIds.length} gemstone shape${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/gemstone-shapes/${id}`))
      );
      const successfulIds = selectedIds.filter((_, idx) => results[idx].status === 'fulfilled');
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      if (successfulIds.length > 0) {
        setShapes((prev) => prev.filter((s) => !successfulIds.includes(s._id)));
        setSelectedIds((prev) => prev.filter((id) => !successfulIds.includes(id)));
        toast.success(`${successfulIds.length} gemstone shape${successfulIds.length > 1 ? 's' : ''} deleted`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} item${failedCount > 1 ? 's' : ''}`);
      }
      fetchShapes(currentPage, pageSize);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some gemstone shapes');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingShape(null);
    setName('');
    setCode('');
    setShapeImage(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (s) => {
    setEditingShape(s);
    setName(s.name || '');
    setCode(s.code || '');
    setShapeImage(s.image || null);
    setIsModalOpen(true);
  };

  // Image Upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadWithPresignedUrl(file, 'gemstone-shapes');
      if (res?.url) {
        if (shapeImage?.key) {
          deleteUploadedFile(shapeImage);
        }
        setShapeImage({ url: res.url, key: res.key });
        toast.success('Shape icon uploaded');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload shape icon');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Shape
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter shape name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        code: code.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: shapeImage || null,
      };

      if (editingShape) {
        await api.put(`/gemstone-shapes/${editingShape._id}`, payload);
        toast.success('Gemstone shape updated successfully');
      } else {
        await api.post('/gemstone-shapes', payload);
        toast.success('Gemstone shape created successfully');
      }

      setIsModalOpen(false);
      fetchShapes(currentPage, pageSize);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving gemstone shape');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/gemstone-shapes/${item._id}`, { status: nextStatus });
      setShapes((prev) =>
        prev.map((s) => (s._id === item._id ? { ...s, status: nextStatus } : s))
      );
      toast.success(`Shape set to ${nextStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Delete Shape
  const handleDelete = async (id, itemName) => {
    const targetItem = shapes.find((s) => s._id === id);
    const confirmed = await confirm({
      title: 'Delete Gemstone Shape',
      message: `Are you sure you want to delete gemstone shape "${itemName || 'this shape'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/gemstone-shapes/${id}`);
      if (targetItem?.image) {
        deleteUploadedFile(targetItem.image);
      }
      toast.success(`Gemstone shape "${itemName || ''}" deleted`);
      fetchShapes(currentPage, pageSize);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete gemstone shape');
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Module Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Gemstone Config', 'Gemstone Shapes']}
        title="Gemstone Shapes"
        subtitle="Manage gemstone cuts, geometric silhouettes, line-art icons, and codes."
        onAdd={handleOpenAdd}
        addLabel="Add Gemstone Shape"
        exportData={shapes}
        exportFileName="gemstone_shapes_export"
      />

      {/* ─── 4 Stats Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Bulk Delete Bar ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search shape name or code..."
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
                ? `Delete ${selectedIds.length} selected shape${selectedIds.length > 1 ? 's' : ''}`
                : 'Select gemstone shapes to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Gemstone Shapes Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">ICON</th>
                <th className="py-2 px-3 whitespace-nowrap">SHAPE NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">CODE / SLUG</th>
                <th className="py-2 px-3 text-center whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">STATUS</th>
                <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    <CuteLoader />
                  </td>
                </tr>
              ) : filteredShapes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    No gemstone shapes found. Click &quot;Add Gemstone Shape&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredShapes.map((s, idx) => {
                  const isActive = s.status === 'active';
                  const formattedDate = s.meta?.createdAt
                    ? new Date(s.meta.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '16/11/2026';

                  return (
                    <tr
                      key={s._id}
                      onClick={() => handleOpenEdit(s)}
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

                      {/* Icon */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <VisualShapeBadge name={s.name} imageUrl={s.image?.url} />
                      </td>

                      {/* Shape Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-900 text-xs">
                        {s.name}
                      </td>

                      {/* Code / Slug */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-stone-500">
                        {s.code || s.name.toLowerCase()}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => handleToggleStatus(s)}
                            style={isActive ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              isActive ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'
                            }`}
                            title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          record={s}
                          onView={() => setViewingShape(s)}
                          onEdit={() => handleOpenEdit(s)}
                          onDelete={() => handleDelete(s._id, s.name)}
                          viewTitle="View Shape"
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
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="gemstone shapes"
        />
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {isModalOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#855836]/10 flex items-center justify-center text-[#855836]">
                    <IoSparklesOutline className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      {editingShape ? 'Edit Gemstone Shape' : 'Add Gemstone Shape'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Configure cut geometry, silhouette vector, or upload icon.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                >
                  <HiOutlineX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Shape Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingShape) {
                        setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    placeholder="e.g. Heart, Cushion Rectangular, Emerald Cut..."
                    className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#855836]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Code / Slug</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. heart, cushion-rectangular"
                    className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-mono text-stone-600 focus:outline-none focus:border-[#855836]"
                  />
                </div>

                {/* Visual Icon Preview & Upload */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">Shape Icon</label>
                  <div className="flex items-center gap-3">
                    <VisualShapeBadge name={name} imageUrl={shapeImage?.url} className="w-12 h-12" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <HiOutlineCloudUpload className="h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Custom SVG / PNG'}
                      </button>
                      {shapeImage && (
                        <button
                          type="button"
                          onClick={() => {
                            if (shapeImage) deleteUploadedFile(shapeImage);
                            setShapeImage(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: 'var(--theme-primary, #855836)' }}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingShape ? 'Update Shape' : 'Create Shape'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── View Modal ─── */}
      {viewingShape &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setViewingShape(null)}
          >
            <div
              className="relative w-full max-w-xs rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl text-center space-y-4 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <VisualShapeBadge name={viewingShape.name} imageUrl={viewingShape.image?.url} className="w-16 h-16" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">{viewingShape.name}</h3>
                <span className="font-mono text-xs text-stone-400">{viewingShape.code}</span>
              </div>
              <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3.5 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-400">Status:</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">{viewingShape.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Created:</span>
                  <span className="text-stone-600 font-medium">
                    {viewingShape.meta?.createdAt
                      ? new Date(viewingShape.meta.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingShape(null)}
                className="w-full py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
