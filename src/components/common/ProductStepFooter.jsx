import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineDocumentText,
} from 'react-icons/hi2';

/**
 * ProductStepFooter - Reusable sticky bottom navigation bar for multi-step product wizards.
 * Used across:
 * - Jewellery Products (Add / Edit)
 * - Silver Products (Add / Edit)
 * - Ornate Products (Add / Edit)
 */
export default function ProductStepFooter({
  currentStepIndex = 0,
  totalSteps = 1,
  currentStepTitle = '',
  nextStepTitle = '',
  onPrev,
  onNext,
  onSave,
  saving = false,
  isEditMode = false,
  prevLabel,
  nextLabel,
  saveLabel = 'Save',
  finishLabel,
  className = '',
}) {
  const isFirstStep = currentStepIndex <= 0;
  const isLastStep = currentStepIndex >= totalSteps - 1;

  const resolvedPrevText = prevLabel || (isFirstStep ? 'Back to List' : 'Previous Tab');
  const resolvedNextText = isLastStep
    ? (finishLabel || (isEditMode ? 'Update Product' : 'Publish Product'))
    : (nextLabel || (nextStepTitle ? `Next: ${nextStepTitle}` : 'Next Tab'));

  return (
    <div
      className={`sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3 ${className}`}
    >
      {/* ─── Previous / Back to List ──────────────────── */}
      <button
        type="button"
        onClick={onPrev}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 active:scale-[0.98] transition-all cursor-pointer"
      >
        <HiOutlineArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{resolvedPrevText}</span>
      </button>

      {/* ─── Center Indicator: Step X of Y • Step Title ── */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-500">
        <span>
          Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps} &bull;
        </span>
        <span className="text-[#8b6f4e] font-bold">{currentStepTitle}</span>
      </div>

      {/* ─── Right Actions: Optional Save & Next/Publish ─ */}
      <div className="flex items-center gap-2">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            title="Save draft"
          >
            {saving ? (
              <span className="w-3 h-3 border-2 border-stone-500 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <HiOutlineDocumentText className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>{saving ? 'Saving...' : saveLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={saving}
          className={`flex items-center gap-1.5 ${
            isLastStep ? 'px-5 py-2' : 'px-4 py-2'
          } text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50`}
        >
          {isLastStep ? (
            <>
              {saving ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>{saving ? 'Saving...' : resolvedNextText}</span>
            </>
          ) : (
            <>
              <span>{resolvedNextText}</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
