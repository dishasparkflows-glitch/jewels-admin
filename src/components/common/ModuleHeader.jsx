import React from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

export default function ModuleHeader({
  breadcrumbs = ['Home', 'Customers'],
  title = 'Customers',
  subtitle = 'Manage customer profiles and purchase activity.',
  onAdd,
  addLabel,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 font-serif leading-tight">
          {title}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        {/* Add / Create Button - Properly sized luxury action button */}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] text-white rounded-lg text-xs sm:text-[13px] font-semibold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
            <span>{addLabel || `Add ${title.replace(/s$/, '')}`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
