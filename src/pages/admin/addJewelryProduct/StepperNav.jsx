import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineExternalLink,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineCheck,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { openProductPreview } from '../../../utils/productPreview';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function StepperNav() {
  const navigate = useNavigate();
  const {
    productListPath,
    isSilverProduct,
    productId,
    basicDetails,
    productRecord,
    ornate,
    categoryOptions,
    handleToggleStatus,
    saving,
    togglingStatus,
    currentStatus,
    handlePublish,
    handleSave,
    handleNextStep,
    getNextButtonText,
    steps,
    activeStep,
    setActiveStep,
  } = useAddJewelryProductContext();

  return (
    <div className="sticky top-14 z-20 bg-[#f8fafc]/95 backdrop-blur-md pt-0.5 pb-2.5 space-y-3">
      {/* ─── Top Bar (Title & Actions Matching Screenshot) ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#eee8df] shadow-2xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate(productListPath)}
            className="w-9 h-9 rounded-xl border border-[#d6cfc2] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-800 transition-colors shadow-2xs cursor-pointer shrink-0"
            title={`Back to ${isSilverProduct ? 'Silver' : 'Jewelry'} Products`}
          >
            <HiOutlineArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight max-w-full sm:max-w-[550px] truncate"
                title={basicDetails.title}
              >
                {productId
                  ? (basicDetails.title || `Edit ${isSilverProduct ? 'Silver' : 'Jewelry'} Product`)
                  : `Add ${isSilverProduct ? 'Silver' : 'Jewelry'} Product`}
              </h1>
              {(basicDetails.isOrnate || productRecord?.isOrnate) && (
                (productRecord?.ornate?.barcode || productRecord?.barcode || ornate?.barcode) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#ebdcc9]">
                    Barcode: {productRecord?.ornate?.barcode || productRecord?.barcode || ornate?.barcode}
                  </span>
                ) : (productRecord?.ornate?.tagNo || ornate?.tagNo) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#ebdcc9]">
                    Label: {productRecord?.ornate?.tagNo || ornate?.tagNo}
                  </span>
                ) : null
              )}
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {basicDetails.isOrnate || productRecord?.isOrnate ? (
                <>
                  ERP SKU: <span className="font-mono text-stone-800 font-semibold">{productRecord?.ornate?.tagNo || ornate?.tagNo || '—'}</span>
                  {(productRecord?.ornate?.barcode || productRecord?.barcode || ornate?.barcode) && (
                    <> &bull; Barcode: <span className="font-mono text-stone-800 font-semibold">{productRecord?.ornate?.barcode || productRecord?.barcode || ornate?.barcode}</span></>
                  )}
                </>
              ) : (
                <>
                  SKU: <span className="font-mono text-stone-800 font-semibold">{basicDetails.sku || productRecord?.basicInfo?.sku || '—'}</span>
                  {(() => {
                    const matchedCat = (categoryOptions || []).find((c) => String(c?.value) === String(basicDetails.category));
                    return matchedCat?.label ? (
                      <> &bull; Category: <span className="text-stone-800 font-semibold">{matchedCat.label}</span></>
                    ) : null;
                  })()}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {productId && (
            <button
              type="button"
              onClick={() => openProductPreview(productRecord || { _id: productId })}
              className="group inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-stone-700 hover:text-[#785e40] bg-white border border-stone-200 hover:border-stone-300 rounded-lg hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Preview product on storefront"
            >
              <HiOutlineExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#8b6f4e]" />
              <span>View</span>
            </button>
          )}

          {productId ? (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={saving || togglingStatus}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95 select-none ${
                currentStatus === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title={
                currentStatus === 'approved'
                  ? 'Status: Live on Website. Click to switch to Draft.'
                  : 'Status: Draft (Hidden). Click to publish.'
              }
            >
              {currentStatus === 'approved' ? (
                <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <HiOutlineLockClosed className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span>{togglingStatus ? 'Updating...' : (currentStatus === 'approved' ? 'Live' : 'Draft')}</span>
              {/* Mini switch track */}
              <span
                className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors p-0.5 ml-0.5 ${
                  currentStatus === 'approved' ? 'bg-emerald-500' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-xs transition duration-150 ${
                    currentStatus === 'approved' ? 'translate-x-2.5' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handlePublish('approved')}
              disabled={saving}
              className="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-95 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || togglingStatus}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:border-stone-300 rounded-lg hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Save changes"
          >
            {saving ? (
              <span className="w-3 h-3 border-2 border-stone-500 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] shrink-0" />
            )}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span>{getNextButtonText()}</span>
            <HiOutlineArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ─── Stepper Wizard Bar ─────────── */}
      <div className="bg-white rounded-2xl border border-[#eee8df] p-2 sm:p-2.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 items-center">
          {steps.map((s, idx) => {
            const isActive = activeStep === s.num;

            return (
              <div key={s.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={`flex items-center gap-2.5 text-left w-full p-2 rounded-xl transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-[#f8ede2] border border-[#ebdcc9]'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  {/* Step Indicator Circle with exact number */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-[#8b6f4e] text-white shadow-xs'
                        : 'border border-stone-300 bg-white text-stone-700 group-hover:border-stone-400'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-stone-900' : 'text-stone-800'
                      }`}
                    >
                      {s.title}
                    </p>
                    <p
                      className={`text-[10px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-stone-600' : 'text-stone-400'
                      }`}
                    >
                      {s.subtitle}
                    </p>
                  </div>
                </button>

                {/* Connecting Line (except last item) */}
                {idx < steps.length - 1 && (
                  <div className="hidden 2xl:block w-3 h-[1px] bg-stone-200 mx-0.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
