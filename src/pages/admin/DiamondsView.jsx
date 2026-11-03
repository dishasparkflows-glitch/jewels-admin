import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineCloudUpload,
  HiOutlinePhotograph,
  HiOutlineCheck,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { diamondsAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import Dropdown from '../../components/common/Dropdown';
import RowActions from '../../components/common/RowActions';
import { useAdminPageSize } from '../../utils/adminPagination';

export default function DiamondsView() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [shapeFilter, setShapeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [pagination, setPagination] = useState({ totalPages: 1, totalDocs: 0, limit: 10 });

  // Lookup options for filtering & editing
  const [types, setTypes] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [colors, setColors] = useState([]);
  const [clarities, setClarities] = useState([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDiamond, setEditingDiamond] = useState(null);
  const [editSku, setEditSku] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTypeId, setEditTypeId] = useState('');
  const [editShapeId, setEditShapeId] = useState('');
  const [editColorId, setEditColorId] = useState('');
  const [editClarityId, setEditClarityId] = useState('');
  const [editCarat, setEditCarat] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
      };
      if (typeFilter !== 'all') params.typeId = typeFilter;
      if (shapeFilter !== 'all') params.shapeId = shapeFilter;

      const res = await diamondsAPI.getAll(params);
      const items = res.data?.data?.items || res.data?.data || [];
      setDiamonds(Array.isArray(items) ? items : []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load diamonds:', err);
      toast.error('Failed to load diamonds list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, typeFilter, shapeFilter]);

  // Fetch filter lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/diamonds/attributes');
        const data = res.data?.data || {};
        if (data.types) setTypes(data.types);
        if (data.shapes) setShapes(data.shapes);
        if (data.colors) setColors(data.colors);
        if (data.clarities) setClarities(data.clarities);
      } catch (e) {
        // Fallback
      }
    };
    fetchLookups();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: 'Delete Diamond',
      message: `Are you sure you want to delete SKU "${item.sku}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await diamondsAPI.delete(item._id);
      toast.success('Diamond removed from stock');
      setDiamonds((prev) => prev.filter((d) => d._id !== item._id));
    } catch (err) {
      console.error('Failed to delete diamond:', err);
      toast.error('Failed to delete diamond');
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      setDiamonds((prev) =>
        prev.map((d) => (d._id === item._id ? { ...d, status: nextStatus } : d))
      );
      await diamondsAPI.update(item._id, { status: nextStatus });
      toast.success(`Diamond set to ${nextStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingDiamond(item);
    setEditSku(item.sku || '');
    setEditTitle(item.title || '');
    setEditTypeId(item.typeId?._id || item.typeId || (types[0]?._id || ''));
    setEditShapeId(item.shapeId?._id || item.shapeId || (shapes[0]?._id || ''));
    setEditColorId(item.colorId?._id || item.colorId || (colors[0]?._id || ''));
    setEditClarityId(item.clarityId?._id || item.clarityId || (clarities[0]?._id || ''));
    setEditCarat(item.carat !== undefined ? String(item.carat) : '');
    setEditRate(item.rate !== undefined ? String(item.rate) : '');
    setEditPrice(item.price !== undefined ? String(item.price) : '');
    setEditStatus(item.status || 'active');
    setEditImageUrl(item.image?.url || '');
    setIsEditModalOpen(true);
  };

  const handleCaratChange = (val) => {
    setEditCarat(val);
    const c = parseFloat(val);
    const r = parseFloat(editRate);
    if (!isNaN(c) && !isNaN(r) && c > 0 && r >= 0) {
      setEditPrice(String(Math.round(c * r)));
    }
  };

  const handleRateChange = (val) => {
    setEditRate(val);
    const c = parseFloat(editCarat);
    const r = parseFloat(val);
    if (!isNaN(c) && !isNaN(r) && c > 0 && r >= 0) {
      setEditPrice(String(Math.round(c * r)));
    }
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadWithPresignedUrl(file, 'diamonds');
      if (res?.fileUrl) {
        setEditImageUrl(res.fileUrl);
        toast.success('Diamond image uploaded');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editingDiamond) return;
    if (!editSku.trim()) {
      toast.error('SKU is required');
      return;
    }
    if (!editTitle.trim()) {
      toast.error('Diamond Title is required');
      return;
    }
    const caratNum = parseFloat(editCarat);
    if (isNaN(caratNum) || caratNum <= 0) {
      toast.error('Please enter a valid carat weight');
      return;
    }
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsSavingEdit(true);
      const payload = {
        sku: editSku.trim(),
        title: editTitle.trim(),
        typeId: editTypeId || undefined,
        shapeId: editShapeId || undefined,
        colorId: editColorId || undefined,
        clarityId: editClarityId || undefined,
        carat: caratNum,
        rate: parseFloat(editRate) || 0,
        price: priceNum,
        status: editStatus,
        image: editImageUrl ? { url: editImageUrl } : null,
      };

      const res = await diamondsAPI.update(editingDiamond._id, payload);
      const updatedItem = res.data?.data || res.data || payload;

      setDiamonds((prev) =>
        prev.map((d) => {
          if (d._id === editingDiamond._id) {
            return {
              ...d,
              ...payload,
              typeId: types.find((t) => t._id === editTypeId) || d.typeId,
              shapeId: shapes.find((s) => s._id === editShapeId) || d.shapeId,
              colorId: colors.find((c) => c._id === editColorId) || d.colorId,
              clarityId: clarities.find((cl) => cl._id === editClarityId) || d.clarityId,
              image: payload.image,
              ...(typeof updatedItem === 'object' ? updatedItem : {}),
            };
          }
          return d;
        })
      );

      toast.success('Diamond updated successfully');
      handleCloseEdit();
    } catch (err) {
      console.error('Failed to update diamond:', err);
      toast.error(err.response?.data?.message || 'Failed to update diamond');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingDiamond(null);
  };

  useEffect(() => {
    if (!isEditModalOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isEditModalOpen]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <span>Diamonds Stock</span>
            <span className="px-2.5 py-0.5 text-xs bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d7be] rounded-full font-semibold">
              {pagination.totalDocs || diamonds.length} Total
            </span>
          </h1>
          <p className="text-[13px] text-stone-500 mt-0.5">
            Manage loose diamonds inventory, certification, carat rates, and variant pricing.
          </p>
        </div>

        {/* Add Diamonds Button (Navigates to /diamonds/add) */}
        <button
          type="button"
          onClick={() => navigate('/diamonds/add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8b6f4e] hover:bg-[#785e42] text-white text-[13px] font-semibold rounded-xl transition-all shadow-xs hover:shadow-md active:scale-98 cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Diamonds</span>
        </button>
      </div>

      {/* ─── Search and Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or title..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] transition-colors"
          />
        </form>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Shape filter */}
          <div className="w-36">
            <Dropdown
              value={shapeFilter}
              onChange={(val) => setShapeFilter(val)}
              options={[
                { value: 'all', label: 'All Shapes' },
                ...shapes.map((s) => ({ value: s._id, label: s.name })),
              ]}
              size="sm"
              buttonClassName="bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          {/* Type filter */}
          <div className="w-36">
            <Dropdown
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { value: 'all', label: 'All Types' },
                ...types.map((t) => ({ value: t._id, label: t.name })),
              ]}
              size="sm"
              buttonClassName="bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200/80 cursor-pointer"
            title="Refresh List"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Diamonds List Table ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-3 sm:p-6 pt-3 sm:pt-4 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-stone-400 font-medium">Loading diamond inventory...</p>
            </div>
          ) : diamonds.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <IoDiamondOutline className="w-6 h-6" />
              </div>
              <p className="text-stone-800 font-semibold mb-1">No diamonds found</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="w-14 pb-1 pl-2">IMAGE</th>
                  <th className="pb-1 min-w-[160px]">SKU</th>
                  <th className="pb-1 min-w-[200px]">DIAMOND TITLE</th>
                  <th className="pb-1 w-24 text-center">CARAT</th>
                  <th className="pb-1 w-28 text-center">SHAPE / COLOR</th>
                  <th className="pb-1 min-w-[120px]">PRICE (₹)</th>
                  <th className="pb-1 w-20 text-center">STATUS</th>
                  <th className="pb-1 w-24 text-right pr-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {diamonds.map((item) => (
                  <tr key={item._id} className="group hover:bg-stone-50/60 transition-colors">
                    {/* Image */}
                    <td className="pl-2 align-middle">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center text-stone-400">
                        {item.image?.url ? (
                          <img
                            src={item.image.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IoDiamondOutline className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="align-middle px-2">
                      <span className="font-mono text-xs font-bold text-stone-800">
                        {item.sku}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="align-middle px-2">
                      <span className="text-xs font-medium text-stone-800 block truncate max-w-xs">
                        {item.title}
                      </span>
                      {item.typeId?.name && (
                        <span className="text-[10px] text-stone-400 block font-normal">
                          {item.typeId.name}
                        </span>
                      )}
                    </td>

                    {/* Carat */}
                    <td className="text-center align-middle px-2">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-[#fbf5ed] text-[#8b6f4e] border border-[#e8d7be] rounded-lg">
                        {item.carat} ct
                      </span>
                    </td>

                    {/* Shape / Color */}
                    <td className="text-center align-middle px-2">
                      <span className="text-xs text-stone-700 font-semibold block">
                        {item.shapeId?.name || item.shape || 'FANCY'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {item.colorId?.name || item.color || 'D-E'} • {item.clarityId?.name || item.clarity || 'SI'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="align-middle px-2">
                      <span className="text-xs font-bold text-stone-900 block">
                        ₹ {Number(item.price || 0).toLocaleString()}
                      </span>
                      {item.rate > 0 && (
                        <span className="text-[10px] text-stone-400">
                          @ ₹ {Number(item.rate).toLocaleString()}/ct
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="text-center align-middle px-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.status === 'active'}
                        onClick={() => handleToggleStatus(item)}
                        style={item.status === 'active' ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${item.status === 'active' ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'}`}
                        title={item.status === 'active' ? 'Active' : 'Inactive'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            item.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="text-right align-middle pr-2">
                      <RowActions
                        onEdit={() => handleOpenEdit(item)}
                        onDelete={() => handleDelete(item)}
                        editTitle="Edit Diamond"
                        deleteTitle="Delete Diamond"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalItems={pagination.totalDocs || diamonds.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          itemLabel="diamonds"
        />
      </div>

      {/* ─── Edit Diamond Modal ─── */}
      {isEditModalOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
            onClick={handleCloseEdit}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col cursor-default animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#faf8f5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#ebdcc9] text-[#8b6f4e] flex items-center justify-center shadow-2xs">
                  <IoDiamondOutline className="w-5 h-5 text-[#8b6f4e]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Edit Diamond</span>
                    {editSku && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold border border-stone-200">
                        {editSku}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Update SKU, carat, pricing, and variant attributes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Image & Main Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                {/* Diamond Image Preview / Upload */}
                <div className="sm:col-span-1 flex flex-col items-center">
                  <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5 w-full text-center">
                    DIAMOND IMAGE
                  </label>
                  <div className="relative w-28 h-28 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 overflow-hidden flex items-center justify-center group hover:border-[#8b6f4e]/50 transition-colors">
                    {editImageUrl ? (
                      <>
                        <img
                          src={editImageUrl}
                          alt="Diamond"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditImageUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                          title="Remove image"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center">
                        <IoDiamondOutline className="w-8 h-8 text-stone-300 mb-1" />
                        <span className="text-[10px] text-stone-400 font-medium">No Image</span>
                      </div>
                    )}

                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[10px] font-semibold">Uploading...</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="mt-2 text-xs font-semibold text-[#8b6f4e] hover:text-[#785e42] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineCloudUpload className="w-4 h-4" />
                    <span>{editImageUrl ? 'Change' : 'Upload'} Image</span>
                  </button>
                </div>

                {/* SKU and Title */}
                <div className="sm:col-span-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      placeholder="e.g. RJ-LAB-1.00-FANCY-D-E-SI"
                      className="w-full px-3.5 py-2 text-xs font-mono font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1">
                      DIAMOND TITLE <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. 1.00 Carat Fancy Lab Grown Diamond"
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Attributes Grid (Type, Shape, Color, Clarity) */}
              <div className="pt-2 border-t border-stone-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                  SPECIFICATIONS & ATTRIBUTES
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Diamond Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">TYPE</label>
                    <select
                      value={editTypeId}
                      onChange={(e) => setEditTypeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] transition-colors cursor-pointer text-stone-800"
                    >
                      <option value="">Select Type</option>
                      {types.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Diamond Shape */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">SHAPE</label>
                    <select
                      value={editShapeId}
                      onChange={(e) => setEditShapeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] transition-colors cursor-pointer text-stone-800"
                    >
                      <option value="">Select Shape</option>
                      {shapes.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Diamond Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">COLOR</label>
                    <select
                      value={editColorId}
                      onChange={(e) => setEditColorId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] transition-colors cursor-pointer text-stone-800"
                    >
                      <option value="">Select Color</option>
                      {colors.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Diamond Clarity */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">CLARITY</label>
                    <select
                      value={editClarityId}
                      onChange={(e) => setEditClarityId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] transition-colors cursor-pointer text-stone-800"
                    >
                      <option value="">Select Clarity</option>
                      {clarities.map((cl) => (
                        <option key={cl._id} value={cl._id}>
                          {cl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Carat & Pricing Grid */}
              <div className="pt-2 border-t border-stone-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                  CARAT WEIGHT & PRICING
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Carat Weight */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      CARAT WEIGHT (ct) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editCarat}
                      onChange={(e) => handleCaratChange(e.target.value)}
                      placeholder="e.g. 1.00"
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all text-stone-900"
                    />
                  </div>

                  {/* Rate per Carat */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      RATE PER CARAT (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editRate}
                      onChange={(e) => handleRateChange(e.target.value)}
                      placeholder="e.g. 14553"
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all text-stone-900"
                    />
                  </div>

                  {/* Total Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      TOTAL PRICE (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="e.g. 14553"
                      className="w-full px-3.5 py-2 text-xs font-bold bg-[#faf8f5] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-stone-800">Diamond Status</span>
                  <span className="text-[11px] text-stone-500">
                    {editStatus === 'active'
                      ? 'Active — visible in storefront ring configurator and inventory'
                      : 'Inactive — hidden from customer selections'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editStatus === 'active'}
                    onClick={() => setEditStatus(editStatus === 'active' ? 'inactive' : 'active')}
                    style={editStatus === 'active' ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      editStatus === 'active' ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        editStatus === 'active' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-stone-800 w-14">
                    {editStatus === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{ backgroundColor: 'var(--theme-primary, #855836)' }}
                  className="px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs hover:opacity-90 active:scale-98 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4 h-4 stroke-2" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
