import ColorStatusToggle from '../../components/common/ColorStatusToggle';
import MenuItemSelect from '../../components/common/MenuItemSelect';
import { selectedMenuIds } from '../../utils/menuItems';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { createProductId, deleteUploadedFile, uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import Dropdown from '../../components/common/Dropdown';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineLink,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoColorPaletteOutline,
  IoCheckmarkCircle,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { TbCoins, TbScale, TbDatabase, TbListDetails } from 'react-icons/tb';

const buildColorOption = (item = {}) => {
  const name = item.name || '';
  const hex = item.colorCode || item.hex || '';
  const border = item.colorCodeEnd || item.border || hex;

  return {
    id: item._id || item.id,
    name,
    hex,
    border,
    sphereGradient: hex
      ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, ' + hex + ' 55%, ' + border + ' 100%)'
      : '',
    sphereShadow: '',
  };
};

const CATEGORY_TAG_OPTIONS = [
  { value: 'No Banner Tag', label: 'No Banner Tag' },
  { value: 'Best Seller', label: 'Best Seller' },
  { value: 'New Arrival', label: 'New Arrival' },
  { value: 'Trending', label: 'Trending' },
  { value: 'Featured', label: 'Featured' },
  { value: 'Limited Edition', label: 'Limited Edition' },
];

const GENDER_OPTIONS = [
  { value: 'Unisex', label: 'Unisex' },
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Kids', label: 'Kids' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
];

const STOCK_STATUS_OPTIONS = [
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
];

export default function OrnateProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== 'add' && id !== 'new');
  const [draftProductId] = useState(() => (isEditMode ? id : createProductId()));
  const mediaProductId = isEditMode ? id : draftProductId;

  // Wizard tab state: 1 to 7
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [previewModalGallery, setPreviewModalGallery] = useState([]);
  const [previewModalIndex, setPreviewModalIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleOpenImagePreview = (imageUrl, gallery = []) => {
    if (!imageUrl) return;
    const list = Array.isArray(gallery) && gallery.length > 0 ? gallery : [imageUrl];
    const idx = list.indexOf(imageUrl);
    setPreviewModalGallery(list);
    setPreviewModalIndex(idx >= 0 ? idx : 0);
    setPreviewModalImage(imageUrl);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleCloseImagePreview = () => {
    setPreviewModalImage(null);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation?.();
    setZoomScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation?.();
    setZoomScale((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e) => {
    e?.stopPropagation?.();
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handlePrevPreviewImage = (e) => {
    e?.stopPropagation?.();
    if (previewModalGallery.length <= 1) return;
    const nextIdx = (previewModalIndex - 1 + previewModalGallery.length) % previewModalGallery.length;
    setPreviewModalIndex(nextIdx);
    setPreviewModalImage(previewModalGallery[nextIdx]);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleNextPreviewImage = (e) => {
    e?.stopPropagation?.();
    if (previewModalGallery.length <= 1) return;
    const nextIdx = (previewModalIndex + 1) % previewModalGallery.length;
    setPreviewModalIndex(nextIdx);
    setPreviewModalImage(previewModalGallery[nextIdx]);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!previewModalImage) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseImagePreview();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPreviewImage();
      } else if (e.key === 'ArrowRight') {
        handleNextPreviewImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModalImage, previewModalGallery, previewModalIndex]);

  const handlePreviewMouseDown = (e) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    };
  };

  const handlePreviewMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePreviewMouseUp = () => {
    setIsDragging(false);
  };

  const handlePreviewWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 4));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(Number((prev - 0.2).toFixed(2)), 0.5);
        if (next <= 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [draggedCareIndex, setDraggedCareIndex] = useState(null);
  const [dragOverCareIndex, setDragOverCareIndex] = useState(null);

  // Dropdown options loaded from backend
  const { categoryOptions: categories } = useCategoryLookup();

  // ─── 1. Base Information ───────────────────────────────────
  const [baseInfo, setBaseInfo] = useState({
    title: '',
    category: '',
    categoryTag: '',
    menuItem: [],
    targetGender: '',
    status: 'draft',
    stockStatus: '',
    showInApp: false,
    showOnWeb: false,
    description: '',
  });
  const [autoOpenMenu, setAutoOpenMenu] = useState(false);

  // ─── 2. Pricing & Inventory ────────────────────────────────
  const [pricing, setPricing] = useState({
    ornatePrice: '',
    costPrice: '',
    markupPercentage: '',
    calculatedPrice: '',
    salePrice: '',
    mrpMarkupPercentage: '',
    mrp: '',
  });

  // ─── 3. Variant Configuration (Colors) ─────────────────────
  const [colorOptions, setColorOptions] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [expandedColors, setExpandedColors] = useState([]);
  const [variantMedia, setVariantMedia] = useState({});
  const [uploadingVariantColor, setUploadingVariantColor] = useState(null);
  const [uploadingSwatchColor, setUploadingSwatchColor] = useState(null);

  // ─── 4. Weights & Purities ─────────────────────────────────
  const [weights, setWeights] = useState({
    grossWeight: '',
    netWeight: '',
    purity: '',
    caratCategory: '',
  });

  // ─── 5. Classification & ERP Details ───────────────────────
  const [erpDetails, setErpDetails] = useState({
    customGroupName: '',
    itemName: '',
    groupName: '',
    varietyName: '',
    metalName: '',
    uniqueLabelId: '',
    barcodeNumber: '',
    labelNumber: '',
    remark: '',
    companyCode: '',
    carat: '',
  });

  // ─── 6. Ornate Images ──────────────────────────────────────
  const [ornateImages, setOrnateImages] = useState([]);

  // ─── 7. Information & Care Sections ────────────────────────
  const [careSections, setCareSections] = useState([]);

  // ─── 8. Product Specifications ─────────────────────────────
  const [specifications, setSpecifications] = useState([]);

  // ─── 9. SEO Configuration ──────────────────────────────────
  const [seo, setSeo] = useState({
    metaTitle: '',
    keywords: '',
    metaDescription: '',
  });

  // Load Menu Items and Live Metal Colors on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [colorRes] = await Promise.allSettled([
          api.get('/metal-colors?limit=100').catch(() =>
            api.get('/diamonds/attributes').then((r) => ({
              data: { data: r.data?.data?.metalColors || [] },
            }))
          ),
        ]);

        if (colorRes.status === 'fulfilled') {
          const rawColors = colorRes.value.data?.data?.items || colorRes.value.data?.data || [];
          if (Array.isArray(rawColors) && rawColors.length > 0) {
            const built = rawColors
              .filter((c) => c.name?.toLowerCase() !== 'general')
              .map(buildColorOption);
            setColorOptions(built);
          }
        }
      } catch (err) {
        console.warn('Could not fetch auxiliary dropdown options:', err);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch product data if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const product = res.data?.data || res.data;

        if (product) {
          // Populate Base Information
          setBaseInfo({
            title: product.basicInfo?.title || '',
            category: Array.isArray(product.categoryIds)
              ? (product.categoryIds[0]?._id || product.categoryIds[0] || '')
              : (product.categoryIds?._id || product.categoryIds || ''),
            categoryTag: (Array.isArray(product.promoBanner) && product.promoBanner[0]) || product.categoryTag || '',
            menuItem: selectedMenuIds(product),
            targetGender: (() => {
              const raw = product.basicInfo?.gender ?? product.gender ?? '';
              const first = (Array.isArray(raw) && raw[0]) || raw || '';
              const matched = GENDER_OPTIONS.find(
                (opt) => opt.value.toLowerCase() === String(first).trim().toLowerCase()
              );
              return matched ? matched.value : first;
            })(),
            status: product.status || 'draft',
            stockStatus: product.stockStatus || '',
            showInApp: Boolean(product.inapp),
            showOnWeb: Boolean(product.inweb),
            description: product.basicInfo?.description || '',
          });

          // Populate Pricing
          const ornateVal = Number(
            product.pricing?.ornatePrice ?? product.ornatePrice ?? product.ornate?.price ?? product.ornate?.goldAmt ?? 0
          );
          const rawCost = product.pricing?.costPrice;
          const cost = Number(
            rawCost !== undefined && rawCost !== null && rawCost !== '' && Number(rawCost) > 0
              ? rawCost
              : (product.isOrnate ? ornateVal : 0)
          );
          const markup = Number(product.pricing?.markupPercentage ?? 0);
          const rawCalc = product.pricing?.calculatedPrice ?? product.calculatedPrice;
          const calcPrice = Number(
            rawCalc !== undefined && rawCalc !== null && rawCalc !== '' && Number(rawCalc) > 0
              ? rawCalc
              : (cost > 0 ? cost + (cost * markup) / 100 : ornateVal)
          );
          const sale = Number(product.pricing?.salePrice ?? calcPrice ?? ornateVal);
          const mrpVal = Number(product.pricing?.mrp ?? sale ?? ornateVal);

          setPricing({
            ornatePrice: ornateVal || '',
            costPrice: cost || '',
            markupPercentage: markup || '',
            calculatedPrice: calcPrice || '',
            salePrice: sale || '',
            mrpMarkupPercentage: product.pricing?.mrpMarkupPercentage || '',
            mrp: mrpVal || '',
          });

          // Populate Colors
          if (Array.isArray(product.metalColors) && product.metalColors.length > 0) {
            const colorNames = product.metalColors.map((mc) => {
              if (typeof mc === 'object' && mc !== null) return mc.name;
              const found = colorOptions.find((co) => co.id === mc || co.name?.toLowerCase() === String(mc).toLowerCase());
              return found?.name || mc;
            });
            setSelectedColors(colorNames.filter(Boolean));
          } else if (product.color) {
            const found = colorOptions.find((co) => co.id === product.color || co.name?.toLowerCase() === String(product.color).toLowerCase());
            setSelectedColors([found?.name || product.color]);
          }

          // Populate Variant Media from colorImages if available
          if (Array.isArray(product.colorImages) && product.colorImages.length > 0) {
            const mediaMap = {};
            const loadedColors = [];
            product.colorImages.forEach((ci) => {
              let colorName =
                ci.metalColorId?.name ||
                ci.metalColor?.name ||
                ci.metalColorName ||
                ci.colorName ||
                (typeof ci.metalColorId === 'string' ? ci.metalColorId : '') ||
                (typeof ci.metalColor === 'string' ? ci.metalColor : '');
              if (colorName?.toUpperCase() === 'SILVER') colorName = 'Silver';
              if (!ci.metalColorId && (!colorName || colorName.toLowerCase() === 'general' || colorName.toLowerCase() === 'default' || colorName.toLowerCase() === 'standard')) {
                colorName = 'General';
              }
              if (colorName) {
                loadedColors.push(colorName);
                mediaMap[colorName] = {
                  status: ci.status ?? 'active',
                  swatchIcon: ci.variantIcon?.url || ci.variantIcon || '',
                  media: Array.isArray(ci.images)
                    ? ci.images.map((img, idx) => ({
                        id: img._id || `img-${idx}`,
                        url: typeof img === 'string' ? img : img.url,
                        mediaType: img.mediaType || (img.url?.endsWith('.mp4') ? 'video' : 'image'),
                      }))
                    : [],
                };
              }
            });
            setVariantMedia((prev) => ({ ...prev, ...mediaMap }));
            if (loadedColors.length > 0) {
              setSelectedColors((prev) => Array.from(new Set([...prev, ...loadedColors])));
            }
          }

          // Populate Weights & Purities
          setWeights({
            grossWeight: Number(product.grossWt ?? product.specifications?.grossWeight ?? 0),
            netWeight: Number(product.specifications?.metalWeight ?? product.netWt ?? product.specifications?.netWeight ?? 0),
            purity: Number(product.purity ?? product.specifications?.metalPurity ?? 0),
            caratCategory: product.carat || product.specifications?.caratCategory || '',
          });

          // Populate Classification & ERP Details
          setErpDetails({
            customGroupName: product.ornate?.customGroupName || product.customGroupName || product.groupName || '',
            itemName: product.ornate?.itemCode || product.basicInfo?.title || '',
            groupName: product.ornate?.groupName || product.groupName || '',
            varietyName: product.varietyName || '',
            metalName: product.ornate?.metalName || '',
            uniqueLabelId: product.ornate?.itemCode || '',
            barcodeNumber: product.ornate?.barcode || product.barcodeNo || product.barcode || '',
            labelNumber: product.ornate?.tagNo || '',
            remark: product.ornate?.remark || product.remark || product.basicInfo?.remark || '',
            companyCode: product.ornate?.companyCode || product.companyCode || '',
            carat: product.ornate?.carat || product.carat || product.specifications?.caratCategory || '',
          });

          // Populate Images
          const imgs =
            (Array.isArray(product.ornate?.ornateImages) && product.ornate.ornateImages.length > 0 && product.ornate.ornateImages) ||
            [];
          setOrnateImages(
            imgs.map((img, i) => ({
              id: img._id || `img-${i}`,
              url: typeof img === 'string' ? img : img.url,
              isPrimary: i === 0,
            }))
          );

          // Populate Care Sections
          if (Array.isArray(product.descriptionSections) && product.descriptionSections.length > 0) {
            setCareSections(
              product.descriptionSections.map((sec, i) => ({
                id: sec._id || `sec-${i}`,
                header: sec.header || '',
                description: sec.description || '',
                showOnProductPage: sec.showOnProductPage !== false && sec.isVisible !== false,
              }))
            );
          }

          // Populate Specifications
          if (Array.isArray(product.productSpecifications) && product.productSpecifications.length > 0) {
            setSpecifications(
              product.productSpecifications.map((spec, i) => ({
                id: spec._id || `spec-${i}`,
                key: spec.key || '',
                value: spec.value || '',
              }))
            );
          }

          // Populate SEO
          setSeo({
            metaTitle: product.seo?.metaTitle || product.basicInfo?.title || '',
            keywords: product.seo?.keywords || '',
            metaDescription: product.seo?.metaDescription || product.basicInfo?.description || '',
          });
        }
      } catch (err) {
        console.error('Failed to load ornate product:', err);
        toast.error('Failed to load product details from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode]);

  // Recalculate formula helper values
  const markupAmount = useMemo(() => {
    const cost = Number(pricing.costPrice) || 0;
    const markup = Number(pricing.markupPercentage) || 0;
    return Math.round((cost * markup) / 100);
  }, [pricing.costPrice, pricing.markupPercentage]);

  const autoCalculatedPrice = useMemo(() => {
    const cost = Number(pricing.costPrice) || 0;
    return cost + markupAmount;
  }, [pricing.costPrice, markupAmount]);

  // Handle Cost Price or Markup change
  const handleCostOrMarkupChange = (field, value) => {
    const numVal = Number(value) || 0;
    setPricing((prev) => {
      const next = { ...prev, [field]: value };
      const cost = field === 'costPrice' ? numVal : Number(next.costPrice) || 0;
      const markup = field === 'markupPercentage' ? numVal : Number(next.markupPercentage) || 0;
      const calculated = cost > 0 ? cost + Math.round((cost * markup) / 100) : 0;
      next.calculatedPrice = calculated;
      // If sale price is equal to previous calculated or empty, keep in sync
      if (!prev.salePrice || Number(prev.salePrice) === Number(prev.calculatedPrice)) {
        next.salePrice = calculated;
        if (Number(prev.mrpMarkupPercentage) > 0) {
          next.mrp = Math.round(calculated * (1 + Number(prev.mrpMarkupPercentage) / 100));
        }
      }
      return next;
    });
  };

  // Helper to check if color is selected (case-insensitive)
  const isColorSelected = (colorName) => {
    return selectedColors.some(
      (c) => c?.toLowerCase() === colorName?.toLowerCase()
    );
  };

  // Toggle Color Variant Selection
  const handleToggleColor = (colorName) => {
    setSelectedColors((prev) => {
      const exists = prev.some((c) => c?.toLowerCase() === colorName?.toLowerCase());
      if (exists) {
        return prev.filter((c) => c?.toLowerCase() !== colorName?.toLowerCase());
      }
      return [...prev, colorName];
    });
  };

  // Toggle Variant Accordion Expansion (allows multiple open simultaneously)
  const handleToggleExpand = (colorName) => {
    setExpandedColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
        : [...prev, colorName]
    );
  };

  // Toggle All Variants Accordion
  const handleToggleAllExpand = () => {
    const allKeys = [...colorOptions.map((c) => c.name), 'General'];
    setExpandedColors((prev) =>
      prev.length >= allKeys.length ? [] : allKeys
    );
  };

  // Upload variant swatch icon (with upload-time compression)
  const handleSwatchUpload = async (colorName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSwatchColor(colorName);
      toast.loading(`Optimizing & uploading swatch...`, { id: `swatch-${colorName}` });
      const res = await uploadWithPresignedUrl(file, 'products', null, { productId: mediaProductId });
      if (res.fileUrl) {
        setVariantMedia((prev) => ({
          ...prev,
          [colorName]: {
            ...prev[colorName],
            swatchIcon: res.fileUrl,
            swatchIconKey: res.key,
          },
        }));
        setSelectedColors((prev) => Array.from(new Set([...prev, colorName])));
        const savingsText = res.wasCompressed ? ` (optimized ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)})` : '';
        toast.success(`${colorName} swatch icon uploaded${savingsText}!`, { id: `swatch-${colorName}` });
      }
    } catch (err) {
      console.error('Swatch icon upload failed:', err);
      toast.error(err.message || 'Failed to upload swatch icon', { id: `swatch-${colorName}` });
    } finally {
      setUploadingSwatchColor(null);
      e.target.value = '';
    }
  };

  // Upload variant images & videos (with upload-time compression)
  const handleVariantMediaUpload = async (colorName, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingVariantColor(colorName);
      toast.loading(`Optimizing & uploading ${files.length} media file(s)...`, { id: `vmed-${colorName}` });
      const uploadedList = [];

      for (const file of files) {
        const res = await uploadWithPresignedUrl(file, 'products', null, { productId: mediaProductId });
        if (res.fileUrl) {
          uploadedList.push({
            id: `vmed-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            url: res.fileUrl,
            key: res.key,
            mediaType: file.type.startsWith('video') || file.name.endsWith('.mp4') ? 'video' : 'image',
            name: res.name || file.name,
            size: res.size ? formatBytes(res.size) : undefined,
          });
        }
      }

      if (uploadedList.length > 0) {
        setVariantMedia((prev) => ({
          ...prev,
          [colorName]: {
            ...prev[colorName],
            media: [...(prev[colorName]?.media || []), ...uploadedList],
          },
        }));
        setSelectedColors((prev) => Array.from(new Set([...prev, colorName])));
        toast.success(`Uploaded & optimized ${uploadedList.length} media file(s) for ${colorName}!`, { id: `vmed-${colorName}` });
      }
    } catch (err) {
      console.error('Variant media upload failed:', err);
      toast.error(err.message || 'Failed to upload variant media', { id: `vmed-${colorName}` });
    } finally {
      setUploadingVariantColor(null);
      e.target.value = '';
    }
  };

  const handleRemoveSwatchIcon = async (colorName) => {
    try {
      await deleteUploadedFile({ key: variantMedia[colorName]?.swatchIconKey, url: variantMedia[colorName]?.swatchIcon });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete image from storage');
      return;
    }
    setVariantMedia((prev) => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        swatchIcon: '',
      },
    }));
    toast.success(`Removed swatch icon for ${colorName}`);
  };

  const handleRemoveVariantMedia = async (colorName, mediaId) => {
    const media = (variantMedia[colorName]?.media || []).find((item) => item.id === mediaId);
    try {
      await deleteUploadedFile(media);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete media from storage');
      return;
    }
    setVariantMedia((prev) => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        media: (prev[colorName]?.media || []).filter((m) => m.id !== mediaId),
      },
    }));
  };

  // Add Image via direct URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const newImg = {
      id: `img-${Date.now()}`,
      url: imageUrlInput.trim(),
      isPrimary: ornateImages.length === 0,
    };
    setOrnateImages((prev) => [...prev, newImg]);
    setImageUrlInput('');
    toast.success('Image added to gallery!');
  };

  // File upload for Images (supports multi-image upload & auto upload-time compression)
  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploadingImage(true);
      toast.loading(`Optimizing & uploading ${files.length} image(s)...`, { id: 'ornate-img-upload' });
      const newImages = [];

      for (const file of files) {
        const res = await uploadWithPresignedUrl(file, 'products', null, { productId: mediaProductId });
        if (res.fileUrl) {
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: res.fileUrl,
            key: res.key,
            isPrimary: ornateImages.length === 0 && newImages.length === 0,
            name: res.name || file.name,
            size: res.size ? formatBytes(res.size) : undefined,
          });
        }
      }

      if (newImages.length > 0) {
        setOrnateImages((prev) => [...prev, ...newImages]);
        toast.success(`Uploaded & optimized ${newImages.length} image(s)!`, { id: 'ornate-img-upload' });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Image upload failed. You can also paste an image URL directly.', { id: 'ornate-img-upload' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Remove Image
  const handleRemoveImage = async (imgId) => {
    const image = ornateImages.find((item) => item.id === imgId);
    try {
      await deleteUploadedFile(image);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete image from storage');
      return;
    }
    setOrnateImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imgId);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  // Set Primary Image
  const handleSetPrimaryImage = (imgId) => {
    setOrnateImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imgId,
      }))
    );
  };

  // Add Care Section
  const handleAddCareSection = () => {
    setCareSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        header: 'Care Instructions',
        description: '',
        showOnProductPage: true,
      },
    ]);
  };

  // Update Care Section
  const handleUpdateCareSection = (secId, field, val) => {
    setCareSections((prev) =>
      prev.map((sec) => (sec.id === secId ? { ...sec, [field]: val } : sec))
    );
  };

  // Remove Care Section
  const handleRemoveCareSection = (secId) => {
    setCareSections((prev) => prev.filter((sec) => sec.id !== secId));
  };

  // Move Care Section Up or Down
  const handleMoveCareSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= careSections.length) return;

    setCareSections((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  // Drag and Drop for Care Sections
  const handleCareDragStart = (e, index) => {
    setDraggedCareIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleCareDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCareIndex !== index) {
      setDragOverCareIndex(index);
    }
  };

  const handleCareDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedCareIndex === null || draggedCareIndex === targetIndex) {
      setDraggedCareIndex(null);
      setDragOverCareIndex(null);
      return;
    }

    setCareSections((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedCareIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDraggedCareIndex(null);
    setDragOverCareIndex(null);
  };

  const handleCareDragEnd = () => {
    setDraggedCareIndex(null);
    setDragOverCareIndex(null);
  };

  // Format Care Description text helper
  const handleFormatText = (sectionId, type) => {
    const textarea = document.getElementById(`care-desc-${sectionId}`);
    const section = careSections.find((s) => s.id === sectionId);
    if (!section) return;

    const text = section.description || '';
    const start = textarea?.selectionStart ?? text.length;
    const end = textarea?.selectionEnd ?? text.length;
    const selected = text.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    switch (type) {
      case 'bold':
        replacement = selected ? `**${selected}**` : '**bold text**';
        newCursorPos = selected ? end + 4 : start + 2;
        break;
      case 'italic':
        replacement = selected ? `*${selected}*` : '*italic text*';
        newCursorPos = selected ? end + 2 : start + 1;
        break;
      case 'underline':
        replacement = selected ? `<u>${selected}</u>` : '<u>underlined text</u>';
        newCursorPos = selected ? end + 7 : start + 3;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Heading'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'h4':
        replacement = `\n#### ${selected || 'Subheading'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'bullet': {
        const prefix = start === 0 || text[start - 1] === '\n' ? '• ' : '\n• ';
        replacement = prefix + (selected || '');
        newCursorPos = start + prefix.length + (selected ? selected.length : 0);
        break;
      }
      case 'number': {
        const prefix = start === 0 || text[start - 1] === '\n' ? '1. ' : '\n1. ';
        replacement = prefix + (selected || '');
        newCursorPos = start + prefix.length + (selected ? selected.length : 0);
        break;
      }
      case 'link': {
        const url = prompt('Enter link URL (e.g. https://...):', 'https://');
        if (!url) return;
        replacement = selected ? `[${selected}](${url})` : `[Link](${url})`;
        newCursorPos = start + replacement.length;
        break;
      }
      default:
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    handleUpdateCareSection(sectionId, 'description', newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Auto-bullet on Enter in Care Description textarea
  const handleKeyDownDescription = (e, sectionId) => {
    if (e.key === 'Enter') {
      const textarea = e.target;
      const val = textarea.value;
      const pos = textarea.selectionStart;
      const lastLineStart = val.lastIndexOf('\n', pos - 1) + 1;
      const currentLine = val.substring(lastLineStart, pos);

      if (currentLine.startsWith('• ')) {
        e.preventDefault();
        if (currentLine.trim() === '•') {
          // Clear empty bullet
          const nextVal = val.substring(0, lastLineStart) + val.substring(pos);
          handleUpdateCareSection(sectionId, 'description', nextVal);
          setTimeout(() => {
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
        } else {
          // Continue bullet on next line
          const nextVal = val.substring(0, pos) + '\n• ' + val.substring(pos);
          handleUpdateCareSection(sectionId, 'description', nextVal);
          setTimeout(() => {
            textarea.setSelectionRange(pos + 3, pos + 3);
          }, 0);
        }
      }
    }
  };

  // Add Specification
  const handleAddSpecification = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        id: `spec-${Date.now()}`,
        key: '',
        value: '',
      },
    ]);
  };

  // Update Specification
  const handleUpdateSpecification = (specId, field, val) => {
    setSpecifications((prev) =>
      prev.map((spec) => (spec.id === specId ? { ...spec, [field]: val } : spec))
    );
  };

  // Remove Specification
  const handleRemoveSpecification = (specId) => {
    setSpecifications((prev) => prev.filter((spec) => spec.id !== specId));
  };

  // Move Specification Up or Down
  const handleMoveSpecification = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= specifications.length) return;

    setSpecifications((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  // Save / Update Handler
  const handleSaveProduct = async (statusOverride = null) => {
    if (!baseInfo.title.trim()) {
      setActiveStep(1);
      toast.error('Please enter a Product Name (Storefront Title)');
      return;
    }

    try {
      setSaving(true);
      const activeStatus = statusOverride || baseInfo.status || 'draft';

      const payload = {
        ...(!isEditMode ? { _id: draftProductId } : {}),
        // Product identity and copy live in basicInfo.
        categoryIds: baseInfo.category ? [baseInfo.category] : [],
        promoBanner: baseInfo.categoryTag ? [baseInfo.categoryTag] : [],
        menuItemIds: baseInfo.menuItem,
        gender: baseInfo.targetGender ? [baseInfo.targetGender] : [],
        status: activeStatus,
        stockStatus: baseInfo.stockStatus || undefined,
        inapp: Boolean(baseInfo.showInApp),
        inweb: Boolean(baseInfo.showOnWeb),
        isOrnate: true,
        productType: 'silver',

        // Weights
        grossWt: Number(weights.grossWeight) || 0,
        netWt: Number(weights.netWeight) || 0,
        purity: Number(weights.purity) || 0,
        carat: weights.caratCategory || '',

        // ERP Details
        customGroupName: erpDetails.customGroupName || '',
        itemName: erpDetails.itemName || baseInfo.title,
        groupName: erpDetails.groupName || '',
        varietyName: erpDetails.varietyName || '',
        uniqueLabelID: erpDetails.uniqueLabelId || '',
        barcodeNo: erpDetails.barcodeNumber || '',
        barcode: erpDetails.barcodeNumber || '',
        labelNo: erpDetails.labelNumber || '',

        // Images
        ornateImages: ornateImages.map((img) => ({
          url: img.url,
          mediaType: 'image',
        })),

        // Care & Specs
        descriptionSections: careSections
          .filter((s) => s.header.trim() || s.description.trim())
          .map((s) => ({
            header: s.header.trim(),
            description: s.description.trim(),
            showOnProductPage: s.showOnProductPage !== false,
            isVisible: s.showOnProductPage !== false,
          })),

        productSpecifications: specifications
          .filter((s) => s.key.trim() || s.value.trim())
          .map((s) => ({
            key: s.key.trim(),
            value: s.value.trim(),
          })),

        // SEO
        seo: {
          metaTitle: seo.metaTitle || baseInfo.title,
          keywords: seo.keywords || '',
          metaDescription: seo.metaDescription || baseInfo.description,
        },

        // Color variants
        color: selectedColors.find((c) => c !== 'General') || selectedColors[0] || undefined,
        metalColorIds: selectedColors
          .map((cName) => {
            const matched = colorOptions.find((co) => co.name?.toLowerCase() === cName?.toLowerCase());
            return matched?.id;
          })
          .filter(Boolean),
        colorImages: Array.from(new Set([
          ...selectedColors,
          ...(variantMedia['General']?.media?.length > 0 || variantMedia['General']?.swatchIcon ? ['General'] : []),
        ])).map((cName) => {
          const vData = variantMedia[cName] || {};
          const matched = colorOptions.find((co) => co.name?.toLowerCase() === cName?.toLowerCase());
          return {
            status: vData.status ?? 'active',
            metalColorId: matched?.id || undefined,
            metalColorName: matched ? cName : undefined,
            variantIcon: vData.swatchIcon ? { url: vData.swatchIcon } : undefined,
            images: (vData.media || []).map((m) => ({
              url: typeof m === 'string' ? m : m.url,
              mediaType: m.mediaType || (m.url?.endsWith('.mp4') ? 'video' : 'image'),
            })),
          };
        }).filter((item) => item.metalColorId || item.images?.length > 0 || item.variantIcon),

        // Structured blocks sync
        basicInfo: {
          title: baseInfo.title.trim(),
          sku: erpDetails.labelNumber || erpDetails.uniqueLabelId || '',
          slug: seo.slug || baseInfo.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          description: baseInfo.description,
          ...(baseInfo.targetGender ? { gender: [baseInfo.targetGender] } : {}),
        },
        pricing: {
          mrp: Number(pricing.mrp) || Number(pricing.salePrice) || 0,
          salePrice: Number(pricing.salePrice) || 0,
          costPrice: Number(pricing.costPrice) || 0,
          ornatePrice: Number(pricing.ornatePrice) || Number(pricing.mrp) || Number(pricing.salePrice) || 0,
          markupPercentage: Number(pricing.markupPercentage) || 0,
          mrpMarkupPercentage: Number(pricing.mrpMarkupPercentage) || 0,
          calculatedPrice: Number(pricing.calculatedPrice) || 0,
        },
        specifications: { metalWeight: Number(weights.netWeight) || 0 },
        ornate: {
          tagNo: erpDetails.labelNumber || erpDetails.uniqueLabelId || '',
          barcode: erpDetails.barcodeNumber || '',
          itemCode: erpDetails.uniqueLabelId || '',
          customGroupName: erpDetails.customGroupName || '',
          companyCode: erpDetails.companyCode || '',
          carat: erpDetails.carat || weights.caratCategory || '',
          groupName: erpDetails.groupName || '',
          metalName: erpDetails.metalName || '',
          remark: erpDetails.remark || '',
          ornateImages: ornateImages.map((img) => ({
            url: img.url,
            mediaType: 'image',
          })),
        },
        remark: erpDetails.remark || '',
      };

      if (isEditMode) {
        await api.put(`/products/${id}`, payload);
        toast.success('Ornate ERP product updated successfully!');
      } else {
        const createRes = await api.post('/products', payload);
        const newId = createRes.data?.data?._id || createRes.data?._id;
        toast.success('New Ornate product created successfully!');
        if (newId) {
          navigate(`/catalog/ornate-products/edit/${newId}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Failed to save ornate product:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Stepper Tabs Definition
  const steps = [
    { num: 1, title: 'Base Information', subtitle: 'Title, category, story' },
    { num: 2, title: 'Pricing & Inventory', subtitle: 'Cost, markup, sale & MRP' },
    { num: 3, title: 'Variant Configuration', subtitle: 'Colors & swatches' },
    { num: 4, title: 'Weights & ERP Details', subtitle: 'Purity, weight, ERP codes' },
    { num: 5, title: 'Ornate Images', subtitle: 'Gallery & media' },
    { num: 6, title: 'Care & Specs', subtitle: 'Care info & specifications' },
    { num: 7, title: 'SEO Configuration', subtitle: 'Meta tags & keywords' },
  ];

  const handleNextStep = () => {
    if (activeStep < steps.length) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSaveProduct();
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/catalog/ornate-products');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-3 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-stone-600 tracking-wide uppercase">
          Loading Ornate ERP product details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 font-sans text-stone-800 animate-fadeIn">
      {/* ─── Top Bar (Title & Actions) ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/catalog/ornate-products')}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors shadow-2xs cursor-pointer"
            title="Back to Ornate Products"
          >
            <HiOutlineArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight">
                {isEditMode ? 'Refine the details of ERP product' : 'Add New Ornate Product'}
              </h1>
              {erpDetails.barcodeNumber && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70">
                  Barcode: {erpDetails.barcodeNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              ERP SKU: <span className="font-mono text-stone-700">{erpDetails.labelNumber || '—'}</span> &bull; Variety: <span className="text-stone-700">{erpDetails.varietyName || '—'}</span> &bull; Metal: <span className="text-stone-700">{erpDetails.metalName || '—'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end md:self-auto">
          <button
            type="button"
            onClick={() => handleSaveProduct('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 rounded-xl hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineDocumentText className="w-3.5 h-3.5 text-stone-500" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProduct()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{saving ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </div>

      {/* ─── Stepper Wizard Bar (Modern Tab-Wise Design) ───────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-2 sm:p-2.5 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 min-w-[700px] lg:min-w-0">
          {steps.map((s) => {
            const isActive = activeStep === s.num;
            const isCompleted = activeStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num)}
                className={`flex items-center gap-2 text-left p-1.5 rounded-xl transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#faf6f0] border border-[#e8ded1] shadow-2xs'
                    : 'hover:bg-stone-50 border border-transparent'
                }`}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#8b6f4e] text-white shadow-xs'
                      : isCompleted
                      ? 'bg-[#faf5ee] border border-[#d9c4a8] text-[#8b6f4e]'
                      : 'border border-stone-200 bg-stone-50 text-stone-400 group-hover:border-stone-300'
                  }`}
                >
                  {isCompleted ? <IoCheckmarkCircle className="w-3.5 h-3.5 text-[#8b6f4e]" /> : s.num}
                </div>

                {/* Title & Subtitle */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] font-bold truncate leading-tight ${
                      isActive ? 'text-[#8b6f4e]' : isCompleted ? 'text-stone-800' : 'text-stone-500'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[9.5px] text-stone-400 truncate leading-tight">
                    {s.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB CONTENT PANELS ─────────────────────────────────────── */}
      <div className="w-full space-y-4">

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: BASE INFORMATION
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 1 && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Base Information
                </h3>
                <p className="text-[11px] text-stone-400">
                  Define the customer-facing storefront title, category tagging, menu routing, and story.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Name (Storefront Title) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Product Name (Storefront Title) *
                </label>
                <input
                  type="text"
                  value={baseInfo.title}
                  onChange={(e) => setBaseInfo((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 92.5 BRACELET"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all font-semibold"
                />
              </div>

              {/* Category & Category Tag Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Category
                  </label>
                  <Dropdown
                    value={baseInfo.category}
                    onChange={(val) => {
                      setBaseInfo((prev) => ({ ...prev, category: val, menuItem: val === prev.category ? prev.menuItem : [] }));
                      if (val) setAutoOpenMenu(true);
                    }}
                    options={categories}
                    placeholder="Select Category"
                    size="sm"
                    buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Category Tag</span>
                  </label>
                  <Dropdown
                    value={baseInfo.categoryTag}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, categoryTag: val }))}
                    options={CATEGORY_TAG_OPTIONS}
                    placeholder="Select category tag"
                    size="sm"
                    buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
                  />
                </div>
              </div>

              {/* Menu Items, Gender, GST, Status, Stock Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Menu Items
                  </label>
                  <MenuItemSelect
                    key={baseInfo.category}
                    categoryId={baseInfo.category}
                    value={baseInfo.menuItem}
                    onChange={(value) => setBaseInfo((previous) => ({ ...previous, menuItem: value }))}
                    autoOpen={autoOpenMenu}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) setAutoOpenMenu(false);
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Target Gender
                  </label>
                  <Dropdown
                    value={baseInfo.targetGender}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, targetGender: val }))}
                    options={GENDER_OPTIONS}
                    placeholder="Select Gender"
                    size="sm"
                    buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Approval Status
                  </label>
                  <Dropdown
                    value={baseInfo.status}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, status: val }))}
                    options={STATUS_OPTIONS}
                    placeholder="Draft (Hidden)"
                    size="sm"
                    buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Stock Status
                  </label>
                  <Dropdown
                    value={baseInfo.stockStatus}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, stockStatus: val }))}
                    options={STOCK_STATUS_OPTIONS}
                    placeholder="Select stock status"
                    size="sm"
                    buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
                  />
                </div>
              </div>

              {/* Platform Visibility Checkboxes */}
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-stone-200/80 space-y-2">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Platform Visibility
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                    <input
                      type="checkbox"
                      checked={baseInfo.showInApp}
                      onChange={(e) =>
                        setBaseInfo((prev) => ({ ...prev, showInApp: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    />
                    <span>Show in App</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                    <input
                      type="checkbox"
                      checked={baseInfo.showOnWeb}
                      onChange={(e) =>
                        setBaseInfo((prev) => ({ ...prev, showOnWeb: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    />
                    <span>Show on Web</span>
                  </label>
                </div>
              </div>

              {/* Product Description / Story */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Product Description / Story
                </label>
                <textarea
                  rows={4}
                  value={baseInfo.description}
                  onChange={(e) => setBaseInfo((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the inspiration, craftsmanship, and elegance of this jewelry piece..."
                  className="w-full p-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: PRICING & INVENTORY
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 2 && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                ₹
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Pricing & Inventory
                </h3>
                <p className="text-[11px] text-stone-400">
                  Configure wholesale cost price, markup margin percentage, actual selling price, and customer list price.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Ornate Price, Cost Price, Markup %, Calculated Price, Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* 1. ORNATE PRICE (₹) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      ORNATE PRICE (₹)
                    </label>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-amber-300 text-amber-700 bg-amber-50 uppercase tracking-wider whitespace-nowrap">
                      SYNCED (LOCKED)
                    </span>
                  </div>
                  <input
                    type="number"
                    value={pricing.ornatePrice}
                    readOnly
                    disabled
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-stone-50/70 text-stone-700 cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Price from Ornate ERP (Read-only)</p>
                </div>

                {/* 2. COST PRICE (₹) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      COST PRICE (₹)
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium tracking-wide">(HIDDEN)</span>
                  </div>
                  <input
                    type="number"
                    value={pricing.costPrice}
                    onChange={(e) => handleCostOrMarkupChange('costPrice', e.target.value)}
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                {/* 3. MARKUP % */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      MARKUP %
                    </label>
                  </div>
                  <input
                    type="number"
                    value={pricing.markupPercentage}
                    onChange={(e) => handleCostOrMarkupChange('markupPercentage', e.target.value)}
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                {/* 4. CALCULATED PRICE (₹) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      CALCULATED PRICE (₹)
                    </label>
                  </div>
                  <input
                    type="number"
                    value={pricing.calculatedPrice}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, calculatedPrice: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-stone-50/70 text-stone-800 focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                {/* 5. SALE PRICE (₹) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      SALE PRICE (₹)
                    </label>
                  </div>
                  <input
                    type="number"
                    value={pricing.salePrice}
                    onChange={(e) => {
                      const sp = Number(e.target.value) || 0;
                      setPricing((prev) => ({
                        ...prev,
                        salePrice: e.target.value,
                        mrp: Number(prev.mrpMarkupPercentage) > 0 ? Math.round(sp * (1 + Number(prev.mrpMarkupPercentage) / 100)) : prev.mrp,
                      }));
                    }}
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] text-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Actual selling price</p>
                </div>
              </div>

              {/* Row 2: MRP Markup % and MRP Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    MRP Markup %
                  </label>
                  <input
                    type="number"
                    value={pricing.mrpMarkupPercentage}
                    onChange={(e) => {
                      const markupVal = Number(e.target.value) || 0;
                      setPricing((prev) => ({
                        ...prev,
                        mrpMarkupPercentage: markupVal,
                        mrp: markupVal > 0 ? Math.round(prev.salePrice * (1 + markupVal / 100)) : prev.mrp,
                      }));
                    }}
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    MRP Price (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.mrp}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, mrp: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                  <p className="text-[10px] text-stone-400">Customer list price (strikethrough)</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: VARIANT CONFIGURATION (COLORS)
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 3 && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
            {/* Header: Title, Description, and Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-base shadow-2xs">
                  <IoColorPaletteOutline className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                    Configure color variants
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500">
                    Select the colors available for this product, then add a swatch icon and images only where needed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleAllExpand}
                  className="px-2.5 py-1 text-xs font-semibold text-[#8b6f4e] hover:text-[#785e40] bg-[#faf5ee] hover:bg-[#f6eee2] border border-[#d9c4a8]/50 rounded-full transition-colors cursor-pointer shadow-2xs"
                >
                  {expandedColors.length >= colorOptions.length + 1 ? 'Collapse all media' : 'Expand all media'}
                </button>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/50 shadow-2xs">
                  {colorOptions.length} colors available
                </span>
              </div>
            </div>

            {/* 2-Column Grid of Variant Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {colorOptions.map((col) => {
                const isSelected = isColorSelected(col.name);
                const isExpanded = expandedColors.includes(col.name);
                const vData = variantMedia[col.name] || { swatchIcon: '', media: [] };
                const mediaCount = vData.media?.length || 0;
                const isUploadingSwatch = uploadingSwatchColor === col.name;
                const isUploadingMedia = uploadingVariantColor === col.name;

                return (
                  <div
                    key={col.name}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isExpanded
                        ? 'border-[#cbb393] bg-[#fcf9f4] shadow-xs'
                        : isSelected
                        ? 'border-[#e4d7c8] bg-[#fdfbf7] hover:border-[#cbb393]'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {/* Card Top Row */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      {/* Left side: Checkbox + 3D Swatch Sphere + Color Name + Selected Badge */}
                      <div
                        onClick={() => handleToggleColor(col.name)}
                        className="flex items-center gap-3 cursor-pointer select-none min-w-0"
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? 'bg-[#78532f] text-white shadow-2xs'
                              : 'border-2 border-stone-300 bg-white hover:border-[#8b6f4e]'
                          }`}
                        >
                          {isSelected && <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {/* 3D Realistic Sphere Swatch */}
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 transition-transform hover:scale-105"
                          style={{
                            background: col.sphereGradient,
                            boxShadow: col.sphereShadow,
                          }}
                        />

                        {/* Color Name */}
                        <span className="text-sm font-bold text-stone-900 truncate">
                          {col.name}
                        </span>

                        {/* Selected Pill Badge */}
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f7ee] text-[#1b7a43] border border-[#c4ebd1]/60 shrink-0">
                            Selected
                          </span>
                        )}
                      </div>

                      <ColorStatusToggle name={col.name} disabled={!isSelected} status={variantMedia[col.name]?.status} onChange={(status) => setVariantMedia((previous) => ({ ...previous, [col.name]: { ...previous[col.name], status } }))} />
                      {/* Right side: Manage media button with chevron */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(col.name);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#8b6f4e] transition-colors py-1 px-2 rounded-lg hover:bg-stone-100/60 cursor-pointer shrink-0"
                      >
                        <HiOutlinePhotograph className="w-4 h-4 text-[#8b6f4e]" />
                        <span>Manage media ({mediaCount})</span>
                        {isExpanded ? (
                          <HiOutlineChevronUp className="w-4 h-4 text-stone-500" />
                        ) : (
                          <HiOutlineChevronRight className="w-4 h-4 text-stone-500" />
                        )}
                      </button>
                    </div>

                    {/* Accordion Expand Area */}
                    {isExpanded && (
                      <div className="px-3.5 pb-4 pt-3.5 border-t border-[#ebdccf]/80 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
                          {/* ── Sub-card 1: Variant swatch icon ── */}
                          <div className="w-full sm:w-[38%] shrink-0 flex flex-col space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800">
                                Variant swatch icon
                              </span>
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-stone-400 text-[9px] font-bold text-stone-400 select-none cursor-help"
                                title="Upload a custom icon or texture for this variant swatch"
                              >
                                ?
                              </span>
                            </div>

                            <input
                              id={`swatch-upload-${col.name}`}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={(e) => handleSwatchUpload(col.name, e)}
                            />

                            {vData.swatchIcon ? (
                              <div className="border border-stone-200 bg-white rounded-xl p-2.5 flex items-center justify-between gap-2 min-h-[110px] h-full shadow-2xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={vData.swatchIcon}
                                    alt={`${col.name} Swatch`}
                                    className="w-12 h-12 object-cover rounded-lg border border-stone-100 shadow-2xs shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-stone-800 truncate">
                                      Custom Swatch
                                    </p>
                                    <span className="text-[10px] text-stone-400">
                                      Active icon
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      document.getElementById(`swatch-upload-${col.name}`)?.click()
                                    }
                                    className="p-1.5 text-stone-500 hover:text-[#8b6f4e] rounded-lg hover:bg-stone-50 cursor-pointer"
                                    title="Change icon"
                                  >
                                    <HiOutlineRefresh className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSwatchIcon(col.name)}
                                    className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                                    title="Remove icon"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  document.getElementById(`swatch-upload-${col.name}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
                                  isUploadingSwatch ? 'opacity-60 pointer-events-none' : ''
                                }`}
                              >
                                {isUploadingSwatch ? (
                                  <div className="w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mb-1.5" />
                                ) : (
                                  <HiOutlineUpload className="w-5 h-5 text-[#8b6f4e] mb-1.5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-xs font-semibold text-stone-800">
                                  {isUploadingSwatch ? 'Uploading...' : 'Upload icon'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* ── Sub-card 2: Product images & videos ── */}
                          <div className="w-full sm:flex-1 flex flex-col space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800">
                                Product images &amp; videos
                              </span>
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-stone-400 text-[9px] font-bold text-stone-400 select-none cursor-help"
                                title="Upload product photos and MP4 videos specifically for this color finish"
                              >
                                ?
                              </span>
                            </div>

                            <input
                              id={`media-upload-${col.name}`}
                              type="file"
                              accept="image/*,video/mp4"
                              multiple
                              className="hidden"
                              onChange={(e) => handleVariantMediaUpload(col.name, e)}
                            />

                            {vData.media && vData.media.length > 0 ? (
                              <div className="border border-stone-200 bg-white rounded-xl p-2.5 min-h-[110px] h-full flex flex-col justify-between shadow-2xs space-y-2">
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto">
                                  {vData.media.map((m, idx) => (
                                    <div
                                      key={m.id || idx}
                                      className="relative group rounded-lg overflow-hidden border border-stone-200 aspect-square bg-stone-100"
                                    >
                                      {m.mediaType === 'video' || m.url?.endsWith('.mp4') ? (
                                        <video
                                          src={m.url}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <img
                                          src={m.url}
                                          alt={`${col.name} ${idx + 1}`}
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          title="Click to zoom in"
                                          onClick={() => {
                                            const imageGallery = (vData.media || [])
                                              .filter((item) => item.mediaType !== 'video' && !item.url?.endsWith('.mp4'))
                                              .map((item) => item.url);
                                            handleOpenImagePreview(m.url, imageGallery);
                                          }}
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveVariantMedia(col.name, m.id);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Delete media"
                                      >
                                        <HiOutlineTrash className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}

                                  <div
                                    onClick={() =>
                                      document.getElementById(`media-upload-${col.name}`)?.click()
                                    }
                                    className="border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors rounded-lg flex flex-col items-center justify-center text-center cursor-pointer aspect-square"
                                  >
                                    <HiOutlinePlus className="w-4 h-4 text-[#8b6f4e]" />
                                    <span className="text-[10px] font-semibold text-stone-700 mt-0.5">
                                      Add
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                                  <span>{vData.media.length} media item(s)</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      document.getElementById(`media-upload-${col.name}`)?.click()
                                    }
                                    className="text-[#8b6f4e] hover:underline font-semibold cursor-pointer"
                                  >
                                    + Upload more
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  document.getElementById(`media-upload-${col.name}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
                                  isUploadingMedia ? 'opacity-60 pointer-events-none' : ''
                                }`}
                              >
                                {isUploadingMedia ? (
                                  <div className="w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mb-1.5" />
                                ) : (
                                  <HiOutlineUpload className="w-5 h-5 text-[#8b6f4e] mb-1.5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-xs font-semibold text-stone-800">
                                  {isUploadingMedia ? 'Uploading media...' : 'Upload images / videos'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── 4th Box: General Images (No Metal Color) ── */}
              {(() => {
                const colName = 'General';
                const isSelected = isColorSelected(colName);
                const isExpanded = expandedColors.includes(colName);
                const vData = variantMedia[colName] || { swatchIcon: '', media: [] };
                const mediaCount = vData.media?.length || 0;
                const isUploadingSwatch = uploadingSwatchColor === colName;
                const isUploadingMedia = uploadingVariantColor === colName;

                return (
                  <div
                    key={colName}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isExpanded
                        ? 'border-[#cbb393] bg-[#fcf9f4] shadow-xs'
                        : isSelected
                        ? 'border-[#e4d7c8] bg-[#fdfbf7] hover:border-[#cbb393]'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {/* Card Top Row */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      {/* Left side: Checkbox + Swatch Sphere + Name + Selected Badge */}
                      <div
                        onClick={() => handleToggleColor(colName)}
                        className="flex items-center gap-3 cursor-pointer select-none min-w-0"
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? 'bg-[#78532f] text-white shadow-2xs'
                              : 'border-2 border-stone-300 bg-white hover:border-[#8b6f4e]'
                          }`}
                        >
                          {isSelected && <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {/* 3D Realistic Sphere Swatch (Neutral / Universal Platinum-Slate) */}
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 transition-transform hover:scale-105"
                          style={{
                            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 55%, #64748b 100%)',
                            boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.18), 1px 2px 4px rgba(0,0,0,0.12)',
                          }}
                        />

                        {/* Color / Variant Name */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-stone-900 truncate">
                            General Images
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            (No metal color)
                          </span>
                        </div>

                        {/* Selected Pill Badge */}
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f7ee] text-[#1b7a43] border border-[#c4ebd1]/60 shrink-0">
                            Selected
                          </span>
                        )}
                      </div>

                      <ColorStatusToggle name={colName} disabled={!isSelected} status={variantMedia[colName]?.status} onChange={(status) => setVariantMedia((previous) => ({ ...previous, [colName]: { ...previous[colName], status } }))} />
                      {/* Right side: Manage media button with chevron */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(colName);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#8b6f4e] transition-colors py-1 px-2 rounded-lg hover:bg-stone-100/60 cursor-pointer shrink-0"
                      >
                        <HiOutlinePhotograph className="w-4 h-4 text-[#8b6f4e]" />
                        <span>Manage media ({mediaCount})</span>
                        {isExpanded ? (
                          <HiOutlineChevronUp className="w-4 h-4 text-stone-500" />
                        ) : (
                          <HiOutlineChevronRight className="w-4 h-4 text-stone-500" />
                        )}
                      </button>
                    </div>

                    {/* Accordion Expand Area */}
                    {isExpanded && (
                      <div className="px-3.5 pb-4 pt-3.5 border-t border-[#ebdccf]/80 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
                          {/* ── Sub-card 1: Variant swatch icon ── */}
                          <div className="w-full sm:w-[38%] shrink-0 flex flex-col space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800">
                                Variant swatch icon
                              </span>
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-stone-400 text-[9px] font-bold text-stone-400 select-none cursor-help"
                                title="Upload a custom icon or texture for general / unassigned media"
                              >
                                ?
                              </span>
                              <span className="text-[9.5px] text-emerald-600 font-medium ml-auto">
                                Auto-compressed
                              </span>
                            </div>

                            <input
                              id={`swatch-upload-${colName}`}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={(e) => handleSwatchUpload(colName, e)}
                            />

                            {vData.swatchIcon ? (
                              <div className="border border-stone-200 bg-white rounded-xl p-2.5 flex items-center justify-between gap-2 min-h-[110px] h-full shadow-2xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={vData.swatchIcon}
                                    alt="General Swatch"
                                    className="w-12 h-12 object-cover rounded-lg border border-stone-100 shadow-2xs shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-stone-800 truncate">
                                      Custom Swatch
                                    </p>
                                    <span className="text-[10px] text-stone-400">
                                      Active icon
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      document.getElementById(`swatch-upload-${colName}`)?.click()
                                    }
                                    className="p-1.5 text-stone-500 hover:text-[#8b6f4e] rounded-lg hover:bg-stone-50 cursor-pointer"
                                    title="Change icon"
                                  >
                                    <HiOutlineRefresh className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSwatchIcon(colName)}
                                    className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                                    title="Remove icon"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  document.getElementById(`swatch-upload-${colName}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
                                  isUploadingSwatch ? 'opacity-60 pointer-events-none' : ''
                                }`}
                              >
                                {isUploadingSwatch ? (
                                  <div className="w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mb-1.5" />
                                ) : (
                                  <HiOutlineUpload className="w-5 h-5 text-[#8b6f4e] mb-1.5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-xs font-semibold text-stone-800">
                                  {isUploadingSwatch ? 'Uploading...' : 'Upload icon'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* ── Sub-card 2: Product images & videos ── */}
                          <div className="w-full sm:flex-1 flex flex-col space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800">
                                Product images &amp; videos
                              </span>
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-stone-400 text-[9px] font-bold text-stone-400 select-none cursor-help"
                                title="Upload product photos and MP4 videos for general view without assigning a metal color"
                              >
                                ?
                              </span>
                              <span className="text-[9.5px] text-emerald-600 font-medium ml-auto">
                                Auto-compressed
                              </span>
                            </div>

                            <input
                              id={`media-upload-${colName}`}
                              type="file"
                              accept="image/*,video/mp4"
                              multiple
                              className="hidden"
                              onChange={(e) => handleVariantMediaUpload(colName, e)}
                            />

                            {vData.media && vData.media.length > 0 ? (
                              <div className="border border-stone-200 bg-white rounded-xl p-2.5 min-h-[110px] h-full flex flex-col justify-between shadow-2xs space-y-2">
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto">
                                  {vData.media.map((m, idx) => (
                                    <div
                                      key={m.id || idx}
                                      className="relative group rounded-lg overflow-hidden border border-stone-200 aspect-square bg-stone-100"
                                    >
                                      {m.mediaType === 'video' || m.url?.endsWith('.mp4') ? (
                                        <video
                                          src={m.url}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <img
                                          src={m.url}
                                          alt={`General ${idx + 1}`}
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          title="Click to zoom in"
                                          onClick={() => {
                                            const imageGallery = (vData.media || [])
                                              .filter((item) => item.mediaType !== 'video' && !item.url?.endsWith('.mp4'))
                                              .map((item) => item.url);
                                            handleOpenImagePreview(m.url, imageGallery);
                                          }}
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveVariantMedia(colName, m.id);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Delete media"
                                      >
                                        <HiOutlineTrash className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}

                                  <div
                                    onClick={() =>
                                      document.getElementById(`media-upload-${colName}`)?.click()
                                    }
                                    className="border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors rounded-lg flex flex-col items-center justify-center text-center cursor-pointer aspect-square"
                                  >
                                    <HiOutlinePlus className="w-4 h-4 text-[#8b6f4e]" />
                                    <span className="text-[10px] font-semibold text-stone-700 mt-0.5">
                                      Add
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                                  <span>{vData.media.length} media item(s)</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      document.getElementById(`media-upload-${colName}`)?.click()
                                    }
                                    className="text-[#8b6f4e] hover:underline font-semibold cursor-pointer"
                                  >
                                    + Upload more
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  document.getElementById(`media-upload-${colName}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
                                  isUploadingMedia ? 'opacity-60 pointer-events-none' : ''
                                }`}
                              >
                                {isUploadingMedia ? (
                                  <div className="w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mb-1.5" />
                                ) : (
                                  <HiOutlineUpload className="w-5 h-5 text-[#8b6f4e] mb-1.5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-xs font-semibold text-stone-800">
                                  {isUploadingMedia ? 'Uploading media...' : 'Upload images / videos'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: WEIGHTS & ERP DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Sub-block A: Weights & Purities */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  <TbScale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Weights & Purities
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Gross and net metal mass with purity specifications.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Gross Weight (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weights.grossWeight}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, grossWeight: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Net Weight (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weights.netWeight}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, netWeight: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Purity (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weights.purity}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, purity: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Carat Category
                  </label>
                  <input
                    type="text"
                    value={weights.caratCategory}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, caratCategory: e.target.value }))
                    }
                    placeholder="e.g. 925SL or 18KT"
                    className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>
            </div>

            {/* Sub-block B: Classification & ERP Details */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  <TbDatabase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Classification & ERP Details
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Master identifiers and synchronized inventory attributes from Ornate NX ERP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Custom Group Name
                  </label>
                  <input
                    type="text"
                    value={erpDetails.customGroupName}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, customGroupName: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Item Name (ERP)
                  </label>
                  <input
                    type="text"
                    value={erpDetails.itemName}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, itemName: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Group Name (ERP)
                  </label>
                  <input
                    type="text"
                    value={erpDetails.groupName}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, groupName: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Variety Name (ERP)
                  </label>
                  <input
                    type="text"
                    value={erpDetails.varietyName}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, varietyName: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Metal Name (ERP)
                  </label>
                  <input
                    type="text"
                    value={erpDetails.metalName}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, metalName: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Unique ERP Label ID
                  </label>
                  <input
                    type="text"
                    value={erpDetails.uniqueLabelId}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, uniqueLabelId: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Barcode Number
                  </label>
                  <input
                    type="text"
                    value={erpDetails.barcodeNumber}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, barcodeNumber: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs font-mono font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] text-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Label Number (ERP)
                  </label>
                  <input
                    type="text"
                    value={erpDetails.labelNumber}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, labelNumber: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Company Code
                  </label>
                  <input
                    type="text"
                    value={erpDetails.companyCode}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, companyCode: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    ERP Remark / Notes
                  </label>
                  <input
                    type="text"
                    value={erpDetails.remark}
                    onChange={(e) =>
                      setErpDetails((prev) => ({ ...prev, remark: e.target.value }))
                    }
                    placeholder="Enter remark or ERP notes..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: ORNATE IMAGES
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 5 && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  <HiOutlinePhotograph className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Ornate Images
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Product gallery synchronized from ERP FTP & uploaded to Cloudflare R2 bucket.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70" title="All uploaded photos are automatically optimized to high-fidelity WebP at upload time">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Compression Active
                </span>
                <label
                  htmlFor="ornate-gallery-upload-input"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#faf5ee] text-[#8b6f4e] hover:bg-[#f3ebd9] border border-[#d9c4a8]/70 transition-all cursor-pointer ${
                    uploadingImage ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <HiOutlineUpload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Optimizing & Uploading...' : 'Upload Images'}</span>
                  <input
                    id="ornate-gallery-upload-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                  {ornateImages.length} Image{ornateImages.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Images Grid (Display-Only Synchronized Gallery) */}
            {ornateImages.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60">
                <HiOutlinePhotograph className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-600">No synchronized ERP gallery images found</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Images are automatically synchronized from the ERP FTP system or uploaded above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {ornateImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl overflow-hidden border border-stone-200/90 bg-stone-50 aspect-square shadow-2xs cursor-pointer"
                      onClick={() => {
                        const gallery = ornateImages.map((x) => x.url);
                        handleOpenImagePreview(img.url, gallery);
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`Ornate product ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Primary Badge */}
                      {img.isPrimary && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8b6f4e] text-white shadow-xs">
                          Primary
                        </span>
                      )}

                      {/* Hover Overlay Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const gallery = ornateImages.map((x) => x.url);
                            handleOpenImagePreview(img.url, gallery);
                          }}
                          title="Preview Image"
                          className="w-7 h-7 rounded-lg bg-white/90 text-stone-800 hover:bg-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5" />
                        </button>
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryImage(img.id);
                          }}
                          title="Set as Primary"
                          className="w-7 h-7 rounded-lg bg-[#8b6f4e] text-white hover:bg-[#785e40] flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                        title="Delete image"
                        className="w-7 h-7 rounded-lg bg-red-600/90 text-white hover:bg-red-600 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 6: CARE & SPECIFICATIONS
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 6 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Sub-block A: Product Information & Care Sections */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                    <HiOutlineDocumentText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900">
                        Product Information & Care Sections
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                        {careSections.length} Added
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCareSection}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Section</span>
                </button>
              </div>

              {careSections.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-stone-200 bg-[#faf8f5]">
                  <p className="text-xs text-stone-500 font-medium">
                    No custom header & description sections added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {careSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={(e) => handleCareDragStart(e, idx)}
                      onDragOver={(e) => handleCareDragOver(e, idx)}
                      onDrop={(e) => handleCareDrop(e, idx)}
                      onDragEnd={handleCareDragEnd}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 space-y-3 relative shadow-2xs ${
                        draggedCareIndex === idx
                          ? 'opacity-40 border-dashed border-[#8b6f4e] bg-stone-100 scale-[0.99]'
                          : dragOverCareIndex === idx
                          ? 'border-2 border-[#8b6f4e] bg-[#faf5ee] shadow-md'
                          : 'border-stone-200/90 bg-[#faf8f5]'
                      }`}
                    >
                      {/* Top Header Row: Grip Handle & Up/Down, Title Input, Show on Product Page Toggle, Delete Button */}
                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        {/* Grip Handle & Up/Down Buttons */}
                        <div className="flex items-center gap-1 shrink-0 bg-white border border-stone-200/90 px-1.5 py-1 rounded-xl shadow-2xs">
                          {/* 6-dots Grip Handle */}
                          <div
                            title="Drag to reorder section"
                            className="text-stone-400 hover:text-[#8b6f4e] cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-stone-100 transition-colors"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <circle cx="7" cy="5" r="1.5" />
                              <circle cx="13" cy="5" r="1.5" />
                              <circle cx="7" cy="10" r="1.5" />
                              <circle cx="13" cy="10" r="1.5" />
                              <circle cx="7" cy="15" r="1.5" />
                              <circle cx="13" cy="15" r="1.5" />
                            </svg>
                          </div>

                          {/* Quick Up/Down Buttons */}
                          <div className="flex flex-col -space-y-0.5 pl-1 border-l border-stone-200">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveCareSection(idx, -1);
                              }}
                              title="Move section up"
                              className="w-5 h-4 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] hover:bg-stone-100 rounded transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                            >
                              <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={idx === careSections.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveCareSection(idx, 1);
                              }}
                              title="Move section down"
                              className="w-5 h-4 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] hover:bg-stone-100 rounded transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                            >
                              <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Title Input */}
                        <input
                          type="text"
                          value={sec.header}
                          onChange={(e) =>
                            handleUpdateCareSection(sec.id, 'header', e.target.value)
                          }
                          placeholder='Section Title (e.g. "Care Instructions", "Packaging")'
                          className="flex-1 min-w-[200px] h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-800 placeholder-stone-400 shadow-2xs"
                        />

                        {/* Right Controls: Show on Product Page Switch & Delete Button */}
                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                          {/* Show on Product Page Switch */}
                          <div className="flex items-center gap-2 select-none">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={sec.showOnProductPage !== false}
                              onClick={() =>
                                handleUpdateCareSection(
                                  sec.id,
                                  'showOnProductPage',
                                  sec.showOnProductPage === false ? true : false
                                )
                              }
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                                sec.showOnProductPage !== false ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  sec.showOnProductPage !== false ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className="text-xs font-semibold text-stone-600">
                              Show on Product Page
                            </span>
                          </div>

                          {/* Delete Trash Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCareSection(sec.id)}
                            title="Delete section"
                            className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <HiOutlineTrash className="w-4 h-4 stroke-[1.8]" />
                          </button>
                        </div>
                      </div>

                      {/* Full-Width Formatted Content Editor */}
                      <div className="w-full rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                        {/* Editor Toolbar */}
                        <div className="border-b border-stone-200/80 bg-[#fbf9f6] px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
                          {/* Style selector */}
                          <div className="relative inline-flex items-center">
                            <select
                              aria-label="Text Style"
                              defaultValue="normal"
                              onChange={(e) => {
                                handleFormatText(sec.id, e.target.value);
                                e.target.value = 'normal';
                              }}
                              className="h-7 pl-2.5 pr-6 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e] cursor-pointer appearance-none"
                            >
                              <option value="normal">Normal</option>
                              <option value="h3">Heading</option>
                              <option value="h4">Subheading</option>
                            </select>
                            <span className="pointer-events-none absolute right-2 text-stone-400 text-[10px]">▼</span>
                          </div>

                          <div className="w-[1px] h-4 bg-stone-200 mx-1" />

                          {/* Bold */}
                          <button
                            type="button"
                            title="Bold"
                            onClick={() => handleFormatText(sec.id, 'bold')}
                            className="w-7 h-7 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            B
                          </button>

                          {/* Italic */}
                          <button
                            type="button"
                            title="Italic"
                            onClick={() => handleFormatText(sec.id, 'italic')}
                            className="w-7 h-7 rounded-lg text-xs italic text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            I
                          </button>

                          {/* Underline */}
                          <button
                            type="button"
                            title="Underline"
                            onClick={() => handleFormatText(sec.id, 'underline')}
                            className="w-7 h-7 rounded-lg text-xs underline text-stone-700 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            U
                          </button>

                          <div className="w-[1px] h-4 bg-stone-200 mx-1" />

                          {/* Bullet List */}
                          <button
                            type="button"
                            title="Bullet List"
                            onClick={() => handleFormatText(sec.id, 'bullet')}
                            className="w-7 h-7 rounded-lg text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="9" y1="6" x2="20" y2="6" />
                              <line x1="9" y1="12" x2="20" y2="12" />
                              <line x1="9" y1="18" x2="20" y2="18" />
                              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
                              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
                              <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
                            </svg>
                          </button>

                          {/* Numbered List */}
                          <button
                            type="button"
                            title="Numbered List"
                            onClick={() => handleFormatText(sec.id, 'number')}
                            className="w-7 h-7 rounded-lg text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="10" y1="6" x2="21" y2="6" />
                              <line x1="10" y1="12" x2="21" y2="12" />
                              <line x1="10" y1="18" x2="21" y2="18" />
                              <text x="2" y="7" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">1</text>
                              <text x="2" y="13" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">2</text>
                              <text x="2" y="19" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">3</text>
                            </svg>
                          </button>

                          {/* Insert Link */}
                          <button
                            type="button"
                            title="Insert Link"
                            onClick={() => handleFormatText(sec.id, 'link')}
                            className="w-7 h-7 rounded-lg text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <HiOutlineLink className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Editor Textarea */}
                        <textarea
                          id={`care-desc-${sec.id}`}
                          rows={5}
                          value={sec.description}
                          onChange={(e) =>
                            handleUpdateCareSection(sec.id, 'description', e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDownDescription(e, sec.id)}
                          placeholder="To keep your jewellery looking beautiful for years:&#10;• Avoid contact with water, perfumes, and harsh chemicals.&#10;• Store in a soft pouch or jewellery box.&#10;• Clean gently with a soft, dry cloth after every use.&#10;• Keep away from direct sunlight and moisture."
                          className="w-full p-3.5 text-xs text-stone-800 leading-relaxed bg-white focus:outline-none resize-y min-h-[120px] font-sans"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-block B: Product Specifications */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                    <TbListDetails className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900">
                        Product Specifications
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                        {specifications.length} Added
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSpecification}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Specification</span>
                </button>
              </div>

              {specifications.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-stone-200 bg-[#faf8f5]">
                  <p className="text-xs text-stone-500 font-medium">
                    No product specifications added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {specifications.map((spec, sIdx) => (
                    <div key={spec.id} className="flex items-center gap-2.5">
                      {/* Move Up/Down Controls for Specifications */}
                      <div className="flex flex-col -space-y-0.5 bg-white border border-stone-200/90 px-1 py-0.5 rounded-lg shrink-0 shadow-2xs">
                        <button
                          type="button"
                          disabled={sIdx === 0}
                          onClick={() => handleMoveSpecification(sIdx, -1)}
                          title="Move specification up"
                          className="w-4 h-3.5 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] rounded disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                        >
                          <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={sIdx === specifications.length - 1}
                          onClick={() => handleMoveSpecification(sIdx, 1)}
                          title="Move specification down"
                          className="w-4 h-3.5 flex items-center justify-center text-stone-400 hover:text-[#8b6f4e] rounded disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                        >
                          <svg className="w-2.5 h-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleUpdateSpecification(spec.id, 'key', e.target.value)}
                        placeholder="Specification Name (e.g. Clasp Type, Dimensions)"
                        className="flex-1 h-10 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-800 placeholder-stone-400 shadow-2xs"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleUpdateSpecification(spec.id, 'value', e.target.value)}
                        placeholder="Value (e.g. Lobster Clasp, 7.5 Inches)"
                        className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 text-stone-800 placeholder-stone-400 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecification(spec.id)}
                        title="Remove specification"
                        className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      >
                        <HiOutlineTrash className="w-4 h-4 stroke-[1.8]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 7: SEO CONFIGURATION
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 7 && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                <HiOutlineSparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  SEO Configuration
                </h3>
                <p className="text-[11px] text-stone-400">
                  Optimize organic discovery, keywords, and metadata tags for this jewellery item.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-5">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Meta Title
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {seo.metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="e.g. 92.5 Silver Handcrafted Bracelet | Neirah Fine Jewellery"
                    className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-5">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Keywords
                    </label>
                    <span className="text-[10px] text-stone-400">
                      Comma separated
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seo.keywords}
                    onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
                    placeholder="silver bracelet, 925 silver, handmade jewellery"
                    className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between h-5">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Meta Description
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {seo.metaDescription.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seo.metaDescription}
                  onChange={(e) => setSeo((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Brief summary for Google search results..."
                  className="w-full p-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── Bottom Navigation Bar (Sticky Footer) ──────────────────── */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 active:scale-[0.98] transition-all cursor-pointer"
        >
          <HiOutlineArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{activeStep === 1 ? 'Back to List' : 'Previous Tab'}</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-500">
          <span>Step {activeStep} of {steps.length} &bull;</span>
          <span className="text-[#8b6f4e] font-bold">{steps[activeStep - 1]?.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {activeStep < steps.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>Next: {steps[activeStep]?.title}</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveProduct()}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Publish Product'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Image Zoom Preview Modal with - / + Controls ───────────── */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fadeIn select-none"
          onClick={handleCloseImagePreview}
        >
          {/* Top Bar: Counter / Instructions & Close Button */}
          <div
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-white z-20 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/10 border border-white/15 backdrop-blur-md text-stone-200">
                {previewModalGallery.length > 1
                  ? `Image ${previewModalIndex + 1} of ${previewModalGallery.length}`
                  : 'Image Preview'}
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline">
                Scroll or use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-stone-200 text-[11px]">-</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-stone-200 text-[11px]">+</kbd> to zoom &bull; Drag to pan
              </span>
            </div>

            <button
              type="button"
              onClick={handleCloseImagePreview}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg border border-white/15"
              title="Close (Esc)"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Image Viewport / Canvas */}
          <div
            className="relative w-full max-w-5xl h-[72vh] sm:h-[78vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handlePreviewMouseDown}
            onMouseMove={handlePreviewMouseMove}
            onMouseUp={handlePreviewMouseUp}
            onMouseLeave={handlePreviewMouseUp}
            onWheel={handlePreviewWheel}
          >
            {/* Gallery Navigation: Previous */}
            {previewModalGallery.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPreviewImage}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xl border border-white/20 active:scale-95"
                title="Previous image (Left Arrow)"
              >
                <HiOutlineChevronLeft className="w-6 h-6 stroke-[2.2]" />
              </button>
            )}

            {/* Gallery Navigation: Next */}
            {previewModalGallery.length > 1 && (
              <button
                type="button"
                onClick={handleNextPreviewImage}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xl border border-white/20 active:scale-95"
                title="Next image (Right Arrow)"
              >
                <HiOutlineChevronRight className="w-6 h-6 stroke-[2.2]" />
              </button>
            )}

            {/* Scaled & Panned Image */}
            <div
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
                cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (zoomScale > 1) {
                  handleResetZoom();
                } else {
                  setZoomScale(2);
                }
              }}
              className="flex items-center justify-center max-w-full max-h-full"
            >
              <img
                src={previewModalImage}
                alt="Product Preview"
                draggable={false}
                className="max-w-[85vw] max-h-[68vh] object-contain rounded-xl shadow-2xl pointer-events-none"
              />
            </div>

            {/* Floating Zoom Bar with - and + buttons */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-stone-900/90 border border-white/15 text-white shadow-2xl backdrop-blur-md max-w-[calc(100vw-2rem)] overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zoom Out Button (-) */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 0.5}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out (-)"
              >
                <HiOutlineMinus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Reset / Percentage Display */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2.5 h-8 rounded-xl hover:bg-white/15 text-xs font-mono font-semibold text-stone-200 flex items-center justify-center cursor-pointer transition-colors"
                title="Click to reset (100%)"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              {/* Zoom In Button (+) */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 4}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom In (+)"
              >
                <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="w-[1px] h-4 bg-white/20 mx-1" />

              {/* Reset to 1:1 Icon */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-xl hover:bg-white/15 text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="Reset zoom to 100% (0)"
              >
                <HiOutlineRefresh className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
