import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Dropdown from '../../components/common/Dropdown';
import useCategoryLookup from '../../hooks/useCategoryLookup';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineX,
} from 'react-icons/hi';
import {
  IoDiamondOutline,
  IoColorPaletteOutline,
  IoCheckmarkCircle,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { TbCoins, TbScale, TbDatabase, TbListDetails } from 'react-icons/tb';

// Color master list matching Neirah luxury ERP palette
const COLOR_OPTIONS = [
  { name: 'Black', hex: '#111827', border: '#374151', text: 'text-stone-900' },
  { name: 'Brown', hex: '#795548', border: '#5d4037', text: 'text-stone-900' },
  { name: 'SILVER', hex: '#c0c0c0', border: '#9ca3af', text: 'text-stone-900' },
  { name: 'White Gold', hex: '#e8ecf1', border: '#cbd5e1', text: 'text-stone-900' },
  { name: 'Rose Gold', hex: '#e39d8e', border: '#cf8170', text: 'text-stone-900' },
  { name: 'Yellow Gold', hex: '#d9a74a', border: '#b5852f', text: 'text-stone-900' },
];

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
  { value: 'draft', label: 'Draft (Hidden)' },
  { value: 'active', label: 'Active' },
  { value: 'approved', label: 'Approved' },
  { value: 'inactive', label: 'Inactive' },
];

const STOCK_STATUS_OPTIONS = [
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'Made to Order', label: 'Made to Order' },
];

export default function OrnateProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== 'add' && id !== 'new');

  // Wizard tab state: 1 to 7
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Dropdown options loaded from backend
  const { categoryOptions: categories } = useCategoryLookup();
  const [menuItems, setMenuItems] = useState([]);

  // ─── 1. Base Information ───────────────────────────────────
  const [baseInfo, setBaseInfo] = useState({
    title: '',
    category: '',
    categoryTag: 'No Banner Tag',
    menuItem: '',
    targetGender: 'Unisex',
    gstPercentage: 3,
    status: 'draft',
    stockStatus: 'In Stock',
    showInApp: true,
    showOnWeb: true,
    description: '',
  });

  // ─── 2. Pricing & Inventory ────────────────────────────────
  const [pricing, setPricing] = useState({
    costPrice: 4000,
    markupPercentage: 10,
    calculatedPrice: 4400,
    salePrice: 4529,
    mrpMarkupPercentage: 0,
    mrp: 5529,
  });

  // ─── 3. Variant Configuration (Colors) ─────────────────────
  const [selectedColors, setSelectedColors] = useState(['SILVER']);

  // ─── 4. Weights & Purities ─────────────────────────────────
  const [weights, setWeights] = useState({
    grossWeight: 9.23,
    netWeight: 9.23,
    purity: 92.5,
    caratCategory: '925SL',
  });

  // ─── 5. Classification & ERP Details ───────────────────────
  const [erpDetails, setErpDetails] = useState({
    customGroupName: '92.5 BRACELET',
    itemName: '92.5 BRACELET',
    groupName: '92.5 SILVER ORNAMENT',
    varietyName: 'HEAVY WT 925',
    metalName: 'SILVER',
    uniqueLabelId: '1000000220165',
    barcodeNumber: '1000000220124',
    labelNumber: '925SL/911',
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

  // Load Menu Items on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const menuRes = await api.get('/menu-items?limit=100').catch(() => ({ data: { data: [] } }));
        const rawMenus = menuRes.data?.data?.items || menuRes.data?.data || [];
        setMenuItems(
          rawMenus.map((m) => ({
            value: m._id || m.id,
            label: m.title || m.name,
          }))
        );
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
            title: product.title || product.basicInfo?.title || '',
            category: Array.isArray(product.category)
              ? (product.category[0]?._id || product.category[0] || '')
              : (product.category?._id || product.category || ''),
            categoryTag: (Array.isArray(product.promoBanner) && product.promoBanner[0]) || product.categoryTag || 'No Banner Tag',
            menuItem: Array.isArray(product.menuItem)
              ? (product.menuItem[0]?._id || product.menuItem[0] || '')
              : (product.menuItem?._id || product.menuItem || ''),
            targetGender: (Array.isArray(product.gender) && product.gender[0]) || product.gender || 'Unisex',
            gstPercentage: product.gstPer ?? product.gstPercentage ?? product.pricing?.gstPercentage ?? 3,
            status: product.status || 'draft',
            stockStatus: product.stockStatus || 'In Stock',
            showInApp: product.inapp !== undefined ? product.inapp : true,
            showOnWeb: product.inweb !== undefined ? product.inweb : true,
            description: product.description || product.basicInfo?.description || '',
          });

          // Populate Pricing
          const cost = Number(product.costPrice ?? product.pricing?.costPrice ?? 0);
          const markup = Number(product.markupPercentage ?? product.pricing?.markupPercentage ?? 0);
          const calcPrice = Number(product.calculatedPrice ?? (cost > 0 ? cost + (cost * markup) / 100 : 0));
          const sale = Number(product.salePrice ?? product.salesPrice ?? product.pricing?.salePrice ?? calcPrice);
          const mrpVal = Number(product.mrp ?? product.price ?? product.pricing?.mrp ?? sale);

          setPricing({
            costPrice: cost,
            markupPercentage: markup,
            calculatedPrice: calcPrice,
            salePrice: sale,
            mrpMarkupPercentage: product.mrpMarkupPercentage || 0,
            mrp: mrpVal,
          });

          // Populate Colors
          if (Array.isArray(product.metalColors) && product.metalColors.length > 0) {
            const colorNames = product.metalColors.map((mc) =>
              typeof mc === 'object' && mc !== null ? mc.name : mc
            );
            setSelectedColors(colorNames.filter(Boolean));
          } else if (product.color) {
            setSelectedColors([product.color]);
          }

          // Populate Weights & Purities
          setWeights({
            grossWeight: Number(product.grossWt ?? product.specifications?.grossWeight ?? 0),
            netWeight: Number(product.netWt ?? product.specifications?.netWeight ?? 0),
            purity: Number(product.purity ?? product.specifications?.metalPurity ?? 0),
            caratCategory: product.carat || product.specifications?.caratCategory || '925SL',
          });

          // Populate Classification & ERP Details
          setErpDetails({
            customGroupName: product.customGroupName || product.groupName || '',
            itemName: product.itemName || product.title || '',
            groupName: product.groupName || '',
            varietyName: product.varietyName || '',
            metalName: product.metalName || product.specifications?.metalName || 'SILVER',
            uniqueLabelId: product.uniqueLabelID || product.tagNo || '',
            barcodeNumber: product.barcodeNo || product.barcode || '',
            labelNumber: product.labelNo || product.tagNo || '',
          });

          // Populate Images
          const imgs =
            (Array.isArray(product.ornateImages) && product.ornateImages.length > 0 && product.ornateImages) ||
            (Array.isArray(product.images) && product.images.length > 0 && product.images) ||
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
            metaTitle: product.seo?.metaTitle || product.title || '',
            keywords: product.seo?.keywords || '',
            metaDescription: product.seo?.metaDescription || product.description || '',
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
      const next = { ...prev, [field]: numVal };
      const cost = field === 'costPrice' ? numVal : Number(next.costPrice) || 0;
      const markup = field === 'markupPercentage' ? numVal : Number(next.markupPercentage) || 0;
      const calculated = cost + Math.round((cost * markup) / 100);
      next.calculatedPrice = calculated;
      // If sale price is equal to previous calculated, keep in sync
      if (!prev.salePrice || prev.salePrice === prev.calculatedPrice) {
        next.salePrice = calculated;
      }
      return next;
    });
  };

  // Toggle Color
  const handleToggleColor = (colorName) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorName)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== colorName);
      }
      return [...prev, colorName];
    });
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

  // File upload for Images
  const handleImageFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const { fileUrl } = await uploadWithPresignedUrl(files[0], 'products');

      if (fileUrl) {
        setOrnateImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}`,
            url: fileUrl,
            isPrimary: prev.length === 0,
          },
        ]);
        toast.success('Image uploaded successfully!');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Image upload failed. You can also paste an image URL directly.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Remove Image
  const handleRemoveImage = (imgId) => {
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
        header: '',
        description: '',
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
        // Root fields
        title: baseInfo.title.trim(),
        description: baseInfo.description || '',
        category: baseInfo.category ? [baseInfo.category] : [],
        promoBanner: baseInfo.categoryTag ? [baseInfo.categoryTag] : [],
        menuItem: baseInfo.menuItem ? [baseInfo.menuItem] : [],
        gender: baseInfo.targetGender ? [baseInfo.targetGender] : ['Unisex'],
        gstPercentage: Number(baseInfo.gstPercentage) || 3,
        gstPer: Number(baseInfo.gstPercentage) || 3,
        status: activeStatus,
        stockStatus: baseInfo.stockStatus || 'In Stock',
        inapp: Boolean(baseInfo.showInApp),
        inweb: Boolean(baseInfo.showOnWeb),
        isOrnate: true,
        productType: 'ornate',

        // Pricing
        costPrice: Number(pricing.costPrice) || 0,
        markupPercentage: Number(pricing.markupPercentage) || 0,
        calculatedPrice: Number(pricing.calculatedPrice) || autoCalculatedPrice,
        salePrice: Number(pricing.salePrice) || Number(pricing.calculatedPrice) || 0,
        price: Number(pricing.mrp) || Number(pricing.salePrice) || 0,
        mrp: Number(pricing.mrp) || Number(pricing.salePrice) || 0,
        mrpMarkupPercentage: Number(pricing.mrpMarkupPercentage) || 0,

        // Weights
        grossWt: Number(weights.grossWeight) || 0,
        netWt: Number(weights.netWeight) || 0,
        baseMetalWeight: Number(weights.netWeight) || 0,
        purity: Number(weights.purity) || 92.5,
        carat: weights.caratCategory || '925SL',

        // ERP Details
        customGroupName: erpDetails.customGroupName || '',
        itemName: erpDetails.itemName || baseInfo.title,
        groupName: erpDetails.groupName || '',
        varietyName: erpDetails.varietyName || '',
        metalName: erpDetails.metalName || 'SILVER',
        uniqueLabelID: erpDetails.uniqueLabelId || '',
        barcodeNo: erpDetails.barcodeNumber || '',
        barcode: erpDetails.barcodeNumber || '',
        labelNo: erpDetails.labelNumber || '',
        sku: erpDetails.labelNumber || erpDetails.uniqueLabelId || `ORN-${Date.now()}`,

        // Images
        ornateImages: ornateImages.map((img) => ({
          url: img.url,
          mediaType: 'image',
        })),
        images: ornateImages.map((img) => ({
          url: img.url,
          mediaType: 'image',
        })),

        // Care & Specs
        descriptionSections: careSections
          .filter((s) => s.header.trim() || s.description.trim())
          .map((s) => ({
            header: s.header.trim(),
            description: s.description.trim(),
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
        color: selectedColors[0] || 'SILVER',

        // Structured blocks sync
        basicInfo: {
          title: baseInfo.title.trim(),
          sku: erpDetails.labelNumber || erpDetails.uniqueLabelId || '',
          description: baseInfo.description,
          productType: 'ornate',
          isOrnate: true,
        },
        pricing: {
          mrp: Number(pricing.mrp) || Number(pricing.salePrice) || 0,
          salePrice: Number(pricing.salePrice) || 0,
          costPrice: Number(pricing.costPrice) || 0,
          displayPrice: Number(pricing.salePrice) || 0,
          gstPercentage: Number(baseInfo.gstPercentage) || 3,
          markupPercentage: Number(pricing.markupPercentage) || 0,
        },
        specifications: {
          metalName: erpDetails.metalName || 'SILVER',
          metalWeight: Number(weights.netWeight) || 0,
          metalPurity: Number(weights.purity) || 92.5,
          grossWeight: Number(weights.grossWeight) || 0,
          netWeight: Number(weights.netWeight) || 0,
          stoneWeight: 0,
        },
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
    { num: 7, title: 'SEO Configuration', subtitle: 'Meta tags & Google snippet' },
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
              <h1 className="text-base sm:text-lg font-bold text-stone-900 font-serif tracking-tight leading-tight">
                {isEditMode ? 'Refine the details of ERP product' : 'Add New Ornate Product'}
              </h1>
              {erpDetails.barcodeNumber && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/70">
                  Barcode: {erpDetails.barcodeNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              ERP SKU: <span className="font-mono text-stone-700">{erpDetails.labelNumber || '—'}</span> &bull; Variety: <span className="text-stone-700">{erpDetails.varietyName || '—'}</span> &bull; Metal: <span className="text-stone-700">{erpDetails.metalName || 'SILVER'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => handleSaveProduct('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 rounded-xl hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineDocumentText className="w-3.5 h-3.5 text-stone-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProduct()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}</span>
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
                <h3 className="text-sm font-bold text-stone-900 font-serif">
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
                <p className="text-[10.5px] text-stone-400 italic">
                  This title appears as the customer-facing product name across the website.
                </p>
              </div>

              {/* Category & Category Tag Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Category
                  </label>
                  <Dropdown
                    value={baseInfo.category}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, category: val }))}
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
                    placeholder="No Banner Tag"
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
                  <Dropdown
                    value={baseInfo.menuItem}
                    onChange={(val) => setBaseInfo((prev) => ({ ...prev, menuItem: val }))}
                    options={menuItems}
                    placeholder="Select"
                    size="sm"
                    buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
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
                    GST (%)
                  </label>
                  <input
                    type="number"
                    value={baseInfo.gstPercentage}
                    onChange={(e) =>
                      setBaseInfo((prev) => ({ ...prev, gstPercentage: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
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
                    placeholder="In Stock"
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
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  Pricing & Inventory
                </h3>
                <p className="text-[11px] text-stone-400">
                  Configure wholesale cost price, markup margin percentage, actual selling price, and customer list price.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Cost Price, Markup %, Calculated Price, Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Cost Price (₹)
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">(Auto/Manual)</span>
                  </div>
                  <input
                    type="number"
                    value={pricing.costPrice}
                    onChange={(e) => handleCostOrMarkupChange('costPrice', e.target.value)}
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Markup %
                  </label>
                  <input
                    type="number"
                    value={pricing.markupPercentage}
                    onChange={(e) => handleCostOrMarkupChange('markupPercentage', e.target.value)}
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Calculated Price (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.calculatedPrice}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, calculatedPrice: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-stone-50/70 text-stone-800 focus:outline-none focus:border-[#8b6f4e]"
                  />
                  <p className="text-[10px] text-stone-400 font-mono">
                    Markup: {markupAmount} ({pricing.costPrice} + {markupAmount} = {autoCalculatedPrice})
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Sale Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={pricing.salePrice}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, salePrice: Number(e.target.value) || 0 }))
                    }
                    className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-[#fdfcfb] text-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e]"
                  />
                  <p className="text-[10px] text-stone-400">Actual selling price</p>
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

              {/* Real-time Margin & Profit Summary Pill */}
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e8ded1] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-stone-700">Financial Summary</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span>
                    Gross Profit:{' '}
                    <strong className="text-emerald-700">
                      ₹{Math.max(0, pricing.salePrice - pricing.costPrice).toLocaleString('en-IN')}
                    </strong>
                  </span>
                  <span>
                    Margin:{' '}
                    <strong className="text-[#8b6f4e]">
                      {pricing.salePrice > 0
                        ? (((pricing.salePrice - pricing.costPrice) / pricing.salePrice) * 100).toFixed(1)
                        : 0}
                      %
                    </strong>
                  </span>
                  {pricing.mrp > pricing.salePrice && (
                    <span>
                      Customer Discount:{' '}
                      <strong className="text-stone-700">
                        {Math.round(((pricing.mrp - pricing.salePrice) / pricing.mrp) * 100)}% OFF
                      </strong>
                    </span>
                  )}
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
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
                <IoColorPaletteOutline className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  Variant Configuration (Colors)
                </h3>
                <p className="text-[11px] text-stone-400">
                  Select available metal finish variations matching the storefront luxury swatches.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COLOR_OPTIONS.map((col) => {
                const isSelected = selectedColors.includes(col.name);

                return (
                  <div
                    key={col.name}
                    onClick={() => handleToggleColor(col.name)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-[#8b6f4e] bg-[#faf6f0] shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer pointer-events-none"
                    />

                    {/* Color Swatch Circle */}
                    <div
                      className="w-4 h-4 rounded-full border shadow-2xs shrink-0"
                      style={{
                        backgroundColor: col.hex,
                        borderColor: col.border,
                      }}
                    />

                    <span className="text-xs font-bold text-stone-800">{col.name}</span>

                    {isSelected && (
                      <span className="ml-auto text-[10px] font-bold text-[#8b6f4e] uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
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
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
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
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
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
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Ornate Images
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Product gallery synchronized from ERP FTP & uploaded to Cloudflare R2 bucket.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                {ornateImages.length} Image{ornateImages.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {ornateImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl overflow-hidden border border-stone-200/90 bg-stone-50 aspect-square shadow-2xs"
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
                      onClick={() => setPreviewModalImage(img.url)}
                      title="Preview Image"
                      className="w-7 h-7 rounded-lg bg-white/90 text-stone-800 hover:bg-white flex items-center justify-center transition-transform active:scale-90"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" />
                    </button>
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(img.id)}
                        title="Set as Primary"
                        className="w-7 h-7 rounded-lg bg-[#8b6f4e] text-white hover:bg-[#785e40] flex items-center justify-center transition-transform active:scale-90"
                      >
                        <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      title="Delete Image"
                      className="w-7 h-7 rounded-lg bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center transition-transform active:scale-90"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Zone Button Card */}
              <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-[#8b6f4e] hover:bg-[#faf8f5] transition-all cursor-pointer p-3 text-center group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <HiOutlineUpload
                  className={`w-6 h-6 text-stone-400 group-hover:text-[#8b6f4e] mb-1 transition-colors ${
                    uploadingImage ? 'animate-bounce' : ''
                  }`}
                />
                <span className="text-[11px] font-bold text-stone-700 group-hover:text-[#8b6f4e]">
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </span>
                <span className="text-[9.5px] text-stone-400">JPG, PNG, WEBP</span>
              </label>
            </div>

            {/* Direct URL Input fallback */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste direct image URL (e.g. https://...)"
                className="flex-1 h-9 px-3 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3.5 h-9 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              >
                Add from URL
              </button>
            </div>
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
                      <h3 className="text-sm font-bold text-stone-900 font-serif">
                        Product Information & Care Sections
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                        {careSections.length} Added
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Add custom expandable sections displayed on the storefront (e.g. &ldquo;How to Care&rdquo;, &ldquo;How to Maintain&rdquo;).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCareSection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#8b6f4e] hover:text-white text-stone-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Section</span>
                </button>
              </div>

              {careSections.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-stone-200 bg-[#faf8f5] space-y-2">
                  <p className="text-xs text-stone-500 font-medium">
                    No custom header & description sections added yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCareSection}
                    className="text-xs font-bold text-[#8b6f4e] hover:underline cursor-pointer"
                  >
                    + Add Section
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {careSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-xl border border-stone-200 bg-[#faf8f5] space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={sec.header}
                          onChange={(e) =>
                            handleUpdateCareSection(sec.id, 'header', e.target.value)
                          }
                          placeholder={`Section Title (e.g. "Care Instructions", "Packaging")`}
                          className="flex-1 h-9 px-3 text-xs font-bold rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCareSection(sec.id)}
                          className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={sec.description}
                        onChange={(e) =>
                          handleUpdateCareSection(sec.id, 'description', e.target.value)
                        }
                        placeholder="Detailed description content..."
                        className="w-full p-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                      />
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
                      <h3 className="text-sm font-bold text-stone-900 font-serif">
                        Product Specifications
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                        {specifications.length} Added
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Technical key-value specification attributes displayed on product specification table.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSpecification}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#8b6f4e] hover:text-white text-stone-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Spec</span>
                </button>
              </div>

              {specifications.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-stone-200 bg-[#faf8f5] space-y-2">
                  <p className="text-xs text-stone-500 font-medium">
                    No product specifications added yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSpecification}
                    className="text-xs font-bold text-[#8b6f4e] hover:underline cursor-pointer"
                  >
                    + Add First Specification
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {specifications.map((spec) => (
                    <div
                      key={spec.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-[#faf8f5]"
                    >
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleUpdateSpecification(spec.id, 'key', e.target.value)}
                        placeholder="Specification Name (e.g. Clasp Type, Dimensions)"
                        className="flex-1 h-9 px-3 text-xs font-bold rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleUpdateSpecification(spec.id, 'value', e.target.value)}
                        placeholder="Value (e.g. Lobster Clasp, 7.5 Inches)"
                        className="flex-1 h-9 px-3 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecification(spec.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
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
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  SEO Configuration
                </h3>
                <p className="text-[11px] text-stone-400">
                  Optimize organic discovery, Google search snippets, and metadata tags for this jewellery item.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
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

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={seo.keywords}
                    onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
                    placeholder="silver bracelet, 925 silver, handmade jewellery"
                    className="w-full h-10 px-3.5 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
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

              {/* Google SERP Snippet Preview */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-stone-200/90 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Search Engine Snippet Preview
                </p>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-[#202124] font-mono truncate">
                    https://neirah.in › products › {erpDetails.barcodeNumber || 'ornate-jewellery'}
                  </p>
                  <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
                    {seo.metaTitle || baseInfo.title || 'Neirah Luxury Jewellery'}
                  </h4>
                  <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    {seo.metaDescription || baseInfo.description || 'Discover exquisite fine jewelry handcrafted with precision by Neirah. Certified authenticity and lifetime warranty.'}
                  </p>
                </div>
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

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-stone-500">
          <span>Tab {activeStep} of {steps.length}:</span>
          <span className="text-[#8b6f4e]">{steps[activeStep - 1]?.title}</span>
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

      {/* ─── Image Zoom Preview Modal ───────────────────────────────── */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center cursor-pointer"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
            <img
              src={previewModalImage}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
