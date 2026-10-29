import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineRefresh,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineSparkles,
  HiOutlineViewGrid,
  HiOutlineExclamation,
  HiOutlineArrowRight,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { websiteThemesAPI, galleryAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';

const MODULE_TABS = [
  { key: 'herobanner', label: 'Hero Banners', icon: HiOutlineDesktopComputer },
  { key: 'celebrate', label: 'Celebrate & Gifts', icon: IoDiamondOutline },
  { key: 'category', label: 'Categories', icon: HiOutlineViewGrid },
  { key: 'collectionbanner', label: 'Collections', icon: HiOutlineTag },
  { key: 'offerbanner', label: 'Offer Banners', icon: HiOutlineGift },
  { key: 'mobileappbanner', label: 'App Banners', icon: HiOutlineDeviceMobile },
  { key: 'customizebanner', label: 'Custom & Other', icon: HiOutlineSparkles },
];

const statusBadgeClasses = {
  active: 'bg-emerald-600 text-white font-semibold',
  scheduled: 'bg-blue-600 text-white font-semibold',
  draft: 'bg-amber-600 text-white font-semibold',
  archived: 'bg-stone-600 text-white font-semibold',
};

export default function ThemeMediaMappingTab({
  theme,
  onThemeUpdated,
  onPreview,
}) {
  const confirm = useConfirm();
  const themeId = theme?._id;

  // Active module & filter state
  const [activeModule, setActiveModule] = useState('herobanner');
  const [statusFilter, setStatusFilter] = useState('all'); // all, mapped, unmapped
  const [search, setSearch] = useState('');

  // Data state
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal states
  const [pickerTarget, setPickerTarget] = useState(null); // { record, device, placement, currentMediaId }
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activating, setActivating] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // ─── 1. Load Summary Across All Modules ──────────────────
  const fetchSummary = useCallback(async () => {
    if (!themeId) return;
    try {
      const res = await websiteThemesAPI.getMappingSummary(themeId);
      const data = res.data?.data || res.data;
      setSummary(data);
    } catch (err) {
      console.error('Failed to load theme mapping summary:', err);
    }
  }, [themeId]);

  // ─── 2. Load Records for Current Module ──────────────────
  const fetchRecords = useCallback(async () => {
    if (!themeId) return;
    try {
      setLoading(true);
      const res = await websiteThemesAPI.getMappingRecords(themeId, {
        module: activeModule,
        search,
        limit: 100,
      });
      const data = res.data?.data || res.data || {};
      setRecords(data.items || data.records || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to load module records for mapping:', err);
      toast.error('Could not load module records');
    } finally {
      setLoading(false);
    }
  }, [themeId, activeModule, search]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ─── Filtered Records ────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (statusFilter === 'mapped') return rec.isMapped;
      if (statusFilter === 'unmapped') return !rec.isMapped;
      return true;
    });
  }, [records, statusFilter]);

  // ─── Master Checkbox ─────────────────────────────────────
  const isAllSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.has(String(r._id)));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => String(r._id))));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const sid = String(id);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  // ─── Single Save Mapping Handler ─────────────────────────
  const handleSaveMapping = async (mediaAsset) => {
    if (!pickerTarget || !themeId) return;
    const { record, device, placement } = pickerTarget;

    try {
      await websiteThemesAPI.saveMapping(themeId, {
        module: activeModule,
        recordId: record._id,
        mediaId: mediaAsset._id,
        device: device || 'desktop',
        placement: placement || 'primary',
        status: 'active',
      });

      toast.success(
        `Mapped ${device === 'mobile' ? 'Mobile' : 'Desktop'} image for "${record.title || record.name}"`
      );

      setPickerTarget(null);
      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err) {
      console.error('Failed to save mapping:', err);
      toast.error(err.response?.data?.message || 'Could not save theme mapping');
    }
  };

  // ─── Delete Single Mapping Handler ───────────────────────
  const handleDeleteMapping = async (record, device = 'desktop', placement = 'primary') => {
    if (!themeId) return;

    try {
      await websiteThemesAPI.deleteMappingByTarget(themeId, {
        module: activeModule,
        recordId: record._id,
        device,
        placement,
      });

      toast.success(`Theme mapping removed. Reverted to original fallback image.`);
      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err) {
      console.error('Failed to remove mapping:', err);
      toast.error(err.response?.data?.message || 'Could not remove theme mapping');
    }
  };

  // ─── Bulk Clear Mappings ─────────────────────────────────
  const handleBulkClear = async () => {
    if (selectedIds.size === 0 || !themeId) return;

    const confirmed = await confirm({
      title: 'Clear Selected Theme Mappings',
      message: `Are you sure you want to revert ${selectedIds.size} selected record(s) back to their original fallback images?`,
      confirmText: 'Clear Mappings',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedIds).map((recId) =>
        websiteThemesAPI.deleteMappingByTarget(themeId, {
          module: activeModule,
          recordId: recId,
        })
      );
      await Promise.all(promises);
      toast.success(`Reverted ${selectedIds.size} records to original images.`);
      setSelectedIds(new Set());
      await Promise.all([fetchRecords(), fetchSummary()]);
    } catch (err) {
      console.error('Bulk clear failed:', err);
      toast.error('Failed to clear some mappings');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ─── One-Click Theme Activation ──────────────────────────
  const handleActivateTheme = async () => {
    if (!themeId) return;

    try {
      setActivating(true);
      const res = await websiteThemesAPI.activateTheme(themeId);
      const data = res.data?.data || res.data || {};
      toast.success(data.message || `Theme "${theme?.name}" is now live on the storefront!`);
      setShowActivateModal(false);
      if (onThemeUpdated) {
        onThemeUpdated({ ...theme, status: 'active' });
      }
      await fetchSummary();
    } catch (err) {
      console.error('Failed to activate theme:', err);
      toast.error(err.response?.data?.message || 'Failed to activate theme');
    } finally {
      setActivating(false);
    }
  };

  // Active module breakdown stats
  const activeBreakdown = summary?.breakdown?.find(
    (b) => b.module === activeModule
  );

  const totalAllRecords = summary?.summary?.totalRecords || 0;
  const mappedAllRecords = summary?.summary?.mappedRecords || 0;
  const completionPct = summary?.summary?.completionPercentage || 0;
  const isLive = theme?.status === 'active';

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR: Theme Name, Status, Mapping Summary & Actions
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Theme Info & Status */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Selected Theme:
              </span>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {theme?.name || 'Theme'}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                  statusBadgeClasses[theme?.status] || statusBadgeClasses.draft
                }`}
              >
                {theme?.status || 'draft'}
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Currently Live Storefront
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Map uploaded Media Gallery assets to module records. Unmapped records safely fall back to original media.
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() => {
                if (onPreview) onPreview(theme);
                else {
                  window.open(`http://localhost:5174?previewTheme=${themeId}`, '_blank');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
            >
              <HiOutlineExternalLink className="h-3.5 w-3.5 text-stone-500" />
              <span>Preview Theme</span>
            </button>

            {/* Activate Button */}
            {!isLive ? (
              <button
                type="button"
                onClick={() => setShowActivateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:shadow cursor-pointer"
              >
                <HiOutlineCheck className="h-3.5 w-3.5 stroke-2" />
                <span>Activate Theme</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                <HiOutlineCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Active on Storefront</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Mapping Completion Summary Strip ─── */}
        <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Progress bar & percentage */}
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">
                Mapping Completion Summary
              </span>
              <span className="font-bold text-stone-900">
                {mappedAllRecords} / {totalAllRecords} records mapped ({completionPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionPct === 100
                    ? 'bg-emerald-500'
                    : completionPct > 50
                    ? 'bg-[#8b6f4e]'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Mini module badges */}
          <div className="md:col-span-7 flex flex-wrap items-center gap-1.5 md:justify-end text-[11px]">
            {(summary?.breakdown || []).map((b) => (
              <button
                key={b.module}
                type="button"
                onClick={() => setActiveModule(b.module)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                  activeModule === b.module
                    ? 'border-[#8b6f4e] bg-[#8b6f4e]/10 text-[#8b6f4e] font-semibold'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{b.label}:</span>
                <span className={`font-bold ${b.mapped === b.total && b.total > 0 ? 'text-emerald-700' : 'text-stone-700'}`}>
                  {b.mapped}/{b.total}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MODULE TABS STRIP
          ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xs">
        {MODULE_TABS.map((tab) => {
          const Icon = tab.icon;
          const stat = summary?.breakdown?.find((b) => b.module === tab.key);
          const isSelected = activeModule === tab.key;
          const total = stat?.total || 0;
          const mapped = stat?.mapped || 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveModule(tab.key);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                isSelected
                  ? 'bg-[#8b6f4e] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : mapped === total && total > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {mapped}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CONTROLS ROW: Search, Status Filter, Bulk Actions & Refresh
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeBreakdown?.label || 'records'}...`}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none transition focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 placeholder:text-stone-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-0.5 shadow-2xs shrink-0">
            {[
              ['all', 'All'],
              ['mapped', 'Mapped'],
              ['unmapped', 'Unmapped'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  statusFilter === val
                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Bulk Actions / Refresh */}
        <div className="flex items-center gap-2 justify-end">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 text-xs text-amber-900 font-medium">
              <span>{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={handleBulkClear}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                <HiOutlineTrash className="h-3.5 w-3.5" />
                <span>Revert to Fallback</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              fetchRecords();
              fetchSummary();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Refresh records"
          >
            <HiOutlineRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. COMPACT RECORDS TABLE
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500 space-y-2">
            <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
            <p>Loading module records for theme mapping…</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500 space-y-2">
            <HiOutlinePhotograph className="h-8 w-8 mx-auto text-stone-300" />
            <p className="font-semibold text-stone-700">No records found for this module</p>
            <p className="text-[11px] text-stone-400">
              {search
                ? `No records match "${search}". Try clearing search.`
                : 'No existing module records available.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
                    />
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">Record Title & Info</th>
                  <th className="px-4 py-3 min-w-[240px]">
                    {activeModule === 'category' ? 'Category Icon' : 'Desktop / Primary Image'}
                  </th>
                  <th className="px-4 py-3 min-w-[240px]">
                    {activeModule === 'category' ? 'Category Banner' : 'Mobile Image Variant'}
                  </th>
                  <th className="px-4 py-3 min-w-[130px] text-center">Mapping Status</th>
                  <th className="px-4 py-3 min-w-[120px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRecords.map((record) => {
                  const isSelected = selectedIds.has(String(record._id));
                  const isMapped = record.isMapped;

                  // Desktop / Primary Image slot
                  const desktopMappedImg = record.desktopMapping?.imageUrl;
                  const desktopFallbackImg =
                    activeModule === 'category'
                      ? record.originalMedia?.iconUrl
                      : record.originalMedia?.desktopImageUrl;
                  const currentDesktopImg = desktopMappedImg || desktopFallbackImg;
                  const isDesktopMapped = Boolean(desktopMappedImg);

                  // Mobile / Secondary Image slot
                  const mobileMappedImg =
                    activeModule === 'category'
                      ? record.bannerMapping?.imageUrl
                      : record.mobileMapping?.imageUrl;
                  const mobileFallbackImg =
                    activeModule === 'category'
                      ? record.originalMedia?.bannerUrl
                      : record.originalMedia?.mobileImageUrl;
                  const currentMobileImg = mobileMappedImg || mobileFallbackImg;
                  const isMobileMapped = Boolean(mobileMappedImg);

                  return (
                    <tr
                      key={record._id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(record._id)}
                          className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]"
                        />
                      </td>

                      {/* Title & Info */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-stone-900 leading-tight">
                            {record.title || record.name || 'Untitled Record'}
                          </div>
                          {record.subtitle && (
                            <p className="text-[11px] text-stone-500 line-clamp-1">
                              {record.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                            <span className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">
                              {record.placement || record.type || activeModule}
                            </span>
                            {record.status && (
                              <span
                                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                                  record.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {record.status}
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400 font-mono">
                              ID: {String(record._id).slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Desktop / Primary Image Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail */}
                          <div className="relative w-16 h-12 rounded-lg border border-stone-200 bg-stone-100 overflow-hidden shrink-0 group">
                            {currentDesktopImg ? (
                              <img
                                src={currentDesktopImg}
                                alt={record.title || 'media'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <HiOutlinePhotograph className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Details & Button */}
                          <div className="space-y-1">
                            <div>
                              {isDesktopMapped ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <HiOutlineCheck className="h-3 w-3 stroke-2 text-emerald-600" />
                                  Theme Mapped
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                  Original Fallback
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPickerTarget({
                                    record,
                                    device: 'desktop',
                                    placement: activeModule === 'category' ? 'icon' : 'primary',
                                    currentMediaId: record.desktopMapping?.mediaId,
                                  })
                                }
                                className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                              >
                                {isDesktopMapped ? 'Change Image' : 'Choose Image'}
                              </button>
                              {isDesktopMapped && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMapping(
                                      record,
                                      'desktop',
                                      activeModule === 'category' ? 'icon' : 'primary'
                                    )
                                  }
                                  className="text-[11px] font-medium text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                                  title="Revert to original image"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile / Secondary Image Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail */}
                          <div className="relative w-16 h-12 rounded-lg border border-stone-200 bg-stone-100 overflow-hidden shrink-0">
                            {currentMobileImg ? (
                              <img
                                src={currentMobileImg}
                                alt={record.title || 'media'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 text-[10px]">
                                <HiOutlineDeviceMobile className="h-4 w-4" />
                                <span className="text-[9px]">None</span>
                              </div>
                            )}
                          </div>

                          {/* Details & Button */}
                          <div className="space-y-1">
                            <div>
                              {isMobileMapped ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <HiOutlineCheck className="h-3 w-3 stroke-2 text-emerald-600" />
                                  Theme Mapped
                                </span>
                              ) : currentMobileImg ? (
                                <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                  Original Fallback
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                                  Optional Variant
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPickerTarget({
                                    record,
                                    device: 'mobile',
                                    placement: activeModule === 'category' ? 'banner' : 'primary',
                                    currentMediaId: record.mobileMapping?.mediaId,
                                  })
                                }
                                className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                              >
                                {isMobileMapped ? 'Change' : 'Choose Image'}
                              </button>
                              {isMobileMapped && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMapping(
                                      record,
                                      'mobile',
                                      activeModule === 'category' ? 'banner' : 'primary'
                                    )
                                  }
                                  className="text-[11px] font-medium text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                                  title="Revert to original image"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mapping Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {isMapped ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            Mapped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            Unmapped (Fallback)
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerTarget({
                                record,
                                device: 'desktop',
                                placement: activeModule === 'category' ? 'icon' : 'primary',
                                currentMediaId: record.desktopMapping?.mediaId,
                              })
                            }
                            className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
                          >
                            Map Image
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MEDIA GALLERY PICKER MODAL / DRAWER
          ───────────────────────────────────────────────────────────── */}
      {pickerTarget && (
        <GalleryPickerModal
          target={pickerTarget}
          activeModule={activeModule}
          onClose={() => setPickerTarget(null)}
          onSelect={handleSaveMapping}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. ONE-CLICK THEME ACTIVATION CONFIRMATION MODAL
          ───────────────────────────────────────────────────────────── */}
      {showActivateModal && (
        <ActivationConfirmModal
          theme={theme}
          summary={summary}
          activating={activating}
          onClose={() => setShowActivateModal(false)}
          onConfirm={handleActivateTheme}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: GALLERY IMAGE PICKER MODAL
// ═════════════════════════════════════════════════════════════════════
function GalleryPickerModal({ target, activeModule, onClose, onSelect }) {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch Gallery Assets
  const fetchGalleryAssets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await galleryAPI.getAll({
        search,
        type: selectedType === 'all' ? undefined : selectedType,
        limit: 100,
      });
      const data = res.data?.data || res.data || {};
      const items = data.items || [];
      setGalleryItems(items);

      // Pre-select current mapped asset if matches
      if (target.currentMediaId) {
        const found = items.find((i) => String(i._id) === String(target.currentMediaId));
        if (found) setSelectedAsset(found);
      }
    } catch (err) {
      console.error('Failed to fetch gallery media for picker:', err);
      toast.error('Could not load Media Gallery assets');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, target.currentMediaId]);

  useEffect(() => {
    fetchGalleryAssets();
  }, [fetchGalleryAssets]);

  const handleConfirm = async () => {
    if (!selectedAsset) return;
    try {
      setSaving(true);
      await onSelect(selectedAsset);
    } finally {
      setSaving(false);
    }
  };

  const deviceLabel = target.device === 'mobile' ? 'Mobile' : 'Desktop';
  const recordTitle = target.record.title || target.record.name || 'Record';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 p-4 sm:p-5 bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlinePhotograph className="h-5 w-5 text-[#8b6f4e]" />
              <h3 className="text-base font-bold text-stone-900">
                Choose Image from Media Gallery
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Mapping for <span className="font-semibold text-stone-800">"{recordTitle}"</span> ·{' '}
              <span className="font-semibold text-[#8b6f4e]">{deviceLabel} Slot</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Controls: Search & Category Filter */}
        <div className="p-4 border-b border-stone-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gallery images..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none transition focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 placeholder:text-stone-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              ['all', 'All Gallery'],
              ['herobanner', 'Hero'],
              ['celebrate', 'Celebrate'],
              ['collectionbanner', 'Collections'],
              ['categorybanner', 'Categories'],
              ['asset', 'Assets'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedType(val)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedType === val
                    ? 'bg-[#8b6f4e] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-24 text-center text-xs text-stone-500 space-y-2">
              <HiOutlineRefresh className="h-6 w-6 animate-spin mx-auto text-[#8b6f4e]" />
              <p>Fetching uploaded Media Gallery images…</p>
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="py-20 text-center text-xs text-stone-500 space-y-2">
              <HiOutlinePhotograph className="h-8 w-8 mx-auto text-stone-300" />
              <p className="font-semibold text-stone-700">No images found in Media Gallery</p>
              <p className="text-[11px] text-stone-400">
                Upload images in the Media Gallery tab first, then map them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {galleryItems.map((item) => {
                const imgUrl = item.image?.url || item.url;
                const isSelected = selectedAsset?._id === item._id;
                const displayName = item.name || item.fileName || `Image ${String(item._id).slice(-4)}`;

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedAsset(item)}
                    className={`group relative rounded-xl border-2 overflow-hidden bg-stone-50 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20 shadow-md scale-[1.02]'
                        : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                      <img
                        src={imgUrl}
                        alt={displayName}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Selection Indicator Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 rounded-full bg-[#8b6f4e] text-white p-1 shadow-sm">
                        <HiOutlineCheck className="h-3.5 w-3.5 stroke-2" />
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="p-2 bg-white">
                      <p className="text-[11px] font-semibold text-stone-800 truncate" title={displayName}>
                        {displayName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mt-0.5">
                        <span className="capitalize">{item.type || 'media'}</span>
                        {item.platform && <span className="uppercase">{item.platform}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {selectedAsset ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-8 rounded border border-stone-200 overflow-hidden bg-stone-100 shrink-0">
                  <img
                    src={selectedAsset.image?.url || selectedAsset.url}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-stone-800 block truncate max-w-[200px]">
                    {selectedAsset.name || selectedAsset.fileName || 'Selected Media Asset'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Ready to map
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-stone-500 italic">
                Select an image from the grid above
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAsset || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6f4e] hover:brightness-95 px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <HiOutlineCheck className="h-4 w-4 stroke-2" />
              <span>{saving ? 'Saving Mapping…' : 'Use This Image'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: ONE-CLICK ACTIVATION CONFIRMATION MODAL
// ═════════════════════════════════════════════════════════════════════
function ActivationConfirmModal({ theme, summary, activating, onClose, onConfirm }) {
  const total = summary?.summary?.totalRecords || 0;
  const mapped = summary?.summary?.mappedRecords || 0;
  const missing = summary?.summary?.missingRecords || 0;
  const pct = summary?.summary?.completionPercentage || 0;
  const isFullyMapped = summary?.summary?.isFullyMapped;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HiOutlineCheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Activate Theme on Storefront
              </h3>
              <p className="text-xs text-stone-500">
                One-Click Storefront Theme Switch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-stone-700">
          <p>
            You are about to activate theme <span className="font-bold text-stone-900">"{theme?.name}"</span> as the live storefront theme.
          </p>

          {/* Mapping Health Card */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Mapping Audit</span>
              <span className="font-bold text-stone-900">
                {mapped} / {total} records mapped ({pct}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {isFullyMapped ? (
              <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px]">
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  All records are mapped with theme-specific media. The storefront will display full theme visuals.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px]">
                <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Safe Fallback:</strong> {missing} record(s) are unmapped. They will safely display their original fallback images so no broken images or missing content will appear on the storefront.
                </span>
              </div>
            )}
          </div>

          <p className="text-stone-500 text-[11px] leading-relaxed">
            Activating this theme will immediately update the live website storefront settings. Any previously active theme will be safely archived or switched to draft.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={activating}
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={activating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheck className="h-4 w-4 stroke-2" />
            <span>{activating ? 'Activating Storefront…' : 'Confirm & Activate Theme'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

