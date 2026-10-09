import React from 'react';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from 'react-icons/hi';
import Dropdown from './Dropdown';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showPageSize = true,
  itemLabel = 'customers',
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

  const itemText = itemLabel || (totalItems === 1 ? 'item' : 'items');

  return (
    <div
      className={`px-3 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-stone-200/80 bg-white select-none ${className}`}
    >
      {/* Left: Info text matching screenshot: "Showing 1–7 of 30 customers" */}
      <div className="text-[10px] text-stone-500 font-normal">
        Showing <span className="font-semibold text-stone-700">{startIndex}</span>–
        <span className="font-semibold text-stone-700">{endIndex}</span> of{' '}
        <span className="font-semibold text-stone-700">{totalItems}</span> {itemText}
      </div>

      {/* Right: Rows per page + Prev / Numbers / Next */}
      <div className="flex items-center gap-2.5">
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
            <span>Rows per page</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange?.(1);
                }}
                className="appearance-none bg-white border border-stone-200 rounded-md pl-2 pr-5 py-0.5 text-[10px] font-semibold text-stone-700 focus:outline-none focus:border-[#8b6f4e] cursor-pointer shadow-2xs"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-stone-400">
                <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons: < 1 2 3 > */}
        <div className="flex items-center gap-1">
          {/* Previous Page */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            title="Previous Page"
            className="w-6 h-6 rounded-md border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer"
          >
            <HiOutlineChevronLeft className="w-3 h-3" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-0.5">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-0.5 text-[10px] text-stone-400 font-medium"
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
                  className={`w-6 h-6 rounded-md text-[11px] font-semibold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-[#8b6f4e] text-white shadow-xs'
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
            className="w-6 h-6 rounded-md border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center cursor-pointer"
          >
            <HiOutlineChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
