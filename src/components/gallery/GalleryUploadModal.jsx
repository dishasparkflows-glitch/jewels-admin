import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Dropdown from '../common/Dropdown';
import { formatBytes, uploadFilesWithPresignedUrls } from '../../utils/uploadWithPresignedUrl';
import { galleryAPI } from '../../api/services';

export default function GalleryUploadModal({
  isOpen,
  onClose,
  defaultThemeId = '',
  modalThemeOptions = [],
  placementTypeOptions = [],
  onSuccess,
}) {
  const [uploadThemeId, setUploadThemeId] = useState('');
  const [uploadType, setUploadType] = useState('herobanner');
  const [uploadPlatform, setUploadPlatform] = useState('web');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUploadThemeId(defaultThemeId || '');
      setUploadType('herobanner');
      setUploadPlatform('web');
    } else {
      resetUploadModal();
    }
  }, [isOpen, defaultThemeId]);

  const resetUploadModal = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setSelectedFiles([]);
    setIsDragging(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (filesList) => {
    const rawFiles = Array.from(filesList || []);
    if (!rawFiles.length) return;

    const validImages = [];
    rawFiles.forEach((file) => {
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file.name);
      if (isImg) {
        validImages.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        toast.error(`"${file.name}" is not a supported image file.`);
      }
    });

    if (validImages.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validImages]);
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
  };

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
      setUploadProgressText(`Preparing to upload ${total} image${total > 1 ? 's' : ''}...`);

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
            setUploadProgressText(`Uploading image ${index + 1} of ${total}: ${file.name}...`);
          },
        }
      );

      const uploadedImages = uploadResults.map((uploadRes) => ({
        url: uploadRes.fileUrl,
        key: uploadRes.key || '',
      }));

      setUploadProgress(85);
      setUploadProgressText('Assigning images to theme...');

      await galleryAPI.uploadAssign({
        themeId: uploadThemeId || undefined,
        placement: uploadType,
        images: uploadedImages,
        platform: uploadPlatform,
        status: 'active',
      });

      setUploadProgress(100);
      toast.success(
        total === 1
          ? 'Image successfully uploaded and assigned to theme!'
          : `${total} images successfully uploaded and stored as separate gallery items!`
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={() => {
        if (!isUploading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[88vh] my-auto flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 shrink-0 bg-white">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8b6c3a]/15 text-[#8b6c3a]">
                <HiOutlineUpload className="h-5 w-5" />
              </span>
              Upload Image & Assign to Theme
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Select website theme, placement type, target platform, and upload image.
            </p>
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

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleUploadAndAssign} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* STEP 1: SELECT THEME */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
            <label className="block text-xs font-bold text-stone-800">
              1. Select Website Theme <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Choose which storefront theme this image belongs to.
            </p>
            <Dropdown
              size="field"
              showStatusDot={true}
              value={uploadThemeId}
              onChange={(val) => setUploadThemeId(val || '')}
              options={modalThemeOptions}
              placeholder="Select a website theme…"
              portal={true}
              menuClassName="z-[10000]"
            />
          </div>

          {/* STEP 2: SELECT PLACEMENT TYPE VIA COMMON DROPDOWN */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
            <label className="block text-xs font-bold text-stone-800">
              2. Image Placement Type <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Select where this image belongs (Hero Banner, Collection Banner, Category Banner, etc.).
            </p>
            <Dropdown
              size="field"
              value={uploadType}
              onChange={(val) => setUploadType(val || 'herobanner')}
              options={placementTypeOptions}
              placeholder="Select image placement type…"
              portal={true}
              menuClassName="z-[10000]"
            />
          </div>

          {/* STEP 3: TARGET PLATFORM (WEB / APP / COMMON) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800">
              3. Target Platform <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Select where this image will be displayed on the platform.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
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
                    className={`group flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-[#8b6c3a] bg-[#8b6c3a]/10 text-[#8b6c3a] font-bold shadow-xs ring-1 ring-[#8b6c3a]/30'
                        : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? 'bg-[#8b6c3a] text-white shadow-xs'
                          : 'bg-white text-stone-500 border border-stone-200 group-hover:text-stone-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="mt-1.5 text-xs font-bold">{plat.label}</span>
                    <span className="text-[10px] text-stone-400">{plat.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: FILE UPLOAD ZONE (Multi-file Support) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-800">
                4. Upload Image File{selectedFiles.length > 1 ? 's' : ''} <span className="text-rose-500">*</span>
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-[11px] font-semibold text-[#8b6c3a]">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'} selected ({formatBytes(selectedFiles.reduce((sum, f) => sum + f.size, 0))})
                </span>
              )}
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
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#8b6c3a] bg-[#faf5ee] scale-[0.99]'
                    : 'border-stone-300 bg-stone-50/70 hover:border-[#8b6c3a] hover:bg-stone-50'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b6c3a]/10 text-[#8b6c3a]">
                  <HiOutlineUpload className="h-6 w-6" />
                </div>
                <p className="mt-2 text-xs font-bold text-stone-800">
                  Click or drag and drop images here
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  Select single or multiple images (WebP, PNG, JPG). Each image is stored as an individual record.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3 space-y-3">
                {/* Grid of staged thumbnails */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-0.5">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs"
                    >
                      <div className="relative aspect-video w-full bg-stone-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          #{idx + 1}
                        </span>
                        {!isUploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(item.id);
                            }}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-xs cursor-pointer opacity-90 hover:opacity-100"
                            title="Remove image"
                          >
                            <HiOutlineX className="w-3 h-3 stroke-[3]" />
                          </button>
                        )}
                      </div>
                      <div className="p-1.5 flex items-center justify-between text-[10px] text-stone-500 bg-white">
                        <span className="truncate max-w-[95px] font-medium text-stone-700" title={item.name}>
                          {item.name}
                        </span>
                        <span className="shrink-0 text-stone-400 font-mono text-[9.5px]">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* + Add More button inside the grid */}
                  {!isUploading && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addFiles(e.dataTransfer.files);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dfcfbd] hover:border-[#8b6c3a] bg-[#fbf8f4] hover:bg-[#f6eee2] transition-colors cursor-pointer aspect-video p-2 text-center"
                    >
                      <HiOutlineUpload className="w-5 h-5 text-[#8b6c3a] mb-0.5" />
                      <span className="text-[11px] font-bold text-stone-700">+ Add More</span>
                      <span className="text-[9.5px] text-stone-400">or drop here</span>
                    </div>
                  )}
                </div>

                {/* Summary & Clear action */}
                {!isUploading && (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                    <span className="text-stone-500 font-medium">
                      {selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'} ready to upload
                    </span>
                    <button
                      type="button"
                      onClick={resetUploadModal}
                      className="text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
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
                    ? `Upload & Assign ${selectedFiles.length} Images`
                    : 'Upload & Assign Image'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
