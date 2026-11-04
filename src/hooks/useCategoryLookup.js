import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

/**
 * Reusable hook that fetches the category lookup list from the backend.
 * Returns { categories, categoryOptions, regularCategories, collectionCategories, categoryOnlyOptions, loading }.
 *
 * - `categories`           — raw array of { _id, name, type, slug, icon, status }
 * - `categoryOptions`      — formatted for <Dropdown> grouped by type (Categories & Collections)
 * - `regularCategories`    — array of categories where type !== 'collection'
 * - `collectionCategories` — array of categories where type === 'collection'
 * - `categoryOnlyOptions`  — formatted for <Dropdown> containing only non-collection categories
 * - `loading`              — true while the lookup request is in-flight
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

  // Regular categories (excluding collections)
  const regularCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter((c) => c.type !== 'collection') : []),
    [categories]
  );

  // Collection categories
  const collectionCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter((c) => c.type === 'collection') : []),
    [categories]
  );

  // Formatted options for only regular categories
  const categoryOnlyOptions = useMemo(
    () =>
      regularCategories.map((c) => ({
        value: c._id,
        label: c.name,
      })),
    [regularCategories]
  );

  // Formatted options for <Dropdown> components (type-wise grouped with headers and badges)
  const categoryOptions = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    const regular = list.filter((c) => c.type !== 'collection');
    const collections = list.filter((c) => c.type === 'collection');

    const options = [];

    if (regular.length > 0) {
      options.push({
        value: '__header_categories__',
        label: 'Categories',
        isHeader: true,
        disabled: true,
      });
      regular.forEach((c) => {
        options.push({
          value: c._id,
          label: c.name,
          badge: 'Category',
          type: 'category',
          raw: c,
        });
      });
    }

    if (collections.length > 0) {
      options.push({
        value: '__header_collections__',
        label: 'Collections',
        isHeader: true,
        disabled: true,
      });
      collections.forEach((c) => {
        options.push({
          value: c._id,
          label: c.name,
          badge: 'Collection',
          type: 'collection',
          raw: c,
        });
      });
    }

    if (options.length === 0 && list.length > 0) {
      list.forEach((c) => {
        options.push({
          value: c._id,
          label: c.name,
          badge: c.type === 'collection' ? 'Collection' : 'Category',
          type: c.type || 'category',
          raw: c,
        });
      });
    }

    return options;
  }, [categories]);

  return {
    categories,
    categoryOptions,
    regularCategories,
    collectionCategories,
    categoryOnlyOptions,
    loading,
  };
}
