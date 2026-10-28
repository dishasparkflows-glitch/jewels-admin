import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlinePhotograph,
  HiOutlineDeviceMobile,
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
  HiOutlineFilm,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineColorSwatch,
  HiOutlineCode,
  HiOutlineDotsHorizontal,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineDesktopComputer,
  HiOutlineDuplicate,
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { deleteUploadedFile, uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import Dropdown from '../../components/common/Dropdown';
import DatePicker from '../../components/common/DatePicker';
import { useAdminPageSize } from '../../utils/adminPagination';
import ThemeImageField from '../../components/common/ThemeImageField';
import { savePendingThemeMedia } from '../../utils/savePendingThemeMedia';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatForInput = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

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

const BANNER_TYPES = [
  {
    key: 'herobanner',
    label: 'Hero Banner',
    icon: HiOutlinePhotograph,
    desc: 'Main homepage slider banner for top section.',
    placement: 'Homepage hero',
    placementBadge: 'bg-[#fcf3e8] text-[#9a6435] border border-[#f5e3cc]/70',
  },
  {
    key: 'collectionbanner',
    label: 'Collection Banner',
    icon: HiOutlineTag,
    desc: 'Banners for collection pages and featured collections.',
    placement: 'Collection page',
    placementBadge: 'bg-[#faebee] text-[#b84d4d] border border-[#f7d5dc]/70',
  },
  {
    key: 'categorybanner',
    label: 'Category Banner',
    icon: HiOutlineViewGrid,
    desc: 'Banners for category pages and category highlights.',
    placement: 'Category page',
    placementBadge: 'bg-[#eaf5ef] text-[#2b7a4b] border border-[#cbe8d6]/70',
  },
  {
    key: 'offerbanner',
    label: 'Offer Banner',
    icon: HiOutlineGift,
    desc: 'Banners for offers, promotions and special deals.',
    placement: 'Offers & deals',
    placementBadge: 'bg-[#f4eefc] text-[#6b3ba7] border border-[#e2d5f5]/70',
  },
  {
    key: 'mobileappbanner',
    label: 'App Banner',
    icon: HiOutlineDeviceMobile,
    desc: 'Banners for app download promotion.',
    placement: 'App download',
    placementBadge: 'bg-[#edf5fc] text-[#20639b] border border-[#d2e5f8]/70',
  },
  {
    key: 'bookappointbanner',
    label: 'Appointment Banner',
    icon: HiOutlineCalendar,
    desc: 'Banners for appointment booking section.',
    placement: 'Appointment page',
    placementBadge: 'bg-[#eef8f8] text-[#1c7878] border border-[#cfeeee]/70',
  },
  {
    key: 'customizebanner',
    label: 'Custom Banner',
    icon: HiOutlineCode,
    desc: 'Custom banners for special pages or campaigns.',
    placement: 'Custom page',
    placementBadge: 'bg-[#fdf7e7] text-[#9c6a15] border border-[#fae8b8]/70',
  },
  {
    key: 'websitebanner',
    label: 'Other',
    icon: HiOutlineDotsHorizontal,
    desc: 'Other banners and miscellaneous placements.',
    placement: 'Other section',
    placementBadge: 'bg-stone-100 text-stone-600 border border-stone-200/70',
  },
];


export default function BannersView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { typeKey, bannerId } = useParams();
  const confirm = useConfirm();

  // Determine base path (/banners or /marketing/banners)
  const basePath = useMemo(() => {
    return location.pathname.startsWith('/marketing/banners') ? '/marketing/banners' : '/banners';
  }, [location.pathname]);

  // Determine current screen view mode: 'grid' (Screen 1) | 'list' (Screen 2 with edit modal)
  const viewMode = useMemo(() => {
    if (typeKey && BANNER_TYPES.some((t) => t.key === typeKey)) {
      return 'list';
    }
    return 'grid';
  }, [typeKey]);

  // Modal open state for Add / Edit Banner
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    resetForm();
    setEditingBanner(null);
    if (location.pathname.includes('/edit/') || location.pathname.endsWith('/new')) {
      navigate(`${basePath}/${currentBannerType.key}`);
    }
  };

  const { categories } = useCategoryLookup({ enabled: isFormModalOpen });

  // Current active banner type configuration
  const currentBannerType = useMemo(() => {
    const key = typeKey || 'herobanner';
    return BANNER_TYPES.find((t) => t.key === key) || BANNER_TYPES[0];
  }, [typeKey]);

  // Data states
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Screen 2 Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Screen 3 Form States
  const [editingBanner, setEditingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationLink, setDestinationLink] = useState('');
  const [linkTarget, setLinkTarget] = useState('_self');
  const [imageUrl, setImageUrl] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [mobileImageKey, setMobileImageKey] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [order, setOrder] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collectionImages, setCollectionImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [collectionGroup, setCollectionGroup] = useState('gold');
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState([]);
  const [navigationCategories, setNavigationCategories] = useState([]);
  const [themeId, setThemeId] = useState('');
  const [pendingThemeImages, setPendingThemeImages] = useState({});

  // Image Upload States
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [desktopUploadStats, setDesktopUploadStats] = useState(null);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [mobileUploadStats, setMobileUploadStats] = useState(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const collectionSlotRef = useRef(null);
  const [collectionUploadStats, setCollectionUploadStats] = useState({});



  // Screen 1: Banner counts by type
  const [bannerCounts, setBannerCounts] = useState({
    herobanner: 0,
    collectionbanner: 0,
    categorybanner: 0,
    offerbanner: 0,
    mobileappbanner: 0,
    bookappointbanner: 0,
    customizebanner: 0,
    websitebanner: 0,
    total: 0,
  });

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners/counts');
      if (res.data?.data) {
        setBannerCounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load banner counts:', err);
      toast.error('Failed to load banner counts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'grid') {
      fetchCounts();
    }
  }, [viewMode]);

  // Screen 2: Paginated list banners for active type
  const fetchListBanners = async () => {
    try {
      setLoading(true);
      const params = {
        type: typeKey || 'herobanner',
        page: currentPage,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') {
        if (statusFilter === 'published') params.status = 'active';
        else if (statusFilter === 'draft') params.status = 'inactive';
        else if (statusFilter === 'scheduled') params.status = 'scheduled';
      }
      if (deviceFilter !== 'all') {
        params.platform = deviceFilter;
      }
      if (sortBy) {
        params.sortBy = sortBy;
      }

      const res = await api.get('/banners', { params });
      const items = res.data?.data || [];
      setBanners(Array.isArray(items) ? items : []);
      const pagination = res.data?.pagination;
      if (pagination?.totalDocs !== undefined) {
        setServerTotal(pagination.totalDocs);
      } else {
        setServerTotal(items.length);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchListBanners();
    }
  }, [viewMode, typeKey, currentPage, pageSize, search, statusFilter, deviceFilter, sortBy]);

  // Reset pagination when list filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [typeKey, search, statusFilter, deviceFilter, sortBy]);

  // Fetch navigation categories when modal is open
  useEffect(() => {
    if (!isFormModalOpen) return;
    let cancelled = false;
    api.get('/categories/navigation')
      .then((res) => {
        const rows = res.data?.data || [];
        if (!cancelled) setNavigationCategories(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setNavigationCategories([]);
      });
    return () => { cancelled = true; };
  }, [isFormModalOpen]);

  // Synchronize modal state when entering Edit or New mode via URL
  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      resetForm();
      setEditingBanner(null);
      setIsFormModalOpen(true);
    } else if (bannerId) {
      const existing = banners.find((b) => b._id === bannerId);
      if (existing) {
        populateFormWithBanner(existing);
        setIsFormModalOpen(true);
      } else {
        api.get(`/banners/${bannerId}`)
          .then((res) => {
            const b = res.data?.data;
            if (b) {
              populateFormWithBanner(b);
              setIsFormModalOpen(true);
            }
          })
          .catch(() => {
            toast.error('Banner not found');
            navigate(`${basePath}/${typeKey || 'herobanner'}`);
          });
      }
    }
  }, [location.pathname, bannerId, banners]);

  const populateFormWithBanner = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.content?.title || banner.title || '');
    setDescription(banner.content?.description || banner.content?.subtitle || banner.subtitle || '');
    setDestinationLink(banner.link || '');
    setLinkTarget(banner.linkTarget || '_self');
    setImageUrl(banner.image?.url || (banner.mediaType !== 'video' ? banner.image?.url : '') || '');
    setImageKey(banner.image?.key || '');
    setMobileImageUrl(banner.mobileImage?.url || '');
    setMobileImageKey(banner.mobileImage?.key || '');
    setFormStatus(banner.status || 'active');
    setOrder(banner.display?.order ?? 1);
    setStartDate(formatForInput(banner.startDate));
    setEndDate(formatForInput(banner.endDate));

    const catObj = banner.display?.categoryId || banner.display?.category;
    setSelectedCategory(typeof catObj === 'object' ? catObj?._id : catObj || '');
    setCollectionGroup(banner.display?.collectionGroup || 'gold');
    setSelectedMenuItemIds((banner.display?.menuItemIds || []).map((i) => String(i?._id || i)));

    setCollectionImages((banner.collectionImages?.length ? banner.collectionImages : (banner.image?.url ? [banner.image] : [])).map((img) => ({
      _id: img._id,
      url: img.url,
      key: img.key || '',
      categoryId: img.categoryId?._id || img.categoryId || banner.display?.categoryId?._id || banner.display?.categoryId || '',
    })));

    setThemeId(banner.themeId?._id || banner.themeId || '');
    setPendingThemeImages({});
    setDesktopUploadStats(null);
    setMobileUploadStats(null);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setTitle('');
    setDescription('');
    setDestinationLink('');
    setLinkTarget('_self');
    setImageUrl('');
    setImageKey('');
    setMobileImageUrl('');
    setMobileImageKey('');
    setFormStatus('active');
    const totalCount = bannerCounts[typeKey || 'herobanner'] ?? banners.length;
    setOrder(totalCount + 1);
    setStartDate('');
    setEndDate('');
    setCollectionImages([]);
    setSelectedCategory('');
    setCollectionGroup('gold');
    setSelectedMenuItemIds([]);
    setThemeId('');
    setPendingThemeImages({});
    setDesktopUploadStats(null);
    setMobileUploadStats(null);
  };

  // Paginated items for Screen 2
  const { totalItems, paginatedItems } = usePagination(banners, pageSize, serverTotal);

  // Upload handler for Desktop or Mobile
  const handleFileUpload = async (file, targetDevice) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    const isDesktop = targetDevice === 'desktop';
    if (isDesktop) setIsUploadingDesktop(true);
    else setIsUploadingMobile(true);

    try {
      const res = await uploadWithPresignedUrl(file, 'banners');
      if (isDesktop) {
        setImageUrl(res.fileUrl);
        setImageKey(res.key || '');
        setDesktopUploadStats({
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          wasCompressed: res.wasCompressed,
        });
        toast.success(`Desktop banner uploaded · ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)}`);
      } else {
        setMobileImageUrl(res.fileUrl);
        setMobileImageKey(res.key || '');
        setMobileUploadStats({
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          wasCompressed: res.wasCompressed,
        });
        toast.success(`Mobile banner uploaded · ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)}`);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      if (isDesktop) {
        setIsUploadingDesktop(false);
        if (desktopInputRef.current) desktopInputRef.current.value = '';
      } else {
        setIsUploadingMobile(false);
        if (mobileInputRef.current) mobileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded image
  const handleRemoveUploadedImage = async (device) => {
    if (device === 'desktop') {
      if (imageUrl) {
        try { await deleteUploadedFile(imageUrl); } catch (_) {}
      }
      setImageUrl('');
      setImageKey('');
      setDesktopUploadStats(null);
    } else {
      if (mobileImageUrl) {
        try { await deleteUploadedFile(mobileImageUrl); } catch (_) {}
      }
      setMobileImageUrl('');
      setMobileImageKey('');
      setMobileUploadStats(null);
    }
  };

  // Submit banner from Screen 3
  const handleSaveBanner = async (saveStatus = 'active') => {
    if (!title.trim()) {
      toast.error('Please enter a banner title');
      return;
    }

    try {
      setSubmitting(true);
      const effectiveType = typeKey || editingBanner?.display?.type || 'herobanner';

      const payloadContent = {
        title: title.trim(),
      };
      if (description.trim()) {
        payloadContent.description = description.trim();
        payloadContent.subtitle = description.trim();
      }

      const payloadDisplay = {
        type: effectiveType,
        order: Number(order) || 1,
        platform: 'web',
      };

      if (selectedCategory) {
        payloadDisplay.categoryId = selectedCategory;
      }
      if (effectiveType === 'collectionbanner') {
        if (collectionGroup) payloadDisplay.collectionGroup = collectionGroup;
        if (selectedMenuItemIds?.length > 0) payloadDisplay.menuItemIds = selectedMenuItemIds;
      }

      const payload = {
        content: payloadContent,
        display: payloadDisplay,
        mediaType: 'image',
        status: saveStatus,
        link: destinationLink.trim() || undefined,
        themeId: themeId || undefined,
      };

      if (imageUrl) {
        payload.image = { url: imageUrl, key: imageKey || undefined };
      } else if (editingBanner?.image?.url) {
        payload.image = null;
      }

      if (mobileImageUrl) {
        payload.mobileImage = { url: mobileImageUrl, key: mobileImageKey || undefined };
      } else if (editingBanner?.mobileImage?.url) {
        payload.mobileImage = null;
      }

      if (startDate) payload.startDate = new Date(startDate).toISOString();
      if (endDate) payload.endDate = new Date(endDate).toISOString();

      let savedBanner;
      if (editingBanner?._id) {
        const res = await api.put(`/banners/${editingBanner._id}`, payload);
        savedBanner = res.data?.data || editingBanner;
        toast.success(`Banner ${saveStatus === 'active' ? 'published' : 'saved as draft'} successfully`);
      } else {
        const res = await api.post('/banners', payload);
        savedBanner = res.data?.data;
        toast.success(`Banner ${saveStatus === 'active' ? 'published' : 'saved as draft'} successfully`);
      }

      // Handle theme overrides if present
      if (savedBanner?._id && Object.keys(pendingThemeImages).length && themeId) {
        await savePendingThemeMedia(themeId, 'banner', savedBanner._id, pendingThemeImages);
      }

      setIsFormModalOpen(false);
      resetForm();
      setEditingBanner(null);
      fetchListBanners();
      if (location.pathname.includes('/edit/') || location.pathname.endsWith('/new')) {
        navigate(`${basePath}/${effectiveType}`);
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      toast.error(err.response?.data?.message || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  // Duplicate a banner
  const handleDuplicate = async (banner, e) => {
    e?.stopPropagation();
    try {
      const origTitle = banner.content?.title || banner.title || 'Banner';
      const payload = {
        content: {
          ...(banner.content || {}),
          title: `${origTitle} (Copy)`,
        },
        display: {
          ...(banner.display || {}),
          order: (banner.display?.order ?? 0) + 1,
        },
        image: banner.image?.url ? { url: banner.image.url, key: banner.image.key } : undefined,
        mobileImage: banner.mobileImage?.url ? { url: banner.mobileImage.url, key: banner.mobileImage.key } : undefined,
        collectionImages: banner.collectionImages?.length ? banner.collectionImages : undefined,
        mediaType: banner.mediaType || 'image',
        link: banner.link || '',
        status: 'inactive', // Draft
        startDate: banner.startDate || undefined,
        endDate: banner.endDate || undefined,
        themeId: banner.themeId?._id || banner.themeId || undefined,
      };

      await api.post('/banners', payload);
      toast.success(`"${origTitle}" duplicated as draft`);
      fetchListBanners();
    } catch (err) {
      console.error('Failed to duplicate:', err);
      toast.error('Failed to duplicate banner');
    }
  };

  // Delete a banner
  const handleDelete = async (banner, e) => {
    e?.stopPropagation();
    const bannerTitle = banner.content?.title || banner.title || 'Banner';
    const isConfirmed = await confirm({
      title: 'Delete Banner',
      message: `Are you sure you want to delete "${bannerTitle}"? This cannot be undone.`,
      confirmText: 'Delete Banner',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/banners/${banner._id}`);
      toast.success('Banner deleted');
      setSelectedIds((prev) => prev.filter((id) => id !== banner._id));
      fetchListBanners();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;
    const isConfirmed = await confirm({
      title: 'Delete Selected Banners',
      message: `Are you sure you want to delete ${count} selected banner${count > 1 ? 's' : ''}?`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await Promise.allSettled(selectedIds.map((id) => api.delete(`/banners/${id}`)));
      setSelectedIds([]);
      toast.success(`${count} banner${count > 1 ? 's' : ''} deleted`);
      fetchListBanners();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some banners');
    }
  };

  // =========================================================================
  // RENDER SCREEN 1: BANNER MANAGEMENT OVERVIEW (8 Boxes Grid)
  // =========================================================================
  if (viewMode === 'grid') {
    return (
      <div className="space-y-7 pb-14 animate-fadeIn">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <span>Website Content</span>
          <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold">Banners</span>
        </div>

        {/* Page Heading */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-playfair">
            Banner Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1">
            Choose a banner type to manage its banners.
          </p>
        </div>

        {/* Banner Types Compact Small Box Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
          {BANNER_TYPES.map((card) => {
            const CardIcon = card.icon;
            const count = bannerCounts[card.key] || 0;

            return (
              <div
                key={card.key}
                onClick={() => navigate(`${basePath}/${card.key}`)}
                className="bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 p-4 sm:p-5 transition-all duration-200 cursor-pointer relative group flex flex-col justify-between hover:border-[#8a6d4b] hover:shadow-lg hover:shadow-stone-200/50 hover:bg-[#faf8f5]/40 hover:-translate-y-0.5"
              >
                <div>
                  {/* Top row: Icon and Count Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#fbf5ed] border border-[#f5e3cc]/70 flex items-center justify-center text-[#8a6d4b] shrink-0 group-hover:scale-105 group-hover:bg-[#f6ebd9] transition-all">
                      <CardIcon className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wide ${
                        count > 0
                          ? 'bg-[#fbf5ed] text-[#8a6d4b] border border-[#f5e3cc]'
                          : 'bg-stone-50 text-stone-400 border border-stone-200/60'
                      }`}
                    >
                      {count} {count === 1 ? 'banner' : 'banners'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-[#8a6d4b] transition-colors leading-snug">
                    {card.label}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                {/* Bottom link */}
                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-stone-400 group-hover:text-[#8a6d4b] transition-colors">
                  <span>Manage</span>
                  <HiOutlineChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER SCREEN 2: BANNER TYPE LIST VIEW (Table with filters & + Add Button)
  // =========================================================================
  if (viewMode === 'list') {
    const TypeIcon = currentBannerType.icon;

    return (
      <div className="space-y-6 pb-14 animate-fadeIn">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <span>Website Content</span>
          <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Banners
          </button>
          <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold">{currentBannerType.label}</span>
        </div>

        {/* Back to Banner Types Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer group"
          >
            <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Banner Types</span>
          </button>
        </div>

        {/* Header: Icon + Title + Description & + Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fbf5ed] border border-[#f5e3cc]/60 flex items-center justify-center text-[#8a6d4b] shrink-0">
              <TypeIcon className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-playfair">
                {currentBannerType.label}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
                {currentBannerType.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
              >
                <HiOutlineTrash className="w-4 h-4" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditingBanner(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#8a6d4b] hover:bg-[#785b3a] text-white shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
              <span>Add {currentBannerType.label}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar matching screenshot */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search banners..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs sm:text-[13px] bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8a6d4b] focus:border-[#8a6d4b] transition-all"
            />
          </div>

          {/* Right Filter Dropdowns */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end overflow-x-auto">
            {/* Status Filter */}
            <Dropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'published', label: 'Published' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'draft', label: 'Draft' },
              ]}
              buttonClassName="h-9 px-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />

            {/* Devices Filter */}
            <Dropdown
              value={deviceFilter}
              onChange={setDeviceFilter}
              options={[
                { value: 'all', label: 'All Devices' },
                { value: 'desktop', label: 'Desktop' },
                { value: 'mobile', label: 'Mobile' },
              ]}
              buttonClassName="h-9 px-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />

            {/* Sort Dropdown */}
            <Dropdown
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'order_asc', label: 'Order: Low to High' },
                { value: 'order_desc', label: 'Order: High to Low' },
              ]}
              buttonClassName="h-9 px-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>
        </div>

        {/* Data Table Matching Screenshot */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-150 bg-[#faf9f7] text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedItems.length > 0 && paginatedItems.every((b) => selectedIds.includes(b._id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(paginatedItems.map((b) => b._id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-stone-300 text-[#8a6d4b] focus:ring-[#8a6d4b] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">PREVIEW</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">TITLE</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">DEVICES</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">ORDER</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">DATE</th>
                  <th className="py-3.5 pr-6 pl-4 whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-xs sm:text-[13px] text-stone-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-stone-400">
                      <div className="w-7 h-7 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto mb-3" />
                      <span>Loading banners...</span>
                    </td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-stone-400">
                      <HiOutlinePhotograph className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                      <p className="text-sm font-medium text-stone-600">No {currentBannerType.label}s found</p>
                      <p className="text-xs text-stone-400 mt-1">
                        Click "+ Add {currentBannerType.label}" to create one.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((banner) => {
                    const bTitle = banner.content?.title || banner.title || 'Untitled Banner';
                    const bDesc = banner.content?.description || banner.content?.subtitle || banner.subtitle || '';
                    const assetUrl = banner.image?.url || (banner.collectionImages?.[0]?.url);
                    const isScheduled = banner.status === 'scheduled' || (banner.startDate && new Date(banner.startDate) > new Date());
                    const isPublished = banner.status === 'active' && !isScheduled;
                    const dateInfo = formatDateDisplay(banner.updatedAt || banner.createdAt);
                    const isSelected = selectedIds.includes(banner._id);

                    return (
                      <tr
                        key={banner._id}
                        className={`hover:bg-[#faf8f5]/60 transition-colors ${isSelected ? 'bg-[#fcfaf7]' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedIds((prev) =>
                                prev.includes(banner._id)
                                  ? prev.filter((id) => id !== banner._id)
                                  : [...prev, banner._id]
                              );
                            }}
                            className="rounded border-stone-300 text-[#8a6d4b] focus:ring-[#8a6d4b] cursor-pointer"
                          />
                        </td>

                        {/* PREVIEW */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div
                            onClick={() => navigate(`${basePath}/${currentBannerType.key}/edit/${banner._id}`)}
                            className="w-28 sm:w-32 h-14 rounded-xl border border-stone-200/90 overflow-hidden bg-stone-900 relative shadow-2xs cursor-pointer group flex items-center justify-center shrink-0"
                          >
                            {assetUrl ? (
                              <img
                                src={getMediaUrl(assetUrl)}
                                alt={bTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#2a241e] flex items-center justify-center text-stone-500">
                                <HiOutlinePhotograph className="w-5 h-5 text-[#8a6d4b]/60" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* TITLE */}
                        <td className="py-3.5 px-4 font-medium text-stone-900">
                          <div
                            onClick={() => navigate(`${basePath}/${currentBannerType.key}/edit/${banner._id}`)}
                            className="font-bold text-stone-900 text-sm max-w-[260px] truncate cursor-pointer hover:text-[#8a6d4b] transition-colors"
                            title={bTitle}
                          >
                            {bTitle}
                          </div>
                          {bDesc && (
                            <div className="text-xs text-stone-400 font-normal max-w-[240px] truncate mt-0.5" title={bDesc}>
                              {bDesc}
                            </div>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf7ee] text-[#137333]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                              <span>Published</span>
                            </span>
                          ) : isScheduled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff7e6] text-[#d46b08]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fa8c16]" />
                              <span>Scheduled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>

                        {/* DEVICES */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <span
                              title="Desktop View"
                              className={`p-1 rounded-md ${banner.image?.url ? 'text-stone-700 bg-stone-100' : 'text-stone-400'}`}
                            >
                              <HiOutlineDesktopComputer className="w-4 h-4" />
                            </span>
                            <span
                              title="Mobile View"
                              className={`p-1 rounded-md ${banner.mobileImage?.url ? 'text-stone-700 bg-stone-100' : 'text-stone-400'}`}
                            >
                              <HiOutlineDeviceMobile className="w-4 h-4" />
                            </span>
                          </div>
                        </td>

                        {/* ORDER */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50">
                            {banner.display?.order ?? 1}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-stone-700">
                            {dateInfo.date}
                          </div>
                          <div className="text-[11px] text-stone-400 font-normal mt-0.5">
                            {dateInfo.time}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 pr-6 pl-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Edit Pencil (Opens Popup Modal) */}
                            <button
                              type="button"
                              onClick={() => {
                                populateFormWithBanner(banner);
                                setIsFormModalOpen(true);
                              }}
                              title="Edit banner"
                              className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-[#faf6f0] text-stone-600 hover:text-[#8a6d4b] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              <HiOutlinePencil className="w-3.5 h-3.5 stroke-[1.8]" />
                            </button>

                            {/* Delete Trash */}
                            <button
                              type="button"
                              onClick={(e) => handleDelete(banner, e)}
                              title="Delete banner"
                              className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5 stroke-[1.8]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-stone-150 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/50">
            <span className="text-xs text-stone-500 font-medium">
              Showing {(serverTotal ?? banners.length) > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, serverTotal ?? banners.length)} of {serverTotal ?? banners.length} banners
            </span>

            <Pagination
              currentPage={currentPage}
              totalItems={serverTotal ?? banners.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Hidden inputs for image uploading */}
        <input
          ref={desktopInputRef}
          type="file"
          onChange={(e) => handleFileUpload(e.target.files?.[0], 'desktop')}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        <input
          ref={mobileInputRef}
          type="file"
          onChange={(e) => handleFileUpload(e.target.files?.[0], 'mobile')}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        {/* ─── ADD / EDIT BANNER POPUP MODAL ───────────────────────── */}
        {isFormModalOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
            onClick={handleCloseModal}
          >
            <div
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-auto animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#faf8f5] px-5 sm:px-6 py-4 border-b border-stone-150 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#e8d8c0] flex items-center justify-center text-[#8a6d4b] shadow-2xs shrink-0">
                    <ActiveBannerIcon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900 font-playfair tracking-tight">
                      {editingBanner ? `Edit ${currentBannerType.label}` : `Add ${currentBannerType.label}`}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 font-normal">
                      Upload banner images and set details for {currentBannerType.label.toLowerCase()}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  aria-label="Close modal"
                >
                  <HiOutlineX className="w-4 h-4 stroke-2" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
                {/* 1. Banner Details Card */}
                <div className="bg-[#fcfbf9] rounded-2xl border border-stone-200/80 p-4 sm:p-5 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Banner Details
                  </h3>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter banner title"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#8a6d4b] focus:border-[#8a6d4b] transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter short description (optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#8a6d4b] focus:border-[#8a6d4b] transition-all"
                    />
                  </div>

                  {/* Link / URL */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Link / URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={destinationLink}
                        onChange={(e) => setDestinationLink(e.target.value)}
                        placeholder="https://"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#8a6d4b] focus:border-[#8a6d4b] transition-all"
                      />
                      <Dropdown
                        value={linkTarget}
                        onChange={setLinkTarget}
                        options={[
                          { value: '_self', label: 'Open in same tab' },
                          { value: '_blank', label: 'Open in new tab' },
                        ]}
                        buttonClassName="h-10 px-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white whitespace-nowrap"
                        menuClassName="z-30"
                      />
                    </div>
                  </div>

                  {/* Collection Banner extra options */}
                  {currentBannerType.key === 'collectionbanner' && (
                    <div className="pt-2 border-t border-stone-200/60 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Collection Group
                          </label>
                          <Dropdown
                            value={collectionGroup}
                            onChange={setCollectionGroup}
                            options={[
                              { value: 'gold', label: 'Gold Collection' },
                              { value: 'silver', label: 'Silver Collection' },
                              { value: 'spiritual', label: 'Spiritual Collection' },
                            ]}
                            buttonClassName="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white"
                            menuClassName="z-30"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Associated Category
                          </label>
                          <Dropdown
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            options={[
                              { value: '', label: 'Select Category (Optional)' },
                              ...categories.map((c) => ({ value: c._id, label: c.name })),
                            ]}
                            buttonClassName="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white"
                            menuClassName="z-30"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Banner Images Card */}
                <div className="bg-[#fcfbf9] rounded-2xl border border-stone-200/80 p-4 sm:p-5 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Banner Images
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Desktop Banner Upload Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-stone-700">
                          Desktop Banner <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10.5px] text-stone-400 font-normal">
                          (Recommended 1920 × 600)
                        </span>
                      </div>

                      {imageUrl ? (
                        <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-900 aspect-[16/7] group shadow-2xs">
                          <img
                            src={getMediaUrl(imageUrl)}
                            alt="Desktop Banner"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => desktopInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-white/90 text-stone-800 text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedImage('desktop')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          {desktopUploadStats && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                              {formatBytes(desktopUploadStats.compressedSize)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => desktopInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFileUpload(e.dataTransfer?.files?.[0], 'desktop');
                          }}
                          className="border-2 border-dashed border-stone-300 hover:border-[#8a6d4b] bg-white hover:bg-[#fbf5ed]/40 rounded-2xl p-5 text-center cursor-pointer transition-all aspect-[16/7] flex flex-col items-center justify-center group shadow-2xs"
                        >
                          {isUploadingDesktop ? (
                            <div className="space-y-2">
                              <div className="w-6 h-6 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto" />
                              <p className="text-xs text-stone-500 font-medium">Uploading & compressing...</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-[#faf6f0] border border-stone-200 flex items-center justify-center text-stone-500 group-hover:text-[#8a6d4b] group-hover:border-[#8a6d4b]/40 mb-2 transition-colors shadow-2xs">
                                <HiOutlineCloudUpload className="w-5 h-5 stroke-[1.8]" />
                              </div>
                              <p className="text-xs font-semibold text-stone-800">
                                Click to upload
                                <span className="font-normal text-stone-500"> or drag and drop</span>
                              </p>
                              <p className="text-[10.5px] text-stone-400 mt-0.5">
                                JPG, PNG, WebP (Max 5MB)
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mobile Banner Upload Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-stone-700">
                          Mobile Banner <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10.5px] text-stone-400 font-normal">
                          (Recommended 768 × 1024)
                        </span>
                      </div>

                      {mobileImageUrl ? (
                        <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-900 aspect-[16/7] group shadow-2xs">
                          <img
                            src={getMediaUrl(mobileImageUrl)}
                            alt="Mobile Banner"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => mobileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-white/90 text-stone-800 text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedImage('mobile')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          {mobileUploadStats && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                              {formatBytes(mobileUploadStats.compressedSize)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => mobileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFileUpload(e.dataTransfer?.files?.[0], 'mobile');
                          }}
                          className="border-2 border-dashed border-stone-300 hover:border-[#8a6d4b] bg-white hover:bg-[#fbf5ed]/40 rounded-2xl p-5 text-center cursor-pointer transition-all aspect-[16/7] flex flex-col items-center justify-center group shadow-2xs"
                        >
                          {isUploadingMobile ? (
                            <div className="space-y-2">
                              <div className="w-6 h-6 border-2 border-stone-300 border-t-[#8a6d4b] rounded-full animate-spin mx-auto" />
                              <p className="text-xs text-stone-500 font-medium">Uploading & compressing...</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-[#faf6f0] border border-stone-200 flex items-center justify-center text-stone-500 group-hover:text-[#8a6d4b] group-hover:border-[#8a6d4b]/40 mb-2 transition-colors shadow-2xs">
                                <HiOutlineCloudUpload className="w-5 h-5 stroke-[1.8]" />
                              </div>
                              <p className="text-xs font-semibold text-stone-800">
                                Click to upload
                                <span className="font-normal text-stone-500"> or drag and drop</span>
                              </p>
                              <p className="text-[10.5px] text-stone-400 mt-0.5">
                                JPG, PNG, WebP (Max 5MB)
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Display Settings Card */}
                <div className="bg-[#fcfbf9] rounded-2xl border border-stone-200/80 p-4 sm:p-5 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Display Settings
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-stone-700">
                        Status
                      </label>
                      <Dropdown
                        value={formStatus}
                        onChange={setFormStatus}
                        options={[
                          { value: 'active', label: 'Published' },
                          { value: 'inactive', label: 'Draft' },
                        ]}
                        buttonClassName="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white"
                        menuClassName="z-30"
                      />
                    </div>

                    {/* Display Order */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-stone-700">
                        Display Order <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={order}
                        onChange={(e) => setOrder(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#8a6d4b] focus:border-[#8a6d4b] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-stone-150 bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-stone-700 transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveBanner('inactive')}
                    className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-stone-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveBanner('active')}
                    className="px-5 py-2 rounded-xl bg-[#8a6d4b] hover:bg-[#785b3a] text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <span>{editingBanner ? 'Update Banner' : 'Publish Banner'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback redirect to list
  return null;
}
