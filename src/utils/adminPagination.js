import { useState, useEffect, useCallback } from 'react';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Get the current admin-selected page size from localStorage, defaulting to 10.
 */
export function getAdminPageSize(fallback = DEFAULT_PAGE_SIZE) {
  try {
    const saved = localStorage.getItem('admin_page_size');
    if (saved) {
      const num = Number(saved);
      if (num > 0) return num;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return fallback;
}

/**
 * Persist the admin-selected page size to localStorage and notify all listeners.
 */
export function setAdminPageSize(newSize) {
  try {
    const num = Number(newSize);
    if (num > 0) {
      localStorage.setItem('admin_page_size', String(num));
      window.dispatchEvent(new CustomEvent('admin_page_size_change', { detail: num }));
    }
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * React hook for components to read and update the global admin page size.
 * Automatically synchronizes across components and browser tabs.
 */
export function useAdminPageSize(initialFallback = DEFAULT_PAGE_SIZE) {
  const [pageSize, setPageSizeState] = useState(() => getAdminPageSize(initialFallback));

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'admin_page_size' && e.newValue) {
        const num = Number(e.newValue);
        if (num > 0) setPageSizeState(num);
      }
    };

    const handleCustomChange = (e) => {
      if (e.detail && Number(e.detail) > 0) {
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
    if (num > 0) {
      setAdminPageSize(num);
      setPageSizeState(num);
    }
  }, []);

  return [pageSize, changePageSize];
}
