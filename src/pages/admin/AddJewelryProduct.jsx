import SideDiamondEditor from '../../components/common/SideDiamondEditor';
import ColorStatusToggle from '../../components/common/ColorStatusToggle';
import MenuItemSelect from '../../components/common/MenuItemSelect';
import { selectedMenuIds } from '../../utils/menuItems';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { createProductId, deleteUploadedFile, deleteUploadedFiles, getUploadCompressionSettings, uploadWithPresignedUrl, uploadFilesWithPresignedUrls, getUploadedObjectKey } from '../../utils/uploadWithPresignedUrl';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import Dropdown from '../../components/common/Dropdown';
import { getMediaUrl } from '../../utils/imageUrl';
import { openProductPreview } from '../../utils/productPreview';
import {
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineShoppingBag,
  HiOutlineShieldCheck,
  HiOutlinePhotograph,
  HiOutlineStar,
  HiOutlineVideoCamera,
  HiOutlineCube,
  HiOutlineQuestionMarkCircle,
  HiOutlineX,
  HiOutlineAdjustments,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineCheckCircle,
  HiOutlineLink,
  HiOutlineExternalLink,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoSparklesOutline,
  IoCheckmarkCircle,
  IoColorPaletteOutline,
} from 'react-icons/io5';
import { TbListDetails } from 'react-icons/tb';

// Realistic 3D Sphere Swatch generator for metal colors
const getSphereStyle = (colorName = '', fallbackCode = '') => {
  const map = {
    'White Gold': {
      gradient: 'radial-gradient(circle at 35% 35%, #ffffff, #f1f5f9 40%, #cbd5e1 75%, #94a3b8 100%)',
      shadow: 'inset -2px -2px 4px rgba(100,116,139,0.3), inset 1px 1px 3px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.12)',
    },
    'Rose Gold': {
      gradient: 'radial-gradient(circle at 35% 35%, #fde2d6, #e7a192 45%, #cb7768 75%, #9a3412 100%)',
      shadow: 'inset -2px -2px 4px rgba(154,52,18,0.35), inset 1px 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.12)',
    },
    'Yellow Gold': {
      gradient: 'radial-gradient(circle at 35% 35%, #fffbeb, #fed7aa 25%, #eab308 60%, #a16207 100%)',
      shadow: 'inset -2px -2px 4px rgba(161,98,7,0.4), inset 1px 1px 2px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.12)',
    },
    Silver: {
      gradient: 'radial-gradient(circle at 35% 35%, #ffffff, #f8fafc 30%, #cbd5e1 65%, #64748b 100%)',
      shadow: 'inset -2px -2px 4px rgba(71,85,105,0.35), inset 1px 1px 3px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.12)',
    },
    Platinum: {
      gradient: 'radial-gradient(circle at 35% 35%, #f1f5f9, #e2e8f0 40%, #94a3b8 80%, #475569 100%)',
      shadow: 'inset -2px -2px 4px rgba(51,65,85,0.4), inset 1px 1px 3px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.12)',
    },
    Black: {
      gradient: 'radial-gradient(circle at 35% 35%, #4b5563, #1f2937 60%, #000000 100%)',
      shadow: 'inset -2px -2px 5px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(255,255,255,0.35), 0 2px 4px rgba(0,0,0,0.2)',
    },
    Brown: {
      gradient: 'radial-gradient(circle at 35% 35%, #a1887f, #6d4c41 55%, #3e2723 95%)',
      shadow: 'inset -2px -2px 5px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.15)',
    },
  };
  return map[colorName] || {
    gradient: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${fallbackCode || '#d9a74a'} 60%, #555555 100%)`,
    shadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.12)',
  };
};

const VTO_ENV_OPTIONS = [
  { id: 'neck', value: 'neck', label: 'Neck View (Necklaces & Pendants)' },
  { id: 'hand', value: 'hand', label: 'Hand View (Rings)' },
  { id: 'ear', value: 'ear', label: 'Ear View (Earrings)' },
  { id: 'wrist', value: 'wrist', label: 'Wrist View (Bracelets & Bangles)' },
];

const formatMediaSize = (bytes = 0) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  const { categories: categoryList } = useCategoryLookup();

  const categoryOptions = useMemo(
    () => (Array.isArray(categoryList) ? categoryList : []).map((category) => ({
      value: typeof category === 'string' ? category : category._id,
      label: typeof category === 'string' ? category : category.name || category.title || '',
    })),
    [categoryList]
  );

  // Active wizard step: 1 = Basic, 2 = Variants, 3 = Specifications & Pricing, 4 = Product Media.
  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [menuItemIds, setMenuItemIds] = useState([]);
  const [autoOpenMenu, setAutoOpenMenu] = useState(false);

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
  const centerRatesFetchedRef = useRef(false);

  // Lazy-load Metal Purities, Metal Colors, and Diamond masters ONLY when user enters Step 2 (Variant Configuration) or later
  useEffect(() => {
    if (activeStep < 2 || mastersFetchedRef.current) return;
    mastersFetchedRef.current = true;

    const fetchMasters = async () => {
      try {
        // Try single combined API endpoint first
        let combinedData = null;
        try {
          const res = await api.get('/diamonds/attributes');
          if (res.data?.data) {
            combinedData = res.data.data;
          }
        } catch {
          combinedData = null;
        }

        if (combinedData) {
          if (Array.isArray(combinedData.metalPurities)) {
            const sorted = sortPurities(combinedData.metalPurities);
            setPurityMasterList(sorted);
            setPuritiesList(sorted.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          if (Array.isArray(combinedData.metalColors)) {
            const mapped = combinedData.metalColors.map((c) => ({
              id: c._id || c.id,
              name: c.name,
              code: c.colorCode || '#d9a74a',
              border: c.colorCodeEnd || c.colorCode || '#b5852f',
            }));
            setColorsList(mapped);
            setProductColors(mapped.map((c) => c.name));
            setActiveMediaColor((prev) => (mapped.some((c) => c.name === prev) ? prev : mapped[0].name));
          }
          const types = combinedData.types || combinedData.diamondTypes;
          if (Array.isArray(types)) {
            setDiamondTypesList(types.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          const shapes = combinedData.shapes || combinedData.diamondShapes;
          if (Array.isArray(shapes)) {
            setDiamondShapesList(shapes.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          const colors = combinedData.colors || combinedData.diamondColors;
          if (Array.isArray(colors)) {
            setDiamondColorsList(colors.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          const clarities = combinedData.clarities || combinedData.diamondClarities;
          if (Array.isArray(clarities)) {
            setDiamondClaritiesList(clarities.map((i) => (typeof i === 'string' ? i : i.name)));
          }
          setDiamondMasters({
            types: Array.isArray(types) ? types : [],
            shapes: Array.isArray(shapes) ? shapes : [],
            colors: Array.isArray(colors) ? colors : [],
            clarities: Array.isArray(clarities) ? clarities : [],
          });
          return;
        }

        // Fallback to individual lookups if combined endpoint is not available
        const [resPurities, resColors, resTypes, resShapes, resDColors, resClarities] =
          await Promise.allSettled([
            api.get('/metal-purities/lookup').catch(() => api.get('/metal-purities?limit=100')),
            api.get('/metal-colors/lookup').catch(() => api.get('/metal-colors?limit=100')),
            api.get('/diamond-types/lookup').catch(() => api.get('/diamond-types?limit=100')),
            api.get('/diamond-shapes/lookup').catch(() => api.get('/diamond-shapes?limit=100')),
            api.get('/diamond-colors/lookup').catch(() => api.get('/diamond-colors?limit=100')),
            api.get('/diamond-clarities/lookup').catch(() => api.get('/diamond-clarities?limit=100')),
          ]);

        if (resPurities.status === 'fulfilled' && resPurities.value.data?.data) {
          const items = resPurities.value.data.data;
          if (Array.isArray(items)) {
            const sorted = sortPurities(items);
            setPurityMasterList(sorted);
            setPuritiesList(sorted.map((i) => (typeof i === 'string' ? i : i.name)));
          }
        }

        if (resColors.status === 'fulfilled' && resColors.value.data?.data) {
          const items = resColors.value.data.data;
          if (Array.isArray(items)) {
            const mapped = items.map((c) => ({
              id: c._id || c.id,
              name: c.name,
              code: c.colorCode || '#d9a74a',
              border: c.colorCodeEnd || c.colorCode || '#b5852f',
            }));
            setColorsList(mapped);
            setProductColors(mapped.map((c) => c.name));
            setActiveMediaColor((prev) => (mapped.some((c) => c.name === prev) ? prev : mapped[0].name));
          }
        }

        if (resTypes.status === 'fulfilled' && resTypes.value.data?.data) {
          const items = resTypes.value.data.data;
          if (Array.isArray(items)) {
            setDiamondTypesList(items.map((i) => (typeof i === 'string' ? i : i.name)));
          }
        }

        if (resShapes.status === 'fulfilled' && resShapes.value.data?.data) {
          const items = resShapes.value.data.data;
          if (Array.isArray(items)) {
            setDiamondShapesList(items.map((i) => (typeof i === 'string' ? i : i.name)));
          }
        }

        if (resDColors.status === 'fulfilled' && resDColors.value.data?.data) {
          const items = resDColors.value.data.data;
          if (Array.isArray(items)) {
            setDiamondColorsList(items.map((i) => (typeof i === 'string' ? i : i.name)));
          }
        }

        if (resClarities.status === 'fulfilled' && resClarities.value.data?.data) {
          const items = resClarities.value.data.data;
          if (Array.isArray(items)) {
            setDiamondClaritiesList(items.map((i) => (typeof i === 'string' ? i : i.name)));
          }
        }

        const lookupItems = (result) =>
          result.status === 'fulfilled' && Array.isArray(result.value.data?.data) ? result.value.data.data : [];
        setDiamondMasters({
          types: lookupItems(resTypes),
          shapes: lookupItems(resShapes),
          colors: lookupItems(resDColors),
          clarities: lookupItems(resClarities),
        });
      } catch (err) {
        console.warn('Master lookup fetch notice:', err);
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
  const [basicDetails, setBasicDetails] = useState({
    title: '',
    sku: '',
    category: '',
    gender: '',
    description: '',
    isOrnate: false,
  });

  // Immediately hydrate Step 1 (Basic Details) as soon as productRecord is fetched without waiting for diamond masters
  useEffect(() => {
    if (!productRecord) return;
    const basicInfo = productRecord.basicInfo || {};
    const categoryValues = productRecord.categoryIds || productRecord.category || [];
    const categoryRef = Array.isArray(categoryValues) ? categoryValues[0] : categoryValues;
    const categoryId = categoryRef && typeof categoryRef === 'object' ? categoryRef._id : categoryRef;

    setMenuItemIds(selectedMenuIds(productRecord));
    setBasicDetails({
      title: basicInfo.title || '',
      sku: basicInfo.sku || '',
      category: categoryId ? String(categoryId) : '',
      gender: (() => {
        const rawGender = basicInfo.gender ?? productRecord.gender ?? '';
        const first = Array.isArray(rawGender) ? (rawGender[0] || '') : (rawGender || '');
        const matched = ['Female', 'Male', 'Unisex', 'Kids'].find(
          (opt) => opt.toLowerCase() === String(first).trim().toLowerCase()
        );
        return matched || first;
      })(),
      description: basicInfo.description || '',
      isOrnate: Boolean(productRecord.isOrnate || productRecord.productType === 'ornate'),
    });
  }, [productRecord]);

  const selectedCategory = useMemo(
    () => categoryList.find((category) => String(category._id) === String(basicDetails.category)),
    [categoryList, basicDetails.category]
  );

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
  const [baseCarat, setBaseCarat] = useState('1');
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

  // Backwards-compatible single centerDiamond & sideDiamonds
  const [centerDiamond, setCenterDiamond] = useState({
    type: '',
    shape: '',
    color: '',
    clarity: '',
    caratWeight: '',
  });

  const [sideDiamonds, setSideDiamonds] = useState({
    enabled: false,
    type: '',
    shape: '',
    color: '',
    clarity: '',
    sizeFrom: '',
    sizeTo: '',
    pieces: '',
  });

  // ─── Step 2: Preview Variants ───────────────────────────
  const [variants, setVariants] = useState([]);

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

  // Staged Upload Media (Local load -> Compression Confirmation -> Direct Cloudflare R2 Upload)
  const [stagedUploadFiles, setStagedUploadFiles] = useState([]);
  const [stagedUploadColor, setStagedUploadColor] = useState('');
  const [stagedUploadType, setStagedUploadType] = useState('jewelry'); // 'jewelry' | 'silver'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imageUploadPolicy, setImageUploadPolicy] = useState({ enabled: true, quality: 82, maxDimension: 2400, format: 'image/webp' });
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
  const [uploadingSilverVariantColor, setUploadingSilverVariantColor] = useState(null);
  const [uploadingSilverSwatchColor, setUploadingSilverSwatchColor] = useState(null);
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

  // Keyboard navigation for zoom modal
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

  const silverColorOptions = useMemo(() => {
    const list = colorsList && colorsList.length > 0
      ? colorsList
      : [
          { name: 'Rose Gold', code: '#e89f8f', border: '#cb7768' },
          { name: 'White Gold', code: '#cbd5e1', border: '#94a3b8' },
          { name: 'Yellow Gold', code: '#eab308', border: '#a16207' },
        ];
    const map = new Map();
    list.forEach((c) => {
      const sphere = getSphereStyle(c.name, c.code);
      map.set(c.name.toLowerCase(), {
        id: c.id || c._id,
        name: c.name,
        hex: c.code,
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

  const handleToggleSilverExpand = (colorName) => {
    setExpandedSilverColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
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

  const handleSilverSwatchUpload = async (colorName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSilverSwatchColor(colorName);
      const res = await uploadWithPresignedUrl(file, 'products', null, { productId: mediaProductId });
      if (res.fileUrl) {
        setSilverVariantMedia((prev) => ({
          ...prev,
          [colorName]: {
            ...prev[colorName],
            swatchIcon: res.fileUrl,
            swatchIconKey: res.key,
          },
        }));
        setSilverColors((prev) => Array.from(new Set([...prev, colorName])));
        const savingsText = res.wasCompressed ? ` (optimized ${formatMediaSize(res.originalSize)} → ${formatMediaSize(res.compressedSize)})` : '';
        toast.success(`${colorName} swatch icon uploaded${savingsText}!`);
      }
    } catch (err) {
      console.error('Swatch icon upload failed:', err);
      toast.error(err.message || 'Failed to upload swatch icon');
    } finally {
      setUploadingSilverSwatchColor(null);
      e.target.value = '';
    }
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
  const [customColorInput, setCustomColorInput] = useState({ name: '', code: '#1f2937' });

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

  // VTO Master Global Environments fetched from backend API (lazily loaded ONLY when in Product Media step)
  const [vtoMasters, setVtoMasters] = useState({});
  const vtoMastersFetchedRef = useRef(false);

  useEffect(() => {
    // Call /vto-masters API when user enters Step 4 (Product Media) or opens VTO Studio
    if ((activeStep !== 4 && !isVtoStudioOpen) || vtoMastersFetchedRef.current) return;

    const fetchVtoMasters = async () => {
      try {
        vtoMastersFetchedRef.current = true;
        const res = await api.get('/vto-masters');
        const items = res.data?.data?.items || res.data?.data || [];
        if (Array.isArray(items)) {
          const map = {};
          items.forEach((m) => {
            const key = m.bodyPart || m.partKey;
            if (key) {
              map[key] = {
                light: getMediaUrl(m.lightImage?.url),
                dark: getMediaUrl(m.darkImage?.url),
              };
            }
          });
          setVtoMasters(map);
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
        }));
        const videos = (latestVideos[colorName] || []).filter((item) => item?.url).map((item) => ({
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

    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;
    let successfulCount = 0;
    const newMediaItems = [];

    const toastId = 'staged-upload-toast';
    toast.loading(`Starting upload for ${stagedUploadFiles.length} file(s)...`, { id: toastId });

    try {
      for (let i = 0; i < stagedUploadFiles.length; i++) {
        const item = stagedUploadFiles[i];
        totalOriginalBytes += item.size;

        const currentPct = Math.round((i / stagedUploadFiles.length) * 100);
        setUploadProcessingPercent(currentPct);

        let fileToUpload = item.file;
        let wasCompressed = false;

        // Image uploads use the saved global compression policy in uploadWithPresignedUrl.
        // Keep optional video encoding local to this upload batch.
        if (item.isImage && imageUploadPolicy.enabled) {
          setStagedUploadFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'compressing' } : f))
          );
          setUploadProcessingStep(`Optimizing image ${i + 1} of ${stagedUploadFiles.length}: ${item.name}`);
          toast.loading(`Optimizing image (${i + 1}/${stagedUploadFiles.length}): ${item.name}...`, { id: toastId });
        } else if (item.isVideo && uploadCompressVideos) {
          setStagedUploadFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'compressing' } : f))
          );
          setUploadProcessingStep(`Encoding video ${i + 1} of ${stagedUploadFiles.length}: ${item.name}`);
          try {
            fileToUpload = await compressLocalVideoFile(item.file, 0.82);
            wasCompressed = Boolean(fileToUpload.wasCompressed);
          } catch (compErr) {
            console.warn(`[handleConfirmStagedUpload] Video compression skipped for ${item.name}:`, compErr);
            fileToUpload = item.file;
          }
        }

        // --- STEP 2: Direct Upload to Cloudflare R2 ---
        setStagedUploadFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
        );
        setUploadProcessingStep(`Uploading to Cloudflare ${i + 1} of ${stagedUploadFiles.length}: ${fileToUpload.name}`);
        toast.loading(`Uploading to Cloudflare (${i + 1}/${stagedUploadFiles.length}): ${fileToUpload.name}...`, { id: toastId });

        const uploadRes = await uploadWithPresignedUrl(fileToUpload, 'products', null, {
          productId: mediaProductId,
        });
        totalCompressedBytes += uploadRes.size || fileToUpload.size;
        wasCompressed = wasCompressed || uploadRes.wasCompressed;

        const displaySize = formatMediaSize(uploadRes.size || fileToUpload.size);
        const mediaRecord = {
          id: `${item.isVideo ? 'vid' : 'img'}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          url: uploadRes.fileUrl,
          key: uploadRes.key,
          name: uploadRes.name || fileToUpload.name,
          title: uploadRes.name || fileToUpload.name,
          size: displaySize,
          fileSize: uploadRes.size || fileToUpload.size,
          uploadedAt,
          mediaType: item.isVideo ? 'video' : 'image',
          wasCompressed,
        };

        newMediaItems.push({ item, mediaRecord, isVideo: item.isVideo });

        setStagedUploadFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f))
        );
        successfulCount++;
      }

      setUploadProcessingPercent(100);

      // --- STEP 3: Update State & Sync DB ---
      if (isSilver) {
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

      if (savedBytes > 0) {
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

  const handleImageUpload = (e, colorName = activeMediaColor) => handleMixedMediaUpload(e, colorName);
  const handleVideoUpload = (e, colorName = activeMediaColor) => handleMixedMediaUpload(e, colorName);

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
      ? (mediaImages[activeMediaColor] || []).filter((image) => selectedCompressionIds.includes(image.id))
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
      vtoCategory: cfg.vtoCategory || 'neck',
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

  // Remove a color from product media list
  const handleRemoveColor = (colorName) => {
    if (productColors.length <= 1) {
      toast.error('You must keep at least one metal color for the product.');
      return;
    }
    const filtered = productColors.filter((c) => c !== colorName);
    setProductColors(filtered);
    if (activeMediaColor === colorName) {
      setActiveMediaColor(filtered[0]);
    }
    toast.success(`Removed ${colorName} from product showcase`);
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

  // Create custom metal color via backend API
  const handleCreateCustomColor = async () => {
    const name = customColorInput.name.trim();
    if (!name) {
      toast.error('Please enter a color name.');
      return;
    }
    try {
      const res = await api.post('/metal-colors', {
        name,
        colorCode: customColorInput.code,
      });
      const created = res.data?.data || { name, code: customColorInput.code };
      setColorsList((prev) => [...prev, { name: created.name, code: created.colorCode || customColorInput.code }]);
      handleAddColor(created.name);
      setCustomColorInput({ name: '', code: '#1f2937' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create metal color');
    }
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
    stockStatus: '',
    status: 'approved',
  });

  // Right column active preview thumbnail selection
  const [previewImage, setPreviewImage] = useState('');

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
    pricing: { calculationMode: 'automatic', baseCarat: Number(baseCarat), gstPercentage: Number(gstPercentage), baseLabourCharge: Number(specs.baseLabourCharge), certificateCharge: Number(specs.certificateCharge), otherAmountPercentage: Number(specs.otherAmountPercentage) },
    specifications: { metalWeight: Number(specs.metalWeight) },
    metalPurityIds: selectedPurities.map((name) => masterId(purityMasterList, name)),
    metalColorIds: selectedColors.map((name) => masterId(colorsList, name)),
    centerDiamondRows: centerDiamondCombinations.map((row) => ({
      diamondTypeId: masterId(diamondMasters.types, row.diamondType), diamondShapeId: masterId(diamondMasters.shapes, row.shape),
      diamondColorId: masterId(diamondMasters.colors, row.color), diamondClarityId: masterId(diamondMasters.clarities, row.clarity),
      caratWeight: Number(row.carat), pricePerCarat: Number(row.rate), rateSource: customComboRates[row.id] !== undefined ? 'manual' : 'master',
    })),
    sideDiamondRows: sideRows.map((row) => ({ ...row, pieces: Number(row.pieces), caratWeight: Number(row.caratWeight), priceINR: Number(row.priceINR || 0) })),
    variants: variants.map((row) => ({ ...row, _id: row._id, stock: Number(row.stock || 0) })),
  });
  const handleRegenerateVariants = async () => {
    if (computingPrices) return;
    setComputingPrices(true);
    try {
      const { data } = await api.post('/products/pricing-preview', pricingInput());
      const result = data.data;
      const name = (list, value) => list.find((item) => String(item._id || item.id) === String(value))?.name || '';
      setVariants(result.variants.map((row, index) => ({ ...row,
        id: row._id || row.pricingKey || index,
        purity: name(purityMasterList, row.metalPurityId), color: name(colorsList, row.metalColorId),
        diamondDetails: { center: [name(diamondMasters.types, row.diamondTypeId), name(diamondMasters.colors, row.diamondColorId), name(diamondMasters.clarities, row.diamondClarityId), row.caratWeight ? row.caratWeight + 'ct' : ''].filter(Boolean).join(' · '), side: row.sideDiamondWeight ? 'Side: ' + row.sideDiamondWeight + 'ct' : '' },
        weight: String(row.metalWeight), price: String(row.price), priceRaw: row.price, stock: String(row.stock),
      })));
      setAutomaticPricing(true);
      setPricing((previous) => ({ ...previous, salePrice: String(result.salePrice) }));
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

  // ─── Step 5: Care & Specifications State & Handlers ─────────
  const [careSections, setCareSections] = useState([]);
  const [draggedCareIndex, setDraggedCareIndex] = useState(null);
  const [dragOverCareIndex, setDragOverCareIndex] = useState(null);
  const [specifications, setSpecifications] = useState([]);

  useEffect(() => {
    if (!productId || !productRecord || !mastersLoaded || hydratedProductId.current === productId) return;

    const resolveName = (value, options = []) => {
      const embeddedName = value && typeof value === 'object' ? value.name : '';
      const id = value && typeof value === 'object' ? (value._id || value.id) : value;
      const match = options.find((option) =>
        option && typeof option === 'object' && String(option._id || option.id) === String(id)
      );
      return embeddedName || match?.name || (id ? String(id) : '');
    };
    const unique = (values) => [...new Set(values.filter(Boolean))];
    const basicInfo = productRecord.basicInfo || {};
    const productPricing = productRecord.pricing || {};
    const categoryValues = productRecord.categoryIds || productRecord.category || [];
    const categoryRef = Array.isArray(categoryValues) ? categoryValues[0] : categoryValues;
    const categoryId = categoryRef && typeof categoryRef === 'object' ? categoryRef._id : categoryRef;
    const productMetalColors = productRecord.metalColorIds || productRecord.metalColors || [];
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
        .map((item, index) => ({
          id: item.key || item._id || colorName + '-image-' + index,
          url: item.url,
          key: item.key,
          name: item.name || '',
          isPrimary: index === 0,
        }));
      videosByColor[colorName] = rowImages
        .filter((item) => item?.url && item.mediaType === 'video')
        .map((item, index) => ({
          id: item.key || item._id || colorName + '-video-' + index,
          url: item.url,
          key: item.key,
          title: item.title || '',
        }));
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
    const hasColorMedia = Object.values(imagesByColor).some((items) => items.length) ||
      Object.values(videosByColor).some((items) => items.length);
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
        const rawGender = basicInfo.gender ?? productRecord.gender ?? '';
        const first = Array.isArray(rawGender) ? (rawGender[0] || '') : (rawGender || '');
        const matched = ['Female', 'Male', 'Unisex', 'Kids'].find(
          (opt) => opt.toLowerCase() === String(first).trim().toLowerCase()
        );
        return matched || first;
      })(),
      description: basicInfo.description || '',
      isOrnate: Boolean(productRecord.isOrnate || productRecord.productType === 'ornate'),
    });
    const savedPurities = Array.isArray(productRecord.metalPurityIds)
      ? productRecord.metalPurityIds.map((purity) => resolveName(purity, puritiesList))
      : [];
    setSelectedPurities(unique([...savedPurities, ...variantRows.map((variant) => variant.purity)]));
    setSelectedColors(unique([...colorNames, ...variantRows.map((variant) => variant.color)]));
    setVariants(variantRows);
    setCenterDiamondType(firstCenter.type || '');
    setCenterDiamondShape(firstCenter.shape || '');
    setCenterDiamondColors(unique(centerNames.map((row) => row.color)));
    setCenterDiamondClarities(unique(centerNames.map((row) => row.clarity)));
    setCenterDiamondCarats(unique(centerNames.map((row) => Number(row.carat)).filter(Number.isFinite)));
    setCustomComboRates(Object.fromEntries(centerNames.filter((row) => row.rateSource === 'manual' || (!row.rateSource && row.rate > 0)).map((row) => [
      [row.type, row.shape, row.color, row.clarity, row.carat].join('-'),
      row.rate,
    ])));
    setCenterDiamond({
      type: firstCenter.type || '',
      shape: firstCenter.shape || '',
      color: firstCenter.color || '',
      clarity: firstCenter.clarity || '',
      caratWeight: firstCenter.carat == null ? '' : String(firstCenter.carat),
    });
    setAutomaticPricing(productRecord.pricing?.calculationMode === 'automatic');
    setBaseCarat(String(productRecord.pricing?.baseCarat ?? 1));
    setGstPercentage(String(productRecord.pricing?.gstPercentage ?? 3));
    setSideRows((productRecord.sideDiamondRows || []).map((row) => ({ ...row, rateSource: row.rateSource || (row.priceINR ? 'manual' : 'master') })));
    const sideRow = (Array.isArray(productRecord.sideDiamondRows) ? productRecord.sideDiamondRows : [])[0];
    setSideDiamonds(sideRow ? {
      enabled: true,
      type: resolveName(sideRow.diamondTypeId || sideRow.diamondType, diamondMasters.types),
      shape: resolveName(sideRow.diamondShapeId || sideRow.diamondShape, diamondMasters.shapes),
      color: resolveName(sideRow.diamondColorId || sideRow.diamondColor, diamondMasters.colors),
      clarity: resolveName(sideRow.diamondClarityId || sideRow.diamondClarity, diamondMasters.clarities),
      sizeFrom: sideRow.sizeFrom == null ? '' : String(sideRow.sizeFrom),
      sizeTo: sideRow.sizeTo == null ? '' : String(sideRow.sizeTo),
      pieces: sideRow.pieces == null ? '' : String(sideRow.pieces),
    } : {
      enabled: false, type: '', shape: '', color: '', clarity: '', sizeFrom: '', sizeTo: '', pieces: '',
    });
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
              swatchIcon: ci.variantIcon?.url || ci.variantIcon || '',
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
      stockStatus: productRecord.stockStatus || '',
      status: productRecord.status || 'approved',
    });
    setPreviewImage(
      productRecord.colorImages?.flatMap((color) => color.images || []).find((image) => image?.url)?.url ||
      productRecord.ornate?.ornateImages?.[0]?.url ||
      ''
    );
    hydratedProductId.current = productId;
    setProductLoading(false);
  }, [productId, productRecord, mastersLoaded, colorsList, puritiesList, diamondMasters]);

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
  const handlePublish = async (statusOverride = 'preserve') => {
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
      const activeSlug = seo.slug?.trim() || undefined;
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
      const displayPriceNum = isSilverProduct ? numberValue(pricing.salePrice) : jewelryStartingPrice;
      const ornatePriceNum = isSilverProduct ? numberValue(pricing.ornatePrice) : undefined;
      const calculatedPriceNum = isSilverProduct ? numberValue(pricing.calculatedPrice) : undefined;
      const markupNum = numberValue(pricing.markupPercentage);
      const mrpMarkupNum = isSilverProduct ? numberValue(pricing.mrpMarkupPercentage) : undefined;

      const metalWeightNum = numberValue(specs.metalWeight);
      const categoryId = selectedCategory?._id ||
        (/^[a-f\d]{24}$/i.test(String(basicDetails.category)) ? basicDetails.category : null);
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
      const metalColorIds = [...new Set(productColors.map((colorName) => {
        const color = colorsList.find((item) => item.name?.toLowerCase() === colorName.toLowerCase());
        return color?.id || color?._id;
      }).filter(Boolean))];
      const metalPurityIds = [...new Set(selectedPurities.map((purityName) => {
        const purity = purityMasterList.find((item) =>
          (typeof item === 'string' ? item : item?.name)?.toLowerCase() === purityName.toLowerCase()
        );
        return typeof purity === 'object' && purity ? (purity._id || purity.id) : null;
      }).filter(Boolean).map(String))];
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
      const centerDiamondRows = centerDiamondCombinations.map((combination) => withDiamondIds({
        diamondType: combination.diamondType,
        diamondShape: combination.shape,
        diamondColor: combination.color,
        diamondClarity: combination.clarity,
        caratWeight: numberValue(combination.carat),
        pricePerCarat: numberValue(combination.rate),
        rateSource: customComboRates[combination.id] !== undefined ? 'manual' : 'master',
      }));
      // Only include side diamonds that have actual attributes configured, avoid blank template rows
      const validSideDiamondRows = (sideRows || [])
        .filter((row) => row.diamondTypeId && (row.diamondShapeId || Number(row.caratWeight) > 0 || Number(row.pieces) > 0))
        .map((row) => compactObject({
          ...row,
          pieces: numberValue(row.pieces),
          caratWeight: numberValue(row.caratWeight),
          priceINR: numberValue(row.priceINR),
        }));
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
          ...(metalWeightNum ? {
            calculationMode: automaticPricing ? 'automatic' : 'manual',
            baseCarat: Number(baseCarat),
            gstPercentage: Number(gstPercentage),
            baseLabourCharge: numberValue(specs.baseLabourCharge),
            certificateCharge: numberValue(specs.certificateCharge),
            otherAmountPercentage: numberValue(specs.otherAmountPercentage),
          } : (!isDraft ? {
            calculationMode: automaticPricing ? 'automatic' : 'manual',
            baseCarat: Number(baseCarat),
            gstPercentage: Number(gstPercentage),
          } : {})),
        } : {}),
      });
      const specificationData = compactObject({
        ...(!isSilverProduct && metalWeightNum ? { metalWeight: metalWeightNum } : {}),
      });
      const seoData = compactObject({
        metaTitle: seo.metaTitle?.trim(),
        metaDescription: seo.metaDescription?.trim(),
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
              ...(vData.swatchIcon ? { variantIcon: { url: vData.swatchIcon } } : {}),
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
      const payload = {
        ...(!productId ? { _id: draftProductId } : {}),
        productType: isSilverProduct || basicDetails.isOrnate ? 'silver' : 'gold',
        isOrnate: Boolean(basicDetails.isOrnate),
        ...(basicDetails.gender ? { gender: [basicDetails.gender] } : {}),
        basicInfo: compactObject({
          title: activeTitle,
          sku: activeSku || undefined,
          slug: activeSlug,
          description: activeDesc,
          ...(basicDetails.gender ? { gender: [basicDetails.gender] } : {}),
        }),
        status: statusOverride === 'preserve'
          ? (productRecord?.status || seo.status || (productId ? 'approved' : 'draft'))
          : (statusOverride === 'draft' ? 'draft' : 'approved'),
        ...(categoryId ? { categoryIds: [categoryId] } : {}),
        ...(menuItemIds && menuItemIds.length ? { menuItemIds } : {}),
        ...(Object.keys(pricingData).length ? { pricing: pricingData } : {}),
        ...(Object.keys(specificationData).length ? { specifications: specificationData } : {}),
        ...(isSilverProduct
          ? (silverMetalColorIds.length ? { metalColorIds: silverMetalColorIds } : {})
          : (metalColorIds.length && (!isDraft || variantRows.length) ? { metalColorIds } : {})),
        ...(!isSilverProduct && metalPurityIds.length && (!isDraft || variantRows.length) ? { metalPurityIds } : {}),
        ...(isSilverProduct
          ? (silverColorImageRows.length ? { colorImages: silverColorImageRows } : {})
          : (colorImageRows.length ? { colorImages: colorImageRows } : {})),
        ...(!isSilverProduct && variantRows.length ? { variants: variantRows } : {}),
        ...(!isSilverProduct && centerDiamondRows.length ? { centerDiamondRows } : {}),
        ...(!isSilverProduct && validSideDiamondRows.length ? { sideDiamondRows: validSideDiamondRows } : {}),
        ...(descriptionSections.length ? { descriptionSections } : {}),
        ...(productSpecifications.length ? { productSpecifications } : {}),
        ...(Object.keys(seoData).length ? { seo: seoData } : {}),
        ...(seo.stockStatus ? { stockStatus: seo.stockStatus } : {}),
      };

      if (productId) {
        await api.put('/products/' + productId, payload);
      } else {
        await api.post('/products', payload);
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
      navigate(productListPath);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save product. Please review the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save the current product storing details and keeping status field as it is.
  const handleSave = async () => handlePublish('preserve');
  const handleSaveDraft = async () => handlePublish('draft');

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

  return (
    <div className="space-y-4 pb-8 font-sans text-stone-800 animate-fadeIn">
      {/* ─── Top Bar (Title & Actions Matching Screenshot) ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#eee8df] shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(productListPath)}
            className="w-9 h-9 rounded-xl border border-[#d6cfc2] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-800 transition-colors shadow-2xs cursor-pointer"
            title={`Back to ${isSilverProduct ? 'Silver' : 'Jewelry'} Products`}
          >
            <HiOutlineArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight">
                {productId
                  ? `Edit ${isSilverProduct ? 'Silver' : 'Jewelry'} Product`
                  : `Add ${isSilverProduct ? 'Silver' : 'Jewelry'} Product`}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#ebdcc9]">
                Barcode: {ornate.barcode || '—'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              ERP SKU: <span className="font-mono text-stone-800 font-semibold">{ornate.tagNo || '—'}</span>
              &bull; Metal: <span className="text-stone-800 font-semibold">{[...new Set(variants.map((variant) => variant.color).filter(Boolean))].join(', ') || '—'}</span>
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {productId && (
            <button
              type="button"
              onClick={() => openProductPreview(productRecord || { _id: productId })}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#785e40] bg-white border border-[#d6cfc2] rounded-xl hover:bg-[#faf7f2] active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
              title="Open this product on the storefront"
            >
              <HiOutlineExternalLink className="w-4 h-4" />
              <span>View on website</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-800 bg-white border border-[#d6cfc2] rounded-xl hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineDocumentText className="w-4 h-4 text-stone-600" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={() => handlePublish('approved')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheckCircle className="w-4 h-4" />
            <span>{productId ? 'Publish Changes' : 'Publish'}</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span>{getNextButtonText()}</span>
            <HiOutlineArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ─── Stepper Wizard Bar (Matches Screenshot) ─────────── */}
      <div className="bg-white rounded-2xl border border-[#eee8df] p-2 sm:p-2.5 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 items-center min-w-[480px] sm:min-w-0">
          {steps.map((s, idx) => {
            const isActive = activeStep === s.num;

            return (
              <div key={s.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={`flex items-center gap-2.5 text-left w-full p-2 rounded-xl transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-[#f8ede2] border border-[#ebdcc9]'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  {/* Step Indicator Circle with exact number */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-[#8b6f4e] text-white shadow-xs'
                        : 'border border-stone-300 bg-white text-stone-700 group-hover:border-stone-400'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-stone-900' : 'text-stone-800'
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-stone-600' : 'text-stone-400'
                    }`}>
                      {s.subtitle}
                    </p>
                  </div>
                </button>

                {/* Connecting Line (except last item) */}
                {idx < steps.length - 1 && (
                  <div className="hidden 2xl:block w-3 h-[1px] bg-stone-200 mx-0.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Main Content (Full Width) ─────────────────────────── */}
      <div className="w-full space-y-4">
          {/* ═══════════════════════════════════════════════════
              STEP 1: BASIC DETAILS
          ════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Basic Product Information
                  </h3>
                  <p className="text-xs text-stone-500">
                    Enter the master product name, SKU prefix and category categorization.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Product Title <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.title}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Royal Diamond Solitaire Ring"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Master SKU Prefix <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.sku}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))
                    }
                    placeholder="NR-RING-001"
                    className="w-full px-3.5 py-2.5 text-xs font-mono uppercase font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Category <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Dropdown
                    size="field"
                    variant="input"
                    value={basicDetails.category}
                    onChange={(val) => {
                      if (val !== basicDetails.category) setMenuItemIds([]);
                      setBasicDetails((prev) => ({ ...prev, category: val }));
                      if (val) setAutoOpenMenu(true);
                    }}
                    placeholder="Select Category"
                    options={categoryOptions}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Menu Items</label>
                  <MenuItemSelect
                    key={basicDetails.category}
                    categoryId={basicDetails.category}
                    value={menuItemIds}
                    onChange={setMenuItemIds}
                    disabled={saving}
                    autoOpen={autoOpenMenu}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) setAutoOpenMenu(false);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Gender Target</label>
                  <Dropdown
                    size="field"
                    variant="input"
                    value={basicDetails.gender}
                    onChange={(val) =>
                      setBasicDetails((prev) => ({ ...prev, gender: val }))
                    }
                    placeholder="Select Gender"
                    options={[
                      { value: 'Female', label: 'Female' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Unisex', label: 'Unisex' },
                      { value: 'Kids', label: 'Kids' },
                    ]}
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Luxury Description</label>
                  <textarea
                    rows={4}
                    value={basicDetails.description}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe craftsmanship, finish and diamond brilliance..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all leading-relaxed shadow-2xs placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2: VARIANT CONFIGURATION (Matches Screenshot)
          ════════════════════════════════════════════════════ */}
          {!isSilverProduct && activeStep === 2 && (
            <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
              {/* Step Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Variant Configuration
                  </h3>
                  <p className="text-xs text-stone-500">
                    Configure metal options, purities and diamond details. Variants will be generated automatically.
                  </p>
                </div>
              </div>

              {/* ─── Sub-Section 1: Metal Options ──────────── */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">Metal Options</h3>
                    <p className="text-[10px] text-stone-400">
                      Select metal purity and colors available for this product.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 pt-0.5">
                  {/* Metal Purity Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-700">
                      Metal Purity <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sortedDisplayPurities.map((purity) => {
                        const isSelected = selectedPurities.includes(purity);
                        return (
                          <button
                            key={purity}
                            type="button"
                            onClick={() => handleTogglePurity(purity)}
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                            }`}
                          >
                            {purity}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metal Color Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-700">
                      Metal Color <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colorsList.map((color) => {
                        const isSelected = selectedColors.includes(color.name);
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => handleToggleColor(color.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: color.code }}
                            />
                            <span>{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metal weight and product charges are configured alongside the variants. */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">Metal Specifications</h3>
                    <p className="text-[10px] text-stone-400">Set the base metal weight and applicable charges for these variants.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7">
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-700">Metal Weight (g)</span>
                    <input type="number" min="0" step="0.001" value={specs.metalWeight} onChange={(e) => setSpecs((prev) => ({ ...prev, metalWeight: e.target.value }))} className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-[#d6cfc2] rounded-lg focus:outline-none focus:border-[#8b6f4e]" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-700">Making Charge (₹/g)</span>
                    <input type="number" min="0" value={specs.baseLabourCharge} onChange={(e) => setSpecs((prev) => ({ ...prev, baseLabourCharge: e.target.value }))} className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-[#d6cfc2] rounded-lg focus:outline-none focus:border-[#8b6f4e]" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-700">Certificate Charge (₹)</span>
                    <input type="number" min="0" value={specs.certificateCharge} onChange={(e) => setSpecs((prev) => ({ ...prev, certificateCharge: e.target.value }))} className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-[#d6cfc2] rounded-lg focus:outline-none focus:border-[#8b6f4e]" />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 p-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={automaticPricing} onChange={(event) => setAutomaticPricing(event.target.checked)} /> Calculate prices from live master rates</label>
                <p className="text-xs text-stone-500">Base weight is at 14KT. Includes 5% casting allowance. Center stones adjust weight by 8% per carat difference; side-only quality options keep the same weight. Markup is applied after GST.</p>
                <div className="flex gap-4">
                  <label className="text-xs">Base center carat<input type="number" min="0" step="0.01" value={baseCarat} onChange={(event) => setBaseCarat(event.target.value)} className="ml-2 w-24 rounded border p-2" /></label>
                  <label className="text-xs">GST %<input type="number" min="0" step="0.01" value={gstPercentage} onChange={(event) => setGstPercentage(event.target.value)} className="ml-2 w-20 rounded border p-2" /></label>
                </div>
              </div>

              {/* ─── Sub-Section 3: Center & Side Diamond Configuration ──── */}
              <div className="space-y-4 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">Diamond Configuration</h3>
                    <p className="text-[10px] text-stone-400">
                      Configure multi-stone center combinations and optional side diamonds.
                    </p>
                  </div>
                </div>

                {/* ── Center Diamond Configuration Card (Exact match to portal screenshot) ── */}
                <div className="p-5 rounded-2xl border border-stone-200/90 bg-white space-y-4 shadow-2xs">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <IoDiamondOutline className="w-4 h-4 text-[#8b6f4e]" />
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-900">
                        CENTER DIAMOND CONFIGURATION
                      </h4>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d8c0]">
                      {centerDiamondCombinations.length} {centerDiamondCombinations.length === 1 ? 'Combination' : 'Combinations'}
                    </span>
                  </div>

                  {/* Top Controls Grid: Type, Shape, Color, Clarity, Carat Weight */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start pt-1">
                    {/* 1. DIAMOND TYPE */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        DIAMOND TYPE
                      </label>
                      <Dropdown
                        size="sm"
                        value={centerDiamondType}
                        onChange={(val) => {
                          setCenterDiamondType(val);
                          setCenterDiamond((prev) => ({ ...prev, type: val }));
                        }}
                        options={diamondTypesList}
                        placeholder="Select Diamond Type"
                        buttonClassName="h-8 px-3 text-xs rounded-lg bg-white border-stone-200 font-semibold text-stone-800"
                      />
                    </div>

                    {/* 2. DIAMOND SHAPE */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        DIAMOND SHAPE
                      </label>
                      <Dropdown
                        size="sm"
                        value={centerDiamondShape}
                        onChange={(val) => {
                          setCenterDiamondShape(val);
                          setCenterDiamond((prev) => ({ ...prev, shape: val }));
                        }}
                        options={diamondShapesList}
                        buttonClassName="h-8 px-3 text-xs rounded-lg bg-white border-stone-200 font-semibold text-stone-800 uppercase"
                      />
                    </div>

                    {/* 3. COLOR */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        COLOR
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {centerColorOptions.map((c) => {
                          const isSelected = centerDiamondColors.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleCenterColor(c)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#8b6f4e] text-white shadow-2xs'
                                  : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                              }`}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. CLARITY */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        CLARITY
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {centerClarityOptions.map((cla) => {
                          const isSelected = centerDiamondClarities.includes(cla);
                          return (
                            <button
                              key={cla}
                              type="button"
                              onClick={() => toggleCenterClarity(cla)}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#8b6f4e] text-white shadow-2xs'
                                  : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                              }`}
                            >
                              {cla}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. TOTAL CARAT WEIGHT (CT) */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        TOTAL CARAT WEIGHT (CT)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1.5"
                          value={caratInput}
                          onChange={(e) => setCaratInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCarat();
                            }
                          }}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCarat}
                          className="w-8 h-8 flex-shrink-0 rounded-lg bg-[#8b6f4e] hover:bg-[#785e42] text-white flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                          title="Add Carat Weight"
                        >
                          +
                        </button>
                      </div>

                      {/* Carat Tags with Delete 'x' */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {centerDiamondCarats.map((ct) => (
                          <span
                            key={ct}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#8b6f4e] text-white text-xs font-semibold shadow-2xs"
                          >
                            <span>{ct} ct</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCarat(ct)}
                              className="text-white/80 hover:text-white cursor-pointer leading-none text-xs"
                              title={`Remove ${ct} ct`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Auto-Generated Combinations Table */}
                  <div className="pt-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8b6f4e]" />
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                        AUTO-GENERATED COMBINATIONS ({centerDiamondCombinations.length})
                      </h5>
                    </div>

                    {centerDiamondCombinations.length === 0 ? (
                      <div className="py-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
                        <p className="text-xs text-stone-400">
                          Select colors, clarities, and add carat weights to generate combinations.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-stone-200 bg-stone-50/60 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              <th className="py-2.5 px-4 font-bold">DIAMOND TYPE</th>
                              <th className="py-2.5 px-3 font-bold">COLOR</th>
                              <th className="py-2.5 px-3 font-bold">CLARITY</th>
                              <th className="py-2.5 px-3 font-bold">CARAT (CT)</th>
                              <th className="py-2.5 px-3 font-bold">RATE / CT (₹)</th>
                              <th className="py-2.5 px-4 font-bold text-right">TOTAL PRICE (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-sans">
                            {centerDiamondCombinations.map((combo) => (
                              <tr key={combo.id} className="hover:bg-stone-50/40 transition-colors">
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="inline-block px-2.5 py-0.5 rounded-md border border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-700">
                                    {combo.diamondType}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-stone-800 whitespace-nowrap">
                                  {combo.color}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-stone-800 whitespace-nowrap">
                                  {combo.clarity}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-stone-800 whitespace-nowrap">
                                  {combo.carat} ct
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1 font-semibold text-stone-800">
                                    <span>₹</span>
                                    <input
                                      type="number"
                                      value={combo.rate}
                                      onChange={(e) => handleUpdateComboRate(combo.id, Number(e.target.value) || 0)}
                                      placeholder="Not Set"
                                      className={`w-24 h-6 px-1.5 text-xs font-semibold bg-stone-50/50 border border-transparent hover:border-stone-200 focus:border-[#8b6f4e] focus:bg-white rounded transition-colors ${combo.rate === 0 ? 'text-amber-500 italic' : 'text-stone-800'}`}
                                    />
                                  </div>
                                  {combo.rate === 0 && (
                                    <span className="text-[9px] text-amber-500 mt-0.5 block">Configure in Diamond Pricing Master</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold whitespace-nowrap">
                                  {combo.rate === 0 ? (
                                    <span className="text-amber-500 text-[11px] italic">Not Set</span>
                                  ) : (
                                    <span className="text-stone-900">
                                      ₹{(combo.carat * combo.rate).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <SideDiamondEditor rows={sideRows} onChange={setSideRows} masters={diamondMasters} />
              </div>

              {/* ─── Sub-Section 3: Preview Variants ───────── */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900">Preview Variants</h3>
                      <p className="text-[10px] text-stone-400">
                        Review calculated metal, diamond, making and tax costs. Hover over a price for its breakdown.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span aria-live="polite" className="rounded-full border border-[#e8d8c0] bg-[#faf5ee] px-3 py-1.5 text-xs font-semibold text-[#8b6f4e]">
                      Total Variants: {variants.length}
                    </span>
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-stone-500">
                      Other amount markup %
                      <input type="number" min="0" value={specs.otherAmountPercentage} onChange={(e) => setSpecs((prev) => ({ ...prev, otherAmountPercentage: e.target.value }))} className="w-16 px-2 py-1.5 text-xs text-stone-800 rounded-md border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]" />
                    </label>
                    <button type="button" disabled={computingPrices} onClick={handleRegenerateVariants} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] border border-[#8b6f4e] rounded-lg hover:bg-[#765b3d] active:scale-[0.98] transition-all shadow-sm cursor-pointer">
                      <HiOutlineRefresh className="w-4 h-4" />
                      <span>{variants.length ? 'Recompute Variants' : 'Compute Variants'}</span>
                    </button>
                  </div>

                </div>

                {/* Variants Table */}
                <div className="border border-stone-200/90 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#faf9f7] border-b border-stone-200/80 text-[9.5px] font-bold text-stone-500 uppercase tracking-wider">
                          <th scope="col" className="py-2.5 px-3 w-16 whitespace-nowrap text-center">Sr. No.</th>
                          <th className="py-2.5 pl-3 pr-2 min-w-[260px]">COMBINATION</th>
                          <th className="py-2.5 px-2.5 min-w-[140px]">SKU</th>
                          <th className="py-2.5 px-2.5 w-28 text-center">FINAL WEIGHT (G)</th>
                          <th className="py-2.5 px-2.5 w-32 text-center">LABOUR CHARGE (₹)</th>
                          <th className="py-2.5 px-2.5 w-32 text-right">FINAL PRICE (₹)</th>
                          <th className="py-2.5 px-2.5 w-32 text-right">
                            <span>OTHER AMOUNT (₹)</span>
                            <span className="block text-[8.5px] text-stone-400 font-normal">MARKUP %: {specs.otherAmountPercentage || 0}</span>
                          </th>
                          <th className="py-2.5 pr-3 pl-2 w-14 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-[11px]">
                        {variants.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center">
                              <div className="flex flex-col items-center justify-center space-y-1.5 text-stone-400">
                                <span className="text-2xl">✨</span>
                                <p className="font-semibold text-xs text-stone-700">No variants generated yet</p>
                                <button
                                  type="button"
                                  onClick={handleRegenerateVariants}
                                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] rounded-lg hover:bg-[#765b3d] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                                >
                                  <HiOutlineRefresh className="w-4 h-4" />
                                  Compute Variants
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          variants.map((v, variantIndex) => {
                            const detailsList = [
                              v.diamondType || v.diamondDetails?.type || diamondMasters.types.find((item) => String(item._id) === String(v.diamondTypeId?._id || v.diamondTypeId))?.name,
                              v.diamondColor || v.diamondDetails?.color || diamondMasters.colors.find((item) => String(item._id) === String(v.diamondColorId?._id || v.diamondColorId))?.name,
                              v.diamondClarity || v.diamondDetails?.clarity || diamondMasters.clarities.find((item) => String(item._id) === String(v.diamondClarityId?._id || v.diamondClarityId))?.name,
                              v.purity,
                              (v.caratWeight || v.centerDiamondWeight || v.sideDiamondWeight) ? `${v.caratWeight || v.centerDiamondWeight || v.sideDiamondWeight}ct` : '',
                            ].filter(Boolean);

                            const breakdownText = `Metal: ₹${(v.metalCost || 0).toLocaleString('en-IN')} (${v.weight || v.metalWeight}g @ ₹${v.metalRate || 0}/g)\nDiamonds: ₹${(v.diamondCost || 0).toLocaleString('en-IN')}\nLabour: ₹${(v.labourCharge || 0).toLocaleString('en-IN')}\nGST (${gstPercentage}%): ₹${(v.computedGst || 0).toLocaleString('en-IN')}${v.otherAmount ? `\nOther Amount: ₹${v.otherAmount}` : ''}`;

                            return (
                              <tr key={v.id} className="hover:bg-stone-50/70 transition-colors">
                                <td className="py-2.5 px-3 text-center font-medium text-stone-500">{variantIndex + 1}</td>
                                {/* Combinations Badges */}
                                <td className="py-2.5 pl-3 pr-2">
                                  <div className="flex flex-wrap gap-1">
                                    {detailsList.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex px-2 py-0.5 text-[9.5px] font-semibold text-stone-700 bg-[#faf5ee] border border-[#e8d8c0] rounded-md shadow-2xs"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {v.color && (
                                      <span className="inline-flex px-1.5 py-0.5 text-[9.5px] font-medium text-stone-500 bg-stone-50 border border-stone-200 rounded-md">
                                        {v.color}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* SKU */}
                                <td className="py-2.5 px-2.5">
                                  <input
                                    type="text"
                                    readOnly={automaticPricing}
                                    value={v.sku}
                                    onChange={(e) => handleVariantChange(v.id, 'sku', e.target.value)}
                                    className="w-full px-2 py-1 text-[11px] font-mono text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                                  />
                                </td>

                                {/* Final Weight */}
                                <td className="py-2.5 px-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.001"
                                    readOnly={automaticPricing}
                                    value={v.weight}
                                    onChange={(e) => handleVariantChange(v.id, 'weight', e.target.value)}
                                    className="w-20 px-1.5 py-1 text-center font-mono text-[11px] font-semibold text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                                  />
                                </td>

                                {/* Labour Charge */}
                                <td className="py-2.5 px-2.5 text-center">
                                  <input
                                    type="number"
                                    readOnly={automaticPricing}
                                    value={v.labourCharge}
                                    onChange={(e) => handleVariantChange(v.id, 'labourCharge', e.target.value)}
                                    className="w-20 px-1.5 py-1 text-center font-mono text-[11px] font-semibold text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                                  />
                                </td>

                                {/* Final Price */}
                                <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs text-stone-900" title={breakdownText}>
                                  <span>₹{Number(v.priceRaw || v.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </td>

                                {/* Other Amount */}
                                <td className="py-2.5 px-2.5 text-right">
                                  <input
                                    type="number"
                                    readOnly={automaticPricing}
                                    value={automaticPricing ? (Number(v.priceRaw || v.price || 0) * (1 + Number(specs.otherAmountPercentage || 0) / 100)).toFixed(2) : v.otherAmount}
                                    onChange={(e) => handleVariantChange(v.id, 'otherAmount', e.target.value)}
                                    className="w-24 px-2 py-1 text-right font-mono text-[11px] text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                                  />
                                </td>

                                {/* Actions */}
                                <td className="py-2.5 pr-3 pl-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setVariants((prev) => prev.filter((item) => item.id !== v.id))}
                                    className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete variant"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 4: VARIANT CONFIGURATION (COLORS & SWATCHES) FOR SILVER
          ════════════════════════════════════════════════════ */}
          {activeStep === 4 && isSilverProduct && (
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
                    onClick={handleToggleAllSilverExpand}
                    className="px-2.5 py-1 text-xs font-semibold text-[#8b6f4e] hover:text-[#785e40] bg-[#faf5ee] hover:bg-[#f6eee2] border border-[#d9c4a8]/50 rounded-full transition-colors cursor-pointer shadow-2xs"
                  >
                    {expandedSilverColors.length >= silverColorOptions.length + 1 ? 'Collapse all media' : 'Expand all media'}
                  </button>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/50 shadow-2xs">
                    {silverColorOptions.length} colors available
                  </span>
                </div>
              </div>



              {/* 2-Column Grid of Variant Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {silverColorOptions.map((col) => {
                  const isSelected = isSilverColorSelected(col.name);
                  const isExpanded = expandedSilverColors.includes(col.name);
                  const vData = silverVariantMedia[col.name] || { swatchIcon: '', media: [] };
                  const mediaCount = vData.media?.length || 0;
                  const isUploadingSwatch = uploadingSilverSwatchColor === col.name;
                  const isUploadingMedia = uploadingSilverVariantColor === col.name;

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
                          onClick={() => handleToggleSilverColor(col.name)}
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

                        <ColorStatusToggle name={col.name} disabled={!isSelected} status={silverVariantMedia[col.name]?.status} onChange={(status) => setSilverVariantMedia((previous) => ({ ...previous, [col.name]: { ...previous[col.name], status } }))} />
                      {/* Right side: Manage media button with chevron */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSilverExpand(col.name);
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
                                id={`silver-swatch-upload-${col.name}`}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => handleSilverSwatchUpload(col.name, e)}
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
                                        document.getElementById(`silver-swatch-upload-${col.name}`)?.click()
                                      }
                                      className="p-1.5 text-stone-500 hover:text-[#8b6f4e] rounded-lg hover:bg-stone-50 cursor-pointer"
                                      title="Change icon"
                                    >
                                      <HiOutlineRefresh className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSilverSwatchIcon(col.name)}
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
                                    document.getElementById(`silver-swatch-upload-${col.name}`)?.click()
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
                                id={`silver-media-upload-${col.name}`}
                                type="file"
                                accept="image/*,video/mp4"
                                multiple
                                className="hidden"
                                onChange={(e) => handleSilverVariantMediaUpload(col.name, e)}
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
                                            handleRemoveSilverVariantMedia(col.name, m.id);
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
                                        document.getElementById(`silver-media-upload-${col.name}`)?.click()
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
                                        document.getElementById(`silver-media-upload-${col.name}`)?.click()
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
                                    document.getElementById(`silver-media-upload-${col.name}`)?.click()
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
                  const isSelected = isSilverColorSelected(colName);
                  const isExpanded = expandedSilverColors.includes(colName);
                  const vData = silverVariantMedia[colName] || { swatchIcon: '', media: [] };
                  const mediaCount = vData.media?.length || 0;
                  const isUploadingSwatch = uploadingSilverSwatchColor === colName;
                  const isUploadingMedia = uploadingSilverVariantColor === colName;

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
                          onClick={() => handleToggleSilverColor(colName)}
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

                        <ColorStatusToggle name={colName} disabled={!isSelected} status={silverVariantMedia[colName]?.status} onChange={(status) => setSilverVariantMedia((previous) => ({ ...previous, [colName]: { ...previous[colName], status } }))} />
                      {/* Right side: Manage media button with chevron */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSilverExpand(colName);
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
                              </div>

                              <input
                                id={`silver-swatch-upload-${colName}`}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => handleSilverSwatchUpload(colName, e)}
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
                                        document.getElementById(`silver-swatch-upload-${colName}`)?.click()
                                      }
                                      className="p-1.5 text-stone-500 hover:text-[#8b6f4e] rounded-lg hover:bg-stone-50 cursor-pointer"
                                      title="Change icon"
                                    >
                                      <HiOutlineRefresh className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSilverSwatchIcon(colName)}
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
                                    document.getElementById(`silver-swatch-upload-${colName}`)?.click()
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
                              </div>

                              <input
                                id={`silver-media-upload-${colName}`}
                                type="file"
                                accept="image/*,video/mp4"
                                multiple
                                className="hidden"
                                onChange={(e) => handleSilverVariantMediaUpload(colName, e)}
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
                                            handleRemoveSilverVariantMedia(colName, m.id);
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
                                        document.getElementById(`silver-media-upload-${colName}`)?.click()
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
                                        document.getElementById(`silver-media-upload-${colName}`)?.click()
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
                                    document.getElementById(`silver-media-upload-${colName}`)?.click()
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

          {/* ═══════════════════════════════════════════════════
              STEP 4: PRODUCT MEDIA (Fine Jewelry)
          ════════════════════════════════════════════════════ */}
          {activeStep === 4 && !isSilverProduct && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-6 animate-fadeIn">
              {/* Header Matching Screenshot */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center shadow-2xs shrink-0">
                    <HiOutlinePhotograph className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                      Product Media & Virtual Try-On (VTO)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Upload images, videos, and configure VTO for each metal color. You can use the existing VTO master for try-on configuration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Two-Column Layout (Matching Screenshot) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ─── Left Column: Select Metal Color ─────────── */}
                <div className="lg:col-span-4 xl:col-span-4 space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 tracking-wide">
                    {isSilverProduct ? 'Product Media' : 'Select Metal Color'}
                  </h4>

                  {isSilverProduct ? (
                    <p className="text-xs leading-relaxed text-stone-500">
                      Upload images and videos for this silver product.
                    </p>
                  ) : (
                    <>
                  <div className="space-y-2">
                    {productColors.map((colorName) => {
                      const colorObj = colorsList.find((c) => c.name.toLowerCase() === colorName.toLowerCase()) || { name: colorName };
                      const sphere = getSphereStyle(colorName, colorObj.code);
                      const isActive = activeMediaColor === colorName;
                      const imgCount = (mediaImages[colorName] || []).length;
                      const vidCount = (mediaVideos[colorName] || []).length;
                      const totalMedia = imgCount + vidCount;
                      const isVtoConfigured = Boolean(vtoConfigs[colorName]?.isConfigured);

                      return (
                        <div
                          key={colorName}
                          onClick={() => setActiveMediaColor(colorName)}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#faf6f0] border-2 border-[#8b6f4e] shadow-xs'
                              : 'bg-white border border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full shrink-0 shadow-sm"
                              style={{
                                background: sphere.gradient,
                                boxShadow: sphere.shadow,
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {colorName}
                              </p>
                              <p className="text-[11px] text-stone-500 font-medium truncate">
                                {totalMedia} media &bull; {isVtoConfigured ? 'VTO Configured' : 'Configure VTO'}
                              </p>
                            </div>
                          </div>

                          {isActive && (
                            <div className="w-5 h-5 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Metal Color Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddColorModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 hover:border-[#8b6f4e] bg-stone-50/50 hover:bg-[#faf7f2]/40 text-stone-700 hover:text-[#8b6f4e] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    <span>Add Metal Color</span>
                  </button>
                    </>
                  )}
                </div>

                {/* ─── Right Column: Active Metal Color Media Showcase ── */}
                <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-5">
                  {/* Active Color Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      {!isSilverProduct && (
                        <div
                          className="w-9 h-9 rounded-full shrink-0 shadow-sm"
                          style={{
                            background: getSphereStyle(activeMediaColor).gradient,
                            boxShadow: getSphereStyle(activeMediaColor).shadow,
                          }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900">
                            {isSilverProduct ? 'Silver Product' : activeMediaColor}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${!isSilverProduct && colorStatuses[activeMediaColor] === 'inactive' ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-[#e8f7ee] text-[#1b7a43] border-[#c4ebd1]/80'}`}>
                            {isSilverProduct ? 'Media' : colorStatuses[activeMediaColor] === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isSilverProduct && (
                      <div className="flex items-center gap-3">
                        <ColorStatusToggle
                          name={activeMediaColor}
                          status={colorStatuses[activeMediaColor]}
                          disabled={!activeMediaColor}
                          onChange={(status) => setColorStatuses((previous) => ({ ...previous, [activeMediaColor]: status }))}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sub-Tabs: Product Media (Images + Videos), VTO Configuration */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-0.5 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setActiveMediaSubTab('media')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          activeMediaSubTab === 'media' || activeMediaSubTab === 'images'
                            ? 'bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70 shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        <HiOutlinePhotograph className="w-4 h-4" />
                        <span>Product Media ({(mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMediaSubTab('vto')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          activeMediaSubTab === 'vto'
                            ? 'bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70 shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        <HiOutlineCube className="w-4 h-4" />
                        <span>VTO Configuration ({vtoConfigs[activeMediaColor]?.isConfigured ? 1 : 0})</span>
                      </button>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      {!isSilverProduct && ((mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompressionTab('all');
                            const allIds = [
                              ...(mediaImages[activeMediaColor] || []).map((img) => img.id),
                              ...(mediaVideos[activeMediaColor] || []).map((vid) => vid.id),
                            ];
                            setSelectedCompressionIds(allIds);
                            setCompressionPreviews({});
                            setShowCompressionHub(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d9c4a8] bg-[#faf5ee] hover:bg-[#f2e6d5] px-3.5 py-1.5 text-xs font-bold text-[#785e40] shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
                          title="Open Media Compression & Optimizer"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <HiOutlinePhotograph className="w-4 h-4 text-[#8b6f4e]" />
                          <span>Media Compression</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Unified Product Media Content (Images & Videos Mixed) */}
                  {(activeMediaSubTab === 'media' || activeMediaSubTab === 'images') && (
                    <div className="relative">
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {/* Upload Media Button Card */}
                        <label
                          htmlFor="metal-color-upload-input"
                          className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] bg-[#fdfcfb] hover:bg-[#faf7f2]/30 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group shadow-2xs"
                        >
                          <input
                            id="metal-color-upload-input"
                            type="file"
                            multiple
                            accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
                            onChange={(e) => handleMixedMediaUpload(e, activeMediaColor)}
                            className="hidden"
                          />
                          <div className="w-8 h-8 rounded-full border border-stone-300 group-hover:border-[#8b6f4e] group-hover:bg-[#faf5ee] text-stone-400 group-hover:text-[#8b6f4e] flex items-center justify-center transition-all mb-1.5">
                            <HiOutlinePlus className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-stone-800 group-hover:text-[#8b6f4e]">
                            Upload Media
                          </span>
                          <span className="text-[9.5px] text-emerald-600 font-medium mt-0.5">
                            Local preview &amp; compress
                          </span>
                        </label>

                        {/* Uploaded Image Cards */}
                        {(mediaImages[activeMediaColor] || []).map((img, i) => {
                          const gallery = (mediaImages[activeMediaColor] || []).map((m) => m.url);
                          return (
                            <div
                              key={img.id || i}
                              onClick={() => handleOpenImagePreview(img.url, gallery)}
                              className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-50 shadow-2xs group cursor-pointer transition-all hover:shadow-md hover:border-[#8b6f4e]"
                              title="Click to zoom in / inspect"
                            >
                              <img
                                src={getMediaUrl(img.url) || img.url}
                                alt={`${activeMediaColor} ${i + 1}`}
                                onError={(e) => {
                                  const key = img.key || getUploadedObjectKey(img.url);
                                  if (key && !e.target.dataset.fallback) {
                                    e.target.dataset.fallback = 'true';
                                    const backendBase = (api.defaults?.baseURL || 'http://localhost:5001/api');
                                    e.target.src = `${backendBase}/upload/file?key=${encodeURIComponent(key)}`;
                                  }
                                }}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />

                              {/* Hover Zoom Hint Overlay */}
                              <div className="absolute inset-0 bg-stone-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="p-2 rounded-full bg-white/90 text-stone-800 shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                  </svg>
                                </span>
                              </div>

                              {/* Top Left Badge or Set Primary */}
                              {img.isPrimary ? (
                                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8b6f4e] text-white shadow-xs">
                                  Primary
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPrimaryMedia(activeMediaColor, img.id);
                                  }}
                                  className="absolute top-2 left-2 z-10 p-1 rounded-md bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                  title="Set as Primary"
                                >
                                  <HiOutlineStar className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Top Right Close / Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMedia(activeMediaColor, img.id);
                                }}
                                className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                title="Remove image"
                              >
                                <HiOutlineX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Uploaded Video Cards */}
                        {(mediaVideos[activeMediaColor] || []).map((vid, i) => (
                          <div
                            key={vid.id || `video-${i}`}
                            onClick={() => setViewingCompressionMedia({ ...vid, mediaType: 'video' })}
                            className="relative w-36 h-32 sm:w-44 sm:h-36 shrink-0 rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-900 shadow-2xs group flex flex-col justify-end p-2.5 text-white cursor-pointer hover:shadow-md hover:border-[#8b6f4e] transition-all"
                            title="Click to view & play video"
                          >
                            <video src={getMediaUrl(vid.url) || vid.url} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity" />

                            {/* Video Badge */}
                            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-black/75 text-amber-300 backdrop-blur-xs shadow-xs">
                              <HiOutlineVideoCamera className="w-3 h-3" />
                              Video
                            </span>

                            {/* Center Play Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                <svg className="w-4 h-4 fill-white translate-x-0.5" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>

                            <div className="relative z-10">
                              <p className="text-xs font-bold truncate drop-shadow-sm">{vid.title || vid.name || 'Product Video'}</p>
                              <p className="text-[10px] text-stone-300 drop-shadow-sm font-mono">{vid.size || 'Video asset'}</p>
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVideo(activeMediaColor, vid.id);
                              }}
                              className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              title="Remove video"
                            >
                              <HiOutlineX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Next arrow hint if multiple items */}
                        {((mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length) > 2 && (
                          <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 shadow-2xs flex items-center justify-center text-stone-500 shrink-0">
                            <HiOutlineChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VTO setup is available only from its dedicated tab. */}
                  {activeMediaSubTab === 'vto' && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <span>Virtual Try-On (VTO)</span>
                        <HiOutlineInformationCircle className="w-3.5 h-3.5 text-stone-400" />
                      </h4>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#faf8f5] border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-white border border-stone-200/90 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
                          {vtoConfigs[activeMediaColor]?.overlayUrl ? (
                            <img
                              src={vtoConfigs[activeMediaColor].overlayUrl}
                              alt="VTO Asset"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <HiOutlineCube className="w-6 h-6 text-[#8b6f4e]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900 font-mono">
                            {vtoConfigs[activeMediaColor]?.overlayName || `${activeMediaColor} Virtual Try-On Asset`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-stone-500">
                              {vtoConfigs[activeMediaColor]?.isConfigured
                                ? `${vtoConfigs[activeMediaColor]?.overlaySize || 'Calibrated'} • ${vtoConfigs[activeMediaColor]?.uploadedAt || 'Ready'}`
                                : 'No calibration saved'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                vtoConfigs[activeMediaColor]?.isConfigured
                                  ? 'bg-[#e8f7ee] text-[#1b7a43] border border-[#c4ebd1]/80'
                                  : 'bg-stone-100 text-stone-500 border border-stone-200'
                              }`}
                            >
                              {vtoConfigs[activeMediaColor]?.isConfigured ? 'Configured' : 'Not Configured'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenVtoStudio(activeMediaColor)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-stone-800 bg-white border border-stone-200/90 rounded-xl hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
                      >
                        <HiOutlineAdjustments className="w-4 h-4 text-[#8b6f4e]" />
                        <span>Configure VTO</span>
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {showCompressionHub && !isSilverProduct && createPortal(
                <div
                  className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-2 sm:p-4 md:p-6 backdrop-blur-sm cursor-pointer"
                  onClick={handleCloseCompressionHub}
                >
                  <div
                    className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-2xl cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#a58054] text-white">
                          <HiOutlinePhotograph className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">Media Compression</h3>
                          <p className="text-[11px] sm:text-xs text-slate-500">Optimize photos and media before publishing.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseCompressionHub}
                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                        aria-label="Close compression hub"
                      >
                        <HiOutlineX className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>

                    {/* Modal Tabs: All Media (Mixed), Images, Videos */}
                    <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-50">
                      {[
                        { id: 'all', label: 'All Media', count: (mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length, Icon: HiOutlinePhotograph },
                        { id: 'images', label: 'Images', count: (mediaImages[activeMediaColor] || []).length, Icon: HiOutlinePhotograph },
                        { id: 'videos', label: 'Videos', count: (mediaVideos[activeMediaColor] || []).length, Icon: HiOutlineVideoCamera },
                      ].map(({ id, label, count, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCompressionTab(id)}
                          className={`flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 px-2 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            compressionTab === id
                              ? 'border-[#a58054] bg-white text-[#8b6f4e]'
                              : 'border-transparent text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="truncate">{label} ({count})</span>
                        </button>
                      ))}
                    </div>

                    {/* Modal Scrollable Body */}
                    <div className="space-y-4 overflow-y-auto bg-[#fffdfb] p-3 sm:p-5 md:p-6">
                      {(() => {
                        const allMediaItems = [
                          ...(mediaImages[activeMediaColor] || []).map((img) => ({ ...img, mediaType: 'image' })),
                          ...(mediaVideos[activeMediaColor] || []).map((vid) => ({ ...vid, mediaType: 'video' })),
                        ];
                        const displayedMedia = compressionTab === 'images'
                          ? allMediaItems.filter((m) => m.mediaType === 'image')
                          : compressionTab === 'videos'
                          ? allMediaItems.filter((m) => m.mediaType === 'video')
                          : allMediaItems;

                        const selectedItems = displayedMedia.filter((item) => selectedCompressionIds.includes(item.id));
                        const original = selectedItems.reduce((sum, item) => {
                          const preview = item.mediaType === 'image' ? compressionPreviews[item.id] : null;
                          return sum + (preview?.originalSize || item.fileSize || 0);
                        }, 0);
                        const compressed = selectedItems.reduce((sum, item) => {
                          const preview = item.mediaType === 'image' ? compressionPreviews[item.id] : null;
                          return sum + (preview?.compressedSize || (item.mediaType === 'video' ? item.fileSize : 0));
                        }, 0);
                        const savings = original && compressed && original > compressed
                          ? Math.max(0, Math.round((1 - compressed / original) * 100))
                          : 0;

                        return (
                          <>
                            {/* Compact Grid of Small Boxes (Mix Images & Videos) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                              {displayedMedia.map((item, index) => {
                                const isImage = item.mediaType === 'image';
                                const isSelected = selectedCompressionIds.includes(item.id);
                                const preview = isImage ? compressionPreviews[item.id] : null;
                                const originalSize = preview?.originalSize || item.fileSize || 0;

                                return (
                                  <div
                                    key={item.id || index}
                                    onClick={() => setViewingCompressionMedia(item)}
                                    className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all cursor-pointer hover:shadow-md ${
                                      isSelected
                                        ? 'border-[#a58054] ring-2 ring-[#a58054]/25 shadow-xs'
                                        : 'border-stone-200 hover:border-stone-300'
                                    }`}
                                  >
                                    {/* Thumbnail Media Box */}
                                    <div className={`relative aspect-square w-full overflow-hidden flex items-center justify-center ${isImage ? 'bg-[#faf8f5] p-2' : 'bg-slate-900'}`}>
                                      {isImage ? (
                                        <img
                                          src={item.url}
                                          alt={item.name || `Product media ${index + 1}`}
                                          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                                        />
                                      ) : (
                                        <>
                                          <video src={item.url} className="h-full w-full object-cover opacity-75" muted playsInline preload="metadata" />
                                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                            <div className="w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md">
                                              <HiOutlineVideoCamera className="w-3.5 h-3.5 text-[#8b6f4e]" />
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {/* Selection Checkbox */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCompressionIds((ids) =>
                                            ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]
                                          );
                                        }}
                                        className={`absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md border text-xs shadow-xs transition-all cursor-pointer ${
                                          isSelected
                                            ? 'border-[#a58054] bg-[#a58054] text-white'
                                            : 'border-stone-300 bg-white/95 hover:bg-white text-transparent'
                                        }`}
                                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.name || 'media'}`}
                                      >
                                        <HiOutlineCheck className="h-3.5 w-3.5 stroke-[3]" />
                                      </button>

                                      {/* Status / Type Badge */}
                                      <span
                                        className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-2xs ${
                                          !isImage
                                            ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                                            : preview
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                            : previewingCompression && isSelected
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                            : 'bg-stone-100 text-stone-600 border border-stone-200/80'
                                        }`}
                                      >
                                        {!isImage ? 'Video' : preview ? 'Ready' : previewingCompression && isSelected ? 'Prep…' : 'Ready'}
                                      </span>

                                      {/* Hover View Hint */}
                                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 text-stone-800 text-[10px] font-semibold shadow-md transform scale-95 group-hover:scale-100 transition-transform">
                                          <HiOutlineEye className="w-3.5 h-3.5 text-[#8b6f4e]" />
                                          View
                                        </span>
                                      </div>
                                    </div>

                                    {/* Compact Meta Bar */}
                                    <div className="p-2 bg-white flex flex-col gap-0.5 border-t border-stone-100">
                                      <p className="truncate text-[10.5px] font-semibold text-stone-800" title={item.name || item.title || `Media ${index + 1}`}>
                                        {item.name || item.title || `Media ${index + 1}`}
                                      </p>
                                      <div className="flex items-center justify-between text-[9.5px]">
                                        <span className="text-stone-400 font-mono">
                                          {originalSize ? formatMediaSize(originalSize) : item.size || '—'}
                                        </span>
                                        {preview?.compressedSize && (
                                          <span className="font-bold text-emerald-600 font-mono">
                                            {formatMediaSize(preview.compressedSize)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {!displayedMedia.length && (
                                <p className="col-span-full py-8 text-center text-xs text-stone-400">
                                  No media files found for this metal color.
                                </p>
                              )}
                            </div>

                            {/* Summary Statistics Bar */}
                            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 sm:grid-cols-4">
                              <div>
                                <span className="block text-[10px] text-slate-500 font-medium">Media selected</span>
                                <strong className="text-xs sm:text-sm text-slate-900 font-bold">{selectedItems.length} items</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-500 font-medium">Original size</span>
                                <strong className="text-xs sm:text-sm text-slate-900 font-bold">{original ? formatMediaSize(original) : '—'}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-500 font-medium">Estimated size</span>
                                <strong className="text-xs sm:text-sm text-green-700 font-bold">{compressed ? formatMediaSize(compressed) : '—'}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-500 font-medium">Estimated savings</span>
                                <strong className="text-xs sm:text-sm text-green-700 font-bold">{savings ? `~${savings}%` : 'Optimal'}</strong>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* Compression Settings Section */}
                      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Compression settings</h4>
                            <p className="text-[10px] text-slate-500">Adjust quality and format for the optimal balance between file size and visual fidelity.</p>
                          </div>
                          {(compressionTab === 'images' || compressionTab === 'all') && (
                            <label className="flex items-center gap-2 text-[10px] text-slate-600">
                              Format
                              <select
                                value={compressionFormat}
                                onChange={(event) => setCompressionFormat(event.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-800"
                              >
                                <option value="image/webp">WebP (Recommended)</option>
                                <option value="image/jpeg">JPEG</option>
                              </select>
                            </label>
                          )}
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <div className="mb-3 flex justify-between text-xs">
                              <span className="font-semibold text-slate-800">
                                Target quality: <b className="text-[#8b6f4e]">{Math.round(compressionQuality * 100)}%</b>
                              </span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              step="5"
                              value={Math.round(compressionQuality * 100)}
                              onChange={(event) => setCompressionQuality(Number(event.target.value) / 100)}
                              className="w-full accent-[#a58054] cursor-pointer"
                            />
                            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                              <span>10% (Smaller files)</span>
                              <span>50%</span>
                              <span>100% (Best quality)</span>
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[10px] font-semibold text-slate-700">Preset</p>
                            <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-stone-200">
                              {[
                                { label: 'Smaller files', quality: 0.5, detail: '~50% size' },
                                { label: 'Balanced', quality: 0.75, detail: '~70% quality' },
                                { label: 'Best quality', quality: 0.9, detail: '~90% quality' },
                              ].map((preset) => (
                                <button
                                  type="button"
                                  key={preset.label}
                                  onClick={() => setCompressionQuality(preset.quality)}
                                  className={`px-2 py-2 text-[10px] transition-colors cursor-pointer ${
                                    Math.round(compressionQuality * 100) === Math.round(preset.quality * 100)
                                      ? 'bg-[#f5eadc] font-bold text-[#704f2d]'
                                      : 'bg-white text-slate-700 hover:bg-stone-50'
                                  }`}
                                >
                                  {preset.label}
                                  <span className="block text-[9px] text-slate-400">{preset.detail}</span>
                                </button>
                              ))}
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500">
                              <HiOutlineInformationCircle className="mr-1 inline h-3.5 w-3.5" />
                              Higher quality preserves fine jewelry sparkle while optimizing mobile download speed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-stone-100 bg-stone-50 px-4 py-3 sm:px-6 sm:py-4">
                      <button
                        type="button"
                        onClick={handleCloseCompressionHub}
                        className="w-full sm:w-auto rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-stone-50 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyMediaCompression}
                        disabled={compressingMedia || !selectedCompressionIds.length}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#a58054] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#8b6f4e] disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
                      >
                        {compressingMedia ? <HiOutlineRefresh className="h-4 w-4 animate-spin" /> : <HiOutlineCheck className="h-4 w-4" />}
                        {compressingMedia ? 'Compressing media…' : 'Compress & apply'}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* ─── Staged Media Upload & Compression Modal ───────────── */}
              {showUploadModal && createPortal(
                <div
                  className="fixed inset-0 z-[75] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-2 sm:p-4 md:p-6 backdrop-blur-sm cursor-pointer"
                  onClick={handleCloseUploadModal}
                >
                  <div
                    className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-2xl cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 bg-[#fdfcfb]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#b38e63] to-[#8b6f4e] text-white shadow-xs">
                          <IoSparklesOutline className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                              Optimize &amp; Upload Media
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f6eee2] text-[#8b6f4e] border border-[#dfcfbd]">
                              {stagedUploadColor || 'General'}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500">
                            Images follow the global compression policy from System Settings.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCloseUploadModal}
                        disabled={isProcessingUpload}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer disabled:opacity-40"
                        aria-label="Close upload modal"
                      >
                        <HiOutlineX className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Progress Bar during processing */}
                    {isProcessingUpload && (
                      <div className="bg-[#faf5ee] border-b border-[#ebdccb] px-4 py-2.5 sm:px-6">
                        <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8b6f4e] animate-ping" />
                            {uploadProcessingStep || 'Processing upload...'}
                          </span>
                          <span className="text-[#8b6f4e] font-bold">{uploadProcessingPercent}%</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#b38e63] to-[#8b6f4e] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProcessingPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto max-h-[calc(92vh-190px)] p-4 sm:p-6 space-y-6">
                      {/* Staged Files Preview Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                            Files Loaded in Memory ({stagedUploadFiles.length})
                          </h4>
                          <span className="text-xs font-semibold text-stone-500">
                            Raw Total: {formatMediaSize(totalStagedBytes)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {stagedUploadFiles.map((item) => (
                            <div
                              key={item.id}
                              className="relative rounded-xl border border-stone-200 bg-stone-50 overflow-hidden group shadow-2xs flex flex-col"
                            >
                              {/* Media Preview */}
                              <div className="h-28 w-full bg-stone-100 flex items-center justify-center overflow-hidden relative">
                                {item.isVideo ? (
                                  <video
                                    src={item.previewUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <img
                                    src={item.previewUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}

                                {/* Media Type Tag */}
                                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-xs">
                                  {item.isVideo ? 'Video' : 'Image'}
                                </span>

                                {/* Status Indicator */}
                                {item.status === 'compressing' && (
                                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-semibold animate-pulse">
                                    Compressing...
                                  </span>
                                )}
                                {item.status === 'uploading' && (
                                  <span className="absolute inset-0 bg-blue-900/50 flex items-center justify-center text-white text-[10px] font-semibold animate-pulse">
                                    Uploading R2...
                                  </span>
                                )}
                                {item.status === 'done' && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                                    <HiOutlineCheck className="w-3 h-3" /> Done
                                  </span>
                                )}

                                {!isProcessingUpload && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStagedFile(item.id)}
                                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-red-600 text-white opacity-80 hover:opacity-100 transition shadow-xs cursor-pointer"
                                    title="Remove from upload batch"
                                  >
                                    <HiOutlineX className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* File Meta */}
                              <div className="p-2 bg-white flex flex-col justify-between flex-1 border-t border-stone-100">
                                <p className="text-[11px] font-medium text-stone-800 truncate" title={item.name}>
                                  {item.name}
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                                  <span>{item.formattedSize}</span>
                                  <span className="text-[9.5px] uppercase text-stone-400 font-mono">
                                    {item.file.name.split('.').pop()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Global Image Compression Policy */}
                      <div className="border border-[#ecd9c6] bg-[#fbf9f6] rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">Automatic image compression</h4>
                            <p className="mt-1 text-[11px] text-stone-600">
                              {imageUploadPolicy.enabled
                                ? `${imageUploadPolicy.format === 'image/webp' ? 'WebP' : 'JPEG'} at ${imageUploadPolicy.quality}% quality · maximum ${imageUploadPolicy.maxDimension}px`
                                : 'Disabled in System Settings; images will upload at their original size.'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                            Set globally in Settings
                          </span>
                        </div>

                        {stagedUploadFiles.some((f) => f.isVideo) && (
                          <div className="flex items-center justify-between border-t border-[#ebdccb] pt-3">
                            <div>
                              <p className="text-xs font-bold text-stone-800">Encode videos to WebM VP9</p>
                              <p className="text-[10.5px] text-stone-500">Compress videos in the browser before upload.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={uploadCompressVideos}
                                onChange={(e) => setUploadCompressVideos(e.target.checked)}
                                disabled={isProcessingUpload}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b6f4e]" />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Upload behavior */}
                      <p className="text-[11px] text-stone-500 text-center italic">
                        💡 Images use the saved global quality and dimension limit automatically. The original image is kept only when optimization would make it larger.
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-t border-stone-200 bg-stone-50">
                      <button
                        type="button"
                        disabled={isProcessingUpload}
                        onClick={handleCloseUploadModal}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition cursor-pointer disabled:opacity-40"
                      >
                        Cancel &amp; Discard
                      </button>

                      <div className="w-full sm:w-auto flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessingUpload || stagedUploadFiles.length === 0}
                          onClick={handleConfirmStagedUpload}
                          className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#b38e63] to-[#8b6f4e] hover:from-[#a07c52] hover:to-[#7a6042] rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                          <IoSparklesOutline className="w-4 h-4" />
                          <span>
                            {isProcessingUpload
                              ? 'Optimizing & Uploading...'
                              : `Upload to Cloudflare (${stagedUploadFiles.length})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* ─── Compression Media Detail Popup Modal ─────────────── */}
              {viewingCompressionMedia && createPortal(
                <div
                  className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn"
                  onClick={() => setViewingCompressionMedia(null)}
                >
                  <div
                    className="relative flex flex-col max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    {(() => {
                      const isVideo = viewingCompressionMedia.mediaType === 'video' || viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i);

                      return (
                        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5 sm:px-6">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center shrink-0">
                              {isVideo ? <HiOutlineVideoCamera className="w-4 h-4" /> : <HiOutlinePhotograph className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-stone-900 truncate">
                                {viewingCompressionMedia.name || viewingCompressionMedia.title || (isVideo ? 'Product Video' : 'Product Image')}
                              </h4>
                              <p className="text-[10px] text-stone-400">
                                {isVideo ? 'High-definition video inspection' : 'Compression details and high-resolution inspection'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewingCompressionMedia(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition cursor-pointer"
                            aria-label="Close"
                          >
                            <HiOutlineX className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })()}

                    {/* Main Image / Video View Area */}
                    <div className="relative flex-1 bg-[#fdfcfb] p-4 flex flex-col items-center justify-center min-h-[260px] max-h-[52vh] overflow-hidden">
                      {(() => {
                        const isVideo = viewingCompressionMedia.mediaType === 'video' || viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i);

                        return isVideo ? (
                          <video
                            src={viewingCompressionMedia.url}
                            controls
                            autoPlay
                            muted
                            className="max-h-[48vh] w-auto max-w-full rounded-xl shadow-xs"
                          />
                        ) : (
                          <img
                            src={viewingCompressionMedia.url}
                            alt={viewingCompressionMedia.name || 'Preview'}
                            className="max-h-[48vh] w-auto max-w-full object-contain rounded-xl shadow-xs"
                          />
                        );
                      })()}

                      {/* Previous / Next Arrows to flip between media items */}
                      {(() => {
                        const allMediaItems = [
                          ...(mediaImages[activeMediaColor] || []).map((img) => ({ ...img, mediaType: 'image' })),
                          ...(mediaVideos[activeMediaColor] || []).map((vid) => ({ ...vid, mediaType: 'video' })),
                        ];
                        const list = compressionTab === 'images'
                          ? allMediaItems.filter((m) => m.mediaType === 'image')
                          : compressionTab === 'videos'
                          ? allMediaItems.filter((m) => m.mediaType === 'video')
                          : allMediaItems;

                        const currentIndex = list.findIndex((item) => item.id === viewingCompressionMedia.id);
                        const hasPrev = currentIndex > 0;
                        const hasNext = currentIndex >= 0 && currentIndex < list.length - 1;

                        return (
                          <>
                            {hasPrev && (
                              <button
                                type="button"
                                onClick={() => setViewingCompressionMedia(list[currentIndex - 1])}
                                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md border border-stone-200 hover:bg-white transition cursor-pointer"
                                title="Previous"
                              >
                                <HiOutlineChevronLeft className="w-4 h-4" />
                              </button>
                            )}
                            {hasNext && (
                              <button
                                type="button"
                                onClick={() => setViewingCompressionMedia(list[currentIndex + 1])}
                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md border border-stone-200 hover:bg-white transition cursor-pointer"
                                title="Next"
                              >
                                <HiOutlineChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Stats Breakdown and Actions */}
                    {(() => {
                      const preview = compressionPreviews[viewingCompressionMedia.id];
                      const origSize = preview?.originalSize || viewingCompressionMedia.fileSize || 0;
                      const compSize = preview?.compressedSize || 0;
                      const savings = origSize && compSize ? Math.max(0, Math.round((1 - compSize / origSize) * 100)) : 0;
                      const isSelected = selectedCompressionIds.includes(viewingCompressionMedia.id);
                      const isVideo = viewingCompressionMedia.mediaType === 'video' || viewingCompressionMedia.url?.match(/\.(mp4|webm|mov|m4v)/i);

                      return (
                        <div className="border-t border-stone-100 bg-white p-4 sm:p-5 space-y-3">
                          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-stone-50 p-3 border border-stone-100 text-center">
                            <div>
                              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Original Size</span>
                              <strong className="text-xs sm:text-sm font-bold text-stone-800">
                                {origSize ? formatMediaSize(origSize) : viewingCompressionMedia.size || '—'}
                              </strong>
                            </div>
                            <div className="border-x border-stone-200 px-2">
                              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Compressed</span>
                              <strong className="text-xs sm:text-sm font-bold text-emerald-600">
                                {compSize ? formatMediaSize(compSize) : isVideo ? 'Direct asset' : previewingCompression ? 'Calculating…' : 'Ready'}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Savings</span>
                              <strong className={`text-xs sm:text-sm font-bold ${savings > 0 ? 'text-emerald-600' : 'text-stone-600'}`}>
                                {savings > 0 ? `~${savings}%` : 'Optimal'}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCompressionIds((ids) =>
                                  ids.includes(viewingCompressionMedia.id)
                                    ? ids.filter((id) => id !== viewingCompressionMedia.id)
                                    : [...ids, viewingCompressionMedia.id]
                                );
                              }}
                              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                isSelected
                                  ? 'border-[#a58054] bg-[#faf5ee] text-[#8b6f4e]'
                                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                              }`}
                            >
                              <HiOutlineCheck className={`w-4 h-4 ${isSelected ? 'text-[#8b6f4e]' : 'text-stone-400'}`} />
                              <span>{isSelected ? 'Selected for compression' : 'Include in compression'}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {!isVideo && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allUrls = (mediaImages[activeMediaColor] || []).map((img) => img.url);
                                    handleOpenImagePreview(viewingCompressionMedia.url, allUrls);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                                >
                                  <HiOutlineEye className="w-3.5 h-3.5" />
                                  <span>Full Zoom</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingCompressionMedia(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#a58054] hover:bg-[#8b6f4e] transition cursor-pointer"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>,
                document.body
              )}

              {/* ─── Virtual Try-On (VTO) Studio Modal (Matches Screenshot) ─── */}
              {isVtoStudioOpen && (
                <div
                  onClick={() => setIsVtoStudioOpen(false)}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn cursor-pointer"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] font-sans cursor-default"
                  >
                    {/* Modal Header */}
                    <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center">
                          <HiOutlineUpload className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900">
                            Virtual Try-On (VTO) Studio
                          </h3>
                          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                            {vtoEditingColor}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsVtoStudioOpen(false)}
                        className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Asset & Precision Sliders */}
                      <div className="md:col-span-6 space-y-5">
                        {/* 1. Try-On Overlay Asset */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                            1. TRY-ON OVERLAY ASSET
                          </label>
                          <label
                            htmlFor="vto-overlay-upload"
                            className="block border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] rounded-xl p-4 text-center bg-[#fdfcfb] cursor-pointer transition-colors group"
                          >
                            <HiOutlineUpload className="w-5 h-5 mx-auto text-stone-400 group-hover:text-[#8b6f4e] mb-1.5" />
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                              UPLOAD TRANSPARENT PNG (NO BACKGROUND)
                            </span>
                            <input
                              id="vto-overlay-upload"
                              type="file"
                              accept="image/png"
                              onChange={handleVtoAssetUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-stone-400 italic">
                            <strong className="text-amber-700 font-semibold not-italic">Pro Tip:</strong> Use a transparent PNG so the jewelry sits naturally on the skin.
                          </p>
                        </div>

                        {/* 2. Precision Alignment */}
                        <div className="space-y-3 pt-2 border-t border-stone-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                              2. PRECISION ALIGNMENT
                            </span>
                            <button
                              type="button"
                              onClick={handleResetVtoAlignment}
                              className="text-[10px] font-bold text-[#8b6f4e] hover:underline uppercase tracking-wider cursor-pointer"
                            >
                              RESET
                            </button>
                          </div>

                          {/* Vertical Position */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                              <span className="uppercase tracking-wider">VERTICAL POSITION</span>
                              <span className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                                {Number(vtoForm.top).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, top: Math.max(0, Number((prev.top - 0.5).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.5"
                                value={vtoForm.top}
                                onChange={(e) => setVtoForm((prev) => ({ ...prev, top: Number(e.target.value) }))}
                                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8b6f4e]"
                              />
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, top: Math.min(100, Number((prev.top + 0.5).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Horizontal Position */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                              <span className="uppercase tracking-wider">HORIZONTAL POSITION</span>
                              <span className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                                {Number(vtoForm.left).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, left: Math.max(0, Number((prev.left - 0.5).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.5"
                                value={vtoForm.left}
                                onChange={(e) => setVtoForm((prev) => ({ ...prev, left: Number(e.target.value) }))}
                                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8b6f4e]"
                              />
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, left: Math.min(100, Number((prev.left + 0.5).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Scale Size */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                              <span className="uppercase tracking-wider">SCALE SIZE</span>
                              <span className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                                {Number(vtoForm.scale).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, scale: Math.max(20, Number((prev.scale - 1).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="20"
                                max="250"
                                step="1"
                                value={vtoForm.scale}
                                onChange={(e) => setVtoForm((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8b6f4e]"
                              />
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, scale: Math.min(250, Number((prev.scale + 1).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Crop Band */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                              <span className="uppercase tracking-wider">CROP BAND (HIDE BOTTOM)</span>
                              <span className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                                {Number(vtoForm.clipBottom).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, clipBottom: Math.max(0, Number((prev.clipBottom - 1).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={vtoForm.clipBottom}
                                onChange={(e) => setVtoForm((prev) => ({ ...prev, clipBottom: Number(e.target.value) }))}
                                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8b6f4e]"
                              />
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, clipBottom: Math.min(100, Number((prev.clipBottom + 1).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Rotation */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                              <span className="uppercase tracking-wider">ROTATION</span>
                              <span className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                                {Number(vtoForm.rotation).toFixed(1)}°
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, rotation: Math.max(-180, Number((prev.rotation - 1).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="1"
                                value={vtoForm.rotation}
                                onChange={(e) => setVtoForm((prev) => ({ ...prev, rotation: Number(e.target.value) }))}
                                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8b6f4e]"
                              />
                              <button
                                type="button"
                                onClick={() => setVtoForm((prev) => ({ ...prev, rotation: Math.min(180, Number((prev.rotation + 1).toFixed(1))) }))}
                                className="w-7 h-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-600 transition-colors shadow-2xs select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Environment Dropdown & Live Studio View */}
                      <div className="md:col-span-6 space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                            3. SELECT TARGET ENVIRONMENT
                          </label>
                          <Dropdown
                            size="sm"
                            value={vtoForm.vtoCategory}
                            onChange={(val) => setVtoForm((prev) => ({ ...prev, vtoCategory: val }))}
                            options={VTO_ENV_OPTIONS.map((opt) => ({
                              value: opt.id,
                              label: opt.label,
                            }))}
                            buttonClassName="h-10 px-3 text-xs rounded-xl bg-white border-stone-200 font-semibold text-stone-800"
                          />
                        </div>

                        {/* Studio Live View Box */}
                        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-md flex items-center justify-center select-none group">
                          {/* Environment Model Background Image */}
                          <img
                            src={
                              getMediaUrl(vtoMasters[vtoForm.vtoCategory]?.[vtoForm.skinTone])
                            }
                            alt={`${vtoForm.vtoCategory || 'Model'} Environment`}
                            className="absolute inset-0 w-full h-full object-cover select-none transition-all duration-300"
                          />

                          {/* Overlay Jewelry Image */}
                          {vtoForm.overlayUrl ? (
                            <img
                              src={vtoForm.overlayUrl}
                              alt="Jewelry Overlay"
                              className="absolute pointer-events-none select-none transition-all drop-shadow-lg"
                              style={{
                                top: `${vtoForm.top}%`,
                                left: `${vtoForm.left}%`,
                                transform: `translate(-50%, -50%) scale(${vtoForm.scale / 100}) rotate(${vtoForm.rotation}deg)`,
                                clipPath: `inset(0 0 ${vtoForm.clipBottom}% 0)`,
                                maxWidth: '55%',
                                maxHeight: '55%',
                                objectFit: 'contain',
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/40 text-white/80 p-4 text-center">
                              <HiOutlinePhotograph className="w-10 h-10 mb-1 opacity-70" />
                              <span className="text-xs font-semibold">No variant photo available for calibration</span>
                              <span className="text-[10px] text-white/60">Upload photos in Step 4 to calibrate VTO overlay</span>
                            </div>
                          )}

                          {/* Skin Tone Vertical Slider / Toggle on Right */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 backdrop-blur-xs rounded-full p-1.5 flex flex-col gap-1.5 shadow-md">
                            <button
                              type="button"
                              onClick={() => setVtoForm((prev) => ({ ...prev, skinTone: 'light' }))}
                              title="Light Skin Tone"
                              className={`w-6 h-6 rounded-full transition-all flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                                vtoForm.skinTone === 'light'
                                  ? 'bg-[#f5e6d3] text-stone-900 ring-2 ring-white scale-110'
                                  : 'bg-[#f5e6d3]/60 text-transparent hover:bg-[#f5e6d3]'
                              }`}
                            >
                              L
                            </button>
                            <button
                              type="button"
                              onClick={() => setVtoForm((prev) => ({ ...prev, skinTone: 'dark' }))}
                              title="Dark Skin Tone"
                              className={`w-6 h-6 rounded-full transition-all flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                                vtoForm.skinTone === 'dark'
                                  ? 'bg-[#8d5b4c] text-white ring-2 ring-white scale-110'
                                  : 'bg-[#8d5b4c]/60 text-transparent hover:bg-[#8d5b4c]'
                              }`}
                            >
                              D
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsVtoStudioOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveVtoConfig}
                        className="px-5 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs uppercase tracking-wider cursor-pointer"
                      >
                        SAVE VTO CONFIGURATION
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Add Metal Color Modal ─── */}
              {isAddColorModalOpen && (
                <div
                  onClick={() => setIsAddColorModalOpen(false)}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn cursor-pointer"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 cursor-default"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <h3 className="text-sm font-bold text-stone-900">
                        Add Metal Color to Product
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddColorModalOpen(false)}
                        className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Available Master Colors */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                        Choose from Metal Color Master
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                        {colorsList.map((col) => {
                          const isAlreadyAdded = productColors.includes(col.name);
                          const sphere = getSphereStyle(col.name, col.code);
                          return (
                            <button
                              key={col.name}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddColor(col.name)}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                                isAlreadyAdded
                                  ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                                  : 'bg-white border-stone-200/90 hover:border-[#8b6f4e] hover:bg-[#faf6f0] text-stone-800 cursor-pointer shadow-2xs'
                              }`}
                            >
                              <div
                                className="w-4 h-4 rounded-full shrink-0"
                                style={{ background: sphere.gradient, boxShadow: sphere.shadow }}
                              />
                              <span className="truncate">{col.name}</span>
                              {isAlreadyAdded && <span className="ml-auto text-[10px] text-stone-400">Added</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3: SPECIFICATIONS & PRICING
          ════════════════════════════════════════════════════ */}
          {isSilverProduct && activeStep === 3 && (
            <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
              {/* Step Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {getStepPosition(3)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {isSilverProduct ? 'Silver Pricing & Costing' : 'Jewelry Specifications & Costing'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isSilverProduct ? 'Configure product pricing and margins.' : 'Add product weight, charges and pricing.'}
                  </p>
                </div>
              </div>

              {/* ─── Pricing & Inventory (Silver products matching old admin panel) ─── */}
              <div className="rounded-2xl border border-[#eee8df] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="w-7 h-7 rounded-lg bg-[#faf5ee] border border-[#ecd9c2] flex items-center justify-center text-[#8b6f4e] shrink-0 font-bold text-xs sm:text-sm">
                    ₹
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Pricing & Inventory
                    </h4>
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
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-bold rounded-xl border border-stone-200 bg-stone-50/70 text-stone-700 cursor-not-allowed select-none"
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
                        onChange={(e) => handleSilverCostOrMarkupChange('costPrice', e.target.value)}
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-[#fdfcfb] border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
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
                        onChange={(e) => handleSilverCostOrMarkupChange('markupPercentage', e.target.value)}
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-[#fdfcfb] border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
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
                        onChange={(e) => setPricing((prev) => ({ ...prev, calculatedPrice: e.target.value }))}
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-bold text-stone-900 bg-stone-50/70 border border-[#d6cfc2] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
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
                        onChange={(e) => handleSilverSalePriceChange(e.target.value)}
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-bold text-[#8b6f4e] bg-[#fdfcfb] border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">Actual selling price</p>
                    </div>
                  </div>

                  {/* Row 2: MRP Markup % and MRP Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                        <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                          MRP MARKUP %
                        </label>
                      </div>
                      <input
                        type="number"
                        value={pricing.mrpMarkupPercentage}
                        onChange={(e) => handleSilverMrpMarkupChange(e.target.value)}
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-[#fdfcfb] border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                        <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                          MRP PRICE (₹)
                        </label>
                      </div>
                      <input
                        type="number"
                        value={pricing.mrp}
                        onChange={(e) => setPricing((prev) => ({ ...prev, mrp: e.target.value }))}
                        className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-[#fdfcfb] border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">Customer list price (strikethrough)</p>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 5: CARE & SPECIFICATIONS
          ════════════════════════════════════════════════════ */}
          {activeStep === 5 && (
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

          {/* ═══════════════════════════════════════════════════
              STEP 6: SEO & PUBLISH
          ════════════════════════════════════════════════════ */}
          {activeStep === 6 && (
            <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {getStepPosition(6)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    SEO Configuration
                  </h3>
                  <p className="text-xs text-stone-500">
                    Optimize search engine rankings, meta titles, and URL slug.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">URL Slug</label>
                  <input
                    type="text"
                    value={seo.slug}
                    onChange={(e) => setSeo((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Meta Title</label>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Meta Description</label>
                  <textarea
                    rows={3}
                    value={seo.metaDescription}
                    onChange={(e) => setSeo((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs leading-relaxed placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Bottom Navigation Bar ──────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200/80">
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
            >
              <HiOutlineArrowLeft className="w-3 h-3 stroke-[2.5]" />
              <span>{activeStep === 1 ? 'Back to List' : 'Previous Tab'}</span>
            </button>

            {/* In the middle: Step X of Y • Step Title */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <span>Step {activeStepIndex + 1} of {steps.length} &bull;</span>
              <span className="text-[#8b6f4e] font-bold">{steps[activeStepIndex]?.title}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <HiOutlineDocumentText className="w-3.5 h-3.5 text-stone-500" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span>{getNextButtonText()}</span>
                <HiOutlineArrowRight className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
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
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-900/90 border border-white/15 text-white shadow-2xl backdrop-blur-md"
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
