import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineDuplicate,
  HiOutlineEye,
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
  HiOutlineDeviceMobile,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineDesktopComputer,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { websiteThemesAPI, bannersAPI, featuredAPI, categoriesAPI } from '../../api/services';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatCards from '../../components/common/StatCards';
import ThemeStorefrontPreview from './ThemeStorefrontPreview';
import ThemeMediaLibraryTab from './ThemeMediaLibraryTab';
import ThemeHomeSectionsEditor from './ThemeHomeSectionsEditor';

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
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 outline-none transition focus:border-[#8b6c3a] focus:ring-2 focus:ring-[#8b6c3a]/15';

export default function WebsiteThemesView() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Related data
  const [availableBanners, setAvailableBanners] = useState([]);
  const [availableFeatured, setAvailableFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);

  // Editor states
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('sections');
  const [selectedHomeSectionKey, setSelectedHomeSectionKey] = useState('hero');
  const [previewMedia, setPreviewMedia] = useState([]);
  const [previewMode, setPreviewMode] = useState('desktop');
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

  // History tab loader
  useEffect(() => {
    if (tab === 'history' && editing?._id) {
      websiteThemesAPI
        .getHistory(editing._id)
        .then((res) => setHistory(getData(res) || []))
        .catch(() => {});
    }
  }, [tab, editing?._id]);

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
  const openEditor = async (theme = null, initialTab = 'sections') => {
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

      setPublishStart('');
      setPublishEnd('');
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
      schedule: editing.schedule || {},
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
    if (!window.confirm(`Restore previous published snapshot of "${theme.name}"?`)) return;
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
    if (!window.confirm(`Archive theme "${theme.name}"?`)) return;
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

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: THEME EDITOR (Screenshot 2)
  // ─────────────────────────────────────────────────────────────
  if (editing) {
    const config = editing.config || DEFAULT_CONFIG;
    const isLive = editing.status === 'active';

    const tabs = [
      ['details', 'Theme Details'],
      ['sections', 'Home Sections'],
      ['banners', 'Banners & Content'],
      ['media', 'Media Library'],
      ['categories', 'Category Icons'],
      ['preview', 'Live Preview'],
      ['publish', 'Schedule & Publish'],
      ['history', 'History'],
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
                Manage sections, banners and content for this theme.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                tab === 'preview'
                  ? 'border-[#8b6c3a] bg-[#8b6c3a]/10 text-[#8b6c3a]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <HiOutlineEye className="h-4 w-4" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={saveTheme}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8b6c3a] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition disabled:opacity-50 cursor-pointer"
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

        {isLive && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-5 py-3.5 text-xs text-blue-900 flex items-center justify-between">
            <span>● <strong>Active Theme:</strong> Changes to this theme will be reflected on the live storefront when saved.</span>
            <button
              type="button"
              onClick={() => duplicateTheme(editing)}
              className="font-bold underline ml-3"
            >
              Duplicate as draft
            </button>
          </div>
        )}

        {/* Tab Navigation Strip */}
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                tab === key
                  ? 'bg-[#8b6c3a] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* TAB 1: THEME DETAILS */}
        {tab === 'details' && (
          <section className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-2 shadow-xs">
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

            <Field label="Theme Code" hint="Stable internal identifier for the theme">
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
                  rows={3}
                  className={inputClass}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Seasonal campaign notes, collection highlights, and storefront focus."
                />
              </Field>
            </div>

          </section>
        )}

        {/* TAB 3: HOME SECTIONS (TWO-PANEL EDITOR - Screenshot 2) */}
        {tab === 'sections' && (
          <ThemeHomeSectionsEditor
            themeConfig={config}
            updateThemeConfig={updateConfig}
            availableBanners={availableBanners}
            availableFeatured={availableFeatured}
            categories={categories}
            onBannerUpdated={fetchRelatedData}
            onFeaturedUpdated={fetchRelatedData}
            selectedSectionKey={selectedHomeSectionKey}
            setSelectedSectionKey={setSelectedHomeSectionKey}
          />
        )}

        {/* TAB 4: BANNERS & CONTENT */}
        {tab === 'banners' && (
          <section className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-stone-900">Website Banners & Content Selection</h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Select and order existing website banner records for this theme.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateConfig((cfg) => ({
                    ...cfg,
                    bannerSelections: [
                      ...(cfg.bannerSelections || []),
                      { bannerId: null, type: 'herobanner', platform: 'web', order: (cfg.bannerSelections || []).length + 1, visible: true },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6c3a] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition"
              >
                <HiOutlinePlus className="h-4 w-4" />
                Add Banner Selection
              </button>
            </div>

            <div className="space-y-3">
              {(config.bannerSelections || []).map((sel, idx) => {
                const banner = availableBanners.find((b) => String(b._id) === String(sel.bannerId?._id || sel.bannerId));
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 p-4 bg-stone-50/50"
                  >
                    <div className="grid flex-1 gap-3 sm:grid-cols-3">
                      <div>
                        <span className="block text-[11px] font-bold text-stone-600 mb-1">Banner Type</span>
                        <select
                          className={inputClass}
                          value={sel.type}
                          onChange={(e) => {
                            const next = [...config.bannerSelections];
                            next[idx] = { ...next[idx], type: e.target.value };
                            updateConfig((c) => ({ ...c, bannerSelections: next }));
                          }}
                        >
                          <option value="herobanner">Hero Banner</option>
                          <option value="collectionbanner">Collection Banner</option>
                          <option value="categorybanner">Category Banner</option>
                          <option value="mobileappbanner">App Banner</option>
                          <option value="customizebanner">Customize Banner</option>
                          <option value="bookappointbanner">Appointment Banner</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-stone-600 mb-1">Existing Banner Record</span>
                        <select
                          className={inputClass}
                          value={String(sel.bannerId?._id || sel.bannerId || '')}
                          onChange={(e) => {
                            const next = [...config.bannerSelections];
                            next[idx] = { ...next[idx], bannerId: e.target.value || null };
                            updateConfig((c) => ({ ...c, bannerSelections: next }));
                          }}
                        >
                          <option value="">Select a banner…</option>
                          {availableBanners.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.content?.title || b.title || 'Untitled'} ({b.display?.type} · {b.display?.platform})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-stone-600 mb-1">Display Order</span>
                        <input
                          type="number"
                          className={inputClass}
                          value={sel.order ?? idx + 1}
                          onChange={(e) => {
                            const next = [...config.bannerSelections];
                            next[idx] = { ...next[idx], order: Number(e.target.value) };
                            updateConfig((c) => ({ ...c, bannerSelections: next }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {banner?.image?.url && (
                        <img
                          src={banner.image.url}
                          alt="Banner"
                          className="h-12 w-16 rounded-lg object-cover border border-stone-200"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const next = config.bannerSelections.filter((_, i) => i !== idx);
                          updateConfig((c) => ({ ...c, bannerSelections: next }));
                        }}
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        title="Remove selection"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 5: MEDIA LIBRARY (Comprehensive View - Section 4) */}
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

        {/* TAB 6: CATEGORY ICONS */}
        {tab === 'categories' && (
          <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-stone-900">Category Presentation Overrides</h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Override icon artwork and display labels for existing categories without changing database records.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateConfig((cfg) => ({
                    ...cfg,
                    categoryAppearances: [
                      ...(cfg.categoryAppearances || []),
                      { categoryId: '', displayName: '', icon: { url: '', key: '' }, visible: true, order: (cfg.categoryAppearances || []).length + 1 },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8b6c3a] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition"
              >
                <HiOutlinePlus className="h-4 w-4" />
                Add Category Icon
              </button>
            </div>

            <div className="space-y-3">
              {(config.categoryAppearances || []).map((entry, idx) => (
                <div
                  key={idx}
                  className="grid items-end gap-3 rounded-2xl border border-stone-200 p-4 sm:grid-cols-[1.5fr_1.5fr_80px_auto_auto]"
                >
                  <Field label="Category">
                    <select
                      className={inputClass}
                      value={entry.categoryId?._id || entry.categoryId || ''}
                      onChange={(e) => {
                        const next = [...config.categoryAppearances];
                        next[idx] = { ...next[idx], categoryId: e.target.value };
                        updateConfig((c) => ({ ...c, categoryAppearances: next }));
                      }}
                    >
                      <option value="">Choose category…</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Custom Display Name">
                    <input
                      type="text"
                      className={inputClass}
                      value={entry.displayName || ''}
                      placeholder="Use default category name"
                      onChange={(e) => {
                        const next = [...config.categoryAppearances];
                        next[idx] = { ...next[idx], displayName: e.target.value };
                        updateConfig((c) => ({ ...c, categoryAppearances: next }));
                      }}
                    />
                  </Field>

                  <Field label="Order">
                    <input
                      type="number"
                      className={inputClass}
                      value={entry.order ?? idx + 1}
                      onChange={(e) => {
                        const next = [...config.categoryAppearances];
                        next[idx] = { ...next[idx], order: Number(e.target.value) };
                        updateConfig((c) => ({ ...c, categoryAppearances: next }));
                      }}
                    />
                  </Field>

                  <label className="flex items-center gap-2 pb-3 text-xs text-stone-700">
                    <input
                      type="checkbox"
                      checked={entry.visible !== false}
                      onChange={(e) => {
                        const next = [...config.categoryAppearances];
                        next[idx] = { ...next[idx], visible: e.target.checked };
                        updateConfig((c) => ({ ...c, categoryAppearances: next }));
                      }}
                    />
                    Visible
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const next = config.categoryAppearances.filter((_, i) => i !== idx);
                      updateConfig((c) => ({ ...c, categoryAppearances: next }));
                    }}
                    className="pb-3 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 8: LIVE PREVIEW (Screenshot 3) */}
        {tab === 'preview' && (
          <ThemeStorefrontPreview
            config={config}
            availableBanners={availableBanners}
            availableFeatured={availableFeatured}
            categories={categories}
            previewMedia={previewMedia}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            themeName={editing.name}
            onSelectSection={(secKey) => {
              setSelectedHomeSectionKey(secKey);
              setTab('sections');
              toast.success(`Opened ${secKey} editor in Home Sections`);
            }}
          />
        )}

        {/* TAB 9: SCHEDULE & PUBLISH */}
        {tab === 'publish' && (
          <section className="grid gap-6 rounded-2xl border border-stone-200 bg-white p-6 lg:grid-cols-2 shadow-xs">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-stone-900">Publish or Schedule Campaign</h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Release dates use the Neirah storefront timezone (Asia/Kolkata).
                </p>
              </div>

              <Field label="Start Date & Time (Schedule Release)">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={publishStart}
                  onChange={(e) => setPublishStart(e.target.value)}
                />
              </Field>

              <Field label="End Date & Expiry (Optional)">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={publishEnd}
                  onChange={(e) => setPublishEnd(e.target.value)}
                />
              </Field>

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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={publishTheme}
                  disabled={!editing._id}
                  className="rounded-xl bg-[#8b6c3a] px-6 py-3 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition disabled:opacity-50"
                >
                  {publishStart && new Date(istDateToIso(publishStart)) > new Date()
                    ? 'Schedule Theme Release'
                    : isLive
                    ? 'Update Schedule Settings'
                    : 'Publish Live Storefront Now'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-50 p-5 space-y-3 border border-stone-200">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600" />
                Publishing Safeguards
              </h4>
              <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <li>• Draft changes stay private and isolated from the live storefront.</li>
                <li>• Publishing takes an immutable snapshot for safe instantaneous rollback.</li>
                <li>• Automatic cron reconciles scheduled campaigns at their exact start time.</li>
                <li>• Shared media files are preserved across theme transitions and rollbacks.</li>
              </ul>
            </div>
          </section>
        )}

        {/* TAB 10: HISTORY */}
        {tab === 'history' && (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
            <div className="border-b border-stone-100 p-5">
              <h3 className="font-bold text-stone-900">Publishing & Revision History</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                Audit trail of changes, scheduled campaigns, activations and rollbacks.
              </p>
            </div>

            {history.length ? (
              <div className="divide-y divide-stone-100">
                {history.map((item) => (
                  <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <span className="font-semibold capitalize text-stone-800 text-xs">
                        {item.action?.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-xs text-stone-500">{item.details}</span>
                      <p className="mt-1 text-[11px] text-stone-400">
                        {item.actorId?.name || 'System'} ·{' '}
                        {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-stone-400">
                      Revision {item.revision || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-stone-500">
                No activity recorded for this theme yet.
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: THEME MANAGEMENT (Screenshot 1)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1550px] space-y-6 p-4 md:p-8">
      {/* 1. Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Theme Management</h1>
          <p className="mt-1 text-xs md:text-sm text-stone-500">
            Create, manage and preview website themes with banners, sections and media.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#8b6c3a] px-5 py-3 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-[#765a2d] transition cursor-pointer"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Add Theme
        </button>
      </header>

      {/* 2. Stats Cards */}
      <StatCards
        cards={[
          {
            label: 'Live Themes',
            value: counts.active || 0,
            icon: HiOutlineCheckCircle,
            color: 'green',
            onClick: () => setFilter(filter === 'active' ? 'all' : 'active'),
            active: filter === 'active',
          },
          {
            label: 'Scheduled',
            value: counts.scheduled || 0,
            icon: HiOutlineClock,
            color: 'blue',
            onClick: () => setFilter(filter === 'scheduled' ? 'all' : 'scheduled'),
            active: filter === 'scheduled',
          },
          {
            label: 'Drafts',
            value: counts.draft || 0,
            icon: HiOutlineColorSwatch,
            color: 'gold',
            onClick: () => setFilter(filter === 'draft' ? 'all' : 'draft'),
            active: filter === 'draft',
          },
          {
            label: 'Archived',
            value: counts.archived || 0,
            icon: HiOutlineShieldCheck,
            color: 'bronze',
            onClick: () => setFilter(filter === 'archived' ? 'all' : 'archived'),
            active: filter === 'archived',
          },
        ]}
      />

      {/* 3. Search and Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-xs">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search themes by name or code…"
          />
          <HiOutlineSearch className="absolute right-3 top-3 h-4 w-4 text-stone-400" />
        </div>
        <div className="flex flex-wrap gap-1">
          {['all', 'active', 'scheduled', 'draft', 'archived'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilter(val)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                filter === val ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleThemes.map((theme) => {
            // Pick banner image for card cover
            const heroBanner =
              availableBanners.find((b) => b.display?.type === 'herobanner' && b.image?.url) ||
              availableBanners[0];
            const coverUrl = heroBanner?.image?.url || '';

            return (
              <article
                key={theme._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition hover:shadow-md hover:border-stone-300"
              >
                {/* Cover Image Header */}
                <div
                  className="relative h-48 w-full overflow-hidden bg-cover bg-center"
                  style={{
                    backgroundImage: coverUrl
                      ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%), url("${coverUrl}")`
                      : 'linear-gradient(135deg, #EADCC8, #8B6C3A)',
                  }}
                >
                  {/* Status Badge */}
                  <span
                    className={`absolute top-3.5 right-3.5 rounded-full px-3 py-1 text-xs capitalize ${
                      statusClass[theme.status] || 'bg-stone-600 text-white'
                    }`}
                  >
                    {theme.status}
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-[#8b6c3a] transition">
                      {theme.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      Theme code: <span className="font-mono text-stone-600">{theme.code}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      Last updated:{' '}
                      {theme.meta?.updatedAt
                        ? new Date(theme.meta.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '24 Oct 2026'}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditor(theme, 'sections')}
                      className="rounded-xl bg-[#8b6c3a] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#765a2d] transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditor(theme, 'preview')}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                    >
                      Preview
                    </button>

                    {/* Three Dots Menu */}
                    <div className="relative ml-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuThemeId(activeMenuThemeId === theme._id ? null : theme._id);
                        }}
                        className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition cursor-pointer"
                        title="More actions"
                      >
                        <HiOutlineDotsVertical className="h-4 w-4" />
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
