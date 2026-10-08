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
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

/**
 * Geometric Faceted Diamond Icon matching User Screenshot 2
 * Renders an octagonal faceted diamond medallion with the centered letter (e.g. N or L)
 */
function DiamondFacetIcon({ letter = 'D', imageUrl, className = 'w-10 h-10' }) {
  if (imageUrl && !imageUrl.includes('example.com')) {
    return (
      <img
        src={imageUrl}
        alt="diamond type icon"
        className={`${className} object-contain rounded-xl`}
      />
    );
  }

  const initial = (letter || 'D').charAt(0).toUpperCase();

  return (
    <div className={`${className} flex items-center justify-center text-stone-900 select-none`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        {/* Outer regular octagon */}
        <polygon
          points="30,6 70,6 94,30 94,70 70,94 30,94 6,70 6,30"
          strokeWidth="2.5"
          className="stroke-stone-900"
        />
        {/* Internal geometric facet grid */}
        <line x1="30" y1="6" x2="30" y2="94" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="70" y1="6" x2="70" y2="94" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="6" y1="30" x2="94" y2="30" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="6" y1="70" x2="94" y2="70" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="30" y1="6" x2="70" y2="94" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="70" y1="6" x2="30" y2="94" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="6" y1="30" x2="94" y2="70" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="6" y1="70" x2="94" y2="30" strokeWidth="1" strokeOpacity="0.4" />

        {/* Center circle */}
        <circle cx="50" cy="50" r="17" fill="white" stroke="currentColor" strokeWidth="1.8" />

        {/* Centered letter */}
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fontSize="20"
          fontFamily="serif"
          fontWeight="bold"
          fill="currentColor"
          stroke="none"
        >
          {initial}
        </text>
      </svg>
    </div>
  );
}

export default function DiamondTypesView() {
  const confirm = useConfirm();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [viewingType, setViewingType] = useState(null);
  const [typeName, setTypeName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch all Diamond Types from API
  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diamond-types?limit=100');
      const items =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setTypes(items);
    } catch (err) {
      console.error('Failed to load diamond types:', err);
      toast.error('Failed to load diamond types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Search filtering
  const filteredTypes = useMemo(() => {
    if (!search.trim()) return types;
    const q = search.toLowerCase();
    return types.filter((t) => t.name && t.name.toLowerCase().includes(q));
  }, [types, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredTypes, 10);

  // Open modal to add new type
  const handleOpenAdd = () => {
    setEditingType(null);
    setTypeName('');
    setIconUrl('');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open modal to edit existing type
  const handleOpenEdit = (t) => {
    setEditingType(t);
    setTypeName(t.name || '');
    setIconUrl(t.image?.url || '');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Upload Icon via Cloudflare Presigned URL
  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { fileUrl } = await uploadWithPresignedUrl(file, 'diamond-types');
      setIconUrl(fileUrl);
      toast.success('Icon uploaded successfully');
    } catch (err) {
      console.error('Icon upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload icon');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (typeItem) => {
    try {
      const nextStatus = typeItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/diamond-types/${typeItem._id}`, { status: nextStatus });
      toast.success(`${typeItem.name} status set to ${nextStatus}`);
      setTypes((prev) =>
        prev.map((item) =>
          item._id === typeItem._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Diamond Type
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Diamond Type',
      message: `Are you sure you want to delete diamond type "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Type',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/diamond-types/${id}`);
      toast.success(`Diamond type "${name}" deleted`);
      setTypes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) {
      toast.error('Please enter a diamond type name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: typeName.trim(),
        status: 'active',
      };
      if (iconUrl) {
        payload.image = { url: iconUrl };
      }

      if (editingType?._id) {
        await api.put(`/diamond-types/${editingType._id}`, payload);
        toast.success(`Diamond type "${payload.name}" updated successfully`);
      } else {
        await api.post('/diamond-types', payload);
        toast.success(`Diamond type "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchTypes();
    } catch (err) {
      console.error('Error saving diamond type:', err);
      toast.error(err.response?.data?.message || 'Failed to save diamond type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Top Header (Matches Screenshot 2 - Zero Sync Button) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Diamond Types
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Configure different sources and types of diamonds for your catalog.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD DIAMOND TYPE</span>
        </button>
      </div>

      {/* ─── Diamond Types Table Card ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 space-y-4">
        {/* Table Search (Full width inside card matching Screenshot 2) */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <HiOutlineSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diamond types..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6 whitespace-nowrap">ICON</th>
                <th className="py-4 px-6 whitespace-nowrap">DIAMOND TYPE</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">STATUS</th>
                <th className="py-4 px-6 whitespace-nowrap">CREATED DATE</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    Loading diamond types...
                  </td>
                </tr>
              ) : filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    No diamond types found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((t) => {
                  const isActive = t.status === 'active';
                  const letter = t.name?.startsWith('Lab') ? 'L' : 'N';

                  const formattedDate = t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '17/03/2026';

                  return (
                    <tr
                      key={t._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Icon */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <DiamondFacetIcon
                          letter={letter}
                          imageUrl={t.image?.url}
                          className="w-10 h-10"
                        />
                      </td>

                      {/* Diamond Type Name */}
                      <td className="py-4 px-6 whitespace-nowrap font-bold text-stone-900 text-xs">
                        {t.name}
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t)}
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
                            onClick={() => setViewingType(t)}
                            title="View Type Details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Type"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t._id, t.name)}
                            title="Delete Type"
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

      {/* ─── Add / Edit Modal (Matches Screenshot 1 Exactly) ─── */}
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
                  {editingType ? 'Edit Type' : 'Add Type'}
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
              {/* Click to Upload Icon Box (Matches Screenshot 1) */}
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
                      alt="Uploaded icon"
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <HiOutlinePlus className="w-5 h-5 text-stone-300 group-hover:text-[#8f6d43] transition-colors stroke-1" />
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {isUploading ? 'UPLOADING...' : 'CLICK TO UPLOAD ICON'}
                </span>
              </div>

              {/* Type Name (Matches Screenshot 1) */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  TYPE NAME
                </label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Lab Grown Diamond"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-lg border border-[#8f6d43]/60 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Modal Footer Actions (Matches Screenshot 1) */}
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
                  {submitting ? 'Saving...' : editingType ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Type Details Modal ─── */}
      {viewingType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingType(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Diamond Type Info</h3>
              <button
                onClick={() => setViewingType(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <DiamondFacetIcon
                letter={viewingType.name?.startsWith('Lab') ? 'L' : 'N'}
                imageUrl={viewingType.image?.url}
                className="w-16 h-16"
              />
              <div>
                <h4 className="font-bold text-stone-900 text-base">{viewingType.name}</h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Status:{' '}
                  <span className="font-semibold text-[#8f6d43] uppercase">
                    {viewingType.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingType(null)}
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
