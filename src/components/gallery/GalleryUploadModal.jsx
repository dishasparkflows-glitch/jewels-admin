import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineCheck,
  HiOutlinePhotograph,
  HiOutlineLink,
  HiOutlineEye,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Dropdown from '../common/Dropdown';
import { getUploadTriggerProps } from '../../utils/filePickerAutoOpen';
import {
  formatBytes,
  uploadFilesWithPresignedUrls,
  getUploadCompressionSettings,
  getGlobalCompressionOptions,
  compressImageFile,
  isCompressibleImage,
  COMPRESSION_PRESETS,
  DEFAULT_UPLOAD_COMPRESSION_SETTINGS,
} from '../../utils/uploadWithPresignedUrl';
import { galleryAPI } from '../../api/services';
import PlacementSelect, { PLACEMENT_OPTIONS } from '../common/PlacementSelect';

export default function GalleryUploadModal({
  isOpen,
  onClose,
  defaultThemeId = '',
  defaultType = 'asset',
  modalThemeOptions = [],
  placementTypeOptions = [],
  onSuccess,
  zIndexClass = 'z-[10500]',
}) {
  const [uploadThemeId, setUploadThemeId] = useState('');
  const [uploadType, setUploadType] = useState(defaultType || 'asset');
  const [uploadPlatform, setUploadPlatform] = useState('web');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Target Records Loading, Multi-selection & Mapping states (Supports all Banner types & Celebrate & Gifts)
  const [availableRecords, setAvailableRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [imageRecordMap, setImageRecordMap] = useState({});
  const [previewModalData, setPreviewModalData] = useState(null);
  const [compressionSettings, setCompressionSettings] = useState(DEFAULT_UPLOAD_COMPRESSION_SETTINGS);

  const recordDropdownOptions = useMemo(() => [
    { value: '', label: '(None / General Asset)' },
    ...availableRecords.map((r) => {
      const displayName = r.title || r.name || 'Untitled';
      const cat = r.categoryName ? ` · ${r.categoryName}` : '';
      const badge = r.displayType || r.display?.type ? ` [${r.displayType || r.display?.type}]` : '';
      return {
        value: r._id,
        label: `${displayName}${cat}${badge}`,
      };
    }),
  ], [availableRecords]);

  const BANNER_TYPES = [
    'herobanner',
    'collectionbanner',
    'categorybanner',
    'offerbanner',
    'mobileappbanner',
    'bookappointbanner',
    'customizebanner',
  ];

  const BANNER_META = {
    herobanner: {
      title: 'Hero Banner',
      singular: 'Hero Banner',
    },
    collectionbanner: {
      title: 'Collection Banner',
      singular: 'Collection Banner',
    },
    categorybanner: {
      title: 'Category Banner',
      singular: 'Category Banner',
    },
    offerbanner: {
      title: 'Offer Banner',
      singular: 'Offer Banner',
    },
    mobileappbanner: {
      title: 'Mobile App Banner',
      singular: 'Mobile App Banner',
    },
    bookappointbanner: {
      title: 'Appointment Banner',
      singular: 'Appointment Banner',
    },
    customizebanner: {
      title: 'Custom Banner',
      singular: 'Custom Banner',
    },
  };

  const isBannerType = BANNER_TYPES.includes(uploadType);
  const isTargetMappable = isBannerType || uploadType === 'celebrate';
  const targetModule = uploadType === 'celebrate' ? 'featured' : (isBannerType ? 'banner' : null);

  const targetModuleTitle = uploadType === 'celebrate'
    ? 'Celebrate & Gifts (Featured)'
    : (BANNER_META[uploadType]?.title || 'Banner');

  const targetSingularLabel = uploadType === 'celebrate'
    ? 'Celebrate & Gift'
    : (BANNER_META[uploadType]?.singular || 'Banner');

  const fileInputRef = useRef(null);

  const fetchTargetRecords = async (type, themeId) => {
    const isBanner = BANNER_TYPES.includes(type);
    if (!isBanner && type !== 'celebrate') {
      setAvailableRecords([]);
      setSelectedRecordIds([]);
      setImageRecordMap({});
      return;
    }

    setLoadingRecords(true);
    try {
      let list = [];
      if (type === 'celebrate') {
        const res = await galleryAPI.getFeatureds({ themeId: themeId || undefined });
        const data = res?.data?.data || res?.data || [];
        list = Array.isArray(data) ? data : [];
      } else {
        const res = await galleryAPI.getBanners({
          type: type,
          themeId: themeId || undefined,
        });
        const data = res?.data?.data || res?.data || [];
        list = Array.isArray(data) ? data : [];
      }

      setAvailableRecords(list);

      setSelectedRecordIds((prev) => {
        if (prev.length > 0) {
          const valid = prev.filter((id) => list.some((b) => b._id === id));
          return valid.length > 0 ? valid : (list[0]?._id ? [list[0]._id] : []);
        }
        return list[0]?._id ? [list[0]._id] : [];
      });
    } catch (err) {
      console.warn(`Failed to load ${type} records:`, err);
      setAvailableRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initialType = defaultType || 'asset';
      setUploadThemeId(defaultThemeId || '');
      setUploadType(initialType);
      setUploadPlatform('web');
      fetchTargetRecords(initialType, defaultThemeId);
      getUploadCompressionSettings().then((settings) => {
        if (settings) setCompressionSettings(settings);
      });
    } else {
      resetUploadModal();
    }
  }, [isOpen, defaultThemeId, defaultType]);

  useEffect(() => {
    if (isOpen) {
      fetchTargetRecords(uploadType, uploadThemeId);
    }
  }, [isOpen, uploadType, uploadThemeId]);

  useEffect(() => {
    if (previewModalData) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setPreviewModalData(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewModalData]);

  const resetUploadModal = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setSelectedFiles([]);
    setSelectedRecordIds([]);
    setImageRecordMap({});
    setPreviewModalData(null);
    setIsDragging(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecordIds((prev) => {
      const exists = prev.includes(recordId);
      const next = exists ? prev.filter((id) => id !== recordId) : [...prev, recordId];
      return next;
    });
  };

  const handleSelectAllRecords = () => {
    setSelectedRecordIds(availableRecords.map((r) => r._id));
  };

  const handleClearRecordSelection = () => {
    setSelectedRecordIds([]);
  };

  const handleAutoDistributeRecords = () => {
    if (!selectedFiles.length || !availableRecords.length) return;
    const pool = selectedRecordIds.length > 0 ? selectedRecordIds : availableRecords.map((r) => r._id);
    const updated = {};
    selectedFiles.forEach((file, idx) => {
      updated[file.id] = pool[idx % pool.length];
    });
    setImageRecordMap(updated);
    toast.success(`Mapped ${selectedFiles.length} images sequentially to selected ${targetModuleTitle}`);
  };

  const addFiles = async (filesList) => {
    const rawFiles = Array.from(filesList || []);
    if (!rawFiles.length) return;

    const validImages = [];
    rawFiles.forEach((file) => {
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file.name);
      if (isImg) {
        validImages.push(file);
      } else {
        toast.error(`"${file.name}" is not a supported image file.`);
      }
    });

    if (!validImages.length) return;

    // Create preliminary entries with preview and compressing state
    const newItems = validImages.map((file) => {
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        id: tempId,
        file,
        name: file.name,
        originalName: file.name,
        originalSize: file.size,
        compressedSize: file.size,
        savingsPercent: 0,
        isCompressing: isCompressibleImage(file),
        wasCompressed: false,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);

    // Auto-map target records for newly added images
    if (isTargetMappable) {
      setImageRecordMap((prev) => {
        const updated = { ...prev };
        const pool = selectedRecordIds.length > 0 ? selectedRecordIds : availableRecords.map((b) => b._id);
        if (pool.length > 0) {
          const existingCount = Object.keys(updated).length;
          newItems.forEach((item, idx) => {
            if (!updated[item.id]) {
              updated[item.id] = pool[(existingCount + idx) % pool.length];
            }
          });
        }
        return updated;
      });
    }

    // Compress in background and update each item with exact compressed KB size & savings
    try {
      const uploadSettings = await getUploadCompressionSettings();
      const shouldCompress = uploadSettings?.enabled !== false;
      const preset =
        COMPRESSION_PRESETS['website-themes'] ||
        COMPRESSION_PRESETS.banners ||
        COMPRESSION_PRESETS.general;
      const compressionOpts = getGlobalCompressionOptions(
        preset,
        uploadSettings || DEFAULT_UPLOAD_COMPRESSION_SETTINGS
      );

      await Promise.all(
        newItems.map(async (item) => {
          if (!shouldCompress || !isCompressibleImage(item.file)) {
            setSelectedFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, isCompressing: false } : f))
            );
            return;
          }

          try {
            const compressed = await compressImageFile(item.file, compressionOpts);
            const compUrl = URL.createObjectURL(compressed);

            setSelectedFiles((prev) =>
              prev.map((f) => {
                if (f.id !== item.id) return f;
                // Revoke old blob url
                if (f.previewUrl?.startsWith('blob:') && f.previewUrl !== compUrl) {
                  try {
                    URL.revokeObjectURL(f.previewUrl);
                  } catch {
                    // Ignore blob URL revoke failures
                  }
                }
                const originalSize = f.originalSize || f.size;
                const compressedSize = compressed.size;
                const savingsBytes = Math.max(0, originalSize - compressedSize);
                const savingsPercent =
                  originalSize > 0 ? Math.round((savingsBytes / originalSize) * 100) : 0;

                return {
                  ...f,
                  file: compressed,
                  name: compressed.name || f.name,
                  compressedSize,
                  savingsPercent,
                  isCompressing: false,
                  wasCompressed: true,
                  previewUrl: compUrl,
                };
              })
            );
          } catch (err) {
            console.warn('Compression failed for', item.name, err);
            setSelectedFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, isCompressing: false } : f))
            );
          }
        })
      );
    } catch (err) {
      console.warn('Background compression setup error:', err);
    }
  };

  const removeFile = (id) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    setImageRecordMap((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const totalOriginalBytes = selectedFiles.reduce(
    (sum, f) => sum + (f.originalSize || f.size || 0),
    0
  );
  const totalCompressedBytes = selectedFiles.reduce(
    (sum, f) => sum + (f.compressedSize || f.size || 0),
    0
  );
  const totalSavingsBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const totalSavingsPercent =
    totalOriginalBytes > 0 ? Math.round((totalSavingsBytes / totalOriginalBytes) * 100) : 0;

  const handleUploadAndAssign = async (e) => {
    e?.preventDefault();

    if (!selectedFiles.length) {
      toast.error('Please select at least one image file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(5);
      const total = selectedFiles.length;
      setUploadProgressText(
        `Preparing to upload ${total} optimized image${total > 1 ? 's' : ''} (${formatBytes(totalCompressedBytes)})...`
      );

      const rawFiles = selectedFiles.map((item) => item.file);
      const uploadResults = await uploadFilesWithPresignedUrls(
        rawFiles,
        'website-themes',
        (index, subProg) => {
          const overall = Math.round(((index + subProg / 100) / total) * 80);
          setUploadProgress(Math.max(5, overall));
        },
        {
          onFileUploading: (file, index) => {
            const sizeStr = formatBytes(file.size);
            setUploadProgressText(`Uploading image ${index + 1} of ${total}: ${file.name} (${sizeStr})...`);
          },
        }
      );

      const uploadedImages = uploadResults.map((uploadRes, index) => {
        const sourceItem = selectedFiles[index];
        const assignedRecordId =
          (sourceItem && imageRecordMap[sourceItem.id] !== undefined && imageRecordMap[sourceItem.id] !== '')
            ? imageRecordMap[sourceItem.id]
            : (selectedRecordIds.length > 0 ? selectedRecordIds[index % selectedRecordIds.length] : null);

        const imgObj = {
          url: uploadRes.fileUrl,
          key: uploadRes.key || '',
        };

        if (isTargetMappable && assignedRecordId) {
          imgObj.linkedRecord = {
            module: targetModule,
            recordId: assignedRecordId,
          };
        }
        return imgObj;
      });

      const primaryRecordId =
        (selectedFiles[0] && imageRecordMap[selectedFiles[0].id] !== undefined && imageRecordMap[selectedFiles[0].id] !== '')
          ? imageRecordMap[selectedFiles[0].id]
          : (selectedRecordIds[0] || null);

      setUploadProgress(85);
      setUploadProgressText(`Assigning images to theme and ${targetModuleTitle.toLowerCase()}...`);

      const payload = {
        themeId: uploadThemeId || undefined,
        type: uploadType,
        images: uploadedImages,
        platform: uploadPlatform,
        status: 'active',
      };

      if (isTargetMappable && primaryRecordId) {
        payload.linkedRecord = {
          module: targetModule,
          recordId: primaryRecordId,
        };
      }

      await galleryAPI.uploadAssign(payload);

      setUploadProgress(100);
      toast.success(
        total === 1
          ? `Image successfully optimized (${formatBytes(totalOriginalBytes)} → ${formatBytes(totalCompressedBytes)}) & assigned!`
          : `${total} images successfully optimized (${formatBytes(totalOriginalBytes)} → ${formatBytes(totalCompressedBytes)}, ${totalSavingsPercent}% saved) & assigned!`
      );
      resetUploadModal();
      onClose();
      await onSuccess?.();
    } catch (err) {
      console.error('Upload & assignment failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload and assign images.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadProgressText('');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndexClass || 'z-[10500]'} flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn`}
      onClick={() => {
        if (!isUploading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] my-auto flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8b6c3a]/15 text-[#8b6c3a]">
              <HiOutlineUpload className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Upload Media & Assign to Theme
                </h3>
                <span className="hidden sm:inline-flex items-center rounded-full bg-[#8b6c3a]/10 px-2 py-0.5 text-[10px] font-bold text-[#8b6c3a]">
                  Expanded Mapping Studio
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Configure theme & placement targets on the left, upload and map media files on the right.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isUploading) onClose();
            }}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form with Scrollable Body & Sticky Action Footer */}
        <form onSubmit={handleUploadAndAssign} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              {/* ─── LEFT COLUMN: TARGET SELECTION & BANNER/FEATURED MAPPING (col-span-5) ─── */}
              <div className="lg:col-span-5 space-y-4">
                {/* STEP 1: SELECT THEME */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-800">
                      1. Select Website Theme <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-stone-400">Target Theme</span>
                  </div>
                  <Dropdown
                    size="field"
                    value={uploadThemeId}
                    onChange={(val) => setUploadThemeId(val || '')}
                    options={modalThemeOptions}
                    placeholder="Select a website theme…"
                    portal={true}
                    menuClassName="z-[11000]"
                  />
                </div>

                {/* STEP 2: SELECT PLACEMENT TYPE VIA COMMON DROPDOWN */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-800">
                      2. Image Placement Type <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-stone-400">Slot Type</span>
                  </div>
                  <PlacementSelect
                    size="field"
                    value={uploadType}
                    onChange={(val) => setUploadType(val || 'asset')}
                    options={placementTypeOptions && placementTypeOptions.length > 0 ? placementTypeOptions : PLACEMENT_OPTIONS}
                    placeholder="Select image placement type…"
                    portal={true}
                    menuClassName="z-[11000]"
                  />
                </div>

                {/* STEP 2.5: SELECT LINKED TARGET RECORD(S) WHEN PLACEMENT IS HERO BANNER OR CELEBRATE & GIFTS */}
                {isTargetMappable && (
                  <div className="rounded-2xl border border-[#8b6c3a]/30 bg-[#faf6f0]/70 p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#8b6c3a] text-white text-[10px]">
                            ✓
                          </span>
                          Link to {targetModuleTitle}
                        </label>
                      </div>
                      {availableRecords.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllRecords}
                            className="text-[10.5px] font-semibold text-[#8b6c3a] hover:underline cursor-pointer"
                          >
                            All ({availableRecords.length})
                          </button>
                          <span className="text-stone-300">|</span>
                          <button
                            type="button"
                            onClick={handleClearRecordSelection}
                            className="text-[10.5px] font-semibold text-stone-400 hover:text-stone-600 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {loadingRecords ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-xs text-stone-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8b6c3a] border-t-transparent" />
                        <span>Loading {targetModuleTitle.toLowerCase()}…</span>
                      </div>
                    ) : availableRecords.length === 0 ? (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-[11px] text-amber-800 flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>No {targetModuleTitle.toLowerCase()} found. Images will be saved as general assets.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {availableRecords.map((r) => {
                            const isSelected = selectedRecordIds.includes(r._id);
                            const displayName = r.title || r.name || 'Untitled';
                            const badgeType = r.displayType || (r.display?.type) || r.type || r.platform || 'Asset';
                            const categoryLabel = r.categoryName || r.categoryId?.name || '';
                            const thumbUrl = r.image?.url || r.imageUrl;

                            return (
                              <div
                                key={r._id}
                                onClick={() => toggleRecordSelection(r._id)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition ${
                                  isSelected
                                    ? 'border-[#8b6c3a] bg-white ring-1 ring-[#8b6c3a]/40 shadow-xs'
                                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                                }`}
                              >
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                    isSelected
                                      ? 'border-[#8b6c3a] bg-[#8b6c3a] text-white'
                                      : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <HiOutlineCheck className="h-3 w-3 stroke-[3]" />}
                                </div>

                                <div
                                  onClick={(e) => {
                                    if (thumbUrl) {
                                      e.stopPropagation();
                                      setPreviewModalData({
                                        url: thumbUrl,
                                        title: displayName,
                                        subtitle: `${targetSingularLabel} • ${categoryLabel || badgeType}`,
                                      });
                                    }
                                  }}
                                  className={`h-10 w-14 shrink-0 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center relative group/thumb ${
                                    thumbUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#8b6c3a]/50' : ''
                                  }`}
                                  title={thumbUrl ? "Click to preview banner image" : undefined}
                                >
                                  {thumbUrl ? (
                                    <>
                                      <img src={thumbUrl} alt={displayName} className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-110" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                        <HiOutlineEye className="w-3.5 h-3.5 text-white drop-shadow" />
                                      </div>
                                    </>
                                  ) : (
                                    <HiOutlinePhotograph className="h-5 w-5 text-stone-400" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-stone-800 truncate">
                                    {displayName}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] uppercase font-semibold text-stone-500 bg-stone-100 px-1 py-0.2 rounded">
                                      {badgeType}
                                    </span>
                                    {categoryLabel && (
                                      <>
                                        <span className="text-stone-300">•</span>
                                        <span className="text-[9.5px] text-[#8b6c3a] truncate max-w-[120px]">
                                          {categoryLabel}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {thumbUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewModalData({
                                        url: thumbUrl,
                                        title: displayName,
                                        subtitle: `${targetSingularLabel} • ${categoryLabel || badgeType}`,
                                      });
                                    }}
                                    className="shrink-0 p-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-[#8b6c3a]/10 hover:border-[#8b6c3a] text-stone-500 hover:text-[#8b6c3a] transition cursor-pointer shadow-2xs"
                                    title="Preview banner image"
                                  >
                                    <HiOutlineEye className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {isSelected && (
                                  <span className="shrink-0 text-[10px] font-bold text-[#8b6c3a] bg-[#8b6c3a]/10 px-2 py-0.5 rounded-full">
                                    Selected
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {selectedRecordIds.length > 1 && selectedFiles.length > 1 && (
                          <div className="flex items-center justify-between pt-1 text-[11px] text-stone-700 bg-white p-2.5 rounded-xl border border-[#8b6c3a]/25">
                            <span>
                              💡 <strong>{selectedRecordIds.length}</strong> {targetModuleTitle.toLowerCase()} selected.
                            </span>
                            <button
                              type="button"
                              onClick={handleAutoDistributeRecords}
                              className="font-bold text-[#8b6c3a] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>⚡</span> Auto-distribute to {selectedFiles.length} images
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: TARGET PLATFORM (WEB / APP / COMMON) */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-800">
                      3. Target Platform <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-stone-400">Device</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'web',
                        label: 'Web',
                        sublabel: 'Storefront Web',
                        icon: HiOutlineDesktopComputer,
                      },
                      {
                        id: 'app',
                        label: 'App',
                        sublabel: 'Mobile App',
                        icon: HiOutlineDeviceMobile,
                      },
                      {
                        id: 'common',
                        label: 'Common',
                        sublabel: 'Web & App',
                        icon: IoSparklesOutline,
                      },
                    ].map((plat) => {
                      const isSelected = uploadPlatform === plat.id;
                      const Icon = plat.icon;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setUploadPlatform(plat.id)}
                          className={`group flex flex-col items-center justify-center rounded-xl border p-2 text-center transition cursor-pointer ${
                            isSelected
                              ? 'border-[#8b6c3a] bg-[#8b6c3a]/10 text-[#8b6c3a] font-bold shadow-xs ring-1 ring-[#8b6c3a]/30'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-[#8b6c3a]' : 'text-stone-400'}`} />
                          <span className="mt-1 text-xs font-bold">{plat.label}</span>
                          <span className="text-[9.5px] text-stone-400">{plat.sublabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ─── RIGHT COLUMN: FILE UPLOAD ZONE & STAGED IMAGES MAPPING (col-span-7) ─── */}
              <div className="lg:col-span-7 space-y-4">
                {/* Header & Compression Info Banner */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-800">
                      4. Upload Image File{selectedFiles.length > 1 ? 's' : ''} {isTargetMappable ? `& ${targetSingularLabel} Mapping` : ''} <span className="text-rose-500">*</span>
                    </label>
                    {selectedFiles.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-stone-400 font-mono line-through" title="Original File Size">
                          {formatBytes(totalOriginalBytes)}
                        </span>
                        <span className="text-stone-300">→</span>
                        <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1 shadow-2xs">
                          <span className="text-[10px]">⚡</span> {formatBytes(totalCompressedBytes)} WebP
                          {totalSavingsPercent > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">(-{totalSavingsPercent}%)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Smart Image Compression Info Banner */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-2 text-[11px] text-emerald-900 shadow-2xs">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-[11px] shadow-2xs">
                      ⚡
                    </div>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-emerald-950">
                        {compressionSettings.enabled !== false ? 'Smart Image Compression Active' : 'Image Compression Inactive'}
                      </span>
                      {compressionSettings.enabled !== false && (
                        <span className="inline-flex items-center rounded-md bg-emerald-200/60 px-1.5 py-0.2 text-[9.5px] font-semibold text-emerald-800">
                          Auto WebP · ~{compressionSettings.quality || 60}% Quality
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addFiles(e.target.files);
                    if (e.target) e.target.value = '';
                  }}
                  className="hidden"
                />

                {selectedFiles.length === 0 ? (
                  <div
                    {...getUploadTriggerProps(() => fileInputRef.current?.click())}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      addFiles(e.dataTransfer.files);
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all min-h-[320px] focus:outline-none focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/25 ${
                      isDragging
                        ? 'border-[#8b6c3a] bg-[#faf5ee] scale-[0.99]'
                        : 'border-stone-300 bg-stone-50/70 hover:border-[#8b6c3a] hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#8b6c3a]/10 text-[#8b6c3a] shadow-sm">
                      <HiOutlineUpload className="h-8 w-8" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-stone-800">
                      Click or drag and drop images here
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-2xs text-xs font-semibold text-stone-700 hover:bg-stone-50">
                      Browse Files
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3.5 space-y-3">
                    {/* Top Action Toolbar inside Staged Area */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800">
                          {selectedFiles.length} Image{selectedFiles.length === 1 ? '' : 's'} Staged
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                          {formatBytes(totalCompressedBytes)} total
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTargetMappable && availableRecords.length > 1 && selectedFiles.length > 1 && (
                          <button
                            type="button"
                            onClick={handleAutoDistributeRecords}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8b6c3a]/10 border border-[#8b6c3a]/30 text-[#8b6c3a] text-[11px] font-bold hover:bg-[#8b6c3a]/20 transition cursor-pointer"
                            title={`Auto map ${targetModuleTitle.toLowerCase()} sequentially`}
                          >
                            <span>⚡</span> Auto-Map 1-to-1
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 text-[11px] font-semibold hover:bg-stone-50 transition cursor-pointer shadow-2xs"
                        >
                          + Add More
                        </button>
                        <button
                          type="button"
                          onClick={resetUploadModal}
                          className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold hover:underline cursor-pointer ml-1"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Grid of staged thumbnails (spacious 2 or 3 columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto p-1">
                      {selectedFiles.map((item, idx) => (
                        <div
                          key={item.id}
                          className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-2xs hover:border-[#8b6c3a]/50 hover:shadow-md transition"
                        >
                          <div className="relative aspect-video w-full bg-stone-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/65 text-white backdrop-blur-xs shadow-xs">
                              #{idx + 1}
                            </span>

                            {/* Top reduction or optimizing badge */}
                            {item.isCompressing ? (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                Optimizing...
                              </span>
                            ) : item.savingsPercent > 0 ? (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-0.5">
                                <span>⚡</span> -{item.savingsPercent}%
                              </span>
                            ) : (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-700/80 text-white shadow-xs">
                                WebP
                              </span>
                            )}

                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModalData({
                                    url: item.previewUrl,
                                    title: item.name,
                                    subtitle: `Staged File • ${formatBytes(item.compressedSize || item.size)}`,
                                  })
                                }
                                className="h-6 w-6 rounded-full bg-black/60 hover:bg-[#8b6c3a] text-white flex items-center justify-center transition shadow-xs cursor-pointer opacity-90 hover:opacity-100"
                                title="Preview image"
                              >
                                <HiOutlineEye className="w-3.5 h-3.5" />
                              </button>
                              {!isUploading && (
                                <button
                                  type="button"
                                  onClick={() => removeFile(item.id)}
                                  className="h-6 w-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-xs cursor-pointer opacity-90 hover:opacity-100"
                                  title="Remove image"
                                >
                                  <HiOutlineX className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Card Meta with Original (OG) vs Compressed Size */}
                          <div className="p-2.5 flex flex-col gap-1.5 text-xs bg-white border-t border-stone-100">
                            <div className="flex items-center justify-between">
                              <span className="truncate font-semibold text-stone-800 text-[11px]" title={item.name}>
                                {item.name}
                              </span>
                              <span className="text-[9.5px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                WebP
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10.5px]">
                              <span className="text-stone-400 font-mono line-through" title="Original size">
                                {formatBytes(item.originalSize || item.size)}
                              </span>
                              <span className="text-stone-300">→</span>
                              <span className="font-mono font-bold text-emerald-700" title="Compressed WebP size">
                                {formatBytes(item.compressedSize || item.size)}
                              </span>
                            </div>

                            {/* Target Record Mapping Dropdown for each image */}
                            {isTargetMappable && availableRecords.length > 0 && (
                              <div className="pt-2 border-t border-stone-100 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8b6c3a] flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <HiOutlineLink className="w-3 h-3" /> Linked {targetSingularLabel}:
                                  </span>
                                  {imageRecordMap[item.id] ? (
                                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                                      Mapped
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-stone-400">Default</span>
                                  )}
                                </label>
                                <Dropdown
                                  size="sm"
                                  portal={true}
                                  autoMenuWidth={true}
                                  menuClassName="z-[11000]"
                                  buttonClassName="w-full h-8 text-[11px] px-2 bg-stone-50 border-stone-200 font-medium text-stone-800 focus:bg-white focus:border-[#8b6c3a] rounded-xl"
                                  value={
                                    imageRecordMap[item.id] !== undefined
                                      ? imageRecordMap[item.id]
                                      : (selectedRecordIds[idx % selectedRecordIds.length] || selectedRecordIds[0] || '')
                                  }
                                  onChange={(val) => {
                                    setImageRecordMap((prev) => ({ ...prev, [item.id]: val || '' }));
                                  }}
                                  options={recordDropdownOptions}
                                  placeholder="Select linked item..."
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex justify-between text-xs font-semibold text-stone-700">
                      <span>{uploadProgressText || 'Uploading and assigning images…'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#8b6c3a] to-emerald-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── STICKY ACTION FOOTER ─── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-50/90 shrink-0">
            <div className="text-xs text-stone-500 font-medium">
              {selectedFiles.length > 0 ? (
                <span className="font-bold text-stone-800">
                  {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} selected
                </span>
              ) : (
                <span>No files selected yet. Drag & drop images above.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || selectedFiles.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b6c3a] to-[#765a2d] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#8b6c3a]/20 hover:from-[#765a2d] transition cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Uploading…
                  </>
                ) : (
                  <>
                    <HiOutlineUpload className="h-4 w-4" />
                    {selectedFiles.length > 1
                      ? `Upload & Assign ${selectedFiles.length} Images (${formatBytes(totalCompressedBytes)})`
                      : `Upload & Assign Image (${formatBytes(totalCompressedBytes)})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── 4. IMAGE PREVIEW LIGHTBOX MODAL ─── */}
      {previewModalData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[11100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewModalData(null)}
        >
          <div
            className="relative flex flex-col max-h-[92vh] max-w-4xl w-full rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl overflow-hidden animate-scaleUp text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-stone-900">
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-bold text-white truncate">
                  {previewModalData.title || 'Image Preview'}
                </h3>
                {previewModalData.subtitle && (
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{previewModalData.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalData(null)}
                className="rounded-xl p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition cursor-pointer shrink-0"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {/* Image Preview Canvas */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-stone-950/90 overflow-hidden min-h-[240px] sm:min-h-[300px]">
              <img
                src={previewModalData.url}
                alt={previewModalData.title || 'Preview'}
                className="max-h-[62vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-stone-800 px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-900 shrink-0">
              <span className="text-[11px] text-stone-400">Click backdrop or press Esc to close</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white transition cursor-pointer"
                >
                  <HiOutlineExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalData(null)}
                  className="px-4 py-2 rounded-xl bg-[#8b6c3a] hover:bg-[#765a2d] text-xs font-semibold text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
