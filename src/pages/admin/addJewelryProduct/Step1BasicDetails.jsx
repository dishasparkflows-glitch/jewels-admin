import React from 'react';
import CategorySelect from '../../../components/common/CategorySelect';
import MenuItemSelect from '../../../components/common/MenuItemSelect';
import Dropdown from '../../../components/common/Dropdown';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function Step1BasicDetails() {
  const {
    basicDetails,
    setBasicDetails,
    birthstoneOptions,
    selectedCollectionIds,
    setSelectedCollectionIds,
    categoryList,
    menuItemIds,
    setMenuItemIds,
    autoOpenMenu,
    setAutoOpenMenu,
    saving,
    promoBannerOptions,
    categorySizes,
    selectedSizeIds,
    setSelectedSizeIds,
    loadingSizes,
  } = useAddJewelryProductContext();

  return (
    <div className="bg-white rounded-2xl border border-[#eee8df] p-6 shadow-xs space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
        <div className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          1
        </div>
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Basic Product Information
          </h3>
          <p className="text-xs text-stone-500">
            Enter the master product name, SKU prefix and category categorization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
            Product Title <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={basicDetails.title}
            onChange={(e) =>
              setBasicDetails((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="e.g. Royal Diamond Solitaire Ring"
            className="w-full h-[42px] px-3.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
            Master SKU Prefix <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={basicDetails.sku}
            onChange={(e) =>
              setBasicDetails((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))
            }
            placeholder="NR-RING-001"
            className="w-full h-[42px] px-3.5 text-xs font-mono uppercase font-semibold text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
            Platform Visibility
          </label>
          <div className="flex items-center gap-5 h-[42px] px-3.5 rounded-xl border border-[#d6cfc2] bg-white shadow-2xs">
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-[13px] font-medium text-stone-700 select-none">
              <input
                type="checkbox"
                checked={basicDetails.showInApp}
                onChange={(e) =>
                  setBasicDetails((prev) => ({ ...prev, showInApp: e.target.checked }))
                }
                className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
              />
              <span>App</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-[13px] font-medium text-stone-700 select-none">
              <input
                type="checkbox"
                checked={basicDetails.showOnWeb}
                onChange={(e) =>
                  setBasicDetails((prev) => ({ ...prev, showOnWeb: e.target.checked }))
                }
                className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
              />
              <span>Web</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">Gender Target</label>
          <Dropdown
            size="field"
            variant="input"
            multiple
            value={basicDetails.gender}
            onChange={(val) =>
              setBasicDetails((prev) => ({ ...prev, gender: Array.isArray(val) ? val : [val].filter(Boolean) }))
            }
            placeholder="Select Gender"
            options={[
              { value: 'Female', label: 'Female' },
              { value: 'Male', label: 'Male' },
              { value: 'Unisex', label: 'Unisex' },
              { value: 'Kids', label: 'Kids' },
            ]}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">Birthstone</label>
          <Dropdown
            size="field"
            variant="input"
            multiple
            value={basicDetails.birthMonth}
            onChange={(val) =>
              setBasicDetails((prev) => ({
                ...prev,
                birthMonth: Array.isArray(val) ? val : [val].filter(Boolean),
              }))
            }
            placeholder="Select Birthstone"
            options={birthstoneOptions}
            className="w-full"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Category <span className="text-rose-500 font-bold">*</span>
            </label>
            <CategorySelect
              categoryId={basicDetails.category}
              selectedCollectionIds={selectedCollectionIds}
              categories={categoryList}
              onChangeCategory={(catId) => {
                if (catId !== basicDetails.category) {
                  setMenuItemIds([]);
                  setBasicDetails((prev) => ({
                    ...prev,
                    category: catId,
                    promoBanner: [],
                  }));
                } else {
                  setBasicDetails((prev) => ({
                    ...prev,
                    category: catId,
                  }));
                }
                if (catId) setAutoOpenMenu(true);
              }}
              onChangeCollections={setSelectedCollectionIds}
              placeholder="Select Category"
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">Menu Items</label>
            <MenuItemSelect
              key={basicDetails.category}
              categoryId={basicDetails.category}
              value={menuItemIds}
              onChange={setMenuItemIds}
              disabled={saving}
              autoOpen={autoOpenMenu}
              onOpenChange={(isOpen) => {
                if (!isOpen) setAutoOpenMenu(false);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Promo Banner
            </label>
            <Dropdown
              size="field"
              variant="input"
              multiple
              value={basicDetails.promoBanner}
              onChange={(val) =>
                setBasicDetails((prev) => ({
                  ...prev,
                  promoBanner: Array.isArray(val) ? val : [val].filter(Boolean),
                }))
              }
              placeholder={
                !basicDetails.category
                  ? 'Select Category first'
                  : promoBannerOptions.length === 0
                  ? 'No promo banners'
                  : 'Select Promo Banner'
              }
              disabled={saving || !basicDetails.category || promoBannerOptions.length === 0}
              options={promoBannerOptions}
              className="w-full"
            />
          </div>
        </div>

        {/* Available Sizes for Selected Category */}
        {basicDetails.category && (
          <div className="sm:col-span-2 lg:col-span-4 space-y-2 rounded-2xl border border-stone-200/90 bg-[#fdfcfb] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📏</span>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Available Sizes
                </h4>
                {categorySizes.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] text-[#8b6f4e] border border-[#d9c4a8]/60">
                    {selectedSizeIds.length} of {categorySizes.length} Selected
                  </span>
                )}
              </div>
              {categorySizes.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSizeIds(categorySizes.map((s) => String(s._id)))}
                    className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSizeIds([])}
                    className="text-[11px] font-semibold text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {loadingSizes ? (
              <p className="text-xs text-stone-400 font-medium py-2">Loading sizes for category...</p>
            ) : categorySizes.length === 0 ? (
              <p className="text-xs text-stone-400 font-medium py-1">
                No sizes configured for this category yet. You can add them under Catalog &rarr; Size.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {categorySizes.map((size) => {
                  const sizeIdStr = String(size._id);
                  const isChecked = selectedSizeIds.includes(sizeIdStr);
                  return (
                    <button
                      type="button"
                      key={sizeIdStr}
                      onClick={() => {
                        setSelectedSizeIds((prev) =>
                          isChecked
                            ? prev.filter((id) => id !== sizeIdStr)
                            : [...prev, sizeIdStr]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#8b6f4e] text-white border-[#8b6f4e] shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-stone-900">Luxury Description</label>
          <textarea
            rows={4}
            value={basicDetails.description}
            onChange={(e) =>
              setBasicDetails((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe craftsmanship, finish and diamond brilliance..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all leading-relaxed shadow-2xs placeholder:text-stone-400"
          />
        </div>

        {/* Social Proof & Urgency (Demo Metrics) */}
        <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-stone-200/90 bg-[#fdfcfb] p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Social Proof & Urgency (Demo Metrics)
              </h4>
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Set product-specific sold and review counts displayed under the title on the storefront.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                <label className="text-xs font-bold text-stone-700">
                  Sold Count
                </label>
                <span className="text-[10px] text-stone-400 font-medium">· Displayed as &apos;X sold in last 3 hours&apos;</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔥</span>
                <input
                  type="number"
                  min="0"
                  value={basicDetails.soldCount}
                  onChange={(e) => setBasicDetails((prev) => ({ ...prev, soldCount: e.target.value }))}
                  placeholder="e.g. 24"
                  className="w-full h-10 pl-8 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                <label className="text-xs font-bold text-stone-700">
                  Review Count
                </label>
                <span className="text-[10px] text-stone-400 font-medium">· Displayed as &apos;★★★★★ X reviews&apos;</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">★</span>
                <input
                  type="number"
                  min="0"
                  value={basicDetails.reviewCount}
                  onChange={(e) => setBasicDetails((prev) => ({ ...prev, reviewCount: e.target.value }))}
                  placeholder="e.g. 13"
                  className="w-full h-10 pl-8 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
