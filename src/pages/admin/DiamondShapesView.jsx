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
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineTag,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

/**
 * Visual Shape Badge matching User Screenshot 1
 * Renders an uploaded shape icon or an elegant luxury placeholder badge with "DS"
 */
function VisualShapeBadge({ name = '', imageUrl, className = 'w-6 h-6' }) {
  if (imageUrl && !imageUrl.includes('example.com')) {
    return (
      <div className={`${className} rounded-lg bg-stone-50/90 border border-stone-200/80 p-0.5 flex items-center justify-center overflow-hidden shadow-2xs`}>
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
      className={`${className} rounded-lg bg-[#fafafc] border border-stone-200/80 flex items-center justify-center select-none shadow-2xs`}
      title={name || 'Diamond Shape'}
    >
      <span className="text-stone-300 italic font-serif text-[10px] font-medium tracking-wider">
        DS
      </span>
    </div>
  );
}

export default function DiamondShapesView() {
  const confirm = useConfirm();
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredShapes, 10);

  // Quick stat cards
  const activeCount = useMemo(() => shapes.filter(s => s.status === 'active').length, [shapes]);
  const roundShape = useMemo(() => shapes.find(s => s.name?.toUpperCase() === 'ROUND'), [shapes]);

  const statCardsData = [
    {
      label: 'Total Shapes',
      value: shapes.length,
      icon: HiOutlineCube,
      color: 'bronze',
    },
    {
      label: 'Active Shapes',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'green',
    },
    {
      label: 'Primary Cut',
      value: roundShape ? 'Round Brilliant' : 'Princess',
      icon: HiOutlineTag,
      color: 'peach',
    },
    {
      label: 'Custom Geometries',
      value: Math.max(0, shapes.length - 1),
      icon: HiOutlineCube,
      color: 'gold',
    },
  ];

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
    const isConfirmed = await confirm({
      title: 'Delete Diamond Shape',
      message: `Are you sure you want to delete diamond shape "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Shape',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
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
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Diamond Config', 'Diamond Shapes']}
        title="Diamond Shapes"
        subtitle="Manage cut shapes, geometric silhouettes and visual representations for diamonds."
        onAdd={handleOpenAdd}
        addLabel="Add Shape"
        exportData={shapes}
        exportFileName="diamond_shapes_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search diamond shapes..."
      />

      {/* ─── Diamond Shapes Table Card ─── */}
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
                <th className="py-2 px-3 whitespace-nowrap">VISUAL SHAPE</th>
                <th className="py-2 px-3 whitespace-nowrap">SHAPE NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    Loading diamond shapes...
                  </td>
                </tr>
              ) : filteredShapes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    No diamond shapes found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((s, idx) => {
                  const isRound = s.name?.toUpperCase() === 'ROUND';
                  const formattedDate = s.meta?.createdAt
                    ? new Date(s.meta.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '15 Jul 2026';

                  return (
                    <tr
                      key={s._id}
                      onClick={() => setViewingShape(s)}
                      className="hover:bg-[#faf7f2] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Visual Shape */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <VisualShapeBadge
                          name={s.name}
                          imageUrl={s.image?.url}
                          className="w-7 h-7"
                        />
                      </td>

                      {/* Shape Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-xs font-bold uppercase text-stone-900">
                        <span className={isRound ? 'text-[#8b6f4e]' : ''}>
                          {s.name}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingShape(s)}
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

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const current = viewingShape;
                  setViewingShape(null);
                  handleOpenEdit(current);
                }}
                className="flex-1 h-10 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Edit Shape
              </button>
              <button
                onClick={() => setViewingShape(null)}
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
