import { useState, useEffect, useCallback } from 'react';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Get the current admin-selected page size from localStorage, defaulting to 10.
 * Enforces standard PAGE_SIZE_OPTIONS: [10, 25, 50, 100].
 */
export function getAdminPageSize(fallback = DEFAULT_PAGE_SIZE) {
  try {
    const saved = localStorage.getItem('admin_page_size');
    if (saved) {
      const num = Number(saved);
      if (PAGE_SIZE_OPTIONS.includes(num)) return num;
    }
  } catch {
    // Ignore storage errors
  }
  return PAGE_SIZE_OPTIONS.includes(Number(fallback)) ? Number(fallback) : DEFAULT_PAGE_SIZE;
}

/**
 * Persist the admin-selected page size to localStorage and notify all listeners.
 */
export function setAdminPageSize(newSize) {
  try {
    const num = Number(newSize);
    if (PAGE_SIZE_OPTIONS.includes(num)) {
      localStorage.setItem('admin_page_size', String(num));
      window.dispatchEvent(new CustomEvent('admin_page_size_change', { detail: num }));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * React hook for components to read and update the global admin page size.
 * Automatically synchronizes across components and browser tabs.
 */
export function useAdminPageSize(initialFallback = DEFAULT_PAGE_SIZE) {
  const safeFallback = PAGE_SIZE_OPTIONS.includes(Number(initialFallback))
    ? Number(initialFallback)
    : DEFAULT_PAGE_SIZE;
  const [pageSize, setPageSizeState] = useState(() => getAdminPageSize(safeFallback));

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'admin_page_size' && e.newValue) {
        const num = Number(e.newValue);
        if (PAGE_SIZE_OPTIONS.includes(num)) setPageSizeState(num);
      }
    };

    const handleCustomChange = (e) => {
      if (e.detail && PAGE_SIZE_OPTIONS.includes(Number(e.detail))) {
        setPageSizeState(Number(e.detail));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('admin_page_size_change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('admin_page_size_change', handleCustomChange);
    };
  }, []);

  const changePageSize = useCallback((newSize) => {
    const num = Number(newSize);
    if (PAGE_SIZE_OPTIONS.includes(num)) {
      setAdminPageSize(num);
      setPageSizeState(num);
    }
  }, []);

  return [pageSize, changePageSize];
}

/**
 * Calculate serial number (SR NO) based on 1-based currentPage, pageSize, and 0-based row index.
 */
export function getSrNo(currentPage = 1, pageSize = 10, index = 0) {
  return (Number(currentPage) - 1) * Number(pageSize) + Number(index) + 1;
}

