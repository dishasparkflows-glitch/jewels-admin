import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function Step3SilverPricing() {
  const {
    isSilverProduct,
    getStepPosition,
    pricing,
    setPricing,
    handleSilverCostOrMarkupChange,
    handleSilverSalePriceChange,
    handleSilverMrpMarkupChange,
  } = useAddJewelryProductContext();

  return (
    <div className="bg-white rounded-2xl border border-[#eee8df] p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
        <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          {getStepPosition(3)}
        </div>
        <div>
          <h3 className="text-base font-bold text-stone-900">
            {isSilverProduct ? 'Silver Pricing & Costing' : 'Jewelry Specifications & Costing'}
          </h3>
          <p className="text-xs text-stone-500">
            {isSilverProduct ? 'Configure product pricing and margins.' : 'Add product weight, charges and pricing.'}
          </p>
        </div>
      </div>

      {/* ─── Pricing & Inventory (Silver products matching old admin panel) ─── */}
      <div className="rounded-2xl border border-[#eee8df] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-7 h-7 rounded-lg bg-[#faf5ee] border border-[#ecd9c2] flex items-center justify-center text-[#8b6f4e] shrink-0 font-bold text-xs sm:text-sm">
            ₹
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              Pricing & Inventory
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          {/* Row 1: Cost Price, Markup %, Calculated Price, Sale Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. COST PRICE (₹) */}
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
                onChange={(e) => handleSilverCostOrMarkupChange('costPrice', e.target.value)}
                className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
              />
            </div>

            {/* 2. MARKUP % */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  MARKUP %
                </label>
              </div>
              <input
                type="number"
                value={pricing.markupPercentage}
                onChange={(e) => handleSilverCostOrMarkupChange('markupPercentage', e.target.value)}
                className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
              />
            </div>

            {/* 3. CALCULATED PRICE (₹) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 min-h-[20px] flex-wrap">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  CALCULATED PRICE (₹)
                </label>
                <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                  Formula: Cost + Markup %
                </span>
              </div>
              <input
                type="number"
                value={pricing.calculatedPrice}
                onChange={(e) => setPricing((prev) => ({ ...prev, calculatedPrice: e.target.value }))}
                className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-bold text-stone-900 bg-white border border-[#d6cfc2] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
              />
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 flex-wrap gap-1">
                <span>Auto-computed base price</span>
                {pricing.costPrice && pricing.markupPercentage ? (
                  <span className="text-stone-600 font-medium">
                    ₹{Number(pricing.costPrice).toLocaleString('en-IN')} + {pricing.markupPercentage}% = <strong className="text-stone-900 font-bold">₹{Number(pricing.calculatedPrice || 0).toLocaleString('en-IN')}</strong>
                  </span>
                ) : null}
              </div>
            </div>

            {/* 4. SALE PRICE (₹) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  SALE PRICE (₹)
                </label>
              </div>
              <input
                type="number"
                value={pricing.salePrice}
                onChange={(e) => handleSilverSalePriceChange(e.target.value)}
                className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-bold text-[#8b6f4e] bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
              />
              <p className="text-[10px] text-stone-400 mt-1">Actual selling price</p>
            </div>
          </div>

          {/* Row 2: MRP Markup % and MRP Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  MRP MARKUP %
                </label>
              </div>
              <input
                type="number"
                value={pricing.mrpMarkupPercentage}
                onChange={(e) => handleSilverMrpMarkupChange(e.target.value)}
                className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 min-h-[20px] flex-wrap">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  MRP PRICE (₹)
                </label>
                <span className="text-[10px] font-semibold text-[#8b6f4e] bg-[#faf5ee] px-2 py-0.5 rounded-md border border-[#ecd9c2]">
                  Formula: Sale Price + MRP Markup %
                </span>
              </div>
              <input
                type="number"
                value={pricing.mrp}
                onChange={(e) => setPricing((prev) => ({ ...prev, mrp: e.target.value }))}
                className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
              />
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 flex-wrap gap-1">
                <span>Customer list price (strikethrough)</span>
                {pricing.salePrice && pricing.mrpMarkupPercentage ? (
                  <span className="text-[#8b6f4e] font-medium bg-[#faf5ee]/90 px-1.5 py-0.5 rounded border border-[#ecd9c2]">
                    ₹{Number(pricing.salePrice).toLocaleString('en-IN')} + {pricing.mrpMarkupPercentage}% = <strong className="text-stone-900 font-bold">₹{Number(pricing.mrp || 0).toLocaleString('en-IN')}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
