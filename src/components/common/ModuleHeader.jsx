import { HiOutlinePlus } from 'react-icons/hi';

export default function ModuleHeader({
  title = 'Customers',
  subtitle = 'Manage customer profiles and purchase activity.',
  onAdd,
  addLabel,
  extraActions,
}) {
  const defaultAddLabel = title?.endsWith('ies')
    ? `Add ${title.slice(0, -3)}y`
    : `Add ${title?.replace(/s$/, '') || ''}`;

  const stackOnMobile = Boolean(extraActions && onAdd);

  return (
    <div
      className={`flex gap-3 sm:gap-4 pb-0.5 ${
        stackOnMobile
          ? 'flex-col sm:flex-row sm:items-center sm:justify-between'
          : 'items-center justify-between'
      }`}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-stone-900 leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-[13px] text-stone-500 font-normal mt-0.5 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Actions */}
      <div
        className={`flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 ${
          stackOnMobile ? 'w-full sm:w-auto justify-between sm:justify-end' : ''
        }`}
      >
        {extraActions}

        {/* Add / Create Button - Generously sized luxury action button */}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-[42px] px-3 sm:px-5 hover:brightness-95 active:scale-[0.98] text-white rounded-xl text-xs sm:text-[13.5px] font-bold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer whitespace-nowrap"
          >
            <HiOutlinePlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] shrink-0" />
            <span>{(addLabel || defaultAddLabel)?.replace(/^\+\s*/, '')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
