import React from 'react';
import { HiOutlineSearch, HiOutlineAdjustments, HiOutlineX } from 'react-icons/hi';

export default function SearchFilterBar({
  search = '',
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  searchPlaceholder,
  onFilterClick,
  filterActive = false,
  extraActions,
}) {
  const activeSearch = searchValue !== undefined ? searchValue : search;
  const activePlaceholder = searchPlaceholder || placeholder;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      {/* Search Input Box */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={activeSearch}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={activePlaceholder}
          className="w-full h-[42px] pl-10 pr-9 text-xs sm:text-[13px] rounded-xl bg-white border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs font-medium"
        />
        {activeSearch && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
            title="Clear search"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right Controls: Filters button & optional extras */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
        {extraActions}

        {onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className={`flex items-center gap-2 h-[42px] px-3.5 sm:px-4 rounded-xl text-xs sm:text-[13px] font-semibold transition-all border cursor-pointer shadow-2xs ${
              filterActive
                ? 'bg-[#8b6f4e] text-white border-[#8b6f4e] shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <HiOutlineAdjustments className="w-4 h-4 stroke-[2]" />
            <span>Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
