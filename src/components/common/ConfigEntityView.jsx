import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import Dropdown from './Dropdown';
import useAdminList from '../../hooks/useAdminList';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from './ModuleHeader';
import StatCards from './StatCards';
import SearchFilterBar from './SearchFilterBar';
import RowActions from './RowActions';
import Modal from './Modal';
import ToggleSwitch from './ToggleSwitch';
import MobileGridList from './MobileGridList';
import { getUploadTriggerProps } from '../../utils/filePickerAutoOpen';

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
 * (Diamond Types/Shapes/Colors/Clarities/Sizes, Gemstone Types/Shapes, Metal Colors/Purities, etc.)
 */
export default function ConfigEntityView({
  title = 'Configuration Items',
  singularTitle = 'Item',
  subtitle,
  addLabel,
  itemLabel,
  endpoint = '',
  uploadFolder = 'config',
  hasIcon = true,
  hasCode = false,
  codeLabel = 'Code',
  hasNameField = true,
  nameLabel,
  nameColumnLabel = 'NAME',
  namePlaceholder,
  hasStatusColumn = true,
  hasCreatedDateColumn = true,
  showStatusFilter = true,
  showStatusToggleInModal = true,
  openAddFromRoute = false,
  placeholderPrefix = 'IT',
  statColors = { total: 'bronze', active: 'green', other: 'gold' },
  buildStatCards,
  leadingColumns = [],
  extraFields = [],
  renderModalPreview,
  searchMatcher,
  validateAndBuildPayload,
}) {
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('all');

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

  const fetcher = useCallback(
    ({ page, limit, signal }) => api.get(`${endpoint}?page=${page}&limit=${limit}`, { signal }),
    [endpoint]
  );

  const filterListItems = useCallback(
    (list, query) => {
      let result = list;

      if (showStatusFilter && statusFilter !== 'all') {
        result = result.filter((it) => it.status === statusFilter);
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        result = result.filter(
          (it) =>
            (it.name && it.name.toLowerCase().includes(q)) ||
            (it.code && String(it.code).toLowerCase().includes(q)) ||
            (searchMatcher ? searchMatcher(it, q) : false)
        );
      }

      return result;
    },
    [showStatusFilter, statusFilter, searchMatcher]
  );

  const {
    items,
    setItems,
    displayedItems: filteredItems,
    loading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isAllSelected: checkAllSelected,
    clearSelection,
    removeFromSelection,
    invalidateAndRefetch,
  } = useAdminList({
    fetcher,
    cacheKey: endpoint ? `config:${endpoint}` : '',
    errorMessage: `Failed to load ${title.toLowerCase()}`,
    filterItems: filterListItems,
    getId: (it) => it._id,
  });

  // Quick stat cards
  const activeCount = useMemo(() => items.filter((it) => it.status === 'active').length, [items]);
  const inactiveCount = useMemo(() => items.filter((it) => it.status === 'inactive').length, [items]);

  const statCardsData = useMemo(() => {
    if (buildStatCards) return buildStatCards(items);
    return [
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
  }, [buildStatCards, items, title, statColors, activeCount, inactiveCount]);

  const buildDefaultExtras = useCallback(
    (sourceItem = null) => {
      const extras = {};
      extraFields.forEach((field) => {
        if (sourceItem && sourceItem[field.name] !== undefined && sourceItem[field.name] !== null) {
          extras[field.name] = sourceItem[field.name];
        } else if (typeof field.defaultValue === 'function') {
          extras[field.name] = field.defaultValue(items);
        } else {
          extras[field.name] = field.defaultValue ?? '';
        }
      });
      return extras;
    },
    [extraFields, items]
  );

  // Open modal to Add
  const handleOpenAdd = useCallback(() => {
    setEditingItem(null);
    setViewingItem(null);
    setName('');
    setCode('');
    setIconUrl('');
    setStatus('active');
    setExtraValues(buildDefaultExtras(null));
    setIsUploading(false);
    setIsModalOpen(true);
  }, [buildDefaultExtras]);

  useEffect(() => {
    if (!openAddFromRoute) return;
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add' || location.state?.openAdd) {
      handleOpenAdd();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [openAddFromRoute, location.search, location.state, location.pathname, navigate, handleOpenAdd]);

  // Open modal to Edit
  const handleOpenEdit = (it) => {
    setEditingItem(it);
    setViewingItem(null);
    setName(it.name || '');
    setCode(it.code || '');
    setIconUrl(it.image?.url || (typeof it.image === 'string' ? it.image : '') || '');
    setStatus(it.status || 'active');
    setExtraValues(buildDefaultExtras(it));
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
    setExtraValues(buildDefaultExtras(it));
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
      removeFromSelection(id);
    } catch (err) {
      console.error(`Failed to delete ${singularTitle.toLowerCase()}:`, err);
      toast.error(err.response?.data?.message || `Failed to delete ${singularTitle.toLowerCase()}`);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (!idsToDelete.length) return;

    const isConfirmed = await confirm({
      title: `Delete Selected ${title}`,
      message: `Are you sure you want to delete ${idsToDelete.length} selected ${title.toLowerCase()}? This action cannot be undone.`,
      confirmText: `Delete ${idsToDelete.length} Items`,
      confirmVariant: 'danger',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const cleanEndpoint = endpoint.split('?')[0];
      try {
        await api.post(`${cleanEndpoint}/bulk-delete`, { ids: idsToDelete });
      } catch (bulkErr) {
        if (bulkErr?.response?.status === 404) {
          await Promise.all(idsToDelete.map((id) => api.delete(`${cleanEndpoint}/${id}`)));
        } else {
          throw bulkErr;
        }
      }
      toast.success(`${idsToDelete.length} ${title.toLowerCase()} deleted successfully`);
      setItems((prev) => prev.filter((it) => !selectedIds.has(it._id)));
      clearSelection();
    } catch (err) {
      console.error(`Failed to bulk delete ${title.toLowerCase()}:`, err);
      toast.error(err.response?.data?.message || 'Failed to delete selected items');
    }
  };

  const isAllSelected = checkAllSelected(paginatedItems);
  const handleSelectAll = () => toggleSelectAll(paginatedItems);

  // Submit form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    let payload;
    if (validateAndBuildPayload) {
      payload = validateAndBuildPayload({
        name,
        code,
        status,
        iconUrl,
        extraValues,
        editingItem,
      });
      if (!payload) return;
    } else {
      if (hasNameField && !name.trim()) {
        toast.error(`Please enter a ${singularTitle.toLowerCase()} name`);
        return;
      }

      payload = {
        ...(hasNameField ? { name: name.trim() } : {}),
        status,
        ...extraValues,
      };

      if (hasCode && code.trim()) {
        payload.code = code.trim();
      }

      if (hasIcon) {
        payload.image = iconUrl ? { url: iconUrl } : null;
      }
    }

    try {
      setSubmitting(true);

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, payload);
        toast.success(`${singularTitle} updated successfully`);
      } else {
        await api.post(endpoint, payload);
        toast.success(`${singularTitle} created successfully`);
      }

      setIsModalOpen(false);
      await invalidateAndRefetch(currentPage, pageSize);
    } catch (err) {
      console.error(`Failed to save ${singularTitle.toLowerCase()}:`, err);
      toast.error(err.response?.data?.message || `Failed to save ${singularTitle.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const tableExtraColumns = useMemo(
    () => extraFields.filter((f) => !f.hideInTable),
    [extraFields]
  );

  const totalColSpan =
    4 +
    leadingColumns.length +
    (hasIcon ? 1 : 0) +
    (hasCode ? 1 : 0) +
    tableExtraColumns.length +
    (hasStatusColumn ? 1 : 0) +
    (hasCreatedDateColumn ? 1 : 0);

  const handleExtraFieldUpdate = (field, rawVal) => {
    const val = field.type === 'color' ? String(rawVal || '').toUpperCase() : rawVal;
    const nextValues = { ...extraValues, [field.name]: val };
    setExtraValues(nextValues);
    if (field.onChangeExtra) {
      field.onChangeExtra({
        value: val,
        extraValues: nextValues,
        setExtraValues,
        name,
        setName,
        editingItem,
      });
    }
  };

  const renderFieldInput = (field) => {
    const disabled = Boolean(viewingItem);
    const val = extraValues[field.name] ?? '';

    if (field.type === 'select') {
      return (
        <div key={field.name}>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <Dropdown
            value={val}
            onChange={(selected) => handleExtraFieldUpdate(field, selected)}
            options={field.options || []}
            disabled={disabled}
            placeholder={field.placeholder || `Select ${field.label}`}
            buttonClassName="w-full h-11 px-3.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl shadow-2xs"
            menuClassName="z-[60]"
          />
        </div>
      );
    }

    if (field.type === 'color') {
      const hex = val || '#F9E498';
      return (
        <div key={field.name}>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-2 border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl px-2.5 py-1.5 bg-white transition-all">
            <input
              type="color"
              disabled={disabled}
              value={hex}
              onChange={(e) => handleExtraFieldUpdate(field, e.target.value)}
              className="w-7 h-7 rounded-md cursor-pointer border-0 p-0 bg-transparent disabled:opacity-75"
            />
            <input
              type="text"
              disabled={disabled}
              value={hex}
              onChange={(e) => handleExtraFieldUpdate(field, e.target.value)}
              className="w-full text-xs font-mono font-semibold text-stone-900 uppercase focus:outline-none disabled:opacity-75"
            />
          </div>
        </div>
      );
    }

    const dynamicPlaceholder =
      typeof field.placeholder === 'function' ? field.placeholder(extraValues) : (field.placeholder || '');
    const dynamicLabel =
      typeof field.dynamicLabel === 'function' ? field.dynamicLabel(extraValues) : field.label;
    const dynamicMax =
      typeof field.max === 'function' ? field.max(extraValues) : field.max;

    return (
      <div key={field.name}>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
          {dynamicLabel} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={field.type || 'text'}
          min={field.min}
          max={dynamicMax}
          step={field.step}
          required={Boolean(field.required)}
          disabled={disabled}
          value={val}
          onChange={(e) => handleExtraFieldUpdate(field, e.target.value)}
          placeholder={dynamicPlaceholder}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all disabled:opacity-75 disabled:bg-stone-100"
        />
      </div>
    );
  };

  const renderFieldGroupList = (fieldsList) => {
    const rendered = [];
    let i = 0;
    while (i < fieldsList.length) {
      const f = fieldsList[i];
      if (f.gridGroup) {
        const groupName = f.gridGroup;
        const groupFields = [];
        while (i < fieldsList.length && fieldsList[i].gridGroup === groupName) {
          groupFields.push(fieldsList[i]);
          i++;
        }
        rendered.push(
          <div key={`group-${groupName}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groupFields.map(renderFieldInput)}
          </div>
        );
      } else {
        rendered.push(renderFieldInput(f));
        i++;
      }
    }
    return rendered;
  };

  const beforeNameFields = useMemo(
    () => extraFields.filter((f) => f.position === 'beforeName'),
    [extraFields]
  );
  const afterNameFields = useMemo(
    () => extraFields.filter((f) => f.position !== 'beforeName'),
    [extraFields]
  );

  return (
    <div className="space-y-6">
      {/* ─── Header & Stat Cards ─── */}
      <div className="space-y-5">
        <ModuleHeader
          title={title}
          subtitle={subtitle || `Manage, organize, and configure catalog ${title.toLowerCase()}`}
          onAdd={handleOpenAdd}
          addLabel={addLabel || `Add ${singularTitle}`}
        />

        <StatCards cards={statCardsData} />

        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={`Search ${title.toLowerCase()} by name${hasCode ? ' or code' : ''}...`}
          statusFilter={showStatusFilter ? statusFilter : undefined}
          onStatusFilterChange={
            showStatusFilter
              ? (val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }
              : undefined
          }
          statusOptions={
            showStatusFilter
              ? [
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]
              : undefined
          }
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      {/* ─── Table Card (Mobile Grid + Desktop Table) ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText={`Loading ${title.toLowerCase()}...`}
          isEmpty={filteredItems.length === 0}
          emptyText={`No ${title.toLowerCase()} found.`}
          items={paginatedItems}
          showSelectAll
          allSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          renderCard={(it, idx) => {
            const isSelected = selectedIds.has(it._id);
            const isViewing = viewingItem?._id === it._id;
            const srNo = (currentPage - 1) * pageSize + idx + 1;

            return (
              <div
                key={it._id}
                onClick={() => handleOpenEdit(it)}
                className={`rounded-xl border p-3.5 bg-white shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'border-[#8b6f4e]/60 bg-[#fcfaf7]'
                    : isViewing
                    ? 'border-stone-300 bg-stone-50'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(it._id)}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer shrink-0"
                    />
                    {hasIcon && (
                      <VisualEntityBadge
                        name={it.name}
                        imageUrl={it.image?.url || (typeof it.image === 'string' ? it.image : '')}
                        prefix={placeholderPrefix}
                        className="w-7 h-7"
                      />
                    )}
                    {leadingColumns.slice(0, 1).map((col, cIdx) => (
                      <span key={`m-lead-${cIdx}`} className="shrink-0">
                        {col.render(it)}
                      </span>
                    ))}
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-stone-900 truncate">
                        {it.name}
                      </p>
                      <p className="text-[10px] font-medium text-stone-400">
                        #{srNo}{hasCode && it.code ? ` · ${it.code}` : ''}
                      </p>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <RowActions
                      onView={() => handleOpenView(it)}
                      onEdit={() => handleOpenEdit(it)}
                      onDelete={() => handleDelete(it._id, it.name)}
                      viewLabel={`View ${singularTitle}`}
                      editLabel={`Edit ${singularTitle}`}
                      deleteLabel={`Delete ${singularTitle}`}
                    />
                  </div>
                </div>

                {(leadingColumns.length > 1 || tableExtraColumns.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px]">
                    {leadingColumns.slice(1).map((col, cIdx) => (
                      <div key={`m-lead2-${cIdx}`} className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold truncate">
                          {col.header}
                        </p>
                        <div className="mt-0.5 text-stone-700 font-medium truncate">
                          {col.render(it)}
                        </div>
                      </div>
                    ))}
                    {tableExtraColumns.map((f) => (
                      <div key={`m-ext-${f.name}`} className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold truncate">
                          {f.tableHeader || f.label}
                        </p>
                        <div className="mt-0.5 text-stone-700 font-medium truncate">
                          {f.renderCell
                            ? f.renderCell(it)
                            : it[f.name] !== undefined
                            ? String(it[f.name])
                            : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(hasStatusColumn || hasCreatedDateColumn) && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px]">
                    {hasStatusColumn ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                          checked={it.status === 'active'}
                          onChange={() => handleToggleStatus(it)}
                          size="sm"
                          ariaLabel={`Set ${it.name} ${it.status === 'active' ? 'Inactive' : 'Active'}`}
                        />
                        <span className="text-[11px] font-medium text-stone-500 capitalize">
                          {it.status || 'inactive'}
                        </span>
                      </div>
                    ) : <span />}
                    {hasCreatedDateColumn && (
                      <span className="text-[11px] text-stone-400 font-medium">
                        {formatDate(it.meta?.createdAt || it.createdAt, '—')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
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
                {leadingColumns.map((col, idx) => (
                  <th key={`lead-${idx}`} className="py-3 px-3 whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
                <th className="py-3 px-3 whitespace-nowrap">{nameColumnLabel}</th>
                {hasCode && <th className="py-3 px-3 whitespace-nowrap">{codeLabel.toUpperCase()}</th>}
                {tableExtraColumns.map((f) => (
                  <th key={f.name} className={`py-3 px-3 whitespace-nowrap ${f.align === 'center' ? 'text-center' : ''}`}>
                    {(f.tableHeader || f.label).toUpperCase()}
                  </th>
                ))}
                {hasStatusColumn && <th className="py-3 px-3 text-center whitespace-nowrap">STATUS</th>}
                {hasCreatedDateColumn && <th className="py-3 px-3 whitespace-nowrap">CREATED DATE</th>}
                <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={totalColSpan} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading {title.toLowerCase()}...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={totalColSpan} className="py-12 text-center text-stone-400">
                    No {title.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((it, idx) => {
                  const isSelected = selectedIds.has(it._id);
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
                          onChange={() => toggleSelect(it._id)}
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

                      {leadingColumns.map((col, cIdx) => (
                        <td key={`lead-cell-${cIdx}`} className="py-2.5 px-3 whitespace-nowrap">
                          {col.render(it)}
                        </td>
                      ))}

                      <td className="py-2.5 px-3 whitespace-nowrap text-xs font-bold uppercase text-stone-900">
                        {it.name}
                      </td>

                      {hasCode && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-stone-600">
                          {it.code || '—'}
                        </td>
                      )}

                      {tableExtraColumns.map((f) => (
                        <td
                          key={f.name}
                          className={`py-2.5 px-3 whitespace-nowrap text-xs text-stone-600 ${
                            f.align === 'center' ? 'text-center' : ''
                          }`}
                        >
                          {f.renderCell
                            ? f.renderCell(it)
                            : it[f.name] !== undefined
                            ? String(it[f.name])
                            : '—'}
                        </td>
                      ))}

                      {hasStatusColumn && (
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
                      )}

                      {hasCreatedDateColumn && (
                        <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                          {formatDate(it.meta?.createdAt || it.createdAt, '—')}
                        </td>
                      )}

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
          itemLabel={itemLabel || title.toLowerCase()}
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
          {renderFieldGroupList(beforeNameFields)}

          {hasNameField && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                {nameLabel || `${singularTitle} Name`} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={Boolean(viewingItem)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  typeof namePlaceholder === 'function'
                    ? namePlaceholder(extraValues)
                    : namePlaceholder || `e.g. ${singularTitle} standard`
                }
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all disabled:opacity-75 disabled:bg-stone-100"
              />
            </div>
          )}

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

          {renderModalPreview && renderModalPreview({ extraValues })}

          {renderFieldGroupList(afterNameFields)}

          {hasIcon && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Icon Image
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
                      {...getUploadTriggerProps(() => fileInputRef.current?.click(), {
                        disabled: isUploading,
                        fileInputId: 'entity-icon-upload',
                      })}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/40 ${
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

          {showStatusToggleInModal && (
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
          )}

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
