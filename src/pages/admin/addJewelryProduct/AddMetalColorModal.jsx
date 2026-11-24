import React from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineX } from 'react-icons/hi';
import { getSphereStyle } from './metalColorHelpers';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function AddMetalColorModal() {
  const {
    isAddColorModalOpen,
    setIsAddColorModalOpen,
    colorsList,
    productColors,
    handleAddColor,
  } = useAddJewelryProductContext();

  if (!isAddColorModalOpen) return null;

  return createPortal(
    <div
      onClick={() => setIsAddColorModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-900">
            Add Metal Color to Product
          </h3>
          <button
            type="button"
            onClick={() => setIsAddColorModalOpen(false)}
            className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        {/* Available Master Colors */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
            Choose from Metal Color Master
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
            {colorsList.map((col) => {
              const isAlreadyAdded = productColors.includes(col.name);
              const sphere = getSphereStyle(col);
              return (
                <button
                  key={col.name}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => handleAddColor(col.name)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                    isAlreadyAdded
                      ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                      : 'bg-white border-stone-200/90 hover:border-[#8b6f4e] hover:bg-[#faf6f0] text-stone-800 cursor-pointer shadow-2xs'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                    style={{ background: sphere.gradient, boxShadow: sphere.shadow }}
                  />
                  <span className="truncate">{col.name}</span>
                  {isAlreadyAdded && <span className="ml-auto text-[10px] text-stone-400">Added</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
