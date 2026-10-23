/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Dropdown from './Dropdown';
import ThemeImageField from './ThemeImageField';

const endpoints = { banner: 'banners', category: 'categories', featured: 'featured' };
export default function ThemeMediaManager({ themeId, readOnly = false }) {
  const [module, setModule] = useState('category');
  const [records, setRecords] = useState([]);
  const [recordId, setRecordId] = useState('');
  const [rows, setRows] = useState([]);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setRecords([]); setRecordId(''); setError(''); setLoading(true);
    (async () => {
      const all = [];
      let page = 1;
      let more;
      do {
        const { data } = await api.get(`/${endpoints[module]}`, { params: { page, limit: 100 } });
        all.push(...(Array.isArray(data.data) ? data.data : data.data?.items || []));
        more = data.pagination?.hasNextPage;
        page += 1;
      } while (more && !cancelled);
      if (!cancelled) setRecords(all);
    })().catch(() => { if (!cancelled) setError('Could not load records. Select the module again to retry.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [module]);
  useEffect(() => {
    let cancelled = false;
    if (themeId) api.get(`/website/themes/${themeId}/preview`).then(({ data }) => {
      if (!cancelled) setRows(data.data?.config?.mediaOverrides || []);
    }).catch(() => { if (!cancelled) setError('Could not load theme image preview.'); });
    return () => { cancelled = true; };
  }, [themeId, revision]);
  const record = records.find((item) => item._id === recordId);
  const label = (item) => `${item.name || item.content?.title || item.display?.type || 'Record'} · ${item.display?.platform || ''} ${item._id.slice(-6)}`;
  const slots = !record ? [] : module === 'category'
    ? [{ key: 'banner', label: 'Category banner', url: record.banner?.url }, { key: 'icon', label: 'Category icon', url: record.icon?.url }, ...(record.promoBanners || []).map((item) => ({ key: `promo:${item._id}`, label: item.title || 'Promo banner', url: item.image?.url }))]
    : module === 'banner' && record.display?.type === 'collectionbanner'
      ? (record.collectionImages || []).map((item, index) => ({ key: `collection:${item._id}`, label: `Collection tile ${index + 1}`, url: item.url }))
      : [{ key: 'image', label: 'Image', url: record.image?.url }];
  if (!themeId) return <p className="p-5 text-sm">Save this theme as a draft first to assign images.</p>;
  return <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
    <h2 className="font-bold">{readOnly ? 'Theme image preview' : 'Theme images'}</h2>
    <p className="text-sm text-stone-500">Each image belongs to one record and image slot. Slots without a theme image use their default.</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {!readOnly && <>
      <div className="grid gap-3 md:grid-cols-2">
        <Dropdown label="Module" value={module} onChange={setModule} options={[{ value: 'category', label: 'Categories' }, { value: 'banner', label: 'Banners' }, { value: 'featured', label: 'Celebrate & Gifts' }]} />
        <Dropdown label="Record" value={recordId} onChange={setRecordId} placeholder={loading ? 'Loading records…' : 'Choose a record'} options={records.map((item) => ({ value: item._id, label: label(item) }))} />
      </div>
      {record && <ThemeImageField key={`${themeId}:${module}:${recordId}`} module={module} recordId={recordId} themeId={themeId} slots={slots} onSaved={() => setRevision((value) => value + 1)} />}
    </>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => <div key={`${row.module}:${row.recordId}:${row.slot}`} className="rounded-xl border p-3 space-y-2">
        {row.asset?.url ? <img src={row.asset.url} alt={`${row.module} ${row.slot}`} className="h-36 w-full object-contain" /> : <p>Image unavailable</p>}
        <p className="text-xs font-semibold">{row.recordLabel || row.module} · {row.slot.startsWith('collection:') ? 'Collection tile' : row.slot.startsWith('promo:') ? 'Promo banner' : row.slot}</p>
        <p className="text-xs text-stone-500 break-all">Record: {row.recordId}</p>
      </div>)}
    </div>
    {!rows.length && <p className="text-sm text-stone-500">No theme images assigned yet. Default images will be used.</p>}
  </section>;
}
