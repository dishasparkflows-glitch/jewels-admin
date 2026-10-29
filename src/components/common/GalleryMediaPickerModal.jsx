/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineSearch,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiOutlineCheck,
} from 'react-icons/hi';
import Dropdown from './Dropdown';
import api from '../../api/axios';
import { getMediaUrl } from '../../utils/imageUrl';

const DEFAULT_PLACEMENTS = [
  { value: 'all', label: 'All Placements' },
  { value: 'herobanner', label: 'Hero Banner' },
  { value: 'categorybanner', label: 'Category Banner' },
  { value: 'collectionbanner', label: 'Collection Banner' },
  { value: 'offerbanner', label: 'Offer Banner' },
  { value: 'mobileapp', label: 'Mobile App' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'custom', label: 'Custom' },
  { value: 'celebrate', label: 'Celebrate & Gifts' },
  { value: 'asset', label: 'Media Library Assets' },
];

export default function GalleryMediaPickerModal({
  isOpen = false,
  onClose,
  onSelect,
  currentSelectedUrl = '',
  initialTheme = 'all',
  initialPlacement = 'all',
  initialPlatform = 'all',
  placementOptions = null,
  themes: passedThemes = null,
  title = 'Gallery Media Picker',
  subtitle = 'Select an uploaded placement image from your active website themes or media gallery.',
}) {
  const [internalThemes, setInternalThemes] = useState([]);
  const [pickerThemeFilter, setPickerThemeFilter] = useState(initialTheme || 'all');
  const [pickerPlacementFilter, setPickerPlacementFilter] = useState(initialPlacement || 'all');
  const [pickerDeviceFilter, setPickerDeviceFilter] = useState(initialPlatform || 'all');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerImages, setPickerImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync initial filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setPickerThemeFilter(initialTheme || 'all');
      setPickerPlacementFilter(initialPlacement || 'all');
      setPickerDeviceFilter(initialPlatform || 'all');
      setPickerSearch('');
    }
  }, [isOpen, initialTheme, initialPlacement, initialPlatform]);

  // Fetch themes if not passed as prop
  useEffect(() => {
    if (!isOpen) return;
    if (Array.isArray(passedThemes) && passedThemes.length > 0) {
      setInternalThemes(passedThemes);
      return;
    }
    let cancelled = false;
    api
      .get('/website/themes', { params: { status: 'all', limit: 100 } })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : res.data?.data?.items || [];
        setInternalThemes(list.filter((t) => t.status !== 'archived'));
      })
      .catch((err) => {
        console.error('Failed to load themes for media picker:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, passedThemes]);

  // Fetch images matching filters
  const fetchImages = useCallback(
    async (
      theme = pickerThemeFilter,
      placement = pickerPlacementFilter,
      platform = pickerDeviceFilter
    ) => {
      try {
        setLoading(true);
        const params = { limit: 100 };
        if (theme && theme !== 'all') params.themeId = theme;
        if (placement && placement !== 'all') {
          params.placement = placement;
          params.type = placement;
        }
        if (platform && platform !== 'all') {
          params.platform = platform;
        }

        let res;
        try {
          res = await api.get('/banners/theme-images', { params });
        } catch {
          res = await api.get('/gallery', { params });
        }
        const items = res.data?.data?.items || res.data?.data || [];
        setPickerImages(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Failed to load picker images:', err);
        setPickerImages([]);
      } finally {
        setLoading(false);
      }
    },
    [pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter]
  );

  // Trigger fetch when modal opens or primary filters change
  useEffect(() => {
    if (isOpen) {
      fetchImages(pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter);
    }
  }, [isOpen, pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter, fetchImages]);

  // Filtered by search query
  const filteredImages = useMemo(() => {
    if (!pickerSearch.trim()) return pickerImages;
    const q = pickerSearch.trim().toLowerCase();
    return pickerImages.filter((img) => {
      const name = (img.name || img.title || img.recordTitle || '').toLowerCase();
      const pl = (img.placement || img.type || '').toLowerCase();
      const th = (img.themeName || img.themeId?.name || '').toLowerCase();
      return name.includes(q) || pl.includes(q) || th.includes(q);
    });
  }, [pickerImages, pickerSearch]);

  const activeThemes = passedThemes || internalThemes;
  const activePlacements = placementOptions || DEFAULT_PLACEMENTS;

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-stone-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-150 bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            >
              <HiOutlinePhotograph className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <HiOutlineX className="w-4 h-4 stroke-2" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-stone-150 bg-stone-50/50 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Search by name, placement or theme..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary,#8a6d4b)] focus:border-[var(--theme-primary,#8a6d4b)]"
            />
          </div>

          {/* Filter Theme */}
          <div className="w-full sm:w-52">
            <Dropdown
              value={pickerThemeFilter}
              onChange={(val) => {
                setPickerThemeFilter(val);
                fetchImages(val, pickerPlacementFilter, pickerDeviceFilter);
              }}
              options={[
                { value: 'all', label: 'All Website Themes' },
                ...activeThemes.map((t) => ({
                  value: t._id,
                  label: `${t.name}${t.status === 'active' ? ' · Active' : ''}`,
                })),
              ]}
              buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>

          {/* Filter Placement */}
          <div className="w-full sm:w-48">
            <Dropdown
              value={pickerPlacementFilter}
              onChange={(val) => {
                setPickerPlacementFilter(val);
                fetchImages(pickerThemeFilter, val, pickerDeviceFilter);
              }}
              options={activePlacements}
              buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>

          {/* Filter Platform (Web / App / All) */}
          <div className="w-full sm:w-40">
            <Dropdown
              value={pickerDeviceFilter}
              onChange={(val) => {
                setPickerDeviceFilter(val);
                fetchImages(pickerThemeFilter, pickerPlacementFilter, val);
              }}
              options={[
                { value: 'all', label: 'All Platforms' },
                { value: 'web', label: 'Web (Desktop)' },
                { value: 'app', label: 'App (Mobile)' },
              ]}
              buttonClassName="w-full h-9 px-3 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white"
              menuClassName="z-30"
            />
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchImages(pickerThemeFilter, pickerPlacementFilter, pickerDeviceFilter)}
            title="Refresh images"
            className="w-9 h-9 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Picker Images Grid */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {loading ? (
            <div className="py-20 text-center text-stone-400">
              <div
                className="w-8 h-8 border-2 border-stone-300 rounded-full animate-spin mx-auto mb-3"
                style={{ borderTopColor: 'var(--theme-primary, #8a6d4b)' }}
              />
              <p className="text-xs font-medium text-stone-600">Loading placement images...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="py-20 text-center text-stone-400">
              <HiOutlinePhotograph className="w-12 h-12 mx-auto text-stone-300 mb-2 stroke-1" />
              <p className="text-sm font-medium text-stone-600">No images found</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                No images matching the selected theme and placement. Try switching to "All Website Themes" or "All Placements".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredImages.map((img, idx) => {
                const imgUrl = img.url || img.image?.url;
                const imgTitle = img.name || img.title || img.recordTitle || `Theme Image ${idx + 1}`;
                const imgPlacement = img.placement || img.type || img.filterType || 'banner';
                const imgTheme = img.themeName || img.themeId?.name || '';
                const isCurrentlySelected = currentSelectedUrl && currentSelectedUrl === imgUrl;

                return (
                  <div
                    key={img.id || img._id || idx}
                    onClick={() => onSelect(img)}
                    className={`group relative rounded-2xl border overflow-hidden bg-white cursor-pointer transition-all duration-200 flex flex-col ${
                      isCurrentlySelected
                        ? 'border-[var(--theme-primary,#8b6f4e)] ring-2 ring-[var(--theme-primary,#8b6f4e)]/40 shadow-md'
                        : 'border-stone-200/90 hover:border-[var(--theme-primary,#8a6d4b)] hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Image Thumbnail */}
                    <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                      <img
                        src={getMediaUrl(imgUrl)}
                        alt={imgTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Overlay button on hover */}
                      <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <span className="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                          <HiOutlineCheck
                            className="w-3.5 h-3.5 stroke-[2.5]"
                            style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                          />
                          <span>Select</span>
                        </span>
                      </div>

                      {/* Selected Badge */}
                      {isCurrentlySelected && (
                        <div
                          style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-xs"
                        >
                          Current
                        </div>
                      )}

                      {/* Placement pill */}
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-stone-900/75 backdrop-blur-xs text-white text-[9.5px] font-semibold uppercase tracking-wider">
                        {imgPlacement}
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-2.5 bg-white flex flex-col gap-0.5 min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate" title={imgTitle}>
                        {imgTitle}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 gap-1">
                        <span className="truncate">{imgTheme || 'Default Theme'}</span>
                        {img.platform && (
                          <span className="shrink-0 uppercase font-mono px-1 py-0.2 rounded bg-stone-100 text-stone-600">
                            {img.platform}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-stone-150 bg-stone-50/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500 font-medium">
            {filteredImages.length} image{filteredImages.length === 1 ? '' : 's'} available
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

