import React from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlinePhotograph,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineCube,
  HiOutlineStar,
  HiOutlineX,
  HiOutlineVideoCamera,
  HiOutlineInformationCircle,
  HiOutlineAdjustments,
} from 'react-icons/hi';
import ColorStatusToggle from '../../../components/common/ColorStatusToggle';
import { getMediaUrl } from '../../../utils/imageUrl';
import { getUploadedObjectKey } from '../../../utils/uploadWithPresignedUrl';
import api from '../../../api/axios';
import { getSphereStyle } from './metalColorHelpers';
import AddMetalColorModal from './AddMetalColorModal';
import VtoStudioModal from './VtoStudioModal';
import CompressionHubModal from './CompressionHubModal';
import { useAddJewelryProductContext } from './AddJewelryProductContext';
import { getUploadTriggerProps } from '../../../utils/filePickerAutoOpen';

export default function Step4GoldMedia() {
  const {
    isSilverProduct,
    productColors,
    colorsList,
    activeMediaColor,
    setActiveMediaColor,
    mediaImages,
    mediaVideos,
    vtoConfigs,
    setIsAddColorModalOpen,
    colorStatuses,
    setColorStatuses,
    activeMediaSubTab,
    setActiveMediaSubTab,
    setCompressionTab,
    setSelectedCompressionIds,
    setCompressionPreviews,
    setShowCompressionHub,
    handleMixedMediaUpload,
    handleOpenImagePreview,
    handleSetPrimaryMedia,
    isSizeInKb,
    formatMediaSize,
    handleRemoveMedia,
    setViewingCompressionMedia,
    handleRemoveVideo,
    handleOpenVtoStudio,
  } = useAddJewelryProductContext();

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 shadow-2xs space-y-5 sm:space-y-6 animate-fadeIn">
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
                  const sphere = getSphereStyle(colorObj);
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
                          className="w-8 h-8 rounded-full shrink-0 border border-black/10 shadow-sm"
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
              <Link
                to="/metal-color?action=add"
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 hover:border-[#8b6f4e] bg-stone-50/50 hover:bg-[#faf7f2]/40 text-stone-700 hover:text-[#8b6f4e] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span>Add Metal Color</span>
              </Link>
            </>
          )}
        </div>

        {/* ─── Right Column: Active Metal Color Media Showcase ── */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-4 sm:space-y-5 min-w-0">
          {/* Active Color Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-3">
              {!isSilverProduct && (
                <div
                  className="w-9 h-9 rounded-full shrink-0 border border-black/10 shadow-sm"
                  style={{
                    background: getSphereStyle(activeMediaColor).gradient,
                    boxShadow: getSphereStyle(activeMediaColor).shadow,
                  }}
                />
              )}
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  {isSilverProduct ? 'Silver Product' : activeMediaColor}
                </h4>
              </div>
            </div>

            {!isSilverProduct && (
              <div className="flex items-center gap-3">
                <ColorStatusToggle
                  name={activeMediaColor}
                  status={colorStatuses[activeMediaColor]}
                  disabled={!activeMediaColor}
                  onChange={(status) =>
                    setColorStatuses((previous) => ({ ...previous, [activeMediaColor]: status }))
                  }
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
                <span>
                  Product Media (
                  {(mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length}
                  )
                </span>
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
              {!isSilverProduct &&
                (mediaImages[activeMediaColor] || []).length + (mediaVideos[activeMediaColor] || []).length > 0 && (
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
                    <HiOutlinePhotograph className="w-4 h-4 text-[#8b6f4e]" />
                    <span>Media Compression</span>
                  </button>
                )}
            </div>
          </div>

          {/* Unified Product Media Content (Images & Videos Mixed in Multi-Row Grid) */}
          {(activeMediaSubTab === 'media' || activeMediaSubTab === 'images') && (
            <div className="relative">
              {/* Responsive Grid Layout Utilizing All Space */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                {/* Upload Media Button Card */}
                <label
                  htmlFor="metal-color-upload-input"
                  {...getUploadTriggerProps(null, { fileInputId: 'metal-color-upload-input' })}
                  className="aspect-square w-full rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 bg-[#fdfcfb] hover:bg-[#faf7f2]/50 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group shadow-2xs"
                >
                  <input
                    id="metal-color-upload-input"
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
                    onChange={(e) => handleMixedMediaUpload(e, activeMediaColor)}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full border border-stone-300 group-hover:border-[#8b6f4e] bg-white group-hover:bg-[#faf5ee] text-stone-400 group-hover:text-[#8b6f4e] flex items-center justify-center transition-all mb-2 shadow-2xs group-hover:scale-105">
                    <HiOutlinePlus className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-stone-800 group-hover:text-[#8b6f4e]">
                    Upload Media
                  </span>
                </label>

                {/* Uploaded Image Cards */}
                {(mediaImages[activeMediaColor] || []).map((img, i) => {
                  const gallery = (mediaImages[activeMediaColor] || []).map((m) => m.url);
                  return (
                    <div
                      key={img.id || i}
                      onClick={() => handleOpenImagePreview(img.url, gallery)}
                      className="relative aspect-square w-full rounded-2xl border border-stone-200/90 overflow-hidden bg-white shadow-2xs group cursor-pointer transition-all hover:shadow-md hover:border-[#8b6f4e]"
                      title="Click to zoom in / inspect"
                    >
                      <img
                        src={getMediaUrl(img.url) || img.url}
                        alt={`${activeMediaColor} ${i + 1}`}
                        onError={(e) => {
                          const key = img.key || getUploadedObjectKey(img.url);
                          if (key && !e.target.dataset.fallback) {
                            e.target.dataset.fallback = 'true';
                            const backendBase = api.defaults?.baseURL || '';
                            e.target.src = `${backendBase}/upload/file?key=${encodeURIComponent(key)}`;
                          }
                        }}
                        className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* Hover Zoom Hint Overlay */}
                      <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="p-2 rounded-full bg-white/90 text-stone-800 shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </span>
                      </div>

                      {/* Top Left Badge or Set Primary */}
                      {img.isPrimary ? (
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8b6f4e] text-white shadow-xs flex items-center gap-1">
                          <HiOutlineStar className="w-3 h-3 fill-white" />
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryMedia(activeMediaColor, img.id);
                          }}
                          className="absolute top-2 left-2 z-10 px-1.5 py-1 rounded-md bg-black/60 hover:bg-[#8b6f4e] text-white opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer text-[10px] font-semibold flex items-center gap-1"
                          title="Set as Primary"
                        >
                          <HiOutlineStar className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Set Primary</span>
                        </button>
                      )}

                      {/* File Size Badge */}
                      {(img.size || img.fileSize) && (
                        <span
                          className={`absolute top-2 right-2 group-hover:right-9 transition-all z-10 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold font-mono shadow-xs backdrop-blur-xs flex items-center gap-1 border ${
                            isSizeInKb(img.fileSize || img.size)
                              ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50/95 text-amber-800 border-amber-200'
                          }`}
                          title={
                            isSizeInKb(img.fileSize || img.size)
                              ? `${img.size || formatMediaSize(img.fileSize)} — Size is in KB (Compression not allowed)`
                              : `${img.size || formatMediaSize(img.fileSize)} — Size is in MB (Eligible for compression)`
                          }
                        >
                          {img.size || formatMediaSize(img.fileSize)}
                        </span>
                      )}

                      {/* Image Order Badge */}
                      <span className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono bg-stone-900/60 text-white backdrop-blur-xs">
                        #{i + 1}
                      </span>

                      {/* Top Right Close / Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMedia(activeMediaColor, img.id);
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-black/50 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer"
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
                    className="relative aspect-square w-full rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-900 shadow-2xs group flex flex-col justify-end p-2.5 text-white cursor-pointer hover:shadow-md hover:border-[#8b6f4e] transition-all"
                    title="Click to view & play video"
                  >
                    <video
                      src={getMediaUrl(vid.url) || vid.url}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
                    />

                    {/* Video Badge */}
                    <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-black/75 text-amber-300 backdrop-blur-xs shadow-xs">
                      <HiOutlineVideoCamera className="w-3 h-3" />
                      Video
                    </span>

                    {/* Video Size Badge */}
                    {(vid.size || vid.fileSize) && (
                      <span className="absolute top-2 right-2 group-hover:right-9 transition-all z-10 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold font-mono bg-black/75 text-stone-200 border border-white/10 backdrop-blur-xs shadow-xs">
                        {vid.size || formatMediaSize(vid.fileSize)}
                      </span>
                    )}

                    {/* Center Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                        <svg className="w-4 h-4 fill-white translate-x-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs font-bold truncate drop-shadow-sm">
                        {vid.title || vid.name || 'Product Video'}
                      </p>
                      <p className="text-[10px] text-stone-300 drop-shadow-sm font-mono">
                        {vid.size || 'Video asset'}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVideo(activeMediaColor, vid.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
                      title="Remove video"
                    >
                      <HiOutlineX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VTO setup */}
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

      {/* Modals associated with Step 4 */}
      <CompressionHubModal />
      <VtoStudioModal />
      <AddMetalColorModal />
    </div>
  );
}
