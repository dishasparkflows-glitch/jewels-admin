import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineDuplicate,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineSave,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineDotsVertical,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineColorSwatch,
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { websiteThemesAPI, bannersAPI, featuredAPI, categoriesAPI } from '../../api/services';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import DatePicker from '../../components/common/DatePicker';
import ThemeMediaLibraryTab from './ThemeMediaLibraryTab';

const COLOR_OPTIONS = [
  ['primary', 'Primary (#8B6C3A)'],
  ['secondary', 'Secondary (#EADCC8)'],
  ['background', 'Background (#FBF9F5)'],
  ['surface', 'Surface (#FFFFFF)'],
  ['text', 'Text (#29251F)'],
  ['accent', 'Accent (#A67536)'],
];

const DEFAULT_CONFIG = {
  colors: {
    primary: '#8B6C3A',
    secondary: '#EADCC8',
    background: '#FBF9F5',
    surface: '#FFFFFF',
    text: '#29251F',
    accent: '#A67536',
  },
  typography: { headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat' },
  buttonStyle: 'filled',
  borderRadius: 8,
  seo: { metaTitle: '', metaDescription: '' },
  bannerSelections: [],
  featuredSelections: [],
  categoryAppearances: [],
  navigation: [],
  sections: [
    { key: 'hero', visible: true, order: 1 },
    { key: 'celebrate', visible: true, order: 2 },
    { key: 'categories', visible: true, order: 3 },
    { key: 'products', visible: true, order: 4 },
    { key: 'collections', visible: true, order: 5 },
    { key: 'trustBadges', visible: true, order: 6 },
    { key: 'customBanner', visible: true, order: 7 },
    { key: 'mobileApp', visible: true, order: 8 },
    { key: 'appointment', visible: true, order: 9 },
    { key: 'reviews', visible: true, order: 10 },
    { key: 'instagram', visible: true, order: 11 },
  ],
};

const emptyTheme = () => ({
  name: '',
  code: '',
  description: '',
  config: structuredClone(DEFAULT_CONFIG),
  schedule: {},
});

const getData = (response) => response?.data?.data;
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const istDateToIso = (value) => (value ? new Date(`${value}:00+05:30`).toISOString() : undefined);

const statusClass = {
  active: 'bg-emerald-600 text-white font-semibold shadow-xs',
  scheduled: 'bg-blue-600 text-white font-semibold',
  draft: 'bg-amber-600 text-white font-semibold',
  archived: 'bg-stone-600 text-white font-semibold',
};

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-stone-700">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-stone-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15';

export default function WebsiteThemesView() {
  const confirm = useConfirm();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Related data
  const [availableBanners, setAvailableBanners] = useState([]);
  const [availableFeatured, setAvailableFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  // Editor states
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);

  // Publish / Schedule
  const [publishStart, setPublishStart] = useState('');
  const [publishEnd, setPublishEnd] = useState('');
  const [fallbackThemeId, setFallbackThemeId] = useState('');
  const [activatingId, setActivatingId] = useState(null);

  // Modals & Menu
  const [themeToDelete, setThemeToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [activeMenuThemeId, setActiveMenuThemeId] = useState(null);

  // Close card menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuThemeId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch all themes
  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await websiteThemesAPI.getAll({ limit: 100 });
      const items = getData(res);
      setThemes(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Failed to load themes:', error);
      toast.error('Could not load website themes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch related database records
  const fetchRelatedData = useCallback(async () => {
    try {
      const [bannersRes, featRes, catRes] = await Promise.all([
        bannersAPI.getAll({ limit: 100 }),
        featuredAPI.getAll({ limit: 100 }),
        categoriesAPI.getLookup({ status: 'active' }),
      ]);
      setAvailableBanners(getData(bannersRes) || []);
      setAvailableFeatured(getData(featRes) || []);
      setCategories(getData(catRes) || []);
    } catch (err) {
      console.error('Failed to load related data:', err);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
    fetchRelatedData();
  }, [fetchThemes, fetchRelatedData]);

  // Preview media resolution
  useEffect(() => {
    let cancelled = false;
    if (editing?._id) {
      websiteThemesAPI
        .preview(editing._id)
        .then((res) => {
          if (!cancelled) setPreviewMedia(getData(res)?.config?.mediaOverrides || []);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [editing?._id, tab]);



  const visibleThemes = useMemo(() => {
    return themes.filter((theme) => {
      const matchesFilter = filter === 'all' || theme.status === filter;
      const matchesSearch =
        !search ||
        `${theme.name} ${theme.code} ${theme.description}`.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [themes, filter, search]);

  const updateConfig = (updater) =>
    setEditing((current) => ({ ...current, config: updater(current.config) }));

  // Open theme editor
  const openEditor = async (theme = null, initialTab = 'details') => {
    if (!theme) {
      setEditing(emptyTheme());
      setTab('details');
      setPublishStart('');
      setPublishEnd('');
      setFallbackThemeId('');
      return;
    }

    try {
      const res = await websiteThemesAPI.getById(theme._id);
      const data = getData(res);
      const base = emptyTheme();

      setEditing({
        ...base,
        ...data,
        config: {
          ...base.config,
          ...(data.config || {}),
          bannerSelections: data.config?.bannerSelections || [],
          featuredSelections: data.config?.featuredSelections || [],
          colors: { ...base.config.colors, ...data.config?.colors },
          typography: { ...base.config.typography, ...data.config?.typography },
          sections: data.config?.sections?.length ? data.config.sections : base.config.sections,
        },
      });

      setPublishStart(data.schedule?.startAt ? new Date(data.schedule.startAt).toISOString().slice(0, 16) : '');
      setPublishEnd(data.schedule?.endAt ? new Date(data.schedule.endAt).toISOString().slice(0, 16) : '');
      setFallbackThemeId(data.schedule?.fallbackThemeId || '');
      setTab(initialTab);
    } catch (err) {
      toast.error('Could not load this theme');
    }
  };

  // Save draft changes
  const saveTheme = async () => {
    if (!editing?.name?.trim()) return toast.error('Enter a theme name first');

    const themeConfig = { ...editing.config };
    const payload = {
      name: editing.name.trim(),
      code: editing.code?.trim() || slugify(editing.name),
      description: editing.description || '',
      config: themeConfig,
      schedule: {
        ...(editing.schedule || {}),
        ...(publishStart ? { startAt: istDateToIso(publishStart) } : {}),
        ...(publishEnd ? { endAt: istDateToIso(publishEnd) } : {}),
        ...(fallbackThemeId ? { fallbackThemeId } : {}),
      },
    };

    try {
      setSaving(true);
      const response = editing._id
        ? await websiteThemesAPI.update(editing._id, payload)
        : await websiteThemesAPI.create(payload);

      const saved = getData(response);
      toast.success(editing._id ? 'Theme changes saved' : 'Theme created');
      await fetchThemes();
      setEditing(saved);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save theme');
    } finally {
      setSaving(false);
    }
  };

  // Duplicate theme
  const duplicateTheme = async (theme) => {
    try {
      await websiteThemesAPI.duplicate(theme._id);
      toast.success('Theme duplicated successfully');
      await fetchThemes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not duplicate theme');
    }
  };

  // Activate theme
  const activateTheme = async (theme) => {
    if (!theme?._id || activatingId) return;
    setActivatingId(theme._id);
    try {
      const result = getData(await websiteThemesAPI.publish(theme._id, {}));
      toast.success(`Theme "${theme.name}" is now live on the storefront!`);
      await fetchThemes();
      if (editing?._id === theme._id) {
        setEditing(result?.theme || { ...theme, status: 'active' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not activate theme');
    } finally {
      setActivatingId(null);
    }
  };

  // Publish / Schedule
  const publishTheme = async () => {
    if (!editing?._id) return toast.error('Save the theme before publishing');

    try {
      const result = getData(
        await websiteThemesAPI.publish(editing._id, {
          ...(publishStart ? { startAt: istDateToIso(publishStart) } : {}),
          ...(publishEnd ? { endAt: istDateToIso(publishEnd) } : {}),
          ...(fallbackThemeId ? { fallbackThemeId } : {}),
        })
      );
      toast.success(result?.scheduled ? 'Theme scheduled successfully' : 'Theme published live!');
      setEditing(result?.theme || editing);
      await fetchThemes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish theme');
    }
  };

  // Rollback
  const rollbackTheme = async (theme) => {
    const isConfirmed = await confirm({
      title: 'Restore Published Theme Snapshot',
      message: `Are you sure you want to restore the previous published snapshot of "${theme.name}"?`,
      confirmText: 'Restore Theme',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!isConfirmed) return;
    try {
      await websiteThemesAPI.rollback(theme._id);
      toast.success('Theme rolled back successfully');
      await fetchThemes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not restore theme snapshot');
    }
  };

  // Archive
  const archiveTheme = async (theme) => {
    const isConfirmed = await confirm({
      title: 'Archive Theme',
      message: `Are you sure you want to archive theme "${theme.name}"?`,
      confirmText: 'Archive Theme',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!isConfirmed) return;
    try {
      await websiteThemesAPI.archive(theme._id);
      toast.success('Theme archived');
      await fetchThemes();
      if (editing?._id === theme._id) setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not archive theme');
    }
  };

  // Delete
  const deleteTheme = async (theme) => {
    if (!theme || deletingId) return;
    setDeletingId(theme._id);
    try {
      await websiteThemesAPI.remove(theme._id);
      toast.success('Theme deleted');
      setThemeToDelete(null);
      if (editing?._id === theme._id) setEditing(null);
      await fetchThemes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete theme');
    } finally {
      setDeletingId(null);
    }
  };

  const counts = ['active', 'scheduled', 'draft', 'archived'].reduce(
    (acc, st) => ({ ...acc, [st]: themes.filter((t) => t.status === st).length }),
    {}
  );

  const activeThemeObj = useMemo(
    () => themes.find((t) => t.status === 'active'),
    [themes]
  );

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: THEME EDITOR (Screenshot 2)
  // ─────────────────────────────────────────────────────────────
  if (editing) {
    const config = editing.config || DEFAULT_CONFIG;
    const isLive = editing.status === 'active';

    const tabs = [
      ['details', 'Theme Details'],
      ['media', 'Media Library'],
    ];

    return (
      <div className="mx-auto max-w-[1550px] space-y-6 p-4 md:p-8">
        {/* Editor Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              aria-label="Back to themes"
            >
              <HiOutlineArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-stone-900">
                  {editing._id ? `Edit Theme - ${editing.name}` : 'Create New Theme'}
                </h1>
                {editing.status && (
                  <span className={`rounded-full px-3 py-1 text-xs capitalize ${statusClass[editing.status]}`}>
                    {editing.status}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Manage details, media and schedule for this theme.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveTheme}
              disabled={saving}
              style={{ backgroundColor: "var(--theme-primary, #8b6f4e)" }} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
            >
              <HiOutlineSave className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {editing._id && !isLive && (
              <button
                type="button"
                onClick={() => activateTheme(editing)}
                disabled={activatingId === editing._id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <HiOutlineCheck className="h-4 w-4" />
                {activatingId === editing._id ? 'Activating…' : 'Activate Theme'}
              </button>
            )}
          </div>
        </header>



        {/* Tab Navigation Strip */}
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                tab === key
                  ? 'bg-[#8b6f4e] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
              style={
                tab === key
                  ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {/* TAB 1: THEME DETAILS (Includes Identity & Campaign Schedule) */}
        {tab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <section className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs w-full">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Theme Identity</h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Theme name, slug code, and campaign notes.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Theme Name">
                  <input
                    className={inputClass}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        name: e.target.value,
                        code: editing._id ? editing.code : slugify(e.target.value),
                      })
                    }
                    placeholder="Diwali 2026"
                  />
                </Field>

                <Field label="Theme Code">
                  <input
                    className={inputClass}
                    value={editing.code || ''}
                    onChange={(e) => setEditing({ ...editing, code: slugify(e.target.value) })}
                    placeholder="diwali-2026"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      rows={4}
                      className="w-full min-h-[120px] rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15 resize-y leading-relaxed placeholder:text-stone-400"
                      value={editing.description || ''}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      placeholder="Seasonal campaign notes, collection highlights, and storefront focus."
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Campaign Schedule & Publish */}
            <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs w-full">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Publish or Schedule Campaign</h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Release dates use the Neirah storefront timezone (Asia/Kolkata).
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-bold text-stone-700 mb-1.5">
                    Start Date & Time (Schedule Release)
                  </span>
                  <DatePicker
                    includeTime={true}
                    value={publishStart}
                    onChange={(val) => setPublishStart(val)}
                    placeholder="Select start date & time"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold text-stone-700 mb-1.5">
                    End Date & Expiry (Optional)
                  </span>
                  <DatePicker
                    includeTime={true}
                    value={publishEnd}
                    onChange={(val) => setPublishEnd(val)}
                    minDate={publishStart}
                    placeholder="Select end date & time"
                  />
                </div>
              </div>

              <div>
                <Field label="Fallback Theme on Expiry">
                  <select
                    className={inputClass}
                    value={fallbackThemeId}
                    onChange={(e) => setFallbackThemeId(e.target.value)}
                  >
                    <option value="">Use the previous published theme</option>
                    {themes
                      .filter((t) => t._id !== editing._id && t.status !== 'archived')
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.status})
                        </option>
                      ))}
                  </select>
                </Field>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={publishTheme}
                  disabled={!editing._id}
                  style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                  className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {publishStart && new Date(istDateToIso(publishStart)) > new Date()
                    ? 'Schedule Theme Release'
                    : isLive
                    ? 'Update Schedule Settings'
                    : 'Publish Live Storefront Now'}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MEDIA LIBRARY (Comprehensive View - Section 4) */}
        {tab === 'media' && (
          <ThemeMediaLibraryTab
            themeId={editing._id}
            themeStatus={editing.status}
            availableBanners={availableBanners}
            availableFeatured={availableFeatured}
            categories={categories}
            onMediaChanged={fetchRelatedData}
          />
        )}


      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: THEME MANAGEMENT (Matches Media & Theme Gallery compact layout)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* ─── 1. COMPACT MODULE HEADER (Matching Media & Theme Gallery) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 leading-tight">
            Theme Management
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live: {activeThemeObj?.name || 'diwali 2026'}
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchThemes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Refresh Themes"
          >
            <HiOutlineRefresh className={`w-3.5 h-3.5 stroke-2 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => openEditor(null)}
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 hover:brightness-95 active:scale-[0.98] text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Theme</span>
          </button>
        </div>
      </div>

      {/* ─── 2. STAT CARDS ROW (Compact layout matching Media & Theme Gallery) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Live Themes */}
        <div
          onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
          style={{
            borderColor: filter === 'active' ? 'var(--theme-primary, #8b6f4e)' : undefined,
            boxShadow: filter === 'active' ? '0 0 0 1px rgba(var(--theme-primary-rgb, 139, 111, 78), 0.35)' : undefined,
          }}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            filter !== 'active' ? 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs' : ''
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#effaf2] text-[#16a34a] border border-emerald-200/50 flex items-center justify-center shrink-0">
            <HiOutlineCheckCircle className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Live Themes</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {counts.active || 0}
            </p>
          </div>
        </div>

        {/* Scheduled */}
        <div
          onClick={() => setFilter(filter === 'scheduled' ? 'all' : 'scheduled')}
          style={{
            borderColor: filter === 'scheduled' ? 'var(--theme-primary, #8b6f4e)' : undefined,
            boxShadow: filter === 'scheduled' ? '0 0 0 1px rgba(var(--theme-primary-rgb, 139, 111, 78), 0.35)' : undefined,
          }}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            filter !== 'scheduled' ? 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs' : ''
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#eff6ff] text-[#2563eb] border border-blue-200/50 flex items-center justify-center shrink-0">
            <HiOutlineClock className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Scheduled</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {counts.scheduled || 0}
            </p>
          </div>
        </div>

        {/* Drafts */}
        <div
          onClick={() => setFilter(filter === 'draft' ? 'all' : 'draft')}
          style={{
            borderColor: filter === 'draft' ? 'var(--theme-primary, #8b6f4e)' : undefined,
            boxShadow: filter === 'draft' ? '0 0 0 1px rgba(var(--theme-primary-rgb, 139, 111, 78), 0.35)' : undefined,
          }}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            filter !== 'draft' ? 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs' : ''
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fef6ee] text-[#ea580c] border border-orange-200/50 flex items-center justify-center shrink-0">
            <HiOutlineColorSwatch className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Drafts</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {counts.draft || 0}
            </p>
          </div>
        </div>

        {/* Archived */}
        <div
          onClick={() => setFilter(filter === 'archived' ? 'all' : 'archived')}
          style={{
            borderColor: filter === 'archived' ? 'var(--theme-primary, #8b6f4e)' : undefined,
            boxShadow: filter === 'archived' ? '0 0 0 1px rgba(var(--theme-primary-rgb, 139, 111, 78), 0.35)' : undefined,
          }}
          className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all cursor-pointer ${
            filter !== 'archived' ? 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs' : ''
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f5f5f4] text-[#78716c] border border-stone-200/50 flex items-center justify-center shrink-0">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">Archived</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
              {counts.archived || 0}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER & TOOLBAR (Compact Layout like Media & Theme Gallery) ─── */}
      <div className="rounded-lg border border-stone-200/90 bg-white p-2 sm:p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            className="w-full rounded-md border border-stone-200 bg-stone-50/70 pl-8.5 pr-7 py-1.5 text-xs text-stone-800 placeholder-stone-400 outline-none transition focus:border-[#8b6f4e] focus:bg-white focus:ring-1 focus:ring-[#8b6f4e]/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search themes by name or code…"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <HiOutlineX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {['all', 'active', 'scheduled', 'draft', 'archived'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilter(val)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                filter === val
                  ? 'text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
              style={
                filter === val
                  ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' }
                  : {}
              }
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Theme Cards Grid (Matches Screenshot 1) */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center text-sm text-stone-500">
          Loading themes…
        </div>
      ) : visibleThemes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center">
          <HiOutlinePhotograph className="mx-auto h-12 w-12 text-stone-400" />
          <h3 className="mt-3 text-sm font-bold text-stone-800">No themes found</h3>
          <p className="mt-1 text-xs text-stone-500">
            Create a new theme to start customizing your website banners, sections, and media.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleThemes.map((theme) => {
            // Pick banner image for card cover
            const heroBanner =
              availableBanners.find((b) => b.display?.type === 'herobanner' && b.image?.url) ||
              availableBanners[0];
            const coverUrl = heroBanner?.image?.url || '';

            return (
              <article
                key={theme._id}
                onClick={() => openEditor(theme, 'details')}
                className="group relative flex flex-col justify-between rounded-xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all overflow-hidden cursor-pointer"
              >
                {/* Cover Image Header (16:10 aspect ratio matching Media Gallery) */}
                <div
                  className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden bg-cover bg-center"
                  style={{
                    backgroundImage: coverUrl
                      ? `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%), url("${coverUrl}")`
                      : 'linear-gradient(135deg, #EADCC8, #8B6C3A)',
                  }}
                >
                  {/* Top-Left: Code Badge */}
                  <div className="absolute left-2 top-2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white shadow-xs font-mono">
                      {theme.code}
                    </span>
                  </div>

                  {/* Top-Right: Status Badge */}
                  <div className="absolute right-2 top-2 z-10">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize shadow-xs backdrop-blur-md ${
                        theme.status === 'active'
                          ? 'bg-emerald-600/90 text-white'
                          : theme.status === 'scheduled'
                          ? 'bg-sky-600/90 text-white'
                          : theme.status === 'archived'
                          ? 'bg-stone-600/90 text-white'
                          : 'bg-amber-600/90 text-white'
                      }`}
                    >
                      {theme.status === 'active' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      )}
                      <span>{theme.status}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content (Compact padding matching Media Gallery) */}
                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div>
                    <h4
                      className="text-xs font-bold text-stone-900 group-hover:text-[var(--theme-primary,#8b6f4e)] transition truncate"
                      title={theme.name}
                    >
                      {theme.name}
                    </h4>
                    <p className="mt-0.5 text-[10px] text-stone-400 font-normal">
                      Last updated: {theme.meta?.updatedAt
                        ? new Date(theme.meta.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '28 Oct 2026'}
                    </p>
                  </div>

                  {/* Actions Row (Compact) */}
                  <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-1.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor(theme, 'details');
                      }}
                      style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                      className="flex-1 py-1 px-2.5 flex items-center justify-center rounded-md text-[11px] font-semibold text-white shadow-2xs hover:brightness-95 transition cursor-pointer"
                      title="Edit Theme"
                    >
                      Edit
                    </button>

                    {/* Three Dots Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuThemeId(activeMenuThemeId === theme._id ? null : theme._id);
                        }}
                        className="py-1 px-1.5 rounded-md border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition shadow-2xs cursor-pointer flex items-center justify-center"
                        title="More actions"
                      >
                        <HiOutlineDotsVertical className="h-3.5 w-3.5" />
                      </button>

                      {activeMenuThemeId === theme._id && (
                        <div
                          className="absolute right-0 bottom-full mb-1 z-30 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl text-xs space-y-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              duplicateTheme(theme);
                              setActiveMenuThemeId(null);
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-stone-700 hover:bg-stone-100 font-medium"
                          >
                            <HiOutlineDuplicate className="h-4 w-4" />
                            Duplicate
                          </button>
                          {theme.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                activateTheme(theme);
                                setActiveMenuThemeId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-emerald-700 hover:bg-emerald-50 font-medium"
                            >
                              <HiOutlineCheck className="h-4 w-4" />
                              Activate
                            </button>
                          )}
                          {theme.status !== 'archived' && theme.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                archiveTheme(theme);
                                setActiveMenuThemeId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-stone-600 hover:bg-stone-100 font-medium"
                            >
                              Archive
                            </button>
                          )}
                          {theme.publishedSnapshot && (
                            <button
                              type="button"
                              onClick={() => {
                                rollbackTheme(theme);
                                setActiveMenuThemeId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-stone-600 hover:bg-stone-100 font-medium"
                            >
                              Restore Snapshot
                            </button>
                          )}
                          <div className="border-t border-stone-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setThemeToDelete(theme);
                              setActiveMenuThemeId(null);
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 font-medium"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!themeToDelete}
        title="Delete Theme"
        message={`Are you sure you want to delete "${themeToDelete?.name || ''}"? Any associated schedules will be cancelled. Media files stored in the database will be preserved.`}
        confirmText="Delete Theme"
        type="danger"
        loading={!!deletingId}
        onConfirm={() => deleteTheme(themeToDelete)}
        onCancel={() => {
          if (!deletingId) setThemeToDelete(null);
        }}
      />
    </div>
  );
}
