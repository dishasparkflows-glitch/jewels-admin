import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineColorSwatch,
  HiOutlineSparkles,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

/**
 * Metal Swatch Badge matching User Screenshot 1
 * Renders a circular gradient or solid color swatch
 */
function MetalSwatch({ startColor = '#F9E498', endColor = '#B38B34', className = 'w-6 h-6' }) {
  const isGradient = startColor && endColor && startColor.toLowerCase() !== endColor.toLowerCase();
  const backgroundStyle = isGradient
    ? { background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)` }
    : { backgroundColor: startColor || endColor || '#d4af37' };

  return (
    <div
      style={backgroundStyle}
      className={`${className} rounded-full border border-stone-200/80 shadow-2xs flex-shrink-0 transition-transform hover:scale-105`}
      title={`${startColor} / ${endColor}`}
    />
  );
}

export default function MetalColorsView() {
  const confirm = useConfirm();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [viewingColor, setViewingColor] = useState(null);
  const [colorName, setColorName] = useState('');
  const [startColor, setStartColor] = useState('#F9E498');
  const [endColor, setEndColor] = useState('#B38B34');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all Metal Colors from API
  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/metal-colors?limit=100');
      const items =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setColors(items);
    } catch (err) {
      console.error('Failed to load metal colors:', err);
      toast.error('Failed to load metal colors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  // Search filtering
  const filteredColors = useMemo(() => {
    if (!search.trim()) return colors;
    const q = search.toLowerCase();
    return colors.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.colorCode && c.colorCode.toLowerCase().includes(q)) ||
        (c.colorCodeEnd && c.colorCodeEnd.toLowerCase().includes(q))
    );
  }, [colors, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredColors, 10);

  // Quick stat cards
  const activeCount = useMemo(() => colors.filter(c => c.status === 'active').length, [colors]);
  const dualToneCount = useMemo(
    () => colors.filter(c => c.colorCodeEnd && c.colorCodeEnd.toLowerCase() !== c.colorCode?.toLowerCase()).length,
    [colors]
  );

  const statCardsData = [
    {
      label: 'Metal Colors',
      value: colors.length,
      icon: HiOutlineColorSwatch,
      color: 'bronze',
    },
    {
      label: 'Active Finishes',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'green',
    },
    {
      label: 'Dual / Gradient Tones',
      value: dualToneCount,
      icon: HiOutlineColorSwatch,
      color: 'peach',
    },
    {
      label: 'Single Solid Alloys',
      value: Math.max(0, colors.length - dualToneCount),
      icon: HiOutlineColorSwatch,
      color: 'gold',
    },
  ];

  // Open modal to add new color
  const handleOpenAdd = () => {
    setEditingColor(null);
    setColorName('');
    setStartColor('#F9E498');
    setEndColor('#B38B34');
    setIsModalOpen(true);
  };

  // Open modal to edit existing color
  const handleOpenEdit = (c) => {
    setEditingColor(c);
    setColorName(c.name || '');
    setStartColor(c.colorCode || '#F9E498');
    setEndColor(c.colorCodeEnd || c.colorCode || '#B38B34');
    setIsModalOpen(true);
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (colorItem) => {
    try {
      const nextStatus = colorItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/metal-colors/${colorItem._id}`, { status: nextStatus });
      toast.success(`${colorItem.name} status set to ${nextStatus}`);
      setColors((prev) =>
        prev.map((item) =>
          item._id === colorItem._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Metal Color
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Metal Color',
      message: `Are you sure you want to delete metal color "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Color',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/metal-colors/${id}`);
      toast.success(`Metal color "${name}" deleted`);
      setColors((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!colorName.trim()) {
      toast.error('Please enter a color name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: colorName.trim(),
        colorCode: startColor.trim(),
        colorCodeEnd: endColor.trim(),
        status: 'active',
      };

      if (editingColor?._id) {
        await api.put(`/metal-colors/${editingColor._id}`, payload);
        toast.success(`Color "${payload.name}" updated successfully`);
      } else {
        await api.post('/metal-colors', payload);
        toast.success(`Color "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchColors();
    } catch (err) {
      console.error('Error saving metal color:', err);
      toast.error(err.response?.data?.message || 'Failed to save metal color');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Product Config', 'Metal Color']}
        title="Metal Color"
        subtitle="Manage precious metal alloys, rose/yellow/white gold tones and gradient finishes."
        onAdd={handleOpenAdd}
        addLabel="Add Color"
        exportData={colors}
        exportFileName="metal_colors_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search metal colors..."
      />

      {/* ─── Metal Color Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">SWATCH</th>
                <th className="py-2 px-3 whitespace-nowrap">COLOR NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">HEX CODE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    Loading colors...
                  </td>
                </tr>
              ) : filteredColors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    No metal colors found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c, idx) => {
                  const hexCodeDisplay = `${c.colorCode || '#FFFFFF'}${c.colorCodeEnd && c.colorCodeEnd !== c.colorCode ? ` / ${c.colorCodeEnd}` : ''}`;

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-1">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Swatch */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <MetalSwatch
                          startColor={c.colorCode}
                          endColor={c.colorCodeEnd}
                          className="w-7 h-7"
                        />
                      </td>

                      {/* Color Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-900 text-xs tracking-wide">
                        {c.name}
                      </td>

                      {/* Hex Code */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-stone-500">
                        {hexCodeDisplay}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingColor(c)}
                          onEdit={() => handleOpenEdit(c)}
                          onDelete={() => handleDelete(c._id, c.name)}
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
                  {editingColor ? 'Edit Color' : 'Add Color'}
                </h3>
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
              {/* Color Name */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  COLOR NAME
                </label>
                <input
                  type="text"
                  required
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="e.g. Yellow Gold"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Color Gradient Swatches Preview */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  COLOR GRADIENT SWATCHES
                </label>
                <div
                  style={{
                    background: `linear-gradient(to right, ${startColor || '#F9E498'}, ${endColor || '#B38B34'})`,
                  }}
                  className="w-full h-12 rounded-xl shadow-xs border border-stone-200/70 flex items-center justify-center transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-800/80 drop-shadow-2xs select-none">
                    METALLIC SHINE PREVIEW
                  </span>
                </div>
              </div>

              {/* Start & End Color Pickers Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Color */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    START COLOR
                  </label>
                  <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-2.5 py-1.5 bg-white">
                    <input
                      type="color"
                      value={startColor}
                      onChange={(e) => setStartColor(e.target.value.toUpperCase())}
                      className="w-7 h-7 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={startColor}
                      onChange={(e) => setStartColor(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-semibold text-stone-700 uppercase focus:outline-none"
                    />
                  </div>
                </div>

                {/* End Color */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    END COLOR
                  </label>
                  <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-2.5 py-1.5 bg-white">
                    <input
                      type="color"
                      value={endColor}
                      onChange={(e) => setEndColor(e.target.value.toUpperCase())}
                      className="w-7 h-7 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={endColor}
                      onChange={(e) => setEndColor(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-semibold text-stone-700 uppercase focus:outline-none"
                    />
                  </div>
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
                  {submitting ? 'Saving...' : 'Save Color'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Color Details Modal ─── */}
      {viewingColor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingColor(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Metal Color Details</h3>
              <button
                onClick={() => setViewingColor(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <MetalSwatch
                startColor={viewingColor.colorCode}
                endColor={viewingColor.colorCodeEnd}
                className="w-16 h-16"
              />
              <div>
                <h4 className="font-bold text-stone-900 text-base">{viewingColor.name}</h4>
                <p className="text-xs font-mono text-stone-500 mt-1">
                  {viewingColor.colorCode || '#FFFFFF'} / {viewingColor.colorCodeEnd || viewingColor.colorCode || '#FFFFFF'}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Status:{' '}
                  <span className="font-semibold text-[#8f6d43] uppercase">
                    {viewingColor.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingColor(null)}
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
