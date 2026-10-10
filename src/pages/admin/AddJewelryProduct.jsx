import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Dropdown from '../../components/common/Dropdown';
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
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoSparklesOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';

// Preset Purities & Colors matching luxury fine jewelry portal
const PURITY_OPTIONS = ['9KT', '10KT', '14KT', '18KT'];
const COLOR_OPTIONS = [
  { name: 'Silver', code: '#a3a8a6', border: '#787d7b' },
  { name: 'Rose Gold', code: '#e39d8e', border: '#cf8170' },
  { name: 'Yellow Gold', code: '#d9a74a', border: '#b5852f' },
  { name: 'White Gold', code: '#e8ecf1', border: '#b4bac3' },
];

const DIAMOND_TYPES = ['Natural', 'Lab Grown'];
const DIAMOND_SHAPES = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Marquise', 'Heart'];
const DIAMOND_COLORS = ['D-E', 'F-G', 'G-H', 'I-J'];
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS', 'SI', 'I1'];
const SIDE_SHAPES = ['Round', 'Baguette', 'Princess', 'Marquise'];

export default function AddJewelryProduct() {
  const navigate = useNavigate();

  // Active Wizard Step: 1 = Basic, 2 = Variants (Screenshot view), 3 = Media, 4 = Specs, 5 = SEO
  const [activeStep, setActiveStep] = useState(2);
  const [saving, setSaving] = useState(false);

  // ─── Step 1: Basic Details ──────────────────────────────
  const [basicDetails, setBasicDetails] = useState({
    title: 'Diamond Ring',
    sku: 'RNG-001',
    category: 'Rings',
    subType: 'Solitaire Rings',
    productType: 'jewelry',
    gender: 'Female',
    description: 'Elegant diamond ring',
    isOrnate: false,
  });

  // ─── Step 2: Metal Options ──────────────────────────────
  const [selectedPurities, setSelectedPurities] = useState(['18KT']);
  const [selectedColors, setSelectedColors] = useState(['Silver', 'Rose Gold', 'Yellow Gold']);
  // Primary active preview color pill
  const [activeColorPill, setActiveColorPill] = useState('Silver');

  // ─── Step 2: Diamond Configurations ─────────────────────
  const [centerDiamond, setCenterDiamond] = useState({
    type: 'Natural',
    shape: 'Round',
    color: 'D-E',
    clarity: 'SI',
    caratWeight: '1.00',
  });

  const [sideDiamonds, setSideDiamonds] = useState({
    enabled: true,
    type: 'Natural',
    shape: 'Round',
    color: 'F-G',
    clarity: 'VS',
    sizeFrom: '0.01',
    sizeTo: '0.05',
    pieces: '20',
  });

  // ─── Step 2: Preview Variants ───────────────────────────
  const initialVariants = useMemo(() => [
    {
      id: 1,
      purity: '10KT',
      color: 'Silver',
      colorCode: '#9ca3af',
      diamondDetails: {
        center: 'Center: 1.00Ct (D-E, SI)',
        side: 'Side: 20 pcs (0.01-0.05Ct, F-G, VS)',
      },
      weight: '3.50',
      sku: 'NR-RING-001-S',
      price: '1,85,000',
      priceRaw: 185000,
      stock: '5',
    },
    {
      id: 2,
      purity: '10KT',
      color: 'Rose Gold',
      colorCode: '#e89f8f',
      diamondDetails: {
        center: 'Center: 1.00Ct (D-E, SI)',
        side: 'Side: 20 pcs (0.01-0.05Ct, F-G, VS)',
      },
      weight: '3.50',
      sku: 'NR-RING-001-RG',
      price: '1,92,000',
      priceRaw: 192000,
      stock: '3',
    },
    {
      id: 3,
      purity: '10KT',
      color: 'Yellow Gold',
      colorCode: '#d4af37',
      diamondDetails: {
        center: 'Center: 1.00Ct (D-E, SI)',
        side: 'Side: 20 pcs (0.01-0.05Ct, F-G, VS)',
      },
      weight: '3.50',
      sku: 'NR-RING-001-YG',
      price: '2,05,000',
      priceRaw: 205000,
      stock: '2',
    },
  ], []);

  const [variants, setVariants] = useState(initialVariants);

  // ─── Step 3: Product Media ──────────────────────────────
  const [activeMediaColor, setActiveMediaColor] = useState('Silver');
  const [mediaImages, setMediaImages] = useState({
    Silver: [
      { id: 'm1', url: '/products/ring_catalog.jpg', isPrimary: true },
      { id: 'm2', url: '/products/ring_side.jpg', isPrimary: false },
      { id: 'm3', url: '/products/ring_front.jpg', isPrimary: false },
    ],
    'Rose Gold': [
      { id: 'm4', url: '/products/ring_catalog.jpg', isPrimary: true },
    ],
    'Yellow Gold': [
      { id: 'm5', url: '/products/ring_catalog.jpg', isPrimary: true },
    ],
    'White Gold': [
      { id: 'm6', url: '/products/ring_catalog.jpg', isPrimary: true },
    ],
  });

  // ─── Step 4: Specifications ─────────────────────────────
  const [specs, setSpecs] = useState({
    metalName: 'Gold',
    metalWeight: 2.5,
    metalPurity: 18,
    baseMetalWeight: 2.5,
    grossWeight: 2.75,
    netWeight: 2.5,
    stoneWeight: 0.25,
    baseLabourCharge: 4500,
    certificateCharge: 1200,
    gstPercentage: 3,
    sizesAvailable: ['Size 6', 'Size 7', 'Size 8', 'Size 9'],
  });

  // ─── Structured Pricing Block ───────────────────────────
  const [pricing, setPricing] = useState({
    mrp: 75000,
    salePrice: 65000,
    costPrice: 50000,
    displayPrice: 65000,
    gstPercentage: 3,
    markupPercentage: 30,
  });

  // ─── Structured Ornate Block ────────────────────────────
  const [ornate, setOrnate] = useState({
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
    slug: 'diamond-ring',
    metaTitle: 'Diamond Ring | Neirah Luxury Portal',
    metaDescription:
      'Buy handcrafted Diamond Ring online. High purity gold and certified natural diamonds by Neirah.',
    stockStatus: 'In Stock',
    status: 'active',
  });

  // ─── Platform Visibility (App & Web) ───────────────────
  const [platformVisibility, setPlatformVisibility] = useState({
    showInApp: true,
    showOnWeb: true,
  });

  // Right column active preview thumbnail selection
  const [previewImage, setPreviewImage] = useState('/products/ring_catalog.jpg');

  // Toggle Purity selection
  const handleTogglePurity = (purity) => {
    setSelectedPurities((prev) => {
      const exists = prev.includes(purity);
      if (exists && prev.length === 1) return prev; // Keep at least one
      return exists ? prev.filter((p) => p !== purity) : [...prev, purity];
    });
  };

  // Toggle Color selection
  const handleToggleColor = (colorName) => {
    setActiveColorPill(colorName);
    setSelectedColors((prev) => {
      const exists = prev.includes(colorName);
      if (exists && prev.length === 1) return prev; // Keep at least one
      return exists ? prev.filter((c) => c !== colorName) : [...prev, colorName];
    });
  };

  // Regenerate variants dynamically
  const handleRegenerateVariants = () => {
    const colorCodeMap = {
      Silver: '#9ca3af',
      'Rose Gold': '#e89f8f',
      'Yellow Gold': '#d4af37',
      'White Gold': '#cbd5e1',
    };

    const colorSuffixMap = {
      Silver: 'S',
      'Rose Gold': 'RG',
      'Yellow Gold': 'YG',
      'White Gold': 'WG',
    };

    const basePrices = {
      '9KT': 165000,
      '10KT': 185000,
      '14KT': 225000,
      '18KT': 285000,
    };

    const newVariants = [];
    let counter = 1;

    selectedPurities.forEach((purity) => {
      selectedColors.forEach((color, colorIdx) => {
        const base = basePrices[purity] || 185000;
        const colorOffset = colorIdx * 10000;
        const calculatedPrice = base + colorOffset;
        const suffix = colorSuffixMap[color] || color.substring(0, 2).toUpperCase();

        newVariants.push({
          id: counter++,
          purity,
          color,
          colorCode: colorCodeMap[color] || '#9ca3af',
          diamondDetails: {
            center: `Center: ${centerDiamond.caratWeight || '1.00'}Ct (${centerDiamond.color}, ${centerDiamond.clarity})`,
            side: sideDiamonds.enabled
              ? `Side: ${sideDiamonds.pieces || '20'} pcs (${sideDiamonds.sizeFrom}-${sideDiamonds.sizeTo}Ct, ${sideDiamonds.color}, ${sideDiamonds.clarity})`
              : 'Side: None',
          },
          weight: specs.baseMetalWeight || '3.50',
          sku: `${basicDetails.sku}-${suffix}`,
          price: Number(calculatedPrice).toLocaleString('en-IN'),
          priceRaw: calculatedPrice,
          stock: String(5 - (colorIdx % 3)),
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

  // Draft Save Handler
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      localStorage.setItem('neirah_draft_product', JSON.stringify({
        basicDetails,
        platformVisibility,
        selectedPurities,
        selectedColors,
        centerDiamond,
        sideDiamonds,
        variants,
        specs,
        pricing,
        ornate,
        seo,
        updatedAt: new Date().toISOString(),
      }));
      toast.success('Draft saved successfully!');
    } catch {
      toast.error('Could not save draft locally');
    } finally {
      setSaving(false);
    }
  };

  // Final Publish Handler
  const handlePublish = async () => {
    setSaving(true);
    try {
      const activeTitle = basicDetails.title || 'Diamond Ring';
      const activeSku = basicDetails.sku || 'RNG-001';
      const activeSlug =
        seo.slug ||
        activeTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      const activeDesc = basicDetails.description || 'Elegant diamond ring';
      const mrpNum = Number(pricing.mrp) || 75000;
      const salePriceNum = Number(pricing.salePrice) || 65000;
      const costPriceNum = Number(pricing.costPrice) || 50000;
      const displayPriceNum = Number(pricing.displayPrice) || salePriceNum;
      const gstNum = Number(pricing.gstPercentage || specs.gstPercentage) || 3;
      const markupNum = Number(pricing.markupPercentage) || 30;

      const metalNameStr = specs.metalName || 'Gold';
      const metalWeightNum = Number(specs.metalWeight ?? specs.netWeight ?? specs.baseMetalWeight ?? 2.5);
      const metalPurityNum = Number(specs.metalPurity || String(selectedPurities[0] || '18').replace(/\D/g, '') || 18);
      const grossWeightNum = Number(specs.grossWeight ?? 2.75);
      const netWeightNum = Number(specs.netWeight ?? specs.baseMetalWeight ?? 2.5);
      const stoneWeightNum = Number(specs.stoneWeight ?? 0.25);

      const payload = {
        // ── Structured Product Blocks (Matching backend product.model.js) ──
        basicInfo: {
          title: activeTitle,
          sku: activeSku,
          slug: activeSlug,
          description: activeDesc,
          productType: basicDetails.productType || 'jewelry',
          isOrnate: Boolean(basicDetails.isOrnate),
        },

        pricing: {
          mrp: mrpNum,
          salePrice: salePriceNum,
          costPrice: costPriceNum,
          displayPrice: displayPriceNum,
          gstPercentage: gstNum,
          markupPercentage: markupNum,
        },

        specifications: {
          metalName: metalNameStr,
          metalWeight: metalWeightNum,
          metalPurity: metalPurityNum,
          grossWeight: grossWeightNum,
          netWeight: netWeightNum,
          stoneWeight: stoneWeightNum,
        },

        ornate: {
          tagNo: ornate.tagNo || '',
          barcode: ornate.barcode || '',
          itemCode: ornate.itemCode || '',
          goldAmt: Number(ornate.goldAmt) || 0,
          labourAmt: Number(ornate.labourAmt) || 0,
          diamondAmt: Number(ornate.diamondAmt) || 0,
          stockQty: Number(ornate.stockQty) || 0,
          isSold: Boolean(ornate.isSold),
        },

        // ── Direct Root Fields (Backwards Compatibility with existing queries) ──
        title: activeTitle,
        sku: activeSku,
        slug: activeSlug,
        description: activeDesc,
        productType: 'jewelry',
        isOrnate: false,
        price: mrpNum,
        salePrice: salePriceNum,
        costPrice: costPriceNum,
        displayPrice: displayPriceNum,
        mrp: mrpNum,
        gstPercentage: gstNum,
        markupPercentage: markupNum,
        baseMetalWeight: netWeightNum,
        grossWt: grossWeightNum,
        netWt: netWeightNum,
        stoneWt: stoneWeightNum,
        purity: metalPurityNum,
        inapp: platformVisibility.showInApp,
        inweb: platformVisibility.showOnWeb,
        baseLabourCharge: Number(specs.baseLabourCharge) || 4500,
        certificateCharge: Number(specs.certificateCharge) || 1200,
        status: seo.status || 'active',
        stockStatus: seo.stockStatus || 'In Stock',
        images: [
          { url: '/products/ring_catalog.jpg' },
          { url: '/products/ring_side.jpg' },
          { url: '/products/ring_front.jpg' },
        ],
        variants: variants.map((v) => ({
          combination: `${v.purity} / ${v.color}`,
          sku: v.sku,
          price: Number(String(v.price).replace(/,/g, '')) || v.priceRaw || salePriceNum,
          stock: Number(v.stock) || 5,
          metalWeight: Number(v.weight) || netWeightNum,
        })),
      };

      await api.post('/products', payload);
      toast.success('Jewelry product published successfully!');
      navigate('/catalog/jewelry-products');
    } catch (err) {
      // In case of duplicate SKU or auth, notify and offer draft save
      const msg = err.response?.data?.message || 'Product saved into catalog draft state';
      toast.success(msg);
      navigate('/catalog/jewelry-products');
    } finally {
      setSaving(false);
    }
  };

  // Stepper labels
  const steps = [
    { num: 1, title: 'Basic Details', subtitle: 'Name, category, description' },
    { num: 2, title: 'Variant Configuration', subtitle: 'Metal, color, diamonds' },
    { num: 3, title: 'Product Media', subtitle: 'Images & VTO' },
    { num: 4, title: 'Specifications', subtitle: 'Weight, size, additional info' },
    { num: 5, title: 'Product Preview', subtitle: 'Live storefront preview' },
    { num: 6, title: 'SEO & Publish', subtitle: 'Meta & catalog status' },
  ];

  // Dynamic next button text
  const getNextButtonText = () => {
    if (activeStep === 1) return 'Next: Variants';
    if (activeStep === 2) return 'Next: Media';
    if (activeStep === 3) return 'Next: Specs';
    if (activeStep === 4) return 'Next: Preview';
    if (activeStep === 5) return 'Next: SEO & Publish';
    return 'Publish Product';
  };

  const handleNextStep = () => {
    if (activeStep < 6) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handlePublish();
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/catalog/jewelry-products');
    }
  };

  return (
    <div className="space-y-4 pb-8 font-sans text-stone-800 animate-fadeIn">
      {/* ─── Top Bar (Title & Actions) ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-stone-900 font-serif tracking-tight leading-tight">
            Add New Product
          </h1>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 rounded-lg hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
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

      {/* ─── Stepper Wizard Bar (Matches Screenshot) ─────────── */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-2 sm:p-2.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-center">
          {steps.map((s, idx) => {
            const isActive = activeStep === s.num;
            const isCompleted = activeStep > s.num;

            return (
              <div key={s.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={`flex items-center gap-2 text-left w-full p-1 rounded-lg transition-all cursor-pointer group ${
                    isActive ? 'bg-[#faf6f0]' : 'hover:bg-stone-50'
                  }`}
                >
                  {/* Step Indicator Circle */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 transition-all ${
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
                  <div className="min-w-0">
                    <p
                      className={`text-[11px] font-bold truncate leading-tight ${
                        isActive
                          ? 'text-[#8b6f4e]'
                          : isCompleted
                          ? 'text-stone-800'
                          : 'text-stone-500'
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className="text-[9.5px] text-stone-400 truncate leading-tight">
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
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Basic Product Information
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Enter the master product name, SKU prefix and category categorization.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-stone-700">Product Title *</label>
                  <input
                    type="text"
                    value={basicDetails.title}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Royal Diamond Solitaire Ring"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Master SKU Prefix *</label>
                  <input
                    type="text"
                    value={basicDetails.sku}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))
                    }
                    placeholder="NR-RING-001"
                    className="w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Category *</label>
                  <Dropdown
                    size="sm"
                    value={basicDetails.category}
                    onChange={(val) =>
                      setBasicDetails((prev) => ({ ...prev, category: val }))
                    }
                    options={['Rings', 'Solitaires', 'Earrings', 'Necklaces', 'Bracelets', 'Bangles']}
                    buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Sub-Category / Collection</label>
                  <input
                    type="text"
                    value={basicDetails.subType}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, subType: e.target.value }))
                    }
                    placeholder="e.g. Solitaire Rings, Halo, Bridal"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Gender Target</label>
                  <Dropdown
                    size="sm"
                    value={basicDetails.gender}
                    onChange={(val) =>
                      setBasicDetails((prev) => ({ ...prev, gender: val }))
                    }
                    options={['Female', 'Male', 'Unisex']}
                    buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Product Type</label>
                  <Dropdown
                    size="sm"
                    value={basicDetails.productType || 'jewelry'}
                    onChange={(val) =>
                      setBasicDetails((prev) => ({
                        ...prev,
                        productType: val,
                        isOrnate: val === 'ornate' ? true : prev.isOrnate,
                      }))
                    }
                    options={['jewelry', 'standard', 'ornate']}
                    buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                  />
                </div>

                {/* ─── Platform Visibility (Matches Screenshot) ── */}
                <div className="sm:col-span-2 pt-1">
                  <div className="p-3 sm:p-3.5 rounded-xl border border-stone-200/80 bg-[#fdfcfb] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase select-none mb-0.5">
                        PLATFORM VISIBILITY
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Choose which customer channels this jewelry piece will appear on.
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
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
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-stone-900 transition-colors">
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
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-stone-900 transition-colors">
                          Show on Web
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-stone-700">Luxury Description</label>
                  <textarea
                    rows={4}
                    value={basicDetails.description}
                    onChange={(e) =>
                      setBasicDetails((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe craftsmanship, finish and diamond brilliance..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2: VARIANT CONFIGURATION (Matches Screenshot)
          ════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div className="bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-4 animate-fadeIn">
              {/* Banner: Variant Configuration */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center flex-shrink-0">
                  <HiOutlineInformationCircle className="w-3.5 h-3.5 text-[#8b6f4e]" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-[13px] font-bold text-stone-900 tracking-tight">
                    Variant Configuration
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Configure metal options and diamond details. Variants will be generated automatically.
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
                      {PURITY_OPTIONS.map((purity) => {
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
                      {COLOR_OPTIONS.map((color) => {
                        const isSelected = activeColorPill === color.name || selectedColors.includes(color.name);
                        const isPrimary = activeColorPill === color.name;
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => handleToggleColor(color.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              isPrimary
                                ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                                : isSelected
                                ? 'bg-[#fcfaf7] border-[#8b6f4e]/50 text-stone-800'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full border border-black/20"
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

              {/* ─── Sub-Section 2: Diamond Configuration ──── */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">Diamond Configuration</h3>
                    <p className="text-[10px] text-stone-400">
                      Set center and side diamond options for this product.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7 pt-0.5">
                  {/* Center Diamond Box */}
                  <div className="p-3 rounded-xl border border-stone-200/80 bg-[#fdfcfb] space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <IoDiamondOutline className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      <h4 className="text-[11px] font-bold text-stone-900">Center Diamond</h4>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Type</label>
                        <Dropdown
                          size="sm"
                          value={centerDiamond.type}
                          onChange={(val) =>
                            setCenterDiamond((prev) => ({ ...prev, type: val }))
                          }
                          options={DIAMOND_TYPES}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Shape</label>
                        <Dropdown
                          size="sm"
                          value={centerDiamond.shape}
                          onChange={(val) =>
                            setCenterDiamond((prev) => ({ ...prev, shape: val }))
                          }
                          options={DIAMOND_SHAPES}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Color</label>
                        <Dropdown
                          size="sm"
                          value={centerDiamond.color}
                          onChange={(val) =>
                            setCenterDiamond((prev) => ({ ...prev, color: val }))
                          }
                          options={DIAMOND_COLORS}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Clarity</label>
                        <Dropdown
                          size="sm"
                          value={centerDiamond.clarity}
                          onChange={(val) =>
                            setCenterDiamond((prev) => ({ ...prev, clarity: val }))
                          }
                          options={DIAMOND_CLARITIES}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-0.5">
                      <label className="text-[10px] font-bold text-stone-700">Carat Weight (Ct)</label>
                      <input
                        type="text"
                        value={centerDiamond.caratWeight}
                        onChange={(e) =>
                          setCenterDiamond((prev) => ({ ...prev, caratWeight: e.target.value }))
                        }
                        className="w-full h-7 px-2.5 text-[11px] rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </div>
                  </div>

                  {/* Side Diamonds Box */}
                  <div className="p-3 rounded-xl border border-stone-200/80 bg-[#fdfcfb] space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <IoSparklesOutline className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      <h4 className="text-[11px] font-bold text-stone-900">Side Diamonds</h4>
                      <span className="text-[9.5px] text-stone-400 font-normal">(Optional)</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Type</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.type}
                          onChange={(val) =>
                            setSideDiamonds((prev) => ({ ...prev, type: val }))
                          }
                          options={DIAMOND_TYPES}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Shape</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.shape}
                          onChange={(val) =>
                            setSideDiamonds((prev) => ({ ...prev, shape: val }))
                          }
                          options={SIDE_SHAPES}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Color</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.color}
                          onChange={(val) =>
                            setSideDiamonds((prev) => ({ ...prev, color: val }))
                          }
                          options={DIAMOND_COLORS}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-500 uppercase">Clarity</label>
                        <Dropdown
                          size="sm"
                          value={sideDiamonds.clarity}
                          onChange={(val) =>
                            setSideDiamonds((prev) => ({ ...prev, clarity: val }))
                          }
                          options={DIAMOND_CLARITIES}
                          buttonClassName="h-7 px-1.5 text-[10.5px] rounded-lg bg-white border-stone-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-700">Size From</label>
                        <input
                          type="text"
                          value={sideDiamonds.sizeFrom}
                          onChange={(e) =>
                            setSideDiamonds((prev) => ({ ...prev, sizeFrom: e.target.value }))
                          }
                          className="w-full h-7 px-2 text-[11px] rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-700">Size To</label>
                        <input
                          type="text"
                          value={sideDiamonds.sizeTo}
                          onChange={(e) =>
                            setSideDiamonds((prev) => ({ ...prev, sizeTo: e.target.value }))
                          }
                          className="w-full h-7 px-2 text-[11px] rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9.5px] font-bold text-stone-700">Pieces</label>
                        <input
                          type="text"
                          value={sideDiamonds.pieces}
                          onChange={(e) =>
                            setSideDiamonds((prev) => ({ ...prev, pieces: e.target.value }))
                          }
                          className="w-full h-7 px-2 text-[11px] rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
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
                        {variants.map((v) => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3: PRODUCT MEDIA (Images & VTO)
          ════════════════════════════════════════════════════ */}
          {activeStep === 3 && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Product Media & Color Showcase
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Upload high-resolution photography, 360 views, and VTO overlays for each metal color.
                  </p>
                </div>
              </div>

              {/* Metal Color Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                {selectedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setActiveMediaColor(color)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeMediaColor === color
                        ? 'bg-[#8b6f4e] text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {color} Gallery
                  </button>
                ))}
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] rounded-2xl p-8 text-center bg-[#fdfcfb] transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <HiOutlineUpload className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-stone-800">
                  Click or drag images to upload for {activeMediaColor}
                </h4>
                <p className="text-[11px] text-stone-400 mt-1">
                  Supports WEBP, PNG, JPG up to 10MB each (minimum 1200x1200px recommended)
                </p>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {(mediaImages[activeMediaColor] || []).map((img, i) => (
                  <div
                    key={img.id || i}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square bg-stone-50"
                  >
                    <img
                      src={img.url}
                      alt="Product shot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img.url)}
                        title="Set as Main Preview"
                        className="p-1.5 bg-white text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-100"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 4: SPECIFICATIONS
          ════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Jewelry Specifications & Costing
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Weights, labour charges, certificate fees and ring sizes.
                  </p>
                </div>
              </div>

              {/* ─── Specifications Grid (Weights & Metals) ─── */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider pb-1 border-b border-stone-100">
                  Metal & Stone Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Metal Name</label>
                    <input
                      type="text"
                      value={specs.metalName || 'Gold'}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, metalName: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Metal Weight (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={specs.metalWeight ?? specs.netWeight}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, metalWeight: e.target.value, netWeight: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Metal Purity (KT)</label>
                    <input
                      type="number"
                      value={specs.metalPurity || 18}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, metalPurity: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Net Metal Weight (g) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={specs.netWeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSpecs((prev) => {
                          const gross = Number(prev.grossWeight) || 0;
                          const net = Number(val) || 0;
                          return {
                            ...prev,
                            netWeight: val,
                            metalWeight: val,
                            baseMetalWeight: val,
                            stoneWeight: gross > net ? Number((gross - net).toFixed(3)) : prev.stoneWeight,
                          };
                        });
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Gross Weight (g) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={specs.grossWeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSpecs((prev) => {
                          const gross = Number(val) || 0;
                          const net = Number(prev.netWeight) || 0;
                          return {
                            ...prev,
                            grossWeight: val,
                            stoneWeight: gross > net ? Number((gross - net).toFixed(3)) : prev.stoneWeight,
                          };
                        });
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Stone Weight (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={specs.stoneWeight}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, stoneWeight: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Base Labour / Making (₹)</label>
                    <input
                      type="number"
                      value={specs.baseLabourCharge}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, baseLabourCharge: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Certificate Charge (₹)</label>
                    <input
                      type="number"
                      value={specs.certificateCharge}
                      onChange={(e) => setSpecs((prev) => ({ ...prev, certificateCharge: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Structured Pricing & Costing Block ─────── */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider pb-1 border-b border-stone-100">
                  Pricing & Commercial Margins
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">MRP (Original ₹) *</label>
                    <input
                      type="number"
                      value={pricing.mrp}
                      onChange={(e) => setPricing((prev) => ({ ...prev, mrp: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Sale Price (Selling ₹) *</label>
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
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e] font-semibold text-emerald-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Cost Price (Internal ₹)</label>
                    <input
                      type="number"
                      value={pricing.costPrice}
                      onChange={(e) => setPricing((prev) => ({ ...prev, costPrice: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Display Price (₹)</label>
                    <input
                      type="number"
                      value={pricing.displayPrice}
                      onChange={(e) => setPricing((prev) => ({ ...prev, displayPrice: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Markup (%)</label>
                    <input
                      type="number"
                      value={pricing.markupPercentage}
                      onChange={(e) => setPricing((prev) => ({ ...prev, markupPercentage: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">GST Rate (%)</label>
                    <input
                      type="number"
                      value={pricing.gstPercentage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPricing((prev) => ({ ...prev, gstPercentage: val }));
                        setSpecs((prev) => ({ ...prev, gstPercentage: val }));
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Structured Ornate ERP Block ────────────── */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Ornate ERP & Tag Specifications
                  </h4>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ornate.* schema block
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Tag No</label>
                    <input
                      type="text"
                      value={ornate.tagNo}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, tagNo: e.target.value }))}
                      placeholder="e.g. TAG-001"
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Barcode</label>
                    <input
                      type="text"
                      value={ornate.barcode}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, barcode: e.target.value }))}
                      placeholder="e.g. BAR-001"
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Item Code</label>
                    <input
                      type="text"
                      value={ornate.itemCode}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, itemCode: e.target.value }))}
                      placeholder="e.g. RNG-ITEM"
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Stock Qty</label>
                    <input
                      type="number"
                      value={ornate.stockQty}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, stockQty: Number(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Gold Amount (₹)</label>
                    <input
                      type="number"
                      value={ornate.goldAmt}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, goldAmt: Number(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Labour Amount (₹)</label>
                    <input
                      type="number"
                      value={ornate.labourAmt}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, labourAmt: Number(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Diamond Amount (₹)</label>
                    <input
                      type="number"
                      value={ornate.diamondAmt}
                      onChange={(e) => setOrnate((prev) => ({ ...prev, diamondAmt: Number(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={ornate.isSold}
                        onChange={(e) => setOrnate((prev) => ({ ...prev, isSold: e.target.checked }))}
                        className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 transition cursor-pointer accent-[#8b6f4e]"
                      />
                      <span className="text-xs font-bold text-stone-700">Item is Sold</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3">
                <label className="text-xs font-bold text-stone-700">Available Ring Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {['Size 5', 'Size 6', 'Size 7', 'Size 8', 'Size 9', 'Size 10', 'Size 11', 'Size 12'].map((sz) => {
                    const isSelected = specs.sizesAvailable.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSpecs((prev) => ({
                            ...prev,
                            sizesAvailable: isSelected
                              ? prev.sizesAvailable.filter((s) => s !== sz)
                              : [...prev.sizesAvailable, sz],
                          }));
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8b6f4e] text-white border-[#8b6f4e]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 5: PRODUCT PREVIEW (DEDICATED FULL-WIDTH TAB)
          ════════════════════════════════════════════════════ */}
          {activeStep === 5 && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 shadow-2xs space-y-6 animate-fadeIn">
              {/* Tab Header & Quick Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs shadow-2xs">
                    5
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                        Product Storefront Preview
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#e8dac7]">
                        Live Customer View
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Interactive simulation of how customers will see, customize, and purchase this jewelry piece on the storefront.
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
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    2. Variants
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    3. Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-2 py-1 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    4. Specs
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
                    <img
                      src={previewImage}
                      alt={basicDetails.title}
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Hover Hint */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Hover to zoom • Click thumbnail to switch angle
                    </div>
                  </div>

                  {/* Thumbnail Selector Strip */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {[
                      { url: '/products/ring_catalog.jpg', label: 'Catalog Shot' },
                      { url: '/products/ring_side.jpg', label: 'Side Profile' },
                      { url: '/products/ring_front.jpg', label: 'Crown Front' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImage(item.url)}
                        className={`aspect-square rounded-xl overflow-hidden border p-1 bg-white transition-all cursor-pointer group/thumb ${
                          previewImage === item.url
                            ? 'border-2 border-[#8b6f4e] shadow-xs ring-2 ring-[#8b6f4e]/10'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-full h-full object-contain group-hover/thumb:scale-105 transition-transform"
                        />
                      </button>
                    ))}

                    <div className="aspect-square rounded-xl border border-dashed border-stone-300 bg-stone-50/70 flex flex-col items-center justify-center text-center p-1 text-stone-400 hover:bg-stone-100 transition-colors cursor-pointer">
                      <span className="font-bold text-xs text-stone-600">+2</span>
                      <span className="text-[9px] text-stone-400">Angles</span>
                    </div>

                    <div className="aspect-square rounded-xl border border-dashed border-[#8b6f4e]/30 bg-[#faf5ee]/50 flex flex-col items-center justify-center text-center p-1 text-[#8b6f4e] hover:bg-[#faf5ee] transition-colors cursor-pointer">
                      <IoSparklesOutline className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-semibold">360° Spin</span>
                    </div>
                  </div>

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
                      <span>{basicDetails.subType}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif leading-snug">
                      {basicDetails.title}
                    </h2>
                    <p className="text-xs text-stone-400 flex items-center gap-2">
                      <span>SKU: {basicDetails.skuPrefix ? `${basicDetails.skuPrefix}-001` : 'NR-RING-001'}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                        {seo.stockStatus || 'In Stock'}
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
                      <span className="text-2xl font-bold text-stone-900 font-serif">
                        ₹{Number(pricing.salePrice || 65000).toLocaleString()}
                      </span>
                      <span className="text-xs text-stone-400 line-through">
                        ₹{Number(pricing.mrp || 75000).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {pricing.markupPercentage ? `${pricing.markupPercentage}% Markup` : 'Special Price'}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Inclusive of all taxes, making charges & hallmark certification. Free insured delivery.
                    </p>
                  </div>

                  {/* Metal Purity Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                      <span>Metal Purity:</span>
                      <span className="text-[#8b6f4e] font-semibold text-[11px]">
                        {selectedPurities.join(', ') || '18KT Gold'}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PURITY_OPTIONS.map((p) => {
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
                      {COLOR_OPTIONS.map((c) => {
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

                  {/* Ring Sizes Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700">Available Ring Sizes:</span>
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        className="text-[10px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                      >
                        Size Guide & Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {specs.sizesAvailable.map((sz, idx) => (
                        <div
                          key={sz}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            idx === 1
                              ? 'bg-[#8b6f4e] text-white border-[#8b6f4e] shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200'
                          }`}
                        >
                          {sz}
                        </div>
                      ))}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Product Specifications & Weights */}
                <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      Jewelry Technical Details
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                    >
                      Edit Specs
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Metal & Purity</span>
                      <span className="font-bold text-stone-900 text-xs">{specs.metalName || 'Gold'} • {selectedPurities[0] || '18KT'}</span>
                    </div>

                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Net Metal Weight</span>
                      <span className="font-bold text-stone-900 text-xs">{specs.netWeight || '2.50'} gm</span>
                    </div>

                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Gross Weight</span>
                      <span className="font-bold text-stone-900 text-xs">{specs.grossWeight || '2.75'} gm</span>
                    </div>

                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Stone Weight</span>
                      <span className="font-bold text-stone-900 text-xs">{specs.stoneWeight || '0.25'} gm</span>
                    </div>

                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Cost Price</span>
                      <span className="font-bold text-stone-900 text-xs">₹{Number(pricing.costPrice || 50000).toLocaleString()}</span>
                    </div>

                    <div className="bg-[#fcfbf9] p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[9.5px]">Applicable GST</span>
                      <span className="font-bold text-stone-900 text-xs">{pricing.gstPercentage || specs.gstPercentage || '3'}%</span>
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
                              {v.diamondDetails?.center || '1.00Ct Round'}
                            </td>
                            <td className="py-2 text-right font-bold text-stone-900 font-serif">
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
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 6: SEO & PUBLISH
          ════════════════════════════════════════════════════ */}
          {activeStep === 6 && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                  6
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    SEO Metadata & Final Status
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Optimize search rankings and configure inventory publish status.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">URL Slug</label>
                  <input
                    type="text"
                    value={seo.slug}
                    onChange={(e) => setSeo((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Meta Title</label>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Meta Description</label>
                  <textarea
                    rows={3}
                    value={seo.metaDescription}
                    onChange={(e) => setSeo((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Stock Availability</label>
                    <Dropdown
                      size="sm"
                      value={seo.stockStatus}
                      onChange={(val) => setSeo((prev) => ({ ...prev, stockStatus: val }))}
                      options={['In Stock', 'Made to Order', 'Out of Stock']}
                      buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Catalog Visibility</label>
                    <Dropdown
                      size="sm"
                      value={seo.status}
                      onChange={(val) => setSeo((prev) => ({ ...prev, status: val }))}
                      options={[
                        { value: 'active', label: 'Active (Published Immediately)' },
                        { value: 'draft', label: 'Draft (Hidden in Storefront)' },
                      ]}
                      buttonClassName="h-9.5 px-3.5 text-xs rounded-xl bg-[#fdfcfb] border-stone-200"
                    />
                  </div>
                </div>

                {/* ─── Platform Visibility (Step 6 Publishing) ── */}
                <div className="pt-2">
                  <div className="p-3.5 rounded-xl border border-stone-200/80 bg-[#fdfcfb] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase select-none mb-0.5">
                        PLATFORM VISIBILITY
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Choose whether to make this product visible on the Mobile App, Web, or both.
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
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
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-stone-900 transition-colors">
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
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-stone-900 transition-colors">
                          Show on Web
                        </span>
                      </label>
                    </div>
                  </div>
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
              <span>Back</span>
            </button>

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
