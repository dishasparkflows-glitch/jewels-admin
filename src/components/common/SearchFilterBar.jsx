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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
      {/* Search Input Box */}
      <div className="relative flex-1 max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={activeSearch}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={activePlaceholder}
          className="w-full pl-8 pr-8 py-1 text-xs rounded-md bg-white border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
        />
        {activeSearch && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
            title="Clear search"
          >
            <HiOutlineX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Controls: Filters button & optional extras (WITHOUT active/deactive filter) */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {extraActions}

        <button
          type="button"
          onClick={onFilterClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer shadow-2xs ${
            filterActive
              ? 'bg-[#8b6f4e] text-white border-[#8b6f4e]'
              : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
          }`}
        >
          <HiOutlineAdjustments className="w-3.5 h-3.5 stroke-2" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}
