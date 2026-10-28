import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineCheck,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineFilter,
  HiOutlineTemplate,
  HiOutlineViewGrid,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiOutlineChatAlt2,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineSwitchHorizontal,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import {
  IoLayersOutline,
  IoCubeOutline,
  IoDiamondOutline,
} from 'react-icons/io5';
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
import Dropdown from '../../components/common/Dropdown';
import { useAdminPageSize } from '../../utils/adminPagination';

// Type metadata mapping
const SECTION_TYPES = [
  { value: 'hero_slider', label: 'Hero Banner Slider', icon: HiOutlineTemplate, desc: 'Full-width banner slider with headline & CTA' },
  { value: 'category_grid', label: 'Category Grid', icon: HiOutlineViewGrid, desc: 'Curated category cards with image & link' },
  { value: 'banner_grid', label: 'Multi-Banner Grid', icon: HiOutlinePhotograph, desc: 'Editorial 2/3/4 banner showcase tiles' },
  { value: 'product_carousel', label: 'Product Carousel', icon: IoDiamondOutline, desc: 'Curated products & trending solitaire carousel' },
  { value: 'promo_banner', label: 'Spotlight Promo Banner', icon: HiOutlineSparkles, desc: 'Bespoke atelier / spotlight promo banner' },
  { value: 'trust_badges', label: 'Trust & Heritage Perks', icon: HiOutlineShieldCheck, desc: 'Assurance badges (Shipping, Certification, Lifetime)' },
  { value: 'testimonials', label: 'Client Testimonials', icon: HiOutlineChatAlt2, desc: 'Real customer feedback, ratings, and quotes' },
  { value: 'instagram_feed', label: 'Instagram Gallery', icon: HiOutlinePhotograph, desc: 'Social curation feed and editorial grid' },
  { value: 'appointment_banner', label: 'Appointment CTA Banner', icon: HiOutlineSparkles, desc: 'Virtual & in-store concierge booking' },
  { value: 'custom_content', label: 'Custom Content Block', icon: IoLayersOutline, desc: 'Flexible custom content with title & items' },
];

const PLACEMENT_OPTIONS = [
  { value: 'home_top', label: 'Home Top (Header / Hero)' },
  { value: 'home_middle', label: 'Home Middle (Main Stream)' },
  { value: 'home_bottom', label: 'Home Bottom (Footer / Story)' },
  { value: 'all', label: 'All Pages / Global' },
];

const PRODUCT_PICKER_TABS = [
  { id: 'gold', label: 'Gold Jewelry', icon: IoDiamondOutline, badge: 'GOLD' },
  { id: 'silver', label: 'Silver Jewelry', icon: IoCubeOutline, badge: 'SILVER' },
  { id: 'ornate', label: 'Ornate Products', icon: HiOutlineSparkles, badge: 'ORNATE' },
  { id: 'all', label: 'All Products', icon: IoLayersOutline, badge: 'ALL' },
];

const getProductBadgeLabel = (prod) => {
  if (prod.isOrnate || prod.productType === 'ornate') return 'ORNATE';
  const metal = (prod.metalName || '').toLowerCase();
  if (metal.includes('gold') || prod.productType === 'gold') return 'GOLD';
  if (metal.includes('silver') || prod.productType === 'silver') return 'SILVER';
  return 'JEWELRY';
};

export default function HomeSectionsView() {
  const confirm = useConfirm();

  // State
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showTypeDrawer, setShowTypeDrawer] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    sectionKey: '',
    sectionType: 'product_carousel',
    placement: 'home_middle',
    order: 0,
    status: 'active',
    visibility: {
      website: true,
      mobileApp: true,
    },
    badgeText: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    imagePublicId: '',
    selectedProducts: [],
    items: [],
  });

  // Product Picker Modal State (Screenshot 2)
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTab, setPickerTab] = useState('gold'); // 'gold' | 'silver' | 'ornate' | 'all'
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerLimit, setPickerLimit] = useState(25);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerProducts, setPickerProducts] = useState([]);
  const [pickerPagination, setPickerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 25,
  });
  const [tempSelectedMap, setTempSelectedMap] = useState(new Map());

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Reorder State
  const [reorderingItems, setReorderingItems] = useState([]);
  const [savingReorder, setSavingReorder] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch sections
  const fetchSections = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/home-sections?page=${page}&limit=${limit}`);
      const items = res.data?.data?.items || res.data?.data || [];
      setSections(Array.isArray(items) ? items : []);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load home sections:', err);
      toast.error('Failed to load home sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Filter sections
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchSearch =
        !search ||
        sec.title?.toLowerCase().includes(search.toLowerCase()) ||
        sec.sectionKey?.toLowerCase().includes(search.toLowerCase()) ||
        sec.subtitle?.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || sec.sectionType === typeFilter;
      const matchStatus = statusFilter === 'all' || sec.status === statusFilter;
      const matchPlacement = placementFilter === 'all' || sec.placement === placementFilter;

      return matchSearch && matchType && matchStatus && matchPlacement;
    });
  }, [sections, search, typeFilter, statusFilter, placementFilter]);

  // Pagination hook
  const {
    paginatedItems: paginatedSections = [],
    totalPages,
    totalItems,
  } = usePagination(filteredSections, pageSize, serverTotal);

  // Stats calculation
  const stats = useMemo(() => {
    const total = sections.length;
    const active = sections.filter((s) => s.status === 'active').length;
    const inactive = total - active;
    const totalItems = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
    return { total, active, inactive, totalItems };
  }, [sections]);

  const statCardsData = [
    { label: 'Total Sections', value: stats.total, color: 'bronze', icon: HiOutlineTemplate },
    { label: 'Live Active', value: stats.active, color: 'green', icon: HiOutlineCheck },
    { label: 'Draft / Inactive', value: stats.inactive, color: 'peach', icon: HiOutlineX },
    { label: 'Curated Cards & Slides', value: stats.totalItems, color: 'gold', icon: IoDiamondOutline },
  ];

  // Slugify helper
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch products for picker modal
  const fetchPickerProducts = async (
    page = pickerPage,
    type = pickerTab,
    searchStr = pickerSearch,
    limit = pickerLimit
  ) => {
    try {
      setPickerLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('status', 'active');
      if (type && type !== 'all') {
        params.append('productType', type);
      }
      if (searchStr && searchStr.trim()) {
        params.append('search', searchStr.trim());
      }

      const res = await api.get(`/products/lookup?${params.toString()}`);
      const items = res.data?.data || [];
      const pagination = res.data?.pagination || {
        currentPage: page,
        totalPages: 1,
        totalDocs: items.length,
        limit,
      };

      setPickerProducts(Array.isArray(items) ? items : []);
      setPickerPagination(pagination);
      setPickerPage(page);
    } catch (err) {
      console.error('Failed to load products for picker:', err);
      toast.error('Failed to load products');
    } finally {
      setPickerLoading(false);
    }
  };

  useEffect(() => {
    if (!isProductPickerOpen) return;
    const timer = setTimeout(() => {
      fetchPickerProducts(pickerPage, pickerTab, pickerSearch, pickerLimit);
    }, 250);
    return () => clearTimeout(timer);
  }, [isProductPickerOpen, pickerTab, pickerSearch, pickerPage, pickerLimit]);

  // Product picker selection handlers
  const handleOpenProductPicker = () => {
    const newMap = new Map();
    (formData.selectedProducts || []).forEach((p) => {
      const key = String(p._id || p.id || p.productId);
      newMap.set(key, p);
    });
    setTempSelectedMap(newMap);
    setPickerSearch('');
    setPickerPage(1);
    setIsProductPickerOpen(true);
  };

  const handleToggleProductSelection = (product) => {
    const key = String(product._id || product.id);
    setTempSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          _id: product._id,
          id: product._id,
          productId: product._id,
          title: product.basicInfo?.title || '',
          subtitle: product.subtitle || product.ornate?.metalName || '',
          sku: product.basicInfo?.sku || '',
          price: product.pricing?.salePrice || product.pricing?.mrp || product.cataloguePrice || 0,
          productType: product.productType || '',
          metalName: product.ornate?.metalName || '',
          isOrnate: product.isOrnate,
          thumbnail: product.thumbnail || product.colorImages?.[0]?.images?.[0]?.url || '',
        });
      }
      return next;
    });
  };

  const isAllPageSelected = useMemo(() => {
    if (pickerProducts.length === 0) return false;
    return pickerProducts.every((p) => tempSelectedMap.has(String(p._id || p.id)));
  }, [pickerProducts, tempSelectedMap]);

  const handleToggleSelectAllPage = () => {
    setTempSelectedMap((prev) => {
      const next = new Map(prev);
      if (isAllPageSelected) {
        pickerProducts.forEach((p) => {
          next.delete(String(p._id || p.id));
        });
      } else {
        pickerProducts.forEach((p) => {
          const key = String(p._id || p.id);
          next.set(key, {
            _id: p._id,
            id: p._id,
            productId: p._id,
            title: p.title,
            subtitle: p.subtitle || p.metalName || '',
            sku: p.sku || '',
            price: p.price || p.salePrice || 0,
            productType: p.productType || '',
            metalName: p.metalName || '',
            isOrnate: p.isOrnate,
            thumbnail: p.thumbnail || p.colorImages?.[0]?.images?.[0]?.url || '',
          });
        });
      }
      return next;
    });
  };

  const handleApplyProductSelection = () => {
    const selectedList = Array.from(tempSelectedMap.values());
    setFormData((prev) => ({
      ...prev,
      selectedProducts: selectedList,
    }));
    setIsProductPickerOpen(false);
    toast.success(`${selectedList.length} product${selectedList.length === 1 ? '' : 's'} added to section`);
  };

  const handleRemoveSelectedProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: (prev.selectedProducts || []).filter(
        (p) => String(p._id || p.id || p.productId) !== String(productId)
      ),
    }));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSection(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      sectionKey: '',
      sectionType: 'product_carousel',
      placement: 'home_middle',
      order: sections.length + 1,
      status: 'active',
      visibility: {
        website: true,
        mobileApp: true,
      },
      badgeText: '',
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
      imagePublicId: '',
      selectedProducts: [],
      items: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sec) => {
    setEditingSection(sec);
    const loadedSelected = (sec.items || []).map((it) => ({
      _id: it.productId || it._id,
      id: it.productId || it._id,
      productId: it.productId,
      title: it.title,
      subtitle: it.subtitle,
      thumbnail: it.image?.url || it.imageUrl,
      sku: it.sku || '',
      price: it.price || 0,
      productType: it.productType || '',
      metalName: it.productType || '',
    }));

    setFormData({
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      sectionKey: sec.sectionKey || '',
      sectionType: sec.sectionType || 'product_carousel',
      placement: sec.placement || 'home_middle',
      order: sec.order || 0,
      status: sec.status || 'active',
      visibility: {
        website: sec.visibility?.website ?? true,
        mobileApp: sec.visibility?.mobileApp ?? true,
      },
      badgeText: sec.badgeText || '',
      buttonText: sec.buttonText || '',
      buttonLink: sec.buttonLink || '',
      imageUrl: sec.image?.url || '',
      imagePublicId: sec.image?.key || '',
      selectedProducts: loadedSelected,
      items: (sec.items || []).map((it) => ({ ...it })),
    });
    setIsModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (sec) => {
    setViewingSection(sec);
    setIsViewModalOpen(true);
  };

  // Toggle Status
  const handleToggleStatus = async (sec) => {
    const nextStatus = sec.status === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setSections((prev) =>
      prev.map((item) => (item._id === sec._id ? { ...item, status: nextStatus } : item))
    );

    try {
      await api.patch(`/home-sections/${sec._id}/toggle-status`);
      toast.success(`Section "${sec.title}" is now ${nextStatus}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
      fetchSections();
    }
  };

  // Quick Move Up / Down
  const handleMoveOrder = async (index, direction) => {
    const newItems = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    // Swap
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    const reorderPayload = newItems.map((item, idx) => ({
      id: item._id,
      order: idx + 1,
    }));

    // Optimistic
    setSections(newItems.map((item, idx) => ({ ...item, order: idx + 1 })));

    try {
      await api.put('/home-sections/reorder', { items: reorderPayload });
      toast.success('Display order updated');
    } catch (err) {
      console.error('Failed to reorder:', err);
      toast.error('Failed to reorder sections');
      fetchSections();
    }
  };

  // Delete Section
  const handleDelete = async (sec) => {
    const ok = await confirm({
      title: 'Delete Home Section',
      message: `Are you sure you want to delete "${sec.title}"? This section will be removed from the storefront.`,
      confirmText: 'Delete',
      confirmColor: 'red',
    });
    if (!ok) return;

    try {
      await api.delete(`/home-sections/${sec._id}`);
      toast.success('Section deleted successfully');
      setSections((prev) => prev.filter((item) => item._id !== sec._id));
    } catch (err) {
      console.error('Failed to delete section:', err);
      toast.error('Failed to delete section');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Bulk Delete Sections',
      message: `Are you sure you want to delete ${selectedIds.length} sections?`,
      confirmText: 'Delete Selected',
      confirmColor: 'red',
    });
    if (!ok) return;

    try {
      await api.post('/home-sections/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} sections deleted`);
      setSelectedIds([]);
      fetchSections();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete sections');
    }
  };

  // Main Image Upload
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(15);
      const res = await uploadWithPresignedUrl(file, 'home-sections', (prog) => {
        setUploadProgress(prog);
      });
      setFormData((prev) => ({
        ...prev,
        imageUrl: res.url,
        imagePublicId: res.key || '',
      }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Save / Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      setSubmitting(true);
      const mappedItems = (formData.selectedProducts || []).map((p, idx) => ({
        productId: p._id || p.id || p.productId || null,
        title: p.title || '',
        subtitle: p.subtitle || p.metalName || '',
        sku: p.sku || '',
        price: Number(p.price || 0),
        productType: p.productType || '',
        image: { url: p.thumbnail || p.imageUrl || '', key: '' },
        linkUrl: `/products/${p._id || p.id || p.productId}`,
        order: idx + 1,
        badge: p.badge || '',
        buttonText: 'View Details',
      }));

      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        sectionKey: formData.sectionKey.trim() || slugify(formData.title),
        sectionType: formData.sectionType || 'product_carousel',
        placement: formData.placement || 'home_middle',
        order: Number(formData.order) || 0,
        status: formData.status || 'active',
        visibility: {
          website: Boolean(formData.visibility?.website),
          mobileApp: Boolean(formData.visibility?.mobileApp),
        },
        badgeText: formData.badgeText.trim(),
        buttonText: formData.buttonText.trim(),
        buttonLink: formData.buttonLink.trim(),
        image: {
          url: formData.imageUrl?.trim() || '',
          key: formData.imagePublicId?.trim() || '',
        },
        items: mappedItems.length > 0 ? mappedItems : formData.items,
      };

      if (editingSection) {
        await api.put(`/home-sections/${editingSection._id}`, payload);
        toast.success('Home section updated successfully');
      } else {
        await api.post('/home-sections', payload);
        toast.success('Home section created successfully');
      }

      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      console.error('Failed to save section:', err);
      toast.error(err.response?.data?.message || 'Failed to save section');
    } finally {
      setSubmitting(false);
    }
  };


  // Open Reorder Modal
  const handleOpenReorderModal = () => {
    setReorderingItems(sections.map((s, idx) => ({ ...s, newOrder: idx + 1 })));
    setIsReorderModalOpen(true);
  };

  const handleSaveBulkReorder = async () => {
    try {
      setSavingReorder(true);
      const payload = reorderingItems.map((item, idx) => ({
        id: item._id,
        order: idx + 1,
      }));
      await api.put('/home-sections/reorder', { items: payload });
      toast.success('Sections order saved');
      setIsReorderModalOpen(false);
      fetchSections();
    } catch (err) {
      toast.error('Failed to reorder sections');
    } finally {
      setSavingReorder(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Marketing', 'Home Sections']}
        title="Home Sections"
        subtitle="Organize, curate, and reorder dynamic homepage sections and marketing banners."
        onAdd={handleOpenAdd}
        addLabel="Add Section"
        exportData={sections}
        exportFileName="home_sections_export"
        extraActions={
          <button
            type="button"
            onClick={handleOpenReorderModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlineSwitchHorizontal className="w-3.5 h-3.5 text-[#8b6f4e]" />
            <span>Reorder</span>
          </button>
        }
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filters Bar (Single Slim Row, Space-Saving) ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex-1">
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search sections by title, slug, or subtitle..."
            onFilterClick={() => setShowTypeDrawer((prev) => !prev)}
            filterActive={typeFilter !== 'all' || placementFilter !== 'all' || statusFilter !== 'all' || showTypeDrawer}
            extraActions={
              <button
                type="button"
                onClick={handleBulkDelete}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
                  selectedIds.length > 0
                    ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                    : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
                }`}
                title={
                  selectedIds.length > 0
                    ? `Delete ${selectedIds.length} selected section${selectedIds.length > 1 ? 's' : ''}`
                    : 'Select sections to delete'
                }
              >
                <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
                <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
              </button>
            }
          />
        </div>

        {/* Compact Dropdown Filters Row */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Dropdown
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: 'all', label: 'All Types' },
              ...SECTION_TYPES.map((t) => ({ value: t.value, label: t.label })),
            ]}
            size="sm"
            placeholder="All Types"
            buttonClassName="h-7.5 px-2.5 rounded-md text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 shadow-2xs"
          />

          <Dropdown
            value={placementFilter}
            onChange={(val) => setPlacementFilter(val)}
            options={[
              { value: 'all', label: 'All Placements' },
              { value: 'home_top', label: 'Home Top' },
              { value: 'home_middle', label: 'Home Middle' },
              { value: 'home_bottom', label: 'Home Bottom' },
            ]}
            size="sm"
            placeholder="All Placements"
            buttonClassName="h-7.5 px-2.5 rounded-md text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 shadow-2xs"
          />

          <Dropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active', dotColor: 'bg-emerald-500' },
              { value: 'inactive', label: 'Inactive', dotColor: 'bg-stone-400' },
            ]}
            showStatusDot
            size="sm"
            placeholder="All Status"
            buttonClassName="h-7.5 px-2.5 rounded-md text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 shadow-2xs"
          />
        </div>
      </div>

      {/* Optional Quick Type Chips Drawer (Toggled by Filters button) */}
      {showTypeDrawer && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs animate-fadeIn">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 shrink-0">
            Type:
          </span>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
              typeFilter === 'all'
                ? 'bg-[#8b6f4e] text-white border-[#8b6f4e] shadow-2xs'
                : 'bg-white text-stone-600 border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            All ({sections.length})
          </button>
          {SECTION_TYPES.map((t) => {
            const count = sections.filter((s) => s.sectionType === t.value).length;
            const isSelected = typeFilter === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTypeFilter(isSelected ? 'all' : t.value)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-white text-stone-600 border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <span>{t.label}</span>
                {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Main Sections Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Loading home sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="py-14 text-center">
            <HiOutlineTemplate className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-stone-800">No home sections found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-2 pl-4 pr-1 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        (paginatedSections || []).length > 0 &&
                        (paginatedSections || []).every((s) => selectedIds.includes(s._id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = (paginatedSections || []).map((s) => s._id);
                          setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
                        } else {
                          const pageIds = (paginatedSections || []).map((s) => s._id);
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-2 px-2 text-center w-14 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    ORDER
                  </th>
                  <th className="py-2 px-3 whitespace-nowrap">SECTION DETAILS</th>
                  <th className="py-2 px-3 whitespace-nowrap">SECTION TYPE</th>
                  <th className="py-2 px-3 whitespace-nowrap">PLACEMENT</th>
                  <th className="py-2 px-3 text-center whitespace-nowrap">ITEMS</th>
                  <th className="py-2 px-3 text-center whitespace-nowrap">STATUS</th>
                  <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {(paginatedSections || []).map((sec) => {
                  const globalIdx = sections.findIndex((s) => s._id === sec._id);
                  const typeObj = SECTION_TYPES.find((t) => t.value === sec.sectionType) || {
                    label: sec.sectionType,
                    icon: HiOutlineTemplate,
                  };
                  const TypeIcon = typeObj.icon;
                  const isSelected = selectedIds.includes(sec._id);

                  return (
                    <tr
                      key={sec._id}
                      onClick={() => handleOpenView(sec)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, sec._id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== sec._id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Order Controls */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 text-center font-bold text-stone-700 font-mono text-[11px]">
                            {sec.order || globalIdx + 1}
                          </span>
                          <div className="flex flex-col -space-y-1">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(globalIdx, 'up')}
                              disabled={globalIdx === 0}
                              title="Move up"
                              className="text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer p-0.5"
                            >
                              <HiOutlineArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(globalIdx, 'down')}
                              disabled={globalIdx === sections.length - 1}
                              title="Move down"
                              className="text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer p-0.5"
                            >
                              <HiOutlineArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Section Details */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {/* Compact Thumbnail */}
                          <div className="w-8 h-8 rounded-md bg-stone-100 border border-stone-200/80 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs">
                            {sec.image?.url ? (
                              <img
                                src={sec.image.url}
                                alt={sec.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : sec.items?.[0]?.image?.url ? (
                              <img
                                src={sec.items[0].image.url}
                                alt={sec.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <TypeIcon className="w-4 h-4 text-[#8b6f4e]/60" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-stone-900 text-xs truncate">
                                {sec.title}
                              </span>
                              {sec.badgeText && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                                  {sec.badgeText}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <code className="text-[10px] text-[#8b6f4e] bg-[#faf3e8] px-1 py-0.2 rounded font-mono font-medium">
                                #{sec.sectionKey}
                              </code>
                              {sec.visibility && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                                  {sec.visibility.website !== false && <span>Web</span>}
                                  {sec.visibility.website !== false && sec.visibility.mobileApp !== false && <span className="text-stone-300">/</span>}
                                  {sec.visibility.mobileApp !== false && <span>App</span>}
                                </span>
                              )}
                              {sec.subtitle && (
                                <span className="text-[11px] text-stone-400 truncate max-w-xs">
                                  {sec.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Section Type Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100/90 text-stone-700 border border-stone-200/80 shadow-2xs">
                          <TypeIcon className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                          <span>{typeObj.label}</span>
                        </span>
                      </td>

                      {/* Placement */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-md bg-stone-100/80 text-stone-600 border border-stone-200/50">
                          {sec.placement?.replace('home_', '') || 'Middle'}
                        </span>
                      </td>

                      {/* Items Count */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf3e8] text-[#8b6f4e] border border-[#8b6f4e]/20 shadow-2xs">
                          {sec.items?.length || 0} items
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(sec)}
                            className={`relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              sec.status === 'active' ? 'bg-[#16a34a]' : 'bg-stone-300'
                            }`}
                            title={`Click to mark ${sec.status === 'active' ? 'Inactive' : 'Active'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                sec.status === 'active' ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${sec.status === 'active' ? 'text-emerald-600' : 'text-stone-400'}`}>
                            {sec.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          onView={() => handleOpenView(sec)}
                          onEdit={() => handleOpenEdit(sec)}
                          onDelete={() => handleDelete(sec)}
                          viewTitle="Preview Section"
                          editTitle="Edit Section"
                          deleteTitle="Delete Section"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Luxury Common Pagination ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="sections"
        />
      </div>

      {/* ─── Add / Edit Home Section Modal (Screenshot 1) ───────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200/80 shadow-2xl w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100 bg-white">
              <div>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                  {editingSection ? 'Edit Home Section' : 'Create Home Section'}
                </h2>
                <p className="text-[11px] font-bold tracking-widest text-[#8b6f4e] uppercase mt-0.5">
                  HOMEPAGE CURATED PRODUCTS
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Row 1: Section Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                    SECTION TITLE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: val,
                        sectionKey: prev.sectionKey ? prev.sectionKey : slugify(val),
                      }));
                    }}
                    placeholder="e.g. Trending Lab Grown Diamonds"
                    className="w-full text-xs bg-white border border-[#d6cfc2] rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                    TAGLINE / SUBTITLE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. Handcrafted luxury for every celebration"
                    className="w-full text-xs bg-white border border-[#d6cfc2] rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Platform Visibility */}
              <div className="border border-stone-200/90 rounded-2xl p-4 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  PLATFORM VISIBILITY
                </span>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.visibility?.website ?? true}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: { ...prev.visibility, website: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer accent-[#8b6f4e]"
                    />
                    <span>Web</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.visibility?.mobileApp ?? true}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: { ...prev.visibility, mobileApp: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer accent-[#8b6f4e]"
                    />
                    <span>App</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Selected Products Header */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      SELECTED PRODUCTS ({formData.selectedProducts?.length || 0})
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formData.selectedProducts?.length > 0
                        ? 'Manage or pick additional products for this section.'
                        : 'Pick products with pagination to feature in this section.'}
                    </p>
                  </div>
                  {formData.selectedProducts?.length > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenProductPicker}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Browse & Select Products</span>
                    </button>
                  )}
                </div>

                {/* Product Container: Empty state vs Selected Products list */}
                {(!formData.selectedProducts || formData.selectedProducts.length === 0) ? (
                  <div className="border-2 border-dashed border-stone-200/90 rounded-2xl p-8 sm:p-12 text-center bg-stone-50/30">
                    <div className="w-12 h-12 rounded-full bg-[#f6efe6] text-[#8b6f4e] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <IoLayersOutline className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-800 mb-1">
                      No products added yet
                    </h4>
                    <p className="text-xs text-stone-500 max-w-md mx-auto mb-5 leading-relaxed">
                      Open the product catalog pop-up to search, browse by page, and checkmark products to show in this section.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenProductPicker}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Browse & Select Products</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-stone-200/90 rounded-2xl p-4 bg-stone-50/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                      {formData.selectedProducts.map((prod, idx) => (
                        <div
                          key={prod._id || prod.id || idx}
                          className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs group relative hover:border-[#8b6f4e] transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {prod.thumbnail || prod.imageUrl ? (
                              <img
                                src={prod.thumbnail || prod.imageUrl}
                                alt={prod.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <IoDiamondOutline className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-stone-400 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-[9px] font-bold text-[#8b6f4e] bg-[#faf3e8] px-1.5 py-0.2 rounded uppercase">
                                {getProductBadgeLabel(prod)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-stone-800 truncate mt-0.5" title={prod.title}>
                              {prod.title}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                              <span className="font-bold text-stone-900">
                                ₹{Number(prod.price || prod.salePrice || 0).toLocaleString('en-IN')}
                              </span>
                              {prod.sku && (
                                <span className="text-[10px] font-mono text-stone-400 truncate max-w-[80px]">
                                  {prod.sku}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedProduct(prod._id || prod.id || prod.productId)}
                            className="w-6 h-6 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Remove product"
                          >
                            <HiOutlineX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Section Settings Accordion */}
              <div className="pt-2">
                <details className="group border border-stone-200/70 rounded-xl bg-stone-50/30 p-3">
                  <summary className="text-[11px] font-bold text-stone-600 hover:text-[#8b6f4e] cursor-pointer list-none flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HiOutlineFilter className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      <span>Advanced Settings (Placement, Identifier Slug, Status)</span>
                    </span>
                    <span className="text-[10px] text-stone-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-2 border-t border-stone-200/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Identifier Slug (Unique)
                      </label>
                      <input
                        type="text"
                        value={formData.sectionKey}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, sectionKey: slugify(e.target.value) }))
                        }
                        placeholder="e.g. trending-lab-grown"
                        className="w-full text-xs font-mono bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Placement</label>
                      <Dropdown
                        value={formData.placement}
                        onChange={(val) => setFormData((prev) => ({ ...prev, placement: val }))}
                        options={PLACEMENT_OPTIONS.map((p) => ({
                          value: p.value,
                          label: p.label,
                        }))}
                        size="sm"
                        buttonClassName="w-full h-9 rounded-lg text-xs bg-white border-stone-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Status</label>
                      <Dropdown
                        value={formData.status}
                        onChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                        options={[
                          { value: 'active', label: 'Active (Live)', dotColor: 'bg-emerald-500' },
                          { value: 'inactive', label: 'Inactive (Draft)', dotColor: 'bg-stone-400' },
                        ]}
                        showStatusDot
                        size="sm"
                        buttonClassName="w-full h-9 rounded-lg text-xs bg-white border-stone-200"
                      />
                    </div>
                  </div>
                </details>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-200 text-stone-700 bg-white rounded-xl text-xs font-semibold hover:bg-stone-50 cursor-pointer shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#8b6f4e] hover:bg-[#785e40] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Product Picker Modal (Screenshot 2) ───────────────────────── */}
      {isProductPickerOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
          onClick={() => setIsProductPickerOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default relative z-[71]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Picker Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">
                    Select Products for Homepage Section
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8b6f4e] text-white shadow-2xs">
                    {tempSelectedMap.size} Selected
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Search and select products across pages. Selections stay saved when navigating pages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="w-8 h-8 rounded-full border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/40 space-y-3">
              {/* Category Tabs: Gold, Silver, Ornate Products, All Products */}
              <div className="flex flex-wrap items-center gap-2">
                {PRODUCT_PICKER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pickerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setPickerTab(tab.id);
                        setPickerPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#8b6f4e] text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#8b6f4e]'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search, Select All Page, and Show Limit */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => {
                      setPickerSearch(e.target.value);
                      setPickerPage(1);
                    }}
                    placeholder="Search Jewelry by title or SKU..."
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllPage}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                      isAllPageSelected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <HiOutlineCheck className={`w-3.5 h-3.5 ${isAllPageSelected ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <span>{isAllPageSelected ? 'Deselect Page' : 'Select All Page'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="text-[11px] font-bold text-stone-400 uppercase">SHOW</span>
                    <select
                      value={pickerLimit}
                      onChange={(e) => {
                        setPickerLimit(Number(e.target.value));
                        setPickerPage(1);
                      }}
                      className="bg-white border border-stone-200 rounded-xl px-2 py-1.5 text-xs text-stone-800 font-semibold focus:outline-none focus:border-[#8b6f4e] cursor-pointer shadow-2xs"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50/20">
              {pickerLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-stone-400 gap-2">
                  <div className="w-8 h-8 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Loading catalog pieces...</span>
                </div>
              ) : pickerProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <IoDiamondOutline className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-stone-800">No products found</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Try adjusting your search query or selecting a different jewelry category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {pickerProducts.map((prod) => {
                    const isSelected = tempSelectedMap.has(String(prod._id || prod.id));
                    const badge = getProductBadgeLabel(prod);
                    return (
                      <div
                        key={prod._id || prod.id}
                        onClick={() => handleToggleProductSelection(prod)}
                        className={`relative flex flex-col p-2.5 rounded-2xl bg-white border transition-all cursor-pointer select-none group shadow-2xs ${
                          isSelected
                            ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/30 bg-[#faf6f0]'
                            : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Top card row: Checkbox and Category Badge */}
                        <div className="flex items-center justify-between mb-1">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <HiOutlineCheck className="w-3 h-3 stroke-2" />}
                          </div>
                          <span className="text-[9px] font-bold text-[#8b6f4e] tracking-wider uppercase">
                            {badge}
                          </span>
                        </div>

                        {/* Product Image */}
                        <div className="h-28 flex items-center justify-center p-1.5 my-1 overflow-hidden">
                          {prod.thumbnail || prod.colorImages?.[0]?.images?.[0]?.url ? (
                            <img
                              src={prod.thumbnail || prod.colorImages?.[0]?.images?.[0]?.url}
                              alt={prod.title}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <IoDiamondOutline className="w-8 h-8 text-stone-300" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="mt-auto pt-1">
                          <h5
                            className="text-[11px] font-semibold text-stone-800 line-clamp-2 leading-tight"
                            title={prod.title}
                          >
                            {prod.title}
                          </h5>
                          <p className="text-xs font-bold text-stone-900 mt-1">
                            ₹{Number(prod.price || prod.salePrice || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                            SKU: {prod.sku || 'N/A'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-3 border-t border-stone-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs text-stone-500 font-medium">
                Showing {pickerProducts.length > 0 ? (pickerPage - 1) * pickerLimit + 1 : 0} to{' '}
                {Math.min(pickerPage * pickerLimit, pickerPagination.totalDocs || pickerProducts.length)} of{' '}
                {pickerPagination.totalDocs || pickerProducts.length} pieces
              </span>

              {pickerPagination.totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pickerPage <= 1}
                    onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 flex items-center justify-center text-xs cursor-pointer"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(5, pickerPagination.totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (pickerPagination.totalPages > 5 && pickerPage > 3) {
                      pageNum = pickerPage - 2 + i;
                      if (pageNum > pickerPagination.totalPages) {
                        pageNum = pickerPagination.totalPages - 4 + i;
                      }
                    }
                    const isCurrent = pageNum === pickerPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPickerPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#8b6f4e] text-white shadow-2xs'
                            : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={pickerPage >= pickerPagination.totalPages}
                    onClick={() => setPickerPage((p) => p + 1)}
                    className="w-7 h-7 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 flex items-center justify-center text-xs cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                <strong className="text-stone-900">SELECTED ({tempSelectedMap.size}):</strong>{' '}
                <span className="text-stone-500 font-normal">
                  {tempSelectedMap.size === 0 ? 'No products chosen yet' : `${tempSelectedMap.size} product${tempSelectedMap.size > 1 ? 's' : ''} chosen across tabs`}
                </span>
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 bg-white rounded-xl text-xs font-semibold hover:bg-stone-50 cursor-pointer shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyProductSelection}
                  className="px-5 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Apply Selection ({tempSelectedMap.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ─── Preview / View Modal ────────────────────────────── */}
      {isViewModalOpen && viewingSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f4e] bg-[#faf3e8] px-2 py-0.5 rounded">
                  {viewingSection.sectionType}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  {viewingSection.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {viewingSection.image?.url && (
                <div className="rounded-xl overflow-hidden border border-stone-200 max-h-56">
                  <img
                    src={viewingSection.image.url}
                    alt={viewingSection.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Slug Key</span>
                  <p className="font-mono font-bold text-stone-800">#{viewingSection.sectionKey}</p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Placement</span>
                  <p className="font-semibold text-stone-800">{viewingSection.placement}</p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Status</span>
                  <p className="font-semibold text-stone-800 uppercase">{viewingSection.status}</p>
                </div>
              </div>

              {viewingSection.subtitle && (
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Subtitle</span>
                  <p className="text-stone-700 mt-0.5">{viewingSection.subtitle}</p>
                </div>
              )}

              {viewingSection.description && (
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Description</span>
                  <p className="text-stone-700 mt-0.5">{viewingSection.description}</p>
                </div>
              )}

              {/* Platform Visibility Status */}
              <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-stone-500 text-xs font-semibold">Visibility:</span>
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${viewingSection.visibility?.website !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                  Web {viewingSection.visibility?.website !== false ? '✓' : '✗'}
                </span>
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${viewingSection.visibility?.mobileApp !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                  App {viewingSection.visibility?.mobileApp !== false ? '✓' : '✗'}
                </span>
              </div>

              {viewingSection.items && viewingSection.items.length > 0 && (
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">
                    Curated Products ({viewingSection.items.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {viewingSection.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs"
                      >
                        <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          {item.image?.url ? (
                            <img
                              src={item.image?.url}
                              alt={item.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <IoDiamondOutline className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-stone-400 font-mono">#{idx + 1}</span>
                            {item.productType && (
                              <span className="text-[9px] font-bold text-[#8b6f4e] bg-[#faf3e8] px-1 py-0.2 rounded uppercase">
                                {item.productType}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-stone-900 text-xs truncate mt-0.5">{item.title}</p>
                          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                            {item.price > 0 && (
                              <span className="font-bold text-stone-900">
                                ₹{Number(item.price).toLocaleString('en-IN')}
                              </span>
                            )}
                            {item.sku && (
                              <span className="text-[10px] font-mono text-stone-400 truncate max-w-[80px]">
                                {item.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(viewingSection);
                }}
                className="px-4 py-2 bg-[#8b6f4e] text-white rounded-lg text-xs font-semibold hover:bg-[#785e40] cursor-pointer"
              >
                Edit Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Visual Reorder Modal ────────────────────────────── */}
      {isReorderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsReorderModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900">
                Reorder Storefront Sections
              </h3>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
              <p className="text-stone-500 text-[11px] mb-2">
                Use arrows to adjust the visual appearance sequence on the homepage.
              </p>
              {reorderingItems.map((item, idx) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#faf3e8] text-[#8b6f4e] font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-stone-800 truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const next = [...reorderingItems];
                        const temp = next[idx];
                        next[idx] = next[idx - 1];
                        next[idx - 1] = temp;
                        setReorderingItems(next);
                      }}
                      className="w-6 h-6 rounded bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <HiOutlineArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === reorderingItems.length - 1}
                      onClick={() => {
                        const next = [...reorderingItems];
                        const temp = next[idx];
                        next[idx] = next[idx + 1];
                        next[idx + 1] = temp;
                        setReorderingItems(next);
                      }}
                      className="w-6 h-6 rounded bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <HiOutlineArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingReorder}
                onClick={handleSaveBulkReorder}
                className="px-4 py-1.5 bg-[#8b6f4e] text-white rounded-lg text-xs font-semibold hover:bg-[#785e40] cursor-pointer"
              >
                {savingReorder ? 'Saving...' : 'Save Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
