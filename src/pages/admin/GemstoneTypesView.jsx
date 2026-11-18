import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineCloudUpload,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Dropdown from '../../components/common/Dropdown';
import CuteLoader from '../../components/common/CuteLoader';
import { useAdminPageSize } from '../../utils/adminPagination';

/**
 * Gemstone Swatch Badge
 * Renders an authentic mineral gradient or image swatch
 */
function GemstoneSwatch({ startColor = '#8A4F7D', endColor = '#682860', imageUrl, className = 'w-7 h-7' }) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = getMediaUrl(imageUrl);

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt="gemstone swatch"
        className={`${className} object-cover rounded-full border border-stone-200/80 shadow-2xs`}
        onError={() => setImgError(true)}
      />
    );
  }

  const isGradient = startColor && endColor && startColor.toLowerCase() !== endColor.toLowerCase();
  const backgroundStyle = isGradient
    ? { background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)` }
    : { backgroundColor: startColor || endColor || '#8A4F7D' };

  return (
    <div
      style={backgroundStyle}
      className={`${className} rounded-full border border-stone-200/80 shadow-2xs flex-shrink-0 transition-transform hover:scale-105`}
      title={`${startColor} / ${endColor}`}
    />
  );
}

const BIRTHSTONE_MONTHS = [
  'None',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const BIRTHSTONE_OPTIONS = BIRTHSTONE_MONTHS.map((m) => ({
  value: m,
  label: m === 'None' ? 'None (Not a birthstone)' : m,
}));

export default function GemstoneTypesView() {
  const confirm = useConfirm();
  const [gemstones, setGemstones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGemstone, setEditingGemstone] = useState(null);
  const [viewingGemstone, setViewingGemstone] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [startColor, setStartColor] = useState('#8A4F7D');
  const [endColor, setEndColor] = useState('#682860');
  const [birthstoneMonth, setBirthstoneMonth] = useState('None');
  const [description, setDescription] = useState('');
  const [swatchImage, setSwatchImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Pagination
  const [pageSize, setPageSize] = useAdminPageSize('gemstone-types', 10);
  const [totalItems, setTotalItems] = useState(0);
  const [, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all Gemstone Types
  const fetchGemstones = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/gemstone-types?page=${page}&limit=${limit}`);
      const rawData = res.data?.data;
      const dataArr = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      const pagination = res.data?.pagination || rawData?.pagination || {};

      setGemstones(dataArr);
      setTotalItems(pagination.totalDocs || pagination.total || dataArr.length);
      setTotalPages(pagination.totalPages || pagination.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load gemstone types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGemstones(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Client filtering
  const filteredGemstones = useMemo(() => {
    return gemstones.filter((g) => {
      const q = search.toLowerCase();
      return (
        !q ||
        g.name?.toLowerCase().includes(q) ||
        g.colorCode?.toLowerCase().includes(q) ||
        g.birthstoneMonth?.toLowerCase().includes(q)
      );
    });
  }, [gemstones, search]);

  // Stat calculations
  const totalCount = totalItems || gemstones.length;
  const activeCount = useMemo(() => gemstones.filter((g) => g.status === 'active').length, [gemstones]);
  const birthstoneCount = useMemo(
    () => gemstones.filter((g) => g.birthstoneMonth && g.birthstoneMonth !== 'None').length,
    [gemstones]
  );
  const inactiveCount = useMemo(() => gemstones.filter((g) => g.status === 'inactive').length, [gemstones]);

  const statCardsData = [
    {
      label: 'Total Gemstones',
      value: totalCount,
      icon: IoSparklesOutline,
      color: 'bronze',
    },
    {
      label: 'Active in Catalog',
      value: activeCount,
      icon: HiOutlineEye,
      color: 'green',
    },
    {
      label: 'Birthstones',
      value: birthstoneCount,
      icon: HiOutlineSparkles,
      color: 'purple',
    },
    {
      label: 'Inactive',
      value: inactiveCount,
      icon: IoSparklesOutline,
      color: 'peach',
    },
  ];

  // Selection handlers
  const isAllSelected =
    filteredGemstones.length > 0 &&
    filteredGemstones.every((g) => selectedIds.includes(g._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredGemstones.some((g) => g._id === id))
      );
    } else {
      const pageIds = filteredGemstones.map((g) => g._id);
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
      toast.error('Select at least one gemstone type to delete');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Bulk Delete Gemstone Types',
      message: `Are you sure you want to delete ${selectedIds.length} gemstone type${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/gemstone-types/${id}`))
      );
      const successfulIds = selectedIds.filter((_, idx) => results[idx].status === 'fulfilled');
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      if (successfulIds.length > 0) {
        setGemstones((prev) => prev.filter((g) => !successfulIds.includes(g._id)));
        setSelectedIds((prev) => prev.filter((id) => !successfulIds.includes(id)));
        toast.success(`${successfulIds.length} gemstone type${successfulIds.length > 1 ? 's' : ''} deleted`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} item${failedCount > 1 ? 's' : ''}`);
      }
      fetchGemstones(currentPage, pageSize);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some gemstone types');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingGemstone(null);
    setName('');
    setStartColor('#8A4F7D');
    setEndColor('#682860');
    setBirthstoneMonth('None');
    setDescription('');
    setSwatchImage(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (g) => {
    setEditingGemstone(g);
    setName(g.name || '');
    setStartColor(g.colorCode || '#8A4F7D');
    setEndColor(g.colorCodeEnd || g.colorCode || '#682860');
    setBirthstoneMonth(g.birthstoneMonth || 'None');
    setDescription(g.description || '');
    setSwatchImage(g.swatchImage || g.image || null);
    setIsModalOpen(true);
  };

  // Image upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadWithPresignedUrl(file, 'gemstone-types');
      if (res?.url) {
        setSwatchImage({ url: res.url, key: res.key });
        toast.success('Swatch image uploaded');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter gemstone name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        colorCode: startColor.trim(),
        colorCodeEnd: endColor.trim(),
        birthstoneMonth: birthstoneMonth === 'None' ? '' : birthstoneMonth,
        description: description.trim(),
        ...(swatchImage ? { swatchImage, image: swatchImage } : {}),
      };

      if (editingGemstone) {
        await api.put(`/gemstone-types/${editingGemstone._id}`, payload);
        toast.success('Gemstone type updated successfully');
      } else {
        await api.post('/gemstone-types', payload);
        toast.success('Gemstone type created successfully');
      }

      setIsModalOpen(false);
      fetchGemstones(currentPage, pageSize);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving gemstone type');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/gemstone-types/${item._id}`, { status: nextStatus });
      setGemstones((prev) =>
        prev.map((g) => (g._id === item._id ? { ...g, status: nextStatus } : g))
      );
      toast.success(`Gemstone set to ${nextStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Handle Delete
  const handleDelete = async (id, itemName) => {
    const confirmed = await confirm({
      title: 'Delete Gemstone Type',
      message: `Are you sure you want to delete gemstone type "${itemName || 'this gemstone'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/gemstone-types/${id}`);
      toast.success(`Gemstone type "${itemName || ''}" deleted`);
      fetchGemstones(currentPage, pageSize);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete gemstone type');
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Gemstone Config', 'Gemstone Types']}
        title="Gemstone Types"
        subtitle="Manage gemstones, color gradient swatches, birthstones, and catalog availability."
        onAdd={handleOpenAdd}
        addLabel="Add Gemstone Type"
        exportData={gemstones}
        exportFileName="gemstone_types_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Bulk Delete Bar ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search gemstone, color, month..."
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
                ? `Delete ${selectedIds.length} selected gemstone type${selectedIds.length > 1 ? 's' : ''}`
                : 'Select gemstone types to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Gemstone Types Table Card ─── */}
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
                <th className="py-2 px-3 whitespace-nowrap">SWATCH</th>
                <th className="py-2 px-3 whitespace-nowrap">GEMSTONE NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">BIRTHSTONE</th>
                <th className="py-2 px-3 whitespace-nowrap">COLOR PALETTE</th>
                <th className="py-2 px-3 text-center whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">STATUS</th>
                <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-stone-400">
                    <CuteLoader />
                  </td>
                </tr>
              ) : filteredGemstones.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-stone-400">
                    No gemstone types found. Click &quot;Add Gemstone Type&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredGemstones.map((g, idx) => {
                  const isActive = g.status === 'active';
                  const formattedDate = g.meta?.createdAt
                    ? new Date(g.meta.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '16/11/2026';

                  return (
                    <tr
                      key={g._id}
                      onClick={() => handleOpenEdit(g)}
                      className={`transition-colors cursor-pointer group ${
                        selectedIds.includes(g._id) ? 'bg-[#fcfaf7]' : 'hover:bg-[#faf7f2]'
                      }`}
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(g._id)}
                          onChange={() => handleSelectItem(g._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Swatch */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <GemstoneSwatch
                          startColor={g.colorCode}
                          endColor={g.colorCodeEnd}
                          imageUrl={g.swatchImage?.url || g.image?.url}
                        />
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-900 text-xs">
                        <div>
                          <span>{g.name}</span>
                          {g.slug && <span className="block text-[10px] font-normal text-stone-400">{g.slug}</span>}
                        </div>
                      </td>

                      {/* Birthstone */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {g.birthstoneMonth ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                            <IoSparklesOutline className="h-2.5 w-2.5 text-amber-500" />
                            {g.birthstoneMonth}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      {/* Color Palette */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-stone-600">
                        {g.colorCode || '#8A4F7D'}
                        {g.colorCodeEnd && g.colorCodeEnd !== g.colorCode ? ` / ${g.colorCodeEnd}` : ''}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => handleToggleStatus(g)}
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
                          record={g}
                          onView={() => setViewingGemstone(g)}
                          onEdit={() => handleOpenEdit(g)}
                          onDelete={() => handleDelete(g._id, g.name)}
                          viewTitle="View Gemstone"
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
          itemLabel="gemstone types"
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
              className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#855836]/10 flex items-center justify-center text-[#855836]">
                    <IoSparklesOutline className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      {editingGemstone ? 'Edit Gemstone Type' : 'Add Gemstone Type'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Configure color gradient swatches and birthstone month.
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
                {/* Gemstone Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Gemstone Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amethyst, Natural Ruby, Sapphire..."
                    className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#855836]"
                  />
                </div>

                {/* Color Palette (Dual Swatch) */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">Color Gradient Palette</label>
                  <p className="text-[11px] text-stone-500">
                    Dual colors create a natural mineral crystal depth effect.
                  </p>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex flex-col items-center gap-1">
                      <GemstoneSwatch startColor={startColor} endColor={endColor} className="w-12 h-12" />
                      <span className="text-[10px] text-stone-400 font-semibold">Preview</span>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[11px] text-stone-600 mb-1 font-medium">Primary Hex</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={startColor}
                            onChange={(e) => setStartColor(e.target.value)}
                            className="h-8 w-8 rounded-lg border border-stone-300 p-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={startColor}
                            onChange={(e) => setStartColor(e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-stone-200 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] text-stone-600 mb-1 font-medium">Secondary Hex</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={endColor}
                            onChange={(e) => setEndColor(e.target.value)}
                            className="h-8 w-8 rounded-lg border border-stone-300 p-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={endColor}
                            onChange={(e) => setEndColor(e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-stone-200 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Birthstone Month */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Birthstone Month
                  </label>
                  <Dropdown
                    value={birthstoneMonth || 'None'}
                    onChange={(val) => setBirthstoneMonth(val)}
                    options={BIRTHSTONE_OPTIONS}
                    placeholder="Select Birthstone Month"
                    portal={true}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Rich purple quartz known for peace and spiritual clarity..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#855836]"
                  />
                </div>

                {/* Swatch Image Upload (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Texture / Mineral Swatch Image (Optional)
                  </label>
                  <div className="flex items-center gap-3">
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
                      className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <HiOutlineCloudUpload className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {swatchImage?.url && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        ✓ Image attached
                      </span>
                    )}
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
                    {submitting ? 'Saving...' : editingGemstone ? 'Update Gemstone' : 'Create Gemstone'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── View Modal ─── */}
      {viewingGemstone &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setViewingGemstone(null)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl text-center space-y-4 animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <GemstoneSwatch
                  startColor={viewingGemstone.colorCode}
                  endColor={viewingGemstone.colorCodeEnd}
                  imageUrl={viewingGemstone.swatchImage?.url || viewingGemstone.image?.url}
                  className="w-16 h-16"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">{viewingGemstone.name}</h3>
                {viewingGemstone.slug && (
                  <span className="text-xs text-stone-400 font-mono">{viewingGemstone.slug}</span>
                )}
              </div>
              <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3.5 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-400">Color Palette:</span>
                  <span className="font-mono font-semibold text-stone-800">
                    {viewingGemstone.colorCode} / {viewingGemstone.colorCodeEnd || viewingGemstone.colorCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Birthstone:</span>
                  <span className="font-semibold text-stone-800">{viewingGemstone.birthstoneMonth || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Status:</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">{viewingGemstone.status}</span>
                </div>
              </div>
              {viewingGemstone.description && (
                <p className="text-xs text-stone-500 text-left italic bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  &ldquo;{viewingGemstone.description}&rdquo;
                </p>
              )}
              <button
                type="button"
                onClick={() => setViewingGemstone(null)}
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
