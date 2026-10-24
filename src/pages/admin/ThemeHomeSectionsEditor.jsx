import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineChevronRight,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineUpload,
  HiOutlineSparkles,
  HiOutlineViewGrid,
  HiOutlineDeviceMobile,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineColorSwatch,
  HiOutlineCheck,
  HiOutlineDotsVertical,
  HiOutlineEye,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { IoDiamondOutline, IoCubeOutline, IoLayersOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { bannersAPI, featuredAPI } from '../../api/services';
import { uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';

const SECTION_TYPE_META = {
  hero: { title: 'Hero Banner', subtitle: 'Main slider banner at the top of homepage.', typeLabel: 'Hero Banner', icon: HiOutlinePhotograph },
  categories: { title: 'Category Banner', subtitle: 'Curated category tiles and icons.', typeLabel: 'Category Banner', icon: HiOutlineTag },
  products: { title: 'Product Showcase', subtitle: 'Featured jewelry products carousel.', typeLabel: 'Product Slider', icon: IoDiamondOutline },
  celebrate: { title: 'Celebrate & Gifts', subtitle: 'Celebration collections and seasonal gifting showcase.', typeLabel: 'Celebrate & Gifts', icon: HiOutlineSparkles },
  collections: { title: 'Collection Banner', subtitle: '4-tile editorial collection showcase.', typeLabel: 'Collection Banner', icon: HiOutlineViewGrid },
  trustBadges: { title: 'Feature Icons', subtitle: 'Trust & heritage assurances (BIS, Shipping, Lifetime).', typeLabel: 'Feature Section', icon: HiOutlineSparkles },
  customBanner: { title: 'Customize Banner', subtitle: 'Bespoke atelier / spotlight jewellery promo.', typeLabel: 'Custom Banner', icon: HiOutlineColorSwatch },
  mobileApp: { title: 'App Banner', subtitle: 'Mobile application download promotion banner.', typeLabel: 'App Banner', icon: HiOutlineDeviceMobile },
  appointment: { title: 'Appointment Banner', subtitle: 'Concierge & in-store consultation booking.', typeLabel: 'Appointment Banner', icon: HiOutlineCalendar },
  reviews: { title: 'Customer Reviews', subtitle: 'Client testimonials and verified ratings.', typeLabel: 'Customer Reviews', icon: HiOutlineSparkles },
  instagram: { title: 'Instagram Gallery', subtitle: 'Curated editorial social media stream.', typeLabel: 'Instagram Feed', icon: HiOutlinePhotograph },
};

export default function ThemeHomeSectionsEditor({
  themeConfig = {},
  updateThemeConfig,
  availableBanners = [],
  availableFeatured = [],
  categories = [],
  onBannerUpdated,
  onFeaturedUpdated,
  selectedSectionKey,
  setSelectedSectionKey,
}) {
  const sections = themeConfig.sections || [];
  const bannerSelections = themeConfig.bannerSelections || [];
  const featuredSelections = themeConfig.featuredSelections || [];

  // Active section in editor
  const activeKey = selectedSectionKey || sections[0]?.key || 'hero';
  const activeSection = sections.find((s) => s.key === activeKey) || { key: activeKey, visible: true, order: 1 };
  const sectionMeta = SECTION_TYPE_META[activeKey] || { title: activeKey, subtitle: 'Website section', typeLabel: 'Custom Section', icon: IoLayersOutline };

  // Form states for selected section
  const [activeBannerId, setActiveBannerId] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [buttonText, setButtonText] = useState('Shop Now');
  const [buttonLink, setButtonLink] = useState('/shop');
  const [statusActive, setStatusActive] = useState(true);
  const [desktopImageUrl, setDesktopImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [collectionImages, setCollectionImages] = useState([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const fileInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Add section modal
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  // Sync state whenever activeKey or banner changes
  useEffect(() => {
    // Find linked banner for activeKey
    let targetType = 'herobanner';
    if (activeKey === 'collections') targetType = 'collectionbanner';
    else if (activeKey === 'categories') targetType = 'categorybanner';
    else if (activeKey === 'mobileApp') targetType = 'mobileappbanner';
    else if (activeKey === 'appointment') targetType = 'bookappointbanner';
    else if (activeKey === 'customBanner') targetType = 'customizebanner';

    const selection = bannerSelections.find((s) => s.type === targetType && s.platform === (activeKey === 'mobileApp' ? 'mobile' : 'web'));
    const banner = availableBanners.find((b) => String(b._id) === String(selection?.bannerId?._id || selection?.bannerId));

    if (banner) {
      setActiveBannerId(String(banner._id));
      setSectionTitle(banner.content?.title || banner.title || '');
      setSectionSubtitle(banner.content?.subtitle || banner.subtitle || '');
      setSectionDesc(banner.content?.description || banner.description || '');
      setButtonText(banner.content?.buttonText || 'Shop Now');
      setButtonLink(banner.link || '/shop');
      setStatusActive(banner.status === 'active');
      setDesktopImageUrl(banner.image?.url || '');
      setMobileImageUrl(banner.mobileImage?.url || '');
      setCollectionImages(banner.collectionImages || []);
    } else {
      setActiveBannerId('');
      setSectionTitle('');
      setSectionSubtitle('');
      setSectionDesc('');
      setButtonText('Shop Now');
      setButtonLink('/shop');
      setStatusActive(true);
      setDesktopImageUrl('');
      setMobileImageUrl('');
      setCollectionImages([]);
    }
  }, [activeKey, availableBanners, bannerSelections]);

  // Section Reordering Helpers
  const moveSection = (index, direction) => {
    const nextSections = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextSections.length) return;

    const temp = nextSections[index];
    nextSections[index] = nextSections[targetIndex];
    nextSections[targetIndex] = temp;

    // Re-assign 1-based order
    const updated = nextSections.map((sec, i) => ({ ...sec, order: i + 1 }));
    updateThemeConfig((cfg) => ({ ...cfg, sections: updated }));
  };

  const toggleSectionVisibility = (key, e) => {
    e?.stopPropagation();
    const updated = sections.map((s) => (s.key === key ? { ...s, visible: s.visible === false } : s));
    updateThemeConfig((cfg) => ({ ...cfg, sections: updated }));
  };

  // Add Section to Theme
  const handleAddSection = (newKey) => {
    if (sections.some((s) => s.key === newKey)) {
      toast.error('This section is already added to the homepage.');
      return;
    }
    const newSection = { key: newKey, visible: true, order: sections.length + 1 };
    updateThemeConfig((cfg) => ({ ...cfg, sections: [...cfg.sections, newSection] }));
    setSelectedSectionKey(newKey);
    setIsAddSectionOpen(false);
    toast.success(`Added ${SECTION_TYPE_META[newKey]?.title || newKey} section`);
  };

  // Save Banner Content via Existing Banner ID API
  const handleSaveBanner = async () => {
    if (!activeBannerId) {
      toast.error('Please choose or connect an existing banner first.');
      return;
    }

    try {
      setSavingBanner(true);
      const payload = {
        content: {
          title: sectionTitle.trim(),
          subtitle: sectionSubtitle.trim(),
          description: sectionDesc.trim(),
          buttonText: buttonText.trim(),
        },
        link: buttonLink.trim(),
        status: statusActive ? 'active' : 'inactive',
      };

      if (desktopImageUrl) {
        payload.image = { url: desktopImageUrl };
      }
      if (mobileImageUrl) {
        payload.mobileImage = { url: mobileImageUrl };
      }
      if (collectionImages.length > 0) {
        payload.collectionImages = collectionImages;
      }

      await bannersAPI.update(activeBannerId, payload);
      toast.success('Banner updated successfully in database');
      onBannerUpdated?.();
    } catch (err) {
      console.error('Failed to update banner:', err);
      toast.error(err.response?.data?.message || 'Could not update banner record');
    } finally {
      setSavingBanner(false);
    }
  };

  // Upload Desktop Image
  const handleUploadDesktop = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadWithPresignedUrl(file, 'banners');
      setDesktopImageUrl(res.fileUrl);
      toast.success(`Image uploaded · ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)}`);

      // If banner exists, auto-save image
      if (activeBannerId) {
        await bannersAPI.update(activeBannerId, { image: { url: res.fileUrl, key: res.key } });
        onBannerUpdated?.();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload Mobile Image
  const handleUploadMobile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadWithPresignedUrl(file, 'banners');
      setMobileImageUrl(res.fileUrl);
      toast.success(`Mobile image uploaded · ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)}`);

      if (activeBannerId) {
        await bannersAPI.update(activeBannerId, { mobileImage: { url: res.fileUrl, key: res.key } });
        onBannerUpdated?.();
      }
    } catch (err) {
      console.error('Mobile upload failed:', err);
      toast.error('Failed to upload mobile image.');
    } finally {
      setUploading(false);
      if (mobileInputRef.current) mobileInputRef.current.value = '';
    }
  };

  // Get primary thumbnail for a section in the left panel
  const getSectionThumbnail = (secKey) => {
    if (secKey === 'hero') {
      const banner = availableBanners.find((b) => b.display?.type === 'herobanner' && b.image?.url);
      return banner?.image?.url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=150&q=80';
    }
    if (secKey === 'celebrate') {
      const feat = availableFeatured.find((f) => f.image?.url);
      return feat?.image?.url || 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=150&q=80';
    }
    if (secKey === 'collections') {
      const banner = availableBanners.find((b) => b.display?.type === 'collectionbanner');
      return banner?.collectionImages?.[0]?.url || banner?.image?.url || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=150&q=80';
    }
    if (secKey === 'products') {
      return 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=150&q=80';
    }
    if (secKey === 'mobileApp') {
      const banner = availableBanners.find((b) => b.display?.type === 'mobileappbanner');
      return banner?.image?.url || 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=150&q=80';
    }
    return '';
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Hidden file inputs */}
      <input type="file" ref={fileInputRef} onChange={handleUploadDesktop} accept="image/*" className="hidden" />
      <input type="file" ref={mobileInputRef} onChange={handleUploadMobile} accept="image/*" className="hidden" />

      {/* ─── LEFT PANEL: HOME PAGE SECTIONS ─── */}
      <aside className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">Home Page Sections</h3>
            <p className="text-xs text-stone-500">Order and enable sections for this theme</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddSectionOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6c3a] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Add Section
          </button>
        </div>

        {/* Section Cards List */}
        <div className="space-y-2.5">
          {sections.map((sec, index) => {
            const meta = SECTION_TYPE_META[sec.key] || { title: sec.key, typeLabel: 'Custom' };
            const isActive = sec.key === activeKey;
            const thumbUrl = getSectionThumbnail(sec.key);

            return (
              <div
                key={sec.key}
                onClick={() => setSelectedSectionKey(sec.key)}
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition cursor-pointer ${
                  isActive
                    ? 'border-[#8b6c3a] bg-[#faf6f0] shadow-xs ring-1 ring-[#8b6c3a]/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60'
                }`}
              >
                {/* Reorder arrows & drag dots */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5 text-stone-400">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(index, -1);
                      }}
                      className="p-0.5 hover:text-stone-700 disabled:opacity-20"
                      title="Move up"
                    >
                      <HiOutlineChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(index, 1);
                      }}
                      className="p-0.5 hover:text-stone-700 disabled:opacity-20"
                      title="Move down"
                    >
                      <HiOutlineChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={meta.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <HiOutlinePhotograph className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Title & Type */}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{meta.title}</h4>
                    <p className="text-[11px] text-stone-500">Type: {meta.typeLabel}</p>
                  </div>
                </div>

                {/* Right chevron and visibility */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleSectionVisibility(sec.key, e)}
                    className={`rounded-lg p-1.5 transition ${
                      sec.visible !== false ? 'text-[#8b6c3a] hover:bg-[#8b6c3a]/10' : 'text-stone-300 hover:text-stone-500'
                    }`}
                    title={sec.visible !== false ? 'Section Visible' : 'Section Hidden'}
                  >
                    <HiOutlineEye className="h-4 w-4" />
                  </button>
                  <HiOutlineChevronRight className={`h-4 w-4 transition ${isActive ? 'text-[#8b6c3a]' : 'text-stone-400'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─── RIGHT PANEL: SELECTED SECTION EDITOR ─── */}
      <main className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <h3 className="text-lg font-bold text-stone-900">{sectionMeta.title}</h3>
            <p className="mt-0.5 text-xs text-stone-500">{sectionMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {activeBannerId && (
              <button
                type="button"
                onClick={handleSaveBanner}
                disabled={savingBanner}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8b6c3a] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition disabled:opacity-50"
              >
                <HiOutlineCheck className="h-4 w-4" />
                {savingBanner ? 'Saving…' : 'Save Section'}
              </button>
            )}
          </div>
        </div>

        {/* Existing Banner Link Selector */}
        {activeKey !== 'celebrate' && activeKey !== 'products' && (
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">Connected Website Banner (by ID)</label>
              {activeBannerId && (
                <span className="text-[11px] font-mono text-stone-400">Record ID: {activeBannerId}</span>
              )}
            </div>
            <select
              value={activeBannerId}
              onChange={(e) => setActiveBannerId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#8b6c3a]"
            >
              <option value="">Choose an existing banner record…</option>
              {availableBanners.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.content?.title || b.title || 'Untitled Banner'} ({b.display?.type || 'herobanner'} · {b.display?.platform || 'web'}) — ID: {b._id.slice(-6)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Standard Banner Edit Form */}
        {activeKey !== 'celebrate' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left fields: Title, Subtitle, Description, CTA */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Diwali Special"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Subtitle (optional)</label>
                <input
                  type="text"
                  value={sectionSubtitle}
                  onChange={(e) => setSectionSubtitle(e.target.value)}
                  placeholder="e.g. Sparkle Brighter This Diwali"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  value={sectionDesc}
                  onChange={(e) => setSectionDesc(e.target.value)}
                  placeholder="e.g. Celebrate with timeless elegance."
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#8b6c3a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Button Link</label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="/collections/diwali"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#8b6c3a]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3">
                <span className="text-xs font-bold text-stone-700">Section Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusActive}
                    onChange={(e) => setStatusActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b6c3a]"></div>
                  <span className="ml-2 text-xs font-semibold text-stone-600">
                    {statusActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            {/* Right: Images and Media Upload */}
            <div className="space-y-4">
              {/* Banner Images (Desktop) */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">Banner Images (Desktop)</label>
                <div className="relative aspect-16/9 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 flex items-center justify-center">
                  {desktopImageUrl ? (
                    <>
                      <img src={desktopImageUrl} alt="Banner" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setDesktopImageUrl('')}
                        className="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white shadow-md hover:bg-red-700"
                        title="Remove image"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <HiOutlinePhotograph className="mx-auto h-8 w-8 text-stone-400" />
                      <p className="mt-1 text-xs text-stone-500">No desktop image selected</p>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip + Add image */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                  {desktopImageUrl && (
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-[#8b6c3a] shadow-xs shrink-0">
                      <img src={desktopImageUrl} alt="Slide 1" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-[#8b6c3a] hover:text-[#8b6c3a] transition"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    <span className="text-[10px] font-bold mt-0.5">Add</span>
                  </button>
                </div>
              </div>

              {/* Mobile Image (Optional) */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">Mobile Image (optional)</label>
                <div className="flex items-center gap-3">
                  {mobileImageUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-stone-200 shadow-xs">
                      <img src={mobileImageUrl} alt="Mobile preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMobileImageUrl('')}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <HiOutlineTrash className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                      <HiOutlineDeviceMobile className="h-5 w-5" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => mobileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    {mobileImageUrl ? 'Change' : 'Add Mobile Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Celebrate & Gifts Special Section Editor */}
        {activeKey === 'celebrate' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 leading-relaxed">
              Celebrate & Gifts showcases existing gift items and collections. Reorder or toggle showcases specifically for this theme without duplicating or deleting global records.
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableFeatured.map((item) => {
                const isSelected = featuredSelections.some(
                  (s) => String(s.featuredId?._id || s.featuredId) === String(item._id) && s.visible !== false
                );
                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        {item.image?.url ? (
                          <img src={item.image.url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <HiOutlineSparkles className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.name}</h4>
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          {item.placement || 'Celebrate'}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateThemeConfig((cfg) => {
                            const cur = [...(cfg.featuredSelections || [])];
                            const idx = cur.findIndex((s) => String(s.featuredId?._id || s.featuredId) === String(item._id));
                            if (checked) {
                              if (idx >= 0) cur[idx].visible = true;
                              else cur.push({ featuredId: item._id, placement: item.placement || 'Celebrate', order: cur.length + 1, visible: true });
                            } else {
                              if (idx >= 0) cur[idx].visible = false;
                            }
                            return { ...cfg, featuredSelections: cur };
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b6c3a]"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ─── ADD SECTION MODAL ─── */}
      {isAddSectionOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setIsAddSectionOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-stone-900">Add Homepage Section</h3>
            <p className="text-xs text-stone-500">
              Select a section to add to this theme’s homepage layout.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {Object.entries(SECTION_TYPE_META).map(([key, meta]) => {
                const alreadyAdded = sections.some((s) => s.key === key);
                const IconComponent = meta.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleAddSection(key)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 text-left transition hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{meta.title}</p>
                        <p className="text-[11px] text-stone-500 line-clamp-1">{meta.subtitle}</p>
                      </div>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-[10px] font-bold text-stone-400 uppercase">Added</span>
                    ) : (
                      <HiOutlinePlus className="h-4 w-4 text-[#8b6c3a]" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddSectionOpen(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
