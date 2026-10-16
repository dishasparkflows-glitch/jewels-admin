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
  HiOutlineEye,
  HiOutlineDesktopComputer,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineUpload,
  HiDotsHorizontal,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useConfirm } from '../../contexts/ConfirmContext';
import Dropdown from '../../components/common/Dropdown';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

// Preset luxury jewelry icons for 1-click selection
const PRESET_ICONS = [
  {
    id: 'ring',
    name: 'Ring',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="7"/><path d="M9 4l3-2 3 2-1.5 3h-3L9 4z"/></svg>`,
  },
  {
    id: 'earrings',
    name: 'Earrings',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 11v4a3 3 0 006 0v-4"/><circle cx="16" cy="8" r="3"/></svg>`,
  },
  {
    id: 'pendant',
    name: 'Pendant',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6c4 8 12 8 16 0"/><circle cx="12" cy="16" r="3"/><path d="M12 11v2"/></svg>`,
  },
  {
    id: 'bangle',
    name: 'Bangle',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><circle cx="12" cy="6" r="1.5" fill="#85583f"/></svg>`,
  },
  {
    id: 'gold-bar',
    name: 'Gold Bar',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l4-9h10l4 9H3z"/><path d="M7 8l2-4h6l2 4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 7-10 11L2 10l4-7z"/><path d="M2 10h20"/><path d="M12 21L8 10l4-7 4 7-4 11z"/></svg>`,
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z"/><path d="M19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></svg>`,
  },
  {
    id: 'necklace',
    name: 'Necklace',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#85583f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8c2 9 16 9 18 0"/><path d="M8 14l4 5 4-5"/><circle cx="12" cy="19" r="1.5" fill="#85583f"/></svg>`,
  },
];

// Reusable micro-components
function DragHandle({ className = '', ...props }) {
  return (
    <span
      title="Drag to reorder"
      className={`inline-flex items-center justify-center p-1 rounded hover:bg-stone-200/50 text-stone-400 hover:text-[#85583f] cursor-grab active:cursor-grabbing shrink-0 transition-colors ${className}`}
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
      <CategoryGlyph name={title} className="w-4 h-4 text-[#85583f]" />
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
  const [isUploadingItemIcon, setIsUploadingItemIcon] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const itemFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  async function handleUploadItemIcon(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingItemIcon(true);
    try {
      const res = await uploadWithPresignedUrl(file, 'navigation-icons');
      const uploadedUrl = res.fileUrl || res.url;
      setItemModal((prev) => ({
        ...prev,
        data: { ...prev.data, iconUrl: uploadedUrl },
      }));
      toast.success('Icon uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to upload icon image');
    } finally {
      setIsUploadingItemIcon(false);
      if (itemFileInputRef.current) itemFileInputRef.current.value = '';
    }
  }

  async function handleUploadBannerImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const res = await uploadWithPresignedUrl(file, 'promo-banners');
      const uploadedUrl = res.fileUrl || res.url;
      setBannerModal((prev) => ({
        ...prev,
        data: { ...prev.data, imageUrl: uploadedUrl },
      }));
      toast.success('Banner image uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to upload banner image');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  }

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
    setShowManualUrlInput(false);
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
    setShowManualUrlInput(false);
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


  return (
    <div className="space-y-5 pb-16 text-stone-800 font-sans">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER CARD                                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#faf6f1] text-[#85583f] flex items-center justify-center shrink-0 border border-[#eadbcc] shadow-2xs">
            <HiOutlineFolder className="w-5 h-5" />
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
            <HiOutlineEye className="w-4 h-4 text-stone-500" />
            Preview Storefront
          </button>

          <button
            type="button"
            disabled={isSavingAll}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-xl bg-[#85583f] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#724a34] disabled:opacity-60 transition-all cursor-pointer"
          >
            <HiOutlineCheck className="w-4 h-4" />
            {isSavingAll ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. TWO-COLUMN WORKSPACE LAYOUT (Matches reference design)               */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: CATEGORIES (3 of 12) ── */}
        <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-stone-900">Categories</h2>
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {categories.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#85583f] focus:bg-white transition-all"
            />
          </div>

          {/* Categories List */}
          <div className="space-y-1.5 max-h-[680px] overflow-y-auto pr-0.5">
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
                        ? 'border border-[#eadbcc] bg-[#faf6f1] text-stone-900 font-bold shadow-2xs'
                        : 'border border-transparent hover:bg-stone-50/80 text-stone-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border ${
                          isSelected ? 'border-[#eadbcc] bg-white' : 'border-stone-200/80 bg-stone-50'
                        }`}
                      >
                        {iconSrc ? (
                          <img src={iconSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <CategoryGlyph name={cat.name} className="w-4.5 h-4.5 text-[#85583f]" />
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <HiOutlineChevronRight
                      className={`w-4 h-4 shrink-0 ml-1.5 ${
                        isSelected ? 'text-[#85583f]' : 'text-stone-300'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT COLUMN: ACTIVE CATEGORY CONTENT (9 of 12) ── */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-4">
          {selectedCategory ? (
            <>
              {/* Category Header Card with Status Switch */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl border border-stone-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {selectedCategory.icon?.url || selectedCategory.images?.[0]?.url ? (
                      <img
                        src={selectedCategory.icon?.url || selectedCategory.images?.[0]?.url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <CategoryGlyph name={selectedCategory.name} className="w-7 h-7 text-[#85583f]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-stone-900 tracking-tight truncate">
                      {selectedCategory.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-stone-500 truncate">
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
                        selectedCategory.status === 'active' ? 'bg-[#85583f]' : 'bg-stone-300'
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-0">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sections')}
                    className={`text-xs pb-3 pt-1 transition-all cursor-pointer ${
                      activeTab === 'sections'
                        ? 'text-stone-900 font-bold border-b-2 border-[#85583f]'
                        : 'text-stone-500 hover:text-stone-800 font-semibold border-b-2 border-transparent'
                    }`}
                  >
                    Sections & Links ({sections.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('banners')}
                    className={`text-xs pb-3 pt-1 transition-all cursor-pointer ${
                      activeTab === 'banners'
                        ? 'text-stone-900 font-bold border-b-2 border-[#85583f]'
                        : 'text-stone-500 hover:text-stone-800 font-semibold border-b-2 border-transparent'
                    }`}
                  >
                    Promo Banners ({promoBanners.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`text-xs pb-3 pt-1 transition-all cursor-pointer ${
                      activeTab === 'settings'
                        ? 'text-stone-900 font-bold border-b-2 border-[#85583f]'
                        : 'text-stone-500 hover:text-stone-800 font-semibold border-b-2 border-transparent'
                    }`}
                  >
                    Category Settings
                  </button>
                </div>

                {activeTab === 'sections' && (
                  <button
                    type="button"
                    onClick={openAddSectionModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#85583f] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#724a34] transition-all cursor-pointer mb-2"
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
                <div className="space-y-4">
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#85583f] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#724a34]"
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
                          className={`rounded-2xl border bg-white shadow-xs p-4 space-y-3.5 transition-all duration-200 ${
                            isSecDragging
                              ? 'opacity-40 border-[#85583f] scale-[0.99] ring-2 ring-[#85583f]/20 shadow-lg'
                              : isSecDragOver
                              ? 'border-[#85583f] ring-2 ring-[#85583f]/30 bg-[#85583f]/5'
                              : 'border-stone-200/90 hover:border-stone-300'
                          }`}
                        >
                          {/* Section Header Bar */}
                          <div
                            draggable
                            onDragStart={(e) => handleSectionDragStart(e, secIdx)}
                            onDragEnd={handleSectionDragEnd}
                            className="flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <DragHandle />

                              {/* Number circle badge like in reference design */}
                              <span className="w-6 h-6 rounded-full bg-[#85583f] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                                {secIdx + 1}
                              </span>

                              <h3 className="text-sm font-bold text-stone-900 truncate">
                                {section.title}
                              </h3>

                              <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full shrink-0">
                                {items.length} items
                              </span>
                            </div>

                            <div
                              className="flex items-center gap-1.5 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                title="Edit Section"
                                onClick={() => openEditSectionModal(section)}
                                className="p-1.5 text-stone-400 hover:text-[#85583f] rounded-lg transition-colors cursor-pointer"
                              >
                                <HiOutlinePencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Delete Section"
                                onClick={() => handleDeleteSection(section)}
                                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                                onClick={() => toggleSectionExpand(section._id)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
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
                            <div className="space-y-3 pt-1">
                              {/* Menu Items List - Clean full-width rows */}
                              {items.length === 0 ? (
                                <p className="text-center py-4 text-xs text-stone-400 italic">
                                  No menu items in this section yet.
                                </p>
                              ) : (
                                <div className="divide-y divide-stone-100 border-t border-b border-stone-100">
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
                                        className={`group flex items-center justify-between py-3 px-1 transition-all select-none cursor-grab active:cursor-grabbing ${
                                          isItemDragging
                                            ? 'opacity-40 bg-stone-50'
                                            : isItemDragOver
                                            ? 'bg-[#85583f]/5'
                                            : 'hover:bg-stone-50/70'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                          <DragHandle />
                                          <div className="w-8 h-8 rounded-lg border border-stone-200/80 bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                            {item.icon?.url ? (
                                              <img
                                                src={item.icon.url}
                                                alt=""
                                                className="w-full h-full object-cover rounded"
                                              />
                                            ) : (
                                              <CategoryGlyph name={item.title} className="w-4 h-4 text-[#85583f]" />
                                            )}
                                          </div>
                                          <span className="text-xs font-medium text-stone-800 truncate">
                                            {item.title}
                                          </span>
                                        </div>

                                        {/* Status badge & actions */}
                                        <div
                                          className="flex items-center gap-4 shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                              item.status === 'active' || !item.status
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                                            }`}
                                          >
                                            {item.status === 'active' || !item.status ? 'Active' : 'Hidden'}
                                          </span>

                                          <div className="relative">
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
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* + Add Menu Item Button */}
                              <button
                                type="button"
                                onClick={() => openAddMenuItemModal(section._id)}
                                className="w-full py-2.5 rounded-xl border border-dashed border-stone-200 hover:border-[#85583f] hover:bg-[#85583f]/5 text-stone-600 hover:text-[#85583f] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#85583f] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#724a34] cursor-pointer"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {promoBanners.map((banner, index) => {
                        const img =
                          banner.image?.url ||
                          (typeof banner.image === 'string' ? banner.image : '');
                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-2.5 relative group overflow-hidden"
                          >
                            <div className="w-full h-32 rounded-lg bg-stone-200 overflow-hidden relative border border-stone-200">
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
                                className="text-xs text-[#85583f] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <HiOutlinePencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromoBanner(index)}
                                className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold ml-2 cursor-pointer"
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

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 3: CATEGORY SETTINGS                                 */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="text-sm font-bold text-stone-900">Category Settings</h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Basic configuration and status for {selectedCategory.name}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-semibold text-stone-600">Category Name:</span>
                      <p className="font-bold text-stone-900 text-sm">{selectedCategory.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-stone-600">Slug:</span>
                      <p className="font-mono text-stone-700 bg-stone-50 px-2 py-1 rounded border border-stone-200 w-fit">
                        {selectedCategory.slug || '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-stone-600">Order:</span>
                      <p className="text-stone-800 font-semibold">{selectedCategory.order ?? 0}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-stone-600">Current Status:</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold ${
                          selectedCategory.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {selectedCategory.status === 'active' ? 'Visible in store' : 'Hidden from store'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              Select a category on the left to manage its navigation menu.
            </div>
          )}
        </main>
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
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#85583f] hover:bg-[#724a34] rounded-xl shadow-xs transition"
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
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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

                  {/* Icon / Image Upload & Preset Picker */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-700">Icon / Thumbnail (optional)</span>
                      {itemModal.data?.iconUrl && (
                        <button
                          type="button"
                          onClick={() => setItemModal((prev) => ({ ...prev, data: { ...prev.data, iconUrl: '' } }))}
                          className="text-[11px] text-red-500 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Clear Icon
                        </button>
                      )}
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-3">
                      {/* Top Preview & Upload Button Row */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border border-stone-200/90 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {itemModal.data?.iconUrl ? (
                            <img
                              src={itemModal.data.iconUrl}
                              alt=""
                              className="w-full h-full object-contain rounded"
                            />
                          ) : (
                            <CategoryGlyph name={itemModal.data?.title || ''} className="w-6 h-6 text-[#85583f]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <input
                            ref={itemFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadItemIcon}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUploadingItemIcon}
                              onClick={() => itemFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <HiOutlineUpload className="w-3.5 h-3.5 text-[#85583f]" />
                              {isUploadingItemIcon ? 'Uploading…' : itemModal.data?.iconUrl ? 'Upload New Image' : 'Upload Image / Icon'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowManualUrlInput((prev) => !prev)}
                              className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                            >
                              {showManualUrlInput ? 'Hide URL' : 'Paste URL'}
                            </button>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1">
                            Upload custom image (PNG/WEBP/SVG) or pick a preset below
                          </p>
                        </div>
                      </div>

                      {/* Manual URL input toggle */}
                      {showManualUrlInput && (
                        <input
                          type="url"
                          placeholder="https://pub-...r2.dev/icons/bracelet.webp"
                          value={itemModal.data?.iconUrl || ''}
                          onChange={(e) =>
                            setItemModal((prev) => ({
                              ...prev,
                              data: { ...prev.data, iconUrl: e.target.value },
                            }))
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#85583f]"
                        />
                      )}

                      {/* Curated Jewelry Preset Icons */}
                      <div className="pt-2 border-t border-stone-200/60">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                          Or Pick a Preset Icon:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {PRESET_ICONS.map((preset) => {
                            const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(preset.svg)}`;
                            const isSelected = itemModal.data?.iconUrl === dataUrl;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() =>
                                  setItemModal((prev) => ({
                                    ...prev,
                                    data: { ...prev.data, iconUrl: dataUrl },
                                  }))
                                }
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#85583f] bg-[#85583f]/10 text-[#85583f] font-bold shadow-2xs'
                                    : 'border-stone-200 bg-white hover:bg-stone-100/70 text-stone-600'
                                }`}
                              >
                                <div
                                  className="w-4 h-4 shrink-0 flex items-center justify-center"
                                  dangerouslySetInnerHTML={{ __html: preset.svg }}
                                />
                                <span className="text-[11px] truncate">{preset.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

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
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#85583f] hover:bg-[#724a34] rounded-xl shadow-xs transition"
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
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
                    />
                  </label>

                  {/* Banner Image Upload & Preview */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-700">Banner Image *</span>
                      {bannerModal.data?.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerModal((prev) => ({ ...prev, data: { ...prev.data, imageUrl: '' } }))}
                          className="text-[11px] text-red-500 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Clear Image
                        </button>
                      )}
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {bannerModal.data?.imageUrl ? (
                            <img src={bannerModal.data.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <HiOutlinePhotograph className="w-6 h-6 text-stone-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <input
                            ref={bannerFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadBannerImage}
                          />
                          <button
                            type="button"
                            disabled={isUploadingBanner}
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <HiOutlineUpload className="w-3.5 h-3.5 text-[#85583f]" />
                            {isUploadingBanner ? 'Uploading…' : bannerModal.data?.imageUrl ? 'Replace Image' : 'Upload Banner Image'}
                          </button>
                          <p className="text-[10px] text-stone-400 mt-1">
                            PNG, JPG, WEBP (up to 5MB)
                          </p>
                        </div>
                      </div>

                      <input
                        required
                        type="url"
                        placeholder="Or enter image URL (https://...)"
                        value={bannerModal.data?.imageUrl || ''}
                        onChange={(e) =>
                          setBannerModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, imageUrl: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#85583f]"
                      />
                    </div>
                  </div>

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
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#85583f]"
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
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#85583f] hover:bg-[#724a34] rounded-xl shadow-xs transition"
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
