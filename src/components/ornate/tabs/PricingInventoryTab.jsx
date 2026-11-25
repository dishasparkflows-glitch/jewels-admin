
export default function PricingInventoryTab({
  pricing,
  setPricing,
  handleCostOrMarkupChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-fadeIn">
      <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
        <div className="w-7 h-7 rounded-lg bg-[#faf5ee] text-[#8b6f4e] flex items-center justify-center font-bold text-xs">
          ₹
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Pricing & Inventory
          </h3>
          <p className="text-[11px] text-stone-400">
            Configure wholesale cost price, markup margin percentage, actual selling price, and customer list price.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Ornate Price, Cost Price, Markup %, Calculated Price, Sale Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. ORNATE PRICE (₹) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                ORNATE PRICE (₹)
              </label>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-amber-300 text-amber-700 bg-amber-50 uppercase tracking-wider whitespace-nowrap">
                SYNCED (LOCKED)
              </span>
            </div>
            <input
              type="number"
              value={pricing.ornatePrice}
              readOnly
              disabled
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-stone-50/70 text-stone-700 cursor-not-allowed select-none"
            />
            <p className="text-[10px] text-stone-400 mt-1">Price from Ornate ERP (Read-only)</p>
          </div>

          {/* 2. COST PRICE (₹) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                COST PRICE (₹)
              </label>
              <span className="text-[10px] text-stone-400 font-medium tracking-wide">(HIDDEN)</span>
            </div>
            <input
              type="number"
              value={pricing.costPrice}
              onChange={(e) => handleCostOrMarkupChange('costPrice', e.target.value)}
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          {/* 3. MARKUP % */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                MARKUP %
              </label>
            </div>
            <input
              type="number"
              value={pricing.markupPercentage}
              onChange={(e) => handleCostOrMarkupChange('markupPercentage', e.target.value)}
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          {/* 4. CALCULATED PRICE (₹) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                CALCULATED PRICE (₹)
              </label>
            </div>
            <input
              type="number"
              value={pricing.calculatedPrice}
              onChange={(e) =>
                setPricing((prev) => ({ ...prev, calculatedPrice: Number(e.target.value) || 0 }))
              }
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          {/* 5. SALE PRICE (₹) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                SALE PRICE (₹)
              </label>
            </div>
            <input
              type="number"
              value={pricing.salePrice}
              onChange={(e) => {
                const sp = Number(e.target.value) || 0;
                setPricing((prev) => ({
                  ...prev,
                  salePrice: e.target.value,
                  mrp: Number(prev.mrpMarkupPercentage) > 0 ? Math.round(sp * (1 + Number(prev.mrpMarkupPercentage) / 100)) : prev.mrp,
                }));
              }}
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-white text-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e]"
            />
            <p className="text-[10px] text-stone-400 mt-1">Actual selling price</p>
          </div>
        </div>

        {/* Row 2: MRP Markup % and MRP Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              MRP Markup %
            </label>
            <input
              type="number"
              value={pricing.mrpMarkupPercentage}
              onChange={(e) => {
                const markupVal = Number(e.target.value) || 0;
                setPricing((prev) => ({
                  ...prev,
                  mrpMarkupPercentage: markupVal,
                  mrp: markupVal > 0 ? Math.round(prev.salePrice * (1 + markupVal / 100)) : prev.mrp,
                }));
              }}
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              MRP Price (₹)
            </label>
            <input
              type="number"
              value={pricing.mrp}
              onChange={(e) =>
                setPricing((prev) => ({ ...prev, mrp: Number(e.target.value) || 0 }))
              }
              className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#8b6f4e]"
            />
            <p className="text-[10px] text-stone-400">Customer list price (strikethrough)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
