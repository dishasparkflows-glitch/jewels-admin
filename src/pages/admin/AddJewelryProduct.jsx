import { selectedMenuIds } from '../../utils/menuItems';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  createProductId,
  deleteUploadedFile,
  getUploadCompressionSettings,
  uploadWithPresignedUrl,
  getUploadedObjectKey,
  compressImageFile,
  isCompressibleImage,
  COMPRESSION_PRESETS,
  getGlobalCompressionOptions,
} from '../../utils/uploadWithPresignedUrl';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import { getMediaUrl } from '../../utils/imageUrl';
import ProductStepFooter from '../../components/common/ProductStepFooter';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { metalColorsAPI, vtoMastersAPI } from '../../api/services';
import PricingBreakdownModal from '../../components/common/PricingBreakdownModal';
import { calculateProductPriceAPI } from '../../utils/pricingCalculation';

// Metal Color helpers imported from modular helper file
import {
  _metalColorsMasterMap,
  registerMetalColors,
  getSphereStyle,
} from './addJewelryProduct/metalColorHelpers';

// Subcomponents for cleaner modular architecture
import { AddJewelryProductContext } from './addJewelryProduct/AddJewelryProductContext';
import StepperNav from './addJewelryProduct/StepperNav';
import Step1BasicDetails from './addJewelryProduct/Step1BasicDetails';
import Step2VariantConfig from './addJewelryProduct/Step2VariantConfig';
import Step3SilverPricing from './addJewelryProduct/Step3SilverPricing';
import Step4SilverMedia from './addJewelryProduct/Step4SilverMedia';
import Step4GoldMedia from './addJewelryProduct/Step4GoldMedia';
import Step5CareAndSpecs from './addJewelryProduct/Step5CareAndSpecs';
import Step6SeoPublish from './addJewelryProduct/Step6SeoPublish';
import MediaUploadModals from './addJewelryProduct/MediaUploadModals';

export {
  _metalColorsMasterMap,
  registerMetalColors,
  getSphereStyle,
};

const formatMediaSize = (bytes = 0) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isSizeInKb = (sizeOrBytes) => {
  if (sizeOrBytes == null || sizeOrBytes === '') return false;
  if (typeof sizeOrBytes === 'number') {
    return sizeOrBytes > 0 && sizeOrBytes < 1024 * 1024; // Less than 1 MB is in KB
  }
  if (typeof sizeOrBytes === 'string') {
    const s = sizeOrBytes.trim().toLowerCase();
    if (s.endsWith('kb') || s.includes(' kb')) return true;
    if (s.endsWith('mb') || s.includes(' mb')) return false;
    const num = parseFloat(s);
    return !isNaN(num) && num > 0 && num < 1024 * 1024;
  }
  return false;
};

const compressImageAsset = async (asset, quality, format = 'image/webp') => {
  const key = getUploadedObjectKey(asset);
  if (!key.startsWith('products/')) throw new Error('Could not identify this product image for compression');
  const response = await api.get('/upload/file', { params: { key }, responseType: 'blob' });
  const original = response.data;
  const bitmap = await createImageBitmap(original);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close();
  const compressed = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image compression failed')), format, quality);
  });
  const stem = (asset.name || 'product-image').replace(/\.[^.]+$/, '');
  const extension = format === 'image/jpeg' ? 'jpg' : 'webp';
  const file = new File([compressed], `${stem}.${extension}`, { type: format });
  file.originalSize = original.size;
  return file;
};

const compressVideoAsset = async (asset, quality) => {
  if (!window.MediaRecorder || !HTMLVideoElement.prototype.captureStream) {
    throw new Error('Video compression is not supported by this browser');
  }
  const key = getUploadedObjectKey(asset);
  if (!key.startsWith('products/')) throw new Error('Could not identify this product video for compression');

  const sourceResponse = await api.get('/upload/file', { params: { key }, responseType: 'blob' });
  const sourceBlob = sourceResponse.data;
  const sourceUrl = URL.createObjectURL(sourceBlob);

  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.position = 'fixed';
  video.style.top = '-9999px';
  video.style.left = '-9999px';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';
  document.body.appendChild(video);
  video.src = sourceUrl;

  try {
    await Promise.race([
      new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('Could not load video metadata'));
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Video metadata timeout')), 8000)),
    ]);

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('This browser cannot encode compressed video');

    const duration = Math.max(video.duration || 1, 1);
    const originalBitrate = (sourceBlob.size * 8) / duration;
    const recorder = new MediaRecorder(video.captureStream(), {
      mimeType,
      videoBitsPerSecond: Math.max(250_000, Math.min(originalBitrate, originalBitrate * quality)),
    });

    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error('Video recording failed'));
    });

    recorder.start();
    try {
      video.playbackRate = 2.0;
      await video.play();
      const maxWaitMs = Math.min(Math.max((duration / 2) * 1000 + 3000, 6000), 20000);
      await Promise.race([
        new Promise((resolve) => { video.onended = resolve; }),
        new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
      ]);
    } finally {
      if (recorder.state !== 'inactive') recorder.stop();
    }

    await stopped;
    video.pause();
    const blob = new Blob(chunks, { type: mimeType });
    if (!blob.size || blob.size >= sourceBlob.size) {
      throw new Error('Compressed video was not smaller than original');
    }
    const stem = (asset.name || 'product-video').replace(/\.[^.]+$/, '');
    return new File([blob], `${stem}.webm`, { type: mimeType });
  } finally {
    try {
      video.removeAttribute('src');
      video.load();
      if (video.parentNode) video.parentNode.removeChild(video);
    } catch {
      // ignore cleanup errors
    }
    URL.revokeObjectURL(sourceUrl);
  }
};

const compressLocalVideoFile = async (file, qualityRatio = 0.75) => {
  if (typeof window === 'undefined' || !window.MediaRecorder || !HTMLVideoElement.prototype.captureStream) {
    return file;
  }
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.position = 'fixed';
  video.style.top = '-9999px';
  video.style.left = '-9999px';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';
  document.body.appendChild(video);
  video.src = sourceUrl;

  try {
    await Promise.race([
      new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('Could not load video metadata'));
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Video metadata timeout')), 8000)),
    ]);

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) return file;

    const duration = Math.max(video.duration || 1, 1);
    const originalBitrate = (file.size * 8) / duration;
    const recorder = new MediaRecorder(video.captureStream(), {
      mimeType,
      videoBitsPerSecond: Math.max(250_000, Math.min(originalBitrate, originalBitrate * qualityRatio)),
    });

    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error('Video recording failed'));
    });

    recorder.start();
    try {
      video.playbackRate = 2.0;
      await video.play();
      const maxWaitMs = Math.min(Math.max((duration / 2) * 1000 + 3000, 6000), 20000);
      await Promise.race([
        new Promise((resolve) => { video.onended = resolve; }),
        new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
      ]);
    } finally {
      if (recorder.state !== 'inactive') recorder.stop();
    }

    await stopped;
    video.pause();
    const blob = new Blob(chunks, { type: mimeType });
    if (!blob.size || blob.size >= file.size) {
      return file;
    }
    const stem = (file.name || 'product-video').replace(/\.[^.]+$/, '');
    const compressedFile = new File([blob], `${stem}.webm`, { type: mimeType });
    compressedFile.originalSize = file.size;
    compressedFile.compressedSize = blob.size;
    compressedFile.wasCompressed = true;
    compressedFile.savingsPercent = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
    return compressedFile;
  } catch (err) {
    console.warn('[compressLocalVideoFile] Video compression skipped:', err);
    return file;
  } finally {
    try {
      video.removeAttribute('src');
      video.load();
      if (video.parentNode) video.parentNode.removeChild(video);
    } catch {
      // ignore
    }
    URL.revokeObjectURL(sourceUrl);
  }
};

const sortPurities = (list = []) => {
  const getKaratNum = (item) => {
    if (typeof item === 'object' && item?.karat !== undefined && item?.karat !== null && Number(item.karat) > 0) {
      return Number(item.karat);
    }
    const name = typeof item === 'string' ? item : item?.name || '';
    const match = name.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 999;
  };

  return [...list].sort((a, b) => {
    const orderA = typeof a === 'object' && a?.order !== undefined && a?.order !== null ? Number(a.order) : 0;
    const orderB = typeof b === 'object' && b?.order !== undefined && b?.order !== null ? Number(b.order) : 0;
    if (orderA > 0 && orderB > 0 && orderA !== orderB) {
      return orderA - orderB;
    }
    if (orderA > 0 && (!orderB || orderB === 0)) return -1;
    if (orderB > 0 && (!orderA || orderA === 0)) return 1;

    const karatA = getKaratNum(a);
    const karatB = getKaratNum(b);
    if (karatA !== karatB) {
      return karatA - karatB;
    }

    const nameA = typeof a === 'string' ? a : a?.name || '';
    const nameB = typeof b === 'string' ? b : b?.name || '';
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export default function AddJewelryProduct() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: productId } = useParams();
  const [draftProductId] = useState(() => productId || createProductId());
  const mediaProductId = productId || draftProductId;
  const isSilverProduct = pathname.includes('/catalog/silver-products');
  const productListPath = isSilverProduct ? '/catalog/silver-products' : '/catalog/jewelry-products';
  const [productRecord, setProductRecord] = useState(null);
  const [productLoading, setProductLoading] = useState(Boolean(productId));
  const [mastersLoaded, setMastersLoaded] = useState(false);
  const hydratedProductId = useRef('');
  const step1HydratedId = useRef('');

  const {
    categories: categoryList = [],
    categoryOptions = [],
    regularCategories = [],
    collectionCategories = [],
  } = useCategoryLookup() || {};
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);

  // Active wizard step: 1 = Basic, 2 = Variants, 3 = Specifications & Pricing, 4 = Product Media.
  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [menuItemIds, setMenuItemIds] = useState([]);
  const [autoOpenMenu, setAutoOpenMenu] = useState(false);
  const [selectedSizeIds, setSelectedSizeIds] = useState([]);
  const [categorySizes, setCategorySizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  // Ensure document body scroll is always active and never locked
  useEffect(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [activeStep]);

  // ─── Live Master Lookup Lists from Backend API ──────────
  const [puritiesList, setPuritiesList] = useState([]);
  const [purityMasterList, setPurityMasterList] = useState([]);
  const [colorsList, setColorsList] = useState([]);
  const [diamondTypesList, setDiamondTypesList] = useState([]);
  const [diamondShapesList, setDiamondShapesList] = useState([]);
  const [diamondColorsList, setDiamondColorsList] = useState([]);
  const [diamondClaritiesList, setDiamondClaritiesList] = useState([]);
  const [diamondMasters, setDiamondMasters] = useState({ types: [], shapes: [], colors: [], clarities: [] });
  const mastersFetchedRef = useRef(false);

  // Fetch Metal Colors master from lookup API immediately on mount (zero static defaults)
  useEffect(() => {
    let isMounted = true;
    metalColorsAPI
      .getLookup()
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          registerMetalColors(list);
          const mapped = list.map((c) => ({
            id: c._id || c.id,
            name: c.name,
            colorCode: c.colorCode || '',
            colorCodeEnd: c.colorCodeEnd || c.colorCode || '',
            code: c.colorCode || '',
            border: c.colorCodeEnd || c.colorCode || '',
          }));
          setColorsList((prev) => (prev.length > 0 ? prev : mapped));
        }
      })
      .catch((err) => {
        console.error('Failed to load metal colors lookup:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lazy-load Metal Purities, Metal Colors, and Diamond masters ONLY when user enters Step 2 (Variant Configuration) or later
  useEffect(() => {
    if (activeStep < 2 || mastersFetchedRef.current) return;
    mastersFetchedRef.current = true;

    const fetchMasters = async () => {
      try {
        const res = await api.get('/diamonds/attributes');
        const combinedData = res.data?.data;

        if (combinedData) {
          if (Array.isArray(combinedData.metalPurities)) {
            const sorted = sortPurities(combinedData.metalPurities);
            setPurityMasterList(sorted);
            setPuritiesList(sorted.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          if (Array.isArray(combinedData.metalColors)) {
            registerMetalColors(combinedData.metalColors);
            const mapped = combinedData.metalColors.map((c) => ({
              id: c._id || c.id,
              name: c.name,
              colorCode: c.colorCode || '#d9a74a',
              colorCodeEnd: c.colorCodeEnd || c.colorCode || '#b5852f',
              code: c.colorCode || '#d9a74a',
              border: c.colorCodeEnd || c.colorCode || '#b5852f',
            }));
            setColorsList(mapped);
            setProductColors(mapped.map((c) => c.name));
            setActiveMediaColor((prev) => (mapped.some((c) => c.name === prev) ? prev : mapped[0].name));
          }
          const types = combinedData.diamondTypes;
          if (Array.isArray(types)) {
            setDiamondTypesList(types.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          const shapes = combinedData.diamondShapes;
          if (Array.isArray(shapes)) {
            setDiamondShapesList(shapes.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          const colors = combinedData.diamondColors;
          if (Array.isArray(colors)) {
            setDiamondColorsList(colors.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          const clarities = combinedData.diamondClarities;
          if (Array.isArray(clarities)) {
            setDiamondClaritiesList(clarities.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          setDiamondMasters({
            types: Array.isArray(types) ? types : [],
            shapes: Array.isArray(shapes) ? shapes : [],
            colors: Array.isArray(colors) ? colors : [],
            clarities: Array.isArray(clarities) ? clarities : [],
          });
        }
      } catch (err) {
        console.warn('Failed to load diamond attributes:', err);
      } finally {
        setMastersLoaded(true);
      }
    };

    fetchMasters();
  }, [activeStep]);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    hydratedProductId.current = '';
    step1HydratedId.current = '';
    setProductRecord(null);
    setProductLoading(true);
    api.get('/products/' + productId)
      .then((response) => {
        if (!cancelled) {
          const rec = response.data?.data?.product || response.data?.data;
          setProductRecord(rec);
          setProductLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error.response?.data?.message || `Could not load this ${isSilverProduct ? 'silver' : 'jewelry'} product`);
        navigate(productListPath);
        setProductLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, navigate, productListPath, isSilverProduct]);

  // ─── Step 1: Basic Details ──────────────────────────────
  const [gemstoneTypeOptions, setGemstoneTypeOptions] = useState([]);
  const [gemstoneShapeOptions, setGemstoneShapeOptions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/gemstone-types/lookup').catch(() => ({ data: { data: [] } })),
      api.get('/gemstone-shapes/lookup').catch(() => ({ data: { data: [] } })),
    ]).then(([typesRes, shapesRes]) => {
      if (!isMounted) return;
      const types = Array.isArray(typesRes.data?.data)
        ? typesRes.data.data
        : typesRes.data?.data?.items || [];
      const shapes = Array.isArray(shapesRes.data?.data)
        ? shapesRes.data.data
        : shapesRes.data?.data?.items || [];

      setGemstoneTypeOptions(
        types.map((item) => ({
          value: item._id,
          label: item.name,
          image: item.image?.url || item.swatchImage?.url,
          color: item.colorCode,
        }))
      );

      setGemstoneShapeOptions(
        shapes.map((item) => ({
          value: item._id,
          label: item.name,
          image: item.image?.url,
        }))
      );
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [basicDetails, setBasicDetails] = useState({
    title: '',
    sku: '',
    category: '',
    promoBanner: [],
    gender: [],
    gemstoneTypes: [],
    gemstoneShapes: [],
    description: '',
    isOrnate: false,
    soldCount: '',
    reviewCount: '',
    showInApp: true,
    showOnWeb: true,
  });

  // Immediately hydrate Step 1 (Basic Details) as soon as productRecord is fetched without waiting for diamond masters
  useEffect(() => {
    if (!productRecord) return;
    const currentRecId = String(productRecord._id || productRecord.id || '');
    if (step1HydratedId.current === currentRecId && currentRecId) return;
    step1HydratedId.current = currentRecId;
    const basicInfo = productRecord.basicInfo || {};
    const categoryValues = productRecord.categoryIds || productRecord.category || [];
    const rawCatList = Array.isArray(categoryValues) ? categoryValues : [categoryValues].filter(Boolean);
    const allCatIds = rawCatList
      .map((c) => String(c && typeof c === 'object' ? (c._id || c.id) : c))
      .filter(Boolean);

    const regMatch = allCatIds.find((id) => (regularCategories || []).some((r) => String(r?._id) === id));
    const collIds = allCatIds.filter((id) => (collectionCategories || []).some((c) => String(c?._id) === id));
    const categoryId = regMatch || allCatIds.find((id) => !collIds.includes(id)) || allCatIds[0] || '';

    const rawPromo = productRecord.promoBanner || basicInfo.promoBanner || [];
    const promoArr = Array.isArray(rawPromo)
      ? rawPromo.map((p) => String(p)).filter(Boolean)
      : (rawPromo ? [String(rawPromo)] : []);

    setSelectedCollectionIds(collIds);
    setMenuItemIds(selectedMenuIds(productRecord));
    setBasicDetails({
      title: basicInfo.title || '',
      sku: basicInfo.sku || '',
      category: categoryId ? String(categoryId) : '',
      promoBanner: promoArr,
      gender: (() => {
        const rawGender = basicInfo.gender ?? productRecord.gender ?? [];
        const arr = Array.isArray(rawGender) ? rawGender : (rawGender ? [rawGender] : []);
        return arr.map((g) => {
          const matched = ['Female', 'Male', 'Unisex', 'Kids'].find(
            (opt) => opt.toLowerCase() === String(g).trim().toLowerCase()
          );
          return matched || g;
        }).filter(Boolean);
      })(),
      gemstoneTypes: (() => {
        const raw = productRecord.gemstoneTypeIds ?? (basicInfo.gemstoneTypes ?? []);
        return Array.isArray(raw)
          ? raw.map((item) => (typeof item === 'object' && item ? item._id || item.id : String(item))).filter(Boolean)
          : (raw ? [typeof raw === 'object' && raw ? raw._id || raw.id : String(raw)] : []);
      })(),
      gemstoneShapes: (() => {
        const raw = productRecord.gemstoneShapeIds ?? (basicInfo.gemstoneShapes ?? []);
        return Array.isArray(raw)
          ? raw.map((item) => (typeof item === 'object' && item ? item._id || item.id : String(item))).filter(Boolean)
          : (raw ? [typeof raw === 'object' && raw ? raw._id || raw.id : String(raw)] : []);
      })(),
      description: basicInfo.description || '',
      isOrnate: Boolean(productRecord.isOrnate || productRecord.productType === 'ornate'),
      soldCount: productRecord.demoMetrics?.soldCount ?? '',
      reviewCount: productRecord.demoMetrics?.reviewCount ?? '',
      showInApp: productRecord.visibility?.app !== false && productRecord.inapp !== false,
      showOnWeb: productRecord.visibility?.web !== false && productRecord.inweb !== false,
    });

    const rawSizes = productRecord.sizeIds || productRecord.sizes || [];
    const sizeIdArr = Array.isArray(rawSizes)
      ? rawSizes.map((s) => String(s && typeof s === 'object' ? (s._id || s.id) : s)).filter(Boolean)
      : [];
    setSelectedSizeIds(sizeIdArr);
  }, [productRecord, regularCategories, collectionCategories]);

  // Fetch sizes whenever selected category changes
  useEffect(() => {
    if (!basicDetails.category) {
      setCategorySizes([]);
      return;
    }
    setLoadingSizes(true);
    api.get(`/sizes/lookup?categoryId=${basicDetails.category}`)
      .then((res) => {
        const items = res.data?.data?.items || res.data?.data || [];
        setCategorySizes(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        console.warn('Failed to load sizes for category:', err);
        setCategorySizes([]);
      })
      .finally(() => {
        setLoadingSizes(false);
      });
  }, [basicDetails.category]);

  const selectedCategory = useMemo(
    () => categoryList.find((category) => String(category._id) === String(basicDetails.category)),
    [categoryList, basicDetails.category]
  );

  const [categoryPromoBanners, setCategoryPromoBanners] = useState([]);

  // Fetch or sync promo banners whenever selected category changes
  useEffect(() => {
    if (!basicDetails.category) {
      setCategoryPromoBanners([]);
      return;
    }
    const catInList = (categoryList || []).find(
      (c) => String(c?._id || c?.id) === String(basicDetails.category)
    );
    if (Array.isArray(catInList?.promoBanners) && catInList.promoBanners.length > 0) {
      setCategoryPromoBanners(catInList.promoBanners);
      return;
    }
    let cancelled = false;
    api.get(`/categories/${basicDetails.category}`)
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
  }, [basicDetails.category, categoryList]);

  // If basicDetails.promoBanner contains legacy title strings instead of ObjectIds, resolve them to IDs
  useEffect(() => {
    if (!categoryPromoBanners || categoryPromoBanners.length === 0) return;
    setBasicDetails((prev) => {
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
      : (selectedCategory?.promoBanners || []);
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
              src={getMediaUrl(imgUrl)}
              alt={b.title}
              className="w-4 h-4 rounded object-cover shrink-0 border border-stone-200"
            />
          ) : null,
        };
      });
  }, [categoryPromoBanners, selectedCategory]);

  const sortedDisplayPurities = useMemo(() => {
    return sortPurities(
      puritiesList.map((pName) => {
        const matched = purityMasterList.find((pm) => (typeof pm === 'string' ? pm : pm?.name) === pName);
        return matched || pName;
      })
    ).map((item) => (typeof item === 'string' ? item : item.name));
  }, [puritiesList, purityMasterList]);

  // ─── Step 2: Metal Options ──────────────────────────────
  const [selectedPurities, setSelectedPurities] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  // Primary active preview color pill
  const [activeColorPill, setActiveColorPill] = useState('');

  // ─── Center Stone & Side Stone Configuration Modes ──
  const [stoneConfigType, setStoneConfigType] = useState('centerDiamond'); // 'centerDiamond' | 'colorStone'
  const [sideStoneConfigType, setSideStoneConfigType] = useState('sideDiamond'); // 'sideDiamond' | 'sideColorStone' | 'both' | 'none'

  // Center Color Stone State
  const [colorStoneType, setColorStoneType] = useState('');
  const [colorStoneShape, setColorStoneShape] = useState('');
  const [colorStoneCarats, setColorStoneCarats] = useState([]);
  const [colorStoneCaratInput, setColorStoneCaratInput] = useState('');

  // Side Color Stone State
  const [sideColorStoneRows, setSideColorStoneRows] = useState([]);
  const [sideColorStoneType, setSideColorStoneType] = useState('');
  const [sideColorStoneShape, setSideColorStoneShape] = useState('');
  const [sideColorStoneCarat, setSideColorStoneCarat] = useState('');
  const [sideColorStonePieces, setSideColorStonePieces] = useState('');

  // ─── Step 2: Center Diamond Configuration (Portal Match) ──
  const [centerDiamondType, setCenterDiamondType] = useState('');
  const [centerDiamondShape, setCenterDiamondShape] = useState('');
  const [centerDiamondColors, setCenterDiamondColors] = useState([]);
  const [centerDiamondClarities, setCenterDiamondClarities] = useState([]);
  const [centerDiamondCarats, setCenterDiamondCarats] = useState([]);
  const [caratInput, setCaratInput] = useState('');
  const [customComboRates, setCustomComboRates] = useState({});
  const [apiCenterRates, setApiCenterRates] = useState([]);
  const [sideRows, setSideRows] = useState([]);
  const [automaticPricing, setAutomaticPricing] = useState(true);
  const [baseCarat, setBaseCarat] = useState('');
  const [baseCaratManuallyEdited, setBaseCaratManuallyEdited] = useState(false);
  const [gstPercentage, setGstPercentage] = useState('3');
  const [computingPrices, setComputingPrices] = useState(false);

  const centerTypeId = useMemo(() => {
    if (!centerDiamondType) return '';
    const match = (diamondMasters.types || []).find((t) =>
      (t.name || t) === centerDiamondType || String(t._id || t.id) === String(centerDiamondType)
    );
    return match?._id || match?.id || (/^[a-f\d]{24}$/i.test(centerDiamondType) ? centerDiamondType : '');
  }, [centerDiamondType, diamondMasters.types]);

  const centerShapeId = useMemo(() => {
    if (!centerDiamondShape) return '';
    const match = (diamondMasters.shapes || []).find((s) =>
      (s.name || s) === centerDiamondShape || String(s._id || s.id) === String(centerDiamondShape)
    );
    return match?._id || match?.id || (/^[a-f\d]{24}$/i.test(centerDiamondShape) ? centerDiamondShape : '');
  }, [centerDiamondShape, diamondMasters.shapes]);

  // Fetch live diamond pricing master from backend lookup API filtered by diamondTypeId and diamondShapeId
  useEffect(() => {
    if (activeStep < 2) return;
    if (!centerTypeId && !centerShapeId) {
      setApiCenterRates([]);
      return;
    }

    let active = true;
    const fetchLiveRates = async () => {
      try {
        const params = new URLSearchParams();
        if (centerTypeId) params.set('diamondTypeId', centerTypeId);
        if (centerShapeId) params.set('diamondShapeId', centerShapeId);
        const qs = params.toString();
        const url = `/center-diamond-prices/lookup${qs ? `?${qs}` : ''}`;
        const res = await api.get(url);
        if (!active) return;
        const items = res.data?.data?.items || res.data?.data || [];
        if (Array.isArray(items)) {
          setApiCenterRates(items);
        }
      } catch (err) {
        if (!active) return;
        console.warn('Center diamond prices live lookup notice:', err);
      }
    };
    fetchLiveRates();
    return () => { active = false; };
  }, [activeStep, centerTypeId, centerShapeId]);

  const centerColorOptions = diamondColorsList;
  const centerClarityOptions = diamondClaritiesList;

  const getCenterDiamondRate = (type, shape, color, clarity, carat) => {
    const key = `${type}-${shape}-${color}-${clarity}-${carat}`;
    if (customComboRates[key] !== undefined) {
      return customComboRates[key];
    }

    // Check live API master rates first
    if (apiCenterRates.length > 0) {
      const ctNum = Number(carat) || 1;
      const matched = apiCenterRates.find((r) => {
        const tName = String(r.diamondTypeId?.name || '').toUpperCase();
        const tId = String(r.diamondTypeId?._id || r.diamondTypeId || '');
        const sName = String(r.diamondShapeId?.name || r.diamondShape || '').toUpperCase();
        const sId = String(r.diamondShapeId?._id || r.diamondShapeId || '');
        const cName = String(r.diamondColorId?.name || r.diamondColor || '').toUpperCase();
        const cId = String(r.diamondColorId?._id || r.diamondColorId || '');
        const clName = String(r.diamondClarityId?.name || r.diamondClarity || '').toUpperCase();
        const clId = String(r.diamondClarityId?._id || r.diamondClarityId || '');
        const from = Number(r.sizeFrom ?? 0);
        const to = Number(r.sizeTo ?? 999);

        const typeMatch = !type || tName === String(type).toUpperCase() || tId === String(type);
        const shapeMatch = !shape || sName === String(shape).toUpperCase() || sId === String(shape);
        const colorMatch = !color || cName === String(color).toUpperCase() || cId === String(color);
        const clarityMatch = !clarity || clName === String(clarity).toUpperCase() || clId === String(clarity);

        return (
          typeMatch &&
          shapeMatch &&
          colorMatch &&
          clarityMatch &&
          ctNum >= from &&
          ctNum <= to
        );
      });

      if (matched && Number(matched.priceINR) > 0) {
        return Number(matched.priceINR);
      }
    }

    // No matching rate found in Diamond Pricing Master — return 0
    // Admin must configure rates in Diamond Config > Pricing Master
    return 0;
  };

  const centerDiamondCombinations = useMemo(() => {
    const combos = [];
    centerDiamondColors.forEach((color) => {
      centerDiamondClarities.forEach((clarity) => {
        centerDiamondCarats.forEach((carat) => {
          const comboId = `${centerDiamondType}-${centerDiamondShape}-${color}-${clarity}-${carat}`;
          const rate = getCenterDiamondRate(centerDiamondType, centerDiamondShape, color, clarity, carat);
          combos.push({
            id: comboId,
            diamondType: centerDiamondType,
            shape: centerDiamondShape,
            color,
            clarity,
            carat,
            rate,
            totalPrice: carat * rate,
          });
        });
      });
    });
    return combos;
  }, [
    centerDiamondType,
    centerDiamondShape,
    centerDiamondColors,
    centerDiamondClarities,
    centerDiamondCarats,
    customComboRates,
    apiCenterRates,
  ]);

  // Auto-derive Base Carat benchmark from center diamonds if not manually customized
  useEffect(() => {
    if (!baseCaratManuallyEdited && centerDiamondCarats.length > 0) {
      const minCarat = centerDiamondCarats[0];
      if (minCarat > 0) {
        setBaseCarat(String(minCarat));
      }
    }
  }, [centerDiamondCarats, baseCaratManuallyEdited]);

  const handleAddCarat = () => {
    const val = parseFloat(caratInput.trim());
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid carat weight');
      return;
    }
    if (centerDiamondCarats.includes(val)) {
      toast.error('Carat weight already added');
      return;
    }
    setCenterDiamondCarats((prev) => [...prev, val].sort((a, b) => a - b));
    setCaratInput('');
  };

  const handleRemoveCarat = (val) => {
    setCenterDiamondCarats((prev) => prev.filter((c) => c !== val));
  };

  const toggleCenterColor = (col) => {
    setCenterDiamondColors((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };

  const toggleCenterClarity = (cla) => {
    setCenterDiamondClarities((prev) =>
      prev.includes(cla)
        ? prev.filter((c) => c !== cla)
        : [...prev, cla]
    );
  };

  const handleUpdateComboRate = (comboId, newRate) => {
    setCustomComboRates((prev) => ({
      ...prev,
      [comboId]: newRate,
    }));
  };

  const handleAddColorStoneCarat = () => {
    const val = parseFloat(colorStoneCaratInput.trim());
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid carat weight');
      return;
    }
    if (colorStoneCarats.includes(val)) {
      toast.error('Carat weight already added');
      return;
    }
    setColorStoneCarats((prev) => [...prev, val].sort((a, b) => a - b));
    setColorStoneCaratInput('');
  };

  const handleRemoveColorStoneCarat = (val) => {
    const target = Number(val);
    setColorStoneCarats((prev) => prev.filter((c) => Number(c) !== target));
  };

  const handleUpdateColorStoneCarat = (oldVal, newVal) => {
    const oldNum = Number(oldVal);
    const newNum = Number(newVal);
    if (isNaN(newNum) || newNum <= 0) return;
    if (oldNum === newNum) return;
    if (colorStoneCarats.some((c) => Number(c) === newNum)) {
      toast.error(`Carat weight ${newNum} ct already exists`);
      return;
    }
    setColorStoneCarats((prev) =>
      prev.map((c) => (Number(c) === oldNum ? newNum : c)).sort((a, b) => a - b)
    );
    toast.success(`Updated carat to ${newNum} ct`);
  };

  const handleAddColorStoneRow = () => {
    if (!colorStoneType && diamondTypesList.length > 0) {
      setColorStoneType(diamondTypesList[0]?.value || diamondTypesList[0]?.label || '');
    }
    if (!colorStoneShape && diamondShapesList.length > 0) {
      setColorStoneShape(diamondShapesList[0]?.value || diamondShapesList[0]?.label || '');
    }

    const inputVal = parseFloat(colorStoneCaratInput.trim());
    if (!isNaN(inputVal) && inputVal > 0) {
      if (colorStoneCarats.map(Number).includes(inputVal)) {
        toast.error(`Carat weight ${inputVal} ct already exists`);
        return;
      }
      setColorStoneCarats((prev) => [...prev, inputVal].sort((a, b) => a - b));
      setColorStoneCaratInput('');
      toast.success(`Added ${inputVal} ct combination row`);
      return;
    }

    let nextCarat = 1;
    if (colorStoneCarats.length > 0) {
      const maxVal = Math.max(...colorStoneCarats.map(Number));
      nextCarat = Math.round((maxVal + 0.5) * 100) / 100;
      while (colorStoneCarats.map(Number).includes(nextCarat)) {
        nextCarat = Math.round((nextCarat + 0.5) * 100) / 100;
      }
    }
    setColorStoneCarats((prev) => [...prev, nextCarat].sort((a, b) => a - b));
    toast.success(`Added new row (${nextCarat} ct)`);
  };

  const colorStoneCombinations = useMemo(() => {
    if (stoneConfigType !== 'colorStone') return [];
    const combos = [];
    colorStoneCarats.forEach((carat) => {
      const comboId = `CS-${colorStoneType}-${colorStoneShape}-${carat}`;
      const rate = 3000;
      combos.push({
        id: comboId,
        diamondType: colorStoneType,
        shape: colorStoneShape,
        carat: Number(carat),
        rate,
        totalPrice: Number(carat) * rate,
      });
    });
    return combos;
  }, [stoneConfigType, colorStoneType, colorStoneShape, colorStoneCarats]);

  const totalColorStoneWeight = useMemo(() => {
    return colorStoneCombinations.reduce((sum, c) => sum + (Number(c.carat) || 0), 0);
  }, [colorStoneCombinations]);

  const totalColorStonePrice = useMemo(() => {
    return colorStoneCombinations.reduce((sum, c) => sum + (Number(c.totalPrice) || 0), 0);
  }, [colorStoneCombinations]);

  const handleAddSideColorStoneRow = () => {
    const val = parseFloat(sideColorStoneCarat.trim());
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid carat weight');
      return;
    }
    const newRow = {
      id: Date.now(),
      diamondTypeId: masterId(diamondMasters.types, sideColorStoneType) || sideColorStoneType,
      diamondShapeId: masterId(diamondMasters.shapes, sideColorStoneShape) || sideColorStoneShape,
      diamondType: sideColorStoneType,
      diamondShape: sideColorStoneShape,
      caratWeight: val,
      pieces: Number(sideColorStonePieces) || 1,
      pricePerCarat: 3000,
    };
    setSideColorStoneRows((prev) => [...prev, newRow]);
    setSideColorStoneCarat('');
    setSideColorStonePieces('');
  };

  const handleRemoveSideColorStoneRow = (idToRemove) => {
    setSideColorStoneRows((prev) => prev.filter((r) => r.id !== idToRemove));
  };

  // ─── Step 2: Auto-Generated Combinations & Preview Variants Collapse States ─────
  const [isCombinationsCollapsed, setIsCombinationsCollapsed] = useState(true);
  const [isVariantsPreviewCollapsed, setIsVariantsPreviewCollapsed] = useState(true);

  // ─── Step 2: Preview Variants ───────────────────────────
  const [variants, setVariants] = useState([]);
  const [variantPurityFilter, setVariantPurityFilter] = useState('ALL');

  // KT / Purity Grouping for Preview Variants table
  const purityGroups = useMemo(() => {
    const map = new Map();
    variants.forEach((v, index) => {
      const key = v.purity || 'Other Purity';
      if (!map.has(key)) {
        map.set(key, { purity: key, items: [] });
      }
      map.get(key).items.push({ v, index });
    });
    return Array.from(map.values());
  }, [variants]);

  const displayedPurityGroups = useMemo(() => {
    if (variantPurityFilter === 'ALL' || !purityGroups.some((g) => g.purity === variantPurityFilter)) {
      return purityGroups;
    }
    return purityGroups.filter((g) => g.purity === variantPurityFilter);
  }, [purityGroups, variantPurityFilter]);

  // ─── Step 4: Product Media & VTO State ────────────────
  const [productColors, setProductColors] = useState([]);
  const [activeMediaColor, setActiveMediaColor] = useState('');
  const [colorStatuses, setColorStatuses] = useState({});
  const [activeMediaSubTab, setActiveMediaSubTab] = useState('media'); // 'media' | 'vto'

  // High-Res Photography Per Metal Color
  const [mediaImages, setMediaImages] = useState({});

  // 360 Spin & Product Videos Per Metal Color
  const [mediaVideos, setMediaVideos] = useState({});
  const [showCompressionHub, setShowCompressionHub] = useState(false);
  const [compressionTab, setCompressionTab] = useState('all'); // 'all' | 'images' | 'videos'
  const [compressionQuality, setCompressionQuality] = useState(0.82);
  const [compressionFormat, setCompressionFormat] = useState('image/webp');
  const [selectedCompressionIds, setSelectedCompressionIds] = useState([]);
  const [compressionPreviews, setCompressionPreviews] = useState({});
  const [previewingCompression, setPreviewingCompression] = useState(false);
  const [compressingMedia, setCompressingMedia] = useState(false);
  const [pendingCompressionDeletes, setPendingCompressionDeletes] = useState([]);
  const [viewingCompressionMedia, setViewingCompressionMedia] = useState(null);
  const fetchedFileInfoKeysRef = useRef(new Set());

  // Auto-fetch file sizes from backend if any media image is missing size
  useEffect(() => {
    if (isSilverProduct) return;
    const currentImages = mediaImages[activeMediaColor] || [];
    const missing = currentImages.filter((img) => {
      const k = img.key || img.url;
      return k && !img.size && !img.fileSize && !fetchedFileInfoKeysRef.current.has(k);
    });
    if (missing.length === 0) return;

    // Immediately mark as requested to prevent duplicate requests across renders
    missing.forEach((img) => {
      if (img.key) fetchedFileInfoKeysRef.current.add(img.key);
      if (img.url) fetchedFileInfoKeysRef.current.add(img.url);
    });

    let cancelled = false;
    api.post('/upload/file-info', {
      keys: missing.map((img) => img.key || img.url),
    }).then((res) => {
      if (cancelled || !res.data) return;
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      const list = Array.isArray(raw) ? raw : [raw];
      const map = {};
      list.forEach((item) => {
        if (!item) return;
        if (item.key) map[item.key] = item;
        if (item.requestedKey) map[item.requestedKey] = item;
      });

      setMediaImages((prev) => {
        const colorList = prev[activeMediaColor] || [];
        let hasChanges = false;
        const updated = colorList.map((img) => {
          const meta = (img.key && map[img.key]) ||
            (img.url && map[img.url]) ||
            list.find((m) => m && m.key && ((img.key && img.key === m.key) || (img.url && img.url.includes(m.key))));
          if (meta && meta.fileSize) {
            hasChanges = true;
            return {
              ...img,
              fileSize: meta.fileSize,
              size: meta.size,
              allowCompression: meta.allowCompression,
            };
          }
          return img;
        });
        if (!hasChanges) return prev;
        return { ...prev, [activeMediaColor]: updated };
      });
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [activeMediaColor, mediaImages, isSilverProduct]);

  // Staged Upload Media (Local load -> Compression Confirmation -> Direct Cloudflare R2 Upload)
  const [stagedUploadFiles, setStagedUploadFiles] = useState([]);
  const [stagedUploadColor, setStagedUploadColor] = useState('');
  const [stagedUploadType, setStagedUploadType] = useState('jewelry'); // 'jewelry' | 'silver'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imageUploadPolicy, setImageUploadPolicy] = useState({ enabled: true, quality: 82, format: 'image/webp' });
  const [uploadCompressVideos, setUploadCompressVideos] = useState(true);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadProcessingStep, setUploadProcessingStep] = useState('');
  const [uploadProcessingPercent, setUploadProcessingPercent] = useState(0);

  const totalStagedBytes = useMemo(() => {
    return stagedUploadFiles.reduce((acc, item) => acc + (item.size || 0), 0);
  }, [stagedUploadFiles]);

  useEffect(() => {
    let cancelled = false;
    getUploadCompressionSettings().then((settings) => {
      if (cancelled) return;
      setImageUploadPolicy(settings);
      setCompressionQuality(settings.quality / 100);
      setCompressionFormat(settings.format);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!showCompressionHub || (compressionTab !== 'images' && compressionTab !== 'all')) return undefined;
    const selected = (mediaImages[activeMediaColor] || []).filter((image) => selectedCompressionIds.includes(image.id));
    if (!selected.length) {
      setCompressionPreviews({});
      setPreviewingCompression(false);
      return undefined;
    }

    let cancelled = false;
    setPreviewingCompression(true);
    const timer = window.setTimeout(async () => {
      const entries = await Promise.all(selected.map(async (image) => {
        try {
          const file = await compressImageAsset(image, compressionQuality, compressionFormat);
          return [image.id, { file, originalSize: file.originalSize, compressedSize: file.size }];
        } catch {
          return [image.id, null];
        }
      }));
      if (!cancelled) {
        setCompressionPreviews(Object.fromEntries(entries));
        setPreviewingCompression(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showCompressionHub, compressionTab, activeMediaColor, mediaImages, selectedCompressionIds, compressionQuality, compressionFormat]);

  // Virtual Try-On (VTO) Configuration Per Metal Color
  const [vtoConfigs, setVtoConfigs] = useState({});

  // ─── Silver Color Variant Configuration State ──────────────
  const [silverColors, setSilverColors] = useState([]);
  const [silverVariantMedia, setSilverVariantMedia] = useState({});
  const [expandedSilverColors, setExpandedSilverColors] = useState([]);
  const [uploadingSilverSwatchColor, setUploadingSilverSwatchColor] = useState(null);
  const [uploadingSilverVariantColor, setUploadingSilverVariantColor] = useState(null);
  const { openImagePreview } = useImagePreview();
  const handleOpenImagePreview = (imageUrl, gallery = []) => {
    openImagePreview(imageUrl, { gallery });
  };

  const silverColorOptions = useMemo(() => {
    const list = colorsList || [];
    const map = new Map();
    list.forEach((c) => {
      const sphere = getSphereStyle(c);
      map.set(c.name.toLowerCase(), {
        id: c.id || c._id,
        name: c.name,
        hex: c.colorCode || c.code,
        sphereGradient: sphere.gradient,
        sphereShadow: sphere.shadow,
      });
    });
    silverColors.forEach((name) => {
      if (name && name.toLowerCase() !== 'general' && !map.has(name.toLowerCase())) {
        const sphere = getSphereStyle(name);
        map.set(name.toLowerCase(), {
          id: undefined,
          name,
          hex: '',
          sphereGradient: sphere.gradient,
          sphereShadow: sphere.shadow,
        });
      }
    });
    return Array.from(map.values());
  }, [colorsList, silverColors]);

  const isSilverColorSelected = (colorName) => {
    return silverColors.some(
      (c) => c?.toLowerCase() === colorName?.toLowerCase()
    );
  };

  const handleToggleSilverColor = (colorName) => {
    setSilverColors((prev) => {
      const exists = prev.some((c) => c?.toLowerCase() === colorName?.toLowerCase());
      if (exists) {
        return prev.filter((c) => c?.toLowerCase() !== colorName?.toLowerCase());
      }
      return [...prev, colorName];
    });
  };

  // Auto-expand any silver color box that contains images/media or a swatch icon
  useEffect(() => {
    const sColorsWithMedia = Object.keys(silverVariantMedia).filter(
      (cName) => (silverVariantMedia[cName]?.media?.length > 0) || Boolean(silverVariantMedia[cName]?.swatchIcon)
    );
    if (sColorsWithMedia.length > 0) {
      setExpandedSilverColors((prev) => {
        const next = [...prev];
        let changed = false;
        sColorsWithMedia.forEach((c) => {
          if (!next.some((existing) => existing.toLowerCase() === c.toLowerCase())) {
            next.push(c);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [silverVariantMedia]);

  const isSilverColorExpanded = (colorName) => {
    return expandedSilverColors.some((c) => c?.toLowerCase() === colorName?.toLowerCase());
  };

  const handleToggleSilverExpand = (colorName) => {
    setExpandedSilverColors((prev) =>
      prev.some((c) => c?.toLowerCase() === colorName?.toLowerCase())
        ? prev.filter((c) => c?.toLowerCase() !== colorName?.toLowerCase())
        : [...prev, colorName]
    );
  };

  const handleToggleAllSilverExpand = () => {
    const allKeys = [...silverColorOptions.map((c) => c.name), 'General'];
    setExpandedSilverColors((prev) =>
      prev.length >= allKeys.length
        ? []
        : allKeys
    );
  };

  const handleSilverSwatchUpload = (colorName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file.name);
    if (!isImage) {
      toast.error(`${file.name} is not a supported image file`);
      if (e.target) e.target.value = '';
      return;
    }

    const staged = [
      {
        id: `staged-swatch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatMediaSize(file.size),
        type: file.type || 'image/jpeg',
        previewUrl: URL.createObjectURL(file),
        isVideo: false,
        isImage: true,
        status: 'ready',
        error: null,
      },
    ];

    setStagedUploadFiles(staged);
    setStagedUploadColor(colorName);
    setStagedUploadType('silver-swatch');
    setShowUploadModal(true);
    if (e.target) e.target.value = '';
  };

  const handleSilverVariantMediaUpload = (colorName, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles = files.filter((file) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
      if (!isVideo && !isImage) toast.error(`${file.name} is not a supported image or video`);
      return isImage || isVideo;
    });
    if (!validFiles.length) {
      if (e.target) e.target.value = '';
      return;
    }

    const staged = validFiles.map((file, idx) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
      return {
        id: `staged-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatMediaSize(file.size),
        type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        previewUrl: URL.createObjectURL(file),
        isVideo,
        isImage,
        status: 'ready',
        error: null,
      };
    });

    setStagedUploadFiles(staged);
    setStagedUploadColor(colorName);
    setStagedUploadType('silver');
    setShowUploadModal(true);
    if (e.target) e.target.value = '';
  };

  const handleRemoveSilverSwatchIcon = async (colorName) => {
    try {
      await deleteUploadedFile(silverVariantMedia[colorName]?.swatchIcon);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete image from storage');
      return;
    }
    setSilverVariantMedia((prev) => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        swatchIcon: '',
      },
    }));
    toast.success(`Removed swatch icon for ${colorName}`);
  };

  const handleRemoveSilverVariantMedia = async (colorName, mediaId) => {
    const media = (silverVariantMedia[colorName]?.media || []).find((item) => item.id === mediaId);
    try {
      await deleteUploadedFile(media);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete media from storage');
      return;
    }
    setSilverVariantMedia((prev) => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        media: (prev[colorName]?.media || []).filter((m) => m.id !== mediaId),
      },
    }));
  };

  // Modals state
  const [isAddColorModalOpen, setIsAddColorModalOpen] = useState(false);

  // Virtual Try-On Studio Modal State
  const [isVtoStudioOpen, setIsVtoStudioOpen] = useState(false);
  const [vtoEditingColor, setVtoEditingColor] = useState('');
  const [vtoForm, setVtoForm] = useState({
    vtoCategory: 'neck',
    top: 50.0,
    left: 50.0,
    scale: 100.0,
    clipBottom: 0.0,
    rotation: 0.0,
    overlayUrl: '',
    overlayName: '',
    overlaySize: '',
    uploadedAt: '',
    skinTone: 'light',
  });

  // VTO Master Global Environments fetched from /vto-masters/lookup API
  const [vtoMasters, setVtoMasters] = useState({});
  const [vtoEnvOptions, setVtoEnvOptions] = useState([]);
  const vtoMastersFetchedRef = useRef(false);

  const formatVtoEnvLabel = (master) => {
    if (master?.label) return master.label;
    const part = String(master?.bodyPart || master?.partKey || '').toLowerCase().trim();
    const labelMap = {
      neck: 'Neck View (Necklaces & Pendants)',
      hand: 'Hand View (Rings)',
      ear: 'Ear View (Earrings)',
      wrist: 'Wrist View (Bracelets & Bangles)',
    };
    return labelMap[part] || (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)} View` : '');
  };

  useEffect(() => {
    // Call /vto-masters/lookup API when user enters Step 3 (Product Media) or opens VTO Studio
    if ((activeStep !== 3 && activeStep !== 4 && !isVtoStudioOpen) || vtoMastersFetchedRef.current) return;

    const fetchVtoMasters = async () => {
      try {
        vtoMastersFetchedRef.current = true;
        const res = await vtoMastersAPI.getLookup();
        const items = res.data?.data?.items || res.data?.data || [];
        if (Array.isArray(items)) {
          const map = {};
          const opts = [];
          items.forEach((m) => {
            const key = String(m.bodyPart || m.partKey || '').toLowerCase().trim();
            if (key) {
              map[key] = {
                light: getMediaUrl(m.lightImage?.url),
                dark: getMediaUrl(m.darkImage?.url),
              };
              opts.push({
                id: m._id || key,
                value: key,
                label: formatVtoEnvLabel(m),
              });
            }
          });
          setVtoMasters(map);
          setVtoEnvOptions(opts);
        }
      } catch (err) {
        vtoMastersFetchedRef.current = false;
        console.warn('VTO Masters fetch notice:', err);
      }
    };
    fetchVtoMasters();
  }, [activeStep, isVtoStudioOpen]);

  const handleCloseCompressionHub = () => {
    setCompressingMedia(false);
    setShowCompressionHub(false);
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewingCompressionMedia) {
          setViewingCompressionMedia(null);
        } else if (showUploadModal && !isProcessingUpload) {
          handleCloseUploadModal();
        } else if (showCompressionHub) {
          handleCloseCompressionHub();
        } else if (isVtoStudioOpen) {
          setIsVtoStudioOpen(false);
        } else if (isAddColorModalOpen) {
          setIsAddColorModalOpen(false);
        }
      }
    };
    if (isVtoStudioOpen || isAddColorModalOpen || showCompressionHub || viewingCompressionMedia || showUploadModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVtoStudioOpen, isAddColorModalOpen, showCompressionHub, viewingCompressionMedia, showUploadModal, isProcessingUpload]);

  // Synchronize colorImages to MongoDB when in edit mode
  const syncColorImagesToDb = async (latestImages = mediaImages, latestVideos = mediaVideos) => {
    if (!productId) return;
    try {
      const mediaColorNames = productColors.length
        ? productColors
        : (latestImages['']?.length || latestVideos['']?.length ? [''] : [activeMediaColor]);
      const updatedColorImageRows = mediaColorNames.flatMap((colorName) => {
        const color = colorsList.find((item) => item.name?.toLowerCase() === colorName.toLowerCase());
        const images = (latestImages[colorName] || []).filter((item) => item?.url).map((item) => ({
          url: item.url,
          key: item.key || '',
          mediaType: 'image',
          ...(item.fileSize ? { fileSize: item.fileSize } : {}),
          ...(item.size ? { size: item.size } : {}),
          ...(item.allowCompression !== undefined ? { allowCompression: item.allowCompression } : {}),
        }));
        const videos = (latestVideos[colorName] || []).filter((item) => item?.url).map((item) => ({
          url: item.url,
          key: item.key || '',
          mediaType: 'video',
          ...(item.fileSize ? { fileSize: item.fileSize } : {}),
          ...(item.size ? { size: item.size } : {}),
        }));
        const vto = vtoConfigs[colorName] || {};
        const hasVto = Boolean(vto.isConfigured && vto.overlayUrl);
        if (!images.length && !videos.length && !hasVto) return [];

        return [{
          status: colorStatuses[colorName] ?? 'active',
          ...(color?.id || color?._id ? { metalColorId: color.id || color._id } : {}),
          ...(images.length || videos.length ? { images: [...images, ...videos] } : {}),
          ...(hasVto ? {
            vtoImage: {
              url: vto.overlayUrl,
              ...(vto.overlayPublicId ? { key: vto.overlayPublicId } : {}),
            },
            ...(vto.vtoCategory ? { vtoCategory: vto.vtoCategory } : {}),
            ...(vto.top !== undefined ? { vtoConfig: { top: vto.top, left: vto.left, scale: vto.scale } } : {}),
          } : {}),
        }];
      });

      if (updatedColorImageRows.length > 0) {
        await api.put(`/products/${productId}`, { colorImages: updatedColorImageRows });
      }
    } catch (syncErr) {
      console.warn('[syncColorImagesToDb] Auto-sync to DB notice:', syncErr?.message);
    }
  };

  const handleCloseUploadModal = () => {
    if (isProcessingUpload) {
      toast.error('Upload in progress, please wait until finished');
      return;
    }
    stagedUploadFiles.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore revocation error
        }
      }
    });
    setStagedUploadFiles([]);
    setShowUploadModal(false);
  };

  const handleRemoveStagedFile = (fileId) => {
    if (isProcessingUpload) return;
    setStagedUploadFiles((prev) => {
      const target = prev.find((item) => item.id === fileId);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // ignore revocation error
        }
      }
      const updated = prev.filter((item) => item.id !== fileId);
      if (updated.length === 0) {
        setShowUploadModal(false);
      }
      return updated;
    });
  };

  const handleConfirmStagedUpload = async () => {
    if (!stagedUploadFiles.length) return;
    setIsProcessingUpload(true);
    setUploadProcessingPercent(0);

    const uploadedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const targetColor = stagedUploadColor;
    const isSilver = stagedUploadType === 'silver';
    const isSilverSwatch = stagedUploadType === 'silver-swatch';

    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;
    let successfulCount = 0;
    const newMediaItems = [];

    const toastId = 'staged-upload-toast';
    toast.loading(`Starting upload for ${stagedUploadFiles.length} file(s)...`, { id: toastId });

    if (isSilver) setUploadingSilverVariantColor(targetColor);
    if (isSilverSwatch) setUploadingSilverSwatchColor(targetColor);
    try {
      const uploadSettings = await getUploadCompressionSettings();
      const preset = isSilverSwatch
        ? (COMPRESSION_PRESETS.swatch || COMPRESSION_PRESETS.products)
        : (COMPRESSION_PRESETS.products || COMPRESSION_PRESETS.general);
      const compressionOpts = getGlobalCompressionOptions(preset, uploadSettings);

      // --- STEP 1: Client-Side Preparation & Compression ---
      const preparedFiles = [];
      for (let i = 0; i < stagedUploadFiles.length; i++) {
        const item = stagedUploadFiles[i];
        totalOriginalBytes += item.size;

        let fileToUpload = item.file;
        let wasCompressed = false;

        if (item.isImage && imageUploadPolicy.enabled && uploadSettings.enabled && isCompressibleImage(item.file)) {
          setStagedUploadFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'compressing' } : f))
          );
          setUploadProcessingStep(`Optimizing image ${i + 1} of ${stagedUploadFiles.length}: ${item.name}`);
          toast.loading(`Optimizing image (${i + 1}/${stagedUploadFiles.length}): ${item.name}...`, { id: toastId });
          try {
            fileToUpload = await compressImageFile(item.file, compressionOpts);
            wasCompressed = Boolean(fileToUpload.wasCompressed);
          } catch (compErr) {
            console.warn(`[handleConfirmStagedUpload] Image compression skipped for ${item.name}:`, compErr);
            fileToUpload = item.file;
          }
        } else if (item.isVideo && uploadCompressVideos) {
          setStagedUploadFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'compressing' } : f))
          );
          setUploadProcessingStep(`Encoding video ${i + 1} of ${stagedUploadFiles.length}: ${item.name}`);
          toast.loading(`Encoding video (${i + 1}/${stagedUploadFiles.length}): ${item.name}...`, { id: toastId });
          try {
            fileToUpload = await compressLocalVideoFile(item.file, 0.82);
            wasCompressed = Boolean(fileToUpload.wasCompressed);
          } catch (compErr) {
            console.warn(`[handleConfirmStagedUpload] Video compression skipped for ${item.name}:`, compErr);
            fileToUpload = item.file;
          }
        }

        preparedFiles.push({ item, fileToUpload, wasCompressed });
      }

      // --- STEP 2: Request Presigned Upload URLs in a Single Batch Request ---
      setUploadProcessingStep(`Requesting upload URLs for ${preparedFiles.length} file(s)...`);
      toast.loading(`Requesting upload URLs for ${preparedFiles.length} file(s)...`, { id: toastId });

      const fileContentType = (file) => {
        const rawType = (file.type || '').split(';')[0].trim().toLowerCase();
        return rawType || (
          /\.png$/i.test(file.name) ? 'image/png'
            : /\.webp$/i.test(file.name) ? 'image/webp'
              : /\.mp4$/i.test(file.name) ? 'video/mp4'
                : /\.webm$/i.test(file.name) ? 'video/webm'
                  : /\.(mov|m4v)$/i.test(file.name) ? 'video/quicktime'
                    : 'image/jpeg'
        );
      };

      const filesPayload = preparedFiles.map(({ fileToUpload }) => ({
        name: fileToUpload.name,
        contentType: fileContentType(fileToUpload),
      }));

      const presignedRes = await api.post('/upload/presigned-url', {
        module: 'products',
        productId: mediaProductId,
        files: filesPayload,
      });

      const uploadSlots = presignedRes.data?.data;
      if (!Array.isArray(uploadSlots) || uploadSlots.length !== preparedFiles.length) {
        throw new Error('Failed to obtain presigned upload URLs from server');
      }

      // --- STEP 3: Direct PUT Upload to Cloudflare R2 ---
      for (let i = 0; i < preparedFiles.length; i++) {
        const { item, fileToUpload, wasCompressed } = preparedFiles[i];
        const slot = uploadSlots[i];
        const contentType = slot.contentType || filesPayload[i].contentType;

        setStagedUploadFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
        );
        const currentPct = Math.round((i / preparedFiles.length) * 100);
        setUploadProcessingPercent(currentPct);
        setUploadProcessingStep(`Uploading to Cloudflare ${i + 1} of ${preparedFiles.length}: ${fileToUpload.name}`);
        toast.loading(`Uploading to Cloudflare (${i + 1}/${preparedFiles.length}): ${fileToUpload.name}...`, { id: toastId });

        await axios.put(slot.uploadUrl, fileToUpload, {
          headers: { 'Content-Type': contentType },
        });

        const finalUrl = slot.fileUrl || slot.url;
        totalCompressedBytes += fileToUpload.size;

        const displaySize = formatMediaSize(fileToUpload.size);
        const mediaRecord = {
          id: `${item.isVideo ? 'vid' : 'img'}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          url: finalUrl,
          key: slot.key,
          name: slot.name || fileToUpload.name,
          title: slot.name || fileToUpload.name,
          size: displaySize,
          fileSize: fileToUpload.size,
          uploadedAt,
          mediaType: item.isVideo ? 'video' : 'image',
          wasCompressed: Boolean(wasCompressed || fileToUpload.wasCompressed),
        };

        newMediaItems.push({ item, mediaRecord, isVideo: item.isVideo });

        setStagedUploadFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f))
        );
        successfulCount++;
      }

      setUploadProcessingPercent(100);

      // --- STEP 3: Update State & Sync DB ---
      if (isSilverSwatch) {
        const swatchRecord = newMediaItems[0]?.mediaRecord;
        if (swatchRecord?.url) {
          setSilverVariantMedia((prev) => ({
            ...prev,
            [targetColor]: {
              ...prev[targetColor],
              swatchIcon: swatchRecord.url,
              swatchIconKey: swatchRecord.key,
            },
          }));
          setSilverColors((prev) => Array.from(new Set([...prev, targetColor])));
          setExpandedSilverColors((prev) => Array.from(new Set([...prev, targetColor])));
        }
      } else if (isSilver) {
        setSilverVariantMedia((prev) => ({
          ...prev,
          [targetColor]: {
            ...prev[targetColor],
            media: [...(prev[targetColor]?.media || []), ...newMediaItems.map((n) => n.mediaRecord)],
          },
        }));
        setSilverColors((prev) => Array.from(new Set([...prev, targetColor])));
      } else {
        const newImages = newMediaItems.filter((n) => !n.isVideo).map((n) => n.mediaRecord);
        const newVideos = newMediaItems.filter((n) => n.isVideo).map((n) => n.mediaRecord);

        let nextImagesMap = { ...mediaImages };
        let nextVideosMap = { ...mediaVideos };

        if (newImages.length > 0) {
          const current = mediaImages[targetColor] || [];
          const withPrimary = newImages.map((img, idx) => ({
            ...img,
            isPrimary: current.length === 0 && idx === 0,
          }));
          nextImagesMap[targetColor] = [...current, ...withPrimary];
          setMediaImages(nextImagesMap);
        }
        if (newVideos.length > 0) {
          nextVideosMap[targetColor] = [...(mediaVideos[targetColor] || []), ...newVideos];
          setMediaVideos(nextVideosMap);
        }

        if (productId) {
          await syncColorImagesToDb(nextImagesMap, nextVideosMap);
        }
      }

      const savedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
      const savedPercent = totalOriginalBytes > 0 ? Math.round((savedBytes / totalOriginalBytes) * 100) : 0;

      if (isSilverSwatch) {
        if (savedBytes > 0) {
          toast.success(
            `Optimized & uploaded ${targetColor} swatch icon! Saved ${formatMediaSize(savedBytes)} (${savedPercent}%) direct to Cloudflare!`,
            { id: toastId, duration: 5000 }
          );
        } else {
          toast.success(`Uploaded ${targetColor} swatch icon direct to Cloudflare!`, { id: toastId });
        }
      } else if (savedBytes > 0) {
        toast.success(
          `Compressed & uploaded ${successfulCount} file(s)! Saved ${formatMediaSize(savedBytes)} (${savedPercent}%) direct to Cloudflare!`,
          { id: toastId, duration: 5000 }
        );
      } else {
        toast.success(`Uploaded ${successfulCount} file(s) direct to Cloudflare!`, { id: toastId });
      }

      stagedUploadFiles.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore revocation error
          }
        }
      });
      setStagedUploadFiles([]);
      setShowUploadModal(false);
    } catch (err) {
      console.error('[handleConfirmStagedUpload] Upload failed:', err);
      toast.error(`Upload error: ${err.message}`, { id: toastId });
    } finally {
      if (isSilver) setUploadingSilverVariantColor(null);
      if (isSilverSwatch) setUploadingSilverSwatchColor(null);
      setIsProcessingUpload(false);
      setUploadProcessingStep('');
      setUploadProcessingPercent(0);
    }
  };

  // Mixed Media Upload handler (Stages files locally and opens compression modal)
  const handleMixedMediaUpload = (e, colorName = activeMediaColor) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const validFiles = files.filter((file) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
      if (!isVideo && !isImage) toast.error(`${file.name} is not a supported image or video`);
      return isImage || isVideo;
    });
    if (!validFiles.length) {
      if (e.target) e.target.value = '';
      return;
    }

    const staged = validFiles.map((file, idx) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
      return {
        id: `staged-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatMediaSize(file.size),
        type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        previewUrl: URL.createObjectURL(file),
        isVideo,
        isImage,
        status: 'ready',
        error: null,
      };
    });

    setStagedUploadFiles(staged);
    setStagedUploadColor(colorName || activeMediaColor);
    setStagedUploadType('jewelry');
    setShowUploadModal(true);
    if (e.target) e.target.value = '';
  };


  // Handle VTO Overlay PNG Upload inside Studio Modal
  const handleVtoAssetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading(`Uploading VTO overlay ${file.name}...`, { id: 'vto-upload' });
      const { fileUrl, key } = await uploadWithPresignedUrl(file, 'vto');
      setVtoForm((prev) => ({
        ...prev,
        overlayUrl: fileUrl,
        overlayPublicId: key,
        overlayName: file.name,
        overlaySize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      }));
      toast.success('VTO overlay uploaded successfully!', { id: 'vto-upload' });
    } catch (err) {
      toast.error(`VTO upload failed: ${err.message}`, { id: 'vto-upload' });
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveMedia = async (colorName, imageId) => {
    const image = (mediaImages[colorName] || []).find((item) => item.id === imageId);
    try {
      await deleteUploadedFile(image);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete image from storage');
      return;
    }
    setMediaImages((prev) => {
      const currentList = prev[colorName] || [];
      const updatedList = currentList.filter((img) => img.id !== imageId);
      if (updatedList.length > 0 && !updatedList.some((img) => img.isPrimary)) {
        updatedList[0].isPrimary = true;
      }
      return {
        ...prev,
        [colorName]: updatedList,
      };
    });
    toast.success(`Removed image from ${colorName}`);
  };

  const handleRemoveVideo = async (colorName, videoId) => {
    const video = (mediaVideos[colorName] || []).find((item) => item.id === videoId);
    try {
      await deleteUploadedFile(video);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete video from storage');
      return;
    }
    setMediaVideos((prev) => ({
      ...prev,
      [colorName]: (prev[colorName] || []).filter((v) => v.id !== videoId),
    }));
    toast.success(`Removed video from ${colorName}`);
  };

  const handleSetPrimaryMedia = (colorName, imageId) => {
    setMediaImages((prev) => ({
      ...prev,
      [colorName]: (prev[colorName] || []).map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    }));
    toast.success(`Set primary image for ${colorName}`);
  };

  const handleApplyMediaCompression = async () => {
    const isVideosOnly = compressionTab === 'videos';
    const isImagesOnly = compressionTab === 'images';

    const imagesToCompress = !isVideosOnly
      ? (mediaImages[activeMediaColor] || []).filter((image) => selectedCompressionIds.includes(image.id) && !isSizeInKb(image.fileSize || image.size))
      : [];
    const videosToCompress = !isImagesOnly
      ? (mediaVideos[activeMediaColor] || []).filter((video) => selectedCompressionIds.includes(video.id))
      : [];

    if (!imagesToCompress.length && !videosToCompress.length) return;

    setCompressingMedia(true);
    let compressedCount = 0;
    let deletedCount = 0;
    let currentImages = { ...mediaImages };
    let currentVideos = { ...mediaVideos };

    try {
      // Compress selected images
      for (const asset of imagesToCompress) {
        try {
          const sizeMatch = String(asset.size || '').match(/[\d.]+/);
          const originalSize = Number(asset.fileSize) || (sizeMatch
            ? Number(sizeMatch[0]) * (String(asset.size).toLowerCase().includes('mb') ? 1024 * 1024 : 1024)
            : 0);
          const file = compressionPreviews[asset.id]?.file || await compressImageAsset(asset, compressionQuality, compressionFormat);
          const sourceSize = compressionPreviews[asset.id]?.originalSize || file.originalSize || originalSize;
          if (sourceSize && file.size >= sourceSize) continue;

          // Upload compressed image directly into product directory
          const uploaded = await uploadWithPresignedUrl(file, 'products', null, { productId: mediaProductId, compress: false });
          const replacement = {
            ...asset,
            url: uploaded.fileUrl,
            key: uploaded.key,
            name: file.name,
            title: asset.title || file.name,
            fileSize: file.size,
            size: formatMediaSize(file.size),
          };
          currentImages = {
            ...currentImages,
            [activeMediaColor]: (currentImages[activeMediaColor] || []).map((item) => item.id === asset.id ? replacement : item),
          };
          setMediaImages(currentImages);

          // Immediately delete uncompressed original from Cloudflare R2 to prevent storage charges
          const oldKey = getUploadedObjectKey(asset);
          if (oldKey && oldKey !== uploaded.key) {
            const deleted = await deleteUploadedFile(asset);
            if (deleted) deletedCount += 1;
          }

          compressedCount += 1;
        } catch (imgErr) {
          console.warn('[handleApplyMediaCompression] Image compression error for', asset.id, imgErr?.message);
        }
      }

      // Compress selected videos (if applicable)
      for (const asset of videosToCompress) {
        try {
          const sizeMatch = String(asset.size || '').match(/[\d.]+/);
          const originalSize = Number(asset.fileSize) || (sizeMatch
            ? Number(sizeMatch[0]) * (String(asset.size).toLowerCase().includes('mb') ? 1024 * 1024 : 1024)
            : 0);
          const file = await compressVideoAsset({ ...asset, fileSize: originalSize }, compressionQuality);
          if (originalSize && file.size >= originalSize) continue;

          // Upload compressed video directly into product directory
          const uploaded = await uploadWithPresignedUrl(file, 'products', null, { productId: mediaProductId });
          const replacement = {
            ...asset,
            url: uploaded.fileUrl,
            key: uploaded.key,
            name: file.name,
            title: file.name,
            fileSize: file.size,
            size: formatMediaSize(file.size),
          };
          currentVideos = {
            ...currentVideos,
            [activeMediaColor]: (currentVideos[activeMediaColor] || []).map((item) => item.id === asset.id ? replacement : item),
          };
          setMediaVideos(currentVideos);

          // Immediately delete uncompressed original video from Cloudflare R2 to prevent storage charges
          const oldKey = getUploadedObjectKey(asset);
          if (oldKey && oldKey !== uploaded.key) {
            const deleted = await deleteUploadedFile(asset);
            if (deleted) deletedCount += 1;
          }

          compressedCount += 1;
        } catch (vidErr) {
          console.warn('[handleApplyMediaCompression] Video compression skipped/failed for', asset.id, vidErr?.message);
        }
      }

      // If updating an existing product, immediately sync updated colorImages to DB
      if (productId && compressedCount > 0) {
        try {
          const mediaColorNames = productColors.length
            ? productColors
            : (currentImages['']?.length || currentVideos['']?.length ? [''] : [activeMediaColor]);
          const updatedColorImageRows = mediaColorNames.flatMap((colorName) => {
            const color = colorsList.find((item) => item.name?.toLowerCase() === colorName.toLowerCase());
            const images = (currentImages[colorName] || []).filter((item) => item?.url).map((item) => ({
              url: item.url,
              key: item.key || '',
              mediaType: 'image',
            }));
            const videos = (currentVideos[colorName] || []).filter((item) => item?.url).map((item) => ({
              url: item.url,
              key: item.key || '',
              mediaType: 'video',
            }));
            const vto = vtoConfigs[colorName] || {};
            const hasVto = Boolean(vto.isConfigured && vto.overlayUrl);
            if (!images.length && !videos.length && !hasVto) return [];

            return [{
              status: colorStatuses[colorName] ?? 'active',
              ...(color?.id || color?._id ? { metalColorId: color.id || color._id } : {}),
              ...(images.length || videos.length ? { images: [...images, ...videos] } : {}),
              ...(hasVto ? {
                vtoImage: {
                  url: vto.overlayUrl,
                  ...(vto.overlayPublicId ? { key: vto.overlayPublicId } : {}),
                },
                ...(vto.vtoCategory ? { vtoCategory: vto.vtoCategory } : {}),
                ...(vto.top !== undefined ? { vtoConfig: { top: vto.top, left: vto.left, scale: vto.scale } } : {}),
              } : {}),
            }];
          });

          if (updatedColorImageRows.length > 0) {
            await api.put(`/products/${productId}`, { colorImages: updatedColorImageRows });
          }
        } catch (syncErr) {
          console.warn('[handleApplyMediaCompression] Sync to DB notice:', syncErr?.message);
        }
      }

      setSelectedCompressionIds([]);
      setCompressionPreviews({});
      setShowCompressionHub(false);

      if (compressedCount) {
        const msg = deletedCount > 0
          ? `${compressedCount} media file${compressedCount === 1 ? '' : 's'} compressed. ${deletedCount} uncompressed original${deletedCount === 1 ? '' : 's'} deleted from Cloudflare R2.`
          : `${compressedCount} media file${compressedCount === 1 ? '' : 's'} compressed and updated.`;
        toast.success(msg);
      } else {
        toast('Selected media files are already at optimal compression', { icon: 'ℹ️' });
      }
    } catch (error) {
      toast.error(error.message || 'Could not compress media');
    } finally {
      setCompressingMedia(false);
    }
  };

  // Open VTO Studio for a specific metal color
  const handleOpenVtoStudio = (colorName) => {
    setVtoEditingColor(colorName);
    const cfg = vtoConfigs[colorName] || {};
    setVtoForm({
      vtoCategory: cfg.vtoCategory || vtoEnvOptions[0]?.value || 'neck',
      top: cfg.top ?? 50.0,
      left: cfg.left ?? 58.5,
      scale: cfg.scale ?? 100.0,
      clipBottom: cfg.clipBottom ?? 0.0,
      rotation: cfg.rotation ?? 0.0,
      overlayUrl: cfg.overlayUrl || (mediaImages[colorName]?.[0]?.url || ''),
      overlayName: cfg.overlayName || '',
      overlaySize: cfg.overlaySize || '',
      uploadedAt: cfg.uploadedAt || '',
      skinTone: 'light',
    });
    setIsVtoStudioOpen(true);
  };

  // Save VTO Studio Configuration
  const handleSaveVtoConfig = () => {
    setVtoConfigs((prev) => ({
      ...prev,
      [vtoEditingColor]: {
        isConfigured: true,
        overlayUrl: vtoForm.overlayUrl,
        overlayName: vtoForm.overlayName,
        overlaySize: vtoForm.overlaySize,
        uploadedAt: vtoForm.uploadedAt,
        vtoCategory: vtoForm.vtoCategory,
        top: Number(vtoForm.top),
        left: Number(vtoForm.left),
        scale: Number(vtoForm.scale),
        clipBottom: Number(vtoForm.clipBottom),
        rotation: Number(vtoForm.rotation),
      },
    }));
    setIsVtoStudioOpen(false);
    toast.success(`Virtual Try-On configured for ${vtoEditingColor}!`);
  };

  // Reset Precision Alignment
  const handleResetVtoAlignment = () => {
    setVtoForm((prev) => ({
      ...prev,
      top: 50.0,
      left: 50.0,
      scale: 100.0,
      clipBottom: 0.0,
      rotation: 0.0,
    }));
    toast.success('Alignment reset to defaults');
  };

  // Add a metal color to product media list
  const handleAddColor = (colorName) => {
    if (productColors.includes(colorName)) {
      toast.error(`${colorName} is already added.`);
      return;
    }
    setProductColors((prev) => [...prev, colorName]);
    setActiveMediaColor(colorName);
    if (!mediaImages[colorName]) {
      setMediaImages((prev) => ({ ...prev, [colorName]: [] }));
    }
    if (!mediaVideos[colorName]) {
      setMediaVideos((prev) => ({ ...prev, [colorName]: [] }));
    }
    if (!vtoConfigs[colorName]) {
      setVtoConfigs((prev) => ({
        ...prev,
        [colorName]: {
          isConfigured: false,
          overlayUrl: '',
          overlayName: '',
          overlaySize: '',
          uploadedAt: '',
          vtoCategory: 'hand',
          top: 50.0,
          left: 50.0,
          scale: 100.0,
          clipBottom: 0.0,
          rotation: 0.0,
        },
      }));
    }
    setIsAddColorModalOpen(false);
    toast.success(`Added ${colorName} to product media`);
  };

  // ─── Step 3: Specifications & Pricing ───────────────────
  const [specs, setSpecs] = useState({
    metalWeight: '',
    baseLabourCharge: '',
    certificateCharge: '',
    otherAmountPercentage: '',
  });

  // ─── Structured Pricing Block ───────────────────────────
  const [pricing, setPricing] = useState({
    ornatePrice: '',
    costPrice: '',
    markupPercentage: '',
    calculatedPrice: '',
    salePrice: '',
    mrpMarkupPercentage: '',
    mrp: '',
    displayPrice: '',
  });

  // Silver Pricing Handlers
  const handleSilverCostOrMarkupChange = (field, value) => {
    const numVal = Number(value) || 0;
    setPricing((prev) => {
      const next = { ...prev, [field]: value };
      const cost = field === 'costPrice' ? numVal : Number(next.costPrice) || 0;
      const markup = field === 'markupPercentage' ? numVal : Number(next.markupPercentage) || 0;
      const calculated = cost > 0 ? cost + Math.round((cost * markup) / 100) : 0;
      next.calculatedPrice = calculated;
      if (!prev.salePrice || Number(prev.salePrice) === Number(prev.calculatedPrice)) {
        next.salePrice = calculated;
        next.displayPrice = calculated;
        if (Number(prev.mrpMarkupPercentage) > 0) {
          next.mrp = Math.round(calculated * (1 + Number(prev.mrpMarkupPercentage) / 100));
        }
      }
      return next;
    });
  };

  const handleSilverSalePriceChange = (value) => {
    const sp = Number(value) || 0;
    setPricing((prev) => ({
      ...prev,
      salePrice: value,
      displayPrice: value,
      mrp: Number(prev.mrpMarkupPercentage) > 0 ? Math.round(sp * (1 + Number(prev.mrpMarkupPercentage) / 100)) : prev.mrp,
    }));
  };

  const handleSilverMrpMarkupChange = (value) => {
    const markupVal = Number(value) || 0;
    setPricing((prev) => ({
      ...prev,
      mrpMarkupPercentage: value,
      mrp: markupVal > 0 ? Math.round((Number(prev.salePrice) || 0) * (1 + markupVal / 100)) : prev.mrp,
    }));
  };

  // ─── Default Ornate Values (Not exposed in Jewelry Products UI) ────────
  const [ornate] = useState({
    tagNo: '',
    barcode: '',
    itemCode: '',
    goldAmt: 0,
    labourAmt: 0,
    diamondAmt: 0,
    stockQty: 0,
    isSold: false,
  });

  // ─── Step 5: SEO & Publish ──────────────────────────────
  const [seo, setSeo] = useState({
    slug: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    stockStatus: '',
    status: 'approved',
  });

  // Toggle Purity selection
  const handleTogglePurity = (purity) => {
    setSelectedPurities((prev) => {
      const exists = prev.includes(purity);
      if (exists && prev.length === 1) return prev; // Keep at least one
      return exists ? prev.filter((p) => p !== purity) : [...prev, purity];
    });
  };

  // Toggle Color selection (Multi-selection)
  const handleToggleColor = (colorName) => {
    setSelectedColors((prev) => {
      const exists = prev.includes(colorName);
      let updated;
      if (exists) {
        if (prev.length === 1) {
          toast('At least one metal color must be selected', { icon: 'ℹ️' });
          return prev;
        }
        updated = prev.filter((c) => c !== colorName);
      } else {
        updated = [...prev, colorName];
      }
      setProductColors(updated);
      if (!updated.includes(activeColorPill)) {
        setActiveColorPill(updated[0] || '');
      }
      if (!updated.includes(activeMediaColor)) {
        setActiveMediaColor(updated[0] || '');
      }
      return updated;
    });
  };

  const masterId = (items, value) => {
    if (value?._id) return value._id;
    const match = items.find((item) => String(item.name).toLowerCase() === String(value).toLowerCase() || String(item._id || item.id) === String(value));
    return match?._id || match?.id || '';
  };
  const pricingInput = () => ({
    basicInfo: { sku: basicDetails.sku },
    pricing: {
      baseCarat: Number(baseCarat || (stoneConfigType === 'colorStone' ? colorStoneCarats[0] : centerDiamondCarats[0]) || 1),
      gstPercentage: Number(gstPercentage),
      baseLabourCharge: Number(specs.baseLabourCharge),
      certificateCharge: Number(specs.certificateCharge),
      otherAmountPercentage: Number(specs.otherAmountPercentage),
    },
    specifications: { metalWeight: Number(specs.metalWeight) },
    metalPurityIds: selectedPurities.map((name) => masterId(purityMasterList, name)),
    metalColorIds: selectedColors.map((name) => masterId(colorsList, name)),
    stoneConfigType,
    colorStoneRows: stoneConfigType === 'colorStone' ? colorStoneCombinations.map((row) => ({
      diamondTypeId: masterId(diamondMasters.types, row.diamondType),
      diamondShapeId: masterId(diamondMasters.shapes, row.shape),
      caratWeight: Number(row.carat),
      pricePerCarat: 3000,
    })) : [],
    centerDiamondRows: stoneConfigType === 'centerDiamond' ? centerDiamondCombinations.map((row) => ({
      diamondTypeId: masterId(diamondMasters.types, row.diamondType),
      diamondShapeId: masterId(diamondMasters.shapes, row.shape),
      diamondColorId: masterId(diamondMasters.colors, row.color),
      diamondClarityId: masterId(diamondMasters.clarities, row.clarity),
      caratWeight: Number(row.carat),
      pricePerCarat: Number(row.rate),
      rateSource: customComboRates[row.id] !== undefined ? 'manual' : 'master',
    })) : [],
    sideStoneConfigType,
    sideColorStoneRows: (sideStoneConfigType === 'sideColorStone' || sideStoneConfigType === 'both')
      ? sideColorStoneRows.map((row) => ({
          diamondTypeId: masterId(diamondMasters.types, row.diamondTypeId || row.diamondType),
          diamondShapeId: masterId(diamondMasters.shapes, row.diamondShapeId || row.diamondShape),
          caratWeight: Number(row.caratWeight),
          pieces: Number(row.pieces || 1),
          pricePerCarat: 3000,
        }))
      : [],
    sideDiamondRows: (sideStoneConfigType === 'sideDiamond' || sideStoneConfigType === 'both')
      ? sideRows.map((row) => ({ ...row, pieces: Number(row.pieces), caratWeight: Number(row.caratWeight), priceINR: Number(row.priceINR || 0) }))
      : [],
    variants: variants.map((row) => ({ ...row, _id: row._id, stock: Number(row.stock || 0) })),
  });
  const handleRegenerateVariants = async () => {
    if (computingPrices) return;
    setComputingPrices(true);
    setIsVariantsPreviewCollapsed(false);
    try {
      const { data } = await api.post('/products/pricing-preview', pricingInput());
      const result = data.data;
      const name = (list, value) => list.find((item) => String(item._id || item.id) === String(value))?.name || '';
      setVariants(result.variants.map((row, index) => {
        const centerDesc = stoneConfigType === 'colorStone'
          ? [name(diamondMasters.types, row.diamondTypeId), name(diamondMasters.shapes, row.diamondShapeId), row.caratWeight ? row.caratWeight + 'ct Gemstone' : ''].filter(Boolean).join(' · ')
          : [name(diamondMasters.types, row.diamondTypeId), name(diamondMasters.colors, row.diamondColorId), name(diamondMasters.clarities, row.diamondClarityId), row.caratWeight ? row.caratWeight + 'ct' : ''].filter(Boolean).join(' · ');

        const sideParts = [];
        if (row.sideDiamondWeight) sideParts.push('Side Dia: ' + row.sideDiamondWeight + 'ct');
        if (row.sideColorStoneWeight) sideParts.push('Side Gem: ' + row.sideColorStoneWeight + 'ct');

        return {
          ...row,
          id: row._id || row.pricingKey || index,
          purity: name(purityMasterList, row.metalPurityId),
          color: name(colorsList, row.metalColorId),
          diamondDetails: {
            center: centerDesc,
            side: sideParts.join(' · '),
          },
          weight: String(row.metalWeight),
          price: String(row.price),
          priceRaw: row.price,
          stock: String(row.stock),
        };
      }));
      setAutomaticPricing(true);
      setPricing((previous) => ({ ...previous, salePrice: String(result.salePrice) }));
      setIsVariantsPreviewCollapsed(false);
      toast.success('Calculated ' + result.variants.length + ' variants using current rates');
    } catch (error) { toast.error(error.response?.data?.message || 'Could not calculate variants'); }
    finally { setComputingPrices(false); }
  };

  // Update a variant row field inline
  const handleVariantChange = (id, field, value) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // ─── Pricing Breakdown & Calculation Modal State ─────────────
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [breakdownVariant, setBreakdownVariant] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState('');

  const handleOpenPriceBreakdown = async (v) => {
    setBreakdownVariant(v);
    setBreakdownModalOpen(true);
    setBreakdownError('');

    // Rule 3: Use the Variant's Pre-Computed Values directly
    const hasPrecomputed = v.metalCost !== undefined || v.priceRaw !== undefined || v.price !== undefined;
    if (hasPrecomputed) {
      const effWeight = Number(v.metalWeight ?? v.weight ?? 0);
      const mCost = Number(v.metalCost || 0);
      const mRate = Number(v.metalRate || (effWeight > 0 && mCost > 0 ? mCost / effWeight : 0));
      const cCost = Number(v.centerDiamondCost || 0);
      const cWeight = Number(v.centerDiamondWeight || 0);
      const cRate = Number(v.centerDiamondRate || (cWeight > 0 && cCost > 0 ? cCost / cWeight : 0));
      const csCost = Number(v.colorStoneCost || 0);
      const csWeight = Number(v.colorStoneWeight || 0);
      const csRate = Number(v.colorStoneRate || 3000);
      const sCost = Number(v.sideDiamondCost || 0);
      const sWeight = Number(v.sideDiamondWeight || 0);
      const sRate = Number(sWeight > 0 && sCost > 0 ? sCost / sWeight : (v.sideDiamonds?.[0]?.priceINR || 0));
      const scsCost = Number(v.sideColorStoneCost || 0);
      const scsWeight = Number(v.sideColorStoneWeight || 0);
      const scsRate = Number(v.sideColorStoneRate || 3000);
      const labour = Number(v.computedMakingCharge ?? v.labourCharge ?? (effWeight * Number(specs.baseLabourCharge || 0)));
      const cert = Number(v.certificateCharge ?? specs.certificateCharge ?? 0);
      const sub = Number(v.subtotal || (mCost + cCost + csCost + sCost + scsCost + labour + cert));
      const gstPct = Number(gstPercentage || 3);
      const gst = Number(v.computedGst || (sub * gstPct / 100));
      const final = Number(v.priceRaw ?? v.price ?? (sub + gst));

      setBreakdownData({
        metalCost: mCost,
        metalRate: mRate,
        centerDiamondCost: cCost,
        centerDiamondWeight: cWeight,
        centerDiamondRate: cRate,
        colorStoneCost: csCost,
        colorStoneWeight: csWeight,
        colorStoneRate: csRate,
        sideDiamondCost: sCost,
        sideDiamondWeight: sWeight,
        sideDiamondRate: sRate,
        sideColorStoneCost: scsCost,
        sideColorStoneWeight: scsWeight,
        sideColorStoneRate: scsRate,
        diamondCost: Number(v.diamondCost || (cCost + csCost + sCost + scsCost)),
        totalMakingCharge: labour,
        certificateCharge: cert,
        subtotal: sub,
        gstAmount: gst,
        finalPrice: final,
        effectiveWeight: effWeight,
        appliedGst: gstPct,
      });
      setBreakdownLoading(false);
      return;
    }

    // Fallback recalculation only if no precomputed data exists
    setBreakdownLoading(true);
    try {
      // Rule 1: Find only the matching side diamond row for this variant's quality
      const matchingSide = (sideRows || []).find((s) =>
        ['diamondTypeId', 'diamondColorId', 'diamondClarityId'].every(
          (k) => !s[k] || !v[k] || String(s[k]) === String(v[k])
        )
      ) || sideRows[0];

      const payload = {
        metalWeight: parseFloat(v.weight || v.metalWeight || specs.metalWeight || 0),
        metalPurityId: v.metalPurityId || v.metalPurity?._id || v.metalPurity,
        // Rule 2: Never treat accent diamond weight as center diamond
        centerDiamonds: (centerDiamondCombinations.length && (v.centerDiamondWeight || v.caratWeight)) ? [
          {
            diamondTypeId: v.diamondTypeId?._id || v.diamondTypeId,
            diamondShapeId: v.diamondShapeId?._id || v.diamondShapeId || centerDiamondCombinations[0]?.shapeId || centerShapeId,
            diamondClarityId: v.diamondClarityId?._id || v.diamondClarityId,
            diamondColorId: v.diamondColorId?._id || v.diamondColorId,
            caratWeight: parseFloat(v.centerDiamondWeight || v.caratWeight || centerDiamondCombinations[0]?.carat || centerDiamondCarats[0] || 0),
          }
        ] : [],
        // Rule 1: Never sum all side diamond rows; pass only matching row
        sideDiamonds: matchingSide ? [{
          diamondTypeId: matchingSide.diamondTypeId?._id || matchingSide.diamondTypeId,
          diamondShapeId: matchingSide.diamondShapeId?._id || matchingSide.diamondShapeId,
          diamondClarityId: matchingSide.diamondClarityId?._id || matchingSide.diamondClarityId,
          diamondColorId: matchingSide.diamondColorId?._id || matchingSide.diamondColorId,
          sizeFrom: matchingSide.sizeFrom,
          sizeTo: matchingSide.sizeTo,
          pieces: matchingSide.pieces,
          caratWeight: matchingSide.caratWeight,
          priceINR: matchingSide.priceINR,
        }] : [],
        labourCharge: parseFloat(specs.baseLabourCharge || 0),
        gstPercentage: parseFloat(gstPercentage || 3),
        shippingCharge: 0,
        certificateCharge: parseFloat(specs.certificateCharge || 0),
        isCalculated: true,
        baseCarat: parseFloat(baseCarat || centerDiamondCarats[0] || 1),
        __debugVariant: v,
      };

      const result = await calculateProductPriceAPI(payload);
      if (result) {
        setBreakdownData(result);
      }
    } catch (err) {
      console.error('Pricing calculation API error:', err);
      setBreakdownError(err.response?.data?.message || err.response?.data?.error || err.message || 'Pricing calculation failed');
    } finally {
      setBreakdownLoading(false);
    }
  };

  // ─── Step 5: Care & Specifications State & Handlers ─────────
  const [careSections, setCareSections] = useState([]);
  const [draggedCareIndex, setDraggedCareIndex] = useState(null);
  const [dragOverCareIndex, setDragOverCareIndex] = useState(null);
  const [specifications, setSpecifications] = useState([]);

  useEffect(() => {
    if (!productId || !productRecord || !mastersLoaded || hydratedProductId.current === productId) return;

    const resolveName = (value, options = []) => {
      const embeddedName = value && typeof value === 'object' ? value.name : '';
      if (embeddedName) return embeddedName;
      const id = value && typeof value === 'object' ? (value._id || value.id) : value;
      const match = options.find((option) => {
        if (!option) return false;
        if (typeof option === 'string') {
          return option.toLowerCase() === String(id || '').toLowerCase();
        }
        return (
          String(option._id || option.id) === String(id) ||
          String(option.name || '').toLowerCase() === String(id || '').toLowerCase()
        );
      });
      return match && typeof match === 'object'
        ? match.name
        : (typeof match === 'string' ? match : (id ? String(id) : ''));
    };
    const unique = (values) => [...new Set(values.filter(Boolean))];
    const basicInfo = productRecord.basicInfo || {};
    const productPricing = productRecord.pricing || {};
    const categoryValues = productRecord.categoryIds || productRecord.category || [];
    const rawCatList = Array.isArray(categoryValues) ? categoryValues : [categoryValues].filter(Boolean);
    const allCatIds = rawCatList
      .map((c) => String(c && typeof c === 'object' ? (c._id || c.id) : c))
      .filter(Boolean);

    const regMatch = allCatIds.find((id) => (regularCategories || []).some((r) => String(r?._id) === id));
    const collIds = allCatIds.filter((id) => (collectionCategories || []).some((c) => String(c?._id) === id));
    const categoryId = regMatch || allCatIds.find((id) => !collIds.includes(id)) || allCatIds[0] || '';

    setSelectedCollectionIds(collIds);
    const productMetalColors = productRecord.metalColorIds || productRecord.metalColors || [];
    if (Array.isArray(productMetalColors) && productMetalColors.length > 0) {
      registerMetalColors(productMetalColors);
    }
    const colorOptions = [...colorsList, ...productMetalColors];
    const variantRecords = Array.isArray(productRecord.variants) ? productRecord.variants : [];
    const variantRows = variantRecords.map((variant, index) => {
      const parts = String(variant.combination || '').split('/').map((part) => part.trim());
      const purity = resolveName(variant.metalPurityId || variant.metalPurity, puritiesList) || parts[0] || '';
      const color = resolveName(variant.metalColorId || variant.metalColor, colorOptions) || parts[1] || '';
      return {
        ...variant,
        id: variant._id || index + 1,
        purity,
        color,
        colorCode: colorOptions.find((item) => item.name === color)?.code || '',
        diamondDetails: {
          center: [
            resolveName(variant.diamondTypeId || variant.diamondType, diamondMasters.types),
            resolveName(variant.diamondShapeId || variant.diamondShape, diamondMasters.shapes),
            resolveName(variant.diamondColorId || variant.diamondColor, diamondMasters.colors),
            resolveName(variant.diamondClarityId || variant.diamondClarity, diamondMasters.clarities),
            variant.caratWeight ? `${variant.caratWeight}ct` : '',
          ].filter(Boolean).join(' · ') || '',
          side: '',
        },
        diamondTypeId: variant.diamondTypeId?._id || variant.diamondTypeId || '',
        diamondShapeId: variant.diamondShapeId?._id || variant.diamondShapeId || '',
        diamondColorId: variant.diamondColorId?._id || variant.diamondColorId || '',
        diamondClarityId: variant.diamondClarityId?._id || variant.diamondClarityId || '',
        caratWeight: variant.caratWeight == null ? '' : String(variant.caratWeight),
        weight: variant.metalWeight == null ? '' : String(variant.metalWeight),
        labourCharge: String(variant.labourCharge ?? variant.computedMakingCharge ?? ''),
        otherAmount: String(variant.otherAmount ?? ''),
        sku: variant.sku || '',
        price: variant.price == null ? '' : Number(variant.price).toLocaleString('en-IN'),
        priceRaw: variant.price ?? '',
        stock: variant.stock == null ? '' : String(variant.stock),
      };
    });
    const colorRows = Array.isArray(productRecord.colorImages) ? productRecord.colorImages : [];
    const colorNames = unique([
      ...colorRows.map((row) => resolveName(row.metalColorId || row.metalColor, colorOptions)),
      ...(Array.isArray(productMetalColors)
        ? productMetalColors.map((color) => resolveName(color, colorOptions))
        : []),
      ...variantRows.map((variant) => variant.color),
    ]);
    const imagesByColor = {};
    const statusesByColor = {};
    const videosByColor = {};
    const vtoByColor = {};
    colorRows.forEach((row) => {
      const colorName = resolveName(row.metalColorId || row.metalColor, colorOptions);
      if (!colorName) return;
      statusesByColor[colorName] = row.status ?? 'active';
      const rowImages = Array.isArray(row.images) ? row.images : [];
      imagesByColor[colorName] = rowImages
        .filter((item) => item?.url && item.mediaType !== 'video')
        .map((item, index) => {
          const fileSize = item.fileSize || item.sizeInBytes || null;
          const sizeStr = item.size || (fileSize ? formatMediaSize(fileSize) : '');
          return {
            id: item.key || item._id || colorName + '-image-' + index,
            url: item.url,
            key: item.key,
            name: item.name || '',
            fileSize,
            size: sizeStr,
            allowCompression: item.allowCompression !== undefined ? item.allowCompression : (fileSize ? !isSizeInKb(fileSize) : true),
            isPrimary: index === 0,
          };
        });
      videosByColor[colorName] = rowImages
        .filter((item) => item?.url && item.mediaType === 'video')
        .map((item, index) => {
          const fileSize = item.fileSize || item.sizeInBytes || null;
          const sizeStr = item.size || (fileSize ? formatMediaSize(fileSize) : '');
          return {
            id: item.key || item._id || colorName + '-video-' + index,
            url: item.url,
            key: item.key,
            title: item.title || '',
            fileSize,
            size: sizeStr,
          };
        });
      if (row.vtoImage?.url) {
        vtoByColor[colorName] = {
          isConfigured: true,
          overlayUrl: row.vtoImage.url,
          overlayPublicId: row.vtoImage.key || '',
          vtoCategory: row.vtoCategory || '',
          ...(row.vtoConfig || {}),
        };
      }
    });
    const centerRows = Array.isArray(productRecord.centerDiamondRows) ? productRecord.centerDiamondRows : [];
    const centerNames = centerRows.map((row) => ({
      type: resolveName(row.diamondTypeId || row.diamondType, diamondMasters.types),
      shape: resolveName(row.diamondShapeId || row.diamondShape, diamondMasters.shapes),
      color: resolveName(row.diamondColorId || row.diamondColor, diamondMasters.colors),
      clarity: resolveName(row.diamondClarityId || row.diamondClarity, diamondMasters.clarities),
      carat: row.caratWeight,
      rate: row.pricePerCarat,
      rateSource: row.rateSource,
    }));
    const firstCenter = centerNames[0] || {};
    setMenuItemIds(selectedMenuIds(productRecord));
    setBasicDetails({
      title: basicInfo.title || '',
      sku: basicInfo.sku || '',
      category: categoryId ? String(categoryId) : '',
      gender: (() => {
        const rawGender = basicInfo.gender ?? productRecord.gender ?? [];
        const arr = Array.isArray(rawGender) ? rawGender : (rawGender ? [rawGender] : []);
        return arr.map((g) => {
          const matched = ['Female', 'Male', 'Unisex', 'Kids'].find(
            (opt) => opt.toLowerCase() === String(g).trim().toLowerCase()
          );
          return matched || g;
        }).filter(Boolean);
      })(),
      gemstoneTypes: (() => {
        const raw = productRecord.gemstoneTypeIds ?? (basicInfo.gemstoneTypes ?? []);
        return Array.isArray(raw)
          ? raw.map((item) => (typeof item === 'object' && item ? item._id || item.id : String(item))).filter(Boolean)
          : (raw ? [typeof raw === 'object' && raw ? raw._id || raw.id : String(raw)] : []);
      })(),
      gemstoneShapes: (() => {
        const raw = productRecord.gemstoneShapeIds ?? (basicInfo.gemstoneShapes ?? []);
        return Array.isArray(raw)
          ? raw.map((item) => (typeof item === 'object' && item ? item._id || item.id : String(item))).filter(Boolean)
          : (raw ? [typeof raw === 'object' && raw ? raw._id || raw.id : String(raw)] : []);
      })(),
      description: basicInfo.description || '',
      isOrnate: Boolean(productRecord.isOrnate || productRecord.productType === 'ornate'),
      soldCount: productRecord.demoMetrics?.soldCount ?? '',
      reviewCount: productRecord.demoMetrics?.reviewCount ?? '',
      showInApp: productRecord.visibility?.app !== false && productRecord.inapp !== false,
      showOnWeb: productRecord.visibility?.web !== false && productRecord.inweb !== false,
    });
    const purityOptions = [...purityMasterList, ...puritiesList.map((p) => (typeof p === 'string' ? { name: p } : p))];
    const savedPurities = Array.isArray(productRecord.metalPurityIds)
      ? productRecord.metalPurityIds.map((purity) => resolveName(purity, purityOptions))
      : [];
    setSelectedPurities(unique([...savedPurities, ...variantRows.map((variant) => variant.purity)]));
    setSelectedColors(unique([...colorNames, ...variantRows.map((variant) => variant.color)]));
    setVariants(variantRows);
    setCenterDiamondType(firstCenter.type || '');
    setCenterDiamondShape(firstCenter.shape || '');
    setCenterDiamondColors(unique(centerNames.map((row) => row.color)));
    setCenterDiamondClarities(unique(centerNames.map((row) => row.clarity)));
    const loadedCenterCarats = unique(centerNames.map((row) => Number(row.carat)).filter(Number.isFinite)).sort((a, b) => a - b);
    setCenterDiamondCarats(loadedCenterCarats);
    setCustomComboRates(Object.fromEntries(centerNames.filter((row) => row.rateSource === 'manual' || (!row.rateSource && row.rate > 0)).map((row) => [
      [row.type, row.shape, row.color, row.clarity, row.carat].join('-'),
      row.rate,
    ])));
    setAutomaticPricing(productRecord.productType !== 'silver' && !productRecord.isOrnate);
    const savedBaseCarat = productRecord.pricing?.baseCarat;
    const minCenterCt = loadedCenterCarats[0];
    if (savedBaseCarat !== undefined && savedBaseCarat !== null && Number(savedBaseCarat) > 0) {
      if (Number(savedBaseCarat) === 1 && minCenterCt && minCenterCt > 1 && !loadedCenterCarats.includes(1)) {
        setBaseCarat(String(minCenterCt));
        setBaseCaratManuallyEdited(false);
      } else {
        setBaseCarat(String(savedBaseCarat));
        setBaseCaratManuallyEdited(true);
      }
    } else {
      setBaseCarat(String(minCenterCt || 1));
      setBaseCaratManuallyEdited(false);
    }
    setGstPercentage(String(productRecord.pricing?.gstPercentage ?? 3));
    setSideRows((productRecord.sideDiamondRows || []).map((row) => ({ ...row, rateSource: row.rateSource || (row.priceINR ? 'manual' : 'master') })));
    const loadedStoneConfigType = productRecord.stoneConfigType ||
      (Array.isArray(productRecord.colorStoneRows) && productRecord.colorStoneRows.length > 0 ? 'colorStone' : 'centerDiamond');
    setStoneConfigType(loadedStoneConfigType);

    const loadedSideStoneConfigType = productRecord.sideStoneConfigType ||
      (productRecord.sideColorStoneRows?.length && productRecord.sideDiamondRows?.length ? 'both'
        : (productRecord.sideColorStoneRows?.length ? 'sideColorStone'
          : (productRecord.sideDiamondRows?.length ? 'sideDiamond' : 'none')));
    setSideStoneConfigType(loadedSideStoneConfigType);

    const csRows = Array.isArray(productRecord.colorStoneRows) ? productRecord.colorStoneRows : [];
    if (csRows.length > 0) {
      const firstCs = csRows[0];
      setColorStoneType(resolveName(firstCs.diamondTypeId || firstCs.diamondType, diamondMasters.types));
      setColorStoneShape(resolveName(firstCs.diamondShapeId || firstCs.diamondShape, diamondMasters.shapes));
      const csCarats = unique(csRows.map((r) => Number(r.caratWeight)).filter(Number.isFinite)).sort((a, b) => a - b);
      setColorStoneCarats(csCarats);
    }

    const scsRows = Array.isArray(productRecord.sideColorStoneRows) ? productRecord.sideColorStoneRows : [];
    setSideColorStoneRows(scsRows.map((r) => ({
      id: r._id || Date.now() + Math.random(),
      diamondTypeId: r.diamondTypeId?._id || r.diamondTypeId || r.diamondType,
      diamondShapeId: r.diamondShapeId?._id || r.diamondShapeId || r.diamondShape,
      diamondType: resolveName(r.diamondTypeId || r.diamondType, diamondMasters.types),
      diamondShape: resolveName(r.diamondShapeId || r.diamondShape, diamondMasters.shapes),
      caratWeight: Number(r.caratWeight || 0),
      pieces: Number(r.pieces || 1),
      pricePerCarat: Number(r.pricePerCarat || 3000),
    })));
    setProductColors(colorNames);
    setActiveColorPill(colorNames[0] || '');
    setActiveMediaColor(colorNames[0] || '');
    setMediaImages(imagesByColor);
    setColorStatuses(statusesByColor);
    setMediaVideos(videosByColor);
    setVtoConfigs(vtoByColor);
    if (isSilverProduct) {
      const sColors = [];
      const sMedia = {};
      if (Array.isArray(productMetalColors) && productMetalColors.length > 0) {
        productMetalColors.forEach((mc) => {
          const cName = typeof mc === 'object' && mc !== null ? mc.name : resolveName(mc, colorOptions);
          if (cName) sColors.push(cName);
        });
      }
      if (Array.isArray(productRecord.colorImages) && productRecord.colorImages.length > 0) {
        productRecord.colorImages.forEach((ci) => {
          let cName = resolveName(ci.metalColorId || ci.metalColor, colorOptions) || ci.metalColorName || ci.colorName;
          if (!ci.metalColorId && !ci.metalColor && (!cName || cName.toLowerCase() === 'general')) {
            cName = 'General';
          }
          if (cName) {
            if (!sColors.includes(cName)) sColors.push(cName);
            sMedia[cName] = {
              status: ci.status ?? 'active',
              swatchIcon: typeof ci.variantIcon === 'string'
                ? ci.variantIcon.trim()
                : (typeof ci.variantIcon?.url === 'string' ? ci.variantIcon.url.trim() : ''),
              media: Array.isArray(ci.images)
                ? ci.images.map((img, idx) => ({
                    id: img._id || img.key || `img-${idx}`,
                    url: typeof img === 'string' ? img : img.url,
                    key: img.key || '',
                    mediaType: img.mediaType || (img.url?.endsWith('.mp4') ? 'video' : 'image'),
                  }))
                : [],
            };
          }
        });
      }
      if (!sColors.length && productRecord.color) {
        const cName = resolveName(productRecord.color, colorOptions);
        if (cName) sColors.push(cName);
      }
      setSilverColors(unique(sColors));
      setSilverVariantMedia(sMedia);
      const sColorsWithMedia = Object.keys(sMedia).filter(
        (cName) => (sMedia[cName]?.media?.length > 0) || Boolean(sMedia[cName]?.swatchIcon)
      );
      if (sColorsWithMedia.length > 0) {
        setExpandedSilverColors((prev) => Array.from(new Set([...prev, ...sColorsWithMedia])));
      }
    }
    setSpecs({
      metalWeight: String(productRecord.specifications?.metalWeight ?? ''),
      baseLabourCharge: String(productRecord.pricing?.baseLabourCharge ?? ''),
      certificateCharge: String(productRecord.pricing?.certificateCharge ?? ''),
      otherAmountPercentage: String(productRecord.pricing?.otherAmountPercentage ?? ''),
    });
    const cost = Number(productPricing.costPrice ?? 0);
    const markup = Number(productPricing.markupPercentage ?? 0);
    const calcPrice = Number(productPricing.calculatedPrice ?? (cost > 0 ? cost + Math.round((cost * markup) / 100) : 0));
    const sale = String(productPricing.salePrice ?? (calcPrice || ''));
    const mrpVal = String(productPricing.mrp ?? sale);
    const ornatePriceVal = String(productPricing.ornatePrice ?? productRecord.ornatePrice ?? productRecord.ornate?.price ?? productRecord.ornate?.goldAmt ?? (productPricing.costPrice || ''));

    setPricing({
      ornatePrice: ornatePriceVal,
      costPrice: String(productPricing.costPrice ?? ''),
      markupPercentage: String(productPricing.markupPercentage ?? ''),
      calculatedPrice: String(productPricing.calculatedPrice ?? (calcPrice || '')),
      salePrice: sale,
      mrpMarkupPercentage: String(productPricing.mrpMarkupPercentage ?? ''),
      mrp: mrpVal,
      displayPrice: sale,
    });
    setCareSections((productRecord.descriptionSections || []).map((section, index) => ({
      id: section._id || 'section-' + index,
      header: section.header || '',
      description: section.description || '',
    })));
    setSpecifications((productRecord.productSpecifications || []).map((specification, index) => ({
      id: specification._id || 'specification-' + index,
      key: specification.key || '',
      value: specification.value || '',
    })));
    setSeo({
      slug: basicInfo.slug || '',
      metaTitle: productRecord.seo?.metaTitle || '',
      metaDescription: productRecord.seo?.metaDescription || '',
      keywords: productRecord.seo?.keywords || '',
      stockStatus: productRecord.stockStatus || '',
      status: productRecord.status || 'approved',
    });
    hydratedProductId.current = productId;
    setProductLoading(false);
  }, [productId, productRecord, mastersLoaded, colorsList, puritiesList, diamondMasters, regularCategories, collectionCategories]);

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

  // Final Publish / Save Handler
  const handlePublish = async (statusOverride = 'preserve', { stayOnPage = false } = {}) => {
    setSaving(true);
    try {
      const isDraft = statusOverride === 'draft' || statusOverride === 'preserve';
      const activeTitle = basicDetails.title?.trim() || '';
      const activeSku = basicDetails.sku?.trim() || '';
      if (!activeTitle) {
        toast.error('Product title is required to save');
        return;
      }
      if (statusOverride === 'approved' && !activeSku) {
        toast.error('Product title and SKU are required to publish this product');
        return;
      }
      const activeSlug = productRecord?.basicInfo?.slug || (activeTitle ? activeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : undefined);
      const activeDesc = basicDetails.description || '';
      const numberValue = (value) => value === '' || value === null || value === undefined ? undefined : Number(value);
      if (!isDraft && !isSilverProduct) {
        if (variants.some((variant) => !(Number(String(variant.price ?? '').replace(/,/g, '')) > 0))) {
          setActiveStep(2);
          toast.error('Enter a price for every jewelry variant before saving');
          return;
        }
      }
      const variantPrices = variants
        .map((variant) => numberValue(String(variant.price ?? '').replace(/,/g, '')) ?? numberValue(variant.priceRaw))
        .filter((price) => Number.isFinite(price) && price > 0);
      const jewelryStartingPrice = variantPrices.length ? Math.min(...variantPrices) : undefined;
      const mrpNum = isSilverProduct ? numberValue(pricing.mrp) : jewelryStartingPrice;
      const salePriceNum = isSilverProduct ? numberValue(pricing.salePrice) : jewelryStartingPrice;
      const costPriceNum = isSilverProduct ? numberValue(pricing.costPrice) : undefined;
      const ornatePriceNum = isSilverProduct ? numberValue(pricing.ornatePrice) : undefined;
      const calculatedPriceNum = isSilverProduct ? numberValue(pricing.calculatedPrice) : undefined;
      const markupNum = numberValue(pricing.markupPercentage);
      const mrpMarkupNum = isSilverProduct ? numberValue(pricing.mrpMarkupPercentage) : undefined;

      const metalWeightNum = numberValue(specs.metalWeight);
      const resolveCatId = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return String(val._id || val.id || '');
        const str = String(val).trim();
        if (/^[a-f\d]{24}$/i.test(str)) return str;
        const matched = (categoryList || []).find(
          (c) =>
            String(c._id) === str ||
            String(c.name || '').trim().toLowerCase() === str.toLowerCase() ||
            String(c.slug || '').trim().toLowerCase() === str.toLowerCase()
        );
        return matched ? String(matched._id || matched.id) : null;
      };

      const resolvedPrimaryCatId =
        (selectedCategory?._id ? String(selectedCategory._id) : null) ||
        resolveCatId(basicDetails.category);

      const resolvedCollectionIds = (selectedCollectionIds || [])
        .map(resolveCatId)
        .filter(Boolean);

      const finalCategoryIds = Array.from(
        new Set([resolvedPrimaryCatId, ...resolvedCollectionIds].filter(Boolean))
      );
      const resolveDiamondId = (options, value) => {
        const normalizedValue = String(value ?? '').trim();
        const match = options.find((option) =>
          typeof option === 'string'
            ? option.trim().toLowerCase() === normalizedValue.toLowerCase()
            : String(option?.name || '').trim().toLowerCase() === normalizedValue.toLowerCase()
        );
        const id = typeof match === 'object' && match ? (match._id || match.id) : null;
        return id ? String(id) : (/^[a-f\d]{24}$/i.test(normalizedValue) ? normalizedValue : null);
      };
      const compactObject = (value) => Object.fromEntries(
        Object.entries(value).filter(([, field]) => field !== undefined && field !== null && field !== '')
      );
      const withDiamondIds = (row) => {
        const ids = {
          type: resolveDiamondId(diamondMasters.types, row.diamondType),
          shape: resolveDiamondId(diamondMasters.shapes, row.diamondShape),
          color: resolveDiamondId(diamondMasters.colors, row.diamondColor),
          clarity: resolveDiamondId(diamondMasters.clarities, row.diamondClarity),
        };
        if (Object.values(ids).some((id) => !id)) {
          throw new Error('Diamond options are not loaded or no longer available. Refresh the page and try again.');
        }
        return {
          ...compactObject({
            caratWeight: row.caratWeight,
            pricePerCarat: row.pricePerCarat,
            rateSource: row.rateSource,
            sizeFrom: row.sizeFrom,
            sizeTo: row.sizeTo,
            pieces: row.pieces,
          }),
          diamondTypeId: ids.type,
          diamondShapeId: ids.shape,
          diamondColorId: ids.color,
          diamondClarityId: ids.clarity,
        };
      };
      const mediaEntry = (item, mediaType) => ({
        url: item.url,
        key: item.key || '',
        mediaType,
        ...(item.fileSize ? { fileSize: item.fileSize } : {}),
        ...(item.size ? { size: item.size } : {}),
        ...(item.allowCompression !== undefined ? { allowCompression: item.allowCompression } : {}),
      });
      const mediaColorNames = productColors.length
        ? productColors
        : (mediaImages['']?.length || mediaVideos['']?.length ? [''] : []);
      const colorImageRows = mediaColorNames.flatMap((colorName) => {
        const color = colorsList.find((item) => item.name?.toLowerCase() === colorName.toLowerCase());
        const images = (mediaImages[colorName] || []).filter((item) => item?.url).map((item) => mediaEntry(item, 'image'));
        const videos = (mediaVideos[colorName] || []).filter((item) => item?.url).map((item) => mediaEntry(item, 'video'));
        const vto = vtoConfigs[colorName] || {};
        const hasVto = Boolean(vto.isConfigured && vto.overlayUrl);
        // Do not create empty dummy colorImage rows without media or VTO
        if (!images.length && !videos.length && !hasVto) return [];

        const vtoConfig = compactObject({
          top: numberValue(vto.top),
          left: numberValue(vto.left),
          scale: numberValue(vto.scale),
          clipBottom: numberValue(vto.clipBottom),
          rotation: numberValue(vto.rotation),
        });
        return [{
          status: colorStatuses[colorName] ?? 'active',
          ...(color?.id || color?._id ? { metalColorId: color.id || color._id } : {}),
          ...(images.length || videos.length ? { images: [...images, ...videos] } : {}),
          ...(hasVto ? {
            vtoImage: {
              url: vto.overlayUrl,
              ...(vto.overlayPublicId ? { key: vto.overlayPublicId } : {}),
            },
            ...(vto.vtoCategory ? { vtoCategory: vto.vtoCategory } : {}),
            ...(Object.keys(vtoConfig).length ? { vtoConfig } : {}),
          } : {}),
        }];
      });
      const allSelectedColors = [...new Set([...(selectedColors || []), ...(productColors || [])])];
      const metalColorIds = mastersLoaded || allSelectedColors.length
        ? [...new Set(allSelectedColors.map((colorName) => {
            const color = colorsList.find((item) =>
              item.name?.toLowerCase() === String(colorName)?.toLowerCase() ||
              String(item.id || item._id) === String(colorName)
            );
            return color?.id || color?._id;
          }).filter(Boolean))]
        : (productRecord?.metalColorIds || []).map((c) => String(c?._id || c?.id || c)).filter(Boolean);

      const metalPurityIds = mastersLoaded || (selectedPurities || []).length
        ? [...new Set((selectedPurities || []).map((purityName) => {
            const purity = purityMasterList.find((item) => {
              const name = (typeof item === 'string' ? item : item?.name || '').trim().toLowerCase();
              const pStr = String(purityName || '').trim().toLowerCase();
              return (
                name === pStr ||
                String(item?._id || item?.id) === pStr ||
                name.replace(/\s*gold$/i, '') === pStr.replace(/\s*gold$/i, '')
              );
            });
            return typeof purity === 'object' && purity ? (purity._id || purity.id) : (purity || null);
          }).filter(Boolean).map(String))]
        : (productRecord?.metalPurityIds || []).map((p) => String(p?._id || p?.id || p)).filter(Boolean);
      const variantRows = variants.map((variant) => compactObject({
        ...variant,
        _id: variant._id,
        metalPurityId: masterId(purityMasterList, variant.purity),
        metalColorId: masterId(colorsList, variant.color),
        combination: [variant.purity, variant.color].filter(Boolean).join(' / '),
        sku: variant.sku,
        price: numberValue(String(variant.price ?? '').replace(/,/g, '')) ?? numberValue(variant.priceRaw),
        stock: numberValue(variant.stock),
        metalWeight: numberValue(variant.weight),
        labourCharge: numberValue(variant.labourCharge),
        otherAmount: numberValue(variant.otherAmount),
        ...(variant.diamondTypeId ? { diamondTypeId: variant.diamondTypeId } : {}),
        ...(variant.diamondShapeId ? { diamondShapeId: variant.diamondShapeId } : {}),
        ...(variant.diamondColorId ? { diamondColorId: variant.diamondColorId } : {}),
        ...(variant.diamondClarityId ? { diamondClarityId: variant.diamondClarityId } : {}),
        caratWeight: numberValue(variant.caratWeight),
      })).filter((variant) => Object.keys(variant).length);
      const centerDiamondRows = stoneConfigType === 'centerDiamond'
        ? centerDiamondCombinations.map((combination) => withDiamondIds({
            diamondType: combination.diamondType,
            diamondShape: combination.shape,
            diamondColor: combination.color,
            diamondClarity: combination.clarity,
            caratWeight: numberValue(combination.carat),
            pricePerCarat: numberValue(combination.rate),
            rateSource: customComboRates[combination.id] !== undefined ? 'manual' : 'master',
          }))
        : [];
      const validColorStoneRows = stoneConfigType === 'colorStone'
        ? colorStoneCombinations.map((combination) => {
            const typeId = resolveDiamondId(diamondMasters.types, combination.diamondType) || masterId(diamondMasters.types, combination.diamondType);
            const shapeId = resolveDiamondId(diamondMasters.shapes, combination.shape) || masterId(diamondMasters.shapes, combination.shape);
            return {
              diamondTypeId: typeId,
              diamondShapeId: shapeId,
              caratWeight: numberValue(combination.carat),
              pricePerCarat: 3000,
            };
          })
        : [];
      // Only include side diamonds that have actual attributes configured, avoid blank template rows
      const validSideDiamondRows = (sideRows || [])
        .filter((row) => row.diamondTypeId && (row.diamondShapeId || Number(row.caratWeight) > 0 || Number(row.pieces) > 0))
        .map((row) => compactObject({
          ...row,
          pieces: numberValue(row.pieces),
          caratWeight: numberValue(row.caratWeight),
          priceINR: numberValue(row.priceINR),
        }));
      const validSideColorStoneRows = (sideStoneConfigType === 'sideColorStone' || sideStoneConfigType === 'both')
        ? (sideColorStoneRows || [])
            .filter((row) => (row.diamondTypeId || row.diamondType) && Number(row.caratWeight) > 0)
            .map((row) => compactObject({
              diamondTypeId: masterId(diamondMasters.types, row.diamondTypeId || row.diamondType),
              diamondShapeId: masterId(diamondMasters.shapes, row.diamondShapeId || row.diamondShape),
              caratWeight: numberValue(row.caratWeight),
              pieces: numberValue(row.pieces || 1),
              pricePerCarat: 3000,
            }))
        : [];
      const descriptionSections = careSections
        .filter((section) => section.header?.trim() || section.description?.trim())
        .map((section) => compactObject({
          header: section.header?.trim(),
          description: section.description?.trim(),
        }));
      const productSpecifications = specifications
        .filter((specification) => specification.key?.trim() || specification.value?.trim())
        .map((specification) => compactObject({
          key: specification.key?.trim(),
          value: specification.value?.trim(),
        }));
      const pricingData = compactObject({
        ...(isSilverProduct ? {
          mrp: mrpNum,
          salePrice: salePriceNum,
          costPrice: costPriceNum,
          ornatePrice: ornatePriceNum,
          calculatedPrice: calculatedPriceNum,
          markupPercentage: markupNum,
          mrpMarkupPercentage: mrpMarkupNum,
        } : {
          markupPercentage: markupNum,
        }),
        ...(!isSilverProduct ? {
          baseCarat: Number(baseCarat || centerDiamondCarats[0] || 1),
          gstPercentage: Number(gstPercentage || 3),
          ...(numberValue(specs.baseLabourCharge) !== undefined ? { baseLabourCharge: numberValue(specs.baseLabourCharge) } : {}),
          ...(numberValue(specs.certificateCharge) !== undefined ? { certificateCharge: numberValue(specs.certificateCharge) } : {}),
          ...(numberValue(specs.otherAmountPercentage) !== undefined ? { otherAmountPercentage: numberValue(specs.otherAmountPercentage) } : {}),
        } : {}),
      });
      const specificationData = compactObject({
        ...(!isSilverProduct && metalWeightNum ? { metalWeight: metalWeightNum } : {}),
      });
      const seoData = compactObject({
        metaTitle: seo.metaTitle?.trim(),
        metaDescription: seo.metaDescription?.trim(),
        keywords: seo.keywords?.trim(),
      });
      const silverColorImageRows = isSilverProduct
        ? Array.from(new Set([
            ...silverColors,
            ...(silverVariantMedia['General']?.media?.length > 0 || silverVariantMedia['General']?.swatchIcon ? ['General'] : []),
          ])).map((cName) => {
            const vData = silverVariantMedia[cName] || {};
            const matched = colorsList.find((co) => co.name?.toLowerCase() === cName?.toLowerCase());
            return {
              status: vData.status ?? 'active',
              ...(matched?.id || matched?._id ? { metalColorId: matched.id || matched._id } : {}),
              ...(typeof vData.swatchIcon === 'string' && vData.swatchIcon.trim()
                ? { variantIcon: { url: vData.swatchIcon.trim(), key: vData.swatchIconKey || '' } }
                : (vData.swatchIcon?.url && typeof vData.swatchIcon.url === 'string' && vData.swatchIcon.url.trim()
                  ? { variantIcon: { url: vData.swatchIcon.url.trim(), key: vData.swatchIconKey || vData.swatchIcon.key || '' } }
                  : {})),
              images: (vData.media || []).map((m) => ({
                url: typeof m === 'string' ? m : m.url,
                key: m.key || '',
                mediaType: m.mediaType || (m.url?.endsWith('.mp4') ? 'video' : 'image'),
              })),
            };
          }).filter((item) => item.metalColorId || item.images?.length > 0 || item.variantIcon)
        : [];
      const silverMetalColorIds = isSilverProduct
        ? silverColors
            .filter((cName) => cName !== 'General')
            .map((cName) => {
              const matched = colorsList.find((co) => co.name?.toLowerCase() === cName?.toLowerCase());
              return matched?.id || matched?._id;
            }).filter(Boolean)
        : [];
        const genderArr = Array.isArray(basicDetails.gender)
          ? basicDetails.gender.filter(Boolean)
          : (basicDetails.gender ? [basicDetails.gender] : []);
        const promoArr = Array.isArray(basicDetails.promoBanner)
          ? basicDetails.promoBanner.filter(Boolean)
          : (basicDetails.promoBanner ? [basicDetails.promoBanner] : []);
        const gtArr = Array.isArray(basicDetails.gemstoneTypes)
          ? basicDetails.gemstoneTypes.map((v) => (typeof v === 'object' && v ? v._id || v.value : v)).filter(Boolean)
          : (basicDetails.gemstoneTypes ? [basicDetails.gemstoneTypes] : []);
        const gsArr = Array.isArray(basicDetails.gemstoneShapes)
          ? basicDetails.gemstoneShapes.map((v) => (typeof v === 'object' && v ? v._id || v.value : v)).filter(Boolean)
          : (basicDetails.gemstoneShapes ? [basicDetails.gemstoneShapes] : []);
        const payload = {
        ...(!productId ? { _id: draftProductId } : {}),
        productType: isSilverProduct || basicDetails.isOrnate ? 'silver' : 'gold',
        isOrnate: Boolean(basicDetails.isOrnate),
        visibility: {
          app: Boolean(basicDetails.showInApp),
          web: Boolean(basicDetails.showOnWeb),
        },
        gemstoneTypeIds: gtArr,
        gemstoneShapeIds: gsArr,
        demoMetrics: {
          soldCount:
            basicDetails.soldCount !== '' && basicDetails.soldCount !== undefined && basicDetails.soldCount !== null
              ? Number(basicDetails.soldCount)
              : (productRecord?.demoMetrics?.soldCount ?? 0),
          reviewCount:
            basicDetails.reviewCount !== '' && basicDetails.reviewCount !== undefined && basicDetails.reviewCount !== null
              ? Number(basicDetails.reviewCount)
              : (productRecord?.demoMetrics?.reviewCount ?? 0),
        },
        gender: genderArr,
        promoBanner: promoArr,
        basicInfo: compactObject({
          title: activeTitle,
          sku: activeSku || undefined,
          slug: activeSlug,
          description: activeDesc,
          gender: genderArr,
          promoBanner: promoArr,
          gemstoneTypes: gtArr,
          gemstoneShapes: gsArr,
        }),
        status: statusOverride === 'preserve'
          ? (productRecord?.status || seo.status || (productId ? 'approved' : 'draft'))
          : (statusOverride === 'draft' ? 'draft' : 'approved'),
        categoryIds: finalCategoryIds,
        sizeIds: selectedSizeIds || [],
        ...(menuItemIds && menuItemIds.length ? { menuItemIds } : {}),
        ...(Object.keys(pricingData).length ? { pricing: pricingData } : {}),
        ...(Object.keys(specificationData).length ? { specifications: specificationData } : {}),
        ...(isSilverProduct
          ? (silverMetalColorIds.length ? { metalColorIds: silverMetalColorIds } : {})
          : (metalColorIds.length ? { metalColorIds } : {})),
        ...(!isSilverProduct && metalPurityIds.length ? { metalPurityIds } : {}),
        ...(isSilverProduct
          ? (silverColorImageRows.length ? { colorImages: silverColorImageRows } : {})
          : (colorImageRows.length ? { colorImages: colorImageRows } : {})),
        ...(!isSilverProduct && variantRows.length ? { variants: variantRows } : {}),
        stoneConfigType,
        sideStoneConfigType,
        ...(!isSilverProduct && stoneConfigType === 'colorStone' ? { colorStoneRows: validColorStoneRows, centerDiamondRows: [] } : {}),
        ...(!isSilverProduct && stoneConfigType === 'centerDiamond' ? { centerDiamondRows, colorStoneRows: [] } : {}),
        ...(!isSilverProduct && (sideStoneConfigType === 'sideColorStone' || sideStoneConfigType === 'both') ? { sideColorStoneRows: validSideColorStoneRows } : { sideColorStoneRows: [] }),
        ...(!isSilverProduct && (sideStoneConfigType === 'sideDiamond' || sideStoneConfigType === 'both') ? { sideDiamondRows: validSideDiamondRows } : { sideDiamondRows: [] }),
        ...(descriptionSections.length ? { descriptionSections } : {}),
        ...(productSpecifications.length ? { productSpecifications } : {}),
        ...(Object.keys(seoData).length ? { seo: seoData } : {}),
        ...(seo.stockStatus ? { stockStatus: seo.stockStatus } : {}),
      };

      let targetProductId = productId;
      if (productId) {
        await api.put('/products/' + productId, payload);
      } else {
        const createRes = await api.post('/products', payload);
        targetProductId =
          createRes?.data?.data?.product?._id ||
          createRes?.data?.data?._id ||
          createRes?.data?.data?.id;
      }
      if (pendingCompressionDeletes.length) {
        const deleteResults = await Promise.allSettled(pendingCompressionDeletes.map((asset) => deleteUploadedFile(asset)));
        if (deleteResults.some((result) => result.status === 'rejected')) {
          console.warn('Some replaced media originals could not be removed from storage.');
        }
        setPendingCompressionDeletes([]);
      }
      const productName = isSilverProduct ? 'Silver product' : 'Jewelry product';
      let successMsg = productId ? `${productName} updated successfully!` : `${productName} saved successfully!`;
      if (statusOverride === 'draft') {
        successMsg = productId ? 'Draft updated successfully!' : 'Draft saved successfully!';
      } else if (statusOverride === 'approved') {
        successMsg = productId ? `${productName} published successfully!` : `${productName} published successfully!`;
      }
      toast.success(successMsg);

      if (stayOnPage) {
        const idToFetch = productId || targetProductId;
        if (!productId && targetProductId) {
          const editPath = `${productListPath}/edit/${targetProductId}`;
          navigate(editPath, { replace: true });
        }
        if (idToFetch) {
          try {
            const getRes = await api.get('/products/' + idToFetch);
            const freshRec = getRes.data?.data?.product || getRes.data?.data;
            if (freshRec) {
              hydratedProductId.current = '';
    step1HydratedId.current = '';
              setProductRecord(freshRec);
            }
          } catch (fetchErr) {
            console.warn('Could not reload product after save:', fetchErr);
          }
        }
      } else {
        navigate(productListPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save product. Please review the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save the current product storing details and keeping status field as it is (without moving away from edit page)
  const handleSave = async () => handlePublish('preserve', { stayOnPage: true });

  const [togglingStatus, setTogglingStatus] = useState(false);
  const currentStatus = productRecord?.status || 'approved';

  const handleToggleStatus = async () => {
    if (!productId || togglingStatus) return;
    const nextStatus = currentStatus === 'approved' ? 'draft' : 'approved';
    try {
      setTogglingStatus(true);
      await api.patch(`/products/${productId}/status`, { status: nextStatus });
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

  // Stepper labels
  const steps = [
    { num: 1, title: 'Basic Details', subtitle: 'Name, category, description' },
    ...(!isSilverProduct ? [{ num: 2, title: 'Variant Configuration', subtitle: 'Metal, color, diamonds' }] : []),
    ...(isSilverProduct ? [{ num: 3, title: 'Pricing & Costing', subtitle: 'MRP, sale price & margins' }] : []),
    {
      num: 4,
      title: isSilverProduct ? 'Variant Configuration' : 'Product Media',
      subtitle: isSilverProduct ? 'Colors & swatches' : 'Images & VTO',
    },
    { num: 5, title: 'Care & Specs', subtitle: 'Care info & specifications' },
    { num: 6, title: 'SEO & Publish', subtitle: 'Meta & catalog status' },
  ];
  const activeStepIndex = steps.findIndex((step) => step.num === activeStep);
  const getStepPosition = (stepNumber) => steps.findIndex((step) => step.num === stepNumber) + 1;

  // Dynamic next button text
  const getNextButtonText = () => {
    if (activeStepIndex >= 0 && activeStepIndex < steps.length - 1) {
      return `Next: ${steps[activeStepIndex + 1]?.title}`;
    }
    return productId ? 'Update Product' : 'Publish Product';
  };

  const handleNextStep = () => {
    if (activeStepIndex >= 0 && activeStepIndex < steps.length - 1) {
      setActiveStep(steps[activeStepIndex + 1].num);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handlePublish('approved');
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      setActiveStep(steps[activeStepIndex - 1].num);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(productListPath);
    }
  };

  if (productLoading) {
    return (
      <div className="rounded-2xl border border-[#eee8df] bg-white p-8 text-center text-sm text-stone-500">
        Loading product...
      </div>
    );
  }

  const contextValue = {
    // Navigation & paths
    productListPath,
    isSilverProduct,
    productId,
    basicDetails,
    setBasicDetails,
    productRecord,
    ornate,
    categoryOptions,
    handleToggleStatus,
    saving,
    togglingStatus,
    currentStatus,
    handlePublish,
    handleSave,
    handleNextStep,
    handlePrevStep,
    getNextButtonText,
    getStepPosition,
    steps,
    activeStep,
    setActiveStep,
    activeStepIndex,

    // Step 1: Basic Details
    gemstoneTypeOptions,
    gemstoneShapeOptions,
    selectedCollectionIds,
    setSelectedCollectionIds,
    categoryList,
    menuItemIds,
    setMenuItemIds,
    autoOpenMenu,
    setAutoOpenMenu,
    promoBannerOptions,
    categorySizes,
    selectedSizeIds,
    setSelectedSizeIds,
    loadingSizes,

    // Step 2: Variant Config
    sortedDisplayPurities,
    selectedPurities,
    handleTogglePurity,
    colorsList,
    selectedColors,
    handleToggleColor,
    specs,
    setSpecs,
    stoneConfigType,
    setStoneConfigType,
    colorStoneCombinations,
    colorStoneType,
    setColorStoneType,
    diamondTypesList,
    colorStoneShape,
    setColorStoneShape,
    diamondShapesList,
    colorStoneCaratInput,
    setColorStoneCaratInput,
    handleAddColorStoneCarat,
    colorStoneCarats,
    handleRemoveColorStoneCarat,
    handleAddColorStoneRow,
    handleUpdateColorStoneCarat,
    totalColorStonePrice,
    totalColorStoneWeight,
    centerDiamondCombinations,
    centerDiamondType,
    setCenterDiamondType,
    centerDiamondShape,
    setCenterDiamondShape,
    centerColorOptions,
    centerDiamondColors,
    toggleCenterColor,
    centerClarityOptions,
    centerDiamondClarities,
    toggleCenterClarity,
    caratInput,
    setCaratInput,
    handleAddCarat,
    centerDiamondCarats,
    handleRemoveCarat,
    isCombinationsCollapsed,
    setIsCombinationsCollapsed,
    handleUpdateComboRate,
    sideStoneConfigType,
    setSideStoneConfigType,
    sideRows,
    setSideRows,
    diamondMasters,
    sideColorStoneType,
    setSideColorStoneType,
    sideColorStoneShape,
    setSideColorStoneShape,
    sideColorStonePieces,
    setSideColorStonePieces,
    sideColorStoneCarat,
    setSideColorStoneCarat,
    handleAddSideColorStoneRow,
    sideColorStoneRows,
    handleRemoveSideColorStoneRow,
    variants,
    setVariants,
    computingPrices,
    handleRegenerateVariants,
    isVariantsPreviewCollapsed,
    setIsVariantsPreviewCollapsed,
    purityGroups,
    variantPurityFilter,
    setVariantPurityFilter,
    displayedPurityGroups,
    automaticPricing,
    handleVariantChange,
    gstPercentage,
    handleOpenPriceBreakdown,

    // Step 3: Silver Pricing
    pricing,
    setPricing,
    handleSilverCostOrMarkupChange,
    handleSilverSalePriceChange,
    handleSilverMrpMarkupChange,

    // Step 4: Silver Media
    handleToggleAllSilverExpand,
    expandedSilverColors,
    silverColorOptions,
    silverVariantMedia,
    setSilverVariantMedia,
    isSilverColorSelected,
    isSilverColorExpanded,
    handleToggleSilverColor,
    handleToggleSilverExpand,
    uploadingSilverSwatchColor,
    uploadingSilverVariantColor,
    handleSilverSwatchUpload,
    handleRemoveSilverSwatchIcon,
    handleSilverVariantMediaUpload,
    handleRemoveSilverVariantMedia,

    // Step 4: Gold Media & VTO
    productColors,
    activeMediaColor,
    setActiveMediaColor,
    mediaImages,
    mediaVideos,
    vtoConfigs,
    isAddColorModalOpen,
    setIsAddColorModalOpen,
    handleAddColor,
    colorStatuses,
    setColorStatuses,
    activeMediaSubTab,
    setActiveMediaSubTab,
    showCompressionHub,
    setShowCompressionHub,
    compressionTab,
    setCompressionTab,
    selectedCompressionIds,
    setSelectedCompressionIds,
    compressionPreviews,
    setCompressionPreviews,
    previewingCompression,
    compressionFormat,
    setCompressionFormat,
    compressionQuality,
    setCompressionQuality,
    compressingMedia,
    handleApplyMediaCompression,
    handleCloseCompressionHub,
    handleMixedMediaUpload,
    handleOpenImagePreview,
    handleSetPrimaryMedia,
    isSizeInKb,
    formatMediaSize,
    handleRemoveMedia,
    viewingCompressionMedia,
    setViewingCompressionMedia,
    handleRemoveVideo,
    handleOpenVtoStudio,
    isVtoStudioOpen,
    setIsVtoStudioOpen,
    vtoEditingColor,
    handleVtoAssetUpload,
    handleResetVtoAlignment,
    vtoForm,
    setVtoForm,
    vtoMasters,
    vtoEnvOptions,
    handleSaveVtoConfig,

    // Step 5: Care & Specs
    careSections,
    handleAddCareSection,
    handleCareDragStart,
    handleCareDragOver,
    handleCareDrop,
    handleCareDragEnd,
    draggedCareIndex,
    dragOverCareIndex,
    handleMoveCareSection,
    handleUpdateCareSection,
    handleRemoveCareSection,
    handleFormatText,
    handleKeyDownDescription,
    specifications,
    handleAddSpecification,
    handleMoveSpecification,
    handleUpdateSpecification,
    handleRemoveSpecification,

    // Step 6: SEO
    seo,
    setSeo,

    // Staged Uploads Modal
    showUploadModal,
    handleCloseUploadModal,
    stagedUploadType,
    stagedUploadColor,
    isProcessingUpload,
    uploadProcessingStep,
    uploadProcessingPercent,
    stagedUploadFiles,
    totalStagedBytes,
    handleRemoveStagedFile,
    imageUploadPolicy,
    uploadCompressVideos,
    setUploadCompressVideos,
    handleConfirmStagedUpload,
  };

  return (
    <AddJewelryProductContext.Provider value={contextValue}>
      <div className="space-y-4 pb-8 font-sans text-stone-800">
        <StepperNav />

        {/* ─── Main Content (Full Width) ─────────────────────────── */}
        <div className="w-full space-y-4">
          {activeStep === 1 && <Step1BasicDetails />}
          {!isSilverProduct && activeStep === 2 && <Step2VariantConfig />}
          {isSilverProduct && activeStep === 3 && <Step3SilverPricing />}
          {activeStep === 4 && isSilverProduct && <Step4SilverMedia />}
          {activeStep === 4 && !isSilverProduct && <Step4GoldMedia />}
          {activeStep === 5 && <Step5CareAndSpecs />}
          {activeStep === 6 && <Step6SeoPublish />}
        </div>

        {/* ─── Bottom Navigation Bar (Sticky Footer) ──────────────────── */}
        <ProductStepFooter
          currentStepIndex={activeStepIndex >= 0 ? activeStepIndex : 0}
          totalSteps={steps.length}
          currentStepTitle={steps[activeStepIndex >= 0 ? activeStepIndex : 0]?.title}
          nextStepTitle={steps[activeStepIndex + 1]?.title}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
          onSave={handleSave}
          saving={saving}
          isEditMode={Boolean(productId)}
        />

        {/* Staged uploads & compression viewer modals */}
        <MediaUploadModals />

        {/* Pricing Breakdown & Live Calculation Modal */}
        <PricingBreakdownModal
          isOpen={breakdownModalOpen}
          onClose={() => setBreakdownModalOpen(false)}
          variant={breakdownVariant}
          breakdown={breakdownData}
          loading={breakdownLoading}
          error={breakdownError}
          specs={specs}
        />
      </div>
    </AddJewelryProductContext.Provider>
  );
}
