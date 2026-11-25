import {
  HiOutlineCheck,
  HiOutlinePhotograph,
  HiOutlineChevronUp,
  HiOutlineChevronRight,
  HiOutlineTrash,
  HiOutlineUpload,
  HiOutlinePlus,
} from 'react-icons/hi';
import { IoColorPaletteOutline } from 'react-icons/io5';
import ColorStatusToggle from '../../../components/common/ColorStatusToggle';
import { useAddJewelryProductContext } from './AddJewelryProductContext';
import { getUploadTriggerProps } from '../../../utils/filePickerAutoOpen';

export default function Step4SilverMedia() {
  const {
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
    handleOpenImagePreview,
  } = useAddJewelryProductContext();

  return (
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {silverColorOptions.map((col) => {
          const isSelected = isSilverColorSelected(col.name);
          const isExpanded = isSilverColorExpanded(col.name);
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
              <div className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
                {/* Left side: Checkbox + 3D Swatch Sphere + Color Name + Selected Badge */}
                <div
                  onClick={() => handleToggleSilverColor(col.name)}
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
                    status={silverVariantMedia[col.name]?.status}
                    onChange={(status) =>
                      setSilverVariantMedia((previous) => ({
                        ...previous,
                        [col.name]: { ...previous[col.name], status },
                      }))
                    }
                  />

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
                              onClick={() => handleRemoveSilverSwatchIcon(col.name)}
                              className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg cursor-pointer transition-colors"
                              title="Remove icon"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          {...getUploadTriggerProps(null, { disabled: isUploadingSwatch, fileInputId: `silver-swatch-upload-${col.name}` })}
                          onClick={() =>
                            document.getElementById(`silver-swatch-upload-${col.name}`)?.click()
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
                      <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-800">
                            Product images &amp; videos
                          </span>
                        </div>
                        {vData.media && vData.media.length > 0 && (
                          <span className="text-[11px] font-semibold text-[#8b6f4e] bg-[#faf5ee] px-2 py-0.5 rounded-full border border-[#ecd9c2]">
                            {vData.media.length} media item{vData.media.length === 1 ? '' : 's'}
                          </span>
                        )}
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
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto">
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
                                  className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-red-600 text-red-600 hover:text-white rounded-md border border-red-200/60 shadow-2xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                  title="Delete media"
                                >
                                  <HiOutlineTrash className="w-3 h-3 text-red-600 group-hover:text-white" />
                                </button>
                              </div>
                            ))}

                            <div
                              {...getUploadTriggerProps(null, { fileInputId: `silver-media-upload-${col.name}` })}
                              onClick={() =>
                                document.getElementById(`silver-media-upload-${col.name}`)?.click()
                              }
                              className="border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors rounded-lg flex flex-col items-center justify-center text-center cursor-pointer aspect-square"
                            >
                              <HiOutlinePlus className="w-4 h-4 text-[#8b6f4e]" />
                              <span className="text-[10px] font-semibold text-stone-700 mt-0.5">
                                Add
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          {...getUploadTriggerProps(null, { disabled: isUploadingMedia, fileInputId: `silver-media-upload-${col.name}` })}
                          onClick={() =>
                            document.getElementById(`silver-media-upload-${col.name}`)?.click()
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
          const isSelected = isSilverColorSelected(colName);
          const isExpanded = isSilverColorExpanded(colName);
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
              <div className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
                {/* Left side: Checkbox + Swatch Sphere + Name + Selected Badge */}
                <div
                  onClick={() => handleToggleSilverColor(colName)}
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
                    status={silverVariantMedia[colName]?.status}
                    onChange={(status) =>
                      setSilverVariantMedia((previous) => ({
                        ...previous,
                        [colName]: { ...previous[colName], status },
                      }))
                    }
                  />

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
                              onClick={() => handleRemoveSilverSwatchIcon(colName)}
                              className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg cursor-pointer transition-colors"
                              title="Remove icon"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          {...getUploadTriggerProps(null, { disabled: isUploadingSwatch, fileInputId: `silver-swatch-upload-${colName}` })}
                          onClick={() =>
                            document.getElementById(`silver-swatch-upload-${colName}`)?.click()
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
                      <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-800">
                            Product images &amp; videos
                          </span>
                        </div>
                        {vData.media && vData.media.length > 0 && (
                          <span className="text-[11px] font-semibold text-[#8b6f4e] bg-[#faf5ee] px-2 py-0.5 rounded-full border border-[#ecd9c2]">
                            {vData.media.length} media item{vData.media.length === 1 ? '' : 's'}
                          </span>
                        )}
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
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto">
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
                                  className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-red-600 text-red-600 hover:text-white rounded-md border border-red-200/60 shadow-2xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                  title="Delete media"
                                >
                                  <HiOutlineTrash className="w-3 h-3 text-red-600 group-hover:text-white" />
                                </button>
                              </div>
                            ))}

                            <div
                              {...getUploadTriggerProps(null, { fileInputId: `silver-media-upload-${colName}` })}
                              onClick={() =>
                                document.getElementById(`silver-media-upload-${colName}`)?.click()
                              }
                              className="border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors rounded-lg flex flex-col items-center justify-center text-center cursor-pointer aspect-square"
                            >
                              <HiOutlinePlus className="w-4 h-4 text-[#8b6f4e]" />
                              <span className="text-[10px] font-semibold text-stone-700 mt-0.5">
                                Add
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          {...getUploadTriggerProps(null, { disabled: isUploadingMedia, fileInputId: `silver-media-upload-${colName}` })}
                          onClick={() =>
                            document.getElementById(`silver-media-upload-${colName}`)?.click()
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
  );
}
