import React from 'react';
import { HiOutlineEye } from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

const getProductImageUrl = (p) => {
  if (!p) return null;
  if (typeof p === 'string' && p.startsWith('http')) return p;
  if (p.imageUrl) return p.imageUrl;
  if (p.firstProductImage) return p.firstProductImage;
  if (p.images && p.images[0]) {
    const img = p.images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.ornate?.ornateImages) {
    if (Array.isArray(p.ornate.ornateImages) && p.ornate.ornateImages[0]) {
      const img = p.ornate.ornateImages[0];
      return typeof img === 'string' ? img : img.url;
    }
    if (typeof p.ornate.ornateImages === 'string' && p.ornate.ornateImages.startsWith('http')) {
      return p.ornate.ornateImages;
    }
  }
  if (p.colorImages && p.colorImages[0]?.images?.[0]) {
    const img = p.colorImages[0].images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.media?.gallery?.[0]?.url) return p.media.gallery[0].url;
  return null;
};

export default function GroupCard({
  group,
  viewMode = 'grid',
  onManage,
  onToggleStatus,
}) {
  const isActive = group.status === 'active';
  const productCount = group.productCount ?? 0;
  const imageUrl =
    group.imageUrl ||
    group.firstProductImage ||
    getProductImageUrl(group.representative) ||
    getProductImageUrl(group.firstProduct);

  if (viewMode === 'list') {
    return (
      <article className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
        {/* 1st Product Image Thumbnail */}
        <div
          onClick={() => onManage?.(group)}
          className="w-14 h-14 shrink-0 bg-stone-50/80 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center cursor-pointer p-1"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={group.groupName}
              loading="lazy"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-11 h-11 bg-[#8b6f4e]/8 rounded-xl flex items-center justify-center">
              <IoDiamondOutline className="w-5 h-5 text-[#8b6f4e]" />
            </div>
          )}
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3
              onClick={() => onManage?.(group)}
              className="font-bold text-sm text-stone-900 truncate cursor-pointer hover:text-[#8b6f4e]"
            >
              {group.groupName}
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Code: <strong className="text-stone-700 font-mono">{group.groupCode}</strong>
          </p>
        </div>

        {/* Product Count */}
        <div className="text-center shrink-0 px-4">
          <p className="text-[10px] text-stone-400 uppercase font-semibold">Total Products</p>
          <p className="text-lg font-bold text-stone-900">{productCount}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* On/Off Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus?.(group);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f4e] ${
              isActive ? 'bg-[#8b6f4e]' : 'bg-stone-300'
            }`}
            title={isActive ? 'Click to deactivate group' : 'Click to activate group'}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => onManage?.(group)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <HiOutlineEye className="w-3.5 h-3.5" />
            <span>Manage Group</span>
          </button>
        </div>
      </article>
    );
  }

  // Grid View Card
  return (
    <article className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold text-stone-500 font-mono">
            {group.groupCode}
          </span>
          <div className="flex items-center gap-2">
            {/* On/Off Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(group);
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f4e] ${
                isActive ? 'bg-[#8b6f4e]' : 'bg-stone-300'
              }`}
              title={isActive ? 'Click to deactivate group' : 'Click to activate group'}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 1st Product Image Above & Product Count Badge */}
        <div
          onClick={() => onManage?.(group)}
          className="relative w-full h-36 bg-stone-50/70 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center mb-3 cursor-pointer group-hover:bg-stone-50 transition-colors"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={group.groupName}
              loading="lazy"
              className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <IoDiamondOutline className="w-9 h-9 stroke-1 text-stone-300 group-hover:text-[#8b6f4e]/40 transition-colors" />
              <span className="text-[9px] uppercase tracking-wider text-stone-400 mt-1">No Photo</span>
            </div>
          )}

          {/* Product Count Pill Badge */}
          <span className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {productCount} {productCount === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        {/* Group Name */}
        <h3
          onClick={() => onManage?.(group)}
          className="font-bold text-xs sm:text-sm text-stone-900 tracking-tight line-clamp-2 cursor-pointer hover:text-[#8b6f4e] transition-colors"
          title={group.groupName}
        >
          {group.groupName}
        </h3>
      </div>

      {/* Button */}
      <div className="mt-4 pt-3 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onManage?.(group)}
          className="w-full py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <HiOutlineEye className="w-3.5 h-3.5" />
          <span>Manage Group</span>
        </button>
      </div>
    </article>
  );
}
