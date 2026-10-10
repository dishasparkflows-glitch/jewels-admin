import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlinePhotograph,
  HiOutlineFilm,
  HiOutlineCloudUpload,
  HiOutlineTag,
  HiOutlineX,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import Dropdown from '../../components/common/Dropdown';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

const POSITION_OPTIONS = [
  { value: 'none', label: 'None (Default / Hero Slider)' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'right-tall', label: 'Right Tall' },
];

const BANNER_TYPE_OPTIONS = [
  { value: 'herobanner', label: 'Hero Banner' },
  { value: 'collectionbanner', label: 'Collection Banner' },
];

export default function BannersView() {
  const confirm = useConfirm();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [viewingBanner, setViewingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State matching nested schema { content, display }
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [bannerType, setBannerType] = useState('herobanner');
  const [position, setPosition] = useState('none');
  const [order, setOrder] = useState(1);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [link, setLink] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch Banners and Categories from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannersRes, catsRes] = await Promise.all([
        api.get('/banners?limit=100'),
        api.get('/categories?limit=100'),
      ]);

      const bannerItems =
        bannersRes.data?.data?.items ||
        (Array.isArray(bannersRes.data?.data) ? bannersRes.data.data : []);
      setBanners(bannerItems);

      const catItems =
        catsRes.data?.data?.items ||
        (Array.isArray(catsRes.data?.data) ? catsRes.data.data : []);
      setCategories(catItems);
    } catch (err) {
      console.error('Failed to load banners/categories:', err);
      toast.error('Failed to load banner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Banners list (Search query matching title, subtitle, category, position, type)
  const filteredBanners = useMemo(() => {
    if (!search.trim()) return banners;
    const q = search.toLowerCase();
    return banners.filter((b) => {
      const catObj = b.display?.category || b.category;
      const catName =
        typeof catObj === 'object'
          ? catObj?.name || ''
          : categories.find((c) => c._id === catObj)?.name || '';

      const bTitle = b.content?.title || b.title || '';
      const bSubtitle = b.content?.subtitle || b.subtitle || '';
      const bType = b.display?.type || b.type || '';
      const bPos = b.display?.position || b.position || '';

      return (
        bTitle.toLowerCase().includes(q) ||
        bSubtitle.toLowerCase().includes(q) ||
        bType.toLowerCase().includes(q) ||
        bPos.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q)
      );
    });
  }, [banners, search, categories]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredBanners, 10);

  // Quick stat cards
  const activeCount = useMemo(() => banners.filter((b) => b.status === 'active').length, [banners]);
  const heroCount = useMemo(
    () => banners.filter((b) => (b.display?.type || b.type) === 'herobanner').length,
    [banners]
  );
  const collectionCount = useMemo(
    () => banners.filter((b) => (b.display?.type || b.type) === 'collectionbanner').length,
    [banners]
  );
  const videoCount = useMemo(() => banners.filter((b) => b.mediaType === 'video').length, [banners]);

  const statCardsData = [
    {
      label: 'Total Banners',
      value: banners.length,
      icon: HiOutlinePhotograph,
      color: 'bronze',
    },
    {
      label: 'Active Campaigns',
      value: activeCount,
      icon: HiOutlineTag,
      color: 'green',
    },
    {
      label: 'Hero Banners',
      value: heroCount,
      icon: HiOutlinePhotograph,
      color: 'peach',
    },
    {
      label: 'Collection Banners',
      value: collectionCount,
      icon: HiOutlineTag,
      color: 'gold',
    },
  ];

  // Open Modal to Add New Asset
  const handleOpenAdd = () => {
    setEditingBanner(null);
    setMediaType('image');
    setBannerType('herobanner');
    setSelectedCategory(categories[0]?._id || '');
    setTitle('');
    setSubtitle('');
    setPosition('none');
    setOrder(banners.length + 1);
    setLink('');
    setMediaUrl('');
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Asset
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setMediaType(banner.mediaType || 'image');
    setBannerType(banner.display?.type || banner.type || 'herobanner');

    const catObj = banner.display?.category || banner.category;
    const catId = typeof catObj === 'object' ? catObj?._id : catObj || '';
    setSelectedCategory(catId);

    setTitle(banner.content?.title || banner.title || '');
    setSubtitle(banner.content?.subtitle || banner.subtitle || '');
    setPosition(banner.display?.position || banner.position || 'none');
    setOrder(banner.display?.order ?? banner.order ?? 1);
    setLink(banner.link || '');
    setMediaUrl(banner.mediaType === 'video' ? banner.video?.url : banner.image?.url || '');
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Handle File Selection and Presigned URL Upload to Cloudflare R2
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file (.jpg, .png, .webp)');
      return;
    }
    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file (.mp4, .webm, .mov)');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const { fileUrl } = await uploadWithPresignedUrl(
        file,
        'banners',
        (progress) => setUploadProgress(progress)
      );

      setMediaUrl(fileUrl);
      toast.success(
        `${mediaType === 'image' ? 'Image' : 'Video'} uploaded successfully via Cloudflare`
      );
    } catch (err) {
      console.error('Presigned upload failed:', err);
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete banner
  const handleDelete = async (id, bannerTitle) => {
    const isConfirmed = await confirm({
      title: 'Delete Banner',
      message: `Are you sure you want to delete banner "${bannerTitle || 'Untitled'}"? This action cannot be undone.`,
      confirmText: 'Delete Banner',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted successfully');
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal Form matching { content, display } schema
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error('Please select a linked category');
      return;
    }
    if (!mediaUrl) {
      toast.error(`Please select and upload a banner ${mediaType}`);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        content: {
          title: title.trim(),
          subtitle: subtitle.trim(),
        },
        display: {
          category: selectedCategory,
          type: bannerType,
          position: position.trim() || 'none',
          order: Number(order) || 1,
        },
        link: link.trim() || undefined,
        mediaType,
        status: editingBanner ? editingBanner.status : 'active',
      };

      if (mediaType === 'image') {
        payload.image = { url: mediaUrl };
        payload.video = undefined;
      } else {
        payload.video = { url: mediaUrl };
        payload.image = undefined;
      }

      if (editingBanner?._id) {
        await api.put(`/banners/${editingBanner._id}`, payload);
        toast.success('Banner asset updated successfully');
      } else {
        await api.post('/banners', payload);
        toast.success('New banner asset added successfully');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving banner:', err);
      toast.error(err.response?.data?.message || 'Failed to save banner asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Marketing', 'Banners']}
        title="Banner Master"
        subtitle="Manage promotional hero banners, video reels and carousel portrayals for luxury collections."
        onAdd={handleOpenAdd}
        addLabel="Add Banner"
        exportData={banners}
        exportFileName="banners_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search banners by headline, subtitle, category, type, or position..."
      />

      {/* ─── Banners Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  SR NO
                </th>
                <th className="py-2 px-3 whitespace-nowrap">PREVIEW</th>
                <th className="py-2 px-3 whitespace-nowrap">CONTENT (HEADLINE & SUBTITLE)</th>
                <th className="py-2 px-3 whitespace-nowrap">LINKED CATEGORY</th>
                <th className="py-2 px-3 whitespace-nowrap">DISPLAY CONFIG</th>
                <th className="py-2 px-3 whitespace-nowrap">MEDIA TYPE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    Loading promotional banner assets...
                  </td>
                </tr>
              ) : filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    No promotional banner assets found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((banner, idx) => {
                  const catObj = banner.display?.category || banner.category;
                  const categoryName =
                    typeof catObj === 'object'
                      ? catObj?.name
                      : categories.find((c) => c._id === catObj)?.name || 'General';

                  const assetUrl =
                    banner.mediaType === 'video' ? banner.video?.url : banner.image?.url;

                  const bannerHeading = banner.content?.title || banner.title || '';
                  const bannerSub = banner.content?.subtitle || banner.subtitle || '';
                  const typeVal = banner.display?.type || banner.type || 'herobanner';
                  const positionVal = banner.display?.position || banner.position || 'none';
                  const orderVal = banner.display?.order ?? banner.order ?? 0;

                  return (
                    <tr
                      key={banner._id}
                      onClick={() => setViewingBanner(banner)}
                      className="hover:bg-[#faf7f2] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Preview */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div
                          onClick={() => setViewingBanner(banner)}
                          className="w-14 h-8 rounded-md border border-stone-200/80 cursor-pointer hover:opacity-90 relative flex items-center justify-center shadow-2xs overflow-hidden bg-stone-100"
                        >
                          {banner.mediaType === 'video' ? (
                            <div className="w-full h-full bg-stone-900 flex items-center justify-center text-white">
                              <HiOutlineFilm className="w-4 h-4 text-stone-300" />
                            </div>
                          ) : (
                            <img
                              src={getMediaUrl(assetUrl)}
                              alt={bannerHeading || 'Banner'}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </td>

                      {/* Content: Title & Subtitle */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-bold text-stone-900 text-xs truncate leading-tight">
                          {bannerHeading || `${categoryName} Campaign`}
                        </div>
                        {bannerSub && (
                          <div className="text-[10px] text-stone-500 truncate leading-tight mt-0.5">
                            {bannerSub}
                          </div>
                        )}
                      </td>

                      {/* Linked Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                          {categoryName}
                        </span>
                      </td>

                      {/* Display Config (Type, Position, Order) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              typeVal === 'herobanner'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                            }`}
                          >
                            {typeVal === 'herobanner' ? 'Hero' : 'Collection'}
                          </span>
                          {positionVal !== 'none' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                              {positionVal}
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400 font-semibold">
                            #{orderVal}
                          </span>
                        </div>
                      </td>

                      {/* Media Type */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            banner.mediaType === 'video'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {banner.mediaType === 'video' ? (
                            <HiOutlineFilm className="w-3 h-3" />
                          ) : (
                            <HiOutlinePhotograph className="w-3 h-3" />
                          )}
                          {banner.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingBanner(banner)}
                          onEdit={() => handleOpenEdit(banner)}
                          onDelete={() => handleDelete(banner._id, bannerHeading)}
                          viewTitle="View Banner"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Luxury Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ─── Preview Modal ─── */}
      {viewingBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingBanner(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {viewingBanner.content?.title || viewingBanner.title || 'Banner Preview'}
                </h3>
                {viewingBanner.content?.subtitle || viewingBanner.subtitle ? (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {viewingBanner.content?.subtitle || viewingBanner.subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setViewingBanner(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center">
              {viewingBanner.mediaType === 'video' ? (
                <video
                  src={getMediaUrl(viewingBanner.video?.url)}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={getMediaUrl(viewingBanner.image?.url)}
                  alt={viewingBanner.content?.title || viewingBanner.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Config metadata summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Type
                </span>
                <span className="font-semibold text-stone-800 capitalize mt-0.5 block">
                  {viewingBanner.display?.type || viewingBanner.type || 'Hero'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Position
                </span>
                <span className="font-semibold text-stone-800 mt-0.5 block">
                  {viewingBanner.display?.position || viewingBanner.position || 'none'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Display Order
                </span>
                <span className="font-semibold text-stone-800 mt-0.5 block">
                  #{viewingBanner.display?.order ?? viewingBanner.order ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Target Link
                </span>
                <span className="font-semibold text-stone-800 truncate mt-0.5 block">
                  {viewingBanner.link || '/shop'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const b = viewingBanner;
                  setViewingBanner(null);
                  handleOpenEdit(b);
                }}
                className="flex-1 py-2.5 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Edit Banner
              </button>
              <button
                type="button"
                onClick={() => setViewingBanner(null)}
                className="px-5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Modal (Configured for content & display schema) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-lg tracking-tight">
                  {editingBanner ? 'Edit Banner Asset' : 'Add New Banner Asset'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mt-0.5">
                  CONTENT & DISPLAY CONFIGURATION
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ─── 1. MEDIA CONFIGURATION ─── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                    1. MEDIA ASSET
                  </span>
                  {/* Segmented Media Type Tabs */}
                  <div className="inline-flex p-0.5 rounded-xl bg-stone-100 border border-stone-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('image');
                        setMediaUrl('');
                      }}
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        mediaType === 'image'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      IMAGE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('video');
                        setMediaUrl('');
                      }}
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        mediaType === 'video'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      VIDEO
                    </button>
                  </div>
                </div>

                {/* Asset Dropzone */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept={
                      mediaType === 'image'
                        ? 'image/png, image/jpeg, image/webp'
                        : 'video/mp4, video/webm, video/quicktime'
                    }
                    className="hidden"
                  />

                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] relative group overflow-hidden ${
                      isUploading
                        ? 'opacity-70 pointer-events-none'
                        : 'hover:border-[#8f6d43] hover:bg-[#fcfaf7]'
                    }`}
                  >
                    {isUploading ? (
                      <div className="space-y-3 w-full max-w-xs">
                        <div className="w-10 h-10 rounded-full border-3 border-stone-200 border-t-[#8f6d43] animate-spin mx-auto" />
                        <p className="text-xs font-bold text-stone-700 tracking-wide">
                          Uploading to Cloudflare ({uploadProgress}%)...
                        </p>
                        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8f6d43] transition-all duration-200 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : mediaUrl ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden flex items-center justify-center">
                        {mediaType === 'video' ? (
                          <video
                            src={getMediaUrl(mediaUrl)}
                            className="w-full h-full object-cover rounded-xl"
                            controls
                          />
                        ) : (
                          <img
                            src={getMediaUrl(mediaUrl)}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold tracking-wider uppercase">
                          CLICK TO CHANGE
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <HiOutlineCloudUpload className="w-8 h-8 text-stone-400 group-hover:text-[#8f6d43] transition-colors mx-auto" />
                        <span className="block text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-700 transition-colors">
                          SELECT {mediaType === 'image' ? 'IMAGE' : 'VIDEO'}
                        </span>
                        <span className="block text-[10px] text-stone-300">
                          {mediaType === 'image'
                            ? 'PNG, JPG, WEBP up to 25MB'
                            : 'MP4, WEBM, MOV up to 100MB'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── 2. CONTENT DETAILS (content: { title, subtitle }) ─── */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold tracking-wider text-stone-400 uppercase block">
                  2. CONTENT (HEADLINE & SUBTITLE)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                      TITLE / HEADLINE
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. TIMELESS BEAUTY,"
                      className="w-full h-11 px-3.5 rounded-lg border border-stone-200/90 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]/20 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                      SUBTITLE
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Forever You"
                      className="w-full h-11 px-3.5 rounded-lg border border-stone-200/90 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]/20 transition-all bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ─── 3. DISPLAY CONFIGURATION (display: { category, type, position, order }) ─── */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold tracking-wider text-stone-400 uppercase block">
                  3. DISPLAY CONFIGURATION
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Link */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                      LINKED CATEGORY <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                      value={selectedCategory}
                      onChange={(val) => setSelectedCategory(val)}
                      options={categories.map((cat) => ({
                        value: cat._id,
                        label: cat.name,
                      }))}
                      placeholder="Select Category"
                      buttonClassName="h-11 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* Banner Type */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                      BANNER TYPE <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                      value={bannerType}
                      onChange={(val) => setBannerType(val)}
                      options={BANNER_TYPE_OPTIONS}
                      placeholder="Select Type"
                      buttonClassName="h-11 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                      POSITION
                    </label>
                    <Dropdown
                      value={position}
                      onChange={(val) => setPosition(val)}
                      options={POSITION_OPTIONS}
                      placeholder="Select Position"
                      buttonClassName="h-11 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* Order */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                      DISPLAY ORDER
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value) || 0)}
                      placeholder="1"
                      className="w-full h-11 px-3.5 rounded-lg border border-stone-200/90 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]/20 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Target Link */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase mb-1.5">
                    DESTINATION LINK URL (OPTIONAL)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="e.g. /shop?category=pendant"
                      className="w-full h-11 pl-3.5 pr-8 rounded-lg border border-stone-200/90 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]/20 transition-all bg-white"
                    />
                    <HiOutlineExternalLink className="absolute right-3 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting || isUploading}
                  className="px-6 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'SAVING...' : editingBanner ? 'SAVE CHANGES' : 'ADD BANNER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
