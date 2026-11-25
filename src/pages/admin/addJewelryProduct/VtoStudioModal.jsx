import React from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineUpload, HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi';
import Dropdown from '../../../components/common/Dropdown';
import { getMediaUrl } from '../../../utils/imageUrl';
import { useAddJewelryProductContext } from './AddJewelryProductContext';
import { getUploadTriggerProps } from '../../../utils/filePickerAutoOpen';

export default function VtoStudioModal() {
  const {
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
  } = useAddJewelryProductContext();

  if (!isVtoStudioOpen) return null;

  return createPortal(
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
        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Asset & Precision Sliders */}
          <div className="md:col-span-6 space-y-5">
            {/* 1. Try-On Overlay Asset */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                1. TRY-ON OVERLAY ASSET
              </label>
              <label
                htmlFor="vto-overlay-upload"
                {...getUploadTriggerProps(null, { fileInputId: 'vto-overlay-upload' })}
                className="block border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 rounded-xl p-4 text-center bg-[#fdfcfb] cursor-pointer transition-colors group"
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
                options={(vtoEnvOptions || []).map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                placeholder="Select Target Environment"
                buttonClassName="h-10 px-3 text-xs rounded-xl bg-white border-stone-200 font-semibold text-stone-800"
              />
            </div>

            {/* Studio Live View Box */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-md flex items-center justify-center select-none group">
              {/* Environment Model Background Image */}
              <img
                src={getMediaUrl(vtoMasters[vtoForm.vtoCategory]?.[vtoForm.skinTone])}
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
        <div className="p-3.5 sm:p-4 border-t border-stone-100 bg-stone-50/50 flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
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
    </div>,
    document.body
  );
}
