import React from 'react';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from 'react-icons/hi';
import Dropdown from './Dropdown';
import { setAdminPageSize } from '../../utils/adminPagination';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
  itemLabel = '',
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safeCurrentPage * pageSize);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      totalPages,
    ];
  };

  const handlePageClick = (page) => {
    if (page === '...' || page === safeCurrentPage) return;
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  };

  // Generate safe page size options ensuring the active pageSize is always present
  const effectivePageSizeOptions = React.useMemo(() => {
    const numericPageSize = Number(pageSize);
    const set = new Set((pageSizeOptions || [10, 25, 50, 100]).map(Number));
    if (numericPageSize && !set.has(numericPageSize)) {
      set.add(numericPageSize);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [pageSize, pageSizeOptions]);

  const itemText = itemLabel || (totalItems === 1 ? 'item' : 'items');

  return (
    <div
      className={`px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 border-t border-stone-200/80 bg-white select-none ${className}`}
    >
      {/* Left: Info text e.g. "Showing 1–7 of 30 reviews" */}
      <div className="text-xs text-stone-500 font-normal text-center sm:text-left">
        Showing <span className="font-semibold text-stone-800">{startIndex}</span>–
        <span className="font-semibold text-stone-800">{endIndex}</span> of{' '}
        <span className="font-semibold text-stone-800">{totalItems}</span> {itemText}
      </div>

      {/* Right: Rows per page + Prev / Numbers / Next */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-4 w-full sm:w-auto">
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-stone-600 font-medium shrink-0">
            <span>Rows:</span>
            <Dropdown
              value={Number(pageSize)}
              onChange={(val) => {
                const num = Number(val);
                setAdminPageSize(num);
                onPageSizeChange?.(num);
                onPageChange?.(1);
              }}
              options={effectivePageSizeOptions.map((opt) => ({ value: opt, label: String(opt) }))}
              placeholder={String(pageSize)}
              size="sm"
              openUpward
              className="w-16 sm:w-18"
              buttonClassName="h-7 px-2 text-xs font-semibold rounded-md bg-white border-stone-200 shadow-2xs min-w-[50px]"
            />
          </div>
        )}

        {/* Navigation Buttons: < 1 2 3 > */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Previous Page */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            title="Previous Page"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <HiOutlineChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-2" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-xs text-stone-400 font-medium"
                  >
                    •••
                  </span>
                );
              }

              const isActive = pageNum === safeCurrentPage;
              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => handlePageClick(pageNum)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs sm:text-[13px] font-semibold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-[#8b6f4e] text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages || totalItems === 0}
            title="Next Page"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <HiOutlineChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
