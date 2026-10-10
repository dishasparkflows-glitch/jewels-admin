import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineFolder,
  HiOutlinePlus,
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDotsVertical,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineMenuAlt2,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineStar,
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoSparklesOutline,
  IoBagOutline,
  IoCubeOutline,
  IoHeartOutline,
  IoRibbonOutline,
  IoColorPaletteOutline,
  IoLayersOutline,
  IoImagesOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useConfirm } from '../../contexts/ConfirmContext';
import Dropdown from '../../components/common/Dropdown';

// Available Icons for Jewelry Navigation
const AVAILABLE_ICONS = [
  { id: 'diamond', label: 'Diamond', icon: IoDiamondOutline },
  { id: 'ring', label: 'Ring Band', icon: IoSparklesOutline },
  { id: 'gem', label: 'Cocktail Gem', icon: IoCubeOutline },
  { id: 'star', label: 'Star / Featured', icon: HiOutlineStar },
  { id: 'bag', label: 'Shopping Bag', icon: IoBagOutline },
  { id: 'heart', label: 'Heart', icon: IoHeartOutline },
  { id: 'ribbon', label: 'Ribbon', icon: IoRibbonOutline },
  { id: 'palette', label: 'Color / Metal', icon: IoColorPaletteOutline },
  { id: 'layers', label: 'Mega Menu', icon: IoLayersOutline },
  { id: 'shield', label: 'Certified', icon: HiOutlineShieldCheck },
];

const getIconComponent = (iconId, className = 'w-4 h-4') => {
  const match = AVAILABLE_ICONS.find((i) => i.id === iconId);
  const IconCmp = match ? match.icon : IoDiamondOutline;
  return <IconCmp className={className} />;
};

export default function NavigationMenusView() {
  const confirm = useConfirm();

  // Top Tabs: main, footer, utility, settings
  const [activeTab, setActiveTab] = useState('main');

  // Navigation Data
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Active View: 'list' (Screen 1) | 'detail' (Screen 2 & Screen 4)
  const [currentView, setCurrentView] = useState('list');
  const [selectedMenu, setSelectedMenu] = useState(null);

  // Detail Sub-Tabs: 'sections' (Screen 2) | 'banners' (Screen 4) | 'basic'
  const [detailTab, setDetailTab] = useState('sections');

  // Modal States
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [isEditMenuModalOpen, setIsEditMenuModalOpen] = useState(false);
  const [menuModalTab, setMenuModalTab] = useState('details'); // 'details' | 'link' | 'display'
  const [menuFormData, setMenuFormData] = useState({
    title: '',
    navType: 'main',
    type: 'Category',
    categoryId: '',
    customUrl: '',
    iconName: 'diamond',
    openInNewTab: false,
    isMegaMenu: true,
    status: 'active',
    parentSectionId: '',
    advancedOpen: false,
  });

  // Section Modal (Screen 2)
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    icon: 'star',
    status: 'active',
    order: 1,
  });

  // Banner Modal (Screen 4)
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '/products/ring_catalog.jpg',
    linkType: 'Category',
    categoryId: '',
    categoryName: '',
    status: 'active',
    order: 1,
  });

  // Action Menu Dropdown state (row ID)
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Icon selector modal
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState('menu'); // 'menu' | 'section'

  // ─── Fetch Categories for Dropdowns ────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories?limit=100');
      const data = res.data?.data?.items || res.data?.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }, []);

  // ─── Fetch Menus ───────────────────────────────────────────
  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/navigation-menus?navType=${activeTab}`);
      const data = res.data?.data || [];
      setMenus(Array.isArray(data) ? data : []);

      // If viewing a detail menu, sync updated object
      if (selectedMenu?._id) {
        const found = (Array.isArray(data) ? data : []).find((m) => m._id === selectedMenu._id);
        if (found) setSelectedMenu(found);
      }
    } catch (err) {
      toast.error('Failed to load navigation menus');
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedMenu?._id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Close actions dropdown on outside click
  useEffect(() => {
    const handleWindowClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filtered menus
  const filteredMenus = useMemo(() => {
    if (!search.trim()) return menus;
    const q = search.toLowerCase();
    return menus.filter((m) => m.title?.toLowerCase().includes(q));
  }, [menus, search]);

  // Category Dropdown options
  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({
      value: c._id,
      label: c.name,
      sublabel: c.type === 'collection' ? 'Collection' : 'Category',
    }));
  }, [categories]);

  // ─── Menu Toggle Status ────────────────────────────────────
  const handleToggleMenuStatus = async (menu, e) => {
    if (e) e.stopPropagation();
    const newStatus = menu.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/navigation-menus/${menu._id}`, { status: newStatus });
      toast.success(`${menu.title} is now ${newStatus}`);
      setMenus((prev) =>
        prev.map((m) => (m._id === menu._id ? { ...m, status: newStatus } : m))
      );
      if (selectedMenu?._id === menu._id) {
        setSelectedMenu((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {
      toast.error('Could not update status');
    }
  };

  // ─── Delete Menu Item ──────────────────────────────────────
  const handleDeleteMenu = async (menu, e) => {
    if (e) e.stopPropagation();
    const ok = await confirm({
      title: `Delete "${menu.title}" Menu`,
      message: 'Are you sure you want to remove this navigation menu item? This cannot be undone.',
      confirmText: 'Delete Menu',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    try {
      await api.delete(`/navigation-menus/${menu._id}`);
      toast.success(`"${menu.title}" deleted`);
      setMenus((prev) => prev.filter((m) => m._id !== menu._id));
      if (selectedMenu?._id === menu._id) {
        setCurrentView('list');
        setSelectedMenu(null);
      }
    } catch {
      toast.error('Failed to delete menu');
    }
  };

  // ─── Open Menu in Detail View (Screen 2) ───────────────────
  const handleOpenDetail = (menu) => {
    setSelectedMenu(menu);
    setDetailTab('sections');
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Open Add Menu Item Modal (Screen 3) ───────────────────
  const handleOpenAddModal = () => {
    setMenuFormData({
      title: '',
      navType: activeTab === 'settings' ? 'main' : activeTab,
      type: 'Category',
      categoryId: categories[0]?._id || '',
      customUrl: '',
      iconName: 'diamond',
      openInNewTab: false,
      isMegaMenu: true,
      status: 'active',
      parentSectionId: '',
      advancedOpen: false,
    });
    setMenuModalTab('details');
    setIsEditMenuModalOpen(false);
    setIsAddMenuModalOpen(true);
  };

  // ─── Save New / Edit Menu Item (Screen 3) ──────────────────
  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuFormData.title.trim()) {
      toast.error('Please enter a menu title / label');
      return;
    }

    try {
      const payload = {
        title: menuFormData.title.trim(),
        navType: menuFormData.navType,
        type: menuFormData.type,
        categoryId: menuFormData.type === 'Category' ? menuFormData.categoryId || null : null,
        customUrl: menuFormData.type === 'Custom Link' ? menuFormData.customUrl : '',
        openInNewTab: Boolean(menuFormData.openInNewTab),
        isMegaMenu: Boolean(menuFormData.isMegaMenu),
        status: menuFormData.status,
        icon: { name: menuFormData.iconName },
        image: {
          url:
            menuFormData.title.toLowerCase().includes('ring')
              ? '/products/ring_catalog.jpg'
              : menuFormData.title.toLowerCase().includes('earring')
              ? '/featured/earring.jpg'
              : menuFormData.title.toLowerCase().includes('necklace') || menuFormData.title.toLowerCase().includes('pendant')
              ? '/featured/necklace.jpg'
              : '/featured/bangles.jpg',
        },
      };

      if (isEditMenuModalOpen && selectedMenu?._id) {
        const res = await api.put(`/navigation-menus/${selectedMenu._id}`, payload);
        const updated = res.data?.data || payload;
        toast.success(`"${payload.title}" updated successfully!`);
        setSelectedMenu((prev) => ({ ...prev, ...updated }));
      } else {
        await api.post('/navigation-menus', payload);
        toast.success(`"${payload.title}" created successfully!`);
      }

      setIsAddMenuModalOpen(false);
      setIsEditMenuModalOpen(false);
      fetchMenus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  // ─── Section CRUD (Screen 2) ───────────────────────────────
  const handleOpenAddSection = () => {
    setEditingSectionId(null);
    setSectionFormData({
      title: '',
      icon: 'star',
      status: 'active',
      order: (selectedMenu?.sections?.length || 0) + 1,
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (section) => {
    setEditingSectionId(section._id);
    setSectionFormData({
      title: section.title,
      icon: section.icon || 'star',
      status: section.status || 'active',
      order: section.order || 1,
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionFormData.title.trim()) {
      toast.error('Please enter section title');
      return;
    }
    if (!selectedMenu?._id) return;

    try {
      if (editingSectionId) {
        const res = await api.put(
          `/navigation-menus/${selectedMenu._id}/sections/${editingSectionId}`,
          sectionFormData
        );
        toast.success('Section updated!');
        setSelectedMenu(res.data?.data);
      } else {
        const res = await api.post(
          `/navigation-menus/${selectedMenu._id}/sections`,
          sectionFormData
        );
        toast.success('Section added!');
        setSelectedMenu(res.data?.data);
      }
      setIsSectionModalOpen(false);
      fetchMenus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!selectedMenu?._id) return;
    const ok = await confirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this menu section and its sub-items?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    try {
      const res = await api.delete(
        `/navigation-menus/${selectedMenu._id}/sections/${sectionId}`
      );
      toast.success('Section deleted');
      setSelectedMenu(res.data?.data);
      fetchMenus();
    } catch {
      toast.error('Could not delete section');
    }
  };

  // ─── Banner CRUD (Screen 4) ────────────────────────────────
  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setBannerFormData({
      title: '',
      subtitle: '',
      imageUrl: '/products/ring_catalog.jpg',
      linkType: 'Category',
      categoryId: categories[0]?._id || '',
      categoryName: categories[0]?.name || '',
      status: 'active',
      order: (selectedMenu?.banners?.length || 0) + 1,
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerFormData.title.trim()) {
      toast.error('Please enter banner title');
      return;
    }
    if (!selectedMenu?._id) return;

    try {
      const payload = {
        title: bannerFormData.title.trim(),
        subtitle: bannerFormData.subtitle.trim(),
        image: { url: bannerFormData.imageUrl },
        linkType: bannerFormData.linkType,
        categoryId: bannerFormData.categoryId || null,
        categoryName: bannerFormData.categoryName,
        status: bannerFormData.status,
        order: Number(bannerFormData.order) || 1,
      };

      if (editingBannerId) {
        const res = await api.put(
          `/navigation-menus/${selectedMenu._id}/banners/${editingBannerId}`,
          payload
        );
        toast.success('Banner updated!');
        setSelectedMenu(res.data?.data);
      } else {
        const res = await api.post(
          `/navigation-menus/${selectedMenu._id}/banners`,
          payload
        );
        toast.success('Banner added!');
        setSelectedMenu(res.data?.data);
      }
      setIsBannerModalOpen(false);
      fetchMenus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleUpdateBannerField = async (bannerId, field, value) => {
    if (!selectedMenu?._id) return;
    try {
      const target = selectedMenu.banners?.find((b) => b._id === bannerId);
      if (!target) return;
      const updated = { ...target, [field]: value };
      const res = await api.put(
        `/navigation-menus/${selectedMenu._id}/banners/${bannerId}`,
        updated
      );
      setSelectedMenu(res.data?.data);
      toast.success('Banner updated');
    } catch {
      toast.error('Failed to update banner');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!selectedMenu?._id) return;
    const ok = await confirm({
      title: 'Delete Banner',
      message: 'Are you sure you want to remove this promotional banner card?',
      confirmText: 'Delete Banner',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    try {
      const res = await api.delete(
        `/navigation-menus/${selectedMenu._id}/banners/${bannerId}`
      );
      toast.success('Banner deleted');
      setSelectedMenu(res.data?.data);
      fetchMenus();
    } catch {
      toast.error('Could not delete banner');
    }
  };

  return (
    <div className="space-y-5 pb-10 font-sans text-stone-800 animate-fadeIn">
      {/* ════════════════════════════════════════════════════════════
          SCREEN 1: MAIN NAVIGATION MENUS LISTING
      ════════════════════════════════════════════════════════════ */}
      {currentView === 'list' && (
        <div className="space-y-4">
          {/* ─── Top Header (Icon + Title + Subtitle + Add Button) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#faf6f0] border border-[#e8dac7] text-[#8b6f4e] flex items-center justify-center font-bold text-lg shadow-2xs">
                <HiOutlineFolder className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 font-serif tracking-tight leading-tight">
                  Navigation Menus
                </h1>
                <p className="text-xs text-stone-400">
                  Manage the main website navigation, mega menus and custom links.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Menu Item</span>
            </button>
          </div>

          {/* ─── Main Tabs Bar (Matches Screenshot 1) ─────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'main', label: 'Main Navigation' },
              { id: 'footer', label: 'Footer Navigation' },
              { id: 'utility', label: 'Utility Links' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    isActive
                      ? 'bg-[#8b6f4e] text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-stone-200/90'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Search & Quick Filter Bar ─────────────────────── */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search navigation items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
              />
            </div>
            <span className="text-[11px] font-semibold text-stone-400">
              {filteredMenus.length} items configured
            </span>
          </div>

          {/* ─── Table: Menu Items (Exact match with Screen 1) ─── */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/70 text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">#</th>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-4">MENU ITEM</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-stone-400">
                        <div className="inline-block animate-spin w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full mb-2" />
                        <p className="text-xs">Loading navigation menus...</p>
                      </td>
                    </tr>
                  ) : filteredMenus.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-stone-400">
                        No menu items found for this navigation category.
                      </td>
                    </tr>
                  ) : (
                    filteredMenus.map((menu, idx) => {
                      const sectionsCount = menu.sections?.length || 0;
                      const isDropdownOpen = openDropdownId === menu._id;

                      return (
                        <tr
                          key={menu._id}
                          onClick={() => handleOpenDetail(menu)}
                          className="hover:bg-[#faf9f7] transition-colors cursor-pointer group"
                        >
                          {/* Drag handle */}
                          <td className="py-3 px-3 text-center text-stone-300 group-hover:text-stone-500 cursor-grab">
                            <HiOutlineMenuAlt2 className="w-4 h-4 mx-auto" />
                          </td>

                          {/* Index */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-stone-600 text-xs">
                            {idx + 1}
                          </td>

                          {/* Menu Item: Icon/Thumbnail + Title + Subtitle */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200/80 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                                {menu.image?.url ? (
                                  <img
                                    src={menu.image.url}
                                    alt={menu.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  getIconComponent(menu.icon?.name, 'w-4 h-4 text-[#8b6f4e]')
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors leading-tight">
                                  {menu.title}
                                </p>
                                <p className="text-[11px] text-stone-400 leading-tight">
                                  {menu.isMegaMenu && sectionsCount > 0
                                    ? `Mega Menu (${sectionsCount} sections)`
                                    : menu.type === 'Custom Link'
                                    ? 'Custom Link'
                                    : 'Standard Menu Link'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                menu.type === 'Custom Link'
                                  ? 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                                  : 'bg-[#faf5ee] text-[#8b6f4e] border border-[#e8dac7]'
                              }`}
                            >
                              {menu.type}
                            </span>
                          </td>

                          {/* Status Switch Toggle */}
                          <td
                            className="py-3 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleToggleMenuStatus(menu, e)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                                menu.status === 'active' ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-2xs transition-transform ${
                                  menu.status === 'active' ? 'translate-x-4.5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Actions: Edit + More options */}
                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5 relative">
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(menu)}
                                className="px-3 py-1 text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 rounded-lg hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(isDropdownOpen ? null : menu._id);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200/90 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                              >
                                <HiOutlineDotsVertical className="w-3.5 h-3.5" />
                              </button>

                              {/* Dropdown Menu */}
                              {isDropdownOpen && (
                                <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-white border border-stone-200 shadow-xl py-1 text-xs text-left animate-scaleUp">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetail(menu)}
                                    className="w-full px-3.5 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 font-medium"
                                  >
                                    <HiOutlineEye className="w-3.5 h-3.5 text-[#8b6f4e]" />
                                    <span>Manage Sections</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedMenu(menu);
                                      setMenuFormData({
                                        title: menu.title,
                                        navType: menu.navType || 'main',
                                        type: menu.type || 'Category',
                                        categoryId: menu.categoryId?._id || menu.categoryId || '',
                                        customUrl: menu.customUrl || '',
                                        iconName: menu.icon?.name || 'diamond',
                                        openInNewTab: Boolean(menu.openInNewTab),
                                        isMegaMenu: Boolean(menu.isMegaMenu),
                                        status: menu.status || 'active',
                                        parentSectionId: '',
                                        advancedOpen: false,
                                      });
                                      setIsEditMenuModalOpen(true);
                                      setIsAddMenuModalOpen(true);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 font-medium"
                                  >
                                    <HiOutlinePencil className="w-3.5 h-3.5 text-stone-400" />
                                    <span>Edit Info</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleMenuStatus(menu, e)}
                                    className="w-full px-3.5 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700 font-medium"
                                  >
                                    <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Toggle Status</span>
                                  </button>
                                  <div className="my-1 border-t border-stone-100" />
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteMenu(menu, e)}
                                    className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Menu</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          SCREEN 2 & SCREEN 4: DETAILED MENU VIEW (Sections & Banners)
      ════════════════════════════════════════════════════════════ */}
      {currentView === 'detail' && selectedMenu && (
        <div className="space-y-4 animate-fadeIn">
          {/* ─── Detail Header (Back button + Thumbnail + Title + Add Button) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView('list')}
                className="w-9 h-9 rounded-xl border border-stone-200/90 text-stone-600 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Back to Navigation Menus"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200/90 overflow-hidden flex items-center justify-center shadow-2xs">
                {selectedMenu.image?.url ? (
                  <img
                    src={selectedMenu.image.url}
                    alt={selectedMenu.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getIconComponent(selectedMenu.icon?.name, 'w-5 h-5 text-[#8b6f4e]')
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-stone-900 font-serif leading-tight">
                    {selectedMenu.title}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedMenu.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedMenu.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'
                      }`}
                    />
                    <span className="capitalize">{selectedMenu.status}</span>
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  {selectedMenu.type} • {selectedMenu.isMegaMenu ? 'Mega Menu' : 'Standard Link'}
                </p>
              </div>
            </div>

            {/* Top Action Button according to active tab */}
            <div className="flex items-center gap-2">
              {detailTab === 'sections' && (
                <button
                  type="button"
                  onClick={handleOpenAddSection}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Section</span>
                </button>
              )}

              {detailTab === 'banners' && (
                <button
                  type="button"
                  onClick={handleOpenAddBanner}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Banner</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── Detail Sub-Tabs (Basic Info, Menu Sections (N), Banners (M)) ── */}
          <div className="flex items-center gap-2 border-b border-stone-200/90 pb-2">
            {[
              { id: 'basic', label: 'Basic Info' },
              {
                id: 'sections',
                label: `Menu Sections (${selectedMenu.sections?.length || 0})`,
              },
              {
                id: 'banners',
                label: `Banners (${selectedMenu.banners?.length || 0})`,
              },
            ].map((tab) => {
              const isActive = detailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8b6f4e] text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── SCREEN 2: MENU SECTIONS TAB ───────────────────── */}
          {detailTab === 'sections' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/70 text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">
                      <th className="py-3 px-3 w-8 text-center">#</th>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-4">SECTION TITLE</th>
                      <th className="py-3 px-4">ITEMS</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {(selectedMenu.sections?.length || 0) === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-stone-400">
                          No sections created under this mega menu yet. Click "Add Section" above.
                        </td>
                      </tr>
                    ) : (
                      selectedMenu.sections.map((section, idx) => (
                        <tr
                          key={section._id || idx}
                          className="hover:bg-[#faf9f7] transition-colors group"
                        >
                          {/* Drag handle */}
                          <td className="py-3 px-3 text-center text-stone-300 group-hover:text-stone-500 cursor-grab">
                            <HiOutlineMenuAlt2 className="w-4 h-4 mx-auto" />
                          </td>

                          {/* Index */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-stone-600">
                            {idx + 1}
                          </td>

                          {/* Section Title with Icon */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#faf5ee] border border-[#e8dac7] text-[#8b6f4e] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {getIconComponent(section.icon, 'w-3.5 h-3.5')}
                              </div>
                              <span className="font-bold text-stone-900">{section.title}</span>
                            </div>
                          </td>

                          {/* Items count */}
                          <td className="py-3 px-4 text-stone-500 font-medium">
                            <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60 font-semibold text-[11px] text-stone-700">
                              {section.items?.length || 0} items
                            </span>
                          </td>

                          {/* Actions: Edit + Delete */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSection(section)}
                                className="px-3 py-1 text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 rounded-lg hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSection(section._id)}
                                className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete Section"
                              >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── SCREEN 4: BANNERS TAB ──────────────────────────── */}
          {detailTab === 'banners' && (
            <div className="space-y-3 animate-fadeIn">
              {(selectedMenu.banners?.length || 0) === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center text-stone-400">
                  <IoImagesOutline className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-600">No promotional banners configured</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Add banners to feature prominent collections inside this mega menu.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddBanner}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs cursor-pointer"
                  >
                    Add First Banner
                  </button>
                </div>
              ) : (
                selectedMenu.banners.map((banner, idx) => (
                  <div
                    key={banner._id || idx}
                    className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-col lg:flex-row items-center gap-4 transition-all hover:border-[#8b6f4e]/40"
                  >
                    {/* Drag Handle */}
                    <div className="text-stone-300 hover:text-stone-500 cursor-grab hidden lg:block">
                      <HiOutlineMenuAlt2 className="w-5 h-5" />
                    </div>

                    {/* Banner Image Preview */}
                    <div className="w-full lg:w-48 h-28 rounded-xl bg-stone-100 border border-stone-200/80 overflow-hidden flex-shrink-0 relative group">
                      <img
                        src={banner.image?.url || '/products/ring_catalog.jpg'}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Banner Preview
                      </div>
                    </div>

                    {/* Banner Editable Form Grid (Matches Screenshot 4) */}
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700">Title</label>
                        <input
                          type="text"
                          defaultValue={banner.title}
                          onBlur={(e) => handleUpdateBannerField(banner._id, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700">Subtitle</label>
                        <input
                          type="text"
                          defaultValue={banner.subtitle}
                          onBlur={(e) => handleUpdateBannerField(banner._id, 'subtitle', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      {/* Link Type */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700">Link Type</label>
                        <Dropdown
                          size="sm"
                          value={banner.linkType || 'Category'}
                          onChange={(val) => handleUpdateBannerField(banner._id, 'linkType', val)}
                          options={['Category', 'Custom Link', 'Collection']}
                          buttonClassName="h-8.5 px-3 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                        />
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700">Category</label>
                        <Dropdown
                          size="sm"
                          value={banner.categoryId || categories[0]?._id}
                          onChange={(val, opt) => {
                            handleUpdateBannerField(banner._id, 'categoryId', val);
                            if (opt?.label) handleUpdateBannerField(banner._id, 'categoryName', opt.label);
                          }}
                          options={categoryOptions}
                          buttonClassName="h-8.5 px-3 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                        />
                      </div>
                    </div>

                    {/* Actions: Status Toggle + Order + Delete */}
                    <div className="flex items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 w-full lg:w-auto justify-between lg:justify-end">
                      {/* Status */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-stone-400 mb-1">Status</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateBannerField(
                              banner._id,
                              'status',
                              banner.status === 'active' ? 'inactive' : 'active'
                            )
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            banner.status === 'active' ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-2xs ${
                              banner.status === 'active' ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Order Input */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-stone-400 mb-1">Order</span>
                        <input
                          type="number"
                          defaultValue={banner.order || idx + 1}
                          onBlur={(e) =>
                            handleUpdateBannerField(banner._id, 'order', Number(e.target.value) || 1)
                          }
                          className="w-12 px-2 py-1 text-center text-xs font-mono font-bold rounded-lg border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner._id)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer mt-3"
                        title="Delete Banner"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── BASIC INFO TAB ─────────────────────────────────── */}
          {detailTab === 'basic' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-4 max-w-xl animate-fadeIn">
              <h3 className="text-sm font-bold text-stone-900 font-serif">
                Edit Menu Settings
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Menu Title *</label>
                  <input
                    type="text"
                    value={selectedMenu.title}
                    onChange={(e) =>
                      setSelectedMenu((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Link Type</label>
                  <Dropdown
                    size="sm"
                    value={selectedMenu.type}
                    onChange={(val) =>
                      setSelectedMenu((prev) => ({ ...prev, type: val }))
                    }
                    options={['Category', 'Custom Link', 'Collection', 'Page']}
                  />
                </div>

                {selectedMenu.type === 'Category' ? (
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Target Category</label>
                    <Dropdown
                      size="sm"
                      value={selectedMenu.categoryId?._id || selectedMenu.categoryId}
                      onChange={(val) =>
                        setSelectedMenu((prev) => ({ ...prev, categoryId: val }))
                      }
                      options={categoryOptions}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Custom URL</label>
                    <input
                      type="text"
                      value={selectedMenu.customUrl || ''}
                      onChange={(e) =>
                        setSelectedMenu((prev) => ({ ...prev, customUrl: e.target.value }))
                      }
                      placeholder="/collections/bridal"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-bold text-stone-700 block">Mega Menu Behavior</span>
                    <span className="text-[11px] text-stone-400">
                      Show full width dropdown with sections and banners
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedMenu.isMegaMenu}
                    onChange={(e) =>
                      setSelectedMenu((prev) => ({ ...prev, isMegaMenu: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-[#8b6f4e] accent-[#8b6f4e]"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.put(
                          `/navigation-menus/${selectedMenu._id}`,
                          selectedMenu
                        );
                        toast.success('Menu settings saved!');
                        setSelectedMenu(res.data?.data || selectedMenu);
                        fetchMenus();
                      } catch {
                        toast.error('Failed to save settings');
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          SCREEN 3: ADD / EDIT MENU ITEM MODAL
      ════════════════════════════════════════════════════════════ */}
      {isAddMenuModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsAddMenuModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                {isEditMenuModalOpen ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMenuModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs (Matches Screen 3: Menu Item Details, Link Configuration, Display Options) */}
            <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
              {[
                { id: 'details', label: 'Menu Item Details' },
                { id: 'link', label: 'Link Configuration' },
                { id: 'display', label: 'Display Options' },
              ].map((tab) => {
                const isActive = menuModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMenuModalTab(tab.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'text-[#8b6f4e] border-b-2 border-[#8b6f4e] rounded-b-none'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Form Fields: Two Columns (Exact match with Screen 3) */}
            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                {/* ─── LEFT COLUMN ─── */}
                <div className="space-y-4">
                  {/* Label * */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Solitaire Rings"
                      value={menuFormData.title}
                      onChange={(e) =>
                        setMenuFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                    <p className="text-[10px] text-stone-400">
                      This name will be shown in the navigation.
                    </p>
                  </div>

                  {/* Icon (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">Icon (Optional)</label>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-[#8b6f4e] shadow-2xs">
                        {getIconComponent(menuFormData.iconName, 'w-5 h-5')}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIconPickerTarget('menu');
                          setIsIconPickerOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <HiOutlineSparkles className="w-3.5 h-3.5 text-[#8b6f4e]" />
                        <span>Change Icon</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400">Recommended size: 32×32px</p>
                  </div>

                  {/* Open in new tab Switch */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMenuFormData((prev) => ({
                          ...prev,
                          openInNewTab: !prev.openInNewTab,
                        }))
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        menuFormData.openInNewTab ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-2xs ${
                          menuFormData.openInNewTab ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-xs font-bold text-stone-700 block">Open in new tab</span>
                      <span className="text-[10px] text-stone-400">
                        Open link in new browser tab.
                      </span>
                    </div>
                  </div>

                  {/* Advanced Options Accordion */}
                  <div className="pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() =>
                        setMenuFormData((prev) => ({
                          ...prev,
                          advancedOpen: !prev.advancedOpen,
                        }))
                      }
                      className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlineChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          menuFormData.advancedOpen ? 'rotate-90' : ''
                        }`}
                      />
                      <span>Advanced Options</span>
                    </button>
                    {menuFormData.advancedOpen && (
                      <div className="mt-2.5 p-3 rounded-xl bg-stone-50/70 border border-stone-200/70 space-y-2 animate-fadeIn text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={menuFormData.isMegaMenu}
                            onChange={(e) =>
                              setMenuFormData((prev) => ({
                                ...prev,
                                isMegaMenu: e.target.checked,
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-[#8b6f4e] accent-[#8b6f4e]"
                          />
                          <span className="font-semibold text-stone-700">Enable Mega Menu dropdown</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div className="space-y-4">
                  {/* Link Type * */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Link Type *</label>
                    <Dropdown
                      size="sm"
                      value={menuFormData.type}
                      onChange={(val) =>
                        setMenuFormData((prev) => ({ ...prev, type: val }))
                      }
                      options={['Category', 'Custom Link', 'Collection', 'Page']}
                      buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                    />
                  </div>

                  {/* Select Category * / Custom URL */}
                  {menuFormData.type === 'Category' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Select Category *</label>
                      <Dropdown
                        size="sm"
                        value={menuFormData.categoryId || categories[0]?._id}
                        onChange={(val) =>
                          setMenuFormData((prev) => ({ ...prev, categoryId: val }))
                        }
                        options={categoryOptions}
                        buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                      />
                      <p className="text-[10px] text-stone-400">
                        Select which category to open when clicked.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Target URL / Route *</label>
                      <input
                        type="text"
                        placeholder="e.g. /collections/bridal"
                        value={menuFormData.customUrl}
                        onChange={(e) =>
                          setMenuFormData((prev) => ({ ...prev, customUrl: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>
                  )}

                  {/* Parent Section * */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Parent Section</label>
                    <Dropdown
                      size="sm"
                      value={menuFormData.parentSectionId}
                      onChange={(val) =>
                        setMenuFormData((prev) => ({ ...prev, parentSectionId: val }))
                      }
                      options={[
                        { value: '', label: 'Root Navigation Menu' },
                        ...(selectedMenu?.sections || []).map((s) => ({
                          value: s._id,
                          label: s.title,
                        })),
                      ]}
                      buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                    />
                    <p className="text-[10px] text-stone-400">
                      Choose the menu section where this item will appear.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Cancel & Save Menu Item) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddMenuModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold tracking-wider text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs cursor-pointer"
                >
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT SECTION MODAL ───────────────────────── */}
      {isSectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsSectionModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                {editingSectionId ? 'Edit Section' : 'Add Menu Section'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Featured, Solitaire Rings, Wedding Bands"
                  value={sectionFormData.title}
                  onChange={(e) =>
                    setSectionFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Section Icon</label>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-[#8b6f4e]">
                    {getIconComponent(sectionFormData.icon, 'w-4 h-4')}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIconPickerTarget('section');
                      setIsIconPickerOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold cursor-pointer"
                  >
                    Select Icon
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Sort Order</label>
                <input
                  type="number"
                  value={sectionFormData.order}
                  onChange={(e) =>
                    setSectionFormData((prev) => ({
                      ...prev,
                      order: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-24 px-3 py-1.5 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-50 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl font-semibold shadow-xs"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT BANNER MODAL ────────────────────────── */}
      {isBannerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsBannerModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                {editingBannerId ? 'Edit Banner' : 'Add Mega Menu Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond Rings, Wedding Bands"
                  value={bannerFormData.title}
                  onChange={(e) =>
                    setBannerFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Timeless Brilliance, For Every Story"
                  value={bannerFormData.subtitle}
                  onChange={(e) =>
                    setBannerFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={bannerFormData.imageUrl}
                  onChange={(e) =>
                    setBannerFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Target Category</label>
                <Dropdown
                  size="sm"
                  value={bannerFormData.categoryId || categories[0]?._id}
                  onChange={(val, opt) =>
                    setBannerFormData((prev) => ({
                      ...prev,
                      categoryId: val,
                      categoryName: opt?.label || '',
                    }))
                  }
                  options={categoryOptions}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-50 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl font-semibold shadow-xs"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ICON PICKER MODAL ──────────────────────────────── */}
      {isIconPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsIconPickerOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 font-serif">
                Select Luxury Icon
              </h4>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(false)}
                className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {AVAILABLE_ICONS.map((ico) => {
                const IconComponent = ico.icon;
                return (
                  <button
                    key={ico.id}
                    type="button"
                    onClick={() => {
                      if (iconPickerTarget === 'menu') {
                        setMenuFormData((prev) => ({ ...prev, iconName: ico.id }));
                      } else {
                        setSectionFormData((prev) => ({ ...prev, icon: ico.id }));
                      }
                      setIsIconPickerOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-stone-200 hover:border-[#8b6f4e] hover:bg-[#faf5ee] transition-all cursor-pointer group"
                  >
                    <IconComponent className="w-5 h-5 text-stone-600 group-hover:text-[#8b6f4e] mb-1" />
                    <span className="text-[9.5px] font-medium text-stone-500 group-hover:text-stone-900 text-center truncate w-full">
                      {ico.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
