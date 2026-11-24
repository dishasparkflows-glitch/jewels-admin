import { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import { formatDate } from '../../utils/formatters';
import Pagination from './Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from './ModuleHeader';
import StatCards from './StatCards';
import SearchFilterBar from './SearchFilterBar';
import RowActions from './RowActions';
import Modal from './Modal';
import ToggleSwitch from './ToggleSwitch';
import { useAdminPageSize } from '../../utils/adminPagination';

/**
 * Standardized Visual Badge with initials fallback
 */
function VisualEntityBadge({ name = '', imageUrl, prefix = 'ITEM', className = 'w-7 h-7' }) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = getMediaUrl(imageUrl);

  if (resolvedSrc && !imgError) {
    return (
      <div className={`${className} rounded-lg bg-stone-50 border border-stone-200/80 p-0.5 flex items-center justify-center overflow-hidden shadow-2xs`}>
        <img
          src={resolvedSrc}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const label = prefix || name.slice(0, 2).toUpperCase() || 'ITEM';

  return (
    <div
      className={`${className} rounded-lg bg-[#fafafc] border border-stone-200/80 flex items-center justify-center select-none shadow-2xs`}
      title={name}
    >
      <span className="text-stone-400 italic text-[10px] font-semibold tracking-wider">
        {label}
      </span>
    </div>
  );
}

/**
 * ConfigEntityView
 * Reusable, high-performance CRUD view for administrative configuration entities
 * (e.g. Diamond Types, Shapes, Colors, Clarities, Gemstone Types, Shapes, etc.)
 */
export default function ConfigEntityView({
  title = 'Configuration Items',
  singularTitle = 'Item',
  addLabel,
  endpoint = '',
  uploadFolder = 'config',
  hasIcon = true,
  hasCode = false,
  codeLabel = 'Code',
  placeholderPrefix = 'IT',
  statColors = { total: 'bronze', active: 'green', other: 'gold' },
  extraFields = [],
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [status, setStatus] = useState('active');
  const [extraValues, setExtraValues] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch items from endpoint
  const fetchItems = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`${endpoint}?page=${page}&limit=${limit}`);
      const list =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setItems(list);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error(`Failed to load ${title}:`, err);
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPage, pageSize);
  }, [endpoint, currentPage, pageSize]);

  // Search and status filtering
  const filteredItems = useMemo(() => {
    let result = items;

    if (statusFilter !== 'all') {
      result = result.filter((it) => it.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (it) =>
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.code && String(it.code).toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, search, statusFilter]);

  const { totalItems, paginatedItems } = usePagination(filteredItems, pageSize, serverTotal);

  // Quick stat cards
  const activeCount = useMemo(() => items.filter((it) => it.status === 'active').length, [items]);
  const inactiveCount = useMemo(() => items.filter((it) => it.status === 'inactive').length, [items]);

  const statCardsData = [
    {
      label: `Total ${title}`,
      value: items.length,
      icon: HiOutlineCube,
      color: statColors.total || 'bronze',
    },
    {
      label: `Active ${title}`,
      value: activeCount,
      icon: HiOutlineSparkles,
      color: statColors.active || 'green',
    },
    {
      label: `Inactive ${title}`,
      value: inactiveCount,
      icon: HiOutlineTag,
      color: statColors.other || 'gold',
    },
  ];

  // Open modal to Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setViewingItem(null);
    setName('');
    setCode('');
    setIconUrl('');
    setStatus('active');
    setExtraValues({});
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open modal to Edit
  const handleOpenEdit = (it) => {
    setEditingItem(it);
    setViewingItem(null);
    setName(it.name || '');
    setCode(it.code || '');
    setIconUrl(it.image?.url || (typeof it.image === 'string' ? it.image : '') || '');
    setStatus(it.status || 'active');

    const extras = {};
    extraFields.forEach((field) => {
      extras[field.name] = it[field.name] ?? field.defaultValue ?? '';
    });
    setExtraValues(extras);

    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open modal to View
  const handleOpenView = (it) => {
    setViewingItem(it);
    setEditingItem(null);
    setName(it.name || '');
    setCode(it.code || '');
    setIconUrl(it.image?.url || (typeof it.image === 'string' ? it.image : '') || '');
    setStatus(it.status || 'active');
    setIsModalOpen(true);
  };

  // Upload Icon via Cloudflare Presigned URL
  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { fileUrl } = await uploadWithPresignedUrl(file, uploadFolder);
      setIconUrl(fileUrl);
      toast.success('Icon uploaded successfully');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload icon');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle Item Status
  const handleToggleStatus = async (itemRecord) => {
    try {
      const nextStatus = itemRecord.status === 'active' ? 'inactive' : 'active';
      await api.put(`${endpoint}/${itemRecord._id}`, { status: nextStatus });
      toast.success(`${itemRecord.name} status set to ${nextStatus}`);
      setItems((prev) =>
        prev.map((it) => (it._id === itemRecord._id ? { ...it, status: nextStatus } : it))
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Delete Item
  const handleDelete = async (id, itemName) => {
    const isConfirmed = await confirm({
      title: `Delete ${singularTitle}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: `Delete ${singularTitle}`,
      confirmVariant: 'danger',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success(`${singularTitle} deleted successfully`);
      setItems((prev) => prev.filter((it) => it._id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (err) {
      console.error(`Failed to delete ${singularTitle.toLowerCase()}:`, err);
      toast.error(err.response?.data?.message || `Failed to delete ${singularTitle.toLowerCase()}`);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    const isConfirmed = await confirm({
      title: `Delete Selected ${title}`,
      message: `Are you sure you want to delete ${selectedIds.length} selected ${title.toLowerCase()}? This action cannot be undone.`,
      confirmText: `Delete ${selectedIds.length} Items`,
      confirmVariant: 'danger',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const cleanEndpoint = endpoint.split('?')[0];
      try {
        await api.post(`${cleanEndpoint}/bulk-delete`, { ids: selectedIds });
      } catch (bulkErr) {
        if (bulkErr?.response?.status === 404) {
          await Promise.all(selectedIds.map((id) => api.delete(`${cleanEndpoint}/${id}`)));
        } else {
          throw bulkErr;
        }
      }
      toast.success(`${selectedIds.length} ${title.toLowerCase()} deleted successfully`);
      setItems((prev) => prev.filter((it) => !selectedIds.includes(it._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error(`Failed to bulk delete ${title.toLowerCase()}:`, err);
      toast.error(err.response?.data?.message || `Failed to delete selected items`);
    }
  };

  // Select all checkboxes
  const isAllSelected =
    paginatedItems.length > 0 && paginatedItems.every((it) => selectedIds.includes(it._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedItems.map((it) => it._id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedItems.map((it) => it._id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Submit form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(`Please enter a ${singularTitle.toLowerCase()} name`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        status,
        ...extraValues,
      };

      if (hasCode && code.trim()) {
        payload.code = code.trim();
      }

      if (hasIcon) {
        payload.image = iconUrl ? { url: iconUrl } : null;
      }

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, payload);
        toast.success(`${singularTitle} updated successfully`);
      } else {
        await api.post(endpoint, payload);
        toast.success(`${singularTitle} created successfully`);
      }

      setIsModalOpen(false);
      fetchItems(currentPage, pageSize);
    } catch (err) {
      console.error(`Failed to save ${singularTitle.toLowerCase()}:`, err);
      toast.error(err.response?.data?.message || `Failed to save ${singularTitle.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Stat Cards ─── */}
      <div className="space-y-5">
        <ModuleHeader
          title={title}
          subtitle={`Manage, organize, and configure catalog ${title.toLowerCase()}`}
          breadcrumbs={[
            { label: 'Catalog' },
            { label: title },
          ]}
          onAdd={handleOpenAdd}
          addLabel={addLabel || `Add ${singularTitle}`}
        />

        <StatCards cards={statCardsData} />

        <SearchFilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder={`Search ${title.toLowerCase()} by name${hasCode ? ' or code' : ''}...`}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
          statusOptions={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      {/* ─── Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                {hasIcon && <th className="py-3 px-3 whitespace-nowrap">VISUAL</th>}
                <th className="py-3 px-3 whitespace-nowrap">NAME</th>
                {hasCode && <th className="py-3 px-3 whitespace-nowrap">{codeLabel.toUpperCase()}</th>}
                {extraFields.map((f) => (
                  <th key={f.name} className="py-3 px-3 whitespace-nowrap">{f.label.toUpperCase()}</th>
                ))}
                <th className="py-3 px-3 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-3 whitespace-nowrap">CREATED DATE</th>
                <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={7 + (hasCode ? 1 : 0) + (hasIcon ? 1 : 0) + extraFields.length} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading {title.toLowerCase()}...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7 + (hasCode ? 1 : 0) + (hasIcon ? 1 : 0) + extraFields.length} className="py-12 text-center text-stone-400">
                    No {title.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((it, idx) => {
                  const isSelected = selectedIds.includes(it._id);
                  const isViewing = viewingItem?._id === it._id;

                  return (
                    <tr
                      key={it._id}
                      onClick={() => handleOpenEdit(it)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#fcfaf7]' : isViewing ? 'bg-stone-50' : 'hover:bg-[#faf7f2]'
                      }`}
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(it._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {hasIcon && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <VisualEntityBadge
                            name={it.name}
                            imageUrl={it.image?.url || (typeof it.image === 'string' ? it.image : '')}
                            prefix={placeholderPrefix}
                            className="w-7 h-7"
                          />
                        </td>
                      )}

                      <td className="py-2.5 px-3 whitespace-nowrap text-xs font-bold uppercase text-stone-900">
                        {it.name}
                      </td>

                      {hasCode && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-stone-600">
                          {it.code || '—'}
                        </td>
                      )}

                      {extraFields.map((f) => (
                        <td key={f.name} className="py-2.5 px-3 whitespace-nowrap text-xs text-stone-600">
                          {it[f.name] !== undefined ? String(it[f.name]) : '—'}
                        </td>
                      ))}

                      {/* Status Toggle */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            checked={it.status === 'active'}
                            onChange={() => handleToggleStatus(it)}
                            size="sm"
                            ariaLabel={`Set ${it.name} ${it.status === 'active' ? 'Inactive' : 'Active'}`}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {formatDate(it.meta?.createdAt || it.createdAt, '—')}
                      </td>

                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          onView={() => handleOpenView(it)}
                          onEdit={() => handleOpenEdit(it)}
                          onDelete={() => handleDelete(it._id, it.name)}
                          viewLabel={`View ${singularTitle}`}
                          editLabel={`Edit ${singularTitle}`}
                          deleteLabel={`Delete ${singularTitle}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          className="border-t border-stone-200/80"
        />
      </div>

      {/* ─── Add / Edit / View Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingItem ? `View ${singularTitle}` : editingItem ? `Edit ${singularTitle}` : `Add New ${singularTitle}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              {singularTitle} Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={Boolean(viewingItem)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${singularTitle} standard`}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all disabled:opacity-75 disabled:bg-stone-100"
            />
          </div>

          {hasCode && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                {codeLabel}
              </label>
              <input
                type="text"
                disabled={Boolean(viewingItem)}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. RD, EM, PR"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all disabled:opacity-75 disabled:bg-stone-100 font-mono"
              />
            </div>
          )}

          {extraFields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              <input
                type={field.type || 'text'}
                disabled={Boolean(viewingItem)}
                value={extraValues[field.name] ?? ''}
                onChange={(e) => setExtraValues({ ...extraValues, [field.name]: e.target.value })}
                placeholder={field.placeholder || ''}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all disabled:opacity-75 disabled:bg-stone-100"
              />
            </div>
          ))}

          {hasIcon && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Visual Icon / Reference Image
              </label>
              <div className="flex items-center gap-3">
                {iconUrl ? (
                  <div className="relative w-14 h-14 rounded-xl border border-stone-200 bg-stone-50 p-1 flex items-center justify-center overflow-hidden">
                    <img src={getMediaUrl(iconUrl)} alt="Preview" className="w-full h-full object-contain" />
                    {!viewingItem && (
                      <button
                        type="button"
                        onClick={() => setIconUrl('')}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-stone-900/80 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 text-xs italic">
                    {placeholderPrefix}
                  </div>
                )}

                {!viewingItem && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleIconUpload}
                      accept="image/*"
                      className="hidden"
                      id="entity-icon-upload"
                    />
                    <label
                      htmlFor="entity-icon-upload"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer transition ${
                        isUploading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {isUploading ? 'Uploading...' : 'Choose Icon'}
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Switch */}
          <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200/80 rounded-xl">
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
              Status
            </span>
            <ToggleSwitch
              checked={status === 'active'}
              onChange={() => setStatus((prev) => (prev === 'active' ? 'inactive' : 'active'))}
              disabled={Boolean(viewingItem)}
              size="md"
              ariaLabel="Toggle Status"
            />
          </div>

          {!viewingItem && (
            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isUploading}
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                className="px-5 py-2 text-xs font-semibold text-white rounded-xl hover:brightness-95 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
