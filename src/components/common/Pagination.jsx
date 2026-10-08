import React from 'react';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from 'react-icons/hi';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showPageSize = true,
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

  return (
    <div
      className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200/80 bg-white/50 backdrop-blur-xs select-none ${className}`}
    >
      {/* Left: Info text and page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
        <span>
          Showing <span className="font-semibold text-stone-800">{startIndex}</span> to{' '}
          <span className="font-semibold text-stone-800">{endIndex}</span> of{' '}
          <span className="font-semibold text-stone-800">{totalItems}</span> entries
        </span>

        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-stone-200">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange?.(1);
              }}
              className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#8b6f4e] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          type="button"
          onClick={() => handlePageClick(1)}
          disabled={safeCurrentPage === 1}
          title="First Page"
          className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <HiOutlineChevronDoubleLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageClick(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <HiOutlineChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-stone-400 font-medium"
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
                className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#8b6f4e] text-white border border-[#8b6f4e] shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 hover:border-stone-300'
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
          className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <HiOutlineChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => handlePageClick(totalPages)}
          disabled={safeCurrentPage >= totalPages || totalItems === 0}
          title="Last Page"
          className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <HiOutlineChevronDoubleRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
