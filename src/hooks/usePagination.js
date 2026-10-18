import { useState, useMemo, useEffect, useCallback } from "react";
import { getAdminPageSize, setAdminPageSize, DEFAULT_PAGE_SIZE } from "../utils/adminPagination";

/**
 * Custom hook for client-side and server-side pagination
 *
 * @param {Array} items - List of items
 * @param {number|null} initialPageSize - Default rows per page (defaults to admin preference, fallback 10)
 * @param {number|null} serverTotal - Optional total count from server pagination
 * @returns {object} Pagination states, handlers and items for current page
 */
export function usePagination(items = [], initialPageSize = null, serverTotal = null) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    if (initialPageSize && initialPageSize !== DEFAULT_PAGE_SIZE) {
      return initialPageSize;
    }
    return getAdminPageSize(DEFAULT_PAGE_SIZE);
  });

  // Sync with global admin page size changes
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

  const setPageSize = useCallback((newSize) => {
    const num = Number(newSize);
    if (num > 0) {
      setAdminPageSize(num);
      setPageSizeState(num);
    }
  }, []);

  const isServerSide = serverTotal != null && serverTotal !== undefined;
  const totalItems = isServerSide ? serverTotal : safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // If current page is beyond totalPages, adjust
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    if (isServerSide) return safeItems;
    const start = (currentPage - 1) * pageSize;
    return safeItems.slice(start, start + pageSize);
  }, [safeItems, currentPage, pageSize, isServerSide]);

  return {
    currentPage,
    setCurrentPage,
    goToPage: setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems,
    paginatedSections: paginatedItems,
    paginatedData: paginatedItems,
    currentData: paginatedItems,
    data: paginatedItems,
  };
}

export default usePagination;
