import ThemeImageField from '../../components/common/ThemeImageField';
import ThemeMediaManager from '../../components/common/ThemeMediaManager';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiOutlineArrowLeft, HiOutlineDuplicate, HiOutlineEye, HiOutlinePhotograph, HiOutlinePlus, HiOutlineSave, HiOutlineShieldCheck, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { websiteThemesAPI } from '../../api/services';

/* eslint-disable react/prop-types */

const SECTION_OPTIONS = [
  ['hero', 'Homepage hero'], ['categories', 'Category icons'], ['products', 'Product collections'],
  ['collections', 'Collection banners'], ['trustBadges', 'Trust badges'], ['customBanner', 'Custom jewellery'],
  ['reviews', 'Customer reviews'], ['instagram', 'Instagram gallery'],
];
const BANNER_TYPE_OPTIONS = [
  ['herobanner', 'Hero Banner'], ['collectionbanner', 'Collection Banner'], ['categorybanner', 'Category Banner'],
  ['offerbanner', 'Offer Banner'], ['mobileappbanner', 'App Banner'], ['bookappointbanner', 'Appointment Banner'], ['websitebanner', 'Other'],
];
const bannerIdOf = (bannerId) => String(bannerId?._id || bannerId || '');
const bannerTitleOf = (banner) => {
  const position = banner?.display?.position;
  return banner?.content?.title?.trim() || (position && position !== 'none' ? position : '') || `${BANNER_TYPE_OPTIONS.find(([type]) => type === banner?.display?.type)?.[1] || 'Banner'} · ${bannerIdOf(banner?._id).slice(-6)}`;
};
const COLOR_OPTIONS = [
  ['primary', 'Primary'], ['secondary', 'Secondary'], ['background', 'Background'],
  ['surface', 'Surface'], ['text', 'Text'], ['accent', 'Accent'],
];
const DEFAULT_CONFIG = {
  colors: { primary: '#8B6C3A', secondary: '#EADCC8', background: '#FBF9F5', surface: '#FFFFFF', text: '#29251F', accent: '#A67536' },
  typography: { headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat' },
  buttonStyle: 'filled', borderRadius: 8, seo: { metaTitle: '', metaDescription: '' }, bannerSelections: [], categoryAppearances: [], navigation: [],
  sections: SECTION_OPTIONS.map(([key], index) => ({ key, visible: true, order: index + 1 })),
};
const emptyTheme = () => ({ name: '', code: '', description: '', config: structuredClone(DEFAULT_CONFIG), schedule: {} });
const getData = (response) => response?.data?.data;
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const istDateToIso = (value) => value ? new Date(`${value}:00+05:30`).toISOString() : undefined;
const statusClass = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-200',
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  archived: 'bg-stone-100 text-stone-600 ring-stone-200',
};

function Field({ label, children, hint }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}{hint && <span className="block text-xs text-slate-500">{hint}</span>}</label>;
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#a67c4b] focus:ring-2 focus:ring-[#a67c4b]/15';

export default function WebsiteThemesView() {
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableBanners, setAvailableBanners] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('general');
  const [previewMedia, setPreviewMedia] = useState([]);
  useEffect(() => {
    let cancelled = false;
    setPreviewMedia([]);
    if (editing?._id) websiteThemesAPI.preview(editing._id).then((response) => {
      if (!cancelled) setPreviewMedia(getData(response)?.config?.mediaOverrides || []);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [editing?._id, tab]);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [publishStart, setPublishStart] = useState('');
  const [publishEnd, setPublishEnd] = useState('');
  const [fallbackThemeId, setFallbackThemeId] = useState('');
  const editorIsActive = editing?.status === 'active';

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      const result = getData(await websiteThemesAPI.getAll({ limit: 100 }));
      setThemes(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load website themes');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchThemes();
    api.get('/categories/lookup').then((res) => {
      const value = getData(res);
      setCategories(Array.isArray(value) ? value : value?.items || []);
    }).catch(() => setCategories([]));
    api.get('/banners', { params: { limit: 100 } }).then((res) => {
      const value = getData(res);
      setAvailableBanners(Array.isArray(value) ? value : []);
    }).catch(() => setAvailableBanners([]));
  }, [fetchThemes]);

  const visibleThemes = useMemo(() => themes.filter((theme) => {
    const matchesFilter = filter === 'all' || theme.status === filter;
    const matchesSearch = !search || `${theme.name} ${theme.code} ${theme.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [themes, filter, search]);

  const updateConfig = (updater) => setEditing((current) => ({ ...current, config: updater(current.config) }));
  const openEditor = async (theme = null) => {
    if (!theme) {
      setEditing(emptyTheme());
      setTab('general');
      setPublishStart(''); setPublishEnd(''); setFallbackThemeId('');
      return;
    }
    try {
      const data = getData(await websiteThemesAPI.getById(theme._id));
      const base = emptyTheme();
      setEditing({ ...base, ...data, config: { ...base.config, ...(data.config || {}), bannerSelections: data.config?.bannerSelections || [], colors: { ...base.config.colors, ...data.config?.colors }, typography: { ...base.config.typography, ...data.config?.typography }, sections: data.config?.sections?.length ? data.config.sections : base.config.sections } });
      setPublishStart(''); setPublishEnd(''); setFallbackThemeId(data.schedule?.fallbackThemeId || '');
      setTab(data.status === 'active' ? 'preview' : 'general');
    } catch (error) { toast.error(error.response?.data?.message || 'Could not load this theme'); }
  };

  const saveTheme = async () => {
    if (!editing?.name?.trim()) return toast.error('Enter a theme name first');
    const themeConfig = { ...editing.config };
    if ((themeConfig.bannerSelections || []).some((selection) => selection.bannerId)) delete themeConfig.banners;
    const payload = { name: editing.name.trim(), code: editing.code?.trim() || slugify(editing.name), description: editing.description || '', config: themeConfig, schedule: editing.schedule || {} };
    try {
      setSaving(true);
      const response = editing._id
        ? await websiteThemesAPI.update(editing._id, payload)
        : await websiteThemesAPI.create(payload);
      const saved = getData(response);
      toast.success(editing._id ? 'Theme saved as a draft' : 'Theme created');
      await fetchThemes();
      setEditing(saved);
    } catch (error) { toast.error(error.response?.data?.message || 'Could not save theme'); }
    finally { setSaving(false); }
  };

  const duplicateTheme = async (theme) => {
    try { await websiteThemesAPI.duplicate(theme._id); toast.success('Theme duplicated'); await fetchThemes(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not duplicate theme'); }
  };

  const archiveTheme = async (theme) => {
    if (!window.confirm(`Archive “${theme.name}”?`)) return;
    try { await websiteThemesAPI.archive(theme._id); toast.success('Theme archived'); await fetchThemes(); if (editing?._id === theme._id) setEditing(null); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not archive theme'); }
  };

  const publishTheme = async () => {
    if (!editing?._id) { toast.error('Save the theme before publishing'); return; }
    if (editorIsActive && publishStart && new Date(istDateToIso(publishStart)) > new Date()) {
      toast.error('Duplicate the live theme before scheduling a new version');
      return;
    }
    try {
      const result = getData(await websiteThemesAPI.publish(editing._id, {
        ...(publishStart ? { startAt: istDateToIso(publishStart) } : {}),
        ...(publishEnd ? { endAt: istDateToIso(publishEnd) } : {}),
        ...(fallbackThemeId ? { fallbackThemeId } : {}),
      }));
      toast.success(result?.scheduled ? 'Theme scheduled' : 'Theme published');
      setEditing(result?.theme || editing);
      await fetchThemes();
    } catch (error) { toast.error(error.response?.data?.message || 'Could not publish theme'); }
  };

  const rollbackTheme = async (theme) => {
    if (!window.confirm(`Restore the published version of “${theme.name}”?`)) return;
    try { await websiteThemesAPI.rollback(theme._id); toast.success('Theme restored'); await fetchThemes(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not restore theme'); }
  };

  useEffect(() => {
    if (tab !== 'history' || !editing?._id) return undefined;
    let current = true;
    websiteThemesAPI.getHistory(editing._id)
      .then((response) => { if (current) setHistory(getData(response) || []); })
      .catch((error) => { if (current) toast.error(error.response?.data?.message || 'Could not load publishing history'); });
    return () => { current = false; };
  }, [tab, editing?._id]);

  const addBannerSelection = () => updateConfig((config) => ({
    ...config,
    bannerSelections: [...(config.bannerSelections || []), { bannerId: null, type: 'herobanner', platform: 'web', order: (config.bannerSelections || []).length + 1, visible: true }],
  }));
  const updateBannerSelection = (index, key, value) => updateConfig((config) => {
    const bannerSelections = [...(config.bannerSelections || [])];
    const selection = { ...bannerSelections[index] };
    if (key === 'type') {
      selection.type = value;
      selection.bannerId = null;
      selection.platform = value === 'mobileappbanner' ? 'mobile' : 'web';
    } else {
      selection[key] = value;
      if (key === 'platform') selection.bannerId = null;
    }
    bannerSelections[index] = selection;
    return { ...config, bannerSelections };
  });
  const removeBannerSelection = (index) => updateConfig((config) => ({
    ...config,
    bannerSelections: (config.bannerSelections || []).filter((_, selectionIndex) => selectionIndex !== index),
  }));
  const updateCategoryAppearance = (index, key, value) => updateConfig((config) => {
    const categoryAppearances = [...config.categoryAppearances]; categoryAppearances[index] = { ...categoryAppearances[index], [key]: value }; return { ...config, categoryAppearances };
  });

  if (editing) {
    const config = editing.config || DEFAULT_CONFIG;
    const bannerSelections = config.bannerSelections || [];
    const selectedBannerForPreview = bannerSelections
      .filter((selection) => selection.visible !== false && selection.type === 'herobanner' && selection.platform === 'web')
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((selection) => availableBanners.find((banner) => bannerIdOf(banner._id) === bannerIdOf(selection.bannerId)))
      .find(Boolean);
    const previewLegacyHero = config.banners?.find((banner) => banner.visible !== false && banner.placement === 'hero');
    const previewHeroImage = previewMedia.find((row) => row.module === 'banner' && row.slot === 'image' && String(row.recordId) === String(selectedBannerForPreview?._id))?.asset?.url || selectedBannerForPreview?.image?.url || previewLegacyHero?.desktopImage?.url || '';
    const previewHeroTitle = selectedBannerForPreview ? bannerTitleOf(selectedBannerForPreview) : previewLegacyHero?.title;
    const tabs = [['general', 'General'], ['style', 'Design & Style'], ['banners', 'Banners'], ['media', 'Theme Images'], ['categories', 'Category Icons'], ['navigation', 'Navigation'], ['sections', 'Home Sections'], ['preview', 'Preview'], ['publish', 'Schedule & Publish'], ['history', 'History']];
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50" aria-label="Back to themes"><HiOutlineArrowLeft /></button>
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b7448]">Website · Theme editor</p><h1 className="text-2xl font-bold text-slate-900">{editing._id ? editing.name : 'Create theme'}</h1></div>
          </div>
          <div className="flex items-center gap-2">
            {editing.status && <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${statusClass[editing.status]}`}>{editing.status}</span>}
            <button type="button" onClick={saveTheme} disabled={saving || editorIsActive} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><HiOutlineSave />{saving ? 'Saving…' : 'Save draft'}</button>
          </div>
        </header>
        {editorIsActive && <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">This theme is live. Duplicate it to make changes without changing the storefront.</p>}
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
          {tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium ${tab === key ? 'bg-[#8f6a42] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
        </nav>

        <fieldset disabled={editorIsActive && !['publish', 'preview', 'history'].includes(tab)} className="contents">
        {(tab === 'media' || tab === 'preview') && <ThemeMediaManager themeId={editing._id} readOnly={tab === 'preview' || editing.status !== 'draft'} />}

        {tab === 'general' && <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
          <Field label="Theme name"><input className={inputClass} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, code: editing._id ? editing.code : slugify(e.target.value) })} placeholder="Diwali 2026" /></Field>
          <Field label="Theme code" hint="Used as a stable internal identifier."><input className={inputClass} value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: slugify(e.target.value) })} placeholder="diwali-2026" /></Field>
          <div className="md:col-span-2"><Field label="Description"><textarea rows={3} className={inputClass} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Campaign notes and storefront context" /></Field></div>
          <div className="md:col-span-2 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2"><Field label="SEO title" hint="Up to 70 characters."><input maxLength={70} className={inputClass} value={config.seo?.metaTitle || ''} onChange={(e) => updateConfig((value) => ({ ...value, seo: { ...value.seo, metaTitle: e.target.value } }))} /></Field><Field label="SEO description" hint="Up to 180 characters."><textarea maxLength={180} rows={2} className={inputClass} value={config.seo?.metaDescription || ''} onChange={(e) => updateConfig((value) => ({ ...value, seo: { ...value.seo, metaDescription: e.target.value } }))} /></Field></div>
          <div className="md:col-span-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><HiOutlineShieldCheck className="mr-2 inline h-5 w-5 text-emerald-700" />Draft changes stay private until they are published.</div>
        </section>}

        {tab === 'style' && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div><h2 className="font-bold text-slate-900">Color palette</h2><p className="mt-1 text-sm text-slate-500">Controlled theme tokens used by the storefront.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{COLOR_OPTIONS.map(([key, label]) => <Field key={key} label={label}><div className="flex gap-2"><input aria-label={`${label} color`} className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 p-1" type="color" value={config.colors?.[key] || '#ffffff'} onChange={(e) => updateConfig((value) => ({ ...value, colors: { ...value.colors, [key]: e.target.value } }))} /><input className={inputClass} value={config.colors?.[key] || ''} onChange={(e) => updateConfig((value) => ({ ...value, colors: { ...value.colors, [key]: e.target.value } }))} /></div></Field>)}</div>
          <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Heading font"><select className={inputClass} value={config.typography?.headingFont} onChange={(e) => updateConfig((value) => ({ ...value, typography: { ...value.typography, headingFont: e.target.value } }))}>{['Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Georgia'].map((font) => <option key={font}>{font}</option>)}</select></Field>
            <Field label="Body font"><select className={inputClass} value={config.typography?.bodyFont} onChange={(e) => updateConfig((value) => ({ ...value, typography: { ...value.typography, bodyFont: e.target.value } }))}>{['Montserrat', 'Inter', 'Arial', 'system-ui'].map((font) => <option key={font}>{font}</option>)}</select></Field>
            <Field label="Button style"><select className={inputClass} value={config.buttonStyle || 'filled'} onChange={(e) => updateConfig((value) => ({ ...value, buttonStyle: e.target.value }))}><option value="filled">Filled</option><option value="outline">Outline</option><option value="pill">Pill</option></select></Field>
            <Field label={`Corner radius (${config.borderRadius || 0}px)`}><input className="mt-2 w-full accent-[#9b7448]" type="range" min="0" max="32" value={config.borderRadius ?? 8} onChange={(e) => updateConfig((value) => ({ ...value, borderRadius: Number(e.target.value) }))} /></Field>
          </div>
        </section>}

        {tab === 'banners' && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">Theme banners</h2><p className="mt-1 text-sm text-slate-500">Select existing Website Sections records. A collection banner stays one record with all four images.</p></div>
            <button type="button" onClick={addBannerSelection} className="inline-flex items-center gap-2 rounded-xl bg-[#8f6a42] px-4 py-2.5 text-sm font-semibold text-white"><HiOutlinePlus />Add banner</button>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">Hero banners can have separate Web and App (mobile) records. Choose the platform that matches each existing banner in Website Sections.</div>
          {!bannerSelections.length && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No banner records selected. Add a selection and choose an existing Website Sections banner.</div>}
          {bannerSelections.map((selection, index) => {
            const selectedId = bannerIdOf(selection.bannerId);
            const selectedIdsElsewhere = new Set(bannerSelections
              .filter((_, selectionIndex) => selectionIndex !== index)
              .map((item) => bannerIdOf(item.bannerId))
              .filter(Boolean));
            const existingBanner = availableBanners.find((banner) => bannerIdOf(banner._id) === selectedId);
            const options = availableBanners.filter((banner) => {
              const typeMatches = banner.display?.type === selection.type;
              const platformMatches = (banner.display?.platform || 'web') === selection.platform;
              const alreadyUsed = selectedIdsElsewhere.has(bannerIdOf(banner._id)) && bannerIdOf(banner._id) !== selectedId;
              return typeMatches && platformMatches && !alreadyUsed && (banner.status === 'active' || bannerIdOf(banner._id) === selectedId);
            });
            const title = existingBanner ? bannerTitleOf(existingBanner) : 'Choose an existing banner';
            const thumbnails = existingBanner?.display?.type === 'collectionbanner'
              ? (existingBanner.collectionImages || []).slice(0, 4).map((item) => item.url).filter(Boolean)
              : [existingBanner?.image?.url].filter(Boolean);
            return <article key={`${selectedId || 'new'}-${index}`} className="space-y-4 rounded-xl border border-slate-200 p-4">
              <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_100px_auto]">
                <Field label="Website Sections type"><select className={inputClass} value={selection.type} onChange={(event) => updateBannerSelection(index, 'type', event.target.value)}>{BANNER_TYPE_OPTIONS.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></Field>
                <Field label="Platform"><select className={inputClass} value={selection.platform || 'web'} onChange={(event) => updateBannerSelection(index, 'platform', event.target.value)}><option value="web">Web</option><option value="mobile">App (mobile)</option></select></Field>
                <Field label="Existing banner"><select className={inputClass} value={selectedId} onChange={(event) => updateBannerSelection(index, 'bannerId', event.target.value || null)}><option value="">Choose a banner</option>{selectedId && !existingBanner && <option value={selectedId}>Selected banner unavailable</option>}{options.map((banner) => <option key={banner._id} value={banner._id}>{bannerTitleOf(banner)}</option>)}</select></Field>
                <Field label="Order"><input type="number" min="0" className={inputClass} value={selection.order ?? index + 1} onChange={(event) => updateBannerSelection(index, 'order', Number(event.target.value))} /></Field>
                <button type="button" onClick={() => removeBannerSelection(index)} className="rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-600">Remove</button>
              </div>
              {existingBanner && <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3">
                {thumbnails.length > 0 && <div className="flex gap-2">{thumbnails.map((url, imageIndex) => <img key={`${url}-${imageIndex}`} src={url} alt={`${title} image ${imageIndex + 1}`} className="h-14 w-14 rounded-lg border border-white object-cover shadow-sm" />)}</div>}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{title}</p><p className="mt-0.5 text-xs text-slate-500">{selection.type === 'collectionbanner' ? `${existingBanner.collectionImages?.length || 0} images in one collection record` : `${selection.platform === 'mobile' ? 'App' : 'Web'} · ${selection.type === 'herobanner' ? 'Hero banner' : 'Website section'}`}</p></div>
                <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selection.visible !== false} onChange={(event) => updateBannerSelection(index, 'visible', event.target.checked)} />Visible</label>
                {existingBanner.status !== 'active' && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">{existingBanner.status || 'inactive'}</span>}
              </div>}
              {!existingBanner && <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><span>{options.length ? 'Choose an active banner record for this type and platform.' : 'No active records match this type and platform. Create one in Website Sections first.'}</span><label className="flex shrink-0 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selection.visible !== false} onChange={(event) => updateBannerSelection(index, 'visible', event.target.checked)} />Visible</label></div>}
            </article>;
          })}
          {availableBanners.length === 0 && <p className="text-xs text-slate-500">No Website Sections banner records were found. Check the banner list or your access connection.</p>}
        </section>}

        {tab === 'categories' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Category appearance</h2><p className="mt-1 text-sm text-slate-500">Presentation overrides point to existing category records; they never create categories.</p></div><button type="button" onClick={() => updateConfig((value) => ({ ...value, categoryAppearances: [...value.categoryAppearances, { categoryId: '', displayName: '', icon: { url: '', key: '' }, visible: true, order: value.categoryAppearances.length + 1 }] }))} className="inline-flex items-center gap-2 rounded-xl bg-[#8f6a42] px-4 py-2.5 text-sm font-semibold text-white"><HiOutlinePlus />Add category</button></div>
          {config.categoryAppearances?.map((entry, index) => <div key={`${entry.categoryId}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-4">
            <Field label="Existing category"><select className={inputClass} value={entry.categoryId?._id || entry.categoryId || ''} onChange={(e) => updateCategoryAppearance(index, 'categoryId', e.target.value)}><option value="">Choose category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></Field>
            <Field label="Display label"><input className={inputClass} value={entry.displayName || ''} onChange={(e) => updateCategoryAppearance(index, 'displayName', e.target.value)} placeholder="Optional override" /></Field>
            <Field label="Category icon">{editing._id && entry.categoryId ? (editing.status === 'draft' ? <ThemeImageField key={`${editing._id}:${entry.categoryId?._id || entry.categoryId}`} themeId={editing._id} module="category" recordId={entry.categoryId?._id || entry.categoryId} slots={[{ key: 'icon', label: 'Category icon', url: entry.icon?.url || categories.find((category) => category._id === (entry.categoryId?._id || entry.categoryId))?.icon?.url }]} /> : <span className="text-xs">View published images in Preview. Duplicate this theme to edit.</span>) : <span className="text-xs">Save the theme and choose a category first.</span>}</Field>
            <div className="flex items-end justify-between gap-3"><Field label="Order"><input type="number" min="0" className={inputClass} value={entry.order ?? index + 1} onChange={(e) => updateCategoryAppearance(index, 'order', Number(e.target.value))} /></Field><label className="flex items-center gap-2 pb-3 text-xs"><input type="checkbox" checked={entry.visible !== false} onChange={(e) => updateCategoryAppearance(index, 'visible', e.target.checked)} />Visible</label><button type="button" onClick={() => updateConfig((value) => ({ ...value, categoryAppearances: value.categoryAppearances.filter((_, i) => i !== index) }))} className="pb-3 text-xs font-semibold text-rose-600">Remove</button></div>
          </div>)}
        </section>}

        {tab === 'navigation' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Store navigation</h2><p className="mt-1 text-sm text-slate-500">Reorder, hide or relabel existing categories. Category identity and menu relationships are unchanged.</p></div><button type="button" onClick={() => updateConfig((value) => ({ ...value, navigation: [...value.navigation, { categoryId: '', displayName: '', visible: true, order: value.navigation.length + 1 }] }))} className="inline-flex items-center gap-2 rounded-xl bg-[#8f6a42] px-4 py-2.5 text-sm font-semibold text-white"><HiOutlinePlus />Add link</button></div>
          {config.navigation?.map((entry, index) => <div key={`${entry.categoryId}-${index}`} className="grid items-end gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.2fr_1fr_120px_auto_auto]">
            <Field label="Existing category"><select className={inputClass} value={entry.categoryId?._id || entry.categoryId || ''} onChange={(e) => updateConfig((value) => { const navigation = [...value.navigation]; navigation[index] = { ...navigation[index], categoryId: e.target.value }; return { ...value, navigation }; })}><option value="">Choose category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></Field>
            <Field label="Navigation label"><input className={inputClass} value={entry.displayName || ''} onChange={(e) => updateConfig((value) => { const navigation = [...value.navigation]; navigation[index] = { ...navigation[index], displayName: e.target.value }; return { ...value, navigation }; })} placeholder="Use category name" /></Field>
            <Field label="Order"><input className={inputClass} type="number" min="1" value={entry.order ?? index + 1} onChange={(e) => updateConfig((value) => { const navigation = [...value.navigation]; navigation[index] = { ...navigation[index], order: Number(e.target.value) }; return { ...value, navigation }; })} /></Field>
            <label className="flex items-center gap-2 pb-3 text-xs"><input type="checkbox" checked={entry.visible !== false} onChange={(e) => updateConfig((value) => { const navigation = [...value.navigation]; navigation[index] = { ...navigation[index], visible: e.target.checked }; return { ...value, navigation }; })} />Visible</label>
            <button type="button" onClick={() => updateConfig((value) => ({ ...value, navigation: value.navigation.filter((_, i) => i !== index) }))} className="pb-3 text-xs font-semibold text-rose-600">Remove</button>
          </div>)}
          {!config.navigation?.length && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No navigation overrides. The storefront’s existing category menu will be used.</div>}
        </section>}

        {tab === 'sections' && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><div><h2 className="font-bold text-slate-900">Supported homepage sections</h2><p className="mt-1 text-sm text-slate-500">Choose which existing storefront sections are shown and their order.</p></div>{config.sections?.map((section, index) => <div key={section.key} className="grid items-center gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1fr_auto_120px]"><label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={section.visible !== false} onChange={(e) => updateConfig((value) => { const sections = [...value.sections]; sections[index] = { ...sections[index], visible: e.target.checked }; return { ...value, sections }; })} />{SECTION_OPTIONS.find(([key]) => key === section.key)?.[1] || section.key}</label><span className="text-xs text-slate-500">{section.key}</span><Field label="Display order"><input className={inputClass} type="number" min="1" value={section.order ?? index + 1} onChange={(e) => updateConfig((value) => { const sections = [...value.sections]; sections[index] = { ...sections[index], order: Number(e.target.value) }; return { ...value, sections }; })} /></Field></div>)}</section>}

        {tab === 'preview' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-100 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><HiOutlineEye />Private preview · Drafts are not publicly accessible</div><div className="flex rounded-lg bg-white p-1">{['desktop', 'mobile'].map((mode) => <button key={mode} type="button" onClick={() => setPreviewMode(mode)} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${previewMode === mode ? 'bg-[#8f6a42] text-white' : 'text-slate-600'}`}>{mode}</button>)}</div></div><div className={`mx-auto overflow-hidden border border-slate-200 shadow-sm transition-all ${previewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'}`} style={{ background: config.colors.background, color: config.colors.text, borderRadius: `${config.borderRadius}px`, fontFamily: config.typography?.bodyFont }}><header className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: config.colors.secondary }}><span className="text-xl" style={{ fontFamily: config.typography?.headingFont }}>NEIRAH</span><span className="text-xs uppercase tracking-widest">Rings · Earrings · Pendants · Collections</span></header>{(selectedBannerForPreview || previewLegacyHero) && <div className="relative flex min-h-64 items-center bg-cover bg-center px-10 py-12" style={{ backgroundImage: previewHeroImage ? `linear-gradient(90deg, rgba(25,18,14,.55), transparent), url("${previewHeroImage}")` : `linear-gradient(120deg, ${config.colors.secondary}, ${config.colors.background})` }}><div className="max-w-md text-white"><h2 className="text-4xl" style={{ fontFamily: config.typography?.headingFont }}>{previewHeroTitle || editing.name || 'Theme preview'}</h2><p className="mt-2">{editing.description || 'A preview of the selected storefront style.'}</p><button className="mt-5 px-5 py-2 text-sm text-white" style={{ background: config.colors.primary, borderRadius: config.buttonStyle === 'pill' ? 999 : `${config.borderRadius}px` }}>SHOP COLLECTION</button></div></div>}<div className={`grid gap-4 p-6 ${previewMode === 'mobile' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>{(config.categoryAppearances || []).filter((entry) => entry.visible).map((entry, i) => <div key={entry.categoryId?._id || entry.categoryId || i} className="rounded-xl p-4 text-center" style={{ background: config.colors.surface }}><div className="mx-auto mb-2 h-16 w-16 rounded-full bg-cover bg-center" style={{ backgroundColor: config.colors.secondary, backgroundImage: entry.icon?.url ? `url("${entry.icon.url}")` : undefined }} /><span>{entry.displayName || categories.find((category) => category._id === (entry.categoryId?._id || entry.categoryId))?.name || 'Category'}</span></div>)}</div></div></section>}

        {tab === 'publish' && <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-2"><div className="space-y-4"><div><h2 className="font-bold text-slate-900">Publish or schedule</h2><p className="mt-1 text-sm text-slate-500">Schedule dates use the Neirah storefront timezone, Asia/Kolkata.</p></div><Field label="Start date and time"><input className={inputClass} type="datetime-local" value={publishStart} onChange={(e) => setPublishStart(e.target.value)} /></Field><Field label="End date (optional)"><input className={inputClass} type="datetime-local" value={publishEnd} onChange={(e) => setPublishEnd(e.target.value)} /></Field><Field label="Fallback theme on expiry"><select className={inputClass} value={fallbackThemeId} onChange={(e) => setFallbackThemeId(e.target.value)}><option value="">Use the previous published theme</option>{themes.filter((theme) => theme._id !== editing._id && theme.status !== 'archived' && theme.publishedSnapshot).map((theme) => <option key={theme._id} value={theme._id}>{theme.name} · {theme.status}</option>)}</select></Field><p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Save your changes before publishing. A future start time schedules this theme; an empty or past start time publishes it now.</p><button type="button" onClick={publishTheme} disabled={!editing._id} className="rounded-xl bg-[#8f6a42] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{publishStart && new Date(istDateToIso(publishStart)) > new Date() ? 'Schedule theme' : editorIsActive ? 'Update expiry' : 'Publish now'}</button></div><div className="rounded-xl bg-slate-50 p-5"><h3 className="font-semibold text-slate-900">Publishing safeguards</h3><ul className="mt-3 space-y-2 text-sm text-slate-600"><li>• Drafts are only visible to authorized admins.</li><li>• Publishing stores an immutable presentation snapshot.</li><li>• Scheduled themes activate automatically at their start time.</li><li>• Campaign expiry selects the fallback theme or restores defaults.</li></ul></div></section>}

        {tab === 'history' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Publishing history</h2><p className="mt-1 text-sm text-slate-500">Changes, scheduled releases, publish actions and rollbacks.</p></div>{history.length ? <div className="divide-y divide-slate-100">{history.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><div><span className="font-semibold capitalize text-slate-800">{item.action.replace('_', ' ')}</span><span className="ml-2 text-sm text-slate-500">{item.details}</span><div className="mt-1 text-xs text-slate-500">{item.actorId?.name || 'System'} · {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div></div><span className="text-xs text-slate-500">Revision {item.revision || '—'}</span></div>)}</div> : <div className="p-10 text-center text-sm text-slate-500">No changes recorded for this theme yet.</div>}</section>}
        </fieldset>

        <div className="flex justify-end"><button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"><HiOutlineX />Close editor</button></div>
      </div>
    );
  }

  const counts = ['active', 'scheduled', 'draft', 'archived'].reduce((result, status) => ({ ...result, [status]: themes.filter((theme) => theme.status === status).length }), {});
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-7">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b7448]">Storefront configuration</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Website themes</h1><p className="mt-2 text-sm text-slate-500">Prepare seasonal campaigns, preview the storefront and publish on your schedule.</p></div><button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-xl bg-[#8f6a42] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#765532]"><HiOutlinePlus />Create theme</button></header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['active', 'Live themes'], ['scheduled', 'Scheduled'], ['draft', 'Drafts'], ['archived', 'Archived']].map(([key, label]) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{counts[key]}</p></div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"><input className={`${inputClass} max-w-md`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search themes…" /><div className="flex flex-wrap gap-1">{['all', 'active', 'scheduled', 'draft', 'archived'].map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{value}</button>)}</div></div>
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading themes…</div> : visibleThemes.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{visibleThemes.map((theme) => {
        const hero = theme.publishedSnapshot?.config?.banners?.find((banner) => banner.placement === 'hero') || theme.config?.banners?.find((banner) => banner.placement === 'hero');
        return <article key={theme._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-40 bg-gradient-to-br from-[#eadcc8] to-[#8b6c3a]" style={{ backgroundImage: hero?.desktopImage?.url ? `linear-gradient(0deg,rgba(20,16,12,.2),transparent),url("${hero.desktopImage.url}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}><span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${statusClass[theme.status]}`}>{theme.status}</span></div>
          <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">{theme.name}</h2><p className="text-xs text-slate-500">{theme.code} · Updated {theme.meta?.updatedAt ? new Date(theme.meta.updatedAt).toLocaleDateString('en-IN') : '—'}</p></div>{theme.status === 'active' && <span className="text-xs font-semibold text-emerald-700">● Live</span>}</div><p className="min-h-10 text-sm text-slate-600">{theme.description || 'No campaign description.'}</p><div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3"><button onClick={() => openEditor(theme)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{theme.status === 'active' ? 'View live' : 'Edit'}</button><button onClick={() => duplicateTheme(theme)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><HiOutlineDuplicate />Duplicate</button>{theme.status !== 'archived' && theme.status !== 'active' && <button onClick={() => archiveTheme(theme)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Archive</button>}{theme.publishedSnapshot && theme.status !== 'active' && <button onClick={() => rollbackTheme(theme)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Restore version</button>}{theme.status === 'active' && <button onClick={() => openEditor(theme).then(() => setTab('publish'))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Manage expiry</button>}</div></div>
        </article>;
      })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center"><HiOutlinePhotograph className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-800">No themes found</h2><p className="mt-1 text-sm text-slate-500">Create a theme to start preparing your next storefront campaign.</p></div>}
    </div>
  );
}
