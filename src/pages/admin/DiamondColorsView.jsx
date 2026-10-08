import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

/**
 * Visual Color Badge matching User Screenshot 1
 * Renders an uploaded color representation/swatch or a subtle diamond gem silhouette
 */
function VisualColorBadge({ name = '', imageUrl, className = 'w-12 h-12' }) {
  if (imageUrl && !imageUrl.includes('example.com')) {
    return (
      <div className={`${className} rounded-2xl bg-stone-50 border border-stone-200/80 p-1.5 flex items-center justify-center overflow-hidden shadow-2xs`}>
        <img
          src={imageUrl}
          alt={name || 'Color representation'}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-2xl bg-[#fafafc] border border-stone-200/80 flex items-center justify-center select-none shadow-2xs text-stone-300`}
      title={name || 'Diamond Color Grade'}
    >
      <IoDiamondOutline className="w-5 h-5 text-stone-300/80" />
    </div>
  );
}

export default function DiamondColorsView() {
  const confirm = useConfirm();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [viewingColor, setViewingColor] = useState(null);
  const [colorName, setColorName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch all Diamond Colors from API
  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diamond-colors?limit=100');
      const items =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setColors(items);
    } catch (err) {
      console.error('Failed to load diamond colors:', err);
      toast.error('Failed to load diamond colors');
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
    return colors.filter((c) => c.name && c.name.toLowerCase().includes(q));
  }, [colors, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredColors, 10);

  // Open modal to add new color
  const handleOpenAdd = () => {
    setEditingColor(null);
    setColorName('');
    setIconUrl('');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open modal to edit existing color
  const handleOpenEdit = (c) => {
    setEditingColor(c);
    setColorName(c.name || '');
    setIconUrl(c.image?.url || '');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Upload Icon via Cloudflare Presigned URL
  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { fileUrl } = await uploadWithPresignedUrl(file, 'diamond-colors');
      setIconUrl(fileUrl);
      toast.success('Representation uploaded successfully');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload representation');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (colorItem) => {
    try {
      const nextStatus = colorItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/diamond-colors/${colorItem._id}`, { status: nextStatus });
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

  // Delete Diamond Color
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Diamond Color',
      message: `Are you sure you want to delete diamond color "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Color',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/diamond-colors/${id}`);
      toast.success(`Diamond color "${name}" deleted`);
      setColors((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!colorName.trim()) {
      toast.error('Please enter a color grade name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: colorName.trim(),
        status: 'active',
      };
      if (iconUrl) {
        payload.image = { url: iconUrl };
      }

      if (editingColor?._id) {
        await api.put(`/diamond-colors/${editingColor._id}`, payload);
        toast.success(`Color grade "${payload.name}" updated successfully`);
      } else {
        await api.post('/diamond-colors', payload);
        toast.success(`Color grade "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchColors();
    } catch (err) {
      console.error('Error saving diamond color:', err);
      toast.error(err.response?.data?.message || 'Failed to save diamond color');
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
            Diamond Color
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Configure diamond color grades for your inventory catalog.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD NEW COLOR</span>
        </button>
      </div>

      {/* ─── Diamond Color Table Card ─── */}
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
            placeholder="Search color grades..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6 whitespace-nowrap">VISUAL</th>
                <th className="py-4 px-6 whitespace-nowrap">COLOR GRADE</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">STATUS</th>
                <th className="py-4 px-6 whitespace-nowrap">CREATED DATE</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    Loading color grades...
                  </td>
                </tr>
              ) : filteredColors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    No color grades found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c, index) => {
                  const isActive = c.status === 'active';
                  // In Screenshot 1, row 1 "E-F" is rendered in warm gold/brown
                  const isGoldColor = c.name === 'E-F' || index === 0;

                  const formattedDate = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '15/07/2026';

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Visual */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <VisualColorBadge
                          name={c.name}
                          imageUrl={c.image?.url}
                          className="w-12 h-12"
                        />
                      </td>

                      {/* Color Grade Name */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs">
                        <span
                          className={`font-bold tracking-wide uppercase ${
                            isGoldColor ? 'text-[#8f6d43]' : 'text-stone-900'
                          }`}
                        >
                          {c.name}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`w-11 h-6 rounded-full transition-colors relative inline-block cursor-pointer focus:outline-none ${
                            isActive ? 'bg-[#8f6d43]' : 'bg-stone-300'
                          }`}
                          title={`Status: ${isActive ? 'Active' : 'Inactive'}`}
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
                            onClick={() => setViewingColor(c)}
                            title="View Color Details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Color"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id, c.name)}
                            title="Delete Color"
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
                  {editingColor ? 'Edit Color' : 'Add Color'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8f6d43] block mt-0.5">
                  DIAMOND MASTER CONFIG
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
              {/* Click to Upload Representation Box (Matches Screenshot 2) */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleIconUpload}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                />

                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center cursor-pointer group hover:border-[#8f6d43] hover:bg-[#faf7f3] transition-all relative overflow-hidden"
                >
                  {isUploading ? (
                    <div className="w-6 h-6 rounded-full border-2 border-stone-200 border-t-[#8f6d43] animate-spin" />
                  ) : iconUrl ? (
                    <img
                      src={iconUrl}
                      alt="Uploaded representation"
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <HiOutlinePlus className="w-5 h-5 text-stone-300 group-hover:text-[#8f6d43] transition-colors stroke-1" />
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {isUploading ? 'UPLOADING...' : 'CLICK TO UPLOAD REPRESENTATION'}
                </span>
              </div>

              {/* Color Grade Name (Matches Screenshot 2) */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  COLOR GRADE NAME
                </label>
                <input
                  type="text"
                  required
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="e.g. D , E , F or Fancy Blue"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-lg border border-[#8f6d43]/60 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
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
                  disabled={submitting || isUploading}
                  className="w-1/2 h-11 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingColor ? 'Save Changes' : 'Create'}
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
              <h3 className="font-bold text-stone-900 text-base">Diamond Color Info</h3>
              <button
                onClick={() => setViewingColor(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <VisualColorBadge
                name={viewingColor.name}
                imageUrl={viewingColor.image?.url}
                className="w-20 h-16"
              />
              <div>
                <h4 className="font-bold text-stone-900 text-base uppercase tracking-wider">{viewingColor.name}</h4>
                <p className="text-xs text-stone-400 mt-0.5">
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
