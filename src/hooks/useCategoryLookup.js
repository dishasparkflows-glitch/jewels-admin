import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

/**
 * Reusable hook that fetches the category lookup list from the backend.
 * Returns { categories, categoryOptions, loading }.
 *
 * - `categories`      — raw array of { _id, name, type, slug, icon, status }
 * - `categoryOptions` — formatted for <Dropdown>: [{ value, label, sublabel }]
 * - `loading`         — true while the lookup request is in-flight
 *
 * @param {{ type?: string }} opts — optional filter (e.g. { type: 'category' })
 */
export default function useCategoryLookup(opts = {}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(opts.enabled !== false);

  useEffect(() => {
    if (opts.enabled === false) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLookup = async () => {
      try {
        setLoading(true);
        const params = {};
        if (opts.type) params.type = opts.type;

        const res = await api.get('/categories/lookup', { params });
        const data = res.data?.data || [];
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLookup();

    return () => {
      cancelled = true;
    };
    // Re-fetch when the type filter or enabled changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.type, opts.enabled]);

  // Formatted options for <Dropdown> components
  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c._id,
        label: c.name,
        sublabel: c.type === 'collection' ? 'Collection' : 'Category',
      })),
    [categories]
  );

  return { categories, categoryOptions, loading };
}
