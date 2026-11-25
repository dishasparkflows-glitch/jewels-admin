import ColorStatusToggle from '../../components/common/ColorStatusToggle';
import CategorySelect from '../../components/common/CategorySelect';
import MenuItemSelect from '../../components/common/MenuItemSelect';
import { selectedMenuIds } from '../../utils/menuItems';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { createProductId, deleteUploadedFile, uploadWithPresignedUrl, uploadFilesWithPresignedUrls, formatBytes } from '../../utils/uploadWithPresignedUrl';
import Dropdown from '../../components/common/Dropdown';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import {
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineChevronRight,
  HiOutlineChevronUp,
  HiOutlineExternalLink,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import { openProductPreview } from '../../utils/productPreview';
import { getUploadTriggerProps } from '../../utils/filePickerAutoOpen';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import {
  IoColorPaletteOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import PricingInventoryTab from '../../components/ornate/tabs/PricingInventoryTab';
import WeightsErpTab from '../../components/ornate/tabs/WeightsErpTab';
import OrnateImagesTab from '../../components/ornate/tabs/OrnateImagesTab';
import CareSpecsTab from '../../components/ornate/tabs/CareSpecsTab';
import SeoConfigTab from '../../components/ornate/tabs/SeoConfigTab';
import ProductStepFooter from '../../components/common/ProductStepFooter';

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

const GENDER_OPTIONS = [
  { value: 'Unisex', label: 'Unisex' },
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Kids', label: 'Kids' },
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
  const [productRecord, setProductRecord] = useState(null);

  const { openImagePreview } = useImagePreview();
  const handleOpenImagePreview = (imageUrl, gallery = []) => {
    openImagePreview(imageUrl, { gallery });
  };

  const [draggedCareIndex, setDraggedCareIndex] = useState(null);
  const [dragOverCareIndex, setDragOverCareIndex] = useState(null);

  // Dropdown options loaded from backend
  const {
    categories: rawCategoryList,
    regularCategories,
    collectionCategories,
  } = useCategoryLookup();
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);

  // ─── 1. Base Information ───────────────────────────────────
  const [baseInfo, setBaseInfo] = useState({
    title: '',
    category: '',
    promoBanner: [],
    menuItem: [],
    targetGender: [],
    status: 'draft',
    stockStatus: '',
    showInApp: true,
    showOnWeb: true,
    description: '',
    soldCount: '',
    reviewCount: '',
  });
  const [autoOpenMenu, setAutoOpenMenu] = useState(false);
  const [categoryPromoBanners, setCategoryPromoBanners] = useState([]);

  // Fetch or sync promo banners whenever selected category changes
  useEffect(() => {
    if (!baseInfo.category) {
      setCategoryPromoBanners([]);
      return;
    }
    const catInList = (rawCategoryList || []).find(
      (c) => String(c?._id || c?.id) === String(baseInfo.category)
    );
    if (Array.isArray(catInList?.promoBanners) && catInList.promoBanners.length > 0) {
      setCategoryPromoBanners(catInList.promoBanners);
      return;
    }
    let cancelled = false;
    api.get(`/categories/${baseInfo.category}`)
      .then((res) => {
        if (cancelled) return;
        const cat = res.data?.data || res.data;
        setCategoryPromoBanners(Array.isArray(cat?.promoBanners) ? cat.promoBanners : []);
      })
      .catch(() => {
        if (!cancelled) setCategoryPromoBanners([]);
      });
    return () => {
      cancelled = true;
    };
  }, [baseInfo.category, rawCategoryList]);

  // If baseInfo.promoBanner contains legacy title strings instead of ObjectIds, resolve them to IDs
  useEffect(() => {
    if (!categoryPromoBanners || categoryPromoBanners.length === 0) return;
    setBaseInfo((prev) => {
      const currentPromo = Array.isArray(prev.promoBanner) ? prev.promoBanner : [];
      if (currentPromo.length === 0) return prev;
      let hasChanges = false;
      const resolved = currentPromo.map((val) => {
        const found = categoryPromoBanners.find(
          (b) => String(b._id || b.id) === String(val) || String(b.title).trim().toLowerCase() === String(val).trim().toLowerCase()
        );
        if (found && String(found._id || found.id) !== String(val)) {
          hasChanges = true;
          return String(found._id || found.id);
        }
        return val;
      });
      return hasChanges ? { ...prev, promoBanner: resolved } : prev;
    });
  }, [categoryPromoBanners]);

  const promoBannerOptions = useMemo(() => {
    const banners = (categoryPromoBanners && categoryPromoBanners.length > 0)
      ? categoryPromoBanners
      : (rawCategoryList.find((c) => String(c._id) === String(baseInfo.category))?.promoBanners || []);
    return (Array.isArray(banners) ? banners : [])
      .filter((b) => b && (b._id || b.id || b.title))
      .map((b) => {
        const bannerId = String(b._id || b.id || b.title);
        const imgUrl = b.image?.url || b.imageUrl || (typeof b.image === 'string' ? b.image : '');
        return {
          value: bannerId,
          label: b.title,
          icon: imgUrl ? (
            <img
              src={imgUrl}
              alt={b.title}
              className="w-4 h-4 rounded object-cover shrink-0 border border-stone-200"
            />
          ) : null,
        };
      });
  }, [categoryPromoBanners, rawCategoryList, baseInfo.category]);

  const [togglingStatus, setTogglingStatus] = useState(false);
  const currentStatus = baseInfo?.status || 'draft';

  const handleToggleStatus = async () => {
    if (togglingStatus) return;
    const nextStatus = currentStatus === 'approved' ? 'draft' : 'approved';
    if (!id || id === 'add' || id === 'new') {
      setBaseInfo((prev) => ({ ...prev, status: nextStatus }));
      return;
    }
    try {
      setTogglingStatus(true);
      await api.patch(`/products/${id}/status`, { status: nextStatus });
      setBaseInfo((prev) => ({ ...prev, status: nextStatus }));
      setProductRecord((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      toast.success(
        nextStatus === 'approved'
          ? 'Product published successfully!'
          : 'Product moved to draft successfully!'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleViewOnWebsite = async () => {
    if (!id) return;
    const opened = await openProductPreview(productRecord || {
      _id: id,
      basicInfo: {
        title: baseInfo?.title || '',
        slug: productRecord?.basicInfo?.slug || productRecord?.slug,
      },
    });
    if (!opened) {
      toast.error('Could not determine storefront product URL.');
    }
  };

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
          setProductRecord(product);
          const rawCatList = product.categoryIds || product.category || [];
          const catArray = Array.isArray(rawCatList) ? rawCatList : [rawCatList];
          const allCatIds = catArray
            .map((c) => String(c && typeof c === 'object' ? (c._id || c.id) : c))
            .filter(Boolean);

          const knownCollIds = new Set(
            catArray
              .filter((c) => c && typeof c === 'object' && c.type === 'collection')
              .map((c) => String(c._id || c.id))
          );
          const knownRegIds = new Set(
            catArray
              .filter((c) => c && typeof c === 'object' && c.type && c.type !== 'collection')
              .map((c) => String(c._id || c.id))
          );

          const regList = regularCategories || [];
          const colList = collectionCategories || [];

          const collIds = allCatIds.filter(
            (id) => colList.some((c) => String(c._id) === id) || knownCollIds.has(id)
          );
          const primaryCat =
            allCatIds.find((id) => regList.some((r) => String(r._id) === id)) ||
            allCatIds.find((id) => knownRegIds.has(id)) ||
            allCatIds.find((id) => !collIds.includes(id)) ||
            '';
          setSelectedCollectionIds(collIds);

          // Populate Base Information
          const rawPromo = product.promoBanner || product.basicInfo?.promoBanner || [];
          const promoArr = Array.isArray(rawPromo)
            ? rawPromo.map((p) => String(p)).filter(Boolean)
            : (rawPromo ? [String(rawPromo)] : []);
          setBaseInfo({
            title: product.basicInfo?.title || '',
            category: primaryCat,
            promoBanner: promoArr,
            menuItem: selectedMenuIds(product),
            targetGender: (() => {
              const raw = product.basicInfo?.gender ?? product.gender ?? [];
              const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
              return arr.map((g) => {
                const matched = GENDER_OPTIONS.find(
                  (opt) => opt.value.toLowerCase() === String(g).trim().toLowerCase()
                );
                return matched ? matched.value : g;
              }).filter(Boolean);
            })(),
            status: product.status || 'draft',
            stockStatus: product.stockStatus || '',
            showInApp: product.visibility?.app !== false && product.inapp !== false,
            showOnWeb: product.visibility?.web !== false && product.inweb !== false,
            description: product.basicInfo?.description || '',
            soldCount: product.demoMetrics?.soldCount ?? '',
            reviewCount: product.demoMetrics?.reviewCount ?? '',
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
            const colorsWithMedia = Object.keys(mediaMap).filter(
              (cName) => (mediaMap[cName]?.media?.length > 0) || Boolean(mediaMap[cName]?.swatchIcon)
            );
            if (colorsWithMedia.length > 0) {
              setExpandedColors((prev) => Array.from(new Set([...prev, ...colorsWithMedia])));
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
            customGroupName: product.ornate?.customGroupName || '',
            itemName: product.ornate?.itemCode || product.basicInfo?.title || '',
            groupName: product.ornate?.groupName || '',
            varietyName: product.varietyName || '',
            metalName: product.ornate?.metalName || '',
            uniqueLabelId: product.ornate?.itemCode || '',
            barcodeNumber: product.ornate?.barcode || '',
            labelNumber: product.ornate?.tagNo || '',
            remark: product.ornate?.remark || product.basicInfo?.remark || '',
            companyCode: product.ornate?.companyCode || '',
            carat: product.ornate?.carat || product.specifications?.caratCategory || '',
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

  // Synchronize category & collection selections whenever productRecord or category lookup lists load/update
  useEffect(() => {
    if (!productRecord) return;
    const rawCatList = productRecord.categoryIds || productRecord.category || [];
    const catArray = Array.isArray(rawCatList) ? rawCatList : [rawCatList];
    const allCatIds = catArray
      .map((c) => String(c && typeof c === 'object' ? (c._id || c.id) : c))
      .filter(Boolean);

    if (allCatIds.length === 0) return;

    const knownCollIds = new Set(
      catArray
        .filter((c) => c && typeof c === 'object' && c.type === 'collection')
        .map((c) => String(c._id || c.id))
    );
    const knownRegIds = new Set(
      catArray
        .filter((c) => c && typeof c === 'object' && c.type && c.type !== 'collection')
        .map((c) => String(c._id || c.id))
    );

    const regList = regularCategories || [];
    const colList = collectionCategories || [];

    const collIds = allCatIds.filter(
      (id) => colList.some((c) => String(c._id) === id) || knownCollIds.has(id)
    );

    const primaryCat =
      allCatIds.find((id) => regList.some((r) => String(r._id) === id)) ||
      allCatIds.find((id) => knownRegIds.has(id)) ||
      allCatIds.find((id) => !collIds.includes(id)) ||
      '';

    setSelectedCollectionIds(collIds);
    setBaseInfo((prev) => ({
      ...prev,
      category: primaryCat,
    }));
  }, [productRecord, regularCategories, collectionCategories]);

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

  // Auto-expand any color box that contains images/media or a swatch icon
  useEffect(() => {
    const colorsWithMedia = Object.keys(variantMedia).filter(
      (cName) => (variantMedia[cName]?.media?.length > 0) || Boolean(variantMedia[cName]?.swatchIcon)
    );
    if (colorsWithMedia.length > 0) {
      setExpandedColors((prev) => {
        const next = [...prev];
        let changed = false;
        colorsWithMedia.forEach((c) => {
          if (!next.some((existing) => existing.toLowerCase() === c.toLowerCase())) {
            next.push(c);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [variantMedia]);

  const isColorExpanded = (colorName) => {
    return expandedColors.some((c) => c?.toLowerCase() === colorName?.toLowerCase());
  };

  // Toggle Variant Accordion Expansion (allows multiple open simultaneously)
  const handleToggleExpand = (colorName) => {
    setExpandedColors((prev) =>
      prev.some((c) => c?.toLowerCase() === colorName?.toLowerCase())
        ? prev.filter((c) => c?.toLowerCase() !== colorName?.toLowerCase())
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
      const res = await uploadWithPresignedUrl(file, 'swatch', null, { productId: mediaProductId });
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
        setExpandedColors((prev) => Array.from(new Set([...prev, colorName])));
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

      const uploadedResults = await uploadFilesWithPresignedUrls(files, 'products', null, { productId: mediaProductId });

      const uploadedList = uploadedResults.map((res, i) => {
        const file = files[i];
        return {
          id: `vmed-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
          url: res.fileUrl,
          key: res.key,
          mediaType: file.type?.startsWith('video') || file.name?.endsWith('.mp4') ? 'video' : 'image',
          name: res.name || file.name,
          size: res.size ? formatBytes(res.size) : undefined,
        };
      });

      if (uploadedList.length > 0) {
        setVariantMedia((prev) => ({
          ...prev,
          [colorName]: {
            ...prev[colorName],
            media: [...(prev[colorName]?.media || []), ...uploadedList],
          },
        }));
        setSelectedColors((prev) => Array.from(new Set([...prev, colorName])));
        setExpandedColors((prev) => Array.from(new Set([...prev, colorName])));
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

      const resolveCatId = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return String(val._id || val.id || '');
        const str = String(val).trim();
        if (/^[a-f\d]{24}$/i.test(str)) return str;
        const matched = (rawCategoryList || []).find(
          (c) =>
            String(c._id) === str ||
            String(c.name || '').trim().toLowerCase() === str.toLowerCase() ||
            String(c.slug || '').trim().toLowerCase() === str.toLowerCase()
        );
        return matched ? String(matched._id || matched.id) : null;
      };

      const resolvedPrimaryCatId = resolveCatId(baseInfo.category);
      const resolvedCollectionIds = (selectedCollectionIds || [])
        .map(resolveCatId)
        .filter(Boolean);

      const finalCategoryIds = Array.from(
        new Set([resolvedPrimaryCatId, ...resolvedCollectionIds].filter(Boolean))
      );

      const payload = {
        ...(!isEditMode ? { _id: draftProductId } : {}),
        // Product identity and copy live in basicInfo.
        categoryIds: finalCategoryIds,
        promoBanner: Array.isArray(baseInfo.promoBanner)
          ? baseInfo.promoBanner.filter(Boolean)
          : (baseInfo.promoBanner ? [baseInfo.promoBanner] : []),
        menuItemIds: baseInfo.menuItem,
        gender: Array.isArray(baseInfo.targetGender)
          ? baseInfo.targetGender.filter(Boolean)
          : (baseInfo.targetGender ? [baseInfo.targetGender] : []),
        status: activeStatus,
        stockStatus: baseInfo.stockStatus || undefined,
        visibility: {
          app: Boolean(baseInfo.showInApp),
          web: Boolean(baseInfo.showOnWeb),
        },
        demoMetrics: {
          soldCount:
            baseInfo.soldCount !== '' && baseInfo.soldCount !== undefined && baseInfo.soldCount !== null
              ? Number(baseInfo.soldCount)
              : (productRecord?.demoMetrics?.soldCount ?? 0),
          reviewCount:
            baseInfo.reviewCount !== '' && baseInfo.reviewCount !== undefined && baseInfo.reviewCount !== null
              ? Number(baseInfo.reviewCount)
              : (productRecord?.demoMetrics?.reviewCount ?? 0),
        },
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
          slug: (erpDetails.barcodeNumber
            ? `${baseInfo.title.trim()}-${erpDetails.barcodeNumber}`
            : (erpDetails.labelNumber ? `${baseInfo.title.trim()}-${erpDetails.labelNumber}` : baseInfo.title.trim())
          ).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          description: baseInfo.description,
          gender: Array.isArray(baseInfo.targetGender)
            ? baseInfo.targetGender.filter(Boolean)
            : (baseInfo.targetGender ? [baseInfo.targetGender] : []),
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
        setProductRecord((prev) => ({ ...(prev || {}), ...payload }));
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
    <div className="space-y-4 pb-12 font-sans text-stone-800">
      {/* ─── Sticky Header & Stepper Wizard Bar ─── */}
      <div className="sticky top-14 z-20 bg-[#f8fafc]/95 backdrop-blur-md pt-0.5 pb-2.5 space-y-3">
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
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight max-w-[550px] truncate" title={baseInfo.title}>
                {isEditMode ? (baseInfo.title || 'Refine the details of ERP product') : 'Add New Ornate Product'}
              </h1>
              {(erpDetails.barcodeNumber || erpDetails.labelNumber || erpDetails.uniqueLabelId) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70">
                  {erpDetails.barcodeNumber ? `Barcode: ${erpDetails.barcodeNumber}` : `Label: ${erpDetails.labelNumber || erpDetails.uniqueLabelId}`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              ERP SKU: <span className="font-mono text-stone-700">{erpDetails.labelNumber || erpDetails.uniqueLabelId || '—'}</span> &bull; Variety: <span className="text-stone-700">{erpDetails.varietyName || '—'}</span> &bull; Metal: <span className="text-stone-700">{erpDetails.metalName || '—'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end md:self-auto">
          {isEditMode && (
            <button
              type="button"
              onClick={handleViewOnWebsite}
              className="group inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-stone-700 hover:text-[#785e40] bg-white border border-stone-200 hover:border-stone-300 rounded-lg hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Preview product on storefront"
            >
              <HiOutlineExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#8b6f4e]" />
              <span>View</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={saving || togglingStatus}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95 select-none ${
              currentStatus === 'approved'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title={
              currentStatus === 'approved'
                ? 'Status: Live on Website. Click to switch to Draft.'
                : 'Status: Draft (Hidden). Click to publish.'
            }
          >
            {currentStatus === 'approved' ? (
              <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <HiOutlineLockClosed className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span>{togglingStatus ? 'Updating...' : (currentStatus === 'approved' ? 'Live' : 'Draft')}</span>
            {/* Mini switch track */}
            <span
              className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors p-0.5 ml-0.5 ${
                currentStatus === 'approved' ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-xs transition duration-150 ${
                  currentStatus === 'approved' ? 'translate-x-2.5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProduct()}
            disabled={saving || togglingStatus}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:border-stone-300 rounded-lg hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Save changes"
          >
            {saving ? (
              <span className="w-3 h-3 border-2 border-stone-500 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] shrink-0" />
            )}
            <span>{saving ? 'Saving...' : 'Save'}</span>
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

              {/* Row: Platform Visibility, Gender Target, Stock Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
                    Platform Visibility
                  </label>
                  <div className="flex items-center gap-5 h-[42px] px-3.5 rounded-xl border border-[#d6cfc2] bg-white shadow-2xs">
                    <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-[13px] font-medium text-stone-700 select-none">
                      <input
                        type="checkbox"
                        checked={baseInfo.showInApp}
                        onChange={(e) =>
                          setBaseInfo((prev) => ({ ...prev, showInApp: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                      />
                      <span>App</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-[13px] font-medium text-stone-700 select-none">
                      <input
                        type="checkbox"
                        checked={baseInfo.showOnWeb}
                        onChange={(e) =>
                          setBaseInfo((prev) => ({ ...prev, showOnWeb: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                      />
                      <span>Web</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
                    Gender Target
                  </label>
                  <Dropdown
                    size="field"
                    variant="input"
                    multiple
                    value={baseInfo.targetGender}
                    onChange={(val) =>
                      setBaseInfo((prev) => ({
                        ...prev,
                        targetGender: Array.isArray(val) ? val : [val].filter(Boolean),
                      }))
                    }
                    options={GENDER_OPTIONS}
                    placeholder="Select Gender"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
                    Stock Status
                  </label>
                  <Dropdown
                    size="field"
                    variant="input"
                    value={baseInfo.stockStatus}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, stockStatus: val }))}
                    options={STOCK_STATUS_OPTIONS}
                    placeholder="Select stock status"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Row: Category * & Menu Items (Exact same layout as Silver Products) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
                    Category <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <CategorySelect
                    categoryId={baseInfo.category}
                    selectedCollectionIds={selectedCollectionIds}
                    categories={rawCategoryList}
                    onChangeCategory={(catId) => {
                      if (catId !== baseInfo.category) {
                        setBaseInfo((prev) => ({
                          ...prev,
                          category: catId,
                          menuItem: [],
                          promoBanner: [],
                        }));
                      } else {
                        setBaseInfo((prev) => ({
                          ...prev,
                          category: catId,
                        }));
                      }
                      if (catId) setAutoOpenMenu(true);
                    }}
                    onChangeCollections={setSelectedCollectionIds}
                    placeholder="Select Category"
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
                    Menu Items
                  </label>
                  <MenuItemSelect
                    key={baseInfo.category}
                    categoryId={baseInfo.category}
                    value={baseInfo.menuItem}
                    onChange={(value) => setBaseInfo((prev) => ({ ...prev, menuItem: value }))}
                    disabled={saving}
                    autoOpen={autoOpenMenu}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) setAutoOpenMenu(false);
                    }}
                  />
                </div>

                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
                    Promo Banner
                  </label>
                  <Dropdown
                    size="field"
                    variant="input"
                    multiple
                    value={baseInfo.promoBanner || []}
                    onChange={(val) => {
                      const arr = Array.isArray(val) ? val : [val].filter(Boolean);
                      setBaseInfo((prev) => ({
                        ...prev,
                        promoBanner: arr,
                      }));
                    }}
                    placeholder={
                      !baseInfo.category
                        ? 'Select Category first'
                        : promoBannerOptions.length === 0
                        ? 'No promo banners'
                        : 'Select Promo Banner'
                    }
                    disabled={saving || !baseInfo.category || promoBannerOptions.length === 0}
                    options={promoBannerOptions}
                    className="w-full"
                  />
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

              {/* Social Proof & Urgency (Demo Metrics) */}
              <div className="p-4 rounded-xl border border-stone-200 bg-[#fbfaf8] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base" role="img" aria-label="fire">🔥</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Social Proof & Urgency (Demo Metrics)
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-stone-500">
                  Set product-specific sold and review counts displayed under the title on the storefront.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Sold Count
                      </label>
                      <span className="text-[10px] text-stone-400 font-medium">· Displayed as &apos;X sold in last 3 hours&apos;</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔥</span>
                      <input
                        type="number"
                        min="0"
                        value={baseInfo.soldCount}
                        onChange={(e) => setBaseInfo((prev) => ({ ...prev, soldCount: e.target.value }))}
                        placeholder="e.g. 24"
                        className="w-full h-10 pl-8 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Review Count
                      </label>
                      <span className="text-[10px] text-stone-400 font-medium">· Displayed as &apos;★★★★★ X reviews&apos;</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">★</span>
                      <input
                        type="number"
                        min="0"
                        value={baseInfo.reviewCount}
                        onChange={(e) => setBaseInfo((prev) => ({ ...prev, reviewCount: e.target.value }))}
                        placeholder="e.g. 13"
                        className="w-full h-10 pl-8 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: PRICING & INVENTORY
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 2 && (
          <PricingInventoryTab
            pricing={pricing}
            setPricing={setPricing}
            handleCostOrMarkupChange={handleCostOrMarkupChange}
          />
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {colorOptions.map((col) => {
                const isSelected = isColorSelected(col.name);
                const isExpanded = isColorExpanded(col.name);
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
                    <div className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
                      {/* Left side: Checkbox + 3D Swatch Sphere + Color Name + Selected Badge */}
                      <div
                        onClick={() => handleToggleColor(col.name)}
                        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
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
                        <span className="text-sm font-bold text-stone-900 whitespace-nowrap">
                          {col.name}
                        </span>

                        {/* Selected Pill Badge */}
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f7ee] text-[#1b7a43] border border-[#c4ebd1]/60 shrink-0">
                            Selected
                          </span>
                        )}
                      </div>

                      {/* Right side: Status Toggle + Manage Media */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                        <ColorStatusToggle
                          name={col.name}
                          disabled={!isSelected}
                          status={variantMedia[col.name]?.status}
                          onChange={(status) =>
                            setVariantMedia((previous) => ({
                              ...previous,
                              [col.name]: { ...previous[col.name], status },
                            }))
                          }
                        />

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
                                    onClick={() => handleRemoveSwatchIcon(col.name)}
                                    className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg cursor-pointer transition-colors"
                                    title="Remove icon"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                {...getUploadTriggerProps(null, { disabled: isUploadingSwatch, fileInputId: `swatch-upload-${col.name}` })}
                                onClick={() =>
                                  document.getElementById(`swatch-upload-${col.name}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
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
                                        className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-red-600 text-red-600 hover:text-white rounded-md border border-red-200/60 shadow-2xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                        title="Delete media"
                                      >
                                        <HiOutlineTrash className="w-3 h-3 text-red-600 group-hover:text-white" />
                                      </button>
                                    </div>
                                  ))}

                                  <div
                                    {...getUploadTriggerProps(null, { fileInputId: `media-upload-${col.name}` })}
                                    onClick={() =>
                                      document.getElementById(`media-upload-${col.name}`)?.click()
                                    }
                                    className="border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors rounded-lg flex flex-col items-center justify-center text-center cursor-pointer aspect-square"
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
                                    data-upload-trigger="true"
                                    data-file-input-id={`media-upload-${col.name}`}
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
                                {...getUploadTriggerProps(null, { disabled: isUploadingMedia, fileInputId: `media-upload-${col.name}` })}
                                onClick={() =>
                                  document.getElementById(`media-upload-${col.name}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
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
                const isExpanded = isColorExpanded(colName);
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
                    <div className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
                      {/* Left side: Checkbox + Swatch Sphere + Name + Selected Badge */}
                      <div
                        onClick={() => handleToggleColor(colName)}
                        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
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
                        <div className="flex flex-col shrink-0">
                          <span className="text-sm font-bold text-stone-900 whitespace-nowrap">
                            General Images
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">
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

                      {/* Right side: Status Toggle + Manage Media */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                        <ColorStatusToggle
                          name={colName}
                          disabled={!isSelected}
                          status={variantMedia[colName]?.status}
                          onChange={(status) =>
                            setVariantMedia((previous) => ({
                              ...previous,
                              [colName]: { ...previous[colName], status },
                            }))
                          }
                        />

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
                                    onClick={() => handleRemoveSwatchIcon(colName)}
                                    className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg cursor-pointer transition-colors"
                                    title="Remove icon"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                {...getUploadTriggerProps(null, { disabled: isUploadingSwatch, fileInputId: `swatch-upload-${colName}` })}
                                onClick={() =>
                                  document.getElementById(`swatch-upload-${colName}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
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
                                        className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-red-600 text-red-600 hover:text-white rounded-md border border-red-200/60 shadow-2xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                        title="Delete media"
                                      >
                                        <HiOutlineTrash className="w-3 h-3 text-red-600 group-hover:text-white" />
                                      </button>
                                    </div>
                                  ))}

                                  <div
                                    {...getUploadTriggerProps(null, { fileInputId: `media-upload-${colName}` })}
                                    onClick={() =>
                                      document.getElementById(`media-upload-${colName}`)?.click()
                                    }
                                    className="border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors rounded-lg flex flex-col items-center justify-center text-center cursor-pointer aspect-square"
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
                                    data-upload-trigger="true"
                                    data-file-input-id={`media-upload-${colName}`}
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
                                {...getUploadTriggerProps(null, { disabled: isUploadingMedia, fileInputId: `media-upload-${colName}` })}
                                onClick={() =>
                                  document.getElementById(`media-upload-${colName}`)?.click()
                                }
                                className={`border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] h-full group ${
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
          <WeightsErpTab
            weights={weights}
            setWeights={setWeights}
            erpDetails={erpDetails}
            setErpDetails={setErpDetails}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: ORNATE IMAGES
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 5 && (
          <OrnateImagesTab
            ornateImages={ornateImages}
            handleOpenImagePreview={handleOpenImagePreview}
            handleSetPrimaryImage={handleSetPrimaryImage}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 6: CARE & SPECIFICATIONS
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 6 && (
          <CareSpecsTab
            careSections={careSections}
            handleAddCareSection={handleAddCareSection}
            handleMoveCareSection={handleMoveCareSection}
            handleUpdateCareSection={handleUpdateCareSection}
            handleRemoveCareSection={handleRemoveCareSection}
            draggedCareIndex={draggedCareIndex}
            dragOverCareIndex={dragOverCareIndex}
            handleCareDragStart={handleCareDragStart}
            handleCareDragOver={handleCareDragOver}
            handleCareDrop={handleCareDrop}
            handleCareDragEnd={handleCareDragEnd}
            handleFormatText={handleFormatText}
            handleKeyDownDescription={handleKeyDownDescription}
            specifications={specifications}
            handleAddSpecification={handleAddSpecification}
            handleMoveSpecification={handleMoveSpecification}
            handleUpdateSpecification={handleUpdateSpecification}
            handleRemoveSpecification={handleRemoveSpecification}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 7: SEO CONFIGURATION
        ═══════════════════════════════════════════════════════════════ */}
        {activeStep === 7 && (
          <SeoConfigTab seo={seo} setSeo={setSeo} />
        )}

      </div>

      {/* ─── Bottom Navigation Bar (Sticky Footer) ──────────────────── */}
      <ProductStepFooter
        currentStepIndex={activeStep - 1}
        totalSteps={steps.length}
        currentStepTitle={steps[activeStep - 1]?.title}
        nextStepTitle={steps[activeStep]?.title}
        onPrev={handlePrevStep}
        onNext={activeStep < steps.length ? handleNextStep : () => handleSaveProduct()}
        saving={saving}
        isEditMode={isEditMode}
      />
    </div>
  );
}
