/**
 * Shared responsive mobile grid wrapper for admin list views.
 * Renders a loading spinner, empty state, optional "Select all" bar,
 * and a 1/2-column card grid on screens smaller than `md`.
 */
export default function MobileGridList({
  loading = false,
  loadingText = 'Loading records...',
  isEmpty = false,
  emptyText = 'No records found.',
  items = [],
  renderCard,
  showSelectAll = false,
  allSelected = false,
  onSelectAll,
  className = '',
}) {
  return (
    <div className={`md:hidden ${className}`}>
      {loading ? (
        <div className="py-10 text-center text-xs text-stone-400">
          <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
          {loadingText}
        </div>
      ) : isEmpty ? (
        <div className="py-10 text-center text-xs text-stone-400 px-4">
          {emptyText}
        </div>
      ) : (
        <div className="p-3 space-y-2.5 bg-stone-50/40">
          {showSelectAll && (
            <div className="flex items-center justify-between px-1 pb-1">
              <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                />
                <span>Select all ({items.length})</span>
              </label>
              <span className="text-[11px] font-medium text-stone-400">
                Grid View
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item, idx) => renderCard(item, idx))}
          </div>
        </div>
      )}
    </div>
  );
}
