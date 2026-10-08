import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook for client-side pagination with search/filter auto-reset
 *
 * @param {Array} items - Full list of items (filtered or unfiltered)
 * @param {number} initialPageSize - Default rows per page (default: 10)
 * @returns {object} Pagination states, handlers and slice of items for current page
 */
export function usePagination(items = [], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // If current page is beyond totalPages (e.g. after search filter narrows down results), adjust
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems,
  };
}

export default usePagination;
