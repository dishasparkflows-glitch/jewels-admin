import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import Dropdown from '../../components/common/Dropdown';
import { getMediaUrl } from '../../utils/imageUrl';
import {
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlinePlus,
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
  HiOutlineChevronDown,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoSparklesOutline,
  IoCheckmarkCircle,
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

export default function AddJewelryProduct() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: productId } = useParams();
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

  // ─── Live Master Lookup Lists from Backend API ──────────
  const [puritiesList, setPuritiesList] = useState([]);
  const [colorsList, setColorsList] = useState([]);
  const [diamondTypesList, setDiamondTypesList] = useState([]);
  const [diamondShapesList, setDiamondShapesList] = useState([]);
  const [diamondColorsList, setDiamondColorsList] = useState([]);
  const [diamondClaritiesList, setDiamondClaritiesList] = useState([]);
  const [diamondMasters, setDiamondMasters] = useState({ types: [], shapes: [], colors: [], clarities: [] });

  // Fetch Metal Purities, Metal Colors, and Diamond masters from backend using single combined API
  useEffect(() => {
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
            setPuritiesList(combinedData.metalPurities.map((i) => (typeof i === 'string' ? i : i.name)));
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
            setPuritiesList(items.map((i) => (typeof i === 'string' ? i : i.name)));
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
  }, []);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    hydratedProductId.current = '';
    setProductRecord(null);
    setProductLoading(true);
    api.get('/products/' + productId)
      .then((response) => {
        if (!cancelled) setProductRecord(response.data?.data?.product || response.data?.data);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error.response?.data?.message || `Could not load this ${isSilverProduct ? 'silver' : 'jewelry'} product`);
        navigate(productListPath);
        setProductLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, navigate, productListPath]);

  // ─── Step 1: Basic Details ──────────────────────────────
  const [basicDetails, setBasicDetails] = useState({
    title: '',
    sku: '',
    category: '',
    subType: '',
    productType: isSilverProduct ? 'silver' : '',
    gender: '',
    description: '',
    isOrnate: false,
  });

  const selectedCategory = useMemo(
    () => categoryList.find((category) => String(category._id) === String(basicDetails.category)),
    [categoryList, basicDetails.category]
  );
  const subTypeOptions = useMemo(
    () => (selectedCategory?.subTypes || []).map((subType) => ({
      value: String(subType._id),
      label: subType.name,
    })),
    [selectedCategory]
  );
  const selectedSubType = useMemo(
    () => selectedCategory?.subTypes?.find((subType) => String(subType._id) === String(basicDetails.subType)),
    [selectedCategory, basicDetails.subType]
  );

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

  // Fetch live diamond pricing master from backend
  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        const res = await api.get('/center-diamond-prices?limit=500');
        const items = res.data?.data?.items || res.data?.data || [];
        if (Array.isArray(items)) {
          setApiCenterRates(items);
        }
      } catch (err) {
        console.warn('Center diamond prices live lookup notice:', err);
      }
    };
    fetchLiveRates();
  }, []);

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
        const s = String(r.diamondShapeId?.name || r.diamondShape || '').toUpperCase();
        const c = String(r.diamondColorId?.name || r.diamondColor || '').toUpperCase();
        const cl = String(r.diamondClarityId?.name || r.diamondClarity || '').toUpperCase();
        const from = Number(r.sizeFrom ?? 0);
        const to = Number(r.sizeTo ?? 999);

        return (
          (!shape || s === String(shape).toUpperCase()) &&
          (!color || c === String(color).toUpperCase()) &&
          (!clarity || cl === String(clarity).toUpperCase()) &&
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
  const [activeMediaSubTab, setActiveMediaSubTab] = useState('images'); // 'images' | 'videos' | 'vto'

  // High-Res Photography Per Metal Color
  const [mediaImages, setMediaImages] = useState({});

  // 360 Spin & Product Videos Per Metal Color
  const [mediaVideos, setMediaVideos] = useState({});

  // Virtual Try-On (VTO) Configuration Per Metal Color
  const [vtoConfigs, setVtoConfigs] = useState({});

  // Modals state
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
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

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isVtoStudioOpen) setIsVtoStudioOpen(false);
        if (isHowItWorksOpen) setIsHowItWorksOpen(false);
        if (isAddColorModalOpen) setIsAddColorModalOpen(false);
      }
    };
    if (isVtoStudioOpen || isHowItWorksOpen || isAddColorModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVtoStudioOpen, isHowItWorksOpen, isAddColorModalOpen]);

  // Handle Image Upload for Metal Color
  const handleImageUpload = async (e, colorName = activeMediaColor) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        toast.loading(`Uploading ${file.name}...`, { id: 'prod-media' });
        const { fileUrl } = await uploadWithPresignedUrl(file, 'products');
        setMediaImages((prev) => {
          const current = prev[colorName] || [];
          return {
            ...prev,
            [colorName]: [
              ...current,
              {
                id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                url: fileUrl,
                isPrimary: current.length === 0,
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              },
            ],
          };
        });
        toast.success(`${file.name} uploaded!`, { id: 'prod-media' });
      } catch (err) {
        toast.error(`Upload failed: ${err.message}`, { id: 'prod-media' });
      }
    }
    if (e.target) e.target.value = '';
  };

  // Handle Video Upload for Metal Color
  const handleVideoUpload = async (e, colorName = activeMediaColor) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        toast.loading(`Uploading video ${file.name}...`, { id: 'prod-video' });
        const { fileUrl } = await uploadWithPresignedUrl(file, 'products');
        setMediaVideos((prev) => {
          const current = prev[colorName] || [];
          return {
            ...prev,
            [colorName]: [
              ...current,
              {
                id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                url: fileUrl,
                title: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              },
            ],
          };
        });
        toast.success(`Video uploaded!`, { id: 'prod-video' });
      } catch (err) {
        toast.error(`Video upload failed: ${err.message}`, { id: 'prod-video' });
      }
    }
    if (e.target) e.target.value = '';
  };

  // Handle VTO Overlay PNG Upload inside Studio Modal
  const handleVtoAssetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading(`Uploading VTO overlay ${file.name}...`, { id: 'vto-upload' });
      const { fileUrl, public_id } = await uploadWithPresignedUrl(file, 'vto');
      setVtoForm((prev) => ({
        ...prev,
        overlayUrl: fileUrl,
        overlayPublicId: public_id,
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

  const handleRemoveMedia = (colorName, imageId) => {
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

  const handleRemoveVideo = (colorName, videoId) => {
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
    gstPercentage: '',
  });

  // ─── Structured Pricing Block ───────────────────────────
  const [pricing, setPricing] = useState({
    mrp: '',
    salePrice: '',
    costPrice: '',
    displayPrice: '',
    gstPercentage: '',
    markupPercentage: '',
  });

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
    status: 'active',
  });

  // ─── Platform Visibility (App & Web) ───────────────────
  const [platformVisibility, setPlatformVisibility] = useState({
    showInApp: false,
    showOnWeb: false,
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

  // Regenerate variants dynamically
  const handleRegenerateVariants = () => {
    if (!selectedPurities || selectedPurities.length === 0) {
      toast.error('Please select at least one metal purity above.');
      return;
    }
    if (!selectedColors || selectedColors.length === 0) {
      toast.error('Please select at least one metal color above.');
      return;
    }

    const colorCodeMap = colorsList.reduce(
      (acc, c) => {
        acc[c.name] = c.code;
        return acc;
      },
      {
        Silver: '#9ca3af',
        'Rose Gold': '#e89f8f',
        'Yellow Gold': '#d4af37',
        'White Gold': '#cbd5e1',
      }
    );

    const colorSuffixMap = {
      Silver: 'S',
      'Rose Gold': 'RG',
      'Yellow Gold': 'YG',
      'White Gold': 'WG',
    };

    const newVariants = [];
    let counter = 1;

    selectedPurities.forEach((purity) => {
      selectedColors.forEach((color, colorIdx) => {
        const calculatedPrice = Number(pricing.salePrice) || 0;
        const suffix = colorSuffixMap[color] || color.substring(0, 2).toUpperCase();

        const centerDetail = centerDiamondCombinations.length > 0
          ? `Center: ${centerDiamondCombinations.length} Combos (${centerDiamondShape}, ${centerDiamondType})`
          : centerDiamond.caratWeight
          ? `Center: ${centerDiamond.caratWeight}Ct (${centerDiamond.color || ''}, ${centerDiamond.clarity || ''})`
          : centerDiamond.type
          ? `Center: ${centerDiamond.type} Diamond`
          : 'Center: Diamond';

        const sideDetail = sideDiamonds.enabled && sideDiamonds.pieces
          ? `Side: ${sideDiamonds.pieces} pcs (${sideDiamonds.sizeFrom || ''}-${sideDiamonds.sizeTo || ''}Ct, ${sideDiamonds.color || ''}, ${sideDiamonds.clarity || ''})`
          : 'Side: None';

        newVariants.push({
          id: counter++,
          purity,
          color,
          colorCode: colorCodeMap[color] || '#9ca3af',
          diamondDetails: {
            center: centerDetail,
            side: sideDetail,
          },
          weight: specs.baseMetalWeight || specs.metalWeight || '0.00',
          sku: basicDetails.sku ? basicDetails.sku + '-' + suffix : '',
          price: calculatedPrice ? Number(calculatedPrice).toLocaleString('en-IN') : '0',
          priceRaw: calculatedPrice || 0,
          stock: '',
        });
      });
    });

    setVariants(newVariants);
    toast.success(`Generated ${newVariants.length} product variants!`);
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
    const categoryRef = Array.isArray(productRecord.category) ? productRecord.category[0] : productRecord.category;
    const categoryId = categoryRef && typeof categoryRef === 'object' ? categoryRef._id : categoryRef;
    const subtypeRef = productRecord.subType || productRecord.subTypeId;
    const subtypeId = subtypeRef && typeof subtypeRef === 'object' ? subtypeRef._id : subtypeRef;
    const colorOptions = [...colorsList, ...(productRecord.metalColors || [])];
    const variantRecords = Array.isArray(productRecord.variants) ? productRecord.variants : [];
    const variantRows = variantRecords.map((variant, index) => {
      const parts = String(variant.combination || '').split('/').map((part) => part.trim());
      const purity = resolveName(variant.metalPurity || variant.metalPurityId, puritiesList) || parts[0] || '';
      const color = resolveName(variant.metalColor || variant.metalColorId, colorOptions) || parts[1] || '';
      return {
        id: variant._id || index + 1,
        purity,
        color,
        colorCode: colorOptions.find((item) => item.name === color)?.code || '',
        diamondDetails: { center: '', side: '' },
        weight: variant.metalWeight == null ? '' : String(variant.metalWeight),
        sku: variant.sku || '',
        price: variant.price == null ? '' : Number(variant.price).toLocaleString('en-IN'),
        priceRaw: variant.price ?? '',
        stock: variant.stock == null ? '' : String(variant.stock),
      };
    });
    const colorRows = Array.isArray(productRecord.colorImages) ? productRecord.colorImages : [];
    const colorNames = unique([
      ...colorRows.map((row) => resolveName(row.metalColor || row.metalColorId, colorOptions)),
      ...(Array.isArray(productRecord.metalColors)
        ? productRecord.metalColors.map((color) => resolveName(color, colorOptions))
        : []),
      ...variantRows.map((variant) => variant.color),
    ]);
    const imagesByColor = {};
    const videosByColor = {};
    const vtoByColor = {};
    colorRows.forEach((row) => {
      const colorName = resolveName(row.metalColor || row.metalColorId, colorOptions);
      if (!colorName) return;
      const rowImages = Array.isArray(row.images) ? row.images : [];
      imagesByColor[colorName] = rowImages
        .filter((item) => item?.url && item.mediaType !== 'video')
        .map((item, index) => ({
          id: item.public_id || item._id || colorName + '-image-' + index,
          url: item.url,
          public_id: item.public_id,
          name: item.name || '',
          isPrimary: index === 0,
        }));
      videosByColor[colorName] = rowImages
        .filter((item) => item?.url && item.mediaType === 'video')
        .map((item, index) => ({
          id: item.public_id || item._id || colorName + '-video-' + index,
          url: item.url,
          public_id: item.public_id,
          title: item.title || '',
        }));
      if (row.vtoImage?.url) {
        vtoByColor[colorName] = {
          isConfigured: true,
          overlayUrl: row.vtoImage.url,
          overlayPublicId: row.vtoImage.public_id || '',
          vtoCategory: row.vtoCategory || '',
          ...(row.vtoConfig || {}),
        };
      }
    });
    const rootImages = Array.isArray(productRecord.images) ? productRecord.images.filter((item) => item?.url) : [];
    const hasColorMedia = Object.values(imagesByColor).some((items) => items.length) ||
      Object.values(videosByColor).some((items) => items.length);
    if (!hasColorMedia && rootImages.length) {
      const rootMediaColor = colorNames[0] || '';
      imagesByColor[rootMediaColor] = rootImages
        .filter((item) => item.mediaType !== 'video')
        .map((item, index) => ({
          id: item.public_id || item._id || 'image-' + index,
          url: item.url,
          public_id: item.public_id,
          name: item.name || '',
          isPrimary: index === 0,
        }));
      videosByColor[rootMediaColor] = rootImages
        .filter((item) => item.mediaType === 'video')
        .map((item, index) => ({
          id: item.public_id || item._id || 'video-' + index,
          url: item.url,
          public_id: item.public_id,
          title: item.title || '',
        }));
    }
    const centerRows = Array.isArray(productRecord.centerDiamondRows) ? productRecord.centerDiamondRows : [];
    const centerNames = centerRows.map((row) => ({
      type: resolveName(row.diamondTypeId || row.diamondType, diamondMasters.types),
      shape: resolveName(row.diamondShapeId || row.diamondShape, diamondMasters.shapes),
      color: resolveName(row.diamondColorId || row.diamondColor, diamondMasters.colors),
      clarity: resolveName(row.diamondClarityId || row.diamondClarity, diamondMasters.clarities),
      carat: row.caratWeight,
      rate: row.pricePerCarat,
    }));
    const firstCenter = centerNames[0] || {};
    setBasicDetails({
      title: basicInfo.title || productRecord.title || '',
      sku: basicInfo.sku || productRecord.sku || '',
      category: categoryId ? String(categoryId) : '',
      subType: subtypeId ? String(subtypeId) : '',
      productType: isSilverProduct ? 'silver' : (basicInfo.productType || productRecord.productType || ''),
      gender: Array.isArray(productRecord.gender) ? (productRecord.gender[0] || '') : (productRecord.gender || ''),
      description: basicInfo.description || productRecord.description || '',
      isOrnate: Boolean(basicInfo.isOrnate ?? productRecord.isOrnate),
    });
    setSelectedPurities(unique(variantRows.map((variant) => variant.purity)));
    setSelectedColors(unique(variantRows.map((variant) => variant.color)));
    setVariants(variantRows);
    setCenterDiamondType(firstCenter.type || '');
    setCenterDiamondShape(firstCenter.shape || '');
    setCenterDiamondColors(unique(centerNames.map((row) => row.color)));
    setCenterDiamondClarities(unique(centerNames.map((row) => row.clarity)));
    setCenterDiamondCarats(unique(centerNames.map((row) => Number(row.carat)).filter(Number.isFinite)));
    setCustomComboRates(Object.fromEntries(centerNames.map((row) => [
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
    setMediaVideos(videosByColor);
    setVtoConfigs(vtoByColor);
    setSpecs({
      metalWeight: String(productRecord.specifications?.metalWeight ?? productRecord.baseMetalWeight ?? ''),
      baseLabourCharge: String(productRecord.baseLabourCharge ?? ''),
      certificateCharge: String(productRecord.certificateCharge ?? ''),
      gstPercentage: String(productRecord.gstPercentage ?? productPricing.gstPercentage ?? ''),
    });
    setPricing({
      mrp: String(productPricing.mrp ?? productRecord.mrp ?? productRecord.price ?? ''),
      salePrice: String(productPricing.salePrice ?? productRecord.salePrice ?? ''),
      costPrice: String(productPricing.costPrice ?? productRecord.costPrice ?? ''),
      displayPrice: String(productPricing.displayPrice ?? productRecord.displayPrice ?? ''),
      gstPercentage: String(productPricing.gstPercentage ?? productRecord.gstPercentage ?? ''),
      markupPercentage: String(productPricing.markupPercentage ?? productRecord.markupPercentage ?? ''),
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
      slug: productRecord.slug || basicInfo.slug || '',
      metaTitle: productRecord.seo?.metaTitle || '',
      metaDescription: productRecord.seo?.metaDescription || '',
      stockStatus: productRecord.stockStatus || '',
      status: productRecord.status || 'active',
    });
    setPlatformVisibility({
      showInApp: Boolean(productRecord.inapp),
      showOnWeb: Boolean(productRecord.inweb),
    });
    setPreviewImage(rootImages[0]?.url || '');
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

  // Final Publish Handler
  const handlePublish = async (statusOverride = seo.status || 'active') => {
    setSaving(true);
    try {
      const activeTitle = basicDetails.title.trim();
      const activeSku = basicDetails.sku.trim();
      if (!activeTitle || !activeSku) {
        toast.error('Product title and SKU are required to save this product');
        return;
      }
      const activeSlug = seo.slug?.trim() || undefined;
      const activeDesc = basicDetails.description || '';
      const numberValue = (value) => value === '' || value === null || value === undefined ? undefined : Number(value);
      const mrpNum = numberValue(pricing.mrp);
      const salePriceNum = numberValue(pricing.salePrice);
      const costPriceNum = numberValue(pricing.costPrice);
      const displayPriceNum = numberValue(pricing.displayPrice);
      const gstNum = numberValue(pricing.gstPercentage || specs.gstPercentage);
      const markupNum = numberValue(pricing.markupPercentage);

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
        ...(item.id || item.public_id ? { public_id: item.id || item.public_id } : {}),
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
        if (!images.length && !videos.length && !hasVto) return [];

        const vtoConfig = compactObject({
          top: numberValue(vto.top),
          left: numberValue(vto.left),
          scale: numberValue(vto.scale),
          clipBottom: numberValue(vto.clipBottom),
          rotation: numberValue(vto.rotation),
        });
        return [{
          ...(color?.id || color?._id ? { metalColor: color.id || color._id } : {}),
          ...(images.length || videos.length ? { images: [...images, ...videos] } : {}),
          ...(hasVto ? {
            vtoImage: {
              url: vto.overlayUrl,
              ...(vto.overlayPublicId ? { public_id: vto.overlayPublicId } : {}),
            },
            ...(vto.vtoCategory ? { vtoCategory: vto.vtoCategory } : {}),
            ...(Object.keys(vtoConfig).length ? { vtoConfig } : {}),
          } : {}),
        }];
      });
      const productImages = mediaColorNames.flatMap((colorName) => [
        ...(mediaImages[colorName] || []).filter((item) => item?.url).map((item) => mediaEntry(item, 'image')),
        ...(mediaVideos[colorName] || []).filter((item) => item?.url).map((item) => mediaEntry(item, 'video')),
      ]);
      const metalColorIds = [...new Set(productColors.map((colorName) => {
        const color = colorsList.find((item) => item.name?.toLowerCase() === colorName.toLowerCase());
        return color?.id || color?._id;
      }).filter(Boolean))];
      const variantRows = variants.map((variant) => compactObject({
        combination: [variant.purity, variant.color].filter(Boolean).join(' / '),
        sku: variant.sku,
        price: numberValue(String(variant.price ?? '').replace(/,/g, '')) ?? numberValue(variant.priceRaw),
        stock: numberValue(variant.stock),
        metalWeight: numberValue(variant.weight),
      })).filter((variant) => Object.keys(variant).length);
      const centerDiamondRows = centerDiamondCombinations.map((combination) => withDiamondIds({
        diamondType: combination.diamondType,
        diamondShape: combination.shape,
        diamondColor: combination.color,
        diamondClarity: combination.clarity,
        caratWeight: numberValue(combination.carat),
        pricePerCarat: numberValue(combination.rate),
      }));
      const sideDiamondRows = sideDiamonds.enabled ? [withDiamondIds({
        diamondType: sideDiamonds.type,
        diamondShape: sideDiamonds.shape,
        diamondColor: sideDiamonds.color,
        diamondClarity: sideDiamonds.clarity,
        sizeFrom: numberValue(sideDiamonds.sizeFrom),
        sizeTo: numberValue(sideDiamonds.sizeTo),
        pieces: numberValue(sideDiamonds.pieces),
      })] : [];
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
      const subtypeId = selectedCategory?.subTypes?.find(
        (subType) => String(subType._id) === String(basicDetails.subType)
      )?._id;
      const pricingData = compactObject({
        mrp: mrpNum,
        salePrice: salePriceNum,
        costPrice: costPriceNum,
        displayPrice: displayPriceNum,
        gstPercentage: gstNum,
        markupPercentage: markupNum,
      });
      const specificationData = compactObject({ metalWeight: metalWeightNum });
      const seoData = compactObject({
        metaTitle: seo.metaTitle?.trim(),
        metaDescription: seo.metaDescription?.trim(),
      });
      const payload = {
        basicInfo: compactObject({
          title: activeTitle,
          sku: activeSku,
          slug: activeSlug,
          description: activeDesc,
          productType: isSilverProduct ? 'silver' : (basicDetails.productType || undefined),
          isOrnate: basicDetails.isOrnate ? true : undefined,
        }),
        status: statusOverride,
        inapp: Boolean(platformVisibility.showInApp),
        inweb: Boolean(platformVisibility.showOnWeb),
        ...(categoryId ? { category: [categoryId] } : {}),
        ...(subtypeId ? { subType: subtypeId } : {}),
        ...(basicDetails.gender ? { gender: [basicDetails.gender] } : {}),
        ...(Object.keys(pricingData).length ? { pricing: pricingData } : {}),
        ...(Object.keys(specificationData).length ? { specifications: specificationData } : {}),
        ...(numberValue(specs.baseLabourCharge) !== undefined
          ? { baseLabourCharge: numberValue(specs.baseLabourCharge) }
          : {}),
        ...(numberValue(specs.certificateCharge) !== undefined
          ? { certificateCharge: numberValue(specs.certificateCharge) }
          : {}),
        ...(!isSilverProduct && metalColorIds.length ? { metalColors: metalColorIds } : {}),
        ...(colorImageRows.length ? { colorImages: colorImageRows } : {}),
        ...(productImages.length ? { images: productImages } : {}),
        ...(!isSilverProduct && variantRows.length ? { variants: variantRows } : {}),
        ...(!isSilverProduct && centerDiamondRows.length ? { centerDiamondRows } : {}),
        ...(!isSilverProduct && sideDiamondRows.length ? { sideDiamondRows } : {}),
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
      const productName = isSilverProduct ? 'Silver product' : 'Jewelry product';
      toast.success(productId
        ? (statusOverride === 'draft' ? 'Draft updated successfully!' : `${productName} updated successfully!`)
        : (statusOverride === 'draft' ? 'Draft saved successfully!' : `${productName} published successfully!`));
      navigate(productListPath);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save product. Please review the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save the current product through the same API used for publishing, with draft status.
  const handleSaveDraft = async () => handlePublish('draft');

  // Stepper labels
  const steps = [
    { num: 1, title: 'Basic Details', subtitle: 'Name, category, description' },
    ...(!isSilverProduct ? [{ num: 2, title: 'Variant Configuration', subtitle: 'Metal, color, diamonds' }] : []),
    { num: 3, title: 'Specifications & Pricing', subtitle: 'Weights, charges & margins' },
    { num: 4, title: 'Product Media', subtitle: 'Images & VTO' },
    { num: 5, title: 'Care & Specs', subtitle: 'Care info & specifications' },
    { num: 6, title: 'Product Preview', subtitle: 'Live storefront preview' },
    { num: 7, title: 'SEO & Publish', subtitle: 'Meta & catalog status' },
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
      handlePublish();
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
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-800 bg-white border border-[#d6cfc2] rounded-xl hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineDocumentText className="w-4 h-4 text-stone-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handlePublish('active')}
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
      <div className="bg-white rounded-2xl border border-[#eee8df] p-2 sm:p-2.5 shadow-2xs">
        <div className={`grid grid-cols-2 sm:grid-cols-4 ${isSilverProduct ? 'lg:grid-cols-6' : 'lg:grid-cols-7'} gap-1.5 sm:gap-2 items-center`}>
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
                    onChange={(val) =>
                      setBasicDetails((prev) => ({ ...prev, category: val, subType: '' }))
                    }
                    placeholder="Select Category"
                    options={categoryOptions}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">
                    Sub-Category / Collection
                  </label>
                  <Dropdown
                    size="field"
                    variant="input"
                    value={basicDetails.subType}
                    onChange={(value) => setBasicDetails((prev) => ({ ...prev, subType: value }))}
                    placeholder={selectedCategory ? 'Select Sub-Category' : 'Select a category first'}
                    options={subTypeOptions}
                    className="w-full"
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
                    ]}
                    className="w-full"
                  />
                </div>

                {!isSilverProduct && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">Product Type</label>
                    <Dropdown
                      size="field"
                      variant="input"
                      value={basicDetails.productType}
                      onChange={(val) =>
                        setBasicDetails((prev) => ({
                          ...prev,
                          productType: val,
                          isOrnate: val === 'ornate' ? true : prev.isOrnate,
                        }))
                      }
                      placeholder="Select Product Type"
                      options={[
                        { value: 'gold', label: 'gold' },
                        { value: 'silver', label: 'silver' },
                        { value: 'ornate', label: 'ornate' },
                      ]}
                      className="w-full"
                    />
                  </div>
                )}

                {/* ─── Platform Visibility (Moved Next to Product Type) ── */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">
                    Platform Visibility
                  </label>
                  <div className="h-10 px-4 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] bg-white flex items-center gap-6 shadow-2xs transition-colors">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={platformVisibility.showInApp}
                        onChange={(e) =>
                          setPlatformVisibility((prev) => ({
                            ...prev,
                            showInApp: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 transition cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs sm:text-[13px] font-semibold text-stone-800 group-hover:text-stone-900 transition-colors">
                        Show in App
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={platformVisibility.showOnWeb}
                        onChange={(e) =>
                          setPlatformVisibility((prev) => ({
                            ...prev,
                            showOnWeb: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 transition cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs sm:text-[13px] font-semibold text-stone-800 group-hover:text-stone-900 transition-colors">
                        Show on Web
                      </span>
                    </label>
                  </div>
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
                      {puritiesList.map((purity) => {
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

              {/* ─── Sub-Section 2: Center & Side Diamond Configuration ──── */}
              <div className="space-y-4 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    2
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

                {/* ── Side Diamond Configuration Card (Exact match to portal screenshot) ── */}
                <div className="p-5 rounded-2xl border border-stone-200/90 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <IoSparklesOutline className="w-4 h-4 text-[#8b6f4e]" />
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-900">
                        SIDE DIAMOND CONFIGURATION
                      </h4>
                      <span className="text-[10px] text-stone-400 font-normal uppercase tracking-wider">(Optional)</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <span>Enable Side Diamonds</span>
                      <input
                        type="checkbox"
                        checked={sideDiamonds.enabled}
                        onChange={(e) => setSideDiamonds((prev) => ({ ...prev, enabled: e.target.checked }))}
                        className="w-4 h-4 accent-[#8b6f4e] rounded cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className={`space-y-3 transition-opacity ${sideDiamonds.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Type</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.type}
                          onChange={(val) => setSideDiamonds((prev) => ({ ...prev, type: val }))}
                          options={diamondTypesList}
                          buttonClassName="h-8 px-2.5 text-xs rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Shape</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.shape}
                          onChange={(val) => setSideDiamonds((prev) => ({ ...prev, shape: val }))}
                          options={diamondShapesList}
                          buttonClassName="h-8 px-2.5 text-xs rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Color</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.color}
                          onChange={(val) => setSideDiamonds((prev) => ({ ...prev, color: val }))}
                          options={diamondColorsList}
                          buttonClassName="h-8 px-2.5 text-xs rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Clarity</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.clarity}
                          onChange={(val) => setSideDiamonds((prev) => ({ ...prev, clarity: val }))}
                          options={diamondClaritiesList}
                          buttonClassName="h-8 px-2.5 text-xs rounded-lg bg-white border-stone-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-700">Size From (Ct)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 0.01"
                          value={sideDiamonds.sizeFrom}
                          onChange={(e) => setSideDiamonds((prev) => ({ ...prev, sizeFrom: e.target.value }))}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-700">Size To (Ct)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 0.05"
                          value={sideDiamonds.sizeTo}
                          onChange={(e) => setSideDiamonds((prev) => ({ ...prev, sizeTo: e.target.value }))}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-700">Total Pieces</label>
                        <input
                          type="number"
                          placeholder="e.g. 18"
                          value={sideDiamonds.pieces}
                          onChange={(e) => setSideDiamonds((prev) => ({ ...prev, pieces: e.target.value }))}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Sub-Section 3: Preview Variants ───────── */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900">Preview Variants</h3>
                      <p className="text-[10px] text-stone-400">
                        Based on your selection, variants will be generated automatically.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateVariants}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    <HiOutlineRefresh className="w-3 h-3 text-stone-500" />
                    <span>Regenerate</span>
                  </button>
                </div>

                {/* Variants Table */}
                <div className="border border-stone-200/90 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#faf9f7] border-b border-stone-200/80 text-[9.5px] font-bold text-stone-500 uppercase tracking-wider">
                          <th className="py-2 pl-3 pr-1 text-center w-7">#</th>
                          <th className="py-2 px-2.5">METAL PURITY</th>
                          <th className="py-2 px-2.5">METAL COLOR</th>
                          <th className="py-2 px-3 min-w-[190px]">DIAMOND DETAILS</th>
                          <th className="py-2 px-2.5 w-20">WEIGHT (G)</th>
                          <th className="py-2 px-2.5 min-w-[120px]">SKU</th>
                          <th className="py-2 px-2.5 w-24">PRICE (₹)</th>
                          <th className="py-2 pr-3 pl-2 w-16">STOCK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-[11px]">
                        {variants.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center">
                              <div className="flex flex-col items-center justify-center space-y-1.5 text-stone-400">
                                <span className="text-2xl">✨</span>
                                <p className="font-semibold text-xs text-stone-700">No variants generated yet</p>
                                <p className="text-[11px] text-stone-400 max-w-sm">
                                  Select your metal options and diamond configuration above, then click &quot;Regenerate&quot; to build preview variants.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          variants.map((v) => (
                          <tr key={v.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-2 pl-3 pr-1 text-center font-medium text-stone-400 text-[11px]">
                              {v.id}
                            </td>
                            <td className="py-2 px-2.5 font-semibold text-stone-800">
                              {v.purity}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/15 flex-shrink-0"
                                  style={{ backgroundColor: v.colorCode }}
                                />
                                <span className="font-medium text-stone-700">
                                  {v.color}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="space-y-0.5 text-[10.5px] leading-tight">
                                <p className="text-stone-800 font-medium">{v.diamondDetails.center}</p>
                                <p className="text-stone-500">{v.diamondDetails.side}</p>
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={v.weight}
                                onChange={(e) => handleVariantChange(v.id, 'weight', e.target.value)}
                                className="w-14 px-1.5 py-0.5 text-[11px] text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => handleVariantChange(v.id, 'sku', e.target.value)}
                                className="w-24 px-1.5 py-0.5 text-[11px] font-mono text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={v.price}
                                onChange={(e) => handleVariantChange(v.id, 'price', e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-[11px] font-semibold text-stone-900 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                              />
                            </td>
                            <td className="py-2 pr-3 pl-2">
                              <input
                                type="text"
                                value={v.stock}
                                onChange={(e) => handleVariantChange(v.id, 'stock', e.target.value)}
                                className="w-10 px-1.5 py-0.5 text-[11px] text-center text-stone-800 rounded-md border border-stone-200/90 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                              />
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 4: PRODUCT MEDIA (Images & VTO)
          ════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
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

                <button
                  type="button"
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 rounded-xl hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <HiOutlineQuestionMarkCircle className="w-4 h-4 text-stone-400" />
                  <span>How it works?</span>
                </button>
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f7ee] text-[#1b7a43] border border-[#c4ebd1]/80">
                            {isSilverProduct ? 'Media' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isSilverProduct && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(activeMediaColor)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50/70 border border-rose-200/80 rounded-xl transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                        <span>Remove Color</span>
                      </button>
                    )}
                  </div>

                  {/* Sub-Tabs: Product Images, Videos, VTO Configuration */}
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveMediaSubTab('images')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaSubTab === 'images'
                          ? 'bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <HiOutlinePhotograph className="w-4 h-4" />
                      <span>Product Images ({(mediaImages[activeMediaColor] || []).length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMediaSubTab('videos')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaSubTab === 'videos'
                          ? 'bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <HiOutlineVideoCamera className="w-4 h-4" />
                      <span>Videos ({(mediaVideos[activeMediaColor] || []).length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMediaSubTab('vto')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeMediaSubTab === 'vto'
                          ? 'bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <HiOutlineCube className="w-4 h-4" />
                      <span>VTO Configuration ({vtoConfigs[activeMediaColor]?.isConfigured ? 1 : 0})</span>
                    </button>
                  </div>

                  {/* Product Images Tab Content (Horizontal Scroll Row) */}
                  {activeMediaSubTab === 'images' && (
                    <div className="relative">
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {/* Upload Images Button Card */}
                        <label
                          htmlFor="metal-color-upload-input"
                          className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] bg-[#fdfcfb] hover:bg-[#faf7f2]/30 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group shadow-2xs"
                        >
                          <input
                            id="metal-color-upload-input"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, activeMediaColor)}
                            className="hidden"
                          />
                          <div className="w-8 h-8 rounded-full border border-stone-300 group-hover:border-[#8b6f4e] group-hover:bg-[#faf5ee] text-stone-400 group-hover:text-[#8b6f4e] flex items-center justify-center transition-all mb-1.5">
                            <HiOutlinePlus className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-stone-800 group-hover:text-[#8b6f4e]">
                            Upload Images
                          </span>
                          <span className="text-[9.5px] text-stone-400 mt-0.5">
                            PNG, JPG (Max 5MB each)
                          </span>
                        </label>

                        {/* Uploaded Image Cards */}
                        {(mediaImages[activeMediaColor] || []).map((img, i) => (
                          <div
                            key={img.id || i}
                            className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-50 shadow-2xs group"
                          >
                            <img
                              src={img.url}
                              alt={`${activeMediaColor} ${i + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Top Left Badge or Set Primary */}
                            {img.isPrimary ? (
                              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8b6f4e] text-white shadow-xs">
                                Primary
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryMedia(activeMediaColor, img.id)}
                                className="absolute top-2 left-2 z-10 p-1 rounded-md bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                title="Set as Primary"
                              >
                                <HiOutlineStar className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Top Right Close / Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(activeMediaColor, img.id)}
                              className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                              title="Remove image"
                            >
                              <HiOutlineX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Next arrow hint if multiple images */}
                        {(mediaImages[activeMediaColor] || []).length > 2 && (
                          <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 shadow-2xs flex items-center justify-center text-stone-500 shrink-0">
                            <HiOutlineChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Videos Tab Content */}
                  {activeMediaSubTab === 'videos' && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      <label
                        htmlFor="metal-color-video-input"
                        className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] bg-[#fdfcfb] hover:bg-[#faf7f2]/30 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group shadow-2xs"
                      >
                        <input
                          id="metal-color-video-input"
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(e, activeMediaColor)}
                          className="hidden"
                        />
                        <div className="w-8 h-8 rounded-full border border-stone-300 group-hover:border-[#8b6f4e] group-hover:bg-[#faf5ee] text-stone-400 group-hover:text-[#8b6f4e] flex items-center justify-center transition-all mb-1.5">
                          <HiOutlineVideoCamera className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-stone-800 group-hover:text-[#8b6f4e]">
                          Upload Video
                        </span>
                        <span className="text-[9.5px] text-stone-400 mt-0.5">
                          MP4, WEBM (Max 50MB)
                        </span>
                      </label>

                      {(mediaVideos[activeMediaColor] || []).map((vid, i) => (
                        <div
                          key={vid.id || i}
                          className="relative w-48 h-32 sm:h-36 shrink-0 rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-900 shadow-2xs group flex flex-col justify-end p-2.5 text-white"
                        >
                          <video src={vid.url} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                          <div className="relative z-10">
                            <p className="text-xs font-bold truncate">{vid.title || 'Product Video'}</p>
                            <p className="text-[10px] text-stone-300">{vid.size || 'Video asset'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(activeMediaColor, vid.id)}
                            className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <HiOutlineX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ─── Virtual Try-On (VTO) Dedicated Card (Matching Screenshot) ─── */}
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <span>Virtual Try-On (VTO)</span>
                        <HiOutlineInformationCircle className="w-3.5 h-3.5 text-stone-400" />
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Configure virtual try-on using the existing VTO master. This will use the 3D asset and try-on settings for this metal color.
                      </p>
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
                </div>
              </div>

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

              {/* ─── "How it works?" Modal ─── */}
              {isHowItWorksOpen && (
                <div
                  onClick={() => setIsHowItWorksOpen(false)}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn cursor-pointer"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-5 cursor-default"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-sm">
                          ?
                        </div>
                        <h3 className="text-base font-bold text-stone-900">
                          How Media & VTO Works
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsHowItWorksOpen(false)}
                        className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3.5 text-xs text-stone-600 leading-relaxed">
                      <div className="p-3 rounded-xl bg-[#faf8f5] border border-stone-200/80">
                        <strong className="block text-stone-900 mb-1">1. Color-Wise Photography:</strong>
                        Upload dedicated photography for each metal color (Rose Gold, White Gold, etc.). When customers switch color pills in the storefront, photos change dynamically.
                      </div>
                      <div className="p-3 rounded-xl bg-[#faf8f5] border border-stone-200/80">
                        <strong className="block text-stone-900 mb-1">2. 360 Spin & Videos:</strong>
                        Attach high-frame video clips for 360-degree rotation view on mobile & web.
                      </div>
                      <div className="p-3 rounded-xl bg-[#faf8f5] border border-stone-200/80">
                        <strong className="block text-stone-900 mb-1">3. Virtual Try-On (VTO):</strong>
                        Provide a transparent cutout PNG. Adjust vertical/horizontal positioning and scale against the target model environment (neck, hand, ear, wrist) so customers can preview it live on their skin tone!
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsHowItWorksOpen(false)}
                      className="w-full py-2.5 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Got it, thanks!
                    </button>
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
          {activeStep === 3 && (
            <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
              {/* Step Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {getStepPosition(3)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {isSilverProduct ? 'Silver' : 'Jewelry'} Specifications & Costing
                  </h3>
                  <p className="text-xs text-stone-500">
                    Add product weight, charges and pricing.
                  </p>
                </div>
              </div>

              {/* ─── Box 1: Metal Specifications ─── */}
              <div className="rounded-2xl border border-[#eee8df] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#faf5ee] border border-[#ecd9c2] flex items-center justify-center text-[#8b6f4e] shrink-0">
                    <HiOutlineCube className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Metal Specifications
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  {/* Metal Weight (g) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      Metal Weight (g)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={specs.metalWeight}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, metalWeight: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Making Charge (₹/g) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      Making Charge (₹/g)
                    </label>
                    <input
                      type="number"
                      value={specs.baseLabourCharge}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, baseLabourCharge: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Certificate Charge (₹) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      Certificate Charge (₹)
                    </label>
                    <input
                      type="number"
                      value={specs.certificateCharge}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, certificateCharge: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Box 2: Pricing & Commercial Margins ─── */}
              <div className="rounded-2xl border border-[#eee8df] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#faf5ee] border border-[#ecd9c2] flex items-center justify-center text-[#8b6f4e] shrink-0">
                      <HiOutlineCurrencyRupee className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Pricing & Commercial Margins
                    </h4>
                  </div>

                  {/* Info callout badge from screenshot */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcf6ee] border border-[#ebdcc9] text-[11px] font-medium text-[#8b6f4e]">
                    <HiOutlineInformationCircle className="w-4 h-4 text-[#8b6f4e] shrink-0" />
                    <span>Enter accurate pricing and markup to calculate final selling price.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  {/* MRP (Original ₹) * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                      MRP (Original ₹) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      value={pricing.mrp}
                      onChange={(e) => setPricing((prev) => ({ ...prev, mrp: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Sale Price (Selling ₹) * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                      Sale Price (Selling ₹) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      value={pricing.salePrice}
                      onChange={(e) =>
                        setPricing((prev) => ({
                          ...prev,
                          salePrice: e.target.value,
                          displayPrice: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Cost Price (Internal ₹) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      Cost Price (Internal ₹)
                    </label>
                    <input
                      type="number"
                      value={pricing.costPrice}
                      onChange={(e) => setPricing((prev) => ({ ...prev, costPrice: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Display Price (₹) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      Display Price (₹)
                    </label>
                    <input
                      type="number"
                      value={pricing.displayPrice}
                      onChange={(e) => setPricing((prev) => ({ ...prev, displayPrice: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Markup (%) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      Markup (%)
                    </label>
                    <input
                      type="number"
                      value={pricing.markupPercentage}
                      onChange={(e) => setPricing((prev) => ({ ...prev, markupPercentage: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
                    />
                  </div>

                  {/* GST Rate (%) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-900">
                      GST Rate (%)
                    </label>
                    <div className="relative">
                      <select
                        value={pricing.gstPercentage ?? 3}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPricing((prev) => ({ ...prev, gstPercentage: val }));
                          setSpecs((prev) => ({ ...prev, gstPercentage: val }));
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all appearance-none pr-8 cursor-pointer shadow-2xs"
                      >
                        <option value={0}>0</option>
                        <option value={1.5}>1.5</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={12}>12</option>
                        <option value={18}>18</option>
                      </select>
                      <HiOutlineChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              STEP 6: PRODUCT PREVIEW (DEDICATED FULL-WIDTH TAB)
          ════════════════════════════════════════════════════ */}
          {activeStep === 6 && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 shadow-2xs space-y-6 animate-fadeIn">
              {/* Tab Header & Quick Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs shadow-2xs">
                    {getStepPosition(6)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900">
                        Product Storefront Preview
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#e8dac7]">
                        Live Customer View
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Interactive simulation of how customers will see and purchase this product on the storefront.
                    </p>
                  </div>
                </div>

                {/* Quick Step Jump Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-stone-400 font-medium mr-1">Edit step:</span>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    1. Details
                  </button>
                  {!isSilverProduct && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                    >
                      2. Variants
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    {getStepPosition(3)}. Pricing
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    {getStepPosition(4)}. Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(5)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    {getStepPosition(5)}. Care & Specs
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(7)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    {getStepPosition(7)}. SEO
                  </button>
                </div>
              </div>

              {/* Main PDP Storefront Showcase (Luxury E-Commerce PDP Grid) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#fdfcfb] rounded-2xl p-4 sm:p-6 border border-stone-200/80">
                {/* Left Side: Interactive Gallery & Visuals */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Main Product Showcase Box */}
                  <div className="w-full h-80 sm:h-96 rounded-2xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden flex items-center justify-center relative p-6 group">
                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee]/90 backdrop-blur-xs text-[#8b6f4e] border border-[#e8dac7] shadow-2xs">
                        Royal Solitaire
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-stone-700 border border-stone-200 shadow-2xs">
                        Certified Natural
                      </span>
                    </div>

                    <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#8b6f4e] border border-stone-200 shadow-2xs flex items-center gap-1">
                        <IoSparklesOutline className="w-3 h-3" />
                        360° & VTO Ready
                      </span>
                    </div>

                    {/* Main High-Res Image */}
                    {(() => {
                      const activeColorImgs = mediaImages[activeColorPill] || [];
                      const allImgs = Object.values(mediaImages).flat();
                      const availableImgs = activeColorImgs.length > 0 ? activeColorImgs : allImgs;
                      const activeSrc = (previewImage && availableImgs.some((m) => m.url === previewImage))
                        ? previewImage
                        : availableImgs[0]?.url || '';

                      return activeSrc ? (
                        <>
                          <img
                            src={activeSrc}
                            alt={basicDetails.title || '—'}
                            className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Hover to zoom • Click thumbnail to switch angle
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 p-6 text-center">
                          <HiOutlinePhotograph className="w-16 h-16 stroke-1 mb-2 text-stone-300" />
                          <p className="text-xs font-semibold text-stone-500">No media uploaded yet</p>
                          <p className="text-[11px] text-stone-400 mt-1 max-w-xs">
                            Upload photos or videos for <span className="text-[#8b6f4e] font-semibold">{activeColorPill}</span> in Step 4 to see the live product showcase.
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Thumbnail Selector Strip */}
                  {(() => {
                    const activeColorImgs = mediaImages[activeColorPill] || [];
                    const allImgs = Object.values(mediaImages).flat();
                    const availableImgs = activeColorImgs.length > 0 ? activeColorImgs : allImgs;
                    const activeSrc = (previewImage && availableImgs.some((m) => m.url === previewImage))
                      ? previewImage
                      : availableImgs[0]?.url || '';

                    return availableImgs.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {availableImgs.map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPreviewImage(item.url)}
                            className={`aspect-square rounded-xl overflow-hidden border p-1 bg-white transition-all cursor-pointer group/thumb ${
                              activeSrc === item.url
                                ? 'border-2 border-[#8b6f4e] shadow-xs ring-2 ring-[#8b6f4e]/10'
                                : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={item.name || `View ${i + 1}`}
                              className="w-full h-full object-contain group-hover/thumb:scale-105 transition-transform"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Trust & Craftsmanship Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center flex-shrink-0">
                        <IoDiamondOutline className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-stone-800 leading-tight">IGI / GIA Certified</p>
                        <p className="text-[9.5px] text-stone-400 leading-tight">100% Conflict Free Diamond</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center flex-shrink-0">
                        <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-stone-800 leading-tight">BIS Hallmarked Gold</p>
                        <p className="text-[9.5px] text-stone-400 leading-tight">Lifetime Exchange & Buyback</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Product Details & Customer Buy Box */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Category & Collection */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8b6f4e] uppercase tracking-wider">
                      <span>Fine Jewelry</span>
                      <span>›</span>
                      <span>{basicDetails.category}</span>
                      <span>›</span>
                      <span>{selectedSubType?.name || '—'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                      {basicDetails.title}
                    </h2>
                    <p className="text-xs text-stone-400 flex items-center gap-2">
                      <span>SKU: {basicDetails.skuPrefix ? `${basicDetails.skuPrefix}-001` : 'NR-RING-001'}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                        {seo.stockStatus || '—'}
                      </span>
                      <span>•</span>
                      <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                        {platformVisibility.showInApp && platformVisibility.showOnWeb
                          ? 'App & Web'
                          : platformVisibility.showInApp
                          ? 'App Only'
                          : platformVisibility.showOnWeb
                          ? 'Web Only'
                          : 'Hidden'}
                      </span>
                    </p>
                  </div>

                  {/* Price Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-bold text-stone-900">
                        {Number(pricing.salePrice) > 0
                          ? `₹${Number(pricing.salePrice).toLocaleString()}`
                          : 'Price not set'}
                      </span>
                      {Number(pricing.mrp) > Number(pricing.salePrice) && (
                        <span className="text-xs text-stone-400 line-through">
                          ₹{Number(pricing.mrp).toLocaleString()}
                        </span>
                      )}
                      {Number(pricing.markupPercentage) > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {Number(pricing.markupPercentage)}% Markup
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metal Purity Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                      <span>Metal Purity:</span>
                      <span className="text-[#8b6f4e] font-semibold text-[11px]">
                        {selectedPurities.join(', ') || '—'}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {puritiesList.map((p) => {
                        const isSelected = selectedPurities.includes(p);
                        return (
                          <div
                            key={p}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-[#faf5ee] border-2 border-[#8b6f4e] text-[#8b6f4e] shadow-2xs'
                                : 'bg-white border border-stone-200 text-stone-400 opacity-60'
                            }`}
                          >
                            {p}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metal Color Swatches */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                      <span>Selected Metal Color:</span>
                      <span className="text-stone-800 font-semibold text-[11px]">
                        {activeColorPill}
                      </span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      {colorsList.map((c) => {
                        const isActive = activeColorPill === c.name;
                        const isAvailable = selectedColors.includes(c.name);

                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setActiveColorPill(c.name)}
                            disabled={!isAvailable}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                              isActive
                                ? 'border-[#8b6f4e] bg-[#faf6f0] text-[#8b6f4e] font-bold shadow-2xs'
                                : isAvailable
                                ? 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                                : 'border-stone-200/50 bg-stone-50 text-stone-400 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border shadow-xs"
                              style={{ backgroundColor: c.code, borderColor: c.border }}
                            />
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Center & Side Diamond Highlights */}
                  <div className="p-3 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-stone-100">
                      <span className="font-bold text-stone-800 flex items-center gap-1.5">
                        <IoDiamondOutline className="w-3.5 h-3.5 text-[#8b6f4e]" />
                        Diamond Specifications
                      </span>
                      <span className="text-[10px] font-semibold text-[#8b6f4e]">Certified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-[#fcfbf9] p-2 rounded-lg border border-stone-100">
                        <span className="text-stone-400 block text-[9.5px]">Center Stone</span>
                        <span className="font-bold text-stone-900 block">
                          {centerDiamond.caratWeight} Ct • {centerDiamond.shape}
                        </span>
                        <span className="text-stone-500 text-[10px]">
                          Color {centerDiamond.color} | Clarity {centerDiamond.clarity}
                        </span>
                      </div>

                      <div className="bg-[#fcfbf9] p-2 rounded-lg border border-stone-100">
                        <span className="text-stone-400 block text-[9.5px]">Side Stones</span>
                        <span className="font-bold text-stone-900 block">
                          {sideDiamonds.enabled ? `${sideDiamonds.pieces} pcs Pavé` : 'None'}
                        </span>
                        <span className="text-stone-500 text-[10px]">
                          {sideDiamonds.enabled
                            ? `${sideDiamonds.sizeFrom}-${sideDiamonds.sizeTo} Ct (${sideDiamonds.color}, ${sideDiamonds.clarity})`
                            : 'Solitaire Only'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Storefront Mock CTA Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-xs transition-all cursor-default"
                    >
                      <HiOutlineShoppingBag className="w-4 h-4" />
                      <span>Add to Shopping Bag</span>
                    </button>

                    <button
                      type="button"
                      className="py-2.5 px-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-default"
                    >
                      <IoSparklesOutline className="w-4 h-4 text-[#8b6f4e]" />
                      <span>Virtual Try-On</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Breakdown: 2 Cards (Specifications & Active Variants Matrix) */}
              <div className={`grid grid-cols-1 ${isSilverProduct ? '' : 'lg:grid-cols-2'} gap-4`}>
                {/* Product Specifications & Weights */}
                <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      {isSilverProduct ? 'Silver Technical Details' : 'Jewelry Technical Details'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                    >
                      Edit Specs
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">










                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Metal Weight</span>
                      <span className="font-bold text-stone-900 text-xs">{specs.metalWeight || '—'} gm</span>
                    </div>

                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Applicable GST</span>
                      <span className="font-bold text-stone-900 text-xs">{pricing.gstPercentage || specs.gstPercentage || '—'}%</span>
                    </div>
                  </div>

                  {/* Product Description */}
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      Story & Description
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed italic bg-[#faf9f7] p-2.5 rounded-lg border border-stone-100">
                      "{basicDetails.description}"
                    </p>
                  </div>
                </div>

                {!isSilverProduct && (
                <>
                {/* Generated Variants Summary */}
                <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                        All Generated Variants
                      </h4>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#e8dac7]">
                        {variants.length} Active
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                    >
                      Edit Variants
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-64 divide-y divide-stone-100">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-stone-400 text-[9.5px] uppercase border-b border-stone-100">
                          <th className="pb-1.5 font-semibold">SKU / Metal</th>
                          <th className="pb-1.5 font-semibold">Diamond</th>
                          <th className="pb-1.5 font-semibold text-right">Price</th>
                          <th className="pb-1.5 font-semibold text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {variants.map((v) => (
                          <tr key={v.id} className="hover:bg-stone-50/70">
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-stone-300 flex-shrink-0"
                                  style={{ backgroundColor: v.colorCode }}
                                />
                                <div>
                                  <span className="font-bold text-stone-800 block text-[11px]">
                                    {v.purity} • {v.color}
                                  </span>
                                  <span className="text-[9.5px] text-stone-400 font-mono">
                                    {v.sku}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-stone-600 text-[10px]">
                              {v.diamondDetails?.center || '—'}
                            </td>
                            <td className="py-2 text-right font-bold text-stone-900">
                              ₹{v.price}
                            </td>
                            <td className="py-2 text-right">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                {v.stock} pcs
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Product Information, Care & Custom Specs Preview (If Configured) */}
              {(careSections.length > 0 || specifications.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {careSections.length > 0 && (
                    <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-1.5">
                          <HiOutlineDocumentText className="w-3.5 h-3.5 text-[#8b6f4e]" />
                          <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                            Care & Information Sections
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(5)}
                          className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                        >
                          Edit Care
                        </button>
                      </div>
                      <div className="space-y-2">
                        {careSections.map((sec) => (
                          <div key={sec.id} className="p-2.5 rounded-lg bg-[#faf8f5] border border-stone-100 space-y-1">
                            <span className="text-xs font-bold text-stone-800 block">
                              {sec.header || '—'}
                            </span>
                            <p className="text-[11px] text-stone-600 whitespace-pre-line leading-relaxed">
                              {sec.description || 'No instructions provided.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {specifications.length > 0 && (
                    <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-1.5">
                          <TbListDetails className="w-3.5 h-3.5 text-[#8b6f4e]" />
                          <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                            Technical Specifications
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(5)}
                          className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                        >
                          Edit Specs
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {specifications.map((s) => (
                          <div key={s.id} className="bg-[#fcfbf9] p-2 rounded-lg border border-stone-100">
                            <span className="text-stone-400 block text-[9.5px] uppercase font-medium">{s.key || '—'}</span>
                            <span className="font-bold text-stone-900 text-xs">{s.value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 7: SEO & PUBLISH
          ════════════════════════════════════════════════════ */}
          {activeStep === 7 && (
            <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {getStepPosition(7)}
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
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <HiOutlineDocumentText className="w-3.5 h-3.5 text-stone-500" />
                <span>Save Draft</span>
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
    </div>
  );
}
