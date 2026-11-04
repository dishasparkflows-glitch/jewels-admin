/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react';
import { HiOutlineChevronDown, HiCheck } from 'react-icons/hi';

/**
 * CategorySelect - Luxury Category & Collections Dropdown
 * 
 * 1. Category (Select One) with radio-style selection
 * 2. Collections (Select Multiple) with multi-select checkboxes
 * 3. Unified display trigger button (e.g. "Bangles & Bracelets, Silver Collection")
 */
export default function CategorySelect({
  categoryId = '',
  selectedCollectionIds = [],
  categories = [],
  onChangeCategory,
  onChangeCollections,
  placeholder = 'Select Category',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const regularCategories = categories.filter((c) => c.type !== 'collection');
  const collectionCategories = categories.filter((c) => c.type === 'collection');

  // Find currently selected category object
  const selectedCatObj = regularCategories.find(
    (c) => String(c._id) === String(categoryId)
  );

  // Find selected collection objects
  const selectedCollObjs = collectionCategories.filter((c) =>
    selectedCollectionIds.some((id) => String(id) === String(c._id))
  );

  // Compute label for trigger button
  const primaryLabel = selectedCatObj ? selectedCatObj.name : null;
  const collectionLabels = selectedCollObjs.map((c) => c.name);
  const allLabels = [primaryLabel, ...collectionLabels].filter(Boolean);
  const displayText = allLabels.length > 0 ? allLabels.join(', ') : placeholder;
  const hasValue = allLabels.length > 0;

  const handleSelectCategory = (catId) => {
    if (disabled) return;
    if (String(categoryId) === String(catId)) {
      return;
    }
    onChangeCategory?.(catId);
  };

  const handleToggleCollection = (colId) => {
    if (disabled) return;
    const strId = String(colId);
    const exists = selectedCollectionIds.some((id) => String(id) === strId);
    const next = exists
      ? selectedCollectionIds.filter((id) => String(id) !== strId)
      : [...selectedCollectionIds, strId];
    onChangeCollections?.(next);
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left font-sans ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full h-[42px] px-3.5 flex items-center justify-between gap-2 rounded-xl border bg-white text-xs sm:text-[13px] transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${
          isOpen
            ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/20'
            : 'border-[#d6cfc2] hover:border-[#bdae99]'
        }`}
      >
        <span
          className={`truncate font-medium ${
            hasValue ? 'text-stone-900' : 'text-stone-400'
          }`}
          title={hasValue ? allLabels.join(', ') : ''}
        >
          {displayText}
        </span>
        <HiOutlineChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#8b6f4e]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full bg-white border border-stone-200/90 rounded-2xl shadow-xl max-h-80 overflow-y-auto p-3 space-y-3 animate-fadeIn">
          {/* SECTION 1: CATEGORY (SELECT ONE) */}
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest block px-2 pb-1 border-b border-stone-100 mb-2 select-none">
              CATEGORY (SELECT ONE)
            </span>

            {regularCategories.length === 0 ? (
              <p className="text-xs text-stone-400 px-2 py-1">No categories configured</p>
            ) : (
              regularCategories.map((c) => {
                const cId = String(c._id);
                const isSelected = String(categoryId) === cId;

                return (
                  <div
                    key={cId}
                    onClick={() => handleSelectCategory(cId)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-[#faf5ee] text-stone-900'
                        : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    {/* Radio Circle */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'border-[#8b6f4e] bg-[#8b6f4e]'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <span
                      className={`text-xs sm:text-[13px] ${
                        isSelected
                          ? 'text-[#8b6f4e] font-bold'
                          : 'text-stone-800 font-medium'
                      }`}
                    >
                      {c.name}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* SECTION 2: COLLECTIONS (SELECT MULTIPLE) */}
          <div className="space-y-1 pt-2 border-t border-stone-100">
            <span className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest block px-2 pb-1 border-b border-stone-100 mb-2 select-none">
              COLLECTIONS (SELECT MULTIPLE)
            </span>

            {collectionCategories.length === 0 ? (
              <p className="text-xs text-stone-400 px-2 py-1">No collections available</p>
            ) : (
              collectionCategories.map((col) => {
                const colId = String(col._id);
                const isChecked = selectedCollectionIds.some(
                  (id) => String(id) === colId
                );

                return (
                  <div
                    key={colId}
                    onClick={() => handleToggleCollection(colId)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all select-none ${
                      isChecked
                        ? 'bg-[#faf5ee] text-stone-900'
                        : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox Box */}
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                          isChecked
                            ? 'border-[#8b6f4e] bg-[#8b6f4e] text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isChecked && <HiCheck className="w-3 h-3 stroke-[2.5]" />}
                      </div>

                      <span
                        className={`text-xs sm:text-[13px] ${
                          isChecked
                            ? 'text-[#8b6f4e] font-bold'
                            : 'text-stone-800 font-medium'
                        }`}
                      >
                        {col.name}
                      </span>
                    </div>

                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                      Collection
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
