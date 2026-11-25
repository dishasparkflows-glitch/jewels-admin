
/**
 * Shared Social Proof & Urgency (Demo Metrics) section for product editors.
 * Allows configuring product-specific sold and review counts for storefront display.
 */
export default function SocialProofMetricsSection({
  soldCount,
  reviewCount,
  onSoldCountChange,
  onReviewCountChange,
  stepBadge = null,
  className = '',
}) {
  const isNumberedCard = stepBadge !== null && stepBadge !== undefined;

  return (
    <div
      className={
        isNumberedCard
          ? `bg-white rounded-2xl border border-[#eee8df] p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6 ${className}`
          : `rounded-2xl border border-stone-200/90 bg-[#fdfcfb] p-4 sm:p-5 space-y-3 shadow-2xs ${className}`
      }
    >
      {isNumberedCard ? (
        <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
          <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {stepBadge}
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Social Proof &amp; Urgency (Demo Metrics)
            </h3>
            <p className="text-xs text-stone-500">
              Set product-specific sold and review counts displayed under the title on the storefront.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base" role="img" aria-label="fire">🔥</span>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Social Proof &amp; Urgency (Demo Metrics)
              </h4>
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Set product-specific sold and review counts displayed under the title on the storefront.
          </p>
        </>
      )}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isNumberedCard ? '' : 'pt-1'}`}>
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
            <label className="text-xs font-bold text-stone-700">
              Sold Count
            </label>
            <span className="text-[10px] text-stone-400 font-medium">
              &middot; Displayed as &apos;X sold in last 3 hours&apos;
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔥</span>
            <input
              type="number"
              min="0"
              value={soldCount}
              onChange={(e) => onSoldCountChange(e.target.value)}
              placeholder="e.g. 24"
              className="w-full h-10 pl-8 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
            <label className="text-xs font-bold text-stone-700">
              Review Count
            </label>
            <span className="text-[10px] text-stone-400 font-medium">
              &middot; Displayed as &apos;★★★★★ X reviews&apos;
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">★</span>
            <input
              type="number"
              min="0"
              value={reviewCount}
              onChange={(e) => onReviewCountChange(e.target.value)}
              placeholder="e.g. 13"
              className="w-full h-10 pl-8 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
