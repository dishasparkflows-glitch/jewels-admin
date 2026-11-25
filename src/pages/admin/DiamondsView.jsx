import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCloudUpload,
  HiOutlineCheck,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { diamondsAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { getMediaUrl } from '../../utils/imageUrl';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { openDiamondPreview } from '../../utils/productPreview';
import Pagination from '../../components/common/Pagination';
import Dropdown from '../../components/common/Dropdown';
import RowActions from '../../components/common/RowActions';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { useAdminPageSize } from '../../utils/adminPagination';

export default function DiamondsView() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { openImagePreview } = useImagePreview();

  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [shapeFilter, setShapeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [pagination, setPagination] = useState({ totalPages: 1, totalDocs: 0, limit: 10 });
  const [selectedIds, setSelectedIds] = useState(new Set());

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
      setSelectedIds(new Set());
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

  // Lazy fetch filter lookups only when needed (e.g. user opens filters or edits a diamond)
  const fetchLookups = async () => {
    if (types.length > 0 && shapes.length > 0) return { types, shapes, colors, clarities };
    try {
      const res = await api.get('/diamonds/attributes');
      const data = res.data?.data || {};
      if (data.diamondTypes) setTypes(data.diamondTypes);
      if (data.diamondShapes) setShapes(data.diamondShapes);
      if (data.diamondColors) setColors(data.diamondColors);
      if (data.diamondClarities) setClarities(data.diamondClarities);
      return data;
    } catch {
      return {};
    }
  };

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete diamond:', err);
      toast.error('Failed to delete diamond');
    }
  };

  const isAllSelected =
    diamonds.length > 0 &&
    diamonds.every((d) => selectedIds.has(d._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(diamonds.map((d) => d._id)));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const isConfirmed = await confirm({
      title: 'Delete Selected Diamonds',
      message: `Are you sure you want to delete ${count} selected diamond${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await api.post('/diamonds/bulk-delete', { ids: idsToDelete });
      setDiamonds((prev) => prev.filter((d) => !selectedIds.has(d._id)));
      setSelectedIds(new Set());
      setPagination((prev) => ({
        ...prev,
        totalDocs: Math.max(0, (prev.totalDocs || diamonds.length) - count),
      }));
      toast.success(`${count} diamond${count > 1 ? 's' : ''} deleted successfully`);
    } catch {
      toast.error('Failed to delete selected diamonds');
    }
  };

  // Demo Metrics Quick Edit Modal state
  const [editingMetricsDiamond, setEditingMetricsDiamond] = useState(null);
  const [metricsSoldCount, setMetricsSoldCount] = useState(0);
  const [metricsReviewCount, setMetricsReviewCount] = useState(0);
  const [savingMetrics, setSavingMetrics] = useState(false);

  const handleOpenMetricsModal = (diamond) => {
    setEditingMetricsDiamond(diamond);
    setMetricsSoldCount(diamond.demoMetrics?.soldCount ?? 0);
    setMetricsReviewCount(diamond.demoMetrics?.reviewCount ?? 0);
  };

  const handleSaveMetrics = async () => {
    if (!editingMetricsDiamond) return;
    try {
      setSavingMetrics(true);
      const diamondId = editingMetricsDiamond._id;
      const payload = {
        demoMetrics: {
          soldCount: Number(metricsSoldCount) || 0,
          reviewCount: Number(metricsReviewCount) || 0,
          rating: 5,
        },
      };
      await diamondsAPI.update(diamondId, payload);
      setDiamonds((prev) =>
        prev.map((item) =>
          item._id === diamondId ? { ...item, ...payload } : item
        )
      );
      toast.success('Demo metrics updated for diamond');
      setEditingMetricsDiamond(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update metrics');
    } finally {
      setSavingMetrics(false);
    }
  };

  // Visibility toggle state
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState(null);

  const handleToggleVisibility = async (diamond, platform, e) => {
    if (e) e.stopPropagation();
    const diamondId = diamond._id;
    if (!diamondId) return;

    const currentWeb = diamond.visibility?.web !== false;
    const currentApp = diamond.visibility?.app !== false;

    const nextWeb = platform === 'web' ? !currentWeb : currentWeb;
    const nextApp = platform === 'app' ? !currentApp : currentApp;

    // Optimistic UI update
    setDiamonds((prev) =>
      prev.map((item) => {
        if (item._id === diamondId) {
          return {
            ...item,
            visibility: {
              ...(item.visibility || {}),
              web: nextWeb,
              app: nextApp,
            },
          };
        }
        return item;
      })
    );

    try {
      setUpdatingVisibilityId(`${diamondId}-${platform}`);
      const payload =
        platform === 'web'
          ? { 'visibility.web': nextWeb }
          : { 'visibility.app': nextApp };

      await diamondsAPI.update(diamondId, payload);
      toast.success(
        `${platform === 'web' ? 'Web' : 'App'} visibility ${
          (platform === 'web' ? nextWeb : nextApp) ? 'enabled' : 'disabled'
        }`
      );
    } catch (err) {
      console.error('Failed to update diamond visibility:', err);
      toast.error(`Failed to update ${platform} visibility`);
      // Revert on error
      setDiamonds((prev) =>
        prev.map((item) => {
          if (item._id === diamondId) {
            return {
              ...item,
              visibility: {
                ...(item.visibility || {}),
                web: currentWeb,
                app: currentApp,
              },
            };
          }
          return item;
        })
      );
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  // Toggle status
  const handleToggleStatus = async (item, e) => {
    if (e) e.stopPropagation();
    try {
      const currentStatus = item.status || 'active';
      const nextStatus = (currentStatus === 'inactive' || currentStatus === 'draft') ? 'active' : 'inactive';
      setDiamonds((prev) =>
        prev.map((d) => (d._id === item._id ? { ...d, status: nextStatus } : d))
      );
      await diamondsAPI.update(item._id, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus === 'active' ? 'Approved' : 'Draft'}`);
    } catch {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  // Open Edit Modal
  const handleOpenEdit = async (item) => {
    const data = await fetchLookups();
    const currTypes = data?.types || types;
    const currShapes = data?.shapes || shapes;
    const currColors = data?.colors || colors;
    const currClarities = data?.clarities || clarities;

    setEditingDiamond(item);
    setEditSku(item.sku || '');
    setEditTitle(item.title || '');
    setEditTypeId(item.typeId?._id || item.typeId || (currTypes[0]?._id || ''));
    setEditShapeId(item.shapeId?._id || item.shapeId || (currShapes[0]?._id || ''));
    setEditColorId(item.colorId?._id || item.colorId || (currColors[0]?._id || ''));
    setEditClarityId(item.clarityId?._id || item.clarityId || (currClarities[0]?._id || ''));
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
    <div className="space-y-4 sm:space-y-6 pb-16 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex flex-wrap items-center gap-2">
            <span>Diamonds Stock</span>
            <span className="px-2.5 py-0.5 text-xs bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d7be] rounded-full font-semibold">
              {pagination.totalDocs || diamonds.length} Total
            </span>
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-500 mt-0.5">
            Manage loose diamonds inventory, certification, carat rates, and variant pricing.
          </p>
        </div>

        {/* Add Diamonds Button (Navigates to /diamonds/add) */}
        <button
          type="button"
          onClick={() => navigate('/diamonds/add')}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-[#8b6f4e] hover:bg-[#785e42] text-white text-[13px] font-semibold rounded-xl transition-all shadow-xs hover:shadow-md active:scale-98 cursor-pointer shrink-0"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Diamonds</span>
        </button>
      </div>

      {/* ─── Search and Filters Bar ─── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md">
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
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Shape filter */}
          <div className="w-full sm:w-36" onMouseDown={fetchLookups} onTouchStart={fetchLookups}>
            <Dropdown
              value={shapeFilter}
              onChange={(val) => setShapeFilter(val)}
              options={[
                { value: 'all', label: 'All Shapes' },
                ...shapes.map((s) => ({ value: s._id, label: s.name })),
              ]}
              size="sm"
              buttonClassName="w-full bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          {/* Type filter */}
          <div className="w-full sm:w-36" onMouseDown={fetchLookups} onTouchStart={fetchLookups}>
            <Dropdown
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { value: 'all', label: 'All Types' },
                ...types.map((t) => ({ value: t._id, label: t.name })),
              ]}
              size="sm"
              buttonClassName="w-full bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          {/* Bulk Delete Button */}
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs whitespace-nowrap ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50 cursor-pointer'
                : 'bg-white text-stone-300 border-stone-200/90 cursor-not-allowed opacity-60'
            }`}
          >
            <HiOutlineTrash className="w-3.5 h-3.5 shrink-0 text-[#ef4444]" />
            <span>Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
          </button>
        </div>
      </div>

      {/* ─── Diamonds List Table & Mobile Cards ─── */}
      <div className="bg-white rounded-xl sm:rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
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
            <>
              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-stone-100">
                <div className="px-3.5 py-2.5 bg-[#eef2f6] border-b border-stone-200/80 flex items-center justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                    />
                    <span>Select All ({diamonds.length})</span>
                  </label>
                  <span>Diamonds</span>
                </div>

                {diamonds.map((item, idx) => {
                  const isSelected = selectedIds.has(item._id);
                  const imageUrl = item.image?.url || (typeof item.image === 'string' ? item.image : '');
                  const thumbUrl = getMediaUrl(imageUrl);
                  const isWebVisible = item.visibility?.web !== false;
                  const isAppVisible = item.visibility?.app !== false;
                  const shapeName = item.shapeId?.name || item.shape || '';
                  const colorName = item.colorId?.name || item.color || '';
                  const clarityName = item.clarityId?.name || item.clarity || '';
                  const typeName = item.typeId?.name || item.type || '';
                  const isInactive = item.status === 'inactive' || item.status === 'draft';

                  return (
                    <div
                      key={`m-${item._id}`}
                      onClick={() => handleOpenEdit(item)}
                      className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/40' : 'hover:bg-[#faf7f2]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="pt-1 flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item._id)}
                            className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                          />
                          <span className="text-[11px] font-bold text-stone-400">
                            #{(page - 1) * pageSize + idx + 1}
                          </span>
                        </div>

                        <div
                          onClick={(e) => {
                            if (thumbUrl) {
                              e.stopPropagation();
                              openImagePreview(thumbUrl, { title: item.title });
                            }
                          }}
                          className="w-11 h-11 rounded-lg bg-[#faf6f0] border border-stone-200/90 overflow-hidden flex items-center justify-center shrink-0"
                        >
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="text-[9px] text-stone-400 font-medium">No Img</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-stone-900 text-xs leading-snug line-clamp-2">
                              {item.title}
                            </p>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(item, e);
                              }}
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                isInactive
                                  ? 'bg-stone-100 text-stone-600 border-stone-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isInactive ? 'Draft' : 'Approved'}
                            </span>
                          </div>
                          {item.sku && (
                            <p className="font-mono text-[10px] text-stone-400 truncate">{item.sku}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.price !== undefined && item.price !== null && (
                          <span className="font-bold text-stone-900 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded text-[11px]">
                            ₹{Number(item.price).toLocaleString('en-IN')}
                          </span>
                        )}
                        {item.carat !== undefined && item.carat !== null && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#fbf5ed] text-[#8b6f4e] border border-[#e8d7be] rounded-lg">
                            {item.carat} ct
                          </span>
                        )}
                        {shapeName && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium uppercase">
                            {shapeName}
                          </span>
                        )}
                        {(colorName || clarityName) && (
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px]">
                            {colorName || 'D-E'} • {clarityName || 'SI'}
                          </span>
                        )}
                        {typeName && (
                          <span className="capitalize px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px]">
                            {typeName}
                          </span>
                        )}
                        {item.rate > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-stone-50 border border-stone-200/60 text-stone-600 text-[10px] font-mono">
                            @ ₹{Number(item.rate).toLocaleString('en-IN')}/ct
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenMetricsModal(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200/90 bg-stone-50/80 text-[10px] font-semibold text-stone-700 cursor-pointer"
                          >
                            <span className="text-amber-500 font-bold">★</span>
                            <span>{item.demoMetrics?.reviewCount ?? 0}</span>
                            <span className="text-stone-300">|</span>
                            <span>🔥</span>
                            <span>{item.demoMetrics?.soldCount ?? 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(item, 'web', e)}
                            disabled={updatingVisibilityId === `${item._id}-web`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${
                              isWebVisible
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-white text-stone-400 border-stone-200'
                            }`}
                          >
                            <span>🌐</span>
                            <span>Web</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(item, 'app', e)}
                            disabled={updatingVisibilityId === `${item._id}-app`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${
                              isAppVisible
                                ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                                : 'bg-white text-stone-400 border-stone-200'
                            }`}
                          >
                            <span>📱</span>
                            <span>App</span>
                          </button>
                        </div>

                        <RowActions
                          onOpenWebsite={() => openDiamondPreview(item)}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item)}
                          editTitle="Edit Diamond"
                          deleteTitle="Delete Diamond"
                          websiteTitle="View on store"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <table className="hidden md:table w-full text-left border-collapse min-w-[880px]">
              <thead>
                <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-1 w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                  <th className="py-3 px-3 whitespace-nowrap">PRODUCT</th>
                  <th className="py-3 px-3 whitespace-nowrap">SPECIFICATIONS</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">DEMO METRICS</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">VISIBILITY</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">STATUS</th>
                  <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {diamonds.map((item, idx) => {
                  const isSelected = selectedIds.has(item._id);
                  const imageUrl = item.image?.url || (typeof item.image === 'string' ? item.image : '');
                  const thumbUrl = getMediaUrl(imageUrl);
                  const isWebVisible = item.visibility?.web !== false;
                  const isAppVisible = item.visibility?.app !== false;
                  const shapeName = item.shapeId?.name || item.shape || '';
                  const colorName = item.colorId?.name || item.color || '';
                  const clarityName = item.clarityId?.name || item.clarity || '';
                  const typeName = item.typeId?.name || item.type || '';
                  const isInactive = item.status === 'inactive' || item.status === 'draft';

                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleOpenEdit(item)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                        />
                      </td>

                      {/* SR NO */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {/* PRODUCT (Thumbnail + Title + SKU) */}
                      <td className="py-2.5 px-3 text-stone-900 text-xs">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => {
                              if (thumbUrl) {
                                e.stopPropagation();
                                openImagePreview(thumbUrl, { title: item.title });
                              }
                            }}
                            className={`w-10 h-10 rounded-lg bg-[#faf6f0] border border-stone-200/90 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#8b6f4e]/40 transition-colors ${
                              thumbUrl ? 'cursor-zoom-in' : ''
                            }`}
                            title={thumbUrl ? 'Click to preview image' : undefined}
                          >
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={item.title}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.innerHTML =
                                      '<span class="text-[9px] text-stone-400 font-medium select-none">No Img</span>';
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-[9px] text-stone-400 font-medium select-none">
                                No Img
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs space-y-0.5">
                            <span
                              className="font-bold text-stone-900 text-xs block leading-tight truncate hover:text-[#8b6f4e] transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            {item.sku && (
                              <span className="font-mono text-[10px] text-stone-400 block truncate">
                                {item.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SPECIFICATIONS */}
                      <td className="py-2.5 px-3 text-stone-600 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.price !== undefined && item.price !== null && (
                            <span className="font-bold text-stone-900 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded text-[11px]">
                              ₹{Number(item.price).toLocaleString('en-IN')}
                            </span>
                          )}
                          {item.carat !== undefined && item.carat !== null && (
                            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-[#fbf5ed] text-[#8b6f4e] border border-[#e8d7be] rounded-lg">
                              {item.carat} ct
                            </span>
                          )}
                          {shapeName && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium uppercase">
                              {shapeName}
                            </span>
                          )}
                          {(colorName || clarityName) && (
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px]">
                              {colorName || 'D-E'} • {clarityName || 'SI'}
                            </span>
                          )}
                          {typeName && (
                            <span className="capitalize px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px]">
                              {typeName}
                            </span>
                          )}
                          {item.rate > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-stone-50 border border-stone-200/60 text-stone-600 text-[10px] font-mono">
                              @ ₹{Number(item.rate).toLocaleString('en-IN')}/ct
                            </span>
                          )}
                        </div>
                      </td>

                      {/* DEMO METRICS */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMetricsModal(item);
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMetricsModal(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200/90 bg-stone-50/80 hover:bg-amber-50 hover:border-amber-200 text-stone-700 hover:text-amber-900 transition-all cursor-pointer shadow-2xs group"
                          title="Click to edit demo metrics (sold & review count)"
                        >
                          <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <span className="text-amber-500 font-bold">★</span>
                            <span>{item.demoMetrics?.reviewCount ?? 0}</span>
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <span>🔥</span>
                            <span>{item.demoMetrics?.soldCount ?? 0}</span>
                          </span>
                        </button>
                      </td>

                      {/* VISIBILITY */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 bg-stone-50/90 p-1 rounded-lg border border-stone-200/80 shadow-2xs">
                          {/* Web Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(item, 'web', e)}
                            disabled={updatingVisibilityId === `${item._id}-web`}
                            title={isWebVisible ? 'Web: Visible (Click to Hide)' : 'Web: Hidden (Click to Show)'}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              isWebVisible
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <span className="text-[10px]">🌐</span>
                            <span>Web</span>
                          </button>

                          {/* App Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(item, 'app', e)}
                            disabled={updatingVisibilityId === `${item._id}-app`}
                            title={isAppVisible ? 'App: Visible (Click to Hide)' : 'App: Hidden (Click to Show)'}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              isAppVisible
                                ? 'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100'
                                : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <span className="text-[10px]">📱</span>
                            <span>App</span>
                          </button>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(item, e);
                        }}
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize transition-all cursor-pointer hover:scale-105 select-none ${
                            isInactive
                              ? 'bg-stone-100 text-stone-600 border-stone-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                          title="Click to toggle status (Draft / Approved)"
                        >
                          {isInactive ? 'Draft' : 'Approved'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          onOpenWebsite={() => openDiamondPreview(item)}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item)}
                          editTitle="Edit Diamond"
                          deleteTitle="Delete Diamond"
                          websiteTitle="View on store"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </>
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
            <div className="flex items-start sm:items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 bg-[#faf8f5]">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#ebdcc9] text-[#8b6f4e] flex items-center justify-center shadow-2xs shrink-0">
                  <IoDiamondOutline className="w-5 h-5 text-[#8b6f4e]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>Edit Diamond</span>
                    {editSku && (
                      <span className="font-mono text-[11px] sm:text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold border border-stone-200 truncate max-w-[160px] sm:max-w-none">
                        {editSku}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    Update SKU, carat, pricing, and variant attributes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {editingDiamond && (
                  <button
                    type="button"
                    onClick={() => openDiamondPreview(editingDiamond)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#8b6f4e] bg-white border border-[#ebdcc9] rounded-xl hover:bg-[#faf5ed] active:scale-95 transition-all shadow-2xs cursor-pointer"
                    title="View on store"
                  >
                    <HiOutlineExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View on Store</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
                  title="Close"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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
                          className="absolute top-1.5 right-1.5 p-1 bg-white/95 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200/60 transition-colors cursor-pointer shadow-xs"
                          title="Remove image"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5 text-red-600 group-hover:text-white" />
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
                    data-upload-trigger="true"
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
                    <Dropdown
                      value={editTypeId}
                      onChange={(val) => setEditTypeId(val)}
                      options={types.map((t) => ({ value: t._id, label: t.name }))}
                      placeholder="Select Type"
                      size="sm"
                      portal={true}
                      buttonClassName="w-full bg-white border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                    />
                  </div>

                  {/* Diamond Shape */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">SHAPE</label>
                    <Dropdown
                      value={editShapeId}
                      onChange={(val) => setEditShapeId(val)}
                      options={shapes.map((s) => ({ value: s._id, label: s.name }))}
                      placeholder="Select Shape"
                      size="sm"
                      portal={true}
                      buttonClassName="w-full bg-white border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                    />
                  </div>

                  {/* Diamond Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">COLOR</label>
                    <Dropdown
                      value={editColorId}
                      onChange={(val) => setEditColorId(val)}
                      options={colors.map((c) => ({ value: c._id, label: c.name }))}
                      placeholder="Select Color"
                      size="sm"
                      portal={true}
                      buttonClassName="w-full bg-white border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                    />
                  </div>

                  {/* Diamond Clarity */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">CLARITY</label>
                    <Dropdown
                      value={editClarityId}
                      onChange={(val) => setEditClarityId(val)}
                      options={clarities.map((cl) => ({ value: cl._id, label: cl.name }))}
                      placeholder="Select Clarity"
                      size="sm"
                      portal={true}
                      buttonClassName="w-full bg-white border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                    />
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
                  <ToggleSwitch
                    checked={editStatus === 'active'}
                    onChange={() => setEditStatus(editStatus === 'active' ? 'inactive' : 'active')}
                    size="md"
                    showStatusText={true}
                    ariaLabel="Toggle Diamond Status"
                  />
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

      {/* ─── Demo Metrics Quick Edit Modal ─── */}
      {editingMetricsDiamond &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
            onClick={() => setEditingMetricsDiamond(null)}
          >
            <div
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 space-y-4 cursor-default animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 text-lg shadow-2xs">
                    🔥
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      Diamond Demo Metrics
                    </h3>
                    <p className="text-[11px] text-stone-500 truncate max-w-[220px]">
                      {editingMetricsDiamond.title || editingMetricsDiamond.sku || ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMetricsDiamond(null)}
                  className="w-7 h-7 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Live Storefront Preview */}
              <div className="rounded-xl border border-stone-200/90 bg-[#fdfcfb] p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Storefront Live Badge Preview
                </span>
                <div className="flex items-center gap-1.5 text-xs text-stone-700">
                  <span className="text-amber-400 tracking-tighter">★★★★★</span>
                  <span className="font-semibold text-stone-800 text-xs">
                    {metricsReviewCount || 0} reviews
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
                  <span>🔥</span>
                  <span>
                    <strong className="font-bold text-stone-900">{metricsSoldCount || 0}</strong> sold in last 3 hours
                  </span>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Sold Count
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🔥</span>
                    <input
                      type="number"
                      min="0"
                      value={metricsSoldCount}
                      onChange={(e) => setMetricsSoldCount(e.target.value)}
                      className="w-full h-9 pl-7 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30"
                      placeholder="e.g. 24"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Pieces sold</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Review Count
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">★</span>
                    <input
                      type="number"
                      min="0"
                      value={metricsReviewCount}
                      onChange={(e) => setMetricsReviewCount(e.target.value)}
                      className="w-full h-9 pl-7 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30"
                      placeholder="e.g. 13"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Customer reviews</span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingMetricsDiamond(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-lg border border-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMetrics}
                  disabled={savingMetrics}
                  style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg hover:brightness-95 disabled:opacity-50 transition cursor-pointer"
                >
                  {savingMetrics ? 'Saving…' : 'Save Demo Metrics'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
