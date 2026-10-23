import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineChevronRight,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineCash,
  HiOutlineRefresh,
  HiOutlinePhotograph,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  DEFAULT_UPLOAD_COMPRESSION_SETTINGS,
  setUploadCompressionSettings,
  uploadWithPresignedUrl,
} from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import ImageCompressionDemo from '../../components/common/ImageCompressionDemo';

export default function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active modal: null | 'logos' | 'compression' | 'trust' | 'business' | 'monetary'
  const [activeModal, setActiveModal] = useState(null);

  // Trust Badges state
  const [trustBadges, setTrustBadges] = useState([]);
  const [savingTrustBadges, setSavingTrustBadges] = useState(false);
  const [uploadingBadgeIndex, setUploadingBadgeIndex] = useState(null);

  // Image Compression state
  const [imageCompression, setImageCompression] = useState(DEFAULT_UPLOAD_COMPRESSION_SETTINGS);
  const [savingCompression, setSavingCompression] = useState(false);

  // Business & Identity Form
  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    emailAddress: '',
    mobileNumber: '',
    storeAddress: '',
    gstCode: '',
    panCode: '',
    returnPeriodDays: '',
    returnPolicy: '',
    shippingPolicy: '',
    certificateImageUrl: '',
  });

  // Monetary Settlement Form
  const [monetaryForm, setMonetaryForm] = useState({
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
  });

  const [showAccountRaw, setShowAccountRaw] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingMonetary, setSavingMonetary] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const mobileLogoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMobileLogo, setUploadingMobileLogo] = useState(false);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const data = res.data?.data || {};
      setSettings(data);
      setTrustBadges(Array.isArray(data.trustBadges) ? data.trustBadges : []);
      const compressionSettings = { ...DEFAULT_UPLOAD_COMPRESSION_SETTINGS, ...(data.mediaCompression || {}) };
      setImageCompression(compressionSettings);
      setUploadCompressionSettings(compressionSettings);

      setBusinessForm({
        companyName: data.companyName ?? '',
        emailAddress: data.emailAddress ?? '',
        mobileNumber: data.mobileNumber ?? '',
        storeAddress: data.storeAddress ?? '',
        gstCode: data.gstCode ?? '',
        panCode: data.panCode ?? '',
        returnPeriodDays: data.returnPeriodDays ?? '',
        returnPolicy: data.returnPolicy ?? '',
        shippingPolicy: data.shippingPolicy ?? '',
        certificateImageUrl: data.certificateImage?.url ?? '',
      });

      setMonetaryForm({
        bankName: data.bankName ?? '',
        bankAccountNumber: data.bankAccountNumber ?? '',
        ifscCode: data.ifscCode ?? '',
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeModal]);

  const closeModal = () => {
    // Reset forms to saved settings on cancel
    if (settings) {
      setBusinessForm({
        companyName: settings.companyName ?? '',
        emailAddress: settings.emailAddress ?? '',
        mobileNumber: settings.mobileNumber ?? '',
        storeAddress: settings.storeAddress ?? '',
        gstCode: settings.gstCode ?? '',
        panCode: settings.panCode ?? '',
        returnPeriodDays: settings.returnPeriodDays ?? '',
        returnPolicy: settings.returnPolicy ?? '',
        shippingPolicy: settings.shippingPolicy ?? '',
        certificateImageUrl: settings.certificateImage?.url ?? '',
      });
      setMonetaryForm({
        bankName: settings.bankName ?? '',
        bankAccountNumber: settings.bankAccountNumber ?? '',
        ifscCode: settings.ifscCode ?? '',
      });
      setTrustBadges(Array.isArray(settings.trustBadges) ? settings.trustBadges : []);
      setImageCompression({ ...DEFAULT_UPLOAD_COMPRESSION_SETTINGS, ...(settings.mediaCompression || {}) });
    }
    setActiveModal(null);
  };

  // Upload Logo handler
  const handleLogoUpload = async (event, isMobile = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      event.target.value = '';
      return;
    }
    const setter = isMobile ? setUploadingMobileLogo : setUploadingLogo;
    const ref = isMobile ? mobileLogoInputRef : logoInputRef;
    const field = isMobile ? 'mobileLogoImage' : 'logoImage';
    try {
      setter(true);
      const { fileUrl, key } = await uploadWithPresignedUrl(file, 'brand-logos');
      const current = settings?.[field] || {};
      const response = await api.put('/settings', {
        [field]: { url: fileUrl, key: key || current.key || '' },
      });
      setSettings(response.data?.data || { ...settings, [field]: { url: fileUrl, key: key } });
      toast.success(`${isMobile ? 'Mobile' : 'Website'} logo saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Logo upload failed');
    } finally {
      setter(false);
      if (ref.current) ref.current.value = '';
    }
  };

  // Upload Certificate handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const { fileUrl } = await uploadWithPresignedUrl(file, 'certificates');
      if (fileUrl) {
        setBusinessForm((prev) => ({ ...prev, certificateImageUrl: fileUrl }));
        toast.success('Certificate uploaded successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload Trust Badge handler
  const handleTrustBadgeImageUpload = async (event, index) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBadgeIndex(index);
      const { fileUrl, key } = await uploadWithPresignedUrl(file, 'trust-badges');
      setTrustBadges((prev) =>
        prev.map((badge, badgeIndex) =>
          badgeIndex === index
            ? { ...badge, image: { url: fileUrl, key: key || badge.image?.key || '' } }
            : badge
        )
      );
      toast.success('Trust badge image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingBadgeIndex(null);
      event.target.value = '';
    }
  };

  // Save Trust Badges
  const handleSaveTrustBadges = async () => {
    try {
      setSavingTrustBadges(true);
      const payload = {
        trustBadges: trustBadges.map((badge, index) => ({
          title: (badge.title || '').trim(),
          image: { url: badge.image?.url || '', key: badge.image?.key || '' },
          order: index + 1,
        })),
      };
      const response = await api.put('/settings', payload);
      const data = response.data?.data || { ...settings, ...payload };
      setSettings(data);
      setTrustBadges(data.trustBadges || payload.trustBadges);
      setActiveModal(null);
      toast.success('Trust strip settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save trust strip settings');
    } finally {
      setSavingTrustBadges(false);
    }
  };

  // Save Image Compression
  const handleSaveImageCompression = async () => {
    const payload = {
      mediaCompression: {
        enabled: Boolean(imageCompression.enabled),
        quality: Number(imageCompression.quality),
        maxDimension: Number(imageCompression.maxDimension),
        format: imageCompression.format === 'image/jpeg' ? 'image/jpeg' : 'image/webp',
      },
    };

    try {
      setSavingCompression(true);
      const response = await api.put('/settings', payload);
      const data = response.data?.data || { ...settings, ...payload };
      const savedCompression = { ...DEFAULT_UPLOAD_COMPRESSION_SETTINGS, ...(data.mediaCompression || payload.mediaCompression) };
      setSettings(data);
      setImageCompression(savedCompression);
      setUploadCompressionSettings(savedCompression);
      setActiveModal(null);
      toast.success('Global image compression settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save image compression settings');
    } finally {
      setSavingCompression(false);
    }
  };

  // Save Business & Identity
  const handleSaveBusiness = async () => {
    try {
      setSavingBusiness(true);
      const payload = {
        companyName: businessForm.companyName,
        emailAddress: businessForm.emailAddress,
        mobileNumber: businessForm.mobileNumber,
        storeAddress: businessForm.storeAddress,
        gstCode: businessForm.gstCode,
        panCode: businessForm.panCode,
        returnPeriodDays: businessForm.returnPeriodDays === '' ? undefined : Number(businessForm.returnPeriodDays),
        returnPolicy: businessForm.returnPolicy,
        shippingPolicy: businessForm.shippingPolicy,
        certificateImage: {
          url: businessForm.certificateImageUrl,
        },
      };

      const res = await api.put('/settings', payload);
      setSettings(res.data?.data || payload);
      toast.success('Business configuration updated successfully');
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingBusiness(false);
    }
  };

  // Save Monetary Settlement
  const handleSaveMonetary = async () => {
    try {
      setSavingMonetary(true);
      const payload = {
        bankName: monetaryForm.bankName,
        bankAccountNumber: monetaryForm.bankAccountNumber,
        ifscCode: monetaryForm.ifscCode,
      };

      const res = await api.put('/settings', payload);
      setSettings(res.data?.data || payload);
      toast.success('Monetary settlement details updated');
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingMonetary(false);
    }
  };

  // Quick stat cards
  const statCardsData = [
    {
      label: 'Business Entity',
      value: businessForm.companyName || 'Not configured',
      icon: HiOutlineOfficeBuilding,
      color: 'bronze',
    },
    {
      label: 'Settlement Bank',
      value: monetaryForm.bankName || 'HDFC Bank',
      icon: HiOutlineCash,
      color: 'green',
    },
    {
      label: 'Return Period',
      value: businessForm.returnPeriodDays !== '' ? `${businessForm.returnPeriodDays} Days` : 'Not configured',
      icon: HiOutlineRefresh,
      color: 'peach',
    },
    {
      label: 'System Status',
      value: 'Operational',
      icon: HiOutlineCheck,
      color: 'gold',
    },
  ];

  // The 5 Setting Boxes
  const settingBoxes = [
    {
      id: 'logos',
      title: 'Website Logos',
      subtitle: 'Manage your desktop and mobile brand logos and storefront icons.',
      icon: HiOutlinePhotograph,
      badgeText: settings?.logoImage?.url ? 'Desktop & Mobile logos active' : 'Tap to configure logos',
      hasPreview: Boolean(settings?.logoImage?.url),
      logoUrl: settings?.logoImage?.url,
    },
    {
      id: 'compression',
      title: 'Global Image Compression',
      subtitle: 'Optimize product images automatically with WebP and quality presets.',
      icon: HiOutlineSparkles,
      badgeText: `${imageCompression.enabled ? 'Automatic' : 'Manual'} · ${
        imageCompression.format === 'image/webp' ? 'WebP' : 'JPEG'
      } · ${imageCompression.quality}% quality`,
      hasPreview: false,
    },
    {
      id: 'trust',
      title: 'Trust Strip',
      subtitle: 'Storefront assurance badges, authenticity stamps, and guarantees.',
      icon: HiOutlineShieldCheck,
      badgeText: `${trustBadges.length} assurance badges configured`,
      hasPreview: false,
    },
    {
      id: 'business',
      title: 'Business & Identity',
      subtitle: 'Store legal details, registered address, GST, PAN, and customer policies.',
      icon: HiOutlineOfficeBuilding,
      badgeText: `${businessForm.companyName || 'Neirah Jewellers'} · ${
        businessForm.gstCode ? `GST: ${businessForm.gstCode}` : 'Identity active'
      }`,
      hasPreview: false,
    },
    {
      id: 'monetary',
      title: 'Monetary Settlement',
      subtitle: 'Bank accounts, settlement routing, and payout credentials.',
      icon: HiOutlineCash,
      badgeText: `${monetaryForm.bankName || 'HDFC Bank'} · ${
        monetaryForm.bankAccountNumber
          ? `•••• ${monetaryForm.bankAccountNumber.slice(-4)}`
          : 'Bank details linked'
      }`,
      hasPreview: false,
    },
  ];

  const filteredBoxes = settingBoxes.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* ─── Module Header (Breadcrumbs, Title, Search) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-stone-200/80">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
            <span>Home</span>
            <HiOutlineChevronRight className="w-3 h-3 text-stone-300" />
            <span className="text-stone-800 font-medium">Settings</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Manage your store configuration in one place.
          </p>
        </div>

        {/* Search settings input */}
        <div className="relative w-full sm:w-72">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Quick Stat Cards ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Setting Boxes Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredBoxes.map((box) => {
          const Icon = box.icon;
          return (
            <div
              key={box.id}
              onClick={() => setActiveModal(box.id)}
              className="group relative flex flex-col justify-between rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-[#8f6d43]/60 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div>
                {/* Top Row: Icon + Right Chevron */}
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf6f0] border border-[#ebdcc8]/80 text-[#8f6d43] group-hover:bg-[#8f6d43] group-hover:text-white transition-colors duration-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-stone-300 group-hover:text-[#8f6d43] group-hover:translate-x-0.5 transition-all duration-200">
                    <HiOutlineChevronRight className="h-4 w-4" />
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="mt-3 text-sm font-bold text-stone-900 group-hover:text-[#8f6d43] transition-colors">
                  {box.title}
                </h3>
                <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                  {box.subtitle}
                </p>
              </div>

              {/* Bottom Row: Status Badge or Thumbnail */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                {box.hasPreview && box.logoUrl ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={getMediaUrl(box.logoUrl)}
                      alt="Logo thumbnail"
                      className="h-6 max-w-[80px] object-contain rounded bg-stone-50 px-1 border border-stone-100"
                    />
                    <span className="text-[11px] font-semibold text-stone-600 truncate">
                      {box.badgeText}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-[#faf6f0] border border-[#ebdcc8]/60 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                    {box.badgeText}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8f6d43] opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBoxes.length === 0 && (
        <div className="py-12 text-center rounded-xl border border-dashed border-stone-200 bg-white">
          <p className="text-sm font-medium text-stone-500">No settings matched your search "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-semibold text-[#8f6d43] hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* ─── POP-UP MODAL ─── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={`relative flex flex-col w-full my-auto rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden transition-all duration-200 ${
              activeModal === 'compression'
                ? 'max-w-4xl'
                : activeModal === 'business'
                ? 'max-w-3xl'
                : 'max-w-2xl'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-[#fdfcfb]">
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  {activeModal === 'logos' && 'Website Logos'}
                  {activeModal === 'compression' && 'Global Image Compression'}
                  {activeModal === 'trust' && 'Trust Strip Configuration'}
                  {activeModal === 'business' && 'Business & Identity'}
                  {activeModal === 'monetary' && 'Monetary Settlement Details'}
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  {activeModal === 'logos' && 'Manage your desktop and mobile brand logos.'}
                  {activeModal === 'compression' && 'Set automatic image optimization and quality presets.'}
                  {activeModal === 'trust' && 'Manage trust badges shown in the storefront assurance strip.'}
                  {activeModal === 'business' && 'Store name, credentials, address, and policies.'}
                  {activeModal === 'monetary' && 'Bank settlement details and payout credentials.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                title="Close modal"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-4">
              {/* 1. Website Logos Modal */}
              {activeModal === 'logos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Desktop logo',
                        field: 'logoImage',
                        inputRef: logoInputRef,
                        busy: uploadingLogo,
                        mobile: false,
                        desc: 'Main brand logo displayed on desktop headers.',
                      },
                      {
                        label: 'Mobile logo (optional)',
                        field: 'mobileLogoImage',
                        inputRef: mobileLogoInputRef,
                        busy: uploadingMobileLogo,
                        mobile: true,
                        desc: 'Optimized emblem for smaller mobile screens.',
                      },
                    ].map(({ label, field, inputRef, busy, mobile, desc }) => (
                      <div key={field} className="rounded-xl border border-stone-200 bg-[#fbfaf8] p-4 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-stone-800">{label}</p>
                          <p className="mt-0.5 text-[11px] text-stone-500">{desc}</p>
                        </div>
                        <input
                          ref={inputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(event) => handleLogoUpload(event, mobile)}
                          className="sr-only"
                        />
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          disabled={busy}
                          className="mt-3 min-h-28 w-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d8c8b2] bg-white p-3 hover:border-[#8f6d43] hover:bg-[#faf5ee] disabled:opacity-60 transition-all focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30"
                        >
                          {settings?.[field]?.url ? (
                            <img
                              src={getMediaUrl(settings[field].url)}
                              alt={`${label} preview`}
                              className="max-h-16 max-w-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf6f0] text-[#8f6d43] mb-1.5">
                                <HiOutlinePhotograph className="h-5 w-5" />
                              </span>
                              <span className="text-xs font-semibold text-stone-700">Choose image</span>
                              <span className="text-[10px] text-stone-400 mt-0.5">or drag and drop</span>
                            </div>
                          )}
                        </button>
                        <p className="mt-2 text-center text-[10px] text-stone-400">
                          {busy ? 'Saving logo…' : 'PNG, JPG, WebP or SVG'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Global Image Compression Modal */}
              {activeModal === 'compression' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="flex min-h-16 items-center justify-between rounded-xl border border-stone-200 bg-[#fbfaf8] p-3 cursor-pointer">
                      <span>
                        <span className="block text-xs font-bold text-stone-800">Automatic compression</span>
                        <span className="block text-[10px] text-stone-500">Compress image uploads by default</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={imageCompression.enabled}
                        onChange={(event) =>
                          setImageCompression((prev) => ({ ...prev, enabled: event.target.checked }))
                        }
                        className="h-4 w-4 accent-[#8f6d43]"
                      />
                    </label>

                    <label className="rounded-xl border border-stone-200 bg-[#fbfaf8] p-3">
                      <span className="flex items-center justify-between text-xs font-bold text-stone-800">
                        Image quality <span className="text-[#8f6d43]">{imageCompression.quality}%</span>
                      </span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="1"
                        value={imageCompression.quality}
                        onChange={(event) =>
                          setImageCompression((prev) => ({ ...prev, quality: Number(event.target.value) }))
                        }
                        disabled={!imageCompression.enabled}
                        className="mt-2.5 w-full accent-[#8f6d43] disabled:opacity-50"
                      />
                      <span className="mt-1 flex justify-between text-[10px] text-stone-400">
                        <span>Smaller files (60%)</span>
                        <span>Higher detail (95%)</span>
                      </span>
                    </label>

                    <label className="rounded-xl border border-stone-200 bg-[#fbfaf8] p-3">
                      <span className="block text-xs font-bold text-stone-800">Output format</span>
                      <select
                        value={imageCompression.format}
                        onChange={(event) =>
                          setImageCompression((prev) => ({ ...prev, format: event.target.value }))
                        }
                        disabled={!imageCompression.enabled}
                        className="mt-2 h-9 w-full rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20"
                      >
                        <option value="image/webp">WebP (recommended)</option>
                        <option value="image/jpeg">JPEG</option>
                      </select>
                    </label>
                  </div>

                  {/* Side-by-Side Live Demo Image Preview */}
                  <ImageCompressionDemo
                    quality={imageCompression.quality}
                    format={imageCompression.format}
                    enabled={imageCompression.enabled}
                    onQualityChange={(newQuality) =>
                      setImageCompression((prev) => ({ ...prev, quality: newQuality }))
                    }
                  />
                </div>
              )}

              {/* 3. Trust Strip Modal */}
              {activeModal === 'trust' && (
                <div className="space-y-3">
                  {trustBadges.map((badge, index) => (
                    <div
                      key={badge._id || index}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200 bg-[#fbfaf8] p-3 sm:grid-cols-[1fr_200px_auto] sm:items-end"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-bold text-stone-800">Badge Text</label>
                        <input
                          value={badge.title || ''}
                          onChange={(event) =>
                            setTrustBadges((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, title: event.target.value } : item
                              )
                            )
                          }
                          placeholder="e.g. 100% Certified Jewellery"
                          className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-stone-800">Icon / Stamp</label>
                        <div className="flex items-center gap-1.5">
                          <label className="flex h-9 flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-[#d8c8b2] bg-white px-2 text-xs cursor-pointer hover:border-[#8f6d43]">
                            {badge.image?.url ? (
                              <img
                                src={getMediaUrl(badge.image.url)}
                                alt=""
                                className="h-6 w-6 object-contain"
                              />
                            ) : (
                              <HiOutlineUpload className="h-4 w-4 text-stone-400" />
                            )}
                            <span className="truncate text-stone-600">
                              {uploadingBadgeIndex === index
                                ? 'Uploading…'
                                : badge.image?.url
                                ? 'Change'
                                : 'Upload'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              disabled={uploadingBadgeIndex !== null}
                              onChange={(event) => handleTrustBadgeImageUpload(event, index)}
                            />
                          </label>
                          {badge.image?.url && (
                            <button
                              type="button"
                              title="Clear image"
                              onClick={() =>
                                setTrustBadges((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, image: { url: '', key: '' } } : item
                                  )
                                )
                              }
                              className="h-9 px-2 rounded-lg border border-stone-200 bg-white text-xs text-stone-400 hover:text-red-600 hover:border-red-200"
                            >
                              <HiOutlineX className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setTrustBadges((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                        }
                        className="h-9 px-3 rounded-lg border border-stone-200 text-xs font-semibold text-stone-500 hover:border-red-200 hover:text-red-600 bg-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {!trustBadges.length && (
                    <p className="py-6 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      No trust badges added yet.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setTrustBadges((prev) => [...prev, { title: '', image: { url: '', key: '' } }])
                    }
                    className="w-full h-10 rounded-xl border border-dashed border-[#8f6d43]/50 bg-[#faf6f0]/50 text-xs font-semibold text-[#8f6d43] hover:bg-[#faf6f0] transition-colors"
                  >
                    + Add New Trust Badge
                  </button>
                </div>
              )}

              {/* 4. Business & Identity Modal */}
              {activeModal === 'business' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessForm.companyName}
                        onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={businessForm.emailAddress}
                        onChange={(e) => setBusinessForm({ ...businessForm, emailAddress: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Mobile Number
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs select-none pointer-events-none">
                          🇮🇳
                        </span>
                        <input
                          type="text"
                          value={businessForm.mobileNumber}
                          onChange={(e) => setBusinessForm({ ...businessForm, mobileNumber: e.target.value })}
                          className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Store Address
                      </label>
                      <input
                        type="text"
                        value={businessForm.storeAddress}
                        onChange={(e) => setBusinessForm({ ...businessForm, storeAddress: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">GST Code</label>
                      <input
                        type="text"
                        value={businessForm.gstCode}
                        onChange={(e) => setBusinessForm({ ...businessForm, gstCode: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">PAN Code</label>
                      <input
                        type="text"
                        value={businessForm.panCode}
                        onChange={(e) => setBusinessForm({ ...businessForm, panCode: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Return Period (Days)
                      </label>
                      <input
                        type="number"
                        value={businessForm.returnPeriodDays}
                        onChange={(e) => setBusinessForm({ ...businessForm, returnPeriodDays: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Return Policy Summary
                      </label>
                      <input
                        type="text"
                        value={businessForm.returnPolicy}
                        onChange={(e) => setBusinessForm({ ...businessForm, returnPolicy: e.target.value })}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                    </div>
                  </div>

                  {/* Shipping Policy */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">Shipping Policy</label>
                    <textarea
                      rows={3}
                      placeholder="Describe your standard shipping and delivery timelines..."
                      value={businessForm.shippingPolicy}
                      onChange={(e) => setBusinessForm({ ...businessForm, shippingPolicy: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] resize-none"
                    />
                  </div>

                  {/* Certificate of Authenticity */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      Certificate of Authenticity Image
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-16 rounded-xl border border-dashed border-stone-300 hover:border-[#8f6d43] hover:bg-[#faf5ee] bg-[#fafaf8] flex items-center justify-center p-3 cursor-pointer transition-all"
                    >
                      {businessForm.certificateImageUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={businessForm.certificateImageUrl}
                            alt="Certificate"
                            className="h-10 w-10 object-cover rounded-lg border border-stone-200"
                          />
                          <div className="text-left">
                            <p className="text-xs font-bold text-stone-800">Certificate attached</p>
                            <p className="text-[10px] text-stone-400">Click to replace certificate image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-stone-500">
                          <HiOutlineUpload className="h-4 w-4 text-[#8f6d43]" />
                          <span className="text-xs font-medium">
                            {uploadingImage ? 'Uploading…' : 'Upload authenticity stamp (PNG, JPG, WebP)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Monetary Settlement Modal */}
              {activeModal === 'monetary' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={monetaryForm.bankName}
                      onChange={(e) => setMonetaryForm({ ...monetaryForm, bankName: e.target.value })}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      Bank Account Number
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showAccountRaw ? 'text' : 'password'}
                        placeholder="Enter full account number"
                        value={monetaryForm.bankAccountNumber}
                        onChange={(e) =>
                          setMonetaryForm({ ...monetaryForm, bankAccountNumber: e.target.value })
                        }
                        className="w-full h-9 pl-3 pr-9 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountRaw(!showAccountRaw)}
                        className="absolute right-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                        title={showAccountRaw ? 'Hide account number' : 'Show account number'}
                      >
                        {showAccountRaw ? (
                          <HiOutlineEyeOff className="w-4 h-4" />
                        ) : (
                          <HiOutlineEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={monetaryForm.ifscCode}
                      onChange={(e) => setMonetaryForm({ ...monetaryForm, ifscCode: e.target.value })}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-stone-100 bg-stone-50/70">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                {activeModal === 'logos' ? 'Close' : 'Cancel'}
              </button>

              {activeModal === 'compression' && (
                <button
                  type="button"
                  onClick={handleSaveImageCompression}
                  disabled={savingCompression}
                  className="rounded-lg bg-[#8f6d43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#7a5c36] disabled:opacity-50 transition-colors"
                >
                  {savingCompression ? 'Saving…' : 'Save Changes'}
                </button>
              )}

              {activeModal === 'trust' && (
                <button
                  type="button"
                  onClick={handleSaveTrustBadges}
                  disabled={savingTrustBadges}
                  className="rounded-lg bg-[#8f6d43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#7a5c36] disabled:opacity-50 transition-colors"
                >
                  {savingTrustBadges ? 'Saving…' : 'Save Changes'}
                </button>
              )}

              {activeModal === 'business' && (
                <button
                  type="button"
                  onClick={handleSaveBusiness}
                  disabled={savingBusiness}
                  className="rounded-lg bg-[#8f6d43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#7a5c36] disabled:opacity-50 transition-colors"
                >
                  {savingBusiness ? 'Saving…' : 'Save Changes'}
                </button>
              )}

              {activeModal === 'monetary' && (
                <button
                  type="button"
                  onClick={handleSaveMonetary}
                  disabled={savingMonetary}
                  className="rounded-lg bg-[#8f6d43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#7a5c36] disabled:opacity-50 transition-colors"
                >
                  {savingMonetary ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <div className="pt-4 pb-2 text-center">
        <p className="text-[9px] tracking-[0.2em] text-stone-400 uppercase font-semibold">
          NEIRAH JEWELLERS GLOBAL ADMIN V1.0.25
        </p>
      </div>
    </div>
  );
}
