import React from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

export default function ModuleHeader({
  breadcrumbs = ['Home', 'Customers'],
  title = 'Customers',
  subtitle = 'Manage customer profiles and purchase activity.',
  onAdd,
  addLabel,
  extraActions,
}) {
  const defaultAddLabel = title?.endsWith('ies')
    ? `Add ${title.slice(0, -3)}y`
    : `Add ${title?.replace(/s$/, '') || ''}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-0.5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-[13px] text-stone-500 font-normal mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
        {extraActions}

        {/* Add / Create Button - Generously sized luxury action button */}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="flex items-center gap-2 h-[42px] px-4 sm:px-5 hover:brightness-95 active:scale-[0.98] text-white rounded-xl text-xs sm:text-[13.5px] font-bold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            <span>{(addLabel || defaultAddLabel)?.replace(/^\+\s*/, '')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
