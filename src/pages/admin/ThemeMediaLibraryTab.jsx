import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlineTag,
  HiOutlineFilter,
  HiOutlineSparkles,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { websiteThemesAPI, bannersAPI, featuredAPI } from '../../api/services';
import { uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import Dropdown from '../../components/common/Dropdown';

export default function ThemeMediaLibraryTab({
  themeId,
  themeStatus = 'draft',
  availableBanners = [],
  availableFeatured = [],
  categories = [],
  onMediaChanged,
}) {
  const [mediaItems, setMediaItems] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    hero: 0,
    collection: 0,
    category: 0,
    app: 0,
    celebrate_gifts: 0,
    category_icons: 0,
    unused: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals & previews
  const [previewItem, setPreviewItem] = useState(null);
  const [replacingItem, setReplacingItem] = useState(null);
  const [assignmentModalItem, setAssignmentModalItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Fetch media items from backend endpoint
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await websiteThemesAPI.getMediaLibrary(themeId);
      const data = res.data?.data || {};
      setMediaItems(data.items || []);
      setCounts(data.counts || {});
    } catch (err) {
      console.error('Failed to load theme media library:', err);
      // Fallback: build from client-side available banners, featured, and categories
      buildClientFallback();
    } finally {
      setLoading(false);
    }
  };

  const buildClientFallback = () => {
    const items = [];
    (availableBanners || []).forEach((b) => {
      const type = b.display?.type || 'herobanner';
      const platform = b.display?.platform || 'web';
      const title = b.content?.title || b.title || `${type} ${String(b._id).slice(-4)}`;
      if (b.image?.url) {
        items.push({
          id: `${b._id}:desktop`,
          url: b.image.url,
          key: b.image.key || '',
          name: `${title} (Desktop)`,
          mediaType: b.mediaType || 'image',
          variant: platform === 'mobile' ? 'mobile' : 'desktop',
          module: 'banner',
          filterType: type === 'herobanner' ? 'hero' : type === 'collectionbanner' ? 'collection' : type === 'categorybanner' ? 'category' : type === 'mobileappbanner' ? 'app' : 'banner',
          recordId: String(b._id),
          recordTitle: title,
          bannerType: type,
          platform,
          slot: 'image',
          usageLocation: `${type.toUpperCase()} · ${platform === 'mobile' ? 'App' : 'Web'}`,
          isUsed: b.status === 'active',
          status: b.status,
        });
      }
      (b.collectionImages || []).forEach((img, idx) => {
        if (!img?.url) return;
        items.push({
          id: `${b._id}:coll:${idx}`,
          url: img.url,
          key: img.key || '',
          name: `${title} - Tile ${idx + 1}`,
          mediaType: 'image',
          variant: 'desktop',
          module: 'banner',
          filterType: 'collection',
          recordId: String(b._id),
          recordTitle: title,
          bannerType: type,
          platform,
          slot: `collection:${img._id || idx}`,
          usageLocation: `Collection Banner · Tile ${idx + 1}`,
          isUsed: b.status === 'active',
          status: b.status,
        });
      });
    });

    (availableFeatured || []).forEach((f) => {
      if (f.image?.url) {
        const placement = f.placement || 'Celebrate';
        items.push({
          id: `${f._id}:feat`,
          url: f.image.url,
          key: f.image.key || '',
          name: f.name || `${placement} Item`,
          mediaType: 'image',
          variant: 'universal',
          module: 'featured',
          filterType: 'celebrate_gifts',
          recordId: String(f._id),
          recordTitle: f.name || placement,
          placement,
          slot: 'image',
          usageLocation: `${placement} Showcase · ${f.name}`,
          isUsed: f.status === 'active',
          status: f.status,
        });
      }
    });

    (categories || []).forEach((c) => {
      if (c.icon?.url) {
        items.push({
          id: `${c._id}:icon`,
          url: c.icon.url,
          key: c.icon.key || '',
          name: `${c.name || 'Category'} Icon`,
          mediaType: 'image',
          variant: 'universal',
          module: 'category',
          filterType: 'category_icons',
          recordId: String(c._id),
          recordTitle: c.name || 'Category',
          slot: 'icon',
          usageLocation: `Category Icon · ${c.name}`,
          isUsed: true,
          status: 'active',
        });
      }
    });

    setMediaItems(items);
    setCounts({
      all: items.length,
      hero: items.filter((i) => i.filterType === 'hero').length,
      collection: items.filter((i) => i.filterType === 'collection').length,
      category: items.filter((i) => i.filterType === 'category').length,
      app: items.filter((i) => i.filterType === 'app').length,
      celebrate_gifts: items.filter((i) => i.filterType === 'celebrate_gifts').length,
      category_icons: items.filter((i) => i.filterType === 'category_icons').length,
      unused: items.filter((i) => !i.isUsed).length,
    });
  };

  useEffect(() => {
    fetchMedia();
  }, [themeId]);

  // Filtered Media
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'unused'
          ? !item.isUsed
          : item.filterType === activeFilter;

      const matchesSearch =
        !search ||
        `${item.name} ${item.recordTitle} ${item.usageLocation} ${item.recordId}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [mediaItems, activeFilter, search]);

  // Handle Uploading a new media file to R2
  const handleUploadNewMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please upload an image or video file.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      const res = await uploadWithPresignedUrl(file, 'website-themes', (p) => setUploadProgress(p));
      toast.success(`Media uploaded successfully: ${file.name}`);

      // Add to media items as unassigned / new asset
      const newItem = {
        id: `upload-${Date.now()}`,
        url: res.fileUrl,
        key: res.key,
        name: file.name,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        variant: 'universal',
        module: 'themeAsset',
        filterType: 'unused',
        recordId: '',
        recordTitle: 'Uploaded Asset',
        slot: '',
        usageLocation: 'Unassigned / Media Library',
        isUsed: false,
        status: 'active',
      };

      setMediaItems((prev) => [newItem, ...prev]);
      setCounts((prev) => ({ ...prev, all: prev.all + 1, unused: prev.unused + 1 }));
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload media file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Replacing an existing media item in its record
  const handleReplaceMediaSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingItem) return;

    try {
      setUploading(true);
      const folder = replacingItem.module === 'banner' ? 'banners' : replacingItem.module === 'featured' ? 'featured' : 'website-themes';
      const res = await uploadWithPresignedUrl(file, folder);

      // If item belongs to a banner, update existing banner
      if (replacingItem.module === 'banner' && replacingItem.recordId) {
        if (replacingItem.slot.startsWith('collection:')) {
          const banner = availableBanners.find((b) => String(b._id) === String(replacingItem.recordId));
          const idx = parseInt(replacingItem.slot.split(':')[1], 10);
          const nextImgs = [...(banner?.collectionImages || [])];
          if (nextImgs[idx]) {
            nextImgs[idx] = { ...nextImgs[idx], url: res.fileUrl, key: res.key };
          } else {
            nextImgs.push({ url: res.fileUrl, key: res.key });
          }
          await bannersAPI.update(replacingItem.recordId, { collectionImages: nextImgs });
        } else {
          await bannersAPI.update(replacingItem.recordId, { image: { url: res.fileUrl, key: res.key } });
        }
      } else if (replacingItem.module === 'featured' && replacingItem.recordId) {
        await featuredAPI.update(replacingItem.recordId, { image: { url: res.fileUrl, key: res.key } });
      }

      toast.success(`Media replaced successfully for ${replacingItem.name}`);
      await fetchMedia();
      onMediaChanged?.();
      setReplacingItem(null);
    } catch (err) {
      console.error('Failed to replace media:', err);
      toast.error('Failed to replace media.');
    } finally {
      setUploading(false);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Handle Removing media association
  const handleRemoveMedia = async (item) => {
    if (!window.confirm(`Are you sure you want to remove media "${item.name}" from ${item.usageLocation}?`)) {
      return;
    }

    try {
      if (item.module === 'banner' && item.recordId) {
        if (item.slot.startsWith('collection:')) {
          const banner = availableBanners.find((b) => String(b._id) === String(item.recordId));
          const idx = parseInt(item.slot.split(':')[1], 10);
          const nextImgs = (banner?.collectionImages || []).filter((_, i) => i !== idx);
          await bannersAPI.update(item.recordId, { collectionImages: nextImgs });
        } else {
          await bannersAPI.update(item.recordId, { image: { url: '', key: '' } });
        }
      } else if (item.module === 'featured' && item.recordId) {
        await featuredAPI.update(item.recordId, { image: { url: '', key: '' } });
      }

      toast.success(`Removed media from ${item.usageLocation}`);
      await fetchMedia();
      onMediaChanged?.();
    } catch (err) {
      console.error('Failed to remove media:', err);
      toast.error('Failed to remove media association.');
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All Media', count: counts.all },
    { key: 'hero', label: 'Hero Banners', count: counts.hero },
    { key: 'collection', label: 'Collection Banners', count: counts.collection },
    { key: 'category', label: 'Category Banners', count: counts.category },
    { key: 'app', label: 'App Banners', count: counts.app },
    { key: 'celebrate_gifts', label: 'Celebrate & Gifts', count: counts.celebrate_gifts },
    { key: 'category_icons', label: 'Category Icons', count: counts.category_icons },
    { key: 'unused', label: 'Unused Media', count: counts.unused },
  ];

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadNewMedia}
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceMediaSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Theme Media Library</h2>
          <p className="mt-1 text-xs text-stone-500">
            Discover, preview, replace, and link existing website media directly across theme sections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchMedia}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
          >
            <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#8b6c3a] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition disabled:opacity-50"
          >
            <HiOutlineUpload className="h-4 w-4" />
            {uploading ? `Uploading (${uploadProgress}%)…` : 'Upload Media'}
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="space-y-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeFilter === tab.key
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {tab.count || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, usage location or record ID…"
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-4 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15"
          />
          <HiOutlineSearch className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
        </div>
      </div>

      {/* Media Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center text-sm text-stone-500">
          Loading media assets…
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center">
          <HiOutlinePhotograph className="mx-auto h-10 w-10 text-stone-400" />
          <h3 className="mt-3 text-sm font-bold text-stone-800">No media found</h3>
          <p className="mt-1 text-xs text-stone-500">
            {search ? 'Try adjusting your search query.' : 'Upload or link media records to see them here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition hover:shadow-md hover:border-stone-300"
            >
              {/* Media Preview Box */}
              <div
                className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                {item.mediaType === 'video' ? (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {/* Badges on Thumbnail */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.isUsed ? 'bg-emerald-600 text-white' : 'bg-stone-700/80 text-white'
                    }`}
                  >
                    {item.isUsed ? 'In Use' : 'Unused'}
                  </span>
                  {item.variant && item.variant !== 'universal' && (
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-xs">
                      {item.variant}
                    </span>
                  )}
                </div>

                {/* Hover overlay preview button */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-md flex items-center gap-1.5">
                    <HiOutlineEye className="h-3.5 w-3.5" />
                    Preview
                  </span>
                </div>
              </div>

              {/* Card Meta Body */}
              <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1" title={item.name}>
                    {item.name}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-medium text-[#8b6c3a] line-clamp-1">
                    {item.usageLocation}
                  </p>
                  {item.recordId && (
                    <p className="text-[10px] text-stone-400 font-mono truncate mt-0.5">
                      ID: {item.recordId}
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingItem(item);
                      replaceInputRef.current?.click();
                    }}
                    className="flex-1 rounded-lg border border-stone-200 bg-white py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 transition"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-50"
                    title="View Full Size"
                  >
                    <HiOutlineEye className="h-3.5 w-3.5" />
                  </button>
                  {item.recordId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(item)}
                      className="rounded-lg border border-rose-100 p-1.5 text-rose-600 hover:bg-rose-50"
                      title="Remove from section"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-4 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">{previewItem.name}</h3>
                <p className="text-xs text-stone-500">{previewItem.usageLocation}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto max-h-[70vh] flex items-center justify-center bg-stone-950/5 rounded-xl p-2">
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-100">
              <span className="font-mono break-all">{previewItem.url}</span>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#8b6c3a] hover:underline shrink-0"
              >
                Open in new tab <HiOutlineExternalLink />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
