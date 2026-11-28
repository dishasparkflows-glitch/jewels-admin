import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineCheckCircle,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlinePhone,
  HiOutlineClock,
} from 'react-icons/hi';
import { IoMapOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { storesAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import Modal from '../../components/common/Modal';
import StatCards from '../../components/common/StatCards';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import RowActions from '../../components/common/RowActions';
import MobileGridList from '../../components/common/MobileGridList';
import Dropdown from '../../components/common/Dropdown';
import StoreTimingsPicker from '../../components/common/StoreTimingsPicker';
import useSelection from '../../hooks/useSelection';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { extractListItems } from '../../utils/apiHelpers';
import { getMediaUrl } from '../../utils/imageUrl';
import { VITE_FRONT_URL } from '../../config/env';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const EMPTY_STORE = {
  name: '',
  slug: '',
  contact: {
    phone: '',
    email: '',
  },
  location: {
    country: 'India',
    state: '',
    city: '',
    area: '',
    address: {
      line1: '',
      line2: '',
      landmark: '',
      pincode: '',
    },
    coordinates: {
      latitude: '',
      longitude: '',
    },
    mapUrl: '',
  },
  timings: '10:30 AM – 8:30 PM (Mon – Sun)',
  image: { url: '', key: '' },
  stateIcon: { url: '', key: '' },
  status: 'active',
};

const formatStoreAddress = (location = {}) => {
  const addr = location.address || {};
  const parts = [addr.line1, addr.line2, addr.landmark].filter(Boolean);
  const text = parts.join(', ');
  return addr.pincode ? `${text} - ${addr.pincode}` : text;
};

export default function StoresView() {
  const confirm = useConfirm();
  const fileInputRef = useRef(null);
  const stateIconInputRef = useRef(null);

  const [stores, setStores] = useState([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverFacets, setServerFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    selectedIds,
    toggleSelect: handleToggleSelect,
    toggleSelectAll,
    isAllSelected: checkAllSelected,
    clearSelection,
    removeFromSelection,
  } = useSelection();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingStateIcon, setUploadingStateIcon] = useState(false);
  const [formData, setFormData] = useState(EMPTY_STORE);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    totalItems,
  } = usePagination(stores, null, serverTotal);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (stateFilter && stateFilter !== 'all') {
        params.state = stateFilter;
      }
      if (cityFilter && cityFilter !== 'all') {
        params.city = cityFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await storesAPI.getAll(params);
      const items = extractListItems(res);
      const pagination = res.data?.pagination || res.data?.data?.pagination;
      const facets = res.data?.facets || res.data?.data?.facets;

      setStores(Array.isArray(items) ? items : []);
      if (pagination?.totalDocs !== undefined) {
        setServerTotal(pagination.totalDocs);
      } else if (pagination?.total !== undefined) {
        setServerTotal(pagination.total);
      } else {
        setServerTotal(Array.isArray(items) ? items.length : 0);
      }
      if (facets) {
        setServerFacets(facets);
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, stateFilter, cityFilter, statusFilter]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Unique States, Cities, and Areas for filter dropdowns & state selector
  const stateOptions = useMemo(() => {
    if (Array.isArray(serverFacets?.states)) {
      return serverFacets.states;
    }
    const set = new Set();
    stores.forEach((s) => {
      if (s.location?.state?.trim()) set.add(s.location.state.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [serverFacets, stores]);

  const modalStateOptions = useMemo(() => {
    const map = new Map();
    [...INDIAN_STATES, ...stateOptions].forEach((st) => {
      const val = String(st || '').trim();
      if (val && !map.has(val.toLowerCase())) {
        map.set(val.toLowerCase(), val);
      }
    });
    return Array.from(map.values())
      .sort((a, b) => a.localeCompare(b))
      .map((st) => ({ value: st, label: st }));
  }, [stateOptions]);

  const cityOptions = useMemo(() => {
    if (serverFacets) {
      if (stateFilter !== 'all') {
        return serverFacets.citiesByState?.[stateFilter.toLowerCase()] || [];
      }
      return serverFacets.allCities || [];
    }
    const set = new Set();
    stores.forEach((s) => {
      if (stateFilter !== 'all' && String(s.location?.state || '').trim().toLowerCase() !== stateFilter.toLowerCase()) {
        return;
      }
      if (s.location?.city?.trim()) set.add(s.location.city.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [serverFacets, stores, stateFilter]);

  const areaSuggestions = useMemo(() => {
    if (serverFacets) {
      const cityKey = String(formData.location.city || '').trim().toLowerCase();
      if (cityKey) {
        return serverFacets.areasByCity?.[cityKey] || [];
      }
      return serverFacets.allAreas || [];
    }
    const set = new Set();
    stores.forEach((s) => {
      if (formData.location.city && String(s.location?.city || '').trim().toLowerCase() !== formData.location.city.trim().toLowerCase()) {
        return;
      }
      if (s.location?.area?.trim()) set.add(s.location.area.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [serverFacets, stores, formData.location.city]);

  // If a state is selected in the modal and no stateIcon is set, prefill from existing store of that state
  useEffect(() => {
    if (!formData.location.state || formData.stateIcon?.url) return;
    const stateKey = formData.location.state.trim().toLowerCase();
    const facetIcon = serverFacets?.stateIcons?.[stateKey];
    if (facetIcon?.url) {
      setFormData((prev) => ({
        ...prev,
        stateIcon: { url: facetIcon.url, key: facetIcon.key || '' },
      }));
      return;
    }
    const match = stores.find(
      (s) =>
        s.stateIcon?.url &&
        String(s.location?.state || '').trim().toLowerCase() === stateKey
    );
    if (match?.stateIcon?.url) {
      setFormData((prev) => ({
        ...prev,
        stateIcon: { url: match.stateIcon.url, key: match.stateIcon.key || '' },
      }));
    }
  }, [formData.location.state, formData.stateIcon?.url, serverFacets, stores]);

  const statsCards = useMemo(() => {
    const totalCount = serverFacets?.total ?? (serverTotal || stores.length);
    const activeCount = serverFacets?.active ?? stores.filter((s) => s.status === 'active').length;
    const distinctStates = serverFacets?.statesCount ?? new Set(stores.map((s) => String(s.location?.state || '').trim().toLowerCase()).filter(Boolean)).size;
    const distinctCities = serverFacets?.citiesCount ?? new Set(stores.map((s) => String(s.location?.city || '').trim().toLowerCase()).filter(Boolean)).size;

    return [
      { label: 'Total Stores', value: totalCount, icon: HiOutlineOfficeBuilding, color: 'bronze' },
      { label: 'Active Stores', value: activeCount, icon: HiOutlineCheckCircle, color: 'green' },
      { label: 'States Covered', value: distinctStates, icon: IoMapOutline, color: 'blue' },
      { label: 'Cities Covered', value: distinctCities, icon: HiOutlineLocationMarker, color: 'gold' },
    ];
  }, [serverFacets, serverTotal, stores]);

  const isAllSelected = checkAllSelected(paginatedItems);
  const handleSelectAll = () => toggleSelectAll(paginatedItems);

  const handleOpenAdd = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setFormData(EMPTY_STORE);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setIsCreatingNew(false);
    setSelectedId(store._id);
    setFormData({
      name: store.name || '',
      slug: store.slug || '',
      contact: {
        phone: store.contact?.phone || '',
        email: store.contact?.email || '',
      },
      location: {
        country: store.location?.country || 'India',
        state: store.location?.state || '',
        city: store.location?.city || '',
        area: store.location?.area || '',
        address: {
          line1: store.location?.address?.line1 || '',
          line2: store.location?.address?.line2 || '',
          landmark: store.location?.address?.landmark || '',
          pincode: store.location?.address?.pincode || '',
        },
        coordinates: {
          latitude: store.location?.coordinates?.latitude ?? '',
          longitude: store.location?.coordinates?.longitude ?? '',
        },
        mapUrl: store.location?.mapUrl || '',
      },
      timings: store.timings || '10:30 AM – 8:30 PM (Mon – Sun)',
      image: { url: store.image?.url || '', key: store.image?.key || '' },
      stateIcon: { url: store.stateIcon?.url || '', key: store.stateIcon?.key || '' },
      status: store.status === 'inactive' ? 'inactive' : 'active',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCreatingNew(false);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const uploaded = await uploadWithPresignedUrl(file, 'stores');
      const finalUrl = uploaded?.url || uploaded?.fileUrl || '';
      if (!finalUrl) throw new Error('Image upload returned no URL');
      setFormData((prev) => ({
        ...prev,
        image: { url: finalUrl, key: uploaded?.key || '' },
      }));
      toast.success('Store image uploaded');
    } catch (err) {
      toast.error(err?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleStateIconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingStateIcon(true);
      const uploaded = await uploadWithPresignedUrl(file, 'stores/state-icons');
      const finalUrl = uploaded?.url || uploaded?.fileUrl || '';
      if (!finalUrl) throw new Error('State icon upload returned no URL');
      setFormData((prev) => ({
        ...prev,
        stateIcon: { url: finalUrl, key: uploaded?.key || '' },
      }));
      toast.success('State icon uploaded');
    } catch (err) {
      toast.error(err?.message || 'State icon upload failed');
    } finally {
      setUploadingStateIcon(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error('Please enter a store name');
    if (!formData.location.state.trim()) return toast.error('Please enter a state');
    if (!formData.location.city.trim()) return toast.error('Please enter a city');
    if (!formData.location.area.trim()) return toast.error('Please enter an area / locality');
    if (!formData.location.address.line1.trim()) return toast.error('Please enter address line 1');

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      contact: {
        phone: formData.contact.phone.trim(),
        email: formData.contact.email.trim(),
      },
      location: {
        country: formData.location.country.trim() || 'India',
        state: formData.location.state.trim(),
        city: formData.location.city.trim(),
        area: formData.location.area.trim(),
        address: {
          line1: formData.location.address.line1.trim(),
          line2: formData.location.address.line2.trim(),
          landmark: formData.location.address.landmark.trim(),
          pincode: formData.location.address.pincode.trim(),
        },
        coordinates: {
          latitude: formData.location.coordinates.latitude === '' ? null : Number(formData.location.coordinates.latitude),
          longitude: formData.location.coordinates.longitude === '' ? null : Number(formData.location.coordinates.longitude),
        },
        mapUrl: formData.location.mapUrl.trim(),
      },
      timings: formData.timings.trim(),
      image: formData.image,
      stateIcon: formData.stateIcon,
      status: formData.status,
    };

    try {
      setSaving(true);
      if (isCreatingNew) {
        await storesAPI.create(payload);
        toast.success('Store created successfully!');
      } else {
        await storesAPI.update(selectedId, payload);
        toast.success('Store updated successfully!');
      }
      setIsModalOpen(false);
      await fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (store, e) => {
    e?.stopPropagation();
    try {
      const res = await storesAPI.toggleStatus(store._id);
      const nextStatus = res.data?.data?.status || (store.status === 'active' ? 'inactive' : 'active');
      toast.success(nextStatus === 'active' ? 'Store activated' : 'Store deactivated');
      await fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update store status');
    }
  };

  const handleDelete = async (id, name, e) => {
    e?.stopPropagation();
    const ok = await confirm({
      title: 'Delete Store',
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      confirmText: 'Delete Store',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await storesAPI.delete(id);
      toast.success('Store deleted successfully');
      removeFromSelection(id);
      await fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete store');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const ok = await confirm({
      title: 'Delete Selected Stores',
      message: `Are you sure you want to delete ${count} selected store${count > 1 ? 's' : ''}?`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await storesAPI.bulkDelete(Array.from(selectedIds));
      toast.success(`${count} store${count > 1 ? 's' : ''} deleted`);
      clearSelection();
      await fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected stores');
    }
  };

  const openStorefrontLocator = (store = null) => {
    const query = store?.location?.state ? `?state=${encodeURIComponent(store.location.state)}` : '';
    window.open(`${VITE_FRONT_URL}/stores${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={stateIconInputRef}
        accept="image/png,image/svg+xml,.png,.svg"
        onChange={handleStateIconFileChange}
        className="hidden"
      />

      {/* ─── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
            Stores &amp; Boutiques
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage physical store locations grouped across State, City, and Area
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => openStorefrontLocator()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold px-3.5 py-2.5 shadow-2xs transition-all cursor-pointer"
          >
            <HiOutlineExternalLink className="w-4 h-4 text-[#8b6f4e]" />
            <span>View Locator</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 shadow-sm hover:brightness-95 transition-all cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ───────────────────────────────────── */}
      <StatCards cards={statsCards} />

      {/* ─── Search & Filters Toolbar ──────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-md">
          <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search store name, state, city, area or pincode..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] transition-colors"
          />
        </div>

        {/* Filter dropdowns & Bulk Delete */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <div className="w-full sm:w-36">
            <Dropdown
              size="sm"
              value={stateFilter}
              onChange={(val) => {
                setStateFilter(val);
                setCityFilter('all');
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All States' },
                ...stateOptions.map((st) => ({ value: st, label: st })),
              ]}
              searchable
              searchPlaceholder="Search state..."
              buttonClassName="w-full bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          <div className="w-full sm:w-36">
            <Dropdown
              size="sm"
              value={cityFilter}
              onChange={(val) => {
                setCityFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Cities' },
                ...cityOptions.map((ct) => ({ value: ct, label: ct })),
              ]}
              buttonClassName="w-full bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          <div className="w-full sm:w-32">
            <Dropdown
              size="sm"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              buttonClassName="w-full bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

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

      {/* ─── Stores Table & Mobile List ────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText="Loading stores..."
          isEmpty={paginatedItems.length === 0}
          emptyText='No stores found. Click "Add Store" to create your first boutique location.'
          items={paginatedItems}
          showSelectAll
          allSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          renderCard={(store, idx) => {
            const isSelected = selectedIds.has(store._id);
            const srNo = (currentPage - 1) * pageSize + idx + 1;
            return (
              <div
                key={store._id}
                onClick={() => handleOpenEdit(store)}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 cursor-pointer ${
                  isSelected ? 'border-[#8b6f4e] bg-[#faf6f0]' : 'border-stone-200/80 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleSelect(store._id)}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-xs truncate">
                        {store.name}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        #{srNo} · {store.location?.area}, {store.location?.city}, {store.location?.state}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <RowActions
                      onOpenWebsite={() => openStorefrontLocator(store)}
                      websiteTitle="View on Locator"
                      onEdit={() => handleOpenEdit(store)}
                      editTitle="Edit Store"
                      onDelete={(e) => handleDelete(store._id, store.name, e)}
                      deleteTitle="Delete Store"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 line-clamp-2">{formatStoreAddress(store.location)}</p>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={store.status === 'active'}
                    onChange={(val) => handleToggleStatus({ ...store, status: val ? 'inactive' : 'active' })}
                    size="sm"
                    showStatusText
                  />
                  {store.contact?.phone && (
                    <span className="text-[11px] font-medium text-stone-500">{store.contact.phone}</span>
                  )}
                </div>
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] cursor-pointer accent-[#8b6f4e]"
                  />
                </th>
                <th className="py-3.5 px-3 text-center w-14 whitespace-nowrap">SR NO</th>
                <th className="py-3.5 px-4">Store &amp; Address</th>
                <th className="py-3.5 px-4">State / City / Area</th>
                <th className="py-3.5 px-4">Contact &amp; Timings</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading stores...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-stone-400">
                    No stores found. Click &ldquo;Add Store&rdquo; to add locations by State, City &amp; Area.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((store, idx) => {
                  const isSelected = selectedIds.has(store._id);
                  const imageSrc = getMediaUrl(store.image?.url);

                  return (
                    <tr
                      key={store._id}
                      onClick={() => handleOpenEdit(store)}
                      className={`hover:bg-[#faf6f0]/70 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/90' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-4 pr-1 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(store._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] cursor-pointer accent-[#8b6f4e]"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs text-stone-500 font-mono font-medium whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/70 flex items-center justify-center shrink-0 overflow-hidden">
                            {imageSrc ? (
                              <img src={imageSrc} alt={store.name} className="w-full h-full object-cover" />
                            ) : (
                              <HiOutlineOfficeBuilding className="w-4 h-4 text-[#8b6f4e]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors text-xs sm:text-sm truncate">
                                {store.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 truncate mt-0.5" title={formatStoreAddress(store.location)}>
                              {formatStoreAddress(store.location)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {store.stateIcon?.url && (
                            <img
                              src={getMediaUrl(store.stateIcon.url)}
                              alt={store.location?.state}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                          )}
                          <span className="text-xs font-semibold text-stone-800">{store.location?.state}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {store.location?.city} <span className="text-stone-300">•</span> {store.location?.area}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[210px]">
                        {store.contact?.phone && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700 truncate">
                            <HiOutlinePhone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{store.contact.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 truncate mt-0.5">
                          <HiOutlineClock className="w-3.5 h-3.5 shrink-0" />
                          <span>{store.timings || 'Open daily'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                          checked={store.status === 'active'}
                          onChange={() => handleToggleStatus(store)}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          onOpenWebsite={() => openStorefrontLocator(store)}
                          websiteTitle="View on Locator"
                          onEdit={() => handleOpenEdit(store)}
                          editTitle="Edit Store"
                          onDelete={(e) => handleDelete(store._id, store.name, e)}
                          deleteTitle="Delete Store"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalItems > 0 && (
          <div className="p-3 border-t border-stone-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="stores"
            />
          </div>
        )}
      </div>

      {/* ─── Create / Edit Store Modal ─────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-3xl"
        title={isCreatingNew ? 'Add New Store Location' : `Edit Store: ${formData.name}`}
        subtitle="Configure State, City, Area hierarchy, contact info, and directions."
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : isCreatingNew ? 'Create Store' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Store / Showroom Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. CG Road Flagship Boutique"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Country</label>
              <input
                type="text"
                value={formData.location.country}
                onChange={(e) =>
                  setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })
                }
                placeholder="India"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={formData.location.state}
                onChange={(val) =>
                  setFormData({ ...formData, location: { ...formData.location, state: val } })
                }
                options={modalStateOptions}
                placeholder="Select state..."
                searchable
                searchPlaceholder="Search state..."
                portal
                size="sm"
                buttonClassName="h-[34px] px-3.5 text-xs rounded-xl bg-white border-stone-200 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="store-city-suggestions"
                value={formData.location.city}
                onChange={(e) =>
                  setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })
                }
                placeholder="e.g. New Delhi"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
              <datalist id="store-city-suggestions">
                {cityOptions.map((ct) => <option key={ct} value={ct} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Area / Locality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="store-area-suggestions"
                value={formData.location.area}
                onChange={(e) =>
                  setFormData({ ...formData, location: { ...formData.location, area: e.target.value } })
                }
                placeholder="e.g. Connaught Place"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
              <datalist id="store-area-suggestions">
                {areaSuggestions.map((ar) => <option key={ar} value={ar} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location.address.line1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      address: { ...formData.location.address, line1: e.target.value },
                    },
                  })
                }
                placeholder="e.g. N-12, Inner Circle"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Address Line 2</label>
              <input
                type="text"
                value={formData.location.address.line2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      address: { ...formData.location.address, line2: e.target.value },
                    },
                  })
                }
                placeholder="e.g. Block N, Connaught Place"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Landmark</label>
              <input
                type="text"
                value={formData.location.address.landmark}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      address: { ...formData.location.address, landmark: e.target.value },
                    },
                  })
                }
                placeholder="Optional nearby landmark"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Pincode</label>
              <input
                type="text"
                value={formData.location.address.pincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      address: { ...formData.location.address, pincode: e.target.value },
                    },
                  })
                }
                placeholder="110001"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={formData.contact.phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })
                }
                placeholder="+91 11 4890 4422"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Store Email</label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) =>
                  setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })
                }
                placeholder="delhi.cp@neirah.in"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Store Timings</label>
              <StoreTimingsPicker
                value={formData.timings}
                onChange={(timings) => setFormData({ ...formData, timings })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Google Maps URL</label>
              <input
                type="url"
                value={formData.location.mapUrl}
                onChange={(e) =>
                  setFormData({ ...formData, location: { ...formData.location, mapUrl: e.target.value } })
                }
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.location.coordinates.latitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      coordinates: { ...formData.location.coordinates, latitude: e.target.value },
                    },
                  })
                }
                placeholder="28.6315"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.location.coordinates.longitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      coordinates: { ...formData.location.coordinates, longitude: e.target.value },
                    },
                  })
                }
                placeholder="77.2167"
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
              />
            </div>
          </div>

          {/* Image, State Icon & Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-start">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Boutique Photo (Optional)</label>
              <div className="flex items-center gap-3">
                {formData.image?.url ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                    <img
                      src={getMediaUrl(formData.image.url)}
                      alt="Store preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: { url: '', key: '' } }))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                    >
                      <HiOutlineX className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <HiOutlineUpload className="w-4 h-4 text-[#8b6f4e]" />
                  <span>{uploadingImage ? 'Uploading...' : formData.image?.url ? 'Replace Image' : 'Upload Store Photo'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">State Icon (PNG / SVG)</label>
              <div className="flex items-center gap-3">
                {formData.stateIcon?.url ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-2 shrink-0 flex items-center justify-center">
                    <img
                      src={getMediaUrl(formData.stateIcon.url)}
                      alt="State icon preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, stateIcon: { url: '', key: '' } }))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                    >
                      <HiOutlineX className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={uploadingStateIcon}
                  onClick={() => stateIconInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <HiOutlineUpload className="w-4 h-4 text-[#8b6f4e]" />
                  <span>{uploadingStateIcon ? 'Uploading...' : formData.stateIcon?.url ? 'Replace Icon' : 'Upload State Icon'}</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">SVG or PNG landmark icon for {formData.location.state || 'this state'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-stone-50 px-4 py-3 rounded-xl border border-stone-200/80">
            <div>
              <span className="block text-xs font-bold text-stone-800">Active Status</span>
              <span className="block text-[11px] text-stone-500">Show this store on the storefront locator</span>
            </div>
            <ToggleSwitch
              size="sm"
              checked={formData.status === 'active'}
              onChange={(val) => setFormData({ ...formData, status: val ? 'active' : 'inactive' })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
