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
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

/**
 * Visual Shape Badge matching User Screenshot 1
 * Renders an uploaded shape icon or an elegant luxury placeholder badge with "DS"
 */
function VisualShapeBadge({ name = '', imageUrl, className = 'w-12 h-12' }) {
  if (imageUrl && !imageUrl.includes('example.com')) {
    return (
      <div className={`${className} rounded-2xl bg-stone-50/90 border border-stone-200/80 p-1.5 flex items-center justify-center overflow-hidden shadow-2xs`}>
        <img
          src={imageUrl}
          alt={name || 'Diamond Shape'}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-2xl bg-[#fafafc] border border-stone-200/80 flex items-center justify-center select-none shadow-2xs`}
      title={name || 'Diamond Shape'}
    >
      <span className="text-stone-300 italic font-serif text-[12px] font-medium tracking-wider">
        DS
      </span>
    </div>
  );
}

export default function DiamondShapesView() {
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShape, setEditingShape] = useState(null);
  const [viewingShape, setViewingShape] = useState(null);
  const [shapeName, setShapeName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch all Diamond Shapes from API
  const fetchShapes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diamond-shapes?limit=100');
      const items =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setShapes(items);
    } catch (err) {
      console.error('Failed to load diamond shapes:', err);
      toast.error('Failed to load diamond shapes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShapes();
  }, []);

  // Search filtering
  const filteredShapes = useMemo(() => {
    if (!search.trim()) return shapes;
    const q = search.toLowerCase();
    return shapes.filter((s) => s.name && s.name.toLowerCase().includes(q));
  }, [shapes, search]);

  // Open modal to add new shape
  const handleOpenAdd = () => {
    setEditingShape(null);
    setShapeName('');
    setIconUrl('');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open modal to edit existing shape
  const handleOpenEdit = (s) => {
    setEditingShape(s);
    setShapeName(s.name || '');
    setIconUrl(s.image?.url || '');
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Upload Icon via Cloudflare Presigned URL
  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { fileUrl } = await uploadWithPresignedUrl(file, 'diamond-shapes');
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
  const handleToggleStatus = async (shapeItem) => {
    try {
      const nextStatus = shapeItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/diamond-shapes/${shapeItem._id}`, { status: nextStatus });
      toast.success(`${shapeItem.name} status set to ${nextStatus}`);
      setShapes((prev) =>
        prev.map((item) =>
          item._id === shapeItem._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Diamond Shape
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete diamond shape "${name}"?`)) return;
    try {
      await api.delete(`/diamond-shapes/${id}`);
      toast.success(`Diamond shape "${name}" deleted`);
      setShapes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shapeName.trim()) {
      toast.error('Please enter a diamond shape name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: shapeName.trim(),
        status: 'active',
      };
      if (iconUrl) {
        payload.image = { url: iconUrl };
      }

      if (editingShape?._id) {
        await api.put(`/diamond-shapes/${editingShape._id}`, payload);
        toast.success(`Diamond shape "${payload.name}" updated successfully`);
      } else {
        await api.post('/diamond-shapes', payload);
        toast.success(`Diamond shape "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchShapes();
    } catch (err) {
      console.error('Error saving diamond shape:', err);
      toast.error(err.response?.data?.message || 'Failed to save diamond shape');
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
            Diamond Shapes
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage cut shapes and visual representations for diamonds.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD DIAMOND SHAPE</span>
        </button>
      </div>

      {/* ─── Diamond Shapes Table Card ─── */}
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
            placeholder="Search diamond shapes..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6 whitespace-nowrap">VISUAL SHAPE</th>
                <th className="py-4 px-6 whitespace-nowrap">SHAPE NAME</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">STATUS</th>
                <th className="py-4 px-6 whitespace-nowrap">CREATED DATE</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    Loading diamond shapes...
                  </td>
                </tr>
              ) : filteredShapes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    No diamond shapes found.
                  </td>
                </tr>
              ) : (
                filteredShapes.map((s) => {
                  const isActive = s.status === 'active';
                  const isRound = s.name?.toUpperCase() === 'ROUND';

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
                      {/* Visual Shape */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <VisualShapeBadge
                          name={s.name}
                          imageUrl={s.image?.url}
                          className="w-12 h-12"
                        />
                      </td>

                      {/* Shape Name (Uppercase matching Screenshot 1) */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs">
                        <span
                          className={`font-bold tracking-wide uppercase ${
                            isRound ? 'text-[#8f6d43]' : 'text-stone-900'
                          }`}
                        >
                          {s.name}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
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
                            onClick={() => setViewingShape(s)}
                            title="View Shape Details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Shape"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id, s.name)}
                            title="Delete Shape"
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
              {filteredShapes.length} SHAPES INDEXED
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
            <span className="w-7 h-7 rounded-full bg-[#8f6d43] text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {page}
            </span>
            <button
              disabled={filteredShapes.length <= limit}
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
                  {editingShape ? 'Edit Shape' : 'Add Shape'}
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
              {/* Click to Upload Icon Box (Matches Screenshot 2) */}
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

              {/* Shape Name (Matches Screenshot 2) */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  SHAPE NAME
                </label>
                <input
                  type="text"
                  required
                  value={shapeName}
                  onChange={(e) => setShapeName(e.target.value)}
                  placeholder="e.g. Emerald, Princess"
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
                  {submitting ? 'Saving...' : editingShape ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Shape Details Modal ─── */}
      {viewingShape && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingShape(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Diamond Shape Info</h3>
              <button
                onClick={() => setViewingShape(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <VisualShapeBadge
                name={viewingShape.name}
                imageUrl={viewingShape.image?.url}
                className="w-20 h-16"
              />
              <div>
                <h4 className="font-bold text-stone-900 text-base uppercase tracking-wider">{viewingShape.name}</h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Status:{' '}
                  <span className="font-semibold text-[#8f6d43] uppercase">
                    {viewingShape.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingShape(null)}
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
