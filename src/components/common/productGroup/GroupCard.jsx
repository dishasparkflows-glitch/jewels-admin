import { HiOutlineEye, HiOutlineCheckCircle, HiOutlineTrash, HiOutlineDocumentText } from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import { EditActionButton, DeleteActionButton } from '../RowActions';
import Tooltip from '../Tooltip';

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
  isSelected = false,
  isApproving = false,
  activeTab = 'all',
  onToggleSelect,
  onManage,
  onEdit,
  onDelete,
  onToggleStatus,
  onDirectApprove,
  onDirectDraft,
  isDrafting = false,
}) {
  const isDraftOrApproved = activeTab === 'draft' || activeTab === 'approved';
  const isActive = group.status === 'active';
  const productCount = group.productCount ?? (Array.isArray(group.productIds) ? group.productIds.length : 0);
  const isAllApproved = productCount > 0 && group.eligibleCount === productCount;
  const hasNoProducts =
    (!group.productIds || group.productIds.length === 0) &&
    (!group.products || group.products.length === 0) &&
    productCount === 0;
  const imageUrl =
    group.imageUrl ||
    group.firstProductImage ||
    getProductImageUrl(group.representative) ||
    getProductImageUrl(group.firstProduct);

  const formatMoney = (val) => {
    if (val == null || val === '' || isNaN(Number(val))) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const salePrice = Number(
    group.salePrice ??
    group.representative?.pricing?.salePrice ??
    group.firstProduct?.pricing?.salePrice ??
    group.representativePrice ??
    group.minPrice ??
    0
  );
  const mrp = Number(
    group.mrp ??
    group.representative?.pricing?.mrp ??
    group.firstProduct?.pricing?.mrp ??
    0
  );
  const minPrice = Number(group.minPrice ?? 0);
  const maxPrice = Number(group.maxPrice ?? 0);
  const hasDiscount = mrp > salePrice && salePrice > 0;

  let priceDisplay = null;
  if (productCount > 1 && minPrice > 0 && maxPrice > minPrice) {
    priceDisplay = `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}`;
  } else if (salePrice > 0) {
    priceDisplay = formatMoney(salePrice);
  } else if (minPrice > 0) {
    priceDisplay = formatMoney(minPrice);
  }

  if (viewMode === 'list') {
    return (
      <article
        className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4 ${
          isSelected
            ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/30 bg-[#8b6f4e]/[0.02]'
            : 'border-stone-200'
        }`}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect?.(group);
          }}
          className="w-4 h-4 text-[#8b6f4e] rounded border-stone-300 focus:ring-[#8b6f4e] cursor-pointer accent-[#8b6f4e] shrink-0"
          title="Select group"
        />

        {/* 1st Product Image Thumbnail */}
        <div
          onClick={() => (isDraftOrApproved && onEdit ? onEdit(group) : onManage?.(group))}
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
              onClick={() => (isDraftOrApproved && onEdit ? onEdit(group) : onManage?.(group))}
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

        {/* Sale Price */}
        <div className="text-right shrink-0 px-4 min-w-[120px]">
          <p className="text-[10px] text-stone-400 uppercase font-semibold">Sale Price</p>
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-sm font-bold text-stone-900">
              {priceDisplay || <span className="text-xs text-stone-400 font-normal">No price</span>}
            </span>
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {formatMoney(mrp)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isDraftOrApproved ? (
            <>
              <EditActionButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(group);
                }}
                title="Edit Product"
              />

              <DeleteActionButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(group);
                }}
                title="Delete Product"
              />
            </>
          ) : (
            <>
              {onManage && (
                <Tooltip content="Manage Group" position="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManage(group);
                    }}
                    className="w-7 h-7 rounded-lg border border-[#8b6f4e]/30 bg-[#8b6f4e]/10 text-[#8b6f4e] hover:bg-[#8b6f4e] hover:text-white active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                    aria-label="Manage Group"
                  >
                    <HiOutlineEye className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </Tooltip>
              )}

              {isAllApproved && onDirectDraft ? (
                <Tooltip
                  content="Move all products in this group to Draft"
                  position="top"
                >
                  <button
                    type="button"
                    disabled={isDrafting}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDirectDraft(group);
                    }}
                    className="w-7 h-7 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 active:scale-95 inline-flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-2xs"
                    aria-label="Move to Draft"
                  >
                    {isDrafting ? (
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineDocumentText className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>
                </Tooltip>
              ) : onDirectApprove ? (
                <Tooltip
                  content={isAllApproved ? 'All products are approved' : 'Directly approve all products in this group'}
                  position="top"
                >
                  <button
                    type="button"
                    disabled={isApproving || isAllApproved}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDirectApprove(group);
                    }}
                    className={`w-7 h-7 rounded-lg border transition-all shadow-2xs inline-flex items-center justify-center shrink-0 ${
                      isAllApproved
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default'
                        : 'border-emerald-600 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white cursor-pointer'
                    }`}
                    aria-label={isAllApproved ? 'Approved' : 'Approve'}
                  >
                    {isApproving ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineCheckCircle className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>
                </Tooltip>
              ) : null}

              {/* Delete button if no products attached */}
              {hasNoProducts && onDelete && (
                <Tooltip content="Delete group (no products attached)" position="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(group);
                    }}
                    className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                    aria-label="Delete group"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </Tooltip>
              )}

              {/* On/Off Switch */}
              <Tooltip
                content={isActive ? 'Click to deactivate group' : 'Click to activate group'}
                position="top"
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.(group);
                  }}
                  style={isActive ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#855836)] ${isActive ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </article>
    );
  }

  // Grid View Card
  return (
    <article
      className={`bg-white border rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group ${
        isSelected
          ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/30 bg-[#8b6f4e]/[0.02]'
          : 'border-stone-200'
      }`}
    >
      <div className="flex flex-col flex-1">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.(group);
              }}
              className="w-3.5 h-3.5 text-[#8b6f4e] rounded border-stone-300 focus:ring-[#8b6f4e] cursor-pointer accent-[#8b6f4e] shrink-0"
              title="Select group"
            />
            <span
              className="text-[10.5px] font-semibold text-stone-500 font-mono truncate"
              title={group.groupCode}
            >
              {group.groupCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Product Count Round Box with luxury custom tooltip */}
            <Tooltip
              content={`${productCount} product${productCount === 1 ? '' : 's'} in this group`}
              position="bottom"
            >
              <span className="min-w-5 h-5 px-1 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-[10px] font-bold font-mono inline-flex items-center justify-center shadow-2xs shrink-0 cursor-help transition-colors">
                {productCount}
              </span>
            </Tooltip>

            {/* On/Off Toggle Switch */}
            <Tooltip
              content={isActive ? 'Click to deactivate group' : 'Click to activate group'}
              position="bottom"
            >
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus?.(group);
                }}
                style={isActive ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 1st Product Image Thumbnail */}
        <div
          onClick={() => (isDraftOrApproved && onEdit ? onEdit(group) : onManage?.(group))}
          className="relative w-full h-36 sm:h-40 xl:h-44 bg-stone-50/70 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center mb-2.5 cursor-pointer group-hover:bg-stone-50 transition-colors"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={group.groupName}
              loading="lazy"
              className="max-h-full max-w-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <IoDiamondOutline className="w-8 h-8 stroke-1 text-stone-300 group-hover:text-[#8b6f4e]/40 transition-colors" />
              <span className="text-[8px] uppercase tracking-wider text-stone-400 mt-1">No Photo</span>
            </div>
          )}
        </div>

        {/* Group Name */}
        <h3
          onClick={() => (isDraftOrApproved && onEdit ? onEdit(group) : onManage?.(group))}
          className="font-bold text-xs sm:text-[13px] text-stone-900 tracking-tight line-clamp-2 cursor-pointer hover:text-[#8b6f4e] transition-colors leading-snug min-h-[32px]"
          title={group.groupName}
        >
          {group.groupName}
        </h3>

        {/* Sale Price Display */}
        <div className="mt-1.5 pt-1 border-t border-stone-50 flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="text-xs sm:text-[13.5px] font-extrabold text-stone-900 tracking-tight">
              {priceDisplay || <span className="text-[10.5px] font-normal text-stone-400 italic">No price</span>}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-stone-400 line-through">
                {formatMoney(mrp)}
              </span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-500 bg-stone-100 px-1 py-0.5 rounded shrink-0">
            {productCount > 1 && minPrice !== maxPrice ? 'Range' : 'Sale Price'}
          </span>
        </div>
      </div>
    </article>
  );
}
