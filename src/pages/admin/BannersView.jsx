import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineFilm,
  HiOutlineCloudUpload,
  HiOutlineExternalLink,
  HiOutlineTag,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function BannersView() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'image', 'video'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State matching screenshot
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
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

  // Filtered Banners list
  const filteredBanners = banners.filter((b) => {
    if (filterType === 'all') return true;
    return b.mediaType === filterType;
  });

  // Open Modal to Add New Asset
  const handleOpenAdd = () => {
    setEditingBanner(null);
    setMediaType('image');
    setSelectedCategory(categories[0]?._id || '');
    setTitle('');
    setSubtitle('');
    setMediaUrl('');
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Asset
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setMediaType(banner.mediaType || 'image');
    setSelectedCategory(
      typeof banner.category === 'object' ? banner.category?._id : banner.category || ''
    );
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setMediaUrl(banner.mediaType === 'video' ? banner.video?.url : banner.image?.url || '');
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  // Handle File Selection and Presigned URL Upload to Cloudflare R2
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
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

      // Upload directly via Cloudflare R2 presigned URL
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

  // Toggle active/inactive status
  const handleToggleStatus = async (banner) => {
    try {
      const nextStatus = banner.status === 'active' ? 'inactive' : 'active';
      await api.put(`/banners/${banner._id}`, { status: nextStatus });
      toast.success(`Banner status updated to ${nextStatus}`);
      setBanners((prev) =>
        prev.map((item) =>
          item._id === banner._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete banner
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title || 'Untitled'}"?`)) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted successfully');
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Submit Modal Form
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
        category: selectedCategory,
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        mediaType,
        type: 'herobanner',
        status: 'active',
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Top Header (Matches Screenshot Background - Zero Sync Button) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Banner Master
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage promotional banner assets, video reels and carousel portrayals.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD ASSET</span>
        </button>
      </div>

      {/* ─── Segmented Filter Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-4">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#8f6d43] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          ALL ASSETS ({banners.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('image')}
          className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'image'
              ? 'bg-[#8f6d43] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          <HiOutlinePhotograph className="w-4 h-4" />
          <span>IMAGES ({banners.filter((b) => b.mediaType !== 'video').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('video')}
          className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'video'
              ? 'bg-[#8f6d43] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          <HiOutlineFilm className="w-4 h-4" />
          <span>VIDEOS ({banners.filter((b) => b.mediaType === 'video').length})</span>
        </button>
      </div>

      {/* ─── Banner Cards Grid ─── */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">
          Loading promotional banner assets...
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border border-dashed border-stone-200 text-center space-y-3">
          <HiOutlinePhotograph className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-semibold text-stone-600">No promotional banner assets found</p>
          <p className="text-xs text-stone-400">Click "+ ADD ASSET" to upload a new banner image or video reel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => {
            const isActive = banner.status === 'active';
            const categoryName =
              typeof banner.category === 'object'
                ? banner.category?.name
                : categories.find((c) => c._id === banner.category)?.name || 'General';

            const assetUrl =
              banner.mediaType === 'video' ? banner.video?.url : banner.image?.url;

            return (
              <div
                key={banner._id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-[16/8] bg-stone-100 overflow-hidden">
                  {banner.mediaType === 'video' ? (
                    <video
                      src={getMediaUrl(assetUrl)}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={getMediaUrl(assetUrl)}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-xs text-white">
                      {banner.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#faf5ee]/90 backdrop-blur-xs text-[#8f6d43] border border-[#e8d9c2]">
                      {categoryName}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-tight truncate">
                      {banner.title || `${categoryName} Banner Asset`}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Status Toggle & Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    {/* Status Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(banner)}
                        className={`w-11 h-6 rounded-full transition-colors relative inline-block cursor-pointer focus:outline-none ${
                          isActive ? 'bg-[#8f6d43]' : 'bg-stone-300'
                        }`}
                        title={`Status: ${isActive ? 'Active' : 'Inactive'}`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 absolute top-0.5 left-0.5 ${
                            isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(banner)}
                        title="Edit Banner"
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id, banner.title)}
                        title="Delete Banner"
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Add New Asset Modal (Matches Screenshot Exactly) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-lg tracking-tight">
                  {editingBanner ? 'Edit Asset' : 'Add New Asset'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mt-0.5">
                  MEDIA CONFIGURATION
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Media Type Segmented Tabs (Matches Screenshot) */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 border border-stone-200/70">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setMediaUrl('');
                  }}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
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
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    mediaType === 'video'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  VIDEO
                </button>
              </div>

              {/* Category Link (Matches Screenshot) */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  CATEGORY LINK
                </label>
                <select
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Dropzone (Matches Screenshot with Cloudflare R2 Presigned Upload) */}
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
                  className={`rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[170px] relative group overflow-hidden ${
                    isUploading ? 'opacity-70 pointer-events-none' : 'hover:border-[#8f6d43] hover:bg-[#fcfaf7]'
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
                    /* Media Preview */
                    <div className="relative w-full h-36 rounded-xl overflow-hidden flex items-center justify-center">
                      {mediaType === 'video' ? (
                        <video src={getMediaUrl(mediaUrl)} className="w-full h-full object-cover rounded-xl" controls />
                      ) : (
                        <img src={getMediaUrl(mediaUrl)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold tracking-wider uppercase">
                        CLICK TO CHANGE
                      </div>
                    </div>
                  ) : (
                    /* Default Dropzone Prompt */
                    <div className="space-y-2">
                      <HiOutlineCloudUpload className="w-8 h-8 text-stone-400 group-hover:text-[#8f6d43] transition-colors mx-auto" />
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-700 transition-colors">
                        SELECT {mediaType === 'image' ? 'IMAGE' : 'VIDEO'}
                      </span>
                      <span className="block text-[10px] text-stone-300">
                        {mediaType === 'image' ? 'PNG, JPG, WEBP up to 25MB' : 'MP4, WEBM, MOV up to 100MB'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions (Matches Screenshot) */}
              <div className="pt-2 flex items-center justify-end gap-4">
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
