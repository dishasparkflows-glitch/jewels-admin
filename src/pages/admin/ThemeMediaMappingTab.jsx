import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineRefresh,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineSparkles,
  HiOutlineViewGrid,
  HiOutlineInformationCircle,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineViewList,
  HiOutlineCloudUpload,
  HiOutlineCursorClick,
  HiOutlineLink,
  HiOutlineCalendar,
  HiOutlineCollection,
  HiOutlineCode,
  HiOutlineDotsHorizontal,
  HiOutlineChevronRight,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { themesAPI, galleryAPI, bannersAPI, featuredAPI } from '../../api/services';
import Dropdown from '../../components/common/Dropdown';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import { VITE_FRONT_URL } from '../../config/env';

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return { date: '—', time: '' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: '—', time: '' };
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const padHours = String(hours).padStart(2, '0');
    return {
      date: `${day} ${month} ${year}`,
      time: `${padHours}:${minutes} ${ampm}`,
    };
  } catch {
    return { date: '—', time: '' };
  }
};

const MODULE_TABS = [
  {
    key: 'herobanner',
    label: 'Hero Banners',
    icon: HiOutlineDesktopComputer,
    description: 'Main homepage hero carousel. Displayed prominently at the very top of the website.',
    recommendedDesktop: '1920 × 600 px (Landscape)',
    recommendedMobile: '768 × 1200 px (Portrait)',
  },
  {
    key: 'celebrate',
    label: 'Celebrate & Gifts',
    icon: IoDiamondOutline,
    description: 'Festive gift categories and gifting showcase cards on the homepage.',
    recommendedDesktop: '800 × 800 px (1:1 Square)',
    recommendedMobile: '800 × 800 px (1:1 Square)',
  },
  {
    key: 'category',
    label: 'Categories',
    icon: HiOutlineViewGrid,
    description: 'Category navigation icons and category page top header banners.',
    recommendedDesktop: 'Icon: 500 × 500 px · Banner: 1200 × 400 px',
    recommendedMobile: 'Icon: 500 × 500 px · Banner: 768 × 500 px',
  },
  {
    key: 'collectionbanner',
    label: 'Collections',
    icon: HiOutlineTag,
    description: 'Featured collection banners and seasonal curated collection cards.',
    recommendedDesktop: '1920 × 600 px (Wide)',
    recommendedMobile: '768 × 1000 px',
  },
  {
    key: 'offerbanner',
    label: 'Offer Banners',
    icon: HiOutlineGift,
    description: 'Special coupon, festival sale, and promotional offer banners.',
    recommendedDesktop: '1920 × 450 px',
    recommendedMobile: '768 × 800 px',
  },
  {
    key: 'mobileappbanner',
    label: 'App Banners',
    icon: HiOutlineDeviceMobile,
    description: 'App store download strips and mobile app promotional blocks.',
    recommendedDesktop: '1920 × 500 px',
    recommendedMobile: '768 × 800 px',
  },
  {
    key: 'customizebanner',
    label: 'Custom & Other',
    icon: HiOutlineSparkles,
    description: 'Bespoke jewelry, book appointment, and custom section banners.',
    recommendedDesktop: '1600 × 600 px',
    recommendedMobile: '768 × 800 px',
  },
];

const BANNER_TYPES = [
  {
    key: 'herobanner',
    label: 'Hero Banner',
    icon: HiOutlineDesktopComputer,
    desc: 'Main homepage slider banner for top section.',
  },
  {
    key: 'collectionbanner',
    label: 'Collection Banner',
    icon: HiOutlineTag,
    desc: 'Banners for collection pages and featured collections.',
  },
  {
    key: 'categorybanner',
    label: 'Category Banner',
    icon: HiOutlineViewGrid,
    desc: 'Banners for category pages and category highlights.',
  },
  {
    key: 'offerbanner',
    label: 'Offer Banner',
    icon: HiOutlineGift,
    desc: 'Banners for offers, promotions and special deals.',
  },
  {
    key: 'mobileappbanner',
    label: 'App Banner',
    icon: HiOutlineDeviceMobile,
    desc: 'Banners for app download promotion.',
  },
  {
    key: 'bookappointbanner',
    label: 'Appointment Banner',
    icon: HiOutlineCalendar,
    desc: 'Banners for appointment booking section.',
  },
  {
    key: 'customizebanner',
    label: 'Custom Banner',
    icon: HiOutlineCode,
    desc: 'Custom banners for special pages or campaigns.',
  },
  {
    key: 'websitebanner',
    label: 'Other',
    icon: HiOutlineDotsHorizontal,
    desc: 'Other banners and miscellaneous placements.',
  },
];

const PLACEMENT_OPTIONS = [
  {
    value: 'all',
    label: 'All Placement Types',
    sublabel: 'Show all banner and media placements',
    icon: HiOutlineCollection,
    module: null,
  },
  {
    value: 'herobanner',
    label: 'Hero Banner',
    sublabel: 'Homepage main hero slider',
    icon: HiOutlineDesktopComputer,
    module: 'herobanner',
  },
  {
    value: 'collectionbanner',
    label: 'Collection Banner',
    sublabel: '4-tile curated collection showcase',
    icon: HiOutlineTag,
    module: 'collectionbanner',
  },
  {
    value: 'categorybanner',
    label: 'Category Banner',
    sublabel: 'Category page top header banner & icons',
    icon: HiOutlineViewGrid,
    module: 'category',
  },
  {
    value: 'offerbanner',
    label: 'Offer Banner',
    sublabel: 'Promotional deals & discount banner',
    icon: HiOutlineGift,
    module: 'offerbanner',
  },
  {
    value: 'celebrate',
    label: 'Celebrate & Gifts',
    sublabel: 'Gift guide and celebrate showcase item',
    icon: IoDiamondOutline,
    module: 'celebrate',
  },
  {
    value: 'mobileappbanner',
    label: 'Mobile App Banner',
    sublabel: 'Mobile app download promotion',
    icon: HiOutlineDeviceMobile,
    module: 'mobileappbanner',
  },
  {
    value: 'bookappointbanner',
    label: 'Appointment Banner',
    sublabel: 'In-store appointment booking section',
    icon: HiOutlineCalendar,
    module: 'customizebanner',
  },
  {
    value: 'customizebanner',
    label: 'Custom Banner',
    sublabel: 'Custom pages and seasonal campaigns',
    icon: HiOutlineSparkles,
    module: 'customizebanner',
  },
];

const MODULE_TO_PLACEMENT = {
  herobanner: 'herobanner',
  celebrate: 'celebrate',
  category: 'categorybanner',
  collectionbanner: 'collectionbanner',
  offerbanner: 'offerbanner',
  mobileappbanner: 'mobileappbanner',
  customizebanner: 'customizebanner',
};

// Filter options matching gallery.model.js L23-L38 (placement enum)
const GALLERY_PLACEMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Placements' },
  { value: 'herobanner', label: 'Hero Banner' },
  { value: 'collectionbanner', label: 'Collection Banner' },
  { value: 'categorybanner', label: 'Category Banner' },
  { value: 'offerbanner', label: 'Offer Banner' },
  { value: 'celebrate', label: 'Celebrate & Gifts' },
  { value: 'mobileappbanner', label: 'App Banner' },
  { value: 'bookappointbanner', label: 'Appointment Banner' },
  { value: 'customizebanner', label: 'Custom Banner' },
  { value: 'asset', label: 'Asset' },
];

// Filter options matching gallery.model.js L39-L44 (platform enum)
const GALLERY_PLATFORM_FILTER_OPTIONS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'web', label: 'Web' },
  { value: 'app', label: 'App' },
  { value: 'common', label: 'Common' },
];

export default function ThemeMediaMappingTab({
  theme,
  onThemeUpdated,
  onPreview,
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { openImagePreview } = useImagePreview();
  const themeId = theme?._id;

  // Active mapping mode ('banner' or 'celebrate')
  const [mappingMode, setMappingMode] = useState('banner');
  const [activeModule, setActiveModule] = useState('herobanner');
  const [selectedPlacement, setSelectedPlacement] = useState('herobanner');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, draft, mapped, unmapped
  const [deviceFilter, setDeviceFilter] = useState('all'); // all, web, mobile
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, order
  const [search, setSearch] = useState('');
  const [celebratePlacementFilter, setCelebratePlacementFilter] = useState('Celebrate'); // Celebrate, Gifts, all
  const { categories } = useCategoryLookup({ enabled: true });
  const [viewMode, setViewMode] = useState('table'); // standard table layout matching main screens

  // Data state
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bannerCounts, setBannerCounts] = useState({});

  // Fetch live counts from banners API
  useEffect(() => {
    bannersAPI.getCounts()
      .then((res) => {
        if (res.data?.data) {
          setBannerCounts(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectBannerType = (key) => {
    setActiveModule(key);
    setSelectedPlacement(key);
    setSelectedIds(new Set());
    setActiveTargetSlot(null);
  };

  // Aggregate stats for the 2 primary mapping boxes
  const bannerStats = useMemo(() => {
    const bannerModules = ['herobanner', 'collectionbanner', 'offerbanner', 'mobileappbanner', 'customizebanner'];
    const relevant = summary?.breakdown?.filter((b) => bannerModules.includes(b.module)) || [];
    const total = relevant.reduce((sum, b) => sum + (b.total || 0), 0);
    const mapped = relevant.reduce((sum, b) => sum + (b.mapped || 0), 0);
    return { total, mapped };
  }, [summary]);

  const celebrateStats = useMemo(() => {
    const b = summary?.breakdown?.find((item) => item.module === 'celebrate');
    return {
      total: b?.total || 0,
      mapped: b?.mapped || 0,
    };
  }, [summary]);

  // Handler when clicking on either Banner Mapping or Celebrate & Gift Mapping box
  const handleSelectMappingMode = (mode) => {
    setMappingMode(mode);
    setSelectedIds(new Set());
    setActiveTargetSlot(null);
    if (mode === 'banner') {
      setActiveModule('herobanner');
      setSelectedPlacement('herobanner');
    } else {
      setActiveModule('celebrate');
      setSelectedPlacement('celebrate');
    }
  };

  // Side panel gallery state
  const [sideGalleryItems, setSideGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryScope, setGalleryScope] = useState('theme'); // 'theme' or 'all'
  const [galleryPlacementFilter, setGalleryPlacementFilter] = useState('all');
  const [galleryPlatformFilter, setGalleryPlatformFilter] = useState('all');
  const [panelUploading, setPanelUploading] = useState(false);
  const panelFileInputRef = useRef(null);

  // Synchronized placement dropdown handler (updates both left module and right gallery filter)
  const handlePlacementSelect = (val) => {
    setSelectedPlacement(val);
    setSelectedIds(new Set());
    setActiveTargetSlot(null);

    if (val === 'all') {
      setGalleryPlacementFilter('all');
      return;
    }

    const opt = PLACEMENT_OPTIONS.find((o) => o.value === val);
    if (opt?.module) {
      setActiveModule(opt.module);
    }
    setGalleryPlacementFilter(val);
  };

  // Drag and drop & active target state
  const draggedAssetRef = useRef(null);
  const [dragOverSlot, setDragOverSlot] = useState(null); // { recordId, device, placement }
  const [activeTargetSlot, setActiveTargetSlot] = useState(null); // { record, device, placement }

  // Modal states
  const [pickerTarget, setPickerTarget] = useState(null); // { record, device, placement, currentMediaId }
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activating, setActivating] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // ─── 1. Load Summary Across All Modules ──────────────────
  const fetchSummary = useCallback(async () => {
    if (!themeId) return;
    try {
      const res = await themesAPI.getMappingSummary(themeId);
      const data = res.data?.data || res.data;
      setSummary(data);
    } catch (err) {
      console.error('Failed to load theme mapping summary:', err);
    }
  }, [themeId]);

  // ─── 2. Load Records for Current Module (Calls banners or featured API) ──────────────────
  const fetchRecords = useCallback(async () => {
    if (!themeId) return;
    try {
      setLoading(true);
      if (mappingMode === 'banner') {
        // Concurrently invoke bannersAPI.getThemeLookup and mapping records
        const [mappingRes] = await Promise.all([
          themesAPI.getMappingRecords(themeId, {
            module: activeModule,
            search,
            limit: 100,
          }),
          bannersAPI.getThemeLookup({
            type: activeModule,
            status: 'active',
          }).catch((err) => {
            console.warn('bannersAPI.getThemeLookup error:', err);
            return null;
          }),
        ]);
        const data = mappingRes?.data?.data || mappingRes?.data || {};
        setRecords(data.items || data.records || []);
      } else {
        // Concurrently invoke featuredAPI.getThemeLookup and mapping records
        const [mappingRes] = await Promise.all([
          themesAPI.getMappingRecords(themeId, {
            module: 'celebrate',
            search,
            limit: 100,
          }),
          featuredAPI.getThemeLookup({
            status: 'active',
          }).catch((err) => {
            console.warn('featuredAPI.getThemeLookup error:', err);
            return null;
          }),
        ]);
        const data = mappingRes?.data?.data || mappingRes?.data || {};
        setRecords(data.items || data.records || []);
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to load module records for mapping:', err);
      toast.error('Could not load module records');
    } finally {
      setLoading(false);
    }
  }, [themeId, mappingMode, activeModule, search]);

  // ─── 3. Load Side Panel Theme Gallery Items ──────────────
  const fetchSideGallery = useCallback(async () => {
    if (!themeId) return;
    try {
      setGalleryLoading(true);
      const params = {
        limit: 100,
      };
      if (galleryScope === 'theme') {
        params.themeId = themeId;
      }
      if (galleryPlacementFilter && galleryPlacementFilter !== 'all') {
        params.type = galleryPlacementFilter;
        params.placement = galleryPlacementFilter;
      }
      if (galleryPlatformFilter && galleryPlatformFilter !== 'all') {
        params.platform = galleryPlatformFilter;
      }
      const res = await galleryAPI.getLookup(params);
      const data = res.data?.data || res.data || [];
      const items = Array.isArray(data) ? data : (data.items || []);
      setSideGalleryItems(items);
    } catch (err) {
      console.error('Failed to load gallery for side panel:', err);
    } finally {
      setGalleryLoading(false);
    }
  }, [themeId, galleryScope, galleryPlacementFilter, galleryPlatformFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchSideGallery();
  }, [fetchSideGallery]);

  // Active module config details
  const activeModuleConfig = useMemo(() => {
    return (
      MODULE_TABS.find((t) => t.key === activeModule) || MODULE_TABS[0]
    );
  }, [activeModule]);

  // Current banner type config (for Banner Management view matching)
  const currentBannerType = useMemo(() => {
    return BANNER_TYPES.find((t) => t.key === activeModule) || BANNER_TYPES[0];
  }, [activeModule]);

  // ─── Filtered Records ────────────────────────────────────
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (mappingMode === 'banner') {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        result = result.filter((r) => {
          const t = (r.content?.title || r.title || '').toLowerCase();
          const d = (r.content?.description || r.subtitle || '').toLowerCase();
          const cat = categories.find((c) => String(c._id) === String(r.display?.categoryId?._id || r.display?.categoryId))?.name?.toLowerCase() || '';
          return t.includes(q) || d.includes(q) || cat.includes(q);
        });
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'active' || statusFilter === 'published') {
          result = result.filter((r) => r.status === 'active');
        } else if (statusFilter === 'draft' || statusFilter === 'inactive') {
          result = result.filter((r) => r.status !== 'active');
        } else if (statusFilter === 'mapped') {
          result = result.filter((r) => r.isMapped || Boolean(r.desktopMapping?.imageUrl));
        } else if (statusFilter === 'unmapped') {
          result = result.filter((r) => !r.isMapped && !r.desktopMapping?.imageUrl);
        }
      }

      if (deviceFilter !== 'all') {
        result = result.filter((r) => {
          if (deviceFilter === 'web') return Boolean(r.image?.url || r.desktopMapping?.imageUrl);
          if (deviceFilter === 'mobile') return Boolean(r.mobileImage?.url || r.mobileMapping?.imageUrl);
          return true;
        });
      }

      if (sortBy === 'order') {
        result.sort((a, b) => (a.display?.order ?? a.order ?? 0) - (b.display?.order ?? b.order ?? 0));
      } else if (sortBy === 'oldest') {
        result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      } else if (sortBy === 'newest') {
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
    } else {
      // celebrate mode
      if (celebratePlacementFilter !== 'all') {
        result = result.filter((r) => (r.placement || '').toLowerCase() === celebratePlacementFilter.toLowerCase());
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        result = result.filter((r) => (r.name || r.title || '').toLowerCase().includes(q));
      }
      if (statusFilter === 'mapped') {
        result = result.filter((r) => r.isMapped || Boolean(r.desktopMapping?.imageUrl));
      } else if (statusFilter === 'unmapped') {
        result = result.filter((r) => !r.isMapped && !r.desktopMapping?.imageUrl);
      }
    }

    return result;
  }, [records, mappingMode, search, statusFilter, deviceFilter, sortBy, celebratePlacementFilter, categories]);

  // ─── Selection Handlers ──────────────────────────────────
  const isAllSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.has(String(r._id)));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => String(r._id))));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const sid = String(id);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  // ─── Single Save Mapping Handler ─────────────────────────
  const handleSaveMapping = async (mediaAsset, customTarget = null) => {
    const target = customTarget || pickerTarget;
    if (!target || !themeId) return;
    const { record, device, placement } = target;

    try {
      await themesAPI.saveMapping(themeId, {
        module: activeModule,
        recordId: record._id,
        mediaId: mediaAsset._id,
        device: device || 'desktop',
        placement: placement || 'primary',
        status: 'active',
      });

      toast.success(
        `Mapped ${device === 'mobile' ? 'Mobile' : 'Desktop'} image for "${record.title || record.name}"`
      );

      setPickerTarget(null);
      setActiveTargetSlot(null);
      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Failed to save mapping:', err);
      toast.error(err.response?.data?.message || 'Could not save theme mapping');
    }
  };

  // ─── Direct File Upload & Map Immediately ────────────────
  const handleDirectUpload = async (file, record, device = 'desktop', placement = 'primary') => {
    if (!file || !themeId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }

    const toastId = toast.loading(`Uploading & optimizing ${file.name}…`);
    try {
      // 1. Upload file via presigned URL with auto-compression
      const upload = await uploadWithPresignedUrl(file, 'website-themes');

      // 2. Register media in Gallery with themeId and linkedRecord
      const galleryRes = await galleryAPI.create({
        themeId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: activeModule,
        placement: device,
        linkedRecord: {
          module: activeModule,
          recordId: record._id,
        },
        image: {
          url: upload.fileUrl,
          key: upload.key,
        },
      });

      const mediaAsset = galleryRes.data?.data || galleryRes.data;

      // 3. Save Theme Mapping
      await themesAPI.saveMapping(themeId, {
        module: activeModule,
        recordId: record._id,
        mediaId: mediaAsset._id,
        device,
        placement,
        status: 'active',
      });

      toast.success(
        `Theme image saved! (${formatBytes(upload.originalSize)} → ${formatBytes(upload.compressedSize)})`,
        { id: toastId }
      );

      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Direct upload failed:', err);
      toast.error(err.response?.data?.message || 'Could not upload theme image', {
        id: toastId,
      });
    }
  };

  // ─── Upload to Side Panel Gallery ─────────────────────────
  const handleSidePanelUpload = async (file) => {
    if (!file || !themeId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }

    setPanelUploading(true);
    const toastId = toast.loading(`Uploading to Theme Gallery: ${file.name}…`);
    try {
      const upload = await uploadWithPresignedUrl(file, 'website-themes');
      await galleryAPI.create({
        themeId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        placement: activeModule,
        platform: 'common',
        image: {
          url: upload.fileUrl,
          key: upload.key,
        },
      });

      toast.success(
        `Added to Theme Gallery! (${formatBytes(upload.originalSize)} → ${formatBytes(upload.compressedSize)})`,
        { id: toastId }
      );
      await fetchSideGallery();
    } catch (err) {
      console.error('Failed to upload image to gallery:', err);
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setPanelUploading(false);
    }
  };

  // ─── Delete Single Mapping Handler ───────────────────────
  const handleDeleteMapping = async (record, device = 'desktop', placement = 'primary') => {
    if (!themeId) return;

    try {
      await themesAPI.deleteMappingByTarget(themeId, {
        module: activeModule,
        recordId: record._id,
        device,
        placement,
      });

      toast.success(`Theme mapping removed. Reverted to default storefront image.`);
      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Failed to remove mapping:', err);
      toast.error(err.response?.data?.message || 'Could not remove theme mapping');
    }
  };

  // ─── Bulk Clear Mappings ─────────────────────────────────
  const handleBulkClear = async () => {
    if (selectedIds.size === 0 || !themeId) return;

    const confirmed = await confirm({
      title: 'Revert Selected Mappings to Default',
      message: `Are you sure you want to revert ${selectedIds.size} selected item(s) to their default storefront images?`,
      confirmText: 'Revert to Default',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedIds).map((recId) =>
        themesAPI.deleteMappingByTarget(themeId, {
          module: activeModule,
          recordId: recId,
        })
      );
      await Promise.all(promises);
      toast.success(`Reverted ${selectedIds.size} items to default images.`);
      setSelectedIds(new Set());
      await Promise.all([fetchRecords(), fetchSummary(), fetchSideGallery()]);
    } catch (err) {
      console.error('Bulk clear failed:', err);
      toast.error('Failed to clear some mappings');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ─── Drag & Drop Event Handlers ──────────────────────────
  const handleDropOnSlot = async (e, record, device = 'desktop', placement = 'primary') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    let mediaAsset = draggedAssetRef.current;
    if (!mediaAsset) {
      try {
        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
        if (raw) {
          try {
            mediaAsset = JSON.parse(raw);
          } catch {
            mediaAsset = sideGalleryItems.find((i) => String(i._id) === String(raw));
          }
        }
      } catch (err) {
        console.warn('Could not read from dataTransfer:', err);
      }
    }

    if (!mediaAsset || !mediaAsset._id) {
      toast.error('Could not detect dropped image. Try selecting the slot with "Map" then clicking the image.');
      return;
    }

    try {
      await handleSaveMapping(mediaAsset, {
        record,
        device,
        placement,
      });
    } catch (err) {
      console.error('Error handling dropped image:', err);
    }
  };

  const handleGalleryItemClick = async (item) => {
    if (activeTargetSlot) {
      await handleSaveMapping(item, activeTargetSlot);
    } else {
      openImagePreview(item.image?.url || item.url, {
        title: item.name || 'Theme Gallery Asset',
      });
    }
  };

  // ─── One-Click Theme Activation ──────────────────────────
  const handleActivateTheme = async () => {
    if (!themeId) return;

    try {
      setActivating(true);
      const res = await themesAPI.activateTheme(themeId);
      const data = res.data?.data || res.data || {};
      toast.success(data.message || `Theme "${theme?.name}" is now live on the storefront!`);
      setShowActivateModal(false);
      if (onThemeUpdated) {
        onThemeUpdated({ ...theme, status: 'active' });
      }
      await fetchSummary();
    } catch (err) {
      console.error('Failed to activate theme:', err);
      toast.error(err.response?.data?.message || 'Failed to activate theme');
    } finally {
      setActivating(false);
    }
  };

  // Active module breakdown stats
  const activeBreakdown = summary?.breakdown?.find(
    (b) => b.module === activeModule
  );
  const totalAllRecords = summary?.summary?.totalRecords || 0;
  const mappedAllRecords = summary?.summary?.mappedRecords || 0;
  const completionPct = summary?.summary?.completionPercentage || 0;
  const isLive = theme?.status === 'active';

  // Helper to resolve fallback images robustly
  const resolveFallbackMedia = (record) => {
    if (activeModule === 'category') {
      return {
        primary: record.originalIcon || record.originalMedia?.iconUrl || record.originalDesktopImage,
        secondary: record.originalBanner || record.originalMedia?.bannerUrl,
        primaryLabel: 'Default Category Icon',
        secondaryLabel: 'Default Category Banner',
      };
    }
    return {
      primary: record.originalDesktopImage || record.originalMedia?.desktopImageUrl || record.image?.url,
      secondary: record.originalMobileImage || record.originalMedia?.mobileImageUrl || record.mobileImage?.url,
      primaryLabel: 'Default Desktop Banner',
      secondaryLabel: 'Default Mobile Banner',
    };
  };

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          1. 2 PRIMARY SELECTION BOXES: BANNER MAPPING & CELEBRATE-GIFT MAPPING
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Banner Mapping */}
        <button
          type="button"
          onClick={() => handleSelectMappingMode('banner')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            mappingMode === 'banner'
              ? 'border-[#8b6f4e] bg-[#fbf9f6] shadow-sm ring-2 ring-[#8b6f4e]/20'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  mappingMode === 'banner'
                    ? 'bg-[#8b6f4e] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <HiOutlineDesktopComputer className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">Banner Mapping</h3>
                  {mappingMode === 'banner' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b6f4e] text-white">
                      <HiOutlineCheck className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Hero banners, collection banners & promotional sliders
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  bannerStats.mapped === bannerStats.total && bannerStats.total > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {bannerStats.mapped}/{bannerStats.total} Mapped
              </span>
            </div>
          </div>
        </button>

        {/* Box 2: Celebrate & Gift Mapping */}
        <button
          type="button"
          onClick={() => handleSelectMappingMode('celebrate')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            mappingMode === 'celebrate'
              ? 'border-[#8b6f4e] bg-[#fbf9f6] shadow-sm ring-2 ring-[#8b6f4e]/20'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  mappingMode === 'celebrate'
                    ? 'bg-[#8b6f4e] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <IoDiamondOutline className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">Celebrate & Gifts Mapping</h3>
                  {mappingMode === 'celebrate' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b6f4e] text-white">
                      <HiOutlineCheck className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Curated festive gifting showcase cards & category highlights
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  celebrateStats.mapped === celebrateStats.total && celebrateStats.total > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {celebrateStats.mapped}/{celebrateStats.total} Mapped
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BANNER TYPES SELECTION CARDS (Matches Banner Management UI)
          ───────────────────────────────────────────────────────────── */}
      {mappingMode === 'banner' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Select Banner Type to Map:
            </span>
            <span className="text-xs text-stone-400">
              Active: <strong className="text-[#8b6f4e] font-bold">{BANNER_TYPES.find((b) => b.key === activeModule)?.label || 'Hero Banner'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {BANNER_TYPES.map((card) => {
              const CardIcon = card.icon;
              const count = bannerCounts[card.key] ?? 0;
              const isSelected = activeModule === card.key;

              return (
                <div
                  key={card.key}
                  onClick={() => handleSelectBannerType(card.key)}
                  className={`rounded-xl border p-3 sm:p-3.5 transition-all duration-200 cursor-pointer relative group flex flex-col justify-between shadow-2xs ${
                    isSelected
                      ? 'border-[#8b6f4e] bg-[#fbf9f6] ring-2 ring-[#8b6f4e]/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-[#8b6f4e]/40 hover:bg-stone-50/60'
                  }`}
                >
                  <div>
                    {/* Top row: Icon and Count Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#8b6f4e] text-white shadow-xs'
                            : 'bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/20 group-hover:bg-[#8b6f4e] group-hover:text-white'
                        }`}
                      >
                        <CardIcon className="w-4 h-4 stroke-[1.8]" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#8b6f4e] text-white font-bold'
                          : 'text-stone-600 bg-stone-100 border border-stone-200/60'
                      }`}>
                        {count} {count === 1 ? 'banner' : 'banners'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors line-clamp-1">
                      {card.label}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE TARGET BANNER (When user clicked "Select to Map")
          ───────────────────────────────────────────────────────────── */}
      {activeTargetSlot && (
        <div className="rounded-2xl border-2 border-[#8b6f4e] bg-amber-50/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8b6f4e] text-white flex items-center justify-center shrink-0 shadow-xs">
              <HiOutlineCursorClick className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-stone-900">
                  Target Selected for Mapping:
                </span>
                <span className="bg-[#8b6f4e]/15 text-[#8b6f4e] font-bold px-2 py-0.5 rounded-md text-xs">
                  {activeTargetSlot.record.title || activeTargetSlot.record.name}
                </span>
                <span className="text-[11px] text-stone-500 font-semibold uppercase">
                  ({activeTargetSlot.device})
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                👉 Now click <strong>any image in the Theme Gallery on the right</strong> to assign it instantly!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTargetSlot(null)}
            className="rounded-xl border border-stone-300 bg-white hover:bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition cursor-pointer shrink-0"
          >
            Cancel Selection
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. SIDE-BY-SIDE MAIN LAYOUT:
             LEFT: Banners & Featured List (xl:col-span-7)
             RIGHT: Theme Media Gallery Side Panel (xl:col-span-5)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: BANNERS & FEATURED LIST (xl:col-span-7)
            ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-7 space-y-4">
          {mappingMode === 'banner' ? (
            /* ═══════════════════════════════════════════════════════════
               BANNER TYPE LIST VIEW (Matches Screen 2 of BannersView.jsx)
               ═══════════════════════════════════════════════════════════ */
            <>
              {/* Header: Type Icon + Title + Description + Selected Bulk Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fbf5ed] border border-[#f5e3cc]/60 flex items-center justify-center text-[#8a6d4b] shrink-0">
                    {(() => {
                      const TypeIcon = currentBannerType.icon || HiOutlinePhotograph;
                      return <TypeIcon className="w-5 h-5 stroke-[1.8]" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight font-playfair">
                      {currentBannerType.label}
                    </h2>
                    <p className="text-xs text-stone-500 font-normal">
                      {currentBannerType.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkClear}
                      disabled={bulkActionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                      <span>Revert Selected ({selectedIds.size})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Banners Table */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        <th className="py-3 px-3.5 w-10">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3.5 whitespace-nowrap">PREVIEW</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">
                          {currentBannerType.key === 'categorybanner' ? 'CATEGORY' : 'TITLE'}
                        </th>
                        <th className="py-3 px-3.5 whitespace-nowrap">STATUS</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">DEVICES</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">ORDER</th>
                        <th className="py-3 pr-4 pl-3 whitespace-nowrap text-right">THEME MAPPING</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-16 text-center text-stone-400">
                            <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto mb-3" />
                            <span>Loading banners...</span>
                          </td>
                        </tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-16 text-center text-stone-400">
                            <HiOutlinePhotograph className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                            <p className="text-sm font-medium text-stone-600">No {currentBannerType.label}s found</p>
                            <p className="text-xs text-stone-400 mt-1">
                              No banners match the selected filter.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((banner) => {
                          const bTitle = currentBannerType.key === 'categorybanner'
                            ? (banner.display?.categoryId?.name || categories.find((c) => String(c._id) === String(banner.display?.categoryId?._id || banner.display?.categoryId))?.name || banner.content?.title || banner.title || 'Category Banner')
                            : (banner.content?.title || banner.title || 'Hero Banner');
                          const bDesc = banner.content?.description || banner.content?.subtitle || banner.subtitle || '';
                          const defaultAssetUrl = banner.media?.url || banner.image?.url || (banner.collectionImages?.[0]?.url) || banner.originalDesktopImage;
                          const isPublished = banner.status === 'active';
                          const dateInfo = formatDateDisplay(banner.updatedAt || banner.createdAt);
                          const isSelected = selectedIds.has(String(banner._id));

                          const desktopMappedImg = banner.desktopMapping?.imageUrl;
                          const hasDesktopOverride = Boolean(desktopMappedImg);
                          const currentEffectiveImg = desktopMappedImg || defaultAssetUrl;

                          const isTargetActive =
                            activeTargetSlot?.record?._id === banner._id &&
                            activeTargetSlot?.device === 'desktop';

                          const isSlotHovered =
                            dragOverSlot?.recordId === banner._id &&
                            dragOverSlot?.device === 'desktop';

                          const catObj = banner.display?.categoryId;
                          const catName = typeof catObj === 'object' && catObj?.name
                            ? catObj.name
                            : categories.find((c) => String(c._id) === String(catObj?._id || catObj))?.name;

                          return (
                            <tr
                              key={banner._id}
                              className={`hover:bg-[#faf8f5]/70 transition-colors ${
                                isSlotHovered
                                  ? 'bg-[#8b6f4e]/15 ring-2 ring-inset ring-[#8b6f4e]'
                                  : isTargetActive
                                  ? 'bg-amber-50/80 ring-1 ring-inset ring-amber-400'
                                  : isSelected
                                  ? 'bg-[#fcfaf7]'
                                  : ''
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-3.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectRow(banner._id)}
                                  className="rounded border-stone-300 text-[#8a6d4b] focus:ring-[#8a6d4b] cursor-pointer"
                                />
                              </td>

                              {/* PREVIEW (Droppable Thumbnail matching BannersView) */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = 'copy';
                                    setDragOverSlot({ recordId: banner._id, device: 'desktop' });
                                  }}
                                  onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget)) {
                                      setDragOverSlot(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDropOnSlot(e, banner, 'desktop', 'primary');
                                  }}
                                  onClick={() => {
                                    setActiveTargetSlot((prev) =>
                                      prev?.record?._id === banner._id && prev?.device === 'desktop'
                                        ? null
                                        : { record: banner, device: 'desktop', placement: 'primary' }
                                    );
                                  }}
                                  className={`w-28 sm:w-32 h-14 rounded-xl border overflow-hidden relative shadow-2xs cursor-pointer group flex items-center justify-center shrink-0 transition-all ${
                                    isSlotHovered
                                      ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e] scale-102'
                                      : isTargetActive
                                      ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/40'
                                      : hasDesktopOverride
                                      ? 'border-emerald-400 ring-1 ring-emerald-300'
                                      : 'border-stone-200/90 bg-stone-900'
                                  }`}
                                  title={
                                    isTargetActive
                                      ? 'Target selected! Click an image in the gallery to map.'
                                      : 'Click to select as mapping target, or drag an image here.'
                                  }
                                >
                                  {currentEffectiveImg ? (
                                    <img
                                      src={getMediaUrl(currentEffectiveImg)}
                                      alt={bTitle}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-[#2a241e] flex items-center justify-center text-stone-500">
                                      <HiOutlinePhotograph className="w-5 h-5 text-[#8a6d4b]/60" />
                                    </div>
                                  )}

                                  {/* Drag hover overlay */}
                                  {isSlotHovered ? (
                                    <div className="absolute inset-0 bg-[#8b6f4e]/90 text-white flex items-center justify-center text-[11px] font-bold animate-pulse">
                                      ⚡ Drop to Map
                                    </div>
                                  ) : isTargetActive ? (
                                    <div className="absolute inset-0 bg-[#8b6f4e]/30 flex items-center justify-center">
                                      <span className="bg-[#8b6f4e] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow">
                                        Selected
                                      </span>
                                    </div>
                                  ) : hasDesktopOverride ? (
                                    <div className="absolute top-1 left-1">
                                      <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                                        Theme
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              </td>

                              {/* TITLE */}
                              <td className="py-3 px-3.5 font-medium text-stone-900">
                                <div
                                  className="font-bold text-stone-900 text-xs sm:text-sm max-w-[220px] truncate"
                                  title={bTitle}
                                >
                                  {bTitle}
                                </div>
                                {bDesc && (
                                  <div className="text-[11px] text-stone-400 font-normal max-w-[200px] truncate mt-0.5" title={bDesc}>
                                    {bDesc}
                                  </div>
                                )}
                                {catName && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[#f5efe6] text-[#8a6d4b] border border-[#e8dccb]">
                                      Category: {catName}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* STATUS */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                {isPublished ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf7ee] text-[#137333]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                                    <span>Active</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                                    <span>Draft</span>
                                  </span>
                                )}
                              </td>

                              {/* DEVICES */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-stone-500">
                                  <button
                                    type="button"
                                    title="Desktop View (Click to target desktop)"
                                    onClick={() => {
                                      setActiveTargetSlot((prev) =>
                                        prev?.record?._id === banner._id && prev?.device === 'desktop'
                                          ? null
                                          : { record: banner, device: 'desktop', placement: 'primary' }
                                      );
                                    }}
                                    className={`p-1 rounded-md transition cursor-pointer ${
                                      activeTargetSlot?.record?._id === banner._id && activeTargetSlot?.device === 'desktop'
                                        ? 'bg-[#8b6f4e] text-white ring-2 ring-[#8b6f4e]/30'
                                        : hasDesktopOverride
                                        ? 'text-emerald-700 bg-emerald-50'
                                        : (banner.image?.url || defaultAssetUrl)
                                        ? 'text-stone-700 bg-stone-100'
                                        : 'text-stone-400'
                                    }`}
                                  >
                                    <HiOutlineDesktopComputer className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Mobile View (Click to target mobile)"
                                    onClick={() => {
                                      setActiveTargetSlot((prev) =>
                                        prev?.record?._id === banner._id && prev?.device === 'mobile'
                                          ? null
                                          : { record: banner, device: 'mobile', placement: 'primary' }
                                      );
                                    }}
                                    className={`p-1 rounded-md transition cursor-pointer ${
                                      activeTargetSlot?.record?._id === banner._id && activeTargetSlot?.device === 'mobile'
                                        ? 'bg-[#8b6f4e] text-white ring-2 ring-[#8b6f4e]/30'
                                        : banner.mobileMapping?.imageUrl
                                        ? 'text-emerald-700 bg-emerald-50'
                                        : banner.mobileImage?.url
                                        ? 'text-stone-700 bg-stone-100'
                                        : 'text-stone-300'
                                    }`}
                                  >
                                    <HiOutlineDeviceMobile className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                              {/* ORDER */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50">
                                  {banner.display?.order ?? banner.order ?? 1}
                                </span>
                              </td>

                              {/* THEME MAPPING ACTIONS */}
                              <td className="py-3 pr-4 pl-3 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {hasDesktopOverride ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold px-2 py-1">
                                        Mapped
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTargetSlot((prev) =>
                                            prev?.record?._id === banner._id && prev?.device === 'desktop'
                                              ? null
                                              : { record: banner, device: 'desktop', placement: 'primary' }
                                          );
                                        }}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                          isTargetActive
                                            ? 'bg-[#8b6f4e] text-white shadow-xs'
                                            : 'bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white'
                                        }`}
                                        title="Map another image: Click to select, then click any image from the gallery"
                                      >
                                        <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                        <span>{isTargetActive ? 'Selected' : 'Change'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMapping(banner, 'desktop', 'primary')}
                                        className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                                        title="Reset to default storefront image"
                                      >
                                        <HiOutlineRefresh className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTargetSlot((prev) =>
                                            prev?.record?._id === banner._id && prev?.device === 'desktop'
                                              ? null
                                              : { record: banner, device: 'desktop', placement: 'primary' }
                                          );
                                        }}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                          isTargetActive
                                            ? 'bg-[#8b6f4e] text-white shadow-xs'
                                            : 'bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white'
                                        }`}
                                      >
                                        {isTargetActive ? 'Selected' : 'Map'}
                                      </button>
                                    </>
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

                {/* Table Footer with Count */}
                <div className="px-4 py-3 border-t border-stone-150 flex items-center justify-between bg-stone-50/50 text-xs text-stone-500 font-medium">
                  <span>
                    Showing 1-{filteredRecords.length} of {records.length} {currentBannerType.label.toLowerCase()}s
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* ═══════════════════════════════════════════════════════════
               CELEBRATE & GIFTS VIEW (Matches CelebrateGiftsView.jsx)
               ═══════════════════════════════════════════════════════════ */
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
              {/* Prominent Placement Tabs Header */}
              <div className="border-b border-stone-200 bg-[#fbfaf8] px-4 sm:px-6 pt-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-6 -mb-px overflow-x-auto">
                  {['Celebrate', 'Gifts', 'all'].map((tabKey) => {
                    const isTabActive = celebratePlacementFilter === tabKey;
                    const label = tabKey === 'all' ? 'All Items' : tabKey;
                    const count = tabKey === 'all'
                      ? records.length
                      : records.filter((r) => (r.placement || '').toLowerCase() === tabKey.toLowerCase()).length;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setCelebratePlacementFilter(tabKey)}
                        className={`pb-2.5 pt-1.5 px-1 sm:px-2 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                          isTabActive
                            ? 'border-[#8b6f4e] text-[#8b6f4e]'
                            : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isTabActive ? 'bg-[#8b6f4e]/15 text-[#8b6f4e]' : 'bg-stone-200/70 text-stone-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkClear}
                    disabled={bulkActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    <span>Revert Selected ({selectedIds.size})</span>
                  </button>
                )}
              </div>

              {/* Table matching CelebrateGiftsView.jsx */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                      <th className="py-3 px-3 whitespace-nowrap">COVER</th>
                      <th className="py-3 px-3 whitespace-nowrap">SHOWCASE NAME</th>
                      <th className="py-3 px-3 whitespace-nowrap">PLACEMENT</th>
                      <th className="py-3 px-3 whitespace-nowrap">PRODUCTS</th>
                      <th className="py-3 pr-4 pl-3 whitespace-nowrap text-right">THEME MAPPING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-400">
                          <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto mb-3" />
                          <span>Loading showcase items...</span>
                        </td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-400">
                          No showcase items found.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((item, idx) => {
                        const isSelected = selectedIds.has(String(item._id));
                        const isMapped = item.isMapped || Boolean(item.desktopMapping?.imageUrl);
                        const currentCover = item.desktopMapping?.imageUrl || item.image?.url || item.originalDesktopImage;

                        const isTargetActive =
                          activeTargetSlot?.record?._id === item._id &&
                          activeTargetSlot?.placement === 'celebrate';

                        const isSlotHovered =
                          dragOverSlot?.recordId === item._id;

                        return (
                          <tr
                            key={item._id}
                            className={`hover:bg-[#faf7f2] transition-colors ${
                              isSlotHovered
                                ? 'bg-[#8b6f4e]/15 ring-2 ring-inset ring-[#8b6f4e]'
                                : isTargetActive
                                ? 'bg-amber-50/80 ring-1 ring-inset ring-amber-400'
                                : isSelected
                                ? 'bg-[#fcfaf7]'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(item._id)}
                                className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-stone-500">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'copy';
                                  setDragOverSlot({ recordId: item._id, device: 'desktop' });
                                }}
                                onDragLeave={(e) => {
                                  if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setDragOverSlot(null);
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDropOnSlot(e, item, 'desktop', 'primary');
                                }}
                                onClick={() => {
                                  setActiveTargetSlot((prev) =>
                                    prev?.record?._id === item._id
                                      ? null
                                      : { record: item, device: 'desktop', placement: 'celebrate' }
                                  );
                                }}
                                className={`w-14 h-10 rounded-md overflow-hidden border cursor-pointer flex items-center justify-center relative shadow-2xs transition-all ${
                                  isSlotHovered
                                    ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e] scale-105'
                                    : isTargetActive
                                    ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/40'
                                    : isMapped
                                    ? 'border-emerald-400 ring-1 ring-emerald-300'
                                    : 'border-stone-200/80 bg-stone-100'
                                }`}
                                title={
                                  isTargetActive
                                    ? 'Target selected! Click an image in the gallery to map.'
                                    : 'Click to select as mapping target, or drag an image here.'
                                }
                              >
                                {currentCover ? (
                                  <img
                                    src={getMediaUrl(currentCover)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <HiOutlinePhotograph className="w-5 h-5 text-stone-400" />
                                )}
                                {isSlotHovered ? (
                                  <div className="absolute inset-0 bg-[#8b6f4e]/90 text-white flex items-center justify-center text-[9px] font-bold">
                                    Drop
                                  </div>
                                ) : isMapped ? (
                                  <div className="absolute top-0.5 left-0.5">
                                    <span className="bg-emerald-600/90 text-white text-[8px] font-bold px-1 rounded shadow-xs uppercase">
                                      Theme
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-stone-900">
                              <div>{item.name || item.title || 'Showcase Card'}</div>
                              {item.subtitle && (
                                <div className="text-[11px] text-stone-400 font-normal">{item.subtitle}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.placement === 'Celebrate'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {item.placement || 'Celebrate'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                                {Array.isArray(item.products) ? item.products.length : 0} Products
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isMapped ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold px-2 py-0.5">
                                      Mapped
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTargetSlot((prev) =>
                                          prev?.record?._id === item._id
                                            ? null
                                            : { record: item, device: 'desktop', placement: 'celebrate' }
                                        );
                                      }}
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                        isTargetActive
                                          ? 'bg-[#8b6f4e] text-white shadow-xs'
                                          : 'bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white'
                                      }`}
                                      title="Map another image: Click to select, then click any image from the gallery"
                                    >
                                      <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                      <span>{isTargetActive ? 'Selected' : 'Change'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMapping(item, 'desktop', 'primary')}
                                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                                      title="Reset to default storefront image"
                                    >
                                      <HiOutlineRefresh className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTargetSlot((prev) =>
                                        prev?.record?._id === item._id
                                          ? null
                                          : { record: item, device: 'desktop', placement: 'celebrate' }
                                      );
                                    }}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                      isTargetActive
                                        ? 'bg-[#8b6f4e] text-white shadow-xs'
                                        : 'bg-[#faf6f0] text-[#8b6f4e] border border-[#8b6f4e]/30 hover:bg-[#8b6f4e] hover:text-white'
                                    }`}
                                  >
                                    {isTargetActive ? 'Selected' : 'Map'}
                                  </button>
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
              <div className="px-4 py-3 border-t border-stone-150 flex items-center justify-between bg-stone-50/50 text-xs text-stone-500 font-medium">
                <span>Showing {filteredRecords.length} items</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: THEME MEDIA GALLERY SIDE PANEL (xl:col-span-5)
            ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-5 sticky top-4 space-y-3.5">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-stone-200 bg-stone-50/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#8b6f4e] text-white flex items-center justify-center shadow-2xs">
                    <HiOutlinePhotograph className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">
                      Theme Media Gallery
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Drag & Drop onto any banner on the left
                    </p>
                  </div>
                </div>

                {/* Upload Button: Redirects to Gallery Upload Studio */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const type = mappingMode === 'celebrate' ? 'celebrate' : (currentBannerType?.key || activeModule || 'herobanner');
                      navigate(`/gallery?openUpload=true&themeId=${themeId || ''}&type=${type}`);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
                  >
                    <HiOutlineUpload className="h-3.5 w-3.5" />
                    <span>+ Upload</span>
                  </button>
                </div>
              </div>

              {/* Placement & Platform Filters (gallery.model.js L23-L38 & L39-L44) */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Dropdown
                    value={galleryPlacementFilter}
                    onChange={(val) => setGalleryPlacementFilter(val)}
                    options={GALLERY_PLACEMENT_FILTER_OPTIONS}
                    portal={true}
                    size="sm"
                    buttonClassName="w-full h-8 px-2.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 justify-between truncate shadow-2xs"
                    menuClassName="z-30 text-xs max-h-60 overflow-y-auto"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Dropdown
                    value={galleryPlatformFilter}
                    onChange={(val) => setGalleryPlatformFilter(val)}
                    options={GALLERY_PLATFORM_FILTER_OPTIONS}
                    portal={true}
                    size="sm"
                    buttonClassName="w-full h-8 px-2.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 justify-between truncate shadow-2xs"
                    menuClassName="z-30 text-xs max-h-60 overflow-y-auto"
                  />
                </div>

                {(galleryPlacementFilter !== 'all' || galleryPlatformFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryPlacementFilter('all');
                      setGalleryPlatformFilter('all');
                    }}
                    title="Reset filters"
                    className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center shrink-0 transition cursor-pointer"
                  >
                    <HiOutlineRefresh className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Gallery Images Grid */}
            <div className="p-3.5 max-h-[620px] overflow-y-auto">
              {galleryLoading ? (
                <div className="py-20 text-center text-xs text-stone-500 space-y-2">
                  <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
                  <p>Loading theme gallery…</p>
                </div>
              ) : sideGalleryItems.length === 0 ? (
                <div className="py-14 text-center text-xs text-stone-500 space-y-2.5">
                  <HiOutlinePhotograph className="h-8 w-8 mx-auto text-stone-300" />
                  <p className="font-bold text-stone-800">
                    No images uploaded for {theme?.name || 'this theme'} yet
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Click <strong>+ Upload</strong> above to upload media assets for this theme.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {sideGalleryItems.map((item) => {
                    const imgUrl = item.image?.url || item.url;
                    const displayName = item.name || item.fileName || `Asset ${String(item._id).slice(-4)}`;
                    const isLinked = Boolean(item.linkedRecord?.recordId);

                    return (
                      <div
                        key={item._id}
                        draggable={true}
                        onDragStart={(e) => {
                          draggedAssetRef.current = item;
                          try {
                            const payload = JSON.stringify(item);
                            e.dataTransfer.setData('application/json', payload);
                            e.dataTransfer.setData('text/plain', payload);
                          } catch (_) {}
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onDragEnd={() => {
                          draggedAssetRef.current = null;
                          setDragOverSlot(null);
                        }}
                        onClick={() => handleGalleryItemClick(item)}
                        className={`group relative rounded-xl border overflow-hidden bg-white cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
                          activeTargetSlot
                            ? 'border-amber-300 ring-2 ring-amber-200/50 hover:border-amber-500'
                            : 'border-stone-200 hover:border-[#8b6f4e]'
                        }`}
                        title="Drag this image onto any banner card on the left"
                      >
                        {/* Image Thumbnail */}
                        <div className="aspect-4/3 w-full bg-stone-100 overflow-hidden relative">
                          <img
                            src={imgUrl}
                            alt={displayName}
                            draggable={false}
                            className="w-full h-full object-cover select-none pointer-events-none transition duration-300 group-hover:scale-105"
                          />

                          {/* Hover Drag Badge */}
                          <div className="absolute top-1.5 left-1.5 rounded-md bg-stone-900/75 backdrop-blur-xs text-white px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <span>⋮⋮ Drag</span>
                          </div>

                          {/* Linked Record Indicator */}
                          {isLinked && (
                            <div className="absolute top-1.5 right-1.5 rounded-md bg-emerald-600/90 text-white p-1 text-[9px] font-bold shadow-xs" title="Linked to a banner/featured record">
                              <HiOutlineLink className="h-3 w-3" />
                            </div>
                          )}

                          {/* Click to Map Overlay when Active Target is selected */}
                          {activeTargetSlot && (
                            <div className="absolute inset-0 bg-[#8b6f4e]/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white p-2 text-center">
                              <HiOutlineCursorClick className="h-5 w-5 mb-1" />
                              <span className="text-[10px] font-bold leading-tight">
                                Click to Map
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Info Footer (matches Screen 2 & Gallery cards) */}
                        <div className="p-2 border-t border-stone-100 bg-white">
                          <div className="text-[11px] font-bold text-stone-800 truncate">
                            {displayName}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between text-[10px] text-stone-400 capitalize">
                            <span className="truncate">{item.placement || 'asset'}</span>
                            <span className="uppercase text-[9px] font-semibold text-stone-400 shrink-0 ml-1">
                              {item.platform || 'web'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL: MEDIA GALLERY PICKER (When user clicks "Browse")
          ───────────────────────────────────────────────────────────── */}
      {pickerTarget && (
        <GalleryPickerModal
          target={pickerTarget}
          activeModule={activeModule}
          onClose={() => setPickerTarget(null)}
          onSelect={handleSaveMapping}
          onDirectUpload={(file) =>
            handleDirectUpload(
              file,
              pickerTarget.record,
              pickerTarget.device,
              pickerTarget.placement
            )
          }
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: ONE-CLICK ACTIVATION CONFIRMATION
          ───────────────────────────────────────────────────────────── */}
      {showActivateModal && (
        <ActivationConfirmModal
          theme={theme}
          summary={summary}
          activating={activating}
          onClose={() => setShowActivateModal(false)}
          onConfirm={handleActivateTheme}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: GALLERY PICKER + DIRECT UPLOADER MODAL
// ═════════════════════════════════════════════════════════════════════
function GalleryPickerModal({ target, onClose, onSelect, onDirectUpload }) {
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' or 'upload'
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Gallery Assets
  const fetchGalleryAssets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await galleryAPI.getAll({
        search,
        type: selectedType === 'all' ? undefined : selectedType,
        limit: 100,
      });
      const data = res.data?.data || res.data || {};
      const items = data.items || [];
      setGalleryItems(items);

      if (target.currentMediaId) {
        const found = items.find((i) => String(i._id) === String(target.currentMediaId));
        if (found) setSelectedAsset(found);
      }
    } catch (err) {
      console.error('Failed to fetch gallery media for picker:', err);
      toast.error('Could not load Media Gallery assets');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, target.currentMediaId]);

  useEffect(() => {
    fetchGalleryAssets();
  }, [fetchGalleryAssets]);

  const handleConfirm = async () => {
    if (!selectedAsset) return;
    try {
      setSaving(true);
      await onSelect(selectedAsset);
    } finally {
      setSaving(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onDirectUpload(file);
      onClose();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onDirectUpload(file);
      onClose();
    }
  };

  const deviceLabel = target.device === 'mobile' ? 'Mobile Variant' : 'Primary Desktop';
  const recordTitle = target.record.title || target.record.name || 'Storefront Item';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 p-4 sm:p-5 bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlinePhotograph className="h-5 w-5 text-[#8b6f4e]" />
              <h3 className="text-base font-bold text-stone-900">
                Choose or Upload Theme Image
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Customizing <span className="font-semibold text-stone-800">"{recordTitle}"</span> ·{' '}
              <span className="font-semibold text-[#8b6f4e]">{deviceLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs: Gallery vs Direct Upload */}
        <div className="border-b border-stone-200 bg-stone-50/40 px-4 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'gallery'
                  ? 'border-[#8b6f4e] text-[#8b6f4e]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Browse Media Gallery ({galleryItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#8b6f4e] text-[#8b6f4e]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Upload New File Directly
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'upload' ? (
          /* Direct Drag & Drop Upload Tab */
          <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-lg p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                dragOver
                  ? 'border-[#8b6f4e] bg-[#8b6f4e]/10 scale-102'
                  : 'border-stone-300 hover:border-[#8b6f4e] bg-stone-50 hover:bg-stone-50/50'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-100/70 text-[#8b6f4e] flex items-center justify-center mb-4 shadow-2xs">
                <HiOutlineCloudUpload className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">
                Drag and drop your festival image here
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                PNG, JPG, or WebP. The image will be compressed automatically and mapped to this record.
              </p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-4 py-2 text-xs font-semibold text-white shadow-2xs cursor-pointer"
              >
                Browse File from Computer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        ) : (
          /* Media Gallery Grid Tab */
          <>
            {/* Search & Categories */}
            <div className="p-4 border-b border-stone-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search gallery images..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none transition focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 placeholder:text-stone-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <HiOutlineX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {[
                  ['all', 'All Gallery'],
                  ['herobanner', 'Hero'],
                  ['celebrate', 'Celebrate'],
                  ['collectionbanner', 'Collections'],
                  ['categorybanner', 'Categories'],
                  ['asset', 'Assets'],
                ].map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedType(val)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedType === val
                        ? 'bg-[#8b6f4e] text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? (
                <div className="py-24 text-center text-xs text-stone-500 space-y-2">
                  <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
                  <p>Fetching uploaded Media Gallery images…</p>
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="py-20 text-center text-xs text-stone-500 space-y-2">
                  <HiOutlinePhotograph className="h-8 w-8 mx-auto text-stone-300" />
                  <p className="font-semibold text-stone-700">No images found in Media Gallery</p>
                  <p className="text-[11px] text-stone-400">
                    Switch to the "Upload New File" tab above to upload directly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {galleryItems.map((item) => {
                    const imgUrl = item.image?.url || item.url;
                    const isSelected = selectedAsset?._id === item._id;
                    const displayName = item.name || item.fileName || `Image ${String(item._id).slice(-4)}`;

                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedAsset(item)}
                        className={`group relative rounded-xl border-2 overflow-hidden bg-stone-50 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20 shadow-md scale-102'
                            : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                          <img
                            src={imgUrl}
                            alt={displayName}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 rounded-full bg-[#8b6f4e] text-white p-1 shadow-sm">
                            <HiOutlineCheck className="h-3.5 w-3.5 stroke-2" />
                          </div>
                        )}

                        <div className="p-2 bg-white">
                          <p className="text-[11px] font-semibold text-stone-800 truncate" title={displayName}>
                            {displayName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-0.5">
                            <span className="capitalize">{item.type || 'media'}</span>
                            {item.platform && <span className="uppercase">{item.platform}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        {activeTab === 'gallery' && (
          <div className="border-t border-stone-200 p-4 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {selectedAsset ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-8 rounded border border-stone-200 overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={selectedAsset.image?.url || selectedAsset.url}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-stone-800 block truncate max-w-[200px]">
                      {selectedAsset.name || selectedAsset.fileName || 'Selected Media Asset'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Ready to map to {deviceLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-stone-500 italic">
                  Select an image from the grid above
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedAsset || saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <HiOutlineCheck className="h-4 w-4 stroke-2" />
                <span>{saving ? 'Saving Mapping…' : 'Use This Image'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: ONE-CLICK ACTIVATION CONFIRMATION MODAL
// ═════════════════════════════════════════════════════════════════════
function ActivationConfirmModal({ theme, summary, activating, onClose, onConfirm }) {
  const total = summary?.summary?.totalRecords || 0;
  const mapped = summary?.summary?.mappedRecords || 0;
  const missing = summary?.summary?.missingRecords || 0;
  const pct = summary?.summary?.completionPercentage || 0;
  const isFullyMapped = summary?.summary?.isFullyMapped;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HiOutlineCheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Activate Theme on Storefront
              </h3>
              <p className="text-xs text-stone-500">
                One-Click Storefront Theme Switch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-stone-700">
          <p>
            You are about to activate theme <span className="font-bold text-stone-900">"{theme?.name}"</span> as the live storefront theme.
          </p>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Mapping Readiness</span>
              <span className="font-bold text-stone-900">
                {mapped} / {total} records customized ({pct}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {isFullyMapped ? (
              <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px]">
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  All records are mapped with theme-specific media. The storefront will display full theme visuals.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px]">
                <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Safe Fallback:</strong> {missing} record(s) are unmapped. They will safely display their original fallback images so no broken images or missing content will appear on the storefront.
                </span>
              </div>
            )}
          </div>

          <p className="text-stone-500 text-[11px] leading-relaxed">
            Activating this theme will immediately update the live website storefront settings.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={activating}
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={activating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheck className="h-4 w-4 stroke-2" />
            <span>{activating ? 'Activating Storefront…' : 'Confirm & Activate Theme'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
