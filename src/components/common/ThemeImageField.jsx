/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Dropdown from './Dropdown';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

// Both the module forms and theme editor use this same record/slot mapping.
export default function ThemeImageField({ module, recordId, slots, children, themeId: fixedThemeId, onSaved }) {
  const [themes, setThemes] = useState([]);
  const [themeId, setThemeId] = useState(fixedThemeId || '');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (fixedThemeId) { setThemeId(fixedThemeId); return; }
    let cancelled = false;
    api.get('/website/themes', { params: { status: 'draft', limit: 100 } }).then(({ data }) => {
      if (!cancelled) setThemes(Array.isArray(data.data) ? data.data : data.data?.items || []);
    }).catch(() => { if (!cancelled) setError('Could not load themes. Reopen this form to retry.'); });
    return () => { cancelled = true; };
  }, [fixedThemeId]);
  useEffect(() => {
    let cancelled = false;
    setRows([]);
    if (!themeId) return;
    setLoading(true);
    api.get(`/website/themes/${themeId}/preview`).then(({ data }) => {
      if (!cancelled) { setRows(data.data?.config?.mediaOverrides || []); setError(''); }
    }).catch(() => { if (!cancelled) setError('Could not load theme images. Select the theme again to retry.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [themeId, recordId]);
  const save = async (slot, file) => {
    if (file && !file.type.startsWith('image/')) { toast.error('Choose an image file'); return; }
    setBusy(true);
    try {
      const upload = file ? await uploadWithPresignedUrl(file, 'website-themes') : null;
      const { data } = await api.put(`/website/themes/${themeId}/media`, { module, recordId, slot, key: upload?.key || null });
      setRows(data.data?.mediaOverrides || []);
      toast.success(file ? 'Image saved to theme draft' : 'Theme image removed; default will be used');
      onSaved?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save theme image'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-3">
    {!fixedThemeId && <Dropdown label="Image theme" value={themeId} onChange={(value) => { if (!busy) setThemeId(value); }} options={[{ value: '', label: 'Default' }, ...themes.map((theme) => ({ value: theme._id, label: `${theme.name} · Draft` }))]} />}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {!themeId ? children : <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs text-stone-600">Theme images save to the draft immediately. Publish the theme to show them on the website. Other record settings remain shared.</p>
      {!recordId ? <p className="text-xs text-amber-700">Save this record with its default image first, then reopen it to add theme images.</p> : loading ? <p className="text-xs">Loading theme images…</p> : slots.map((slot) => {
        const mapping = rows.find((row) => row.module === module && String(row.recordId) === String(recordId) && row.slot === slot.key);
        const url = mapping?.asset?.url || slot.url;
        return <div key={slot.key} className="space-y-2">
          <p className="text-xs font-semibold">{slot.label}{!mapping && ' · Using default'}</p>
          {url && <img src={url} alt={slot.label} className="h-28 w-full rounded-lg object-contain bg-white" />}
          <div className="flex items-center gap-3">
            <label className={`rounded-lg bg-[#8b6f4e] px-3 py-2 text-xs text-white ${busy ? 'opacity-50' : 'cursor-pointer'}`}>
              {busy ? 'Saving…' : 'Upload theme image'}
              <input type="file" accept="image/*" className="hidden" disabled={busy || !!error} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) save(slot.key, file); }} />
            </label>
            {mapping && <button type="button" disabled={busy} className="text-xs text-red-600" onClick={() => save(slot.key, null)}>Use default</button>}
          </div>
        </div>;
      })}
    </div>}
  </div>;
}
