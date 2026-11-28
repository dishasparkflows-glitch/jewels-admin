import CategorySelect from '../../../components/common/CategorySelect';
import MenuItemSelect from '../../../components/common/MenuItemSelect';
import Dropdown from '../../../components/common/Dropdown';
import { useAddJewelryProductContext } from './AddJewelryProductContext';

export default function Step1BasicDetails() {
  const {
    basicDetails,
    setBasicDetails,
    gemstoneTypeOptions,
    gemstoneShapeOptions,
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
    <div className="bg-white rounded-2xl border border-[#eee8df] p-4 sm:p-6 shadow-xs space-y-5 animate-fadeIn">
      {/* Main Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3.5">
          <div
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="w-8 h-8 rounded-full bg-[#8b6f4e] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
          >
            1
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Basic Product Information
            </h3>
            <p className="text-xs text-stone-500">
              Organized into core identity, catalog placement, and optional attributes.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Group 1: Product Identity & Description ─── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-stone-400/80 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] shrink-0">
              1
            </span>
            <h4 className="text-xs font-bold text-stone-900">Product Identity</h4>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            Required
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-1.5">
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

          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Description
            </label>
            <textarea
              rows={3}
              value={basicDetails.description}
              onChange={(e) =>
                setBasicDetails((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe craftsmanship, finish and diamond brilliance..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all leading-relaxed shadow-2xs placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>

      {/* ─── Group 2: Classification, Navigation, Visibility & Gemstone Attributes ─── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-stone-400/80 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] shrink-0">
              2
            </span>
            <h4 className="text-xs font-bold text-stone-900">Category, Placement &amp; Attributes</h4>
          </div>
        </div>

        {/* Row 1: Category, Menu Items, Gender Target */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
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
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Menu Items
            </label>
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

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Gender Target
            </label>
            <Dropdown
              size="field"
              variant="input"
              multiple
              value={basicDetails.gender}
              onChange={(val) =>
                setBasicDetails((prev) => ({
                  ...prev,
                  gender: Array.isArray(val) ? val : [val].filter(Boolean),
                }))
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
        </div>

        {/* Row 2: Platform Visibility, Promo Banner, Gemstone Type, Gemstone Shape */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Platform Visibility
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2 h-[42px] px-2.5 rounded-xl border border-[#d6cfc2] bg-stone-50/70 shadow-2xs">
              <label className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-white border border-stone-200/80 cursor-pointer text-xs font-semibold text-stone-700 select-none hover:border-[#8b6f4e]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={basicDetails.showInApp}
                  onChange={(e) =>
                    setBasicDetails((prev) => ({ ...prev, showInApp: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                />
                <span>App</span>
              </label>

              <label className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-white border border-stone-200/80 cursor-pointer text-xs font-semibold text-stone-700 select-none hover:border-[#8b6f4e]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={basicDetails.showOnWeb}
                  onChange={(e) =>
                    setBasicDetails((prev) => ({ ...prev, showOnWeb: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                />
                <span>Web</span>
              </label>
            </div>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Gemstone Type
            </label>
            <Dropdown
              size="field"
              variant="input"
              multiple
              value={basicDetails.gemstoneTypes}
              onChange={(val) =>
                setBasicDetails((prev) => ({
                  ...prev,
                  gemstoneTypes: Array.isArray(val) ? val : [val].filter(Boolean),
                }))
              }
              placeholder="Select Gemstone Type"
              options={gemstoneTypeOptions}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1 h-5">
              Gemstone Shape
            </label>
            <Dropdown
              size="field"
              variant="input"
              multiple
              value={basicDetails.gemstoneShapes}
              onChange={(val) =>
                setBasicDetails((prev) => ({
                  ...prev,
                  gemstoneShapes: Array.isArray(val) ? val : [val].filter(Boolean),
                }))
              }
              placeholder="Select Gemstone Shape"
              options={gemstoneShapeOptions}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ─── Group 3: Product Sizing ─── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-stone-400/80 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#faf5ee] border border-[#e8d8c0] text-[#8b6f4e] flex items-center justify-center font-bold text-[10px] shrink-0">
              3
            </span>
            <h4 className="text-xs font-bold text-stone-900">Product Sizes</h4>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
            Optional
          </span>
        </div>

        {/* Available Sizes for Selected Category */}
        {basicDetails.category ? (
          <div className="space-y-2.5 rounded-xl border border-stone-300 bg-[#fdfcfb] p-3.5 sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📏</span>
                <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Available Sizes
                </h5>
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
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-700 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {loadingSizes ? (
              <p className="text-xs text-stone-400 font-medium py-1">Loading sizes for category...</p>
            ) : categorySizes.length === 0 ? (
              <p className="text-xs text-stone-400 font-medium py-1">
                No sizes configured for this category yet. You can add them under Catalog &rarr; Size.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-0.5">
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
                      style={
                        isChecked
                          ? {
                              backgroundColor: 'var(--theme-primary, #8b6f4e)',
                              borderColor: 'var(--theme-primary, #8b6f4e)',
                            }
                          : undefined
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#8b6f4e] text-white border-[#8b6f4e] shadow-xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-500">
            Select a <strong>Category</strong> above to view and assign available sizes for this product.
          </div>
        )}
      </div>
    </div>
  );
}
