import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import useSelection from './useSelection';
import usePagination from './usePagination';
import { useAdminPageSize } from '../utils/adminPagination';
import { extractListItems, extractPaginationTotal } from '../utils/apiHelpers';
import { getCachedData, setCachedData, clearRequestCache, isAbortError } from '../utils/requestCache';

/**
 * Standardized Admin List State Hook
 *
 * Centralizes pagination, page-size persistence, multi-row selection,
 * search state, AbortController race-condition cleanup, and lightweight SWR caching.
 *
 * @param {Object} options
 * @param {Function} options.fetcher - async ({ page, limit, signal }) => axiosResponse | { items, total }
 * @param {string} [options.cacheKey] - Optional cache prefix for instant tab revisits
 * @param {number} [options.cacheTtlMs=60000] - Cache TTL in milliseconds
 * @param {Array<string>} [options.extraKeys=[]] - Extra envelope keys for extractListItems
 * @param {string} [options.errorMessage='Failed to load records'] - Error toast fallback
 * @param {Function} [options.filterItems] - Optional predicate/transformer (items, search) => filteredArray
 * @param {Function} [options.getId] - Extracts item id for selection (defaults to _id || id)
 * @param {Function} [options.transformItems] - Optional post-fetch array transform
 */
export default function useAdminList({
  fetcher,
  cacheKey = '',
  cacheTtlMs = 60_000,
  extraKeys = [],
  errorMessage = 'Failed to load records',
  filterItems,
  getId,
  transformItems,
} = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const resolvedCacheKey = cacheKey ? `${cacheKey}:p=${currentPage}:l=${pageSize}` : '';

  const initialCache = resolvedCacheKey ? getCachedData(resolvedCacheKey, cacheTtlMs) : null;
  const [items, setItems] = useState(() => initialCache?.items || []);
  const [serverTotal, setServerTotal] = useState(() => initialCache?.total ?? null);
  const [loading, setLoading] = useState(() => !initialCache);
  const [search, setSearchState] = useState('');

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const transformRef = useRef(transformItems);
  transformRef.current = transformItems;
  const extraKeysRef = useRef(extraKeys);
  extraKeysRef.current = extraKeys;
  const hasDataRef = useRef(Boolean(initialCache));

  const abortControllerRef = useRef(null);

  const selection = useSelection(getId);

  const fetchList = useCallback(
    async (page = currentPage, limit = pageSize, { silent = false } = {}) => {
      if (!fetcherRef.current) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const key = cacheKey ? `${cacheKey}:p=${page}:l=${limit}` : '';
      const cached = key ? getCachedData(key, cacheTtlMs) : null;

      if (cached && !silent) {
        setItems(cached.items);
        setServerTotal(cached.total ?? null);
        hasDataRef.current = true;
        setLoading(false);
      } else if (!hasDataRef.current && !silent) {
        setLoading(true);
      }

      try {
        const res = await fetcherRef.current({ page, limit, signal: controller.signal });
        if (controller.signal.aborted) return;

        let list = Array.isArray(res?.items)
          ? res.items
          : extractListItems(res, ...extraKeysRef.current);

        if (transformRef.current) {
          list = transformRef.current(list, res);
        }

        const total =
          res?.total !== undefined
            ? res.total
            : extractPaginationTotal(res, null);

        setItems(list);
        if (total !== null) {
          setServerTotal(total);
        }
        hasDataRef.current = true;

        if (key) {
          setCachedData(key, { items: list, total });
        }
      } catch (err) {
        if (isAbortError(err)) return;
        console.warn(errorMessage, err);
        if (!hasDataRef.current) {
          setItems([]);
          toast.error(errorMessage);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [currentPage, pageSize, cacheKey, cacheTtlMs, errorMessage]
  );

  useEffect(() => {
    fetchList(currentPage, pageSize);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchList, currentPage, pageSize]);

  const setSearch = useCallback((value) => {
    setSearchState(value);
    setCurrentPage(1);
  }, []);

  const invalidateAndRefetch = useCallback(
    (page = currentPage, limit = pageSize) => {
      if (cacheKey) clearRequestCache(cacheKey);
      return fetchList(page, limit, { silent: true });
    },
    [cacheKey, fetchList, currentPage, pageSize]
  );

  const displayedItems = filterItems ? filterItems(items, search) : items;
  const pagination = usePagination(displayedItems, pageSize, serverTotal);

  return {
    items,
    setItems,
    displayedItems,
    loading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    serverTotal,
    setServerTotal,
    fetchList,
    invalidateAndRefetch,
    ...pagination,
    ...selection,
  };
}
