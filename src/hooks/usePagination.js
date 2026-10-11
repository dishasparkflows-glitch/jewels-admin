import { useState, useMemo, useEffect } from "react";

/**
 * Custom hook for client-side and server-side pagination
 *
 * @param {Array} items - List of items
 * @param {number} initialPageSize - Default rows per page (default: 10)
 * @param {number|null} serverTotal - Optional total count from server pagination
 * @returns {object} Pagination states, handlers and items for current page
 */
export function usePagination(items = [], initialPageSize = 10, serverTotal = null) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize || 10);

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
