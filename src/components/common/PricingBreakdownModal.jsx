import React from 'react';
import { HiOutlineCalculator, HiOutlineInformationCircle } from 'react-icons/hi';
import Modal from './Modal';
import { useTheme } from '../../contexts/ThemeContext';

export default function PricingBreakdownModal({
  isOpen,
  onClose,
  variant,
  breakdown,
  loading,
  error,
  specs,
}) {
  if (!isOpen) return null;

  let theme = null;
  try {
    theme = useTheme()?.currentTheme;
  } catch (e) {
    // Fallback if rendered outside ThemeProvider
  }

  const combination =
    variant?.combination ||
    [
      variant?.diamondType,
      variant?.diamondColor,
      variant?.diamondClarity,
      variant?.purity,
      variant?.caratWeight ? `${variant.caratWeight}ct` : '',
    ]
      .filter(Boolean)
      .join(' · ') ||
    '';

  const sku = variant?.sku || '';

  const formatINR = (val) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 1. Metal
  const effectiveWeight = Number(breakdown?.effectiveWeight || variant?.metalWeight || variant?.weight || 0);
  const baseWeight = Number(specs?.metalWeight || variant?.baseWeight || 0);
  const metalRate = Number(
    breakdown?.metalRate ||
    variant?.metalRate ||
    (effectiveWeight > 0 && (breakdown?.metalCost || variant?.metalCost) ? (breakdown?.metalCost || variant?.metalCost) / effectiveWeight : 0)
  );
  const metalCost = Number(breakdown?.metalCost ?? variant?.metalCost ?? (effectiveWeight * metalRate));

  // 2. Center Diamond (Rule 2: Never treat accent diamond weight as center diamond)
  const centerCost = Number(breakdown?.centerDiamondCost ?? variant?.centerDiamondCost ?? 0);
  const centerCarat = centerCost > 0 ? Number(breakdown?.centerDiamondWeight ?? variant?.centerDiamondWeight ?? (variant?.center ? variant?.caratWeight : 0)) : 0;
  const centerRate = (centerCarat > 0 && centerCost > 0)
    ? Number(breakdown?.centerDiamondRate || variant?.centerDiamondRate || Math.round(centerCost / centerCarat))
    : 0;

  // 3. Side Diamonds (Rule 1: Matching quality only)
  const sideCost = Number(breakdown?.sideDiamondCost ?? variant?.sideDiamondCost ?? 0);
  const sideWeight = Number(
    breakdown?.sideDiamondWeight ||
    variant?.sideDiamondWeight ||
    (!centerCost && variant?.caratWeight ? variant.caratWeight : 0) ||
    (Array.isArray(variant?.sideDiamonds)
      ? variant.sideDiamonds.reduce((sum, s) => sum + Number(s.caratWeight || 0), 0)
      : 0)
  );
  const sideRate = (sideWeight > 0 && sideCost > 0)
    ? Number(breakdown?.sideDiamondRate || Math.round(sideCost / sideWeight))
    : Number(variant?.sideDiamonds?.[0]?.priceINR || 0);

  // 4. Labour / Making Charge
  const labourCost = Number(breakdown?.totalMakingCharge ?? variant?.computedMakingCharge ?? variant?.labourCharge ?? 0);
  const labourRate = Number(specs?.baseLabourCharge || (effectiveWeight > 0 && labourCost > 0 ? Math.round(labourCost / effectiveWeight) : 0));

  // 5. Certificate Charge
  const certCost = Number(breakdown?.certificateCharge ?? variant?.certificateCharge ?? specs?.certificateCharge ?? 0);

  // 6. Subtotal
  const subtotal = Number(breakdown?.subtotal ?? (Math.round(((metalCost + centerCost + sideCost + labourCost + certCost) + Number.EPSILON) * 100) / 100));

  // 7. GST
  const gstPercent = Number(breakdown?.appliedGst ?? specs?.gstPercentage ?? 3);
  const gstAmount = Number(breakdown?.gstAmount ?? variant?.computedGst ?? (Math.round(((subtotal * gstPercent / 100) + Number.EPSILON) * 100) / 100));

  // 8. Final Price
  const finalPrice = Number(breakdown?.finalPrice ?? variant?.priceRaw ?? variant?.price ?? (Math.round(((subtotal + gstAmount) + Number.EPSILON) * 100) / 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div
            style={{
              backgroundColor: theme?.soft || 'var(--theme-primary-soft, #faf5ee)',
              borderColor: theme?.border || 'var(--theme-primary-border, #e8d8c0)',
              color: theme?.primary || 'var(--theme-primary, #8b6f4e)',
            }}
            className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
          >
            <HiOutlineCalculator className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="font-bold text-base text-stone-900 tracking-tight">
            PRICING BREAKDOWN
          </span>
        </div>
      }
      subtitle={
        (combination || sku) ? (
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-stone-500 font-medium pl-10.5">
            <span>{combination}</span>
            {sku && (
              <>
                <span>&bull;</span>
                <span className="font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[11px] border border-stone-200">
                  {sku}
                </span>
              </>
            )}
          </div>
        ) : null
      }
      maxWidth="max-w-md sm:max-w-lg"
      className="p-5 sm:p-6"
    >
      <div className="space-y-4 pt-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div
              style={{
                borderColor: theme?.primary || 'var(--theme-primary, #8b6f4e)',
                borderTopColor: 'transparent',
              }}
              className="w-8 h-8 border-3 rounded-full animate-spin"
            />
            <p className="text-xs font-semibold text-stone-500">Calculating pricing from master rates…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <HiOutlineInformationCircle className="w-4 h-4 text-rose-600" />
              <span>Calculation Failed</span>
            </div>
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-2.5 text-left font-semibold">ITEM</th>
                    <th className="pb-2.5 text-center font-semibold">CALCULATION</th>
                    <th className="pb-2.5 text-right font-semibold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {/* Metal Cost */}
                  <tr>
                    <td className="py-3 pr-2">
                      <p className="font-bold text-stone-800 text-xs">Metal Cost</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Eff. Weight: {effectiveWeight}g {baseWeight > 0 ? `(Base: ${baseWeight}g)` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-stone-600 font-mono">
                      {effectiveWeight} &times; {formatINR(metalRate)}
                    </td>
                    <td className="py-3 pl-2 text-right font-mono font-bold text-stone-900 text-xs sm:text-sm">
                      {formatINR(metalCost)}
                    </td>
                  </tr>

                  {/* Center Diamond (Only show if Center Diamond Cost > 0) */}
                  {centerCost > 0 && (
                    <tr>
                      <td className="py-3 pr-2">
                        <p className="font-bold text-stone-800 text-xs">Center Diamond</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">Carat: {centerCarat} ct</p>
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-stone-600 font-mono">
                        {centerCarat} ct &times; {formatINR(centerRate)}
                      </td>
                      <td className="py-3 pl-2 text-right font-mono font-bold text-stone-900 text-xs sm:text-sm">
                        {formatINR(centerCost)}
                      </td>
                    </tr>
                  )}

                  {/* Side Diamonds (Only show if Side Diamond Cost > 0) */}
                  {sideCost > 0 && (
                    <tr>
                      <td className="py-3 pr-2">
                        <p className="font-bold text-stone-800 text-xs">Side Diamonds</p>
                        {sideWeight > 0 && (
                          <p className="text-[11px] text-stone-400 mt-0.5">{sideWeight} ct</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-stone-600 font-mono">
                        {sideWeight > 0 ? `${sideWeight} ct × ${formatINR(sideRate)}` : 'Accent diamonds'}
                      </td>
                      <td className="py-3 pl-2 text-right font-mono font-bold text-stone-900 text-xs sm:text-sm">
                        {formatINR(sideCost)}
                      </td>
                    </tr>
                  )}

                  {/* Labour Charge */}
                  <tr>
                    <td className="py-3 pr-2">
                      <p className="font-bold text-stone-800 text-xs">Labour Charge</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Based on {effectiveWeight}g</p>
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-stone-600 font-mono">
                      {effectiveWeight} &times; {formatINR(labourRate)}
                    </td>
                    <td className="py-3 pl-2 text-right font-mono font-bold text-stone-900 text-xs sm:text-sm">
                      {formatINR(labourCost)}
                    </td>
                  </tr>

                  {/* Certificate Charge (Only show if Certificate Charge > 0) */}
                  {certCost > 0 && (
                    <tr>
                      <td className="py-3 pr-2">
                        <p className="font-bold text-stone-800 text-xs">Certificate Charge</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">Flat Charge</p>
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-stone-600 font-mono">Flat</td>
                      <td className="py-3 pl-2 text-right font-mono font-bold text-stone-900 text-xs sm:text-sm">
                        {formatINR(certCost)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary & GST Breakdown */}
            <div className="border-t border-stone-200 pt-3.5 space-y-2">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">Subtotal</span>
                <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">{formatINR(subtotal)}</span>
              </div>

              {/* GST with details */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">GST ({gstPercent}%)</span>
                <span className="font-mono font-bold text-stone-700 text-xs sm:text-sm">+{formatINR(gstAmount)}</span>
              </div>

              {/* User Selected Theme Color Final Price Pill */}
              <div
                style={{
                  backgroundColor: theme?.primary || 'var(--theme-primary, #8b6f4e)',
                }}
                className="mt-2.5 text-white rounded-xl px-5 py-3.5 flex items-center justify-between shadow-md transition-colors"
              >
                <span className="text-xs font-bold tracking-wider uppercase text-white/90">FINAL PRICE</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-white">{formatINR(finalPrice)}</span>
              </div>

              {/* Footnote */}
              <p className="text-center text-[10px] text-stone-400 pt-1 font-medium">
                Calculation: (Metal + Stone + Labour) + GST = Final Price
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
