import React from 'react';
import {
  HiOutlineX,
  HiOutlineCalculator,
  HiOutlineRefresh,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import Modal from './Modal';

export default function PricingBreakdownModal({
  isOpen,
  onClose,
  variant,
  breakdown,
  loading,
  error,
  onRecalculate,
  onApplyToVariant,
}) {
  if (!isOpen) return null;

  const combination =
    variant?.combination ||
    [variant?.diamondType, variant?.diamondColor, variant?.diamondClarity, variant?.purity, variant?.caratWeight ? `${variant.caratWeight}ct` : '']
      .filter(Boolean)
      .join(' • ') ||
    'Jewellery Variant';

  const sku = variant?.sku || '—';

  const formatINR = (val) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center">
            <HiOutlineCalculator className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900">Pricing Breakdown & Calculation</h3>
          </div>
        </div>
      }
      subtitle={
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500">
          <span className="font-semibold text-stone-800">{combination}</span>
          <span>&bull;</span>
          <span className="font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200">
            {sku}
          </span>
        </div>
      }
      maxWidth="max-w-xl"
      className="!p-0"
    >
      <div className="p-5 sm:p-6 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-3 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-stone-500">Calculating pricing from master rates…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <HiOutlineInformationCircle className="w-4 h-4 text-rose-600" />
              <span>Calculation Failed</span>
            </div>
            <p className="text-xs text-rose-700">{error}</p>
            {onRecalculate && (
              <button
                type="button"
                onClick={onRecalculate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <HiOutlineRefresh className="w-3.5 h-3.5" />
                Retry Calculation
              </button>
            )}
          </div>
        ) : breakdown ? (
          <div className="space-y-4">
            {/* Top Total Price Banner */}
            <div className="rounded-2xl border border-[#e8ded1] bg-gradient-to-br from-[#faf8f5] to-[#f5ede3] p-4.5 sm:p-5 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-[#8b6f4e]">Calculated Final Price</p>
                <h4 className="text-2xl font-bold font-mono text-stone-900 mt-0.5">
                  {formatINR(breakdown.finalPrice)}
                </h4>
              </div>
              <div className="text-right space-y-1">
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/80 border border-[#e8ded1] text-stone-700 shadow-2xs">
                  Weight: {breakdown.effectiveWeight} g
                </span>
                <p className="text-[10px] text-stone-500 font-medium">
                  GST: {breakdown.appliedGst}% included
                </p>
              </div>
            </div>

            {/* Breakdown Items Grid */}
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-2xs divide-y divide-stone-100 text-xs">
              {/* Metal Cost */}
              <div className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                <div>
                  <p className="font-bold text-stone-800">Metal Cost</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {breakdown.effectiveWeight} g &times; {formatINR(breakdown.metalRate)}/g
                  </p>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatINR(breakdown.metalCost)}
                </span>
              </div>

              {/* Center Diamond Cost */}
              <div className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                <div>
                  <p className="font-bold text-stone-800">Center Diamond Cost</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Primary diamond master rate</p>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatINR(breakdown.centerDiamondCost)}
                </span>
              </div>

              {/* Side Diamond Cost */}
              {Number(breakdown.sideDiamondCost || 0) > 0 && (
                <div className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-stone-800">Side Diamond Cost</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Accent diamonds master rate</p>
                  </div>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {formatINR(breakdown.sideDiamondCost)}
                  </span>
                </div>
              )}

              {/* Total Diamond Cost */}
              <div className="p-3.5 flex items-center justify-between bg-stone-50/30">
                <div>
                  <p className="font-bold text-stone-700">Total Diamond Cost</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Center + Side diamonds combined</p>
                </div>
                <span className="font-mono font-bold text-[#8b6f4e] text-sm">
                  {formatINR(breakdown.diamondCost)}
                </span>
              </div>

              {/* Total Making Charge / Labour */}
              <div className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                <div>
                  <p className="font-bold text-stone-800">Labour / Making Charge</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Manufacturing & craftsmanship</p>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatINR(breakdown.totalMakingCharge)}
                </span>
              </div>

              {/* Certificate Charge */}
              <div className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                <div>
                  <p className="font-bold text-stone-800">Certificate Charge</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Authenticity & grading certification</p>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatINR(breakdown.certificateCharge)}
                </span>
              </div>

              {/* GST Amount */}
              <div className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                <div>
                  <p className="font-bold text-stone-800">GST ({breakdown.appliedGst}%)</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Applicable jewellery tax</p>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatINR(breakdown.gstAmount)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

