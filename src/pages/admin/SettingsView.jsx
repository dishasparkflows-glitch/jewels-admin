import { createPortal } from "react-dom";
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
  HiOutlineColorSwatch,
  HiOutlineFire,
  HiOutlineShare,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaPinterestP,
  FaXTwitter,
  FaLinkedinIn,
  FaWhatsapp,
} from 'react-icons/fa6';
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

const LUXURY_BUTTON_PALETTES = [
  { name: 'Emerald Luxury', bg: '#1f3a2b', hover: '#162b20', text: '#ffffff' },
  { name: 'Warm Gold', bg: '#8b6f4e', hover: '#755c3e', text: '#ffffff' },
  { name: 'Champagne Ochre', bg: '#c58b32', hover: '#a87325', text: '#ffffff' },
  { name: 'Velvet Plum', bg: '#4a1525', hover: '#3b0e1b', text: '#ffffff' },
  { name: 'Midnight Onyx', bg: '#1a1a1a', hover: '#0d0d0d', text: '#ffffff' },
  { name: 'Classic Navy', bg: '#132238', hover: '#0c1624', text: '#ffffff' },
];

const DEFAULT_HEADER_FOOTER_COLORS = {
  topBarBgColor: '#60574d',
  topBarTextColor: '#ffffff',
  headerBgColor: '#22201e',
  headerTextColor: '#ffffff',
  footerBgColor: '#0f0d0b',
  footerTextColor: '#c8b89e',
};

export default function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active modal: null | 'logos' | 'compression' | 'trust' | 'business' | 'monetary' | 'theme'
  const [activeModal, setActiveModal] = useState(null);

  // Storefront Theme state
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [selectedThemeName, setSelectedThemeName] = useState('');
  const [themesList, setThemesList] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  // Storefront Button Colors state
  const [buttonColor, setButtonColor] = useState('#1f3a2b');
  const [buttonHoverColor, setButtonHoverColor] = useState('#162b20');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [topBarBgColor, setTopBarBgColor] = useState('#60574d');
  const [topBarTextColor, setTopBarTextColor] = useState('#ffffff');
  const [headerBgColor, setHeaderBgColor] = useState('#22201e');
  const [headerTextColor, setHeaderTextColor] = useState('#ffffff');
  const [footerBgColor, setFooterBgColor] = useState('#0f0d0b');
  const [footerTextColor, setFooterTextColor] = useState('#c8b89e');

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
  const loginModalImageInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMobileLogo, setUploadingMobileLogo] = useState(false);
  const [uploadingLoginModalImage, setUploadingLoginModalImage] = useState(false);

  // Social Proof & Urgency state
  const [socialProofForm, setSocialProofForm] = useState({
    showSoldCounter: true,
    soldTimeHours: 3,
    defaultSoldCount: 24,
    showReviews: true,
    defaultReviewCount: 13,
    defaultRating: 5,
  });
  const [savingSocialProof, setSavingSocialProof] = useState(false);

  // Social Media state
  const [socialMediaForm, setSocialMediaForm] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    pinterest: '',
    twitter: '',
    linkedin: '',
    whatsapp: '',
  });
  const [savingSocialMedia, setSavingSocialMedia] = useState(false);

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
      if (data.socialProof) {
        setSocialProofForm({
          showSoldCounter: data.socialProof.showSoldCounter !== false,
          soldTimeHours: data.socialProof.soldTimeHours ?? 3,
          defaultSoldCount: data.socialProof.defaultSoldCount ?? 24,
          showReviews: data.socialProof.showReviews !== false,
          defaultReviewCount: data.socialProof.defaultReviewCount ?? 13,
          defaultRating: data.socialProof.defaultRating ?? 5,
        });
      }
      if (data.socialMedia) {
        setSocialMediaForm({
          instagram: data.socialMedia.instagram ?? '',
          facebook: data.socialMedia.facebook ?? '',
          youtube: data.socialMedia.youtube ?? '',
          pinterest: data.socialMedia.pinterest ?? '',
          twitter: data.socialMedia.twitter ?? '',
          linkedin: data.socialMedia.linkedin ?? '',
          whatsapp: data.socialMedia.whatsapp ?? '',
        });
      }

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
        bankName: data.bankDetails?.bankName ?? data.bankName ?? '',
        bankAccountNumber: data.bankDetails?.bankAccountNumber ?? data.bankAccountNumber ?? '',
        ifscCode: data.bankDetails?.ifscCode ?? data.ifscCode ?? '',
      });

      if (data.currentThemeId) {
        const themeId = typeof data.currentThemeId === 'object' ? data.currentThemeId._id : data.currentThemeId;
        const themeName = typeof data.currentThemeId === 'object' ? data.currentThemeId.name : '';
        setSelectedThemeId(themeId || '');
        if (themeName) setSelectedThemeName(themeName);
      }
      const colors = data.themeColors || {};
      setButtonColor(colors.buttonColor || data.buttonColor || '#1f3a2b');
      setButtonHoverColor(colors.buttonHoverColor || data.buttonHoverColor || '#162b20');
      setButtonTextColor(colors.buttonTextColor || data.buttonTextColor || '#ffffff');
      setTopBarBgColor(colors.topBarBgColor || '#60574d');
      setTopBarTextColor(colors.topBarTextColor || '#ffffff');
      setHeaderBgColor(colors.headerBgColor || '#22201e');
      setHeaderTextColor(colors.headerTextColor || '#ffffff');
      setFooterBgColor(colors.footerBgColor || '#0f0d0b');
      setFooterTextColor(colors.footerTextColor || '#c8b89e');
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
        bankName: settings.bankDetails?.bankName ?? settings.bankName ?? '',
        bankAccountNumber: settings.bankDetails?.bankAccountNumber ?? settings.bankAccountNumber ?? '',
        ifscCode: settings.bankDetails?.ifscCode ?? settings.ifscCode ?? '',
      });
      setTrustBadges(Array.isArray(settings.trustBadges) ? settings.trustBadges : []);
      setImageCompression({ ...DEFAULT_UPLOAD_COMPRESSION_SETTINGS, ...(settings.mediaCompression || {}) });
      const initialThemeId = typeof settings.currentThemeId === 'object' ? settings.currentThemeId?._id : settings.currentThemeId;
      setSelectedThemeId(initialThemeId || '');
      const colors = settings.themeColors || {};
      setButtonColor(colors.buttonColor || settings.buttonColor || '#1f3a2b');
      setButtonHoverColor(colors.buttonHoverColor || settings.buttonHoverColor || '#162b20');
      setButtonTextColor(colors.buttonTextColor || settings.buttonTextColor || '#ffffff');
      setTopBarBgColor(colors.topBarBgColor || '#60574d');
      setTopBarTextColor(colors.topBarTextColor || '#ffffff');
      setHeaderBgColor(colors.headerBgColor || '#22201e');
      setHeaderTextColor(colors.headerTextColor || '#ffffff');
      setFooterBgColor(colors.footerBgColor || '#0f0d0b');
      setFooterTextColor(colors.footerTextColor || '#c8b89e');
    }
    setActiveModal(null);
  };

  // Upload Logo and Banner handler
  const handleLogoUpload = async (event, type = 'desktop') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      event.target.value = '';
      return;
    }
    let setter = setUploadingLogo;
    let ref = logoInputRef;
    let field = 'logoImage';
    let label = 'Website logo';

    if (type === 'mobile' || type === true) {
      setter = setUploadingMobileLogo;
      ref = mobileLogoInputRef;
      field = 'mobileLogoImage';
      label = 'Mobile logo';
    } else if (type === 'loginModal') {
      setter = setUploadingLoginModalImage;
      ref = loginModalImageInputRef;
      field = 'loginModalImage';
      label = 'Login modal banner';
    }

    try {
      setter(true);
      const { fileUrl, key } = await uploadWithPresignedUrl(file, 'brand-logos');
      const current = settings?.[field] || {};
      const response = await api.put('/settings', {
        [field]: { url: fileUrl, key: key || current.key || '' },
      });
      setSettings(response.data?.data || { ...settings, [field]: { url: fileUrl, key: key } });
      toast.success(`${label} saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setter(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const handleRemoveLoginModalImage = async (e) => {
    e.stopPropagation();
    try {
      setUploadingLoginModalImage(true);
      const response = await api.put('/settings', {
        loginModalImage: { url: '', key: '' },
      });
      setSettings(response.data?.data || { ...settings, loginModalImage: { url: '', key: '' } });
      toast.success('Login modal banner reset to default');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove banner');
    } finally {
      setUploadingLoginModalImage(false);
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
        bankDetails: {
          bankName: monetaryForm.bankName,
          bankAccountNumber: monetaryForm.bankAccountNumber,
          ifscCode: monetaryForm.ifscCode,
        },
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

  // Fetch Theme lookup
  const fetchThemesLookup = async () => {
    try {
      setLoadingThemes(true);
      const res = await api.get('/website/themes/lookup');
      const list = res.data?.data || [];
      setThemesList(list);
      if (selectedThemeId) {
        const found = list.find((t) => String(t._id) === String(selectedThemeId));
        if (found) setSelectedThemeName(found.name);
      }
    } catch (err) {
      console.error('Failed to load theme lookup:', err);
      toast.error('Failed to load themes');
    } finally {
      setLoadingThemes(false);
    }
  };

  // Reset Storefront Header & Footer Colors to Defaults
  const handleResetHeaderFooterDefaults = () => {
    setTopBarBgColor(DEFAULT_HEADER_FOOTER_COLORS.topBarBgColor);
    setTopBarTextColor(DEFAULT_HEADER_FOOTER_COLORS.topBarTextColor);
    setHeaderBgColor(DEFAULT_HEADER_FOOTER_COLORS.headerBgColor);
    setHeaderTextColor(DEFAULT_HEADER_FOOTER_COLORS.headerTextColor);
    setFooterBgColor(DEFAULT_HEADER_FOOTER_COLORS.footerBgColor);
    setFooterTextColor(DEFAULT_HEADER_FOOTER_COLORS.footerTextColor);
    toast.success('Header & footer colors reset to defaults');
  };

  // Save Storefront Theme
  const handleSaveTheme = async () => {
    if (!selectedThemeId) {
      toast.error('Please select a theme');
      return;
    }
    try {
      setSavingTheme(true);
      const res = await api.put('/settings', {
        currentThemeId: selectedThemeId,
        themeColors: {
          buttonColor,
          buttonHoverColor,
          buttonTextColor,
          topBarBgColor,
          topBarTextColor,
          headerBgColor,
          headerTextColor,
          footerBgColor,
          footerTextColor,
        },
        buttonColor,
        buttonHoverColor,
        buttonTextColor,
      });
      const updated = res.data?.data || {};
      setSettings(updated);
      const themeObj = updated.currentThemeId;
      const themeName =
        (typeof themeObj === 'object' && themeObj?.name) ||
        themesList.find((t) => String(t._id) === String(selectedThemeId))?.name ||
        '';
      setSelectedThemeName(themeName);
      setActiveModal(null);
      toast.success('Storefront theme & colors updated successfully');
    } catch (err) {
      console.error('Failed to save theme:', err);
      toast.error(err.response?.data?.message || 'Failed to update theme');
    } finally {
      setSavingTheme(false);
    }
  };

  // Save Social Proof & Urgency
  const handleSaveSocialProof = async () => {
    try {
      setSavingSocialProof(true);
      const res = await api.put('/settings', {
        socialProof: {
          showSoldCounter: Boolean(socialProofForm.showSoldCounter),
          soldTimeHours: Number(socialProofForm.soldTimeHours) || 3,
          defaultSoldCount: Number(socialProofForm.defaultSoldCount) || 24,
          showReviews: Boolean(socialProofForm.showReviews),
          defaultReviewCount: Number(socialProofForm.defaultReviewCount) || 13,
          defaultRating: Number(socialProofForm.defaultRating) || 5,
        },
      });
      setSettings(res.data?.data || {});
      toast.success('Social proof & urgency configuration saved');
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSocialProof(false);
    }
  };

  // Save Social Media Channels
  const handleSaveSocialMedia = async () => {
    try {
      setSavingSocialMedia(true);
      const res = await api.put('/settings', {
        socialMedia: socialMediaForm,
      });
      setSettings(res.data?.data || {});
      toast.success('Social media links updated successfully');
      setActiveModal(null);
    } catch (err) {
      console.error('Failed to save social media links:', err);
      toast.error(err.response?.data?.message || 'Failed to update social media links');
    } finally {
      setSavingSocialMedia(false);
    }
  };

  const handleOpenModal = (id) => {
    setActiveModal(id);
    if (id === 'theme') {
      fetchThemesLookup();
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
      title: 'Website Logos & Auth Banner',
      subtitle: 'Manage desktop & mobile logos, and the customer login modal banner.',
      icon: HiOutlinePhotograph,
      badgeText: settings?.logoImage?.url
        ? settings?.loginModalImage?.url
          ? 'Logos & Login banner active'
          : 'Desktop & Mobile logos active'
        : 'Tap to configure logos & banner',
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
    {
      id: 'theme',
      title: 'Storefront Theme & Colors',
      subtitle: 'Manage active website theme, button colors, and header/footer styling from one place.',
      icon: HiOutlineColorSwatch,
      badgeText: selectedThemeName
        ? `Active: ${selectedThemeName} · Button: ${(buttonColor || '#1f3a2b').toUpperCase()}`
        : `Colors Configured`,
      hasPreview: false,
    },
    {
      id: 'socialProof',
      title: 'Social Proof & Urgency (Reviews & Sold Counter)',
      subtitle: 'Configure dummy sold count, review rating badge, and dynamic sale hours.',
      icon: HiOutlineFire,
      badgeText: `${socialProofForm.showSoldCounter ? 'Sold ON' : 'Sold OFF'} · ${socialProofForm.showReviews ? 'Reviews ON' : 'Reviews OFF'}`,
      hasPreview: false,
    },
    {
      id: 'socialMedia',
      title: 'Social Media Channels',
      subtitle: 'Manage official store links for Instagram, Facebook, YouTube, Pinterest, X/Twitter, LinkedIn, and WhatsApp.',
      icon: HiOutlineShare,
      badgeText: `${Object.values(socialMediaForm).filter((val) => typeof val === 'string' && val.trim().length > 0).length} channels active`,
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
              onClick={() => handleOpenModal(box.id)}
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
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={`relative flex flex-col w-full my-auto rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden transition-all duration-200 ${
              activeModal === 'theme'
                ? 'max-w-5xl lg:max-w-6xl'
                : activeModal === 'compression'
                ? 'max-w-4xl'
                : activeModal === 'business' || activeModal === 'logos'
                ? 'max-w-3xl'
                : 'max-w-2xl'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-[#fdfcfb]">
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  {activeModal === 'logos' && 'Website Logos & Auth Banner'}
                  {activeModal === 'compression' && 'Global Image Compression'}
                  {activeModal === 'trust' && 'Trust Strip Configuration'}
                  {activeModal === 'business' && 'Business & Identity'}
                  {activeModal === 'monetary' && 'Monetary Settlement Details'}
                  {activeModal === 'theme' && 'Storefront Theme'}
                  {activeModal === 'socialProof' && 'Social Proof & Urgency (Reviews & Sold Counter)'}
                  {activeModal === 'socialMedia' && 'Social Media & Brand Channels'}
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  {activeModal === 'logos' && 'Manage your desktop & mobile logos, and the customer login modal banner.'}
                  {activeModal === 'compression' && 'Set automatic image optimization and quality presets.'}
                  {activeModal === 'trust' && 'Manage trust badges shown in the storefront assurance strip.'}
                  {activeModal === 'business' && 'Store name, credentials, address, and policies.'}
                  {activeModal === 'monetary' && 'Bank settlement details and payout credentials.'}
                  {activeModal === 'theme' && 'Select the active theme that controls storefront layout, banners, and media.'}
                  {activeModal === 'socialProof' && 'Manage sold count urgency, review badges, and dynamic time window shown on the product page.'}
                  {activeModal === 'socialMedia' && 'Manage official social profiles and chat channels shown in the storefront footer.'}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        label: 'Desktop logo',
                        field: 'logoImage',
                        inputRef: logoInputRef,
                        busy: uploadingLogo,
                        type: 'desktop',
                        desc: 'Main brand logo displayed on desktop headers.',
                        format: 'PNG, JPG, WebP or SVG',
                      },
                      {
                        label: 'Mobile logo (optional)',
                        field: 'mobileLogoImage',
                        inputRef: mobileLogoInputRef,
                        busy: uploadingMobileLogo,
                        type: 'mobile',
                        desc: 'Optimized emblem for smaller mobile screens.',
                        format: 'PNG, JPG, WebP or SVG',
                      },
                      {
                        label: 'Login / Sign In Banner',
                        field: 'loginModalImage',
                        inputRef: loginModalImageInputRef,
                        busy: uploadingLoginModalImage,
                        type: 'loginModal',
                        desc: 'Visual image shown on login & register modal popups.',
                        format: 'PNG, JPG, WebP (Portrait recommended)',
                        removable: true,
                      },
                    ].map(({ label, field, inputRef, busy, type, desc, format, removable }) => (
                      <div key={field} className="rounded-xl border border-stone-200 bg-[#fbfaf8] p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-stone-800">{label}</p>
                            {removable && settings?.[field]?.url && (
                              <button
                                type="button"
                                onClick={handleRemoveLoginModalImage}
                                disabled={busy}
                                className="text-[10px] text-red-500 hover:text-red-700 font-medium underline"
                              >
                                Reset to Default
                              </button>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-stone-500">{desc}</p>
                        </div>
                        <input
                          ref={inputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(event) => handleLogoUpload(event, type)}
                          className="sr-only"
                        />
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          disabled={busy}
                          className="mt-3 min-h-28 w-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d8c8b2] bg-white p-3 hover:border-[#8f6d43] hover:bg-[#faf5ee] disabled:opacity-60 transition-all focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 overflow-hidden relative group"
                        >
                          {settings?.[field]?.url ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img
                                src={getMediaUrl(settings[field].url)}
                                alt={`${label} preview`}
                                className={field === 'loginModalImage' ? 'max-h-24 w-auto object-cover rounded shadow-xs' : 'max-h-16 max-w-full object-contain'}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity text-white text-[10px] font-medium">
                                Change Image
                              </div>
                            </div>
                          ) : field === 'loginModalImage' ? (
                            <div className="flex flex-col items-center text-center">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf6f0] text-[#8f6d43] mb-1.5">
                                <HiOutlinePhotograph className="h-5 w-5" />
                              </span>
                              <span className="text-xs font-semibold text-stone-700">Choose custom image</span>
                              <span className="text-[10px] text-stone-400 mt-0.5">default auth banner in use</span>
                            </div>
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
                          {busy ? 'Saving…' : format}
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

              {/* Theme & Button Color Modal Body */}
              {activeModal === 'theme' && (
                <div className="space-y-6 max-h-[82vh] overflow-y-auto p-6 sm:p-7">

                  {/* ── Section A: Global Storefront Button Styling ── */}
                  <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: buttonColor }} />
                          Global Storefront Button Color
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Controls the button color across all modals, pages, and interactive actions from one place
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md border border-stone-200 bg-white text-stone-800 shadow-2xs">
                          {(buttonColor || '#1f3a2b').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Live Button Preview Card */}
                    <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Live Storefront Button Preview
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-default"
                        >
                          <span>Schedule Appointment</span>
                        </button>
                        <button
                          type="button"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-default"
                        >
                          <span>Sign In</span>
                        </button>
                        <button
                          type="button"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-default"
                        >
                          <span>EXPLORE JEWELLERY</span>
                        </button>
                        <button
                          type="button"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold shadow-xs flex items-center gap-1.5 cursor-default"
                        >
                          <span>Copy Code</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Luxury Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-700">
                        Quick Luxury Palettes
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {LUXURY_BUTTON_PALETTES.map((preset) => {
                          const isCurrent = (buttonColor || '').toLowerCase() === preset.bg.toLowerCase();
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setButtonColor(preset.bg);
                                setButtonHoverColor(preset.hover);
                                setButtonTextColor(preset.text);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isCurrent
                                  ? 'border-stone-900 bg-white ring-2 ring-stone-900/15 shadow-xs'
                                  : 'border-stone-200 bg-white/70 hover:bg-white hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: preset.bg }}
                                />
                                <span className="text-[10px] font-bold text-stone-800 truncate">
                                  {preset.name}
                                </span>
                              </div>
                              <span className="font-mono text-[9px] text-stone-400">
                                {preset.bg}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Color Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-200/80">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Button Background Color
                        </label>
                        <div className="flex items-center gap-2 h-9 px-2 rounded-lg border border-stone-200 bg-white shadow-2xs">
                          <input
                            type="color"
                            value={buttonColor}
                            onChange={(e) => setButtonColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={buttonColor}
                            onChange={(e) => setButtonColor(e.target.value)}
                            className="w-full text-xs font-mono font-medium text-stone-800 outline-none uppercase"
                            placeholder="#1F3A2B"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Button Hover Color
                        </label>
                        <div className="flex items-center gap-2 h-9 px-2 rounded-lg border border-stone-200 bg-white shadow-2xs">
                          <input
                            type="color"
                            value={buttonHoverColor}
                            onChange={(e) => setButtonHoverColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={buttonHoverColor}
                            onChange={(e) => setButtonHoverColor(e.target.value)}
                            className="w-full text-xs font-mono font-medium text-stone-800 outline-none uppercase"
                            placeholder="#162B20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Button Text Color
                        </label>
                        <div className="flex items-center gap-2 h-9 px-2 rounded-lg border border-stone-200 bg-white shadow-2xs">
                          <input
                            type="color"
                            value={buttonTextColor}
                            onChange={(e) => setButtonTextColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={buttonTextColor}
                            onChange={(e) => setButtonTextColor(e.target.value)}
                            className="w-full text-xs font-mono font-medium text-stone-800 outline-none uppercase"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section A2: Header, Top Bar & Footer Colors ── */}
                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                          Storefront Header & Footer Colors
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Customize background and text colors for the top announcement bar, main header, and footer.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetHeaderFooterDefaults}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 active:scale-95 border border-stone-200 rounded-lg shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                        title="Reset all header and footer colors to luxury defaults"
                      >
                        <HiOutlineRefresh className="w-3.5 h-3.5 text-stone-500" />
                        <span>Reset to Defaults</span>
                      </button>
                    </div>

                    {/* Live Header & Footer Preview */}
                    <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs text-[11px]">
                      {/* Top Bar Preview */}
                      <div
                        style={{ backgroundColor: topBarBgColor, color: topBarTextColor }}
                        className="px-3 py-1 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-1 font-medium text-[10px]">
                          <span>🎥</span> Virtual Appointment
                        </span>
                        <span className="truncate max-w-[200px] text-[10px]">BIS Hallmarked & Certified Jewellery</span>
                        <span className="text-[10px]">+91 84600-91955</span>
                      </div>

                      {/* Main Header Preview */}
                      <div
                        style={{ backgroundColor: headerBgColor, color: headerTextColor }}
                        className="px-3 py-2.5 flex items-center justify-between transition-colors"
                      >
                        <span className="font-serif font-bold tracking-widest text-xs">NEIRAH</span>
                        <div className="flex items-center gap-2 text-[10px] opacity-80">
                          <span>RINGS</span>
                          <span>EARRINGS</span>
                          <span>PENDANTS</span>
                          <span>COLLECTION</span>
                        </div>
                        <button
                          type="button"
                          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold"
                        >
                          Explore
                        </button>
                      </div>

                      {/* Footer Preview */}
                      <div
                        style={{ backgroundColor: footerBgColor, color: footerTextColor }}
                        className="px-3 py-2 flex items-center justify-between transition-colors"
                      >
                        <span className="font-serif font-semibold text-[10px]">NEIRAH FINE JEWELLERY</span>
                        <span className="text-[9px] opacity-75">© 2026 Neirah. All rights reserved.</span>
                      </div>
                    </div>

                    {/* Pickers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      {/* 1. Top Bar */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-800">Top Announcement Bar</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTopBarBgColor(DEFAULT_HEADER_FOOTER_COLORS.topBarBgColor);
                              setTopBarTextColor(DEFAULT_HEADER_FOOTER_COLORS.topBarTextColor);
                            }}
                            className="text-[10px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                            title="Reset top bar colors to default"
                          >
                            Default
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Background Color</label>
                          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-stone-200 bg-white">
                            <input
                              type="color"
                              value={topBarBgColor}
                              onChange={(e) => setTopBarBgColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={topBarBgColor}
                              onChange={(e) => setTopBarBgColor(e.target.value)}
                              className="w-full text-[11px] font-mono font-medium text-stone-800 outline-none uppercase"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Text Color</label>
                          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-stone-200 bg-white">
                            <input
                              type="color"
                              value={topBarTextColor}
                              onChange={(e) => setTopBarTextColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={topBarTextColor}
                              onChange={(e) => setTopBarTextColor(e.target.value)}
                              className="w-full text-[11px] font-mono font-medium text-stone-800 outline-none uppercase"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Main Header */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-800">Main Header & Nav</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHeaderBgColor(DEFAULT_HEADER_FOOTER_COLORS.headerBgColor);
                              setHeaderTextColor(DEFAULT_HEADER_FOOTER_COLORS.headerTextColor);
                            }}
                            className="text-[10px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                            title="Reset header colors to default"
                          >
                            Default
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Background Color</label>
                          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-stone-200 bg-white">
                            <input
                              type="color"
                              value={headerBgColor}
                              onChange={(e) => setHeaderBgColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={headerBgColor}
                              onChange={(e) => setHeaderBgColor(e.target.value)}
                              className="w-full text-[11px] font-mono font-medium text-stone-800 outline-none uppercase"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Text Color</label>
                          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-stone-200 bg-white">
                            <input
                              type="color"
                              value={headerTextColor}
                              onChange={(e) => setHeaderTextColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={headerTextColor}
                              onChange={(e) => setHeaderTextColor(e.target.value)}
                              className="w-full text-[11px] font-mono font-medium text-stone-800 outline-none uppercase"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Footer */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-800">Footer Section</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFooterBgColor(DEFAULT_HEADER_FOOTER_COLORS.footerBgColor);
                              setFooterTextColor(DEFAULT_HEADER_FOOTER_COLORS.footerTextColor);
                            }}
                            className="text-[10px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                            title="Reset footer colors to default"
                          >
                            Default
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Background Color</label>
                          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-stone-200 bg-white">
                            <input
                              type="color"
                              value={footerBgColor}
                              onChange={(e) => setFooterBgColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={footerBgColor}
                              onChange={(e) => setFooterBgColor(e.target.value)}
                              className="w-full text-[11px] font-mono font-medium text-stone-800 outline-none uppercase"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-500 mb-1">Text Color</label>
                          <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-stone-200 bg-white">
                            <input
                              type="color"
                              value={footerTextColor}
                              onChange={(e) => setFooterTextColor(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={footerTextColor}
                              onChange={(e) => setFooterTextColor(e.target.value)}
                              className="w-full text-[11px] font-mono font-medium text-stone-800 outline-none uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section B: Storefront Active Theme Selector ── */}
                  <div className="space-y-2.5 pt-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Active Storefront Theme
                    </label>

                    {loadingThemes ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-stone-500">Loading themes...</span>
                      </div>
                    ) : themesList.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-500">
                        No themes found. Create a theme in Website Themes first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {themesList.map((t) => {
                          const isSelected = String(selectedThemeId) === String(t._id);
                          return (
                            <div
                              key={t._id}
                              onClick={() => setSelectedThemeId(t._id)}
                              className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                                isSelected
                                  ? 'border-[#8f6d43] bg-[#faf6f0]/70 ring-2 ring-[#8f6d43]/20 shadow-xs'
                                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-bold text-stone-900">{t.name}</h4>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                      t.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </div>
                                <p className="mt-1 font-mono text-[11px] text-stone-400">{t.code}</p>
                                {t.description && (
                                  <p className="mt-2 text-xs text-stone-600 line-clamp-2">
                                    {t.description}
                                  </p>
                                )}
                              </div>

                              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-stone-500">
                                  {isSelected ? (
                                    <span className="font-semibold text-[#8f6d43] flex items-center gap-1">
                                      <HiOutlineCheck className="w-3.5 h-3.5" /> Selected
                                    </span>
                                  ) : (
                                    <span className="text-stone-400">Click to select</span>
                                  )}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-[#8f6d43] bg-[#8f6d43]'
                                      : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Proof Modal Body */}
              {activeModal === 'socialProof' && (
                <div className="space-y-4">
                  {/* Storefront Live Preview */}
                  <div className="rounded-xl border border-[#ebdcc8] bg-[#fbf9f6] p-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebdcc8]/70 mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f4e]">
                        Storefront Live Preview
                      </span>
                      <span className="text-[10px] text-stone-400">Updates live as you configure</span>
                    </div>

                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200/70">
                      {/* Review Badge */}
                      {socialProofForm.showReviews && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-600">
                          <span className="text-amber-400 text-xs tracking-tight">★★★★★</span>
                          <span className="font-semibold text-stone-900">
                            {socialProofForm.defaultReviewCount || 13} reviews
                          </span>
                        </div>
                      )}

                      {/* Hourly Sold Badge */}
                      {socialProofForm.showSoldCounter && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-700">
                          <span className="text-sm leading-none">🔥</span>
                          <span>
                            <strong className="font-bold text-stone-900">{socialProofForm.defaultSoldCount || 24}</strong> sold in last{' '}
                            <strong>{socialProofForm.soldTimeHours || 3}</strong> hours
                          </span>
                        </div>
                      )}

                      {!socialProofForm.showReviews && !socialProofForm.showSoldCounter && (
                        <div className="text-xs text-stone-400 italic py-1 text-center">
                          All social proof badges are currently turned off.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1. Sold Counter Configuration */}
                  <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>🔥</span>
                          <span>Hourly Sold Counter</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Shows urgency sold badge on product pages
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={socialProofForm.showSoldCounter}
                          onChange={(e) =>
                            setSocialProofForm((prev) => ({ ...prev, showSoldCounter: e.target.checked }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b6f4e]"></div>
                      </label>
                    </div>

                    {socialProofForm.showSoldCounter && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Sold Time Window (Hours)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="72"
                            value={socialProofForm.soldTimeHours}
                            onChange={(e) =>
                              setSocialProofForm((prev) => ({
                                ...prev,
                                soldTimeHours: Number(e.target.value) || 1,
                              }))
                            }
                            className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
                            placeholder="e.g. 3"
                          />
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Displayed as &apos;sold in last {socialProofForm.soldTimeHours || 3} hours&apos;
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Default / Fallback Sold Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={socialProofForm.defaultSoldCount}
                            onChange={(e) =>
                              setSocialProofForm((prev) => ({
                                ...prev,
                                defaultSoldCount: Number(e.target.value) || 1,
                              }))
                            }
                            className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
                            placeholder="e.g. 24"
                          />
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Used when product has no custom sales count
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Customer Reviews & Ratings */}
                  <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span className="text-amber-400">★</span>
                          <span>Customer Reviews Badge</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Shows star rating badge and review count
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={socialProofForm.showReviews}
                          onChange={(e) =>
                            setSocialProofForm((prev) => ({ ...prev, showReviews: e.target.checked }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b6f4e]"></div>
                      </label>
                    </div>

                    {socialProofForm.showReviews && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Default Star Rating (1 to 5)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={socialProofForm.defaultRating}
                            onChange={(e) =>
                              setSocialProofForm((prev) => ({
                                ...prev,
                                defaultRating: Number(e.target.value) || 5,
                              }))
                            }
                            className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
                            placeholder="e.g. 5"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Default Review Count
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={socialProofForm.defaultReviewCount}
                            onChange={(e) =>
                              setSocialProofForm((prev) => ({
                                ...prev,
                                defaultReviewCount: Number(e.target.value) || 1,
                              }))
                            }
                            className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
                            placeholder="e.g. 13"
                          />
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Displayed as &apos;{socialProofForm.defaultReviewCount || 13} reviews&apos;
                          </span>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              )}

              {activeModal === 'socialMedia' && (
                <div className="space-y-4">
                  <div className="bg-[#faf6f0] border border-[#ebdcc8]/80 rounded-xl p-3.5 text-xs text-stone-700 leading-relaxed">
                    <span className="font-semibold text-stone-900">Dynamic Storefront Social Channels:</span>
                    <p className="mt-0.5 text-stone-600">
                      Configure your brand&apos;s official social profiles below. Configured channels will automatically appear in the storefront footer (&ldquo;FOLLOW US&rdquo;) and contact sections.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'instagram',
                        label: 'Instagram',
                        placeholder: 'https://www.instagram.com/neirah.officials',
                        icon: FaInstagram,
                        color: 'text-pink-600 bg-pink-50 border-pink-200',
                        hint: 'Instagram brand profile or feed page',
                      },
                      {
                        key: 'facebook',
                        label: 'Facebook',
                        placeholder: 'https://www.facebook.com/yourbrand',
                        icon: FaFacebookF,
                        color: 'text-blue-600 bg-blue-50 border-blue-200',
                        hint: 'Official Facebook page or community link',
                      },
                      {
                        key: 'youtube',
                        label: 'YouTube',
                        placeholder: 'https://www.youtube.com/@yourbrand',
                        icon: FaYoutube,
                        color: 'text-red-600 bg-red-50 border-red-200',
                        hint: 'Brand YouTube channel or video gallery',
                      },
                      {
                        key: 'pinterest',
                        label: 'Pinterest',
                        placeholder: 'https://www.pinterest.com/yourbrand',
                        icon: FaPinterestP,
                        color: 'text-rose-700 bg-rose-50 border-rose-200',
                        hint: 'Pinterest moodboard or jewellery catalogue',
                      },
                      {
                        key: 'twitter',
                        label: 'X (Twitter)',
                        placeholder: 'https://x.com/yourbrand',
                        icon: FaXTwitter,
                        color: 'text-stone-900 bg-stone-100 border-stone-300',
                        hint: 'Official X/Twitter feed handle',
                      },
                      {
                        key: 'linkedin',
                        label: 'LinkedIn',
                        placeholder: 'https://www.linkedin.com/company/yourbrand',
                        icon: FaLinkedinIn,
                        color: 'text-sky-700 bg-sky-50 border-sky-200',
                        hint: 'Company LinkedIn page',
                      },
                      {
                        key: 'whatsapp',
                        label: 'WhatsApp Chat / Number',
                        placeholder: 'https://wa.me/919726237723?text=Hi%20Neirah%20Jewels',
                        icon: FaWhatsapp,
                        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                        hint: 'WhatsApp wa.me direct chat or contact link',
                      },
                    ].map((platform) => {
                      const IconComp = platform.icon;
                      const hasValue = Boolean(socialMediaForm[platform.key]?.trim());
                      return (
                        <div
                          key={platform.key}
                          className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/80 transition-all hover:bg-stone-50"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                              <span className={`w-6 h-6 rounded-md border flex items-center justify-center ${platform.color}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </span>
                              <span>{platform.label}</span>
                            </label>
                            {hasValue && (
                              <a
                                href={socialMediaForm[platform.key]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8b6f4e] hover:underline"
                              >
                                Test Link <HiOutlineExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <input
                            type="url"
                            value={socialMediaForm[platform.key]}
                            onChange={(e) =>
                              setSocialMediaForm((prev) => ({
                                ...prev,
                                [platform.key]: e.target.value,
                              }))
                            }
                            placeholder={platform.placeholder}
                            className="w-full h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e]"
                          />
                          <p className="mt-1 text-[10px] text-stone-400">{platform.hint}</p>
                        </div>
                      );
                    })}
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

              {activeModal === 'theme' && (
                <button
                  type="button"
                  onClick={handleSaveTheme}
                  disabled={savingTheme || !selectedThemeId}
                  style={{ backgroundColor: buttonColor || '#1f3a2b', color: buttonTextColor || '#ffffff' }}
                  className="rounded-lg px-5 py-2 text-xs font-semibold shadow-xs hover:brightness-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingTheme ? 'Saving…' : 'Apply Theme & Colors'}
                </button>
              )}

              {activeModal === 'socialProof' && (
                <button
                  type="button"
                  onClick={handleSaveSocialProof}
                  disabled={savingSocialProof}
                  style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                  className="rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingSocialProof ? 'Saving…' : 'Save Social Proof Settings'}
                </button>
              )}

              {activeModal === 'socialMedia' && (
                <button
                  type="button"
                  onClick={handleSaveSocialMedia}
                  disabled={savingSocialMedia}
                  style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                  className="rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingSocialMedia ? 'Saving…' : 'Save Social Media Links'}
                </button>
              )}
            </div>
          </div>
        </div>, document.body)
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
