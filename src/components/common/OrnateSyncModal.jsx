import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  IoClose,
  IoRefreshOutline,
  IoCheckmark,
  IoLayersOutline,
  IoSearchOutline,
  IoAlertCircleOutline,
  IoRemove,
  IoScaleOutline,
  IoArrowForward,
  IoCubeOutline,
} from 'react-icons/io5';
import api from '../../api/axios';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

const OrnateSyncModal = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [erpCategories, setErpCategories] = useState([]);
  const [erpCategoriesTotal, setErpCategoriesTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Active category opened in the dedicated Pop-up Modal
  const [activeCategory, setActiveCategory] = useState(null);
  const [popupSearchTerm, setPopupSearchTerm] = useState('');
  const [popupFilter, setPopupFilter] = useState('all'); // 'all' | 'selected' | 'unselected'

  // Fetch categories & products from Ornate ERP
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      try {
        res = await api.get('/ornate/categories', { timeout: 60000 });
      } catch (catErr) {
        // Fallback to /ornate/erp-categories if needed
        res = await api.get('/ornate/erp-categories', { timeout: 60000 });
      }

      const data = res.data?.data || res.data || {};
      const categories = data.categories || [];
      const total = data.totalProducts ?? categories.reduce((sum, c) => sum + (c.count || c.products?.length || 0), 0);

      setErpCategories(categories);
      setErpCategoriesTotal(total);

      // Pre-select all products once ERP data is loaded
      const allIds = [];
      categories.forEach((cat) => {
        (cat.products || []).forEach((p) => {
          if (p.uniqueLabelID) allIds.push(p.uniqueLabelID);
        });
      });
      setSelectedProductIds(allIds);
    } catch (err) {
      console.error('Failed to load Ornate categories:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to connect to Ornate ERP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    } else {
      setActiveCategory(null);
      setSearchTerm('');
      setPopupSearchTerm('');
      setPopupFilter('all');
    }
  }, [isOpen, fetchCategories]);

  // Handle escape key (closes popup first if open, else closes main modal)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSyncing) {
        if (activeCategory) {
          setActiveCategory(null);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSyncing, activeCategory, onClose]);

  // Filter categories based on search term in main modal
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return erpCategories;
    const q = searchTerm.toLowerCase();

    return erpCategories
      .map((cat) => {
        const catMatches = cat.name?.toLowerCase().includes(q);
        const matchingProducts = (cat.products || []).filter(
          (p) =>
            p.itemName?.toLowerCase().includes(q) ||
            p.barcodeNo?.toLowerCase().includes(q) ||
            p.labelNo?.toLowerCase().includes(q) ||
            p.uniqueLabelID?.toLowerCase().includes(q) ||
            (p.metalName && p.metalName.toLowerCase().includes(q))
        );

        return {
          ...cat,
          matchingProductCount: matchingProducts.length,
          isSearchMatch: catMatches || matchingProducts.length > 0,
        };
      })
      .filter((cat) => cat.isSearchMatch);
  }, [erpCategories, searchTerm]);

  // Toggle all products within a specific category
  const handleToggleCategory = (category, e) => {
    if (e) e.stopPropagation();
    if (isSyncing) return;

    const catProductIds = (category.products || []).map((p) => p.uniqueLabelID).filter(Boolean);
    const allSelected =
      catProductIds.length > 0 && catProductIds.every((id) => selectedProductIds.includes(id));

    if (allSelected) {
      // Deselect all products in this category
      setSelectedProductIds((prev) => prev.filter((id) => !catProductIds.includes(id)));
    } else {
      // Select all products in this category
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...catProductIds])));
    }
  };

  // Toggle individual product selection
  const handleToggleProduct = (productId) => {
    if (isSyncing || !productId) return;
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Select all products across all categories
  const handleSelectAll = () => {
    if (isSyncing) return;
    const allIds = [];
    erpCategories.forEach((cat) => {
      (cat.products || []).forEach((p) => {
        if (p.uniqueLabelID) allIds.push(p.uniqueLabelID);
      });
    });
    setSelectedProductIds(allIds);
  };

  // Deselect all products
  const handleDeselectAll = () => {
    if (isSyncing) return;
    setSelectedProductIds([]);
  };

  // Trigger sync for selected products
  const handleStartSync = async () => {
    if (selectedProductIds.length === 0 || isSyncing) return;
    try {
      setIsSyncing(true);
      toast.loading(`Syncing ${selectedProductIds.length} products into catalog...`, {
        id: 'ornate-modal-sync',
      });

      const res = await api.post(
        '/ornate/sync-labels',
        { productIds: selectedProductIds },
        { timeout: 180000 }
      );

      const msg = res.data?.message || `Successfully synced ${selectedProductIds.length} products!`;
      toast.success(msg, { id: 'ornate-modal-sync' });

      onSyncComplete?.();
      onClose?.();
    } catch (err) {
      console.error('Failed to sync selected Ornate products:', err);
      const errMsg =
        err.response?.data?.message || err.message || 'Failed to sync selected products';
      toast.error(errMsg, { id: 'ornate-modal-sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Open the product pop-up for a category
  const handleOpenCategoryProducts = (category) => {
    setActiveCategory(category);
    setPopupSearchTerm('');
    setPopupFilter('all');
  };

  if (!isOpen) return null;

  const totalPossibleProducts =
    erpCategoriesTotal ||
    erpCategories.reduce((sum, c) => sum + (c.products?.length || c.count || 0), 0);

  // Products filtered inside the active category popup
  const activeCategoryProducts = activeCategory?.products || [];
  const selectedInActiveCat = activeCategoryProducts.filter((p) =>
    selectedProductIds.includes(p.uniqueLabelID)
  );
  const unselectedInActiveCat = activeCategoryProducts.filter(
    (p) => !selectedProductIds.includes(p.uniqueLabelID)
  );

  const filteredPopupProducts = activeCategoryProducts.filter((p) => {
    // Filter tab
    if (popupFilter === 'selected' && !selectedProductIds.includes(p.uniqueLabelID)) return false;
    if (popupFilter === 'unselected' && selectedProductIds.includes(p.uniqueLabelID)) return false;

    // Search query
    if (popupSearchTerm.trim()) {
      const q = popupSearchTerm.toLowerCase();
      const match =
        p.itemName?.toLowerCase().includes(q) ||
        p.barcodeNo?.toLowerCase().includes(q) ||
        p.labelNo?.toLowerCase().includes(q) ||
        p.uniqueLabelID?.toLowerCase().includes(q) ||
        (p.metalName && p.metalName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/65 backdrop-blur-xs transition-opacity"
        onClick={() => !isSyncing && onClose?.()}
      />

      {/* Main Modal Container */}
      <div className="relative bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 bg-linear-to-r from-stone-50 via-white to-amber-50/40 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 flex items-center justify-center text-[#8b6f4e] shrink-0 shadow-xs">
              <IoCubeOutline className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">
                  Sync Products from Ornate ERP
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8b6f4e]/10 text-[#8b6f4e] border border-[#8b6f4e]/20">
                  {totalPossibleProducts} Total Products
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                  {erpCategories.length} Categories
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Select category boxes to import in bulk, or open any category box to pick individual items.
              </p>
            </div>
          </div>

          <button
            onClick={() => !isSyncing && onClose?.()}
            disabled={isSyncing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer"
            title="Close"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Search & Global Actions Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search category name, item name, barcode, metal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading || isSyncing}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/10 transition-all placeholder:text-gray-400 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={loading || isSyncing || selectedProductIds.length === totalPossibleProducts}
              className="px-3 py-1.5 text-xs font-semibold text-[#8b6f4e] hover:text-[#785e40] bg-[#8b6f4e]/10 hover:bg-[#8b6f4e]/15 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              Select All ({totalPossibleProducts})
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={loading || isSyncing || selectedProductIds.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Content Body: Responsive Grid of Category Boxes */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-stone-50/40">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <IoRefreshOutline className="w-9 h-9 text-[#8b6f4e] animate-spin" />
              <div>
                <p className="text-sm font-bold text-gray-800">Connecting to Ornate ERP...</p>
                <p className="text-xs text-gray-500 mt-1">Fetching catalogue categories and live item tags</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
              <IoAlertCircleOutline className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm">Failed to load catalogue from ERP</p>
                <p className="mt-1 text-red-600">{String(error)}</p>
                <button
                  type="button"
                  onClick={fetchCategories}
                  className="mt-3 px-3.5 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-xs cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              <IoCubeOutline className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              No categories or products found matching "{searchTerm}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => {
                const catProducts = category.products || [];
                const selectedInCat = catProducts.filter((p) =>
                  selectedProductIds.includes(p.uniqueLabelID)
                );
                const isAllSelected =
                  catProducts.length > 0 && selectedInCat.length === catProducts.length;
                const isPartiallySelected = selectedInCat.length > 0 && !isAllSelected;

                return (
                  <div
                    key={category.name}
                    onClick={() => handleOpenCategoryProducts(category)}
                    className={`group relative rounded-2xl border transition-all duration-200 bg-white p-4.5 flex flex-col justify-between hover:shadow-md cursor-pointer select-none ${
                      selectedInCat.length > 0
                        ? 'border-[#8b6f4e]/50 ring-1 ring-[#8b6f4e]/15 bg-linear-to-b from-amber-50/20 via-white to-white'
                        : 'border-gray-200/90 hover:border-[#8b6f4e]/40'
                    }`}
                  >
                    {/* Top Row: Checkbox + Selection Status Badge */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleCategory(category, e)}
                        className="flex items-center gap-2 text-left cursor-pointer group/btn"
                        title={isAllSelected ? 'Deselect Category' : 'Select All in Category'}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            isAllSelected
                              ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                              : isPartiallySelected
                              ? 'bg-[#8b6f4e]/20 border-[#8b6f4e] text-[#8b6f4e]'
                              : 'border-gray-300 bg-white group-hover/btn:border-[#8b6f4e]/60'
                          }`}
                        >
                          {isAllSelected && <IoCheckmark size={14} className="stroke-[3]" />}
                          {isPartiallySelected && <IoRemove size={14} className="stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-medium text-gray-500 group-hover/btn:text-gray-900 transition-colors">
                          {isAllSelected ? 'Selected' : isPartiallySelected ? 'Partial' : 'Select all'}
                        </span>
                      </button>

                      {/* Selected Count Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                          isAllSelected
                            ? 'bg-[#8b6f4e] text-white shadow-xs'
                            : isPartiallySelected
                            ? 'bg-[#8b6f4e]/15 text-[#8b6f4e] font-bold'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {selectedInCat.length}/{catProducts.length} selected
                      </span>
                    </div>

                    {/* Middle Section: Category Name, Total Products & Sample Types */}
                    <div className="py-3.5 space-y-2 min-w-0">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#8b6f4e] transition-colors truncate">
                          {category.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <IoCubeOutline size={12} className="text-gray-400" />
                          <span>{catProducts.length} ERP Products</span>
                          {category.matchingProductCount > 0 && searchTerm && (
                            <span className="text-[#8b6f4e] font-semibold">
                              • {category.matchingProductCount} matching search
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Sample Types / Sub-type Chips */}
                      {category.itemTypes && category.itemTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {category.itemTypes.slice(0, 3).map((type, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 group-hover:bg-amber-50/70 group-hover:text-[#8b6f4e] transition-colors truncate max-w-[130px]"
                            >
                              {type}
                            </span>
                          ))}
                          {category.itemTypes.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-400">
                              +{category.itemTypes.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: View Products Action Button */}
                    <div className="pt-2">
                      <div className="w-full py-2 px-3 rounded-xl bg-gray-50 group-hover:bg-[#8b6f4e]/10 text-gray-700 group-hover:text-[#8b6f4e] font-semibold text-xs flex items-center justify-between transition-all border border-gray-100 group-hover:border-[#8b6f4e]/20 shadow-xs">
                        <span className="flex items-center gap-1.5">
                          <IoLayersOutline size={13} className="text-[#8b6f4e] shrink-0" />
                          <span>View Products ({catProducts.length})</span>
                        </span>
                        <IoArrowForward
                          size={13}
                          className="text-gray-400 group-hover:text-[#8b6f4e] group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Summary Info */}
        {!loading && !error && (
          <div className="px-6 py-3 bg-stone-50/80 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-2 h-2 rounded-full bg-[#8b6f4e] animate-pulse" />
              <span className="font-bold text-gray-900">
                {selectedProductIds.length} of {totalPossibleProducts}
              </span>
              <span>products selected to import</span>
            </div>
            <div className="text-[#8b6f4e] font-bold">
              {selectedProductIds.length === 0
                ? 'No products selected'
                : 'Ready to sync selected items'}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4.5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartSync}
            disabled={selectedProductIds.length === 0 || loading || isSyncing}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-md shadow-[#8b6f4e]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <IoRefreshOutline size={15} className="animate-spin" />
                <span>Syncing {selectedProductIds.length} Products...</span>
              </>
            ) : (
              <>
                <IoRefreshOutline size={15} />
                <span>Sync Selected ({selectedProductIds.length} Products)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY PRODUCTS POP-UP MODAL                                            */}
      {/* ========================================================================= */}
      {activeCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop for the pop-up */}
          <div
            className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveCategory(null)}
          />

          {/* Pop-up Container */}
          <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] z-10">
            {/* Pop-up Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-stone-50 via-white to-amber-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 flex items-center justify-center text-[#8b6f4e] shrink-0">
                  <IoLayersOutline className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{activeCategory.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b6f4e]/15 text-[#8b6f4e]">
                      {selectedInActiveCat.length} of {activeCategoryProducts.length} selected
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Select individual jewellery items to include in ERP sync.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close Pop-up"
              >
                <IoClose size={18} />
              </button>
            </div>

            {/* Pop-up Search & Filters Bar */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center justify-between gap-3">
              {/* Local Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder={`Search within ${activeCategory.name}...`}
                  value={popupSearchTerm}
                  onChange={(e) => setPopupSearchTerm(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/10 transition-all placeholder:text-gray-400 shadow-xs"
                />
              </div>

              {/* Filter Tabs: All, Selected, Unselected */}
              <div className="flex items-center bg-gray-200/70 p-0.5 rounded-lg text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setPopupFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    popupFilter === 'all'
                      ? 'bg-white text-gray-900 font-bold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({activeCategoryProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPopupFilter('selected')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    popupFilter === 'selected'
                      ? 'bg-white text-[#8b6f4e] font-bold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Selected ({selectedInActiveCat.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPopupFilter('unselected')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    popupFilter === 'unselected'
                      ? 'bg-white text-gray-900 font-bold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unselected ({unselectedInActiveCat.length})
                </button>
              </div>

              {/* Select All / Deselect All for this category */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const catIds = activeCategoryProducts
                      .map((p) => p.uniqueLabelID)
                      .filter(Boolean);
                    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...catIds])));
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-[#8b6f4e] hover:text-[#785e40] hover:bg-[#8b6f4e]/10 rounded-md transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const catIds = activeCategoryProducts
                      .map((p) => p.uniqueLabelID)
                      .filter(Boolean);
                    setSelectedProductIds((prev) => prev.filter((id) => !catIds.includes(id)));
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Pop-up Products List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2 bg-stone-50/30">
              {filteredPopupProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No products found matching "{popupSearchTerm}" in this category.
                </div>
              ) : (
                filteredPopupProducts.map((product) => {
                  const isProdSelected = selectedProductIds.includes(product.uniqueLabelID);

                  return (
                    <div
                      key={product.uniqueLabelID}
                      onClick={() => handleToggleProduct(product.uniqueLabelID)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isProdSelected
                          ? 'bg-white border-[#8b6f4e]/50 shadow-xs ring-1 ring-[#8b6f4e]/10'
                          : 'bg-white/90 border-gray-200 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      {/* Product Checkbox + Name + Barcode / Metal */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            isProdSelected
                              ? 'bg-[#8b6f4e] border-[#8b6f4e] text-white shadow-xs'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isProdSelected && <IoCheckmark size={12} className="stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {product.itemName || 'Jewellery Item'}
                            </p>
                            {product.metalName && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                                {product.metalName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                            <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200/60">
                              {product.barcodeNo || product.uniqueLabelID}
                            </span>
                            {product.labelNo && (
                              <span className="text-gray-500">Label: {product.labelNo}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Weight & Price */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 mt-0.5">
                          <IoScaleOutline size={11} className="text-gray-400" />
                          <span>Gross: {product.grossWt || 0}g</span>
                          {product.netWt > 0 && product.netWt !== product.grossWt && (
                            <span>• Net: {product.netWt}g</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pop-up Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">{selectedInActiveCat.length}</span> of{' '}
                {activeCategoryProducts.length} items selected in this category
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrnateSyncModal;
