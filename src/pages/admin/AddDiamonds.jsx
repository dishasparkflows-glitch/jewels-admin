import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePhotograph,
  HiOutlineCloudUpload,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import { TbListDetails } from 'react-icons/tb';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { diamondsAPI } from '../../api/services';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import Dropdown from '../../components/common/Dropdown';
import { DeleteActionButton } from '../../components/common/RowActions';
import { useTheme } from '../../contexts/ThemeContext';

export default function AddDiamonds() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const fileInputRef = useRef(null);
  const rowFileInputRefs = useRef({});

  // Attributes lookups (loaded from API)
  const [types, setTypes] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [colors, setColors] = useState([]);
  const [clarities, setClarities] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Price Master Matrix (Loaded from /center-diamond-prices/lookup)
  const [pricingMatrix, setPricingMatrix] = useState([]);

  // Card 1: Diamond Information
  const [selectedType, setSelectedType] = useState('');
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedClarity, setSelectedClarity] = useState('');
  const [globalImage, setGlobalImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState(null);

  // Card 2: Carat Weight Configuration
  const [caratInput, setCaratInput] = useState('');
  const [caratWeights, setCaratWeights] = useState([]);

  // Generated Variants
  const [variants, setVariants] = useState([]);
  const [bulkRate, setBulkRate] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch Lookups from API
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        const res = await api.get('/diamonds/attributes');

        const data = res.data?.data || {};
        if (data.types?.length) setTypes(data.types);
        if (data.shapes?.length) setShapes(data.shapes);
        if (data.colors?.length) setColors(data.colors);
        if (data.clarities?.length) setClarities(data.clarities);

        // Pre-select first available option from API
        if (data.types?.length) setSelectedType(data.types[0].name);
        if (data.shapes?.length) setSelectedShape(data.shapes[0].name);
        if (data.colors?.length) setSelectedColor(data.colors[0].name);
        if (data.clarities?.length) setSelectedClarity(data.clarities[0].name);
      } catch (err) {
        console.error('Failed to load diamond attribute lookups:', err);
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, []);

  // Fetch Center Diamond Price Lookup Matrix
  useEffect(() => {
    api
      .get('/center-diamond-prices/lookup')
      .then((res) => {
        setPricingMatrix(res.data?.data || []);
      })
      .catch((err) => {
        console.warn('Failed to load center diamond price matrix:', err);
      });
  }, []);

  // Helper matching functions for center diamond pricing master
  const lookupMatrixRate = (type, shape, color, clarity, carat) => {
    if (!pricingMatrix || pricingMatrix.length === 0) return 0;
    const ct = parseFloat(carat) || 0;
    const typeLower = String(type || '').trim().toLowerCase();
    const shapeLower = String(shape || '').trim().toLowerCase();
    const colorLower = String(color || '').trim().toLowerCase();
    const clarityLower = String(clarity || '').trim().toLowerCase();

    const match = pricingMatrix.find((p) => {
      const pTypeName = (p.diamondTypeId?.name || '').trim().toLowerCase();
      const pShapeName = (p.diamondShapeId?.name || '').trim().toLowerCase();
      const pColorName = (p.diamondColorId?.name || '').trim().toLowerCase();
      const pClarityName = (p.diamondClarityId?.name || '').trim().toLowerCase();

      const isType = pTypeName === typeLower || (!pTypeName && !typeLower);
      const isShape = pShapeName === shapeLower || (!pShapeName && !shapeLower);
      const isColor = pColorName === colorLower || pColorName.split(/[-/\s]+/).includes(colorLower);
      const isClarity = pClarityName === clarityLower;
      const isSize = ct >= (p.sizeFrom || 0) && ct <= (p.sizeTo || 0);

      return isType && isShape && isColor && isClarity && isSize;
    });

    return match?.priceINR || 0;
  };

  // Helper to generate a standardized deterministic SKU (Formula 3)
  const generateSku = (type, shape, color, clarity, carat) => {
    const typePrefix = type ? type.trim().split(/\s+/)[0].toUpperCase() : 'NATURAL';
    const shapePrefix = shape ? shape.trim().toUpperCase() : 'ROUND';
    const colorCode = color ? color.trim().toUpperCase() : 'D-E';
    const clarityCode = clarity ? clarity.trim().toUpperCase() : 'VS';
    const caratCode = Number(carat).toFixed(2);
    return `RJ-${typePrefix}-${caratCode}-${shapePrefix}-${colorCode}-${clarityCode}`;
  };

  // Helper to generate Title (Formula 4)
  const generateTitle = (type, shape, color, clarity, carat) => {
    const caratCode = Number(carat).toFixed(2);
    const shapeTitle = shape ? shape.charAt(0).toUpperCase() + shape.slice(1).toLowerCase() : 'Round';
    const typeTitle = type || 'Natural Diamond';
    return `${caratCode} Carat ${shapeTitle} ${typeTitle} Diamond`;
  };

  // Batch Validation against MongoDB
  useEffect(() => {
    if (variants.length === 0) return;

    const typeObj = types.find((t) => t.name === selectedType);
    const shapeObj = shapes.find((s) => s.name === selectedShape);
    const colorObj = colors.find((c) => c.name === selectedColor);
    const clarityObj = clarities.find((cl) => cl.name === selectedClarity);

    let cancelled = false;
    const checkBatch = async () => {
      setIsValidating(true);
      try {
        const payload = variants.map((v) => ({
          carat: v.carat,
          sku: v.sku,
          typeId: typeObj?._id,
          shapeId: shapeObj?._id,
          colorId: colorObj?._id,
          clarityId: clarityObj?._id,
        }));

        const res = await api.post('/diamonds/validate', { diamonds: payload });
        if (cancelled) return;
        const existing = res.data?.data?.existingDiamonds || [];

        setVariants((prev) =>
          prev.map((v) => {
            const match = existing.find(
              (e) =>
                e.sku === v.sku ||
                (parseFloat(e.carat) === parseFloat(v.carat) &&
                  String(e.typeId?._id || e.typeId) === String(typeObj?._id) &&
                  String(e.shapeId?._id || e.shapeId) === String(shapeObj?._id) &&
                  String(e.colorId?._id || e.colorId) === String(colorObj?._id) &&
                  String(e.clarityId?._id || e.clarityId) === String(clarityObj?._id))
            );

            if (match) {
              return {
                ...v,
                _id: match._id,
                isSaved: true,
                image: match.image?.url ? { url: match.image.url } : v.image,
              };
            }
            return { ...v, isSaved: false, _id: undefined };
          })
        );
      } catch (err) {
        console.warn('Batch validation check skipped:', err);
      } finally {
        if (!cancelled) setIsValidating(false);
      }
    };

    checkBatch();
    return () => {
      cancelled = true;
    };
  }, [variants.length, selectedType, selectedShape, selectedColor, selectedClarity, types, shapes, colors, clarities]);

  // Add a Carat Weight (Formula 1 & 5 Auto-Compute)
  const handleAddCarat = (value) => {
    if (!selectedType || !selectedShape || !selectedColor || !selectedClarity) {
      toast.error('Select diamond type, shape, color, and clarity first');
      return;
    }

    const num = parseFloat(value !== undefined ? value : caratInput);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid carat weight (e.g. 1.05)');
      return;
    }

    const rounded = parseFloat(num.toFixed(2));
    if (caratWeights.includes(rounded)) {
      toast.error(`Carat weight ${rounded} ct is already added`);
      return;
    }

    // Auto-lookup master rate from CenterDiamondPrice pricingMatrix (Formula 5)
    const matrixRate = lookupMatrixRate(selectedType, selectedShape, selectedColor, selectedClarity, rounded);
    const defaultRate = matrixRate > 0 ? matrixRate : (Number(bulkRate) || 0);
    const price = Math.round(rounded * defaultRate);

    const nextWeights = [...caratWeights, rounded].sort((a, b) => a - b);
    setCaratWeights(nextWeights);
    setCaratInput('');

    // If rate was discovered from matrix, update bulkRate display placeholder
    if (matrixRate > 0 && !bulkRate) {
      setBulkRate(String(matrixRate));
    }

    // Generate/append new variant
    const newVariant = {
      id: `${rounded}-${Date.now()}`,
      carat: rounded,
      type: selectedType,
      shape: selectedShape,
      color: selectedColor,
      clarity: selectedClarity,
      sku: generateSku(selectedType, selectedShape, selectedColor, selectedClarity, rounded),
      title: generateTitle(selectedType, selectedShape, selectedColor, selectedClarity, rounded),
      rate: defaultRate,
      price: price,
      image: globalImage ? { url: globalImage } : null,
      status: 'active',
      isSaved: false,
      isMatrixPriced: matrixRate > 0,
    };

    setVariants((prev) => [...prev, newVariant]);
  };

  // Remove a Carat Weight
  const handleRemoveCarat = (weightToRemove) => {
    setCaratWeights((prev) => prev.filter((w) => w !== weightToRemove));
    setVariants((prev) => prev.filter((v) => v.carat !== weightToRemove));
  };

  // Update variants when base information changes
  const handleBaseInfoChange = (typeVal, shapeVal, colorVal, clarityVal) => {
    const t = typeVal !== undefined ? typeVal : selectedType;
    const s = shapeVal !== undefined ? shapeVal : selectedShape;
    const c = colorVal !== undefined ? colorVal : selectedColor;
    const cl = clarityVal !== undefined ? clarityVal : selectedClarity;

    setVariants((prev) =>
      prev.map((v) => {
        const matrixRate = lookupMatrixRate(t, s, c, cl, v.carat);
        const rate = matrixRate > 0 ? matrixRate : v.rate;
        const price = Math.round(v.carat * rate);
        return {
          ...v,
          type: t,
          shape: s,
          color: c,
          clarity: cl,
          rate,
          price,
          sku: generateSku(t, s, c, cl, v.carat),
          title: generateTitle(t, s, c, cl, v.carat),
          isMatrixPriced: matrixRate > 0,
        };
      })
    );
  };

  // Handle Global Image Upload
  const handleGlobalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadWithPresignedUrl(file, 'diamonds');
      const url = res.fileUrl;
      setGlobalImage(url);

      // Apply to all existing variants that don't have custom images
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          image: v.hasCustomImage ? v.image : { url },
        }))
      );
      toast.success('Global diamond image uploaded');
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Failed to upload diamond image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Variant-Specific Image Upload
  const handleRowImageUpload = async (variantId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingRowId(variantId);
      const res = await uploadWithPresignedUrl(file, 'diamonds');
      const url = res.fileUrl;

      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? { ...v, image: { url }, hasCustomImage: true }
            : v
        )
      );
      toast.success('Custom diamond image uploaded');
    } catch (err) {
      console.error('Failed to upload custom stone image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingRowId(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveRowImage = (variantId) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, image: globalImage ? { url: globalImage } : null, hasCustomImage: false }
          : v
      )
    );
  };

  // Apply Bulk Rate to all variants
  const handleApplyBulkRate = () => {
    const r = parseFloat(bulkRate);
    if (isNaN(r) || r < 0) {
      toast.error('Please enter a valid rate per carat');
      return;
    }

    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        rate: r,
        price: Math.round(v.carat * r),
      }))
    );
    toast.success(`Applied ₹ ${r.toLocaleString()} / ct to all variants`);
  };

  // Two-Way Reactive Calculation (Formula 2)
  const handleUpdateVariant = (id, field, value) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, [field]: value };
        const ct = parseFloat(updated.carat) || 0;

        if (field === 'rate') {
          const r = parseFloat(value) || 0;
          updated.price = Math.round(ct * r);
        } else if (field === 'price') {
          const p = parseFloat(value) || 0;
          if (ct > 0) {
            updated.rate = Math.round(p / ct);
          }
        } else if (field === 'carat') {
          const r = parseFloat(updated.rate) || 0;
          updated.price = Math.round(ct * r);
          updated.sku = generateSku(updated.type, updated.shape, updated.color, updated.clarity, ct);
          updated.title = generateTitle(updated.type, updated.shape, updated.color, updated.clarity, ct);
        }
        return updated;
      })
    );
  };

  // Remove single variant
  const handleRemoveVariant = (id) => {
    const vToRemove = variants.find((v) => v.id === id);
    setVariants((prev) => prev.filter((v) => v.id !== id));
    if (vToRemove) {
      setCaratWeights((prev) => prev.filter((w) => w !== vToRemove.carat));
    }
  };

  // Publish All Variants (Step 5: Bulk Write Upsert Execution)
  const handlePublishVariants = async () => {
    if (variants.length === 0) {
      toast.error('Please add at least one carat weight to generate variants');
      return;
    }

    // Resolve MongoDB ObjectIds for relations
    const typeObj = types.find((t) => t.name === selectedType);
    const shapeObj = shapes.find((s) => s.name === selectedShape);
    const colorObj = colors.find((c) => c.name === selectedColor);
    const clarityObj = clarities.find((cl) => cl.name === selectedClarity);
    if (!typeObj?._id || !shapeObj?._id || !colorObj?._id || !clarityObj?._id) {
      toast.error('Select valid diamond attributes from the loaded master data');
      return;
    }

    try {
      setPublishing(true);

      const payload = variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        sku: v.sku.trim(),
        title: v.title.trim(),
        carat: Number(v.carat),
        rate: Number(v.rate) || 0,
        price: Number(v.price) || 0,
        typeId: typeObj?._id,
        shapeId: shapeObj?._id,
        colorId: colorObj?._id,
        clarityId: clarityObj?._id,
        image: v.image?.url ? { url: v.image.url } : globalImage ? { url: globalImage } : undefined,
        status: v.status || 'active',
      }));

      await diamondsAPI.bulkCreate(payload);
      toast.success(`Successfully published ${variants.length} diamond variants!`);
      navigate('/diamonds');
    } catch (err) {
      console.error('Failed to publish variants:', err);
      toast.error(err.response?.data?.message || 'Failed to publish diamond variants');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1400px] mx-auto font-sans">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Add Diamonds</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#fbf5ed] text-[#8b6f4e] border border-[#e8d7be]">
              Rapid Matrix Generator
            </span>
          </h1>
          <p className="text-[13px] text-stone-500 mt-0.5">
            Configure 4Cs and carats to auto-lookup master rates and spawn stock inventory.
          </p>
        </div>

        {/* Action Buttons: Cancel & Publish Variants */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/diamonds')}
            className="px-6 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-[13px] font-semibold rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={variants.length === 0 || publishing}
            onClick={handlePublishVariants}
            className={`px-6 py-2 text-[13px] font-semibold rounded-xl transition-all shadow-xs ${
              variants.length > 0 && !publishing
                ? 'bg-[#8b6f4e] hover:bg-[#785e42] text-white active:scale-98 cursor-pointer'
                : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
            }`}
          >
            {publishing ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                <span>Publishing...</span>
              </div>
            ) : (
              'Publish Variants'
            )}
          </button>
        </div>
      </div>

      {/* ─── Card 1: 1. Diamond Information ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#faf5ee] border border-[#ebdcc9] flex items-center justify-center text-[#8b6f4e] shadow-2xs">
              <IoDiamondOutline className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              1. Diamond Information
            </h2>
          </div>
          {pricingMatrix.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Price Master Connected ({pricingMatrix.length} rules)</span>
            </span>
          )}
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {/* 1. Diamond Type */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              DIAMOND TYPE <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              value={selectedType}
              onChange={(val) => {
                setSelectedType(val);
                handleBaseInfoChange(val, undefined, undefined, undefined);
              }}
              options={types.map((t) => ({ value: t.name, label: t.name }))}
              placeholder="Select Diamond Type"
              size="md"
              buttonClassName="bg-stone-50/60 hover:bg-stone-50 border-stone-200/90 rounded-xl px-3.5 text-xs font-semibold text-stone-800"
            />
          </div>

          {/* 2. Diamond Shape */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              DIAMOND SHAPE <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              value={selectedShape}
              onChange={(val) => {
                setSelectedShape(val);
                handleBaseInfoChange(undefined, val, undefined, undefined);
              }}
              options={shapes.map((s) => ({ value: s.name, label: s.name }))}
              placeholder="Select Diamond Shape"
              size="md"
              buttonClassName="bg-stone-50/60 hover:bg-stone-50 border-stone-200/90 rounded-xl px-3.5 text-xs font-semibold text-stone-800 uppercase"
            />
          </div>

          {/* 3. Diamond Color */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              DIAMOND COLOR <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              value={selectedColor}
              onChange={(val) => {
                setSelectedColor(val);
                handleBaseInfoChange(undefined, undefined, val, undefined);
              }}
              options={colors.map((c) => ({ value: c.name, label: c.name }))}
              placeholder="Select Diamond Color"
              size="md"
              buttonClassName="bg-stone-50/60 hover:bg-stone-50 border-stone-200/90 rounded-xl px-3.5 text-xs font-semibold text-stone-800"
            />
          </div>

          {/* 4. Diamond Clarity */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              DIAMOND CLARITY <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              value={selectedClarity}
              onChange={(val) => {
                setSelectedClarity(val);
                handleBaseInfoChange(undefined, undefined, undefined, val);
              }}
              options={clarities.map((cl) => ({ value: cl.name, label: cl.name }))}
              placeholder="Select Diamond Clarity"
              size="md"
              buttonClassName="bg-stone-50/60 hover:bg-stone-50 border-stone-200/90 rounded-xl px-3.5 text-xs font-semibold text-stone-800"
            />
          </div>

          {/* 5. Global Image (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              GLOBAL IMAGE (OPTIONAL)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleGlobalImageUpload}
            />

            {globalImage ? (
              <div className="flex items-center gap-2 p-1.5 border border-[#8b6f4e]/30 bg-[#faf6f0] rounded-xl">
                <img
                  src={globalImage}
                  alt="Global Diamond"
                  className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                />
                <span className="text-xs text-stone-700 truncate font-medium flex-1">Image added</span>
                <button
                  type="button"
                  onClick={() => setGlobalImage('')}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-50/70 hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl text-xs font-semibold text-stone-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <HiOutlineCloudUpload className="w-4 h-4 text-stone-400" />
                    <span>UPLOAD</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Card 2: 2. Carat Weight Configuration ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <TbListDetails className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-stone-900 tracking-tight">
            2. Carat Weight Configuration
          </h2>
        </div>

        {/* Input Row: RATE / CARAT + CARAT WEIGHTS input + '+' button */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Rate Per Carat Input */}
          <div className="space-y-1.5 w-full sm:w-56">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              RATE / CARAT (₹) <span className="text-stone-400 text-[10px] lowercase font-normal">(auto-lookup)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">₹</span>
              <input
                type="number"
                min="0"
                value={bulkRate}
                onChange={(e) => setBulkRate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCarat();
                  }
                }}
                placeholder="Auto or enter e.g. 45000"
                className="w-full pl-7 pr-3.5 py-2 text-xs bg-white border border-stone-200/90 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 font-semibold text-stone-800 placeholder-stone-400"
              />
            </div>
          </div>

          {/* Carat Weight Input + '+' Button */}
          <div className="space-y-1.5 w-full sm:w-56">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              CARAT WEIGHT (CT) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={caratInput}
                  onChange={(e) => setCaratInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCarat();
                    }
                  }}
                  placeholder="e.g. 1.05"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200/90 rounded-xl focus:outline-hidden focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 font-semibold text-stone-800 placeholder-stone-400"
                />
              </div>

              {/* '+' button filled with user selected theme */}
              <button
                type="button"
                onClick={() => handleAddCarat()}
                style={{
                  backgroundColor: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)',
                  borderColor: currentTheme?.border || currentTheme?.primary || 'var(--theme-primary, #8b6f4e)',
                  color: '#ffffff',
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#8b6f4e] hover:bg-[#785e42] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer font-bold active:scale-95 shrink-0"
                title="Add Carat Weight"
              >
                <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Carat Weight Tags */}
        {caratWeights.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-600">Configured Carats:</span>
            {caratWeights.map((w) => (
              <span
                key={w}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fbf5ed] border border-[#e8d7be] text-[#8b6f4e] text-xs font-bold rounded-xl shadow-2xs"
              >
                <span>{w} ct</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCarat(w)}
                  className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                  title={`Remove ${w} ct`}
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. Generated Variants Stock Table ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table Header & Bulk Pricing Toolbar */}
        <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Generated Stock Variants</span>
              <span className="px-2.5 py-0.5 text-xs bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d7be] rounded-full font-semibold">
                {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
              </span>
              {isValidating && (
                <span className="text-[11px] text-stone-400 font-normal animate-pulse">
                  Validating with inventory...
                </span>
              )}
            </h3>
            <p className="text-[13px] text-stone-500 mt-0.5">
              Two-way reactive editing: changing Rate/ct recalculates Total Price, and vice-versa.
            </p>
          </div>

          {/* Bulk Pricing Input */}
          {variants.length > 0 && (
            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200/80">
              <span className="text-[11px] font-bold text-stone-500 pl-2">SET RATE / CT:</span>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={bulkRate}
                  onChange={(e) => setBulkRate(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#8b6f4e] font-semibold text-stone-800"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyBulkRate}
                className="px-3 py-1 bg-[#8b6f4e] hover:bg-[#785e42] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Apply All
              </button>
            </div>
          )}
        </div>

        {/* Variants List or Empty State */}
        <div className="p-3 sm:p-6 pt-3 overflow-x-auto">
          {variants.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <IoDiamondOutline className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-stone-700 font-semibold mb-1">No variants generated yet</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Add one or more carat weights in section 2 to instantly generate your diamond stock variants.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="w-10 pb-1 text-center">#</th>
                  <th className="pb-1 w-16 text-center">IMAGE</th>
                  <th className="pb-1 min-w-[210px]">SKU (DETERMINISTIC)</th>
                  <th className="pb-1 min-w-[240px]">DIAMOND TITLE</th>
                  <th className="pb-1 w-20 text-center">CARAT</th>
                  <th className="pb-1 min-w-[130px]">RATE / CT (₹)</th>
                  <th className="pb-1 min-w-[130px]">TOTAL PRICE (₹)</th>
                  <th className="pb-1 w-28 text-center">INVENTORY</th>
                  <th className="pb-1 w-16 text-center">STATUS</th>
                  <th className="pb-1 w-16 text-right pr-2">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, index) => {
                  const displayImg = v.image?.url || globalImage;
                  return (
                    <tr
                      key={v.id}
                      className={`group transition-colors ${
                        v.isSaved
                          ? 'bg-blue-50/20 hover:bg-blue-50/40'
                          : 'hover:bg-stone-50/50'
                      }`}
                    >
                      {/* # */}
                      <td className="text-center align-middle">
                        <span className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-200/80 inline-flex items-center justify-center text-xs font-semibold text-stone-600">
                          {index + 1}
                        </span>
                      </td>

                      {/* Diamond Image Thumbnail / Upload */}
                      <td className="text-center align-middle px-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => (rowFileInputRefs.current[v.id] = el)}
                          onChange={(e) => handleRowImageUpload(v.id, e)}
                        />
                        <div className="relative inline-block group/img">
                          {displayImg ? (
                            <img
                              src={displayImg}
                              alt={v.title}
                              className="w-9 h-9 rounded-lg object-cover border border-stone-200 mx-auto shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center text-stone-400 mx-auto">
                              <HiOutlinePhotograph className="w-4 h-4" />
                            </div>
                          )}

                          {/* Hover Upload Button */}
                          <button
                            type="button"
                            onClick={() => rowFileInputRefs.current[v.id]?.click()}
                            disabled={uploadingRowId === v.id}
                            className="absolute inset-0 bg-black/60 rounded-lg text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-[10px]"
                            title="Upload Stone Image"
                          >
                            {uploadingRowId === v.id ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <HiOutlineCloudUpload className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* SKU (Formula 3) */}
                      <td className="align-middle px-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => handleUpdateVariant(v.id, 'sku', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200/90 rounded-xl font-mono text-stone-800 focus:outline-hidden focus:border-[#8b6f4e]"
                        />
                      </td>

                      {/* Title (Formula 4) */}
                      <td className="align-middle px-2">
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) => handleUpdateVariant(v.id, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200/90 rounded-xl font-medium text-stone-800 focus:outline-hidden focus:border-[#8b6f4e]"
                        />
                      </td>

                      {/* Carat */}
                      <td className="text-center align-middle px-2">
                        <span className="inline-block px-2.5 py-1 text-xs font-bold bg-[#fbf5ed] text-[#8b6f4e] border border-[#e8d7be] rounded-lg">
                          {v.carat} ct
                        </span>
                      </td>

                      {/* Rate (Formula 2 Reactive) */}
                      <td className="align-middle px-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
                          <input
                            type="number"
                            value={v.rate}
                            onChange={(e) => handleUpdateVariant(v.id, 'rate', e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white border border-stone-200/90 rounded-xl font-semibold text-stone-800 focus:outline-hidden focus:border-[#8b6f4e]"
                          />
                        </div>
                      </td>

                      {/* Total Price (Formula 1 & 2 Reactive) */}
                      <td className="align-middle px-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => handleUpdateVariant(v.id, 'price', e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white border border-stone-200/90 rounded-xl font-bold text-stone-900 focus:outline-hidden focus:border-[#8b6f4e]"
                          />
                        </div>
                      </td>

                      {/* Inventory Validation Status */}
                      <td className="text-center align-middle px-2">
                        {v.isSaved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Already Added
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            New Stone
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="text-center align-middle px-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={v.status === 'active'}
                          onClick={() =>
                            handleUpdateVariant(v.id, 'status', v.status === 'active' ? 'inactive' : 'active')
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            v.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                          title={v.status === 'active' ? 'Active' : 'Inactive'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              v.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Action */}
                      <td className="text-right align-middle pr-2">
                        <DeleteActionButton
                          onClick={() => handleRemoveVariant(v.id)}
                          title="Remove Variant"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
