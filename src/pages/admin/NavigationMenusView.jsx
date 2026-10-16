import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineFolder,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSearch,
  HiOutlineExternalLink,
  HiOutlineDesktopComputer,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiDotsHorizontal,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useConfirm } from '../../contexts/ConfirmContext';
import Dropdown from '../../components/common/Dropdown';

// Reusable micro-components
function DragHandle({ className = '', ...props }) {
  return (
    <span
      title="Drag to reorder"
      className={`inline-flex items-center justify-center p-1 rounded hover:bg-stone-200/50 text-stone-400 hover:text-[#8b6b47] cursor-grab active:cursor-grabbing shrink-0 transition-colors ${className}`}
      {...props}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="5" r="1.8" />
        <circle cx="16" cy="5" r="1.8" />
        <circle cx="8" cy="12" r="1.8" />
        <circle cx="16" cy="12" r="1.8" />
        <circle cx="8" cy="19" r="1.8" />
        <circle cx="16" cy="19" r="1.8" />
      </svg>
    </span>
  );
}

// Fallback luxury icons for categories if no image is uploaded
function CategoryGlyph({ name, className = 'w-5 h-5' }) {
  const n = (name || '').toLowerCase();
  if (n.includes('ring')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="14" r="7" />
        <path d="M9 4l3-2 3 2-1.5 3h-3L9 4z" />
      </svg>
    );
  }
  if (n.includes('earring')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 11v4a3 3 0 006 0v-4" />
        <circle cx="16" cy="8" r="3" />
      </svg>
    );
  }
  if (n.includes('pendant') || n.includes('neck')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 6c4 8 12 8 16 0" />
        <circle cx="12" cy="16" r="3" />
        <path d="M12 11v2" />
      </svg>
    );
  }
  if (n.includes('bangle') || n.includes('bracelet')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="12" rx="9" ry="6" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  return <HiOutlineSparkles className={className} />;
}

// Item thumbnail or gem icon
function ItemIcon({ iconUrl, title, className = 'w-7 h-7' }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={title || ''}
        className={`${className} rounded-lg object-cover border border-stone-100 bg-stone-50 shrink-0`}
      />
    );
  }
  return (
    <div className={`${className} rounded-lg border border-stone-200 bg-stone-50 text-stone-500 flex items-center justify-center shrink-0`}>
      <CategoryGlyph name={title} className="w-4 h-4 text-[#8b6b47]" />
    </div>
  );
}

export default function NavigationMenusView() {
  const confirm = useConfirm();

  // State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Sections & items for active category
  const [sections, setSections] = useState([]);
  const [itemsBySection, setItemsBySection] = useState({});
  const [loadingContent, setLoadingContent] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'banners'

  // Modals & Popups
  const [sectionModal, setSectionModal] = useState({ open: false, mode: 'create', data: null });
  const [itemModal, setItemModal] = useState({ open: false, mode: 'create', sectionId: null, data: null });
  const [bannerModal, setBannerModal] = useState({ open: false, mode: 'create', index: null, data: null });
  const [activeItemMenu, setActiveItemMenu] = useState(null); // ID of menu item with open popover
  const [savingModal, setSavingModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Drag-and-drop & Reorder states
  const [draggedSectionIdx, setDraggedSectionIdx] = useState(null);
  const [dragOverSectionIdx, setDragOverSectionIdx] = useState(null);
  const [draggedItemInfo, setDraggedItemInfo] = useState(null); // { sectionId, itemIdx }
  const [dragOverItemInfo, setDragOverItemInfo] = useState(null); // { sectionId, itemIdx }
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Close popups on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (sectionModal.open) setSectionModal({ open: false, mode: 'create', data: null });
        if (itemModal.open) setItemModal({ open: false, mode: 'create', sectionId: null, data: null });
        if (bannerModal.open) setBannerModal({ open: false, mode: 'create', index: null, data: null });
        if (activeItemMenu) setActiveItemMenu(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sectionModal.open, itemModal.open, bannerModal.open, activeItemMenu]);

  // Close item 3-dots action menu on outside click
  useEffect(() => {
    if (!activeItemMenu) return;
    function handleGlobalClick() {
      setActiveItemMenu(null);
    }
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeItemMenu]);

  // Load all categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoadingCategories(true);
    try {
      const res = await api.get('/categories', { params: { limit: 100 } });
      const rows = res.data?.data || [];
      const list = Array.isArray(rows) ? rows : rows.items || [];
      const sorted = [...list].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      setCategories(sorted);

      // Select default category (e.g. Bangles & Bracelets if exists, or first)
      if (sorted.length > 0) {
        setSelectedCategory((prev) => {
          if (prev) {
            const found = sorted.find((c) => c._id === prev._id);
            if (found) return found;
          }
          const defaultCat = sorted.find((c) => /bangle|bracelet/i.test(c.name)) || sorted[0];
          return defaultCat;
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  }

  // Whenever selectedCategory changes, load its sections and their items
  useEffect(() => {
    if (!selectedCategory?._id) {
      setSections([]);
      setItemsBySection({});
      return;
    }
    loadSectionsAndItems(selectedCategory._id);
  }, [selectedCategory?._id]);

  async function loadSectionsAndItems(catId) {
    setLoadingContent(true);
    try {
      // 1. Fetch sections for this category
      const secRes = await api.get('/menu-sections', { params: { categoryId: catId, limit: 100 } });
      const secRows = secRes.data?.data || [];
      const secList = Array.isArray(secRows) ? secRows : secRows.items || [];
      const sortedSections = [...secList].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      setSections(sortedSections);

      // Default all sections to expanded
      const expandMap = {};
      sortedSections.forEach((s) => {
        expandMap[s._id] = true;
      });
      setExpandedSections((prev) => ({ ...expandMap, ...prev }));

      // 2. Fetch items for each section in parallel
      const itemMap = {};
      await Promise.all(
        sortedSections.map(async (sec) => {
          try {
            const itemRes = await api.get('/menu-items', { params: { menuSectionId: sec._id, limit: 100 } });
            const itemRows = itemRes.data?.data || [];
            const itemList = Array.isArray(itemRows) ? itemRows : itemRows.items || [];
            itemMap[sec._id] = [...itemList].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
          } catch {
            itemMap[sec._id] = [];
          }
        })
      );
      setItemsBySection(itemMap);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sections');
    } finally {
      setLoadingContent(false);
    }
  }

  // Toggle category active/inactive status
  async function handleToggleCategoryStatus() {
    if (!selectedCategory || statusUpdating) return;
    const nextStatus = selectedCategory.status === 'active' ? 'inactive' : 'active';
    setStatusUpdating(true);
    try {
      await api.put(`/categories/${selectedCategory._id}`, { status: nextStatus });
      setSelectedCategory((prev) => ({ ...prev, status: nextStatus }));
      setCategories((prev) =>
        prev.map((c) => (c._id === selectedCategory._id ? { ...c, status: nextStatus } : c))
      );
      toast.success(`Category is now ${nextStatus === 'active' ? 'visible' : 'hidden'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category status');
    } finally {
      setStatusUpdating(false);
    }
  }

  // ─── Section Reordering (Move Up / Down & Drag & Drop) ───────────────
  async function handleMoveSection(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= sections.length || fromIdx === toIdx) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const updated = reordered.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(updated);

    try {
      await api.put('/menu-sections/reorder', {
        items: updated.map((sec, idx) => ({ _id: sec._id, order: idx + 1 })),
      });
      toast.success('Section order updated', { id: 'section-reorder-toast' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update section order');
      loadSectionsAndItems(selectedCategory._id);
    }
  }

  function handleSectionDragStart(e, idx) {
    setDraggedSectionIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }

  function handleSectionDragOver(e, idx) {
    e.preventDefault();
    if (draggedSectionIdx === null) return;
    if (dragOverSectionIdx !== idx) {
      setDragOverSectionIdx(idx);
    }
  }

  function handleSectionDrop(e, targetIdx) {
    e.preventDefault();
    if (draggedSectionIdx === null) return;
    if (draggedSectionIdx !== targetIdx) {
      handleMoveSection(draggedSectionIdx, targetIdx);
    }
    setDraggedSectionIdx(null);
    setDragOverSectionIdx(null);
  }

  function handleSectionDragEnd() {
    setDraggedSectionIdx(null);
    setDragOverSectionIdx(null);
  }

  // ─── Menu Item Reordering (Move Up / Down & Drag & Drop) ──────────────
  async function handleMoveItem(sectionId, fromIdx, toIdx) {
    const currentItems = itemsBySection[sectionId] || [];
    if (toIdx < 0 || toIdx >= currentItems.length || fromIdx === toIdx) return;

    const reordered = [...currentItems];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const updated = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    setItemsBySection((prev) => ({
      ...prev,
      [sectionId]: updated,
    }));

    try {
      await api.put('/menu-items/reorder', {
        items: updated.map((it, idx) => ({ _id: it._id, order: idx + 1 })),
      });
      toast.success('Menu item order updated', { id: 'item-reorder-toast' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item order');
      loadSectionsAndItems(selectedCategory._id);
    }
  }

  function handleItemDragStart(e, sectionId, itemIdx) {
    e.stopPropagation();
    setDraggedItemInfo({ sectionId, itemIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ sectionId, itemIdx }));
  }

  function handleItemDragOver(e, sectionId, itemIdx) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemInfo || draggedItemInfo.sectionId !== sectionId) return;
    if (dragOverItemInfo?.itemIdx !== itemIdx) {
      setDragOverItemInfo({ sectionId, itemIdx });
    }
  }

  function handleItemDrop(e, sectionId, targetIdx) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemInfo || draggedItemInfo.sectionId !== sectionId) return;
    if (draggedItemInfo.itemIdx !== targetIdx) {
      handleMoveItem(sectionId, draggedItemInfo.itemIdx, targetIdx);
    }
    setDraggedItemInfo(null);
    setDragOverItemInfo(null);
  }

  function handleItemDragEnd(e) {
    e.stopPropagation();
    setDraggedItemInfo(null);
    setDragOverItemInfo(null);
  }

  // ─── Save All Navigation Changes ─────────────────────────────────────
  async function handleSaveAll() {
    setIsSavingAll(true);
    try {
      if (sections.length > 0) {
        await api.put('/menu-sections/reorder', {
          items: sections.map((sec, idx) => ({ _id: sec._id, order: idx + 1 })),
        });
      }

      const itemPromises = Object.entries(itemsBySection).map(([secId, items]) => {
        if (items && items.length > 0) {
          return api.put('/menu-items/reorder', {
            items: items.map((it, idx) => ({ _id: it._id, order: idx + 1 })),
          });
        }
        return Promise.resolve();
      });
      await Promise.all(itemPromises);

      toast.success('All navigation structure and orders saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save navigation changes');
    } finally {
      setIsSavingAll(false);
    }
  }

  // Toggle section accordion
  function toggleSectionExpand(sectionId) {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === false ? true : false,
    }));
  }

  // Section CRUD
  function openAddSectionModal() {
    const nextOrder = (sections.length || 0) + 1;
    setSectionModal({
      open: true,
      mode: 'create',
      data: { title: '', order: nextOrder, status: 'active' },
    });
  }

  function openEditSectionModal(section) {
    setSectionModal({
      open: true,
      mode: 'edit',
      data: { ...section },
    });
  }

  async function handleSaveSection(e) {
    e.preventDefault();
    const { mode, data } = sectionModal;
    if (!data.title?.trim()) {
      return toast.error('Section title is required');
    }
    setSavingModal(true);
    try {
      if (mode === 'create') {
        await api.post('/menu-sections', {
          categoryId: selectedCategory._id,
          title: data.title.trim(),
          order: Number(data.order || 0),
          status: data.status || 'active',
        });
        toast.success('Section created');
      } else {
        await api.put(`/menu-sections/${data._id}`, {
          title: data.title.trim(),
          order: Number(data.order || 0),
          status: data.status || 'active',
        });
        toast.success('Section updated');
      }
      setSectionModal({ open: false, mode: 'create', data: null });
      await loadSectionsAndItems(selectedCategory._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section');
    } finally {
      setSavingModal(false);
    }
  }

  async function handleDeleteSection(section) {
    const confirmed = await confirm({
      title: `Delete "${section.title}"?`,
      message: 'This section and all its menu items will be soft-deleted.',
      confirmText: 'Delete Section',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/menu-sections/${section._id}`);
      toast.success('Section deleted');
      await loadSectionsAndItems(selectedCategory._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete section');
    }
  }

  // Menu Item CRUD
  function openAddMenuItemModal(sectionId) {
    const currentItems = itemsBySection[sectionId] || [];
    const nextOrder = (currentItems.length || 0) + 1;
    setItemModal({
      open: true,
      mode: 'create',
      sectionId,
      data: {
        title: '',
        menuSectionId: sectionId,
        iconUrl: '',
        order: nextOrder,
        status: 'active',
      },
    });
  }

  function openEditMenuItemModal(item) {
    setItemModal({
      open: true,
      mode: 'edit',
      sectionId: item.menuSectionId,
      data: {
        _id: item._id,
        title: item.title || '',
        menuSectionId: item.menuSectionId?._id || item.menuSectionId,
        iconUrl: item.icon?.url || '',
        order: item.order ?? 0,
        status: item.status || 'active',
      },
    });
  }

  async function handleSaveMenuItem(e) {
    e.preventDefault();
    const { mode, data } = itemModal;
    if (!data.title?.trim()) {
      return toast.error('Menu item label is required');
    }
    if (!data.menuSectionId) {
      return toast.error('Parent section is required');
    }
    setSavingModal(true);
    try {
      const payload = {
        menuSectionId: data.menuSectionId,
        title: data.title.trim(),
        order: Number(data.order || 0),
        status: data.status || 'active',
        icon: { url: (data.iconUrl || '').trim() },
      };

      if (mode === 'create') {
        await api.post('/menu-items', payload);
        toast.success('Menu item added');
      } else {
        await api.put(`/menu-items/${data._id}`, payload);
        toast.success('Menu item updated');
      }
      setItemModal({ open: false, mode: 'create', sectionId: null, data: null });
      await loadSectionsAndItems(selectedCategory._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSavingModal(false);
    }
  }

  async function handleDeleteMenuItem(item) {
    setActiveItemMenu(null);
    const confirmed = await confirm({
      title: `Delete "${item.title}"?`,
      message: 'This menu item will be removed from navigation.',
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/menu-items/${item._id}`);
      toast.success('Menu item deleted');
      await loadSectionsAndItems(selectedCategory._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete menu item');
    }
  }

  // Promo Banners for Active Category
  const promoBanners = useMemo(() => {
    return Array.isArray(selectedCategory?.promoBanners) ? selectedCategory.promoBanners : [];
  }, [selectedCategory?.promoBanners]);

  function openAddBannerModal() {
    setBannerModal({
      open: true,
      mode: 'create',
      index: null,
      data: { title: '', subtitle: '', imageUrl: '', link: '', status: 'active', order: promoBanners.length + 1 },
    });
  }

  function openEditBannerModal(banner, index) {
    setBannerModal({
      open: true,
      mode: 'edit',
      index,
      data: {
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        imageUrl: banner.image?.url || (typeof banner.image === 'string' ? banner.image : ''),
        link: banner.link || banner.url || '',
        status: banner.status || 'active',
        order: banner.order ?? index + 1,
      },
    });
  }

  async function handleSavePromoBanner(e) {
    e.preventDefault();
    const { mode, index, data } = bannerModal;
    if (!data.title?.trim()) {
      return toast.error('Banner title is required');
    }
    setSavingModal(true);
    try {
      const bannerItem = {
        title: data.title.trim(),
        subtitle: (data.subtitle || '').trim(),
        image: { url: (data.imageUrl || '').trim(), key: '' },
        link: (data.link || '').trim(),
        url: (data.link || '').trim(),
        status: data.status || 'active',
        order: Number(data.order || 0),
      };

      let nextBanners = [...promoBanners];
      if (mode === 'create') {
        nextBanners.push(bannerItem);
      } else {
        nextBanners[index] = { ...nextBanners[index], ...bannerItem };
      }

      await api.put(`/categories/${selectedCategory._id}`, { promoBanners: nextBanners });
      setSelectedCategory((prev) => ({ ...prev, promoBanners: nextBanners }));
      toast.success(mode === 'create' ? 'Promo banner added' : 'Promo banner updated');
      setBannerModal({ open: false, mode: 'create', index: null, data: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save promo banner');
    } finally {
      setSavingModal(false);
    }
  }

  async function handleDeletePromoBanner(index) {
    const confirmed = await confirm({
      title: 'Delete Promo Banner?',
      message: 'This promotional banner will be removed from this category menu.',
      confirmText: 'Delete Banner',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      const nextBanners = promoBanners.filter((_, idx) => idx !== index);
      await api.put(`/categories/${selectedCategory._id}`, { promoBanners: nextBanners });
      setSelectedCategory((prev) => ({ ...prev, promoBanners: nextBanners }));
      toast.success('Promo banner removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove promo banner');
    }
  }

  // Filtered categories for left sidebar
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((c) =>
      (c.name || '').toLowerCase().includes(categorySearch.toLowerCase().trim())
    );
  }, [categories, categorySearch]);

  // Total items count across active category
  const totalCategoryItems = useMemo(() => {
    return Object.values(itemsBySection).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [itemsBySection]);

  // Fallback demo luxury promo images for the Live Menu Preview
  const previewPromoBanners = useMemo(() => {
    if (promoBanners.length > 0) {
      return promoBanners.filter((b) => b.status !== 'inactive').slice(0, 2);
    }
    return [
      {
        title: 'Tennis Bracelets',
        image: {
          url: 'https://images.unsplash.com/photo-1611591475806-2581f148417c?auto=format&fit=crop&w=600&q=80',
        },
      },
      {
        title: 'Mens Bracelets',
        image: {
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
        },
      },
    ];
  }, [promoBanners]);

  return (
    <div className="space-y-5 pb-16 text-stone-800 font-sans">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER CARD                                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#8b6b47]/10 text-[#8b6b47] flex items-center justify-center shrink-0 border border-[#8b6b47]/20 shadow-2xs">
            <HiOutlineFolder className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Navigation Menus</h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Manage categories, sections, links and promotional banners in one place.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const url = selectedCategory?.slug
                ? `http://localhost:5174/shop?category=${selectedCategory.slug}`
                : 'http://localhost:5174';
              window.open(url, '_blank');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200/90 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer"
          >
            <HiOutlineExternalLink className="w-4 h-4 text-stone-400" />
            Preview Storefront
          </button>

          <button
            type="button"
            disabled={isSavingAll}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-xl bg-[#8b6b47] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#745735] disabled:opacity-60 transition-all cursor-pointer"
          >
            <HiOutlineCheck className="w-4 h-4" />
            {isSavingAll ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. THREE-COLUMN WORKSPACE LAYOUT                                       */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: CATEGORIES (3 of 12) ── */}
        <aside className="lg:col-span-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-stone-900">Categories</h2>
            <span className="text-[11px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              {categories.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search categories.."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6b47] focus:bg-white transition-all"
            />
          </div>

          {/* Categories List */}
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-0.5">
            {loadingCategories ? (
              <div className="py-10 text-center text-xs text-stone-400">Loading categories…</div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No categories found.</div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = selectedCategory?._id === cat._id;
                const iconSrc = cat.icon?.url || (cat.images && cat.images[0]?.url);

                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveTab('sections');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border border-[#8b6b47]/40 bg-[#8b6b47]/5 text-stone-900 font-bold shadow-2xs'
                        : 'border border-transparent hover:bg-stone-50/80 text-stone-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border ${
                          isSelected ? 'border-[#8b6b47]/30 bg-white' : 'border-stone-200/80 bg-stone-50'
                        }`}
                      >
                        {iconSrc ? (
                          <img src={iconSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <CategoryGlyph name={cat.name} className="w-4 h-4 text-[#8b6b47]" />
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>

                    {isSelected && (
                      <HiOutlineChevronRight className="w-4 h-4 text-[#8b6b47] shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── MIDDLE COLUMN: ACTIVE CATEGORY CONTENT & SECTIONS (5 of 12) ── */}
        <main className="lg:col-span-5 space-y-4">
          {selectedCategory ? (
            <>
              {/* Category Header Card with Status Switch */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl border border-stone-200/90 bg-stone-50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {selectedCategory.icon?.url || selectedCategory.images?.[0]?.url ? (
                      <img
                        src={selectedCategory.icon?.url || selectedCategory.images?.[0]?.url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <CategoryGlyph name={selectedCategory.name} className="w-7 h-7 text-[#8b6b47]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-stone-900 tracking-tight truncate">
                      {selectedCategory.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-stone-400 truncate">
                      Manage menu structure and promotional banners for this category.
                    </p>
                  </div>
                </div>

                {/* Status Toggle Switch */}
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-400">
                    Status
                  </span>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={handleToggleCategoryStatus}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                        selectedCategory.status === 'active' ? 'bg-[#8b6b47]' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          selectedCategory.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-stone-700 w-12 text-left">
                      {selectedCategory.status === 'active' ? 'Visible' : 'Hidden'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation Header + Add Section Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-2">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sections')}
                    className={`text-xs font-semibold pb-2.5 relative transition-all cursor-pointer ${
                      activeTab === 'sections'
                        ? 'text-[#8b6b47] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8b6b47]'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Sections & Links
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('banners')}
                    className={`text-xs font-semibold pb-2.5 relative transition-all cursor-pointer ${
                      activeTab === 'banners'
                        ? 'text-[#8b6b47] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8b6b47]'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Promo Banners ({promoBanners.length})
                  </button>
                </div>

                {activeTab === 'sections' && (
                  <button
                    type="button"
                    onClick={openAddSectionModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6b47] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#745735] transition-all cursor-pointer"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 1: SECTIONS & MENU ITEMS ACCORDION                   */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'sections' && (
                <div className="space-y-3.5">
                  {loadingContent ? (
                    <div className="py-16 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                      Loading sections and links…
                    </div>
                  ) : sections.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center space-y-3">
                      <p className="text-xs text-stone-500 font-medium">
                        No sections created yet for {selectedCategory.name}.
                      </p>
                      <button
                        type="button"
                        onClick={openAddSectionModal}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6b47] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#745735]"
                      >
                        <HiOutlinePlus className="w-4 h-4" />
                        Create First Section
                      </button>
                    </div>
                  ) : (
                    sections.map((section, secIdx) => {
                      const isExpanded = expandedSections[section._id] !== false;
                      const items = itemsBySection[section._id] || [];
                      const isSecDragging = draggedSectionIdx === secIdx;
                      const isSecDragOver = dragOverSectionIdx === secIdx;

                      return (
                        <div
                          key={section._id}
                          onDragOver={(e) => handleSectionDragOver(e, secIdx)}
                          onDrop={(e) => handleSectionDrop(e, secIdx)}
                          className={`rounded-2xl border bg-white shadow-xs overflow-hidden transition-all duration-200 ${
                            isSecDragging
                              ? 'opacity-40 border-[#8b6b47] scale-[0.99] ring-2 ring-[#8b6b47]/20 shadow-lg'
                              : isSecDragOver
                              ? 'border-[#8b6b47] ring-2 ring-[#8b6b47]/30 bg-[#8b6b47]/5'
                              : 'border-stone-200/90 hover:border-stone-300'
                          }`}
                        >
                          {/* Section Header Bar */}
                          <div
                            draggable
                            onDragStart={(e) => handleSectionDragStart(e, secIdx)}
                            onDragEnd={handleSectionDragEnd}
                            className="flex items-center justify-between p-3.5 bg-stone-50/70 border-b border-stone-100 cursor-grab active:cursor-grabbing select-none hover:bg-stone-100/60 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <DragHandle />

                              {/* Direct 1-Click Move Up / Down Buttons for Easy Reordering */}
                              <div
                                className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  disabled={secIdx === 0}
                                  title="Move Section Up"
                                  onClick={() => handleMoveSection(secIdx, secIdx - 1)}
                                  className="p-1 text-stone-400 hover:text-[#8b6b47] hover:bg-stone-50 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                                >
                                  <HiOutlineChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-[1px] h-3 bg-stone-200" />
                                <button
                                  type="button"
                                  disabled={secIdx === sections.length - 1}
                                  title="Move Section Down"
                                  onClick={() => handleMoveSection(secIdx, secIdx + 1)}
                                  className="p-1 text-stone-400 hover:text-[#8b6b47] hover:bg-stone-50 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                                >
                                  <HiOutlineChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-[10px] font-bold text-stone-400 bg-stone-200/70 px-1.5 py-0.5 rounded shrink-0">
                                #{secIdx + 1}
                              </span>

                              <h3 className="text-xs font-bold text-stone-900 truncate">
                                {section.title}
                              </h3>
                              <span className="text-[10px] font-semibold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-full shrink-0">
                                {items.length} items
                              </span>
                            </div>

                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                title="Edit Section"
                                onClick={() => openEditSectionModal(section)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                              >
                                <HiOutlinePencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete Section"
                                onClick={() => handleDeleteSection(section)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                                onClick={() => toggleSectionExpand(section._id)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer ml-1"
                              >
                                {isExpanded ? (
                                  <HiOutlineChevronUp className="w-4 h-4" />
                                ) : (
                                  <HiOutlineChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Section Content Area (Collapsible) */}
                          {isExpanded && (
                            <div className="p-3.5 space-y-3 bg-white">
                              {/* 2-Column Grid of Menu Items */}
                              {items.length === 0 ? (
                                <p className="text-center py-4 text-xs text-stone-400 italic">
                                  No menu items in this section yet.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {items.map((item, itemIdx) => {
                                    const isMenuOpen = activeItemMenu === item._id;
                                    const isItemDragging =
                                      draggedItemInfo?.sectionId === section._id &&
                                      draggedItemInfo.itemIdx === itemIdx;
                                    const isItemDragOver =
                                      dragOverItemInfo?.sectionId === section._id &&
                                      dragOverItemInfo.itemIdx === itemIdx;

                                    return (
                                      <div
                                        key={item._id}
                                        draggable
                                        onDragStart={(e) => handleItemDragStart(e, section._id, itemIdx)}
                                        onDragOver={(e) => handleItemDragOver(e, section._id, itemIdx)}
                                        onDrop={(e) => handleItemDrop(e, section._id, itemIdx)}
                                        onDragEnd={handleItemDragEnd}
                                        className={`relative group rounded-xl border p-2.5 flex items-center justify-between gap-2 transition-all select-none cursor-grab active:cursor-grabbing ${
                                          isItemDragging
                                            ? 'opacity-40 border-[#8b6b47] scale-[0.98] ring-2 ring-[#8b6b47]/20 bg-stone-50 shadow'
                                            : isItemDragOver
                                            ? 'border-[#8b6b47] ring-2 ring-[#8b6b47]/30 bg-[#8b6b47]/5'
                                            : 'border-stone-200/90 bg-white hover:border-stone-300 hover:shadow-2xs'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <DragHandle />

                                          {/* Quick 1-click Up/Down for item */}
                                          <div
                                            className="flex flex-col -space-y-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                          >
                                            <button
                                              type="button"
                                              disabled={itemIdx === 0}
                                              title="Move Up"
                                              onClick={() =>
                                                handleMoveItem(section._id, itemIdx, itemIdx - 1)
                                              }
                                              className="text-stone-400 hover:text-[#8b6b47] disabled:opacity-20 cursor-pointer"
                                            >
                                              <HiOutlineChevronUp className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={itemIdx === items.length - 1}
                                              title="Move Down"
                                              onClick={() =>
                                                handleMoveItem(section._id, itemIdx, itemIdx + 1)
                                              }
                                              className="text-stone-400 hover:text-[#8b6b47] disabled:opacity-20 cursor-pointer"
                                            >
                                              <HiOutlineChevronDown className="w-3 h-3" />
                                            </button>
                                          </div>

                                          <span className="text-[10px] font-bold text-stone-400">
                                            #{itemIdx + 1}
                                          </span>
                                          <ItemIcon iconUrl={item.icon?.url} title={item.title} />
                                          <span className="text-xs font-semibold text-stone-800 truncate">
                                            {item.title}
                                          </span>
                                        </div>

                                        {/* Actions button & floating popover */}
                                        <div
                                          className="relative shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setActiveItemMenu((prev) =>
                                                prev === item._id ? null : item._id
                                              )
                                            }
                                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                                          >
                                            <HiDotsHorizontal className="w-4 h-4" />
                                          </button>

                                          {isMenuOpen && (
                                            <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white border border-stone-200 shadow-xl py-1 z-30 text-xs">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveItemMenu(null);
                                                  openEditMenuItemModal(item);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-stone-700 hover:bg-stone-50 cursor-pointer text-left"
                                              >
                                                <HiOutlinePencil className="w-3.5 h-3.5 text-stone-400" />
                                                Edit Link
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteMenuItem(item)}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 cursor-pointer text-left"
                                              >
                                                <HiOutlineTrash className="w-3.5 h-3.5" />
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* + Add Menu Item Button */}
                              <button
                                type="button"
                                onClick={() => openAddMenuItemModal(section._id)}
                                className="w-full py-2.5 rounded-xl border border-dashed border-stone-300 hover:border-[#8b6b47] hover:bg-[#8b6b47]/5 text-stone-600 hover:text-[#8b6b47] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <HiOutlinePlus className="w-3.5 h-3.5" />
                                Add Menu Item
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 2: PROMO BANNERS                                     */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'banners' && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Category Promotional Banners
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        These image banners are showcased inside the mega-menu dropdown for{' '}
                        {selectedCategory.name}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddBannerModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6b47] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#745735]"
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5" />
                      Add Banner
                    </button>
                  </div>

                  {promoBanners.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-stone-200 rounded-xl space-y-2">
                      <HiOutlinePhotograph className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="text-xs text-stone-500 font-medium">No promo banners added yet.</p>
                      <p className="text-[11px] text-stone-400">
                        Add promotional visual cards to delight shoppers exploring this category menu.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {promoBanners.map((banner, index) => {
                        const img =
                          banner.image?.url ||
                          (typeof banner.image === 'string' ? banner.image : '');
                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-2.5 relative group overflow-hidden"
                          >
                            <div className="w-full h-28 rounded-lg bg-stone-200 overflow-hidden relative border border-stone-200">
                              {img ? (
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                                  No Image
                                </div>
                              )}
                              <span
                                className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  banner.status === 'active'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-stone-500 text-white'
                                }`}
                              >
                                {banner.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-stone-900 truncate">
                                {banner.title || 'Untitled Banner'}
                              </h4>
                              {banner.subtitle && (
                                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                  {banner.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-200/60">
                              <button
                                type="button"
                                onClick={() => openEditBannerModal(banner, index)}
                                className="text-xs text-[#8b6b47] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <HiOutlinePencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromoBanner(index)}
                                className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold ml-2"
                              >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              Select a category on the left to manage its navigation menu.
            </div>
          )}
        </main>

        {/* ── RIGHT COLUMN: LIVE MENU PREVIEW (4 of 12) ── */}
        <section className="lg:col-span-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <HiOutlineDesktopComputer className="w-5 h-5 text-stone-600" />
              <h2 className="text-sm font-bold tracking-tight text-stone-900">
                Live Menu Preview
              </h2>
            </div>
            <button
              type="button"
              title="Preview in new tab"
              onClick={() => {
                const url = selectedCategory?.slug
                  ? `http://localhost:5174/shop?category=${selectedCategory.slug}`
                  : 'http://localhost:5174';
                window.open(url, '_blank');
              }}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <HiOutlineExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Simulated Top Category Nav Bar */}
          <div className="rounded-xl border border-stone-200/80 bg-[#22201e] px-2 py-2 overflow-x-auto shadow-inner">
            <div className="flex items-center gap-3 text-[10px] tracking-widest font-semibold uppercase whitespace-nowrap">
              {categories.slice(0, 6).map((c) => {
                const isCurrent = selectedCategory?._id === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2 py-1 transition-all cursor-pointer ${
                      isCurrent
                        ? 'text-amber-200 font-bold border-b border-amber-200'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mega-Dropdown Simulated Content */}
          <div className="rounded-xl border border-stone-200/90 bg-[#faf8f5] p-3.5 space-y-4 min-h-[480px]">
            {sections.length === 0 ? (
              <div className="text-center py-20 text-xs text-stone-400">
                No sections configured yet. Add sections to see live mega-menu preview.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Column 1 & 2: Dynamic Sections & Items */}
                <div className="space-y-4">
                  {sections.slice(0, 3).map((sec) => {
                    const secItems = itemsBySection[sec._id] || [];
                    return (
                      <div key={sec._id} className="space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200/70 pb-1">
                          {sec.title}
                        </h4>
                        <ul className="space-y-1 text-xs text-stone-600">
                          {secItems.slice(0, 6).map((it) => (
                            <li
                              key={it._id}
                              className="flex items-center gap-2 hover:text-[#8b6b47] cursor-pointer transition-colors py-0.5"
                            >
                              {it.icon?.url ? (
                                <img
                                  src={it.icon.url}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                              )}
                              <span className="truncate">{it.title}</span>
                            </li>
                          ))}
                        </ul>
                        {secItems.length > 6 && (
                          <div className="text-[10px] font-semibold text-[#8b6b47] hover:underline cursor-pointer pt-0.5">
                            Explore All &gt;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Column 3: Filters & Promotional Showcase */}
                <div className="space-y-3.5 border-l border-stone-200/60 pl-3">
                  {/* Price & Purity Helper links */}
                  <div className="space-y-1">
                    <h5 className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Shop By Price
                    </h5>
                    <div className="text-[11px] text-stone-600 space-y-0.5">
                      <div className="hover:text-[#8b6b47] cursor-pointer">₹50,000 - ₹1,00,000</div>
                      <div className="hover:text-[#8b6b47] cursor-pointer">₹1,00,000 - ₹2,00,000</div>
                      <div className="hover:text-[#8b6b47] cursor-pointer">Above ₹2,00,000</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Shop By Metal
                    </h5>
                    <div className="text-[11px] text-stone-600 space-y-0.5">
                      <div className="hover:text-[#8b6b47] cursor-pointer">14 KT Gold</div>
                      <div className="hover:text-[#8b6b47] cursor-pointer">18 KT Gold</div>
                      <div className="hover:text-[#8b6b47] cursor-pointer">925 Silver</div>
                    </div>
                  </div>

                  {/* Promo Banner Cards with image overlays */}
                  <div className="space-y-2 pt-1">
                    {previewPromoBanners.map((promo, idx) => {
                      const img =
                        promo.image?.url ||
                        (typeof promo.image === 'string' ? promo.image : '');
                      return (
                        <div
                          key={idx}
                          className="relative h-24 rounded-lg overflow-hidden border border-stone-200 shadow-2xs group cursor-pointer"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                            <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1">
                              {promo.title} &gt;
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SECTION MODAL DIALOG (CREATE / EDIT SECTION)                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {sectionModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs cursor-pointer"
            onClick={() => setSectionModal({ open: false, mode: 'create', data: null })}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-150 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSaveSection}>
                <header className="flex items-center justify-between border-b border-stone-100 p-4 rounded-t-2xl">
                  <h3 className="text-sm font-bold text-stone-900">
                    {sectionModal.mode === 'create' ? 'Add Section' : 'Edit Section'}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setSectionModal({ open: false, mode: 'create', data: null })
                    }
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </header>

                <div className="p-4 space-y-3.5">
                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Section Title *</span>
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder="e.g. Featured, Classic Styles, Gemstone"
                      value={sectionModal.data?.title || ''}
                      onChange={(e) =>
                        setSectionModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, title: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold text-stone-700">Display Order</span>
                      <input
                        type="number"
                        min="0"
                        value={sectionModal.data?.order ?? 0}
                        onChange={(e) =>
                          setSectionModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, order: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                      />
                    </label>

                    <div>
                      <Dropdown
                        label="Visibility"
                        value={sectionModal.data?.status || 'active'}
                        onChange={(val) =>
                          setSectionModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: val },
                          }))
                        }
                        options={[
                          { value: 'active', label: 'Visible', dotColor: 'bg-emerald-500' },
                          { value: 'inactive', label: 'Hidden', dotColor: 'bg-stone-400' },
                        ]}
                        showStatusDot
                        size="field"
                      />
                    </div>
                  </div>
                </div>

                <footer className="flex items-center justify-end gap-2 border-t border-stone-100 p-4 bg-stone-50/50">
                  <button
                    type="button"
                    disabled={savingModal}
                    onClick={() =>
                      setSectionModal({ open: false, mode: 'create', data: null })
                    }
                    className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/50 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingModal}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#8b6b47] hover:bg-[#745735] rounded-xl shadow-xs transition"
                  >
                    {savingModal ? 'Saving…' : 'Save Section'}
                  </button>
                </footer>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MENU ITEM MODAL DIALOG (CREATE / EDIT ITEM)                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {itemModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs cursor-pointer"
            onClick={() =>
              setItemModal({ open: false, mode: 'create', sectionId: null, data: null })
            }
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-150 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSaveMenuItem}>
                <header className="flex items-center justify-between border-b border-stone-100 p-4 rounded-t-2xl">
                  <h3 className="text-sm font-bold text-stone-900">
                    {itemModal.mode === 'create' ? 'Add Menu Item' : 'Edit Menu Item'}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setItemModal({ open: false, mode: 'create', sectionId: null, data: null })
                    }
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </header>

                <div className="p-4 space-y-3.5">
                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Item Label *</span>
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder="e.g. Bangles, Tennis Bracelets, Cuff Bangles"
                      value={itemModal.data?.title || ''}
                      onChange={(e) =>
                        setItemModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, title: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <div>
                    <Dropdown
                      label="Parent Section"
                      required
                      value={itemModal.data?.menuSectionId || ''}
                      onChange={(val) =>
                        setItemModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, menuSectionId: val },
                        }))
                      }
                      options={sections.map((sec) => ({
                        value: sec._id,
                        label: sec.title,
                      }))}
                      placeholder="Select parent section..."
                      size="field"
                    />
                  </div>

                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Icon Image CDN URL (optional)</span>
                    <input
                      type="url"
                      placeholder="https://cdn.example.com/icons/bracelet.webp"
                      value={itemModal.data?.iconUrl || ''}
                      onChange={(e) =>
                        setItemModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, iconUrl: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold text-stone-700">Display Order</span>
                      <input
                        type="number"
                        min="0"
                        value={itemModal.data?.order ?? 0}
                        onChange={(e) =>
                          setItemModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, order: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                      />
                    </label>

                    <div>
                      <Dropdown
                        label="Visibility"
                        value={itemModal.data?.status || 'active'}
                        onChange={(val) =>
                          setItemModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: val },
                          }))
                        }
                        options={[
                          { value: 'active', label: 'Visible', dotColor: 'bg-emerald-500' },
                          { value: 'inactive', label: 'Hidden', dotColor: 'bg-stone-400' },
                        ]}
                        showStatusDot
                        size="field"
                      />
                    </div>
                  </div>
                </div>

                <footer className="flex items-center justify-end gap-2 border-t border-stone-100 p-4 bg-stone-50/50">
                  <button
                    type="button"
                    disabled={savingModal}
                    onClick={() =>
                      setItemModal({ open: false, mode: 'create', sectionId: null, data: null })
                    }
                    className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/50 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingModal}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#8b6b47] hover:bg-[#745735] rounded-xl shadow-xs transition"
                  >
                    {savingModal ? 'Saving…' : 'Save Item'}
                  </button>
                </footer>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PROMO BANNER MODAL DIALOG                                              */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {bannerModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs cursor-pointer"
            onClick={() =>
              setBannerModal({ open: false, mode: 'create', index: null, data: null })
            }
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-150 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSavePromoBanner}>
                <header className="flex items-center justify-between border-b border-stone-100 p-4 rounded-t-2xl">
                  <h3 className="text-sm font-bold text-stone-900">
                    {bannerModal.mode === 'create' ? 'Add Promo Banner' : 'Edit Promo Banner'}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setBannerModal({ open: false, mode: 'create', index: null, data: null })
                    }
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </header>

                <div className="p-4 space-y-3.5">
                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Banner Title *</span>
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder="e.g. Tennis Bracelets Collection"
                      value={bannerModal.data?.title || ''}
                      onChange={(e) =>
                        setBannerModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, title: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Subtitle (optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. Handcrafted in 18K Solid Gold"
                      value={bannerModal.data?.subtitle || ''}
                      onChange={(e) =>
                        setBannerModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, subtitle: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Banner Image URL *</span>
                    <input
                      required
                      type="url"
                      placeholder="https://..."
                      value={bannerModal.data?.imageUrl || ''}
                      onChange={(e) =>
                        setBannerModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, imageUrl: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-stone-700">Destination Link</span>
                    <input
                      type="text"
                      placeholder="/shop?category=bangles-bracelets"
                      value={bannerModal.data?.link || ''}
                      onChange={(e) =>
                        setBannerModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, link: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold text-stone-700">Order</span>
                      <input
                        type="number"
                        min="0"
                        value={bannerModal.data?.order ?? 0}
                        onChange={(e) =>
                          setBannerModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, order: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#8b6b47]"
                      />
                    </label>

                    <div>
                      <Dropdown
                        label="Status"
                        value={bannerModal.data?.status || 'active'}
                        onChange={(val) =>
                          setBannerModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: val },
                          }))
                        }
                        options={[
                          { value: 'active', label: 'Active', dotColor: 'bg-emerald-500' },
                          { value: 'inactive', label: 'Inactive', dotColor: 'bg-stone-400' },
                        ]}
                        showStatusDot
                        size="field"
                      />
                    </div>
                  </div>
                </div>

                <footer className="flex items-center justify-end gap-2 border-t border-stone-100 p-4 bg-stone-50/50">
                  <button
                    type="button"
                    disabled={savingModal}
                    onClick={() =>
                      setBannerModal({ open: false, mode: 'create', index: null, data: null })
                    }
                    className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/50 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingModal}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#8b6b47] hover:bg-[#745735] rounded-xl shadow-xs transition"
                  >
                    {savingModal ? 'Saving…' : 'Save Banner'}
                  </button>
                </footer>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
