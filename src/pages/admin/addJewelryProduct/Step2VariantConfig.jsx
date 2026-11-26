import { Fragment, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineRefresh,
  HiOutlineCalculator,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import SideDiamondEditor from '../../../components/common/SideDiamondEditor';
import Dropdown from '../../../components/common/Dropdown';
import { getSphereStyle } from './metalColorHelpers';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function Step2VariantConfig() {
  const colorStoneCaratInputRef = useRef(null);
  const centerCaratInputRef = useRef(null);
  const {
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
  } = useAddJewelryProductContext();

  return (
    <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-stone-200">
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
      <div className="p-4 sm:p-5 rounded-2xl border border-stone-200/90 bg-white space-y-3.5 shadow-2xs">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
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
                      style={{ background: getSphereStyle(color).gradient }}
                    />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sub-Section 2: Metal Specifications ──────────── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-stone-200/90 bg-white space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
            2
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-900">Metal Specifications</h3>
            <p className="text-[10px] text-stone-400">Set the base metal weight and applicable charges for these variants.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-700">Metal Weight (g) (14KT)</span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={specs.metalWeight}
              onChange={(e) => setSpecs((prev) => ({ ...prev, metalWeight: e.target.value }))}
              placeholder="e.g. 1.91"
              className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-[#d6cfc2] rounded-lg focus:outline-none focus:border-[#8b6f4e]"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-700">Making Charge (₹/g)</span>
            <input
              type="number"
              min="0"
              value={specs.baseLabourCharge}
              onChange={(e) => setSpecs((prev) => ({ ...prev, baseLabourCharge: e.target.value }))}
              placeholder="e.g. 2000"
              className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-[#d6cfc2] rounded-lg focus:outline-none focus:border-[#8b6f4e]"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-700">Certificate Charge (₹)</span>
            <input
              type="number"
              min="0"
              value={specs.certificateCharge}
              onChange={(e) => setSpecs((prev) => ({ ...prev, certificateCharge: e.target.value }))}
              placeholder="e.g. 1000"
              className="w-full px-3 py-2 text-xs text-stone-900 bg-white border border-[#d6cfc2] rounded-lg focus:outline-none focus:border-[#8b6f4e]"
            />
          </label>
        </div>
      </div>

      {/* ─── Sub-Section 3: Center & Side Stone Configuration ──── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
            3
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-900">Stone Configuration</h3>
            <p className="text-[10px] text-stone-400">
              Configure multi-stone center diamonds or gemstones and optional side accent stones.
            </p>
          </div>
        </div>

        {/* ── Center Stone Switcher ── */}
        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={() => setStoneConfigType('centerDiamond')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              stoneConfigType === 'centerDiamond'
                ? 'bg-[#8b6f4e] text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Center Diamond
          </button>
          <button
            type="button"
            onClick={() => setStoneConfigType('colorStone')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              stoneConfigType === 'colorStone'
                ? 'bg-[#8b6f4e] text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Color Stone
          </button>
        </div>

        {/* ── Color Stone Configuration Card ── */}
        {stoneConfigType === 'colorStone' && (
          <div className="p-5 rounded-2xl border border-stone-200/90 bg-white space-y-4 shadow-2xs">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <IoDiamondOutline className="w-4 h-4 text-[#8b6f4e]" />
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-900">
                  COLOR STONE CONFIGURATION
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8b6f4e] bg-amber-50 px-2.5 py-1 rounded-full border border-[#8b6f4e]/20">
                  Rate: ₹3,000 / ct (Fixed)
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d8c0]">
                  {colorStoneCombinations.length} {colorStoneCombinations.length === 1 ? 'Combination' : 'Combinations'}
                </span>
              </div>
            </div>

            {/* Top Controls Grid: Type, Shape, Carat Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pt-1">
              {/* 1. STONE TYPE */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  STONE TYPE
                </label>
                <Dropdown
                  size="sm"
                  value={colorStoneType}
                  onChange={(val) => setColorStoneType(val)}
                  options={diamondTypesList}
                  placeholder="Select Stone Type"
                  buttonClassName="h-8 px-3 text-xs rounded-lg bg-white border-stone-200 font-semibold text-stone-800"
                />
              </div>

              {/* 2. STONE SHAPE */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  STONE SHAPE
                </label>
                <Dropdown
                  size="sm"
                  value={colorStoneShape}
                  onChange={(val) => setColorStoneShape(val)}
                  options={diamondShapesList}
                  placeholder="Select Stone Shape"
                  buttonClassName="h-8 px-3 text-xs rounded-lg bg-white border-stone-200 font-semibold text-stone-800 uppercase"
                />
              </div>

              {/* 3. TOTAL CARAT WEIGHT (CT) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  TOTAL CARAT WEIGHT (CT)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={colorStoneCaratInputRef}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.5"
                    value={colorStoneCaratInput}
                    onChange={(e) => setColorStoneCaratInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColorStoneCarat();
                        colorStoneCaratInputRef.current?.focus();
                      }
                    }}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddColorStoneCarat();
                      colorStoneCaratInputRef.current?.focus();
                    }}
                    className="w-8 h-8 flex-shrink-0 rounded-lg bg-[#8b6f4e] hover:bg-[#785e42] text-white flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                    title="Add Carat Weight"
                  >
                    +
                  </button>
                </div>

                {/* Carat Tags with Delete 'x' */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {colorStoneCarats.map((ct) => (
                    <span
                      key={ct}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-[#8b6f4e] text-white text-[13px] font-semibold shadow-xs select-none"
                    >
                      <span>{ct} ct</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorStoneCarat(ct)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/20 transition-all cursor-pointer shrink-0"
                        title={`Remove ${ct} ct`}
                        aria-label={`Remove ${ct} ct`}
                      >
                        <HiOutlineX className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-Generated Combinations Table */}
            <div className="pt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8b6f4e]" />
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    COLOR STONE COMBINATIONS ({colorStoneCombinations.length})
                  </h5>
                </div>
                <button
                  type="button"
                  onClick={handleAddColorStoneRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e42] active:scale-95 transition-all shadow-xs hover:shadow cursor-pointer"
                >
                  <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Row</span>
                </button>
              </div>

              {colorStoneCombinations.length === 0 ? (
                <div className="py-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-200 flex flex-col items-center justify-center gap-2">
                  <p className="text-xs text-stone-400">
                    Select stone type, shape, and add carat weights to generate color stone combinations.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddColorStoneRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e42] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Row</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50/60 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          <th className="py-2.5 px-3 w-16 font-bold text-center">SR NO</th>
                          <th className="py-2.5 px-4 font-bold">STONE TYPE</th>
                          <th className="py-2.5 px-3 font-bold">SHAPE</th>
                          <th className="py-2.5 px-3 font-bold">CARAT</th>
                          <th className="py-2.5 px-3 font-bold">RATE / CT</th>
                          <th className="py-2.5 px-4 font-bold text-right">TOTAL PRICE</th>
                          <th className="py-2.5 px-3 font-bold text-center w-16">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {colorStoneCombinations.map((combo, idx) => (
                          <tr key={combo.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-2.5 px-3 text-center font-medium text-stone-400">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-bold text-stone-800">{combo.diamondType || '—'}</td>
                            <td className="py-2.5 px-3 font-semibold text-stone-800 uppercase">{combo.shape || '—'}</td>
                            <td className="py-2.5 px-3 font-semibold text-stone-800">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  defaultValue={combo.carat}
                                  key={`carat-${combo.carat}-${idx}`}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0 && val !== combo.carat) {
                                      handleUpdateColorStoneCarat(combo.carat, val);
                                    } else {
                                      e.target.value = combo.carat;
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.target.blur();
                                    }
                                  }}
                                  className="w-20 h-7 px-2 text-xs font-semibold rounded border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e] text-stone-800"
                                />
                                <span className="text-xs text-stone-500 font-medium">ct</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#8b6f4e]">
                              ₹3,000 / ct (Fixed)
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-stone-900">
                              ₹{combo.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveColorStoneCarat(combo.carat)}
                                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                                title="Remove combination"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end items-center gap-2.5 pt-0.5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50/80 border border-[#8b6f4e]/20 text-xs shadow-2xs">
                      <span className="font-semibold text-stone-600">Total Price:</span>
                      <span className="font-extrabold text-[#8b6f4e] text-sm">
                        ₹{totalColorStonePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50/80 border border-[#8b6f4e]/20 text-xs shadow-2xs">
                      <span className="font-semibold text-stone-600">Total Stone Weight:</span>
                      <span className="font-extrabold text-[#8b6f4e] text-sm">
                        {Number(totalColorStoneWeight.toFixed(2))} ct
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Center Diamond Configuration Card ── */}
        {stoneConfigType === 'centerDiamond' && (
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
                    ref={centerCaratInputRef}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.5"
                    value={caratInput}
                    onChange={(e) => setCaratInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCarat();
                        centerCaratInputRef.current?.focus();
                      }
                    }}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddCarat();
                      centerCaratInputRef.current?.focus();
                    }}
                    className="w-8 h-8 flex-shrink-0 rounded-lg bg-[#8b6f4e] hover:bg-[#785e42] text-white flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
                    title="Add Carat Weight"
                  >
                    +
                  </button>
                </div>

                {/* Carat Tags with Delete 'x' */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {centerDiamondCarats.map((ct) => (
                    <span
                      key={ct}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-[#8b6f4e] text-white text-[13px] font-semibold shadow-xs select-none"
                    >
                      <span>{ct} ct</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCarat(ct)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/20 transition-all cursor-pointer shrink-0"
                        title={`Remove ${ct} ct`}
                        aria-label={`Remove ${ct} ct`}
                      >
                        <HiOutlineX className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-Generated Combinations Table */}
            <div className="pt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8b6f4e]" />
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    AUTO-GENERATED COMBINATIONS ({centerDiamondCombinations.length})
                  </h5>
                </div>
                {centerDiamondCombinations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCombinationsCollapsed((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                    title={isCombinationsCollapsed ? 'Expand Combinations Table' : 'Collapse Combinations Table'}
                  >
                    <span>{isCombinationsCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isCombinationsCollapsed ? (
                      <HiOutlineChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <HiOutlineChevronUp className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>
                )}
              </div>

              {centerDiamondCombinations.length === 0 ? (
                <div className="py-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
                  <p className="text-xs text-stone-400">
                    Select colors, clarities, and add carat weights to generate combinations.
                  </p>
                </div>
              ) : isCombinationsCollapsed ? (
                <div
                  onClick={() => setIsCombinationsCollapsed(false)}
                  className="py-2.5 px-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs text-stone-500 hover:bg-stone-100/70 transition-colors cursor-pointer"
                >
                  <span>{centerDiamondCombinations.length} auto-generated combinations collapsed.</span>
                  <span className="font-semibold text-[#8b6f4e] inline-flex items-center gap-1">
                    Expand <HiOutlineChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50/60 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        <th className="py-2.5 px-3 w-16 font-bold text-center">SR NO</th>
                        <th className="py-2.5 px-4 font-bold">DIAMOND TYPE</th>
                        <th className="py-2.5 px-3 font-bold">COLOR</th>
                        <th className="py-2.5 px-3 font-bold">CLARITY</th>
                        <th className="py-2.5 px-3 font-bold">CARAT (CT)</th>
                        <th className="py-2.5 px-3 font-bold">RATE / CT (₹)</th>
                        <th className="py-2.5 px-4 font-bold text-right">TOTAL PRICE (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-sans">
                      {centerDiamondCombinations.map((combo, idx) => (
                        <tr key={combo.id} className="hover:bg-stone-50/40 transition-colors">
                          <td className="py-2.5 px-3 text-center text-[11px] font-semibold text-stone-500 whitespace-nowrap">
                            {idx + 1}
                          </td>
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
        )}

        {/* ── Side Stone Configuration Card ── */}
        <div className="p-5 rounded-2xl border border-stone-200/90 bg-white space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-900">
                SIDE STONE CONFIGURATION
              </h4>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Configure accent diamonds and/or gemstones.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
              {[
                { id: 'sideDiamond', label: 'Side Diamond' },
                { id: 'sideColorStone', label: 'Side Color Stone' },
                { id: 'both', label: 'Both' },
                { id: 'none', label: 'None' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSideStoneConfigType(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sideStoneConfigType === opt.id
                      ? 'bg-[#8b6f4e] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Side Diamond Editor (if sideDiamond or both) */}
          {(sideStoneConfigType === 'sideDiamond' || sideStoneConfigType === 'both') && (
            <div className="pt-2">
              <h5 className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider mb-2">Side Diamonds</h5>
              <SideDiamondEditor rows={sideRows} onChange={setSideRows} masters={diamondMasters} />
            </div>
          )}

          {/* Side Color Stone Section (if sideColorStone or both) */}
          {(sideStoneConfigType === 'sideColorStone' || sideStoneConfigType === 'both') && (
            <div className="pt-3 space-y-3 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IoDiamondOutline className="w-4 h-4 text-[#8b6f4e]" />
                  <h5 className="text-[10.5px] font-bold text-stone-700 uppercase tracking-wider">
                    SIDE COLOR STONE CONFIGURATION
                  </h5>
                </div>
                <span className="text-[11px] font-bold text-[#8b6f4e] bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#8b6f4e]/20">
                  Rate: ₹3,000 / ct (Fixed)
                </span>
              </div>

              {/* Add Side Color Stone Row Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    STONE TYPE
                  </label>
                  <Dropdown
                    size="sm"
                    value={sideColorStoneType}
                    onChange={(val) => setSideColorStoneType(val)}
                    options={diamondTypesList}
                    placeholder="Select Type"
                    buttonClassName="h-8 px-2.5 text-xs rounded-lg bg-white border-stone-200 font-semibold text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    STONE SHAPE
                  </label>
                  <Dropdown
                    size="sm"
                    value={sideColorStoneShape}
                    onChange={(val) => setSideColorStoneShape(val)}
                    options={diamondShapesList}
                    placeholder="Select Shape"
                    buttonClassName="h-8 px-2.5 text-xs rounded-lg bg-white border-stone-200 font-semibold text-stone-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    PIECES
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sideColorStonePieces}
                    onChange={(e) => setSideColorStonePieces(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    CARAT WEIGHT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={sideColorStoneCarat}
                    onChange={(e) => setSideColorStoneCarat(e.target.value)}
                    placeholder="e.g. 0.50"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddSideColorStoneRow}
                    className="w-full h-8 px-3 rounded-lg bg-[#8b6f4e] hover:bg-[#785e42] text-white flex items-center justify-center gap-1 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <HiOutlinePlus className="w-4 h-4" /> Add Row
                  </button>
                </div>
              </div>

              {/* Side Color Stone Table */}
              {sideColorStoneRows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50/60 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        <th className="py-2.5 px-3 w-16 font-bold text-center">SR NO</th>
                        <th className="py-2.5 px-4 font-bold">TYPE</th>
                        <th className="py-2.5 px-3 font-bold">SHAPE</th>
                        <th className="py-2.5 px-3 font-bold text-center">PIECES</th>
                        <th className="py-2.5 px-3 font-bold text-center">CARAT WEIGHT</th>
                        <th className="py-2.5 px-3 font-bold">RATE / CT</th>
                        <th className="py-2.5 px-4 font-bold text-right">TOTAL</th>
                        <th className="py-2.5 px-3 w-14 font-bold text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {sideColorStoneRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-stone-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-bold text-stone-800">{row.diamondType || '—'}</td>
                          <td className="py-2.5 px-3 font-semibold text-stone-800 uppercase">{row.diamondShape || '—'}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-stone-800">{row.pieces || 1}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-stone-800">{row.caratWeight} ct</td>
                          <td className="py-2.5 px-3 font-semibold text-[#8b6f4e]">₹3,000 / ct (Fixed)</td>
                          <td className="py-2.5 px-4 text-right font-bold text-stone-900">
                            ₹{(Number(row.caratWeight || 0) * 3000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSideColorStoneRow(row.id)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove row"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Sub-Section 3: Preview Variants ───────── */}
      <div className="space-y-2.5 pt-5 border-t border-stone-300">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              3
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-stone-900">Preview Variants</h3>
              <span aria-live="polite" className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                Total Variants: {variants.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-[10px] font-semibold text-stone-500">
              Other amount markup %
              <input
                type="number"
                min="0"
                value={specs.otherAmountPercentage}
                onChange={(e) => setSpecs((prev) => ({ ...prev, otherAmountPercentage: e.target.value }))}
                className="w-16 px-2 py-1.5 text-xs text-stone-800 rounded-md border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
              />
            </label>
            <button
              type="button"
              disabled={computingPrices}
              onClick={handleRegenerateVariants}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] border border-[#8b6f4e] rounded-lg hover:bg-[#765b3d] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              <span>{variants.length ? 'Recompute Variants' : 'Compute Variants'}</span>
            </button>
            {variants.length > 0 && (
              <button
                type="button"
                onClick={() => setIsVariantsPreviewCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                title={isVariantsPreviewCollapsed ? 'Expand Variants Table' : 'Collapse Variants Table'}
              >
                <span>{isVariantsPreviewCollapsed ? 'Expand' : 'Collapse'}</span>
                {isVariantsPreviewCollapsed ? (
                  <HiOutlineChevronDown className="w-3.5 h-3.5 text-stone-500" />
                ) : (
                  <HiOutlineChevronUp className="w-3.5 h-3.5 text-stone-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {isVariantsPreviewCollapsed && variants.length > 0 ? (
          <div
            onClick={() => setIsVariantsPreviewCollapsed(false)}
            className="py-3 px-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs text-stone-500 hover:bg-stone-100/70 transition-colors cursor-pointer"
          >
            <span>{variants.length} preview variants hidden. Click to expand and view full pricing table.</span>
            <span className="font-semibold text-[#8b6f4e] inline-flex items-center gap-1">
              Expand <HiOutlineChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        ) : (
          <>
            {/* Quick Karat / Purity Break Tabs */}
            {purityGroups.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                  Karat Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setVariantPurityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    variantPurityFilter === 'ALL'
                      ? 'bg-[#8b6f4e] text-white shadow-2xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  All Purities ({variants.length})
                </button>
                {purityGroups.map((g) => (
                  <button
                    type="button"
                    key={g.purity}
                    onClick={() => setVariantPurityFilter(g.purity)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      variantPurityFilter === g.purity
                        ? 'bg-[#8b6f4e] text-white shadow-2xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {g.purity} ({g.items.length})
                  </button>
                ))}
              </div>
            )}

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
                      displayedPurityGroups.map((group) => {
                        return (
                          <Fragment key={group.purity}>
                            {/* KT / Purity Group Header Break */}
                            <tr className="bg-stone-50/60 border-y border-stone-200">
                              <td colSpan={8} className="py-2 px-3">
                                <span className="font-bold text-xs text-stone-700 uppercase tracking-wide">
                                  {group.purity}
                                </span>
                              </td>
                            </tr>

                            {group.items.map(({ v, index: variantIndex }) => {
                              const detailsList = [
                                v.diamondType || v.diamondDetails?.type || (diamondMasters?.types || []).find((item) => String(item?._id) === String(v.diamondTypeId?._id || v.diamondTypeId))?.name,
                                v.diamondColor || v.diamondDetails?.color || (diamondMasters?.colors || []).find((item) => String(item?._id) === String(v.diamondColorId?._id || v.diamondColorId))?.name,
                                v.diamondClarity || v.diamondDetails?.clarity || (diamondMasters?.clarities || []).find((item) => String(item?._id) === String(v.diamondClarityId?._id || v.diamondClarityId))?.name,
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
                                          className="inline-flex px-2 py-0.5 text-[9.5px] font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-md"
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
                                  <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs text-stone-900 whitespace-nowrap" title={breakdownText}>
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      <span>₹{Number(v.priceRaw || v.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPriceBreakdown(v)}
                                        title="Calculate & View Price Breakdown"
                                        className="w-5 h-5 rounded border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                      >
                                        <HiOutlineCalculator className="w-3.5 h-3.5 stroke-[1.8]" />
                                      </button>
                                    </div>
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
                                      className="w-7 h-7 rounded-lg text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                                      title="Delete variant"
                                    >
                                      <HiOutlineTrash className="w-4 h-4 stroke-[1.8]" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
