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
  HiOutlineRefresh,
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // Form State
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'media' | 'items'
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    sectionKey: '',
    sectionType: 'hero_slider',
    placement: 'home_middle',
    order: 0,
    status: 'active',
    badgeText: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    imagePublicId: '',
    items: [],
  });

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Reorder State
  const [reorderingItems, setReorderingItems] = useState([]);
  const [savingReorder, setSavingReorder] = useState(false);

  // Fetch sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/home-sections?limit=100');
      const items = res.data?.data?.items || res.data?.data || [];
      setSections(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load home sections:', err);
      toast.error('Failed to load home sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

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
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalItems,
    setPageSize,
  } = usePagination(filteredSections, 10);

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

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSection(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      sectionKey: '',
      sectionType: 'hero_slider',
      placement: 'home_middle',
      order: sections.length + 1,
      status: 'active',
      badgeText: '',
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
      imagePublicId: '',
      items: [],
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sec) => {
    setEditingSection(sec);
    setFormData({
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      sectionKey: sec.sectionKey || '',
      sectionType: sec.sectionType || 'custom_content',
      placement: sec.placement || 'home_middle',
      order: sec.order || 0,
      status: sec.status || 'active',
      badgeText: sec.badgeText || '',
      buttonText: sec.buttonText || '',
      buttonLink: sec.buttonLink || '',
      imageUrl: sec.image?.url || '',
      imagePublicId: sec.image?.public_id || '',
      items: (sec.items || []).map((it) => ({ ...it })),
    });
    setActiveTab('basic');
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

  // Reset / Seed Defaults
  const handleSeedDefaults = async () => {
    const ok = await confirm({
      title: 'Seed Default Home Sections',
      message: 'This will seed recommended luxury jewelry homepage sections (Hero Slider, Categories, Most Loved, Custom Atelier, Testimonials). Continue?',
      confirmText: 'Seed Defaults',
      confirmColor: 'bronze',
    });
    if (!ok) return;

    try {
      await api.post('/home-sections/seed');
      toast.success('Default home sections seeded successfully!');
      fetchSections();
    } catch (err) {
      console.error('Failed to seed defaults:', err);
      toast.error('Failed to seed default sections');
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
        imagePublicId: res.public_id || '',
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

  // Repeater Items handlers
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          title: '',
          subtitle: '',
          description: '',
          imageUrl: '',
          imagePublicId: '',
          linkUrl: '',
          badge: '',
          buttonText: '',
          order: prev.items.length + 1,
          rating: 5,
          authorName: '',
          authorLocation: '',
        },
      ],
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemImageUpload = async (index, file) => {
    if (!file) return;
    try {
      const res = await uploadWithPresignedUrl(file, 'home-sections');
      handleUpdateItem(index, 'imageUrl', res.url);
      handleUpdateItem(index, 'imagePublicId', res.public_id || '');
      toast.success('Item image uploaded');
    } catch (err) {
      toast.error('Failed to upload item image');
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
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        sectionKey: formData.sectionKey.trim() || slugify(formData.title),
        sectionType: formData.sectionType,
        placement: formData.placement,
        order: Number(formData.order) || 0,
        status: formData.status,
        badgeText: formData.badgeText.trim(),
        buttonText: formData.buttonText.trim(),
        buttonLink: formData.buttonLink.trim(),
        image: {
          url: formData.imageUrl.trim(),
          public_id: formData.imagePublicId.trim(),
        },
        items: formData.items.map((it, idx) => ({
          ...it,
          order: it.order || idx + 1,
        })),
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
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4 text-stone-800">
      {/* ─── Header ────────────────────────────────────────── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Marketing', 'Home Sections']}
        title="Home Sections"
        subtitle="Organize, curate, and reorder dynamic homepage sections and marketing banners."
        onAdd={handleOpenAdd}
        addLabel="Add Section"
        extraActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenReorderModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <HiOutlineSwitchHorizontal className="w-3.5 h-3.5 text-[#8b6f4e]" />
              <span>Reorder</span>
            </button>
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Seed or restore default curated sections"
            >
              <HiOutlineRefresh className="w-3.5 h-3.5 text-stone-500" />
              <span>Reset Defaults</span>
            </button>
          </div>
        }
      />

      {/* ─── Luxury Stat Cards ─────────────────────────────── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 shadow-2xs space-y-2.5">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search sections by title, slug, or subtitle..."
          extraActions={
            selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <HiOutlineTrash className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )
          }
        />

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100 text-xs">
          <span className="text-stone-400 font-medium text-[11px] uppercase tracking-wider">Type:</span>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-[#8b6f4e] text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Types
          </button>
          {SECTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                typeFilter === t.value
                  ? 'bg-[#8b6f4e] text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Placement selector */}
          <div className="ml-auto flex items-center gap-2">
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
              buttonClassName="h-8 px-2.5 rounded-lg text-xs font-medium text-stone-700 bg-white border-stone-200"
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
              buttonClassName="h-8 px-2.5 rounded-lg text-xs font-medium text-stone-700 bg-white border-stone-200"
            />
          </div>
        </div>
      </div>

      {/* ─── Main Sections Luxury Table ────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-medium">Loading home sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="py-16 text-center">
            <HiOutlineTemplate className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No home sections found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Click "Add Section" or "Reset Defaults" to populate your storefront.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 bg-[#8b6f4e] text-white rounded-lg text-xs font-semibold hover:bg-[#785e40] transition-colors cursor-pointer"
              >
                Add New Section
              </button>
              <button
                type="button"
                onClick={handleSeedDefaults}
                className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Reset Default Sections
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/90 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-8 text-center">
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
                      className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-16 text-center">Order</th>
                  <th className="py-3 px-4 min-w-[220px]">Section Details</th>
                  <th className="py-3 px-4 min-w-[150px]">Section Type</th>
                  <th className="py-3 px-3">Placement</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {(paginatedSections || []).map((sec, idx) => {
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
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
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
                          className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                        />
                      </td>

                      {/* Order Controls */}
                      <td className="py-3 px-3 text-center">
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="w-12 h-10 rounded-lg bg-stone-100 border border-stone-200/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {sec.image?.url ? (
                              <img
                                src={sec.image.url}
                                alt={sec.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : sec.items?.[0]?.imageUrl ? (
                              <img
                                src={sec.items[0].imageUrl}
                                alt={sec.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <TypeIcon className="w-5 h-5 text-[#8b6f4e]/60" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900 truncate">
                                {sec.title}
                              </span>
                              {sec.badgeText && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                                  {sec.badgeText}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="text-[10px] text-[#8b6f4e] bg-[#faf3e8] px-1.5 py-0.5 rounded font-mono">
                                #{sec.sectionKey}
                              </code>
                              {sec.subtitle && (
                                <span className="text-[11px] text-stone-400 truncate max-w-[180px]">
                                  {sec.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200/80 text-stone-700 font-medium text-[11px]">
                          <TypeIcon className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                          <span className="truncate max-w-[130px]">{typeObj.label}</span>
                        </div>
                      </td>

                      {/* Placement */}
                      <td className="py-3 px-3">
                        <span className="capitalize text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                          {sec.placement?.replace('home_', '') || 'Middle'}
                        </span>
                      </td>

                      {/* Items Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf3e8] text-[#8b6f4e] border border-[#8b6f4e]/20">
                          {sec.items?.length || 0} items
                        </span>
                      </td>

                      {/* Interactive Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sec)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            sec.status === 'active' ? 'bg-[#16a34a]' : 'bg-stone-300'
                          }`}
                          title={`Click to mark ${sec.status === 'active' ? 'Inactive' : 'Active'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              sec.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <div className="text-[9px] font-semibold uppercase tracking-wider text-stone-400 mt-0.5">
                          {sec.status}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
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

        {/* ─── Pagination ───────────────────────────────────── */}
        {filteredSections.length > 0 && (
          <div className="p-3 border-t border-stone-200 bg-stone-50/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="sections"
            />
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div>
                <h2 className="text-base font-bold text-stone-900 font-serif">
                  {editingSection ? `Edit Section: ${editingSection.title}` : 'Create New Home Section'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure storefront section metadata, banner media, and content cards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-stone-200 px-6 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'basic'
                    ? 'border-[#8b6f4e] text-[#8b6f4e]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                1. General Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'media'
                    ? 'border-[#8b6f4e] text-[#8b6f4e]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                2. Featured Media & CTA
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'items'
                    ? 'border-[#8b6f4e] text-[#8b6f4e]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>3. Content Cards / Slides</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-100 font-mono">
                  {formData.items.length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Section Title <span className="text-red-500">*</span>
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
                        placeholder="e.g. Curated Solitaires & Rings"
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Identifier Key (Slug) <span className="text-stone-400 font-normal">unique</span>
                      </label>
                      <input
                        type="text"
                        value={formData.sectionKey}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, sectionKey: slugify(e.target.value) }))
                        }
                        placeholder="e.g. curated-solitaires"
                        className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="e.g. Handcrafted In 18K Hallmarked Gold"
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Section Type
                      </label>
                      <Dropdown
                        value={formData.sectionType}
                        onChange={(val) => setFormData((prev) => ({ ...prev, sectionType: val }))}
                        options={SECTION_TYPES.map((t) => ({
                          value: t.value,
                          label: t.label,
                          sublabel: t.desc,
                          icon: t.icon,
                        }))}
                        size="sm"
                        buttonClassName="w-full h-9 rounded-lg text-xs bg-white border-stone-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Placement</label>
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
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
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

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Editorial Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief story, promotional highlights or collection description..."
                      className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: MEDIA & CTA */}
              {activeTab === 'media' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Image Upload Box */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Featured Background or Header Banner
                    </label>
                    <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center hover:border-[#8b6f4e] transition-colors bg-stone-50/50">
                      {formData.imageUrl ? (
                        <div className="space-y-2">
                          <img
                            src={formData.imageUrl}
                            alt="Banner Preview"
                            className="max-h-48 mx-auto rounded-lg object-contain shadow-xs border border-stone-200"
                          />
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData((p) => ({ ...p, imageUrl: '', imagePublicId: '' }))}
                              className="px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium cursor-pointer"
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <HiOutlinePhotograph className="w-10 h-10 text-stone-400 mx-auto" />
                          <p className="text-xs text-stone-600 font-medium">
                            Drag & drop or choose high-resolution jewelry banner
                          </p>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                            <HiOutlineUpload className="w-4 h-4" />
                            <span>{uploading ? `Uploading (${uploadProgress}%)` : 'Select Image File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploading}
                              onChange={handleMainImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <label className="block text-[11px] text-stone-400 mb-0.5">
                        Or enter direct Image URL:
                      </label>
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                        placeholder="https://... or /banners/hero_timeless.jpg"
                        className="w-full text-xs font-mono bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>
                  </div>

                  {/* Badges and CTA buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Pill Badge Text
                      </label>
                      <input
                        type="text"
                        value={formData.badgeText}
                        onChange={(e) => setFormData((p) => ({ ...p, badgeText: e.target.value }))}
                        placeholder="e.g. LIMITED EDITION"
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={(e) => setFormData((p) => ({ ...p, buttonText: e.target.value }))}
                        placeholder="e.g. Explore Collection"
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Button Link URL
                      </label>
                      <input
                        type="text"
                        value={formData.buttonLink}
                        onChange={(e) => setFormData((p) => ({ ...p, buttonLink: e.target.value }))}
                        placeholder="e.g. /shop?category=rings"
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTENT CARDS / ITEMS REPEATER */}
              {activeTab === 'items' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Curated Cards, Tiles & Slides ({formData.items.length})
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Add individual cards with images, captions, and links for this section.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Add Card</span>
                    </button>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-stone-200 rounded-xl">
                      <IoCubeOutline className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs text-stone-500">No cards added to this section yet.</p>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-2 text-xs font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                      >
                        + Click here to add your first item card
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-stone-50/70 border border-stone-200 rounded-xl p-3.5 space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-800 font-mono">
                              Card #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                              title="Delete card"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                Card Title
                              </label>
                              <input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                                placeholder="e.g. Diamond Pendant"
                                className="w-full text-xs bg-white border border-stone-200 rounded-md px-2.5 py-1.5"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                Subtitle / Tagline
                              </label>
                              <input
                                type="text"
                                value={item.subtitle || ''}
                                onChange={(e) => handleUpdateItem(index, 'subtitle', e.target.value)}
                                placeholder="e.g. 18K Solitaire Setting"
                                className="w-full text-xs bg-white border border-stone-200 rounded-md px-2.5 py-1.5"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                Target Link URL
                              </label>
                              <input
                                type="text"
                                value={item.linkUrl || ''}
                                onChange={(e) => handleUpdateItem(index, 'linkUrl', e.target.value)}
                                placeholder="e.g. /shop?category=pendant"
                                className="w-full text-xs bg-white border border-stone-200 rounded-md px-2.5 py-1.5"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                Image URL or File
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.imageUrl || ''}
                                  onChange={(e) => handleUpdateItem(index, 'imageUrl', e.target.value)}
                                  placeholder="/featured/necklace.jpg or https://..."
                                  className="flex-1 text-xs bg-white border border-stone-200 rounded-md px-2.5 py-1.5 font-mono"
                                />
                                <label className="px-2 py-1.5 bg-stone-200 hover:bg-stone-300 rounded text-[11px] font-semibold text-stone-700 cursor-pointer shrink-0">
                                  <span>Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleItemImageUpload(index, e.target.files?.[0])}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                                Badge / Pill
                              </label>
                              <input
                                type="text"
                                value={item.badge || ''}
                                onChange={(e) => handleUpdateItem(index, 'badge', e.target.value)}
                                placeholder="e.g. NEW or 20% OFF"
                                className="w-full text-xs bg-white border border-stone-200 rounded-md px-2.5 py-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {activeTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(activeTab === 'items' ? 'media' : 'basic')
                      }
                      className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {activeTab !== 'items' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(activeTab === 'basic' ? 'media' : 'items')
                      }
                      className="px-4 py-2 bg-[#8b6f4e] text-white rounded-lg text-xs font-semibold hover:bg-[#785e40] transition-colors cursor-pointer"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-[#8b6f4e] hover:bg-[#785e40] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      {submitting ? 'Saving...' : editingSection ? 'Save Changes' : 'Create Section'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Preview / View Modal ────────────────────────────── */}
      {isViewModalOpen && viewingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f4e] bg-[#faf3e8] px-2 py-0.5 rounded">
                  {viewingSection.sectionType}
                </span>
                <h3 className="text-base font-bold text-stone-900 font-serif mt-1">
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

              {viewingSection.items && viewingSection.items.length > 0 && (
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">
                    Attached Cards ({viewingSection.items.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {viewingSection.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-10 h-10 rounded object-cover border border-stone-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-stone-500 truncate">{item.subtitle}</p>
                          {item.linkUrl && (
                            <a
                              href={item.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-[#8b6f4e] hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <span>{item.linkUrl}</span>
                              <HiOutlineExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900 font-serif">
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
