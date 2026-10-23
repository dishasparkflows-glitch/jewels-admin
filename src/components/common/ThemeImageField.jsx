/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Dropdown from './Dropdown';
import { formatBytes, uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

// Both the module forms and theme editor use this same record/slot mapping.
export default function ThemeImageField({ module, recordId, slots, children, themeId: fixedThemeId, selectedThemeId, onThemeChange, onPendingChange, onSaved }) {
  const [themes, setThemes] = useState([]);
  const [localThemeId, setLocalThemeId] = useState(fixedThemeId || '');
  const [rows, setRows] = useState([]);
  const [pendingImages, setPendingImages] = useState({});
  const [uploadStats, setUploadStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (fixedThemeId) { setLocalThemeId(fixedThemeId); return; }
    let cancelled = false;
    api.get('/website/themes', { params: { status: 'all', limit: 100 } }).then(({ data }) => {
      const rows = Array.isArray(data.data) ? data.data : data.data?.items || [];
      if (!cancelled) setThemes(rows.filter((theme) => theme.status !== 'archived'));
    }).catch(() => { if (!cancelled) setError('Could not load themes. Reopen this form to retry.'); });
    return () => { cancelled = true; };
  }, [fixedThemeId]);
  const themeId = fixedThemeId || selectedThemeId || localThemeId;
  const selectedTheme = themes.find((theme) => String(theme._id) === String(themeId));
  const canEditThemeImages = !selectedTheme || selectedTheme.status === 'draft';
  useEffect(() => {
    let cancelled = false;
    setRows([]);
    if (!themeId) return;
    setLoading(true);
    api.get(`/website/themes/${themeId}/preview`).then(({ data }) => {
      if (!cancelled) { setRows(data.data?.config?.mediaOverrides || []); setError(''); }
    }).catch(() => { if (!cancelled) setError('Could not load existing theme images. You can still upload a new one.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [themeId, recordId]);
  const save = async (slot, file) => {
    if (file && !file.type.startsWith('image/')) { toast.error('Choose an image file'); return; }
    setBusy(true);
    try {
      const upload = file ? await uploadWithPresignedUrl(file, 'website-themes') : null;
      if (!recordId) {
        if (!upload) return;
        const staged = { key: upload.key, url: upload.fileUrl };
        setPendingImages((current) => ({ ...current, [slot]: staged }));
        setUploadStats((current) => ({ ...current, [slot]: upload }));
        onPendingChange?.(slot, staged);
        toast.success(`Theme image ready · ${formatBytes(upload.originalSize)} → ${formatBytes(upload.compressedSize)}`);
        return;
      }
      const { data } = await api.put(`/website/themes/${themeId}/media`, { module, recordId, slot, key: upload?.key || null });
      setRows(data.data?.mediaOverrides || []);
      if (upload) setUploadStats((current) => ({ ...current, [slot]: upload }));
      toast.success(upload ? `Theme image saved · ${formatBytes(upload.originalSize)} → ${formatBytes(upload.compressedSize)}` : 'Theme image removed; default will be used');
      onSaved?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save theme image'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-3">
    {!fixedThemeId && <Dropdown label="Theme" value={themeId} onChange={(value) => { if (!busy) { setLocalThemeId(value); onThemeChange?.(value); setError(''); } }} options={[{ value: '', label: 'Default theme' }, ...themes.map((theme) => ({ value: theme._id, label: `${theme.name} · ${theme.status}` }))]} />}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {!themeId ? children : <>
      {children}
      <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs text-stone-600">Choose a theme image for this record. Theme images appear on the website when the theme is published.</p>
      {!canEditThemeImages && <p className="text-xs text-amber-700">Duplicate this published theme to add or change its images.</p>}
      {!slots?.length ? <p className="text-xs text-amber-700">Add the default image first to enable a theme image for this section.</p> : loading ? <p className="text-xs">Loading theme images…</p> : slots.map((slot) => {
        const mapping = rows.find((row) => row.module === module && String(row.recordId) === String(recordId) && row.slot === slot.key);
        const url = mapping?.asset?.url || pendingImages[slot.key]?.url || slot.url;
        return <div key={slot.key} className="space-y-2">
          <p className="text-xs font-semibold">{slot.label}{!mapping && !pendingImages[slot.key] && ' · Using default'}</p>
          {url && <img src={url} alt={slot.label} className="h-28 w-full rounded-lg object-contain bg-white" />}
          <div className="flex items-center gap-3">
            <label className={`rounded-lg bg-[#8b6f4e] px-3 py-2 text-xs text-white ${busy || !canEditThemeImages ? 'opacity-50' : 'cursor-pointer'}`}>
              {busy ? 'Uploading…' : url ? 'Change theme image' : 'Upload theme image'}
              <input type="file" accept="image/*" className="hidden" disabled={busy || !canEditThemeImages} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) save(slot.key, file); }} />
            </label>
            {mapping && <button type="button" disabled={busy} className="text-xs text-red-600" onClick={() => save(slot.key, null)}>Use default</button>}
          </div>
          {uploadStats[slot.key] && <p className="text-[11px] text-emerald-700">Uploaded size: {formatBytes(uploadStats[slot.key].originalSize)} → {formatBytes(uploadStats[slot.key].compressedSize)}{uploadStats[slot.key].wasCompressed ? ' after compression' : ' (compression not applied)'}</p>}
        </div>;
      })}
      </div>
    </>}
  </div>;
}
