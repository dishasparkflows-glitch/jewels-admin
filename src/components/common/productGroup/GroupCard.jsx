import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

const money = (val) => {
  if (val == null || val === '') return '₹ 0';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

const getProductImageUrl = (product) => {
  if (!product) return null;
  if (product.images && product.images[0]) {
    const img = product.images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (product.ornate?.ornateImages && product.ornate.ornateImages[0]) {
    const img = product.ornate.ornateImages[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (product.colorImages && product.colorImages[0]?.images?.[0]) {
    const img = product.colorImages[0].images[0];
    return typeof img === 'string' ? img : img.url;
  }
  return null;
};

export default function GroupCard({
  group,
  viewMode = 'grid',
  onManage,
  onEdit,
  onAddProducts,
  onToggleStatus,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const imageUrl = getProductImageUrl(group.representative);
  const isActive = group.status === 'active';
  const eligibleCount = group.eligibleCount ?? group.productCount ?? 0;
  const repPrice = group.representativePrice || group.maxPrice || 0;

  if (viewMode === 'list') {
    return (
      <article className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row items-center gap-4">
        {/* Thumbnail */}
        <div className="relative w-24 h-24 shrink-0 bg-stone-50 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={group.groupName}
              className="w-full h-full object-contain p-1.5"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <IoDiamondOutline className="w-6 h-6" />
              <span className="text-[10px] text-stone-400 mt-1">No Image</span>
            </div>
          )}
          <span className="absolute top-1 left-1 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {eligibleCount} {eligibleCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-stone-900 truncate">{group.groupName}</h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span>Code: <strong className="text-stone-700">{group.groupCode}</strong></span>
            <span>•</span>
            <span>Mode: <strong className="capitalize text-stone-700">{group.representativeMode || 'auto'}</strong></span>
          </div>
          {group.sync?.firstSyncedAt && (
            <p className="text-[11px] text-stone-400">
              First synced: {new Date(group.sync.firstSyncedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="text-right shrink-0 pr-4">
          <p className="text-[11px] text-stone-500">Representative Price</p>
          <p className="text-base font-bold text-[#8b6f4e]">{money(repPrice)}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Range: {money(group.minPrice)} – {money(group.maxPrice)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onManage(group)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            Manage Group
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-all"
              title="More actions"
            >
              <HiOutlineDotsVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(group);
                  }}
                  className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                >
                  <HiOutlinePencil className="w-3.5 h-3.5 text-stone-500" />
                  Edit Group Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddProducts?.(group);
                  }}
                  className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 text-stone-500" />
                  Add Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleStatus?.(group);
                  }}
                  className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                >
                  {isActive ? (
                    <>
                      <HiOutlineXCircle className="w-3.5 h-3.5 text-amber-500" />
                      Deactivate Group
                    </>
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Activate Group
                    </>
                  )}
                </button>
                <div className="border-t border-stone-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(group);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  Delete Group
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Grid View Card
  return (
    <article className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-stone-500 font-mono">
            {group.groupCode}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
                title="More actions"
              >
                <HiOutlineDotsVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit?.(group);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <HiOutlinePencil className="w-3.5 h-3.5 text-stone-500" />
                    Edit Group Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onAddProducts?.(group);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5 text-stone-500" />
                    Add Products
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleStatus?.(group);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    {isActive ? (
                      <>
                        <HiOutlineXCircle className="w-3.5 h-3.5 text-amber-500" />
                        Deactivate Group
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Activate Group
                      </>
                    )}
                  </button>
                  <div className="border-t border-stone-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(group);
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    Delete Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Box */}
        <div className="relative w-full h-44 bg-stone-50/70 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center mb-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={group.groupName}
              className="w-full h-full object-contain p-2 group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <IoDiamondOutline className="w-8 h-8" />
              <span className="text-[11px] text-stone-400 mt-1">No Image Available</span>
            </div>
          )}

          <span className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {eligibleCount} {eligibleCount === 1 ? 'Variant' : 'Variants'}
          </span>
        </div>

        {/* Group Name */}
        <h3 className="font-bold text-sm text-stone-900 tracking-tight line-clamp-1">
          {group.groupName}
        </h3>

        {/* Price Info */}
        <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-semibold">Price Range</p>
            <p className="font-semibold text-stone-800 text-[11px] truncate">
              {money(group.minPrice)} – {money(group.maxPrice)}
            </p>
          </div>
          <div className="text-right border-l border-stone-100 pl-2">
            <p className="text-[10px] text-stone-400 uppercase font-semibold">Representative</p>
            <p className="font-bold text-[#8b6f4e] text-xs truncate">
              {money(repPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 pt-3 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onManage(group)}
          className="w-full py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <HiOutlineEye className="w-3.5 h-3.5" />
          <span>Manage Group</span>
        </button>
      </div>
    </article>
  );
}
