import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiDotsVertical,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineChevronUp,
  HiOutlinePencilAlt,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineChevronRight,
  HiOutlineFilter,
} from 'react-icons/hi';
import api from '../../api/axios';

export default function CategoryFiltersView() {
  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState(null);
  const [openDefaultValueId, setOpenDefaultValueId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTitleId, setEditTitleId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');

  // Close menus and modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown-container]')) {
        setOpenActionId(null);
        setOpenDefaultValueId(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setOpenActionId(null);
        setOpenDefaultValueId(null);
        setEditTitleId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 1. Load All Filters along with complete Category configurations
  const loadFiltersData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/filters/admin/all');
      const items = res.data?.data || [];
      setFilters(items);

      if (items.length > 0) {
        setSelectedFilter((prev) => {
          if (prev) {
            const found = items.find((f) => f.filterId === prev.filterId);
            if (found) return found;
          }
          return items[0];
        });
      }
    } catch (err) {
      console.error('Failed to load filters:', err);
      toast.error('Failed to load filters configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiltersData();
  }, []);

  // Persist category changes for the currently selected filter
  const saveCategoryChanges = async (updatedCategories, successMsg = 'Category settings updated') => {
    if (!selectedFilter) return;
    try {
      const payload = {
        categories: updatedCategories.map((c, i) => ({
          categoryId: c.categoryId,
          categorySlug: c.categorySlug,
          enabled: c.enabled !== false,
          order: i + 1,
          customTitle: c.customTitle || undefined,
          defaultValue: c.defaultValue || selectedFilter.defaultValue || selectedFilter.title,
        })),
      };

      await api.put(`/filters/${selectedFilter.filterId}/categories`, payload);
      toast.success(successMsg, { id: 'category-filter-save', duration: 1500 });

      // Update in local state
      setFilters((prev) =>
        prev.map((f) =>
          f.filterId === selectedFilter.filterId ? { ...f, categories: updatedCategories } : f
        )
      );
      setSelectedFilter((prev) => ({ ...prev, categories: updatedCategories }));
    } catch (err) {
      console.error('Failed to save category filter settings:', err);
      toast.error('Failed to update category filter settings');
    }
  };

  // Toggle filter enabled/disabled for a specific category
  const handleToggleCategory = (categoryId) => {
    if (!selectedFilter?.categories) return;
    const nextCategories = selectedFilter.categories.map((c) =>
      c.categoryId === categoryId ? { ...c, enabled: !c.enabled } : c
    );
    saveCategoryChanges(nextCategories, 'Category visibility updated');
  };

  // Move filter order up / down in the sidebar
  const handleMoveFilterOrder = async (e, index, direction) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filters.length) return;

    const next = [...filters];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    const reindexed = next.map((f, i) => ({ ...f, order: i + 1 }));
    setFilters(reindexed);

    try {
      await api.put('/filters/admin/reorder', {
        filterIds: reindexed.map((f) => f.filterId),
      });
      toast.success('Filter order updated', { id: 'filter-reorder', duration: 1500 });
    } catch (err) {
      console.error('Failed to reorder filters:', err);
      toast.error('Failed to update filter order');
      loadFiltersData();
    }
  };

  // Move via 3-dots menu
  const handleMoveOrder = (index, direction) => {
    if (!selectedFilter?.categories) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedFilter.categories.length) return;

    const next = [...selectedFilter.categories];
    const temp = next[index];
    next[index] = next[newIndex];
    next[newIndex] = temp;
    const reindexed = next.map((c, i) => ({ ...c, order: i + 1 }));
    saveCategoryChanges(reindexed, 'Category display order updated');
    setOpenActionId(null);
  };

  // Set default value for a category
  const handleSetDefaultValue = (categoryId, val) => {
    if (!selectedFilter?.categories) return;
    const nextCategories = selectedFilter.categories.map((c) =>
      c.categoryId === categoryId ? { ...c, defaultValue: val } : c
    );
    saveCategoryChanges(nextCategories, 'Default value updated');
    setOpenDefaultValueId(null);
  };

  // Save custom title for a category
  const handleSaveTitle = (categoryId) => {
    if (!selectedFilter?.categories) return;
    const nextCategories = selectedFilter.categories.map((c) =>
      c.categoryId === categoryId ? { ...c, customTitle: tempTitle.trim() } : c
    );
    saveCategoryChanges(nextCategories, 'Category display title updated');
    setEditTitleId(null);
    setTempTitle('');
  };

  // Filtered filters for left sidebar search
  const filteredFilters = filters.filter((f) =>
    (f.title || '').toLowerCase().includes(filterSearch.toLowerCase().trim()) ||
    (f.key || '').toLowerCase().includes(filterSearch.toLowerCase().trim())
  );

  const categoriesForSelectedFilter = selectedFilter?.categories || [];
  const enabledCategoryCount = categoriesForSelectedFilter.filter((c) => c.enabled).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-6">
      {/* ── 2. Page Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Category Filters
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-500 mt-1">
            Manage the order, visibility, and default settings for filters that appear on the storefront category pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* + Add Filter Button (Matches Target Screenshot) */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
            className="inline-flex items-center gap-2 h-[42px] px-4.5 sm:px-5 rounded-xl text-white text-xs sm:text-[13.5px] font-bold tracking-wide transition-all shadow-xs hover:shadow hover:brightness-95 active:scale-[0.98] cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add Filter</span>
          </button>
        </div>
      </div>

      {/* ── 3. Main Workspace: Filters Sidebar (Left) + Categories Table (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Sidebar: Filters Name List (3 of 12) ── */}
        <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <HiOutlineFilter className="w-4 h-4 text-[#8c6b45]" />
              <h2 className="text-sm font-bold tracking-tight text-stone-900">Filters</h2>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full font-mono">
              {filters.length}
            </span>
          </div>

          {/* Filter Search Input */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search filters..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#8c6b45] focus:bg-white transition-all"
            />
          </div>

          {/* Filters List */}
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-0.5">
            {loading ? (
              <div className="py-10 text-center text-xs text-stone-400">Loading filters…</div>
            ) : filteredFilters.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No filters found.</div>
            ) : (
              filteredFilters.map((flt, idx) => {
                const isSelected = selectedFilter?.filterId === flt.filterId;
                const activeCatsCount = (flt.categories || []).filter((c) => c.enabled).length;

                return (
                  <div
                    key={flt.filterId}
                    onClick={() => setSelectedFilter(flt)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border border-[#eadbcc] bg-[#faf6f1] text-stone-900 font-bold shadow-2xs'
                        : 'border border-stone-150 hover:border-stone-200 hover:bg-stone-50/80 text-stone-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Serial Number (1, 2, 3, 4, 5, 6, 7, 8) */}
                      <span className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200/90 flex items-center justify-center text-[11px] font-mono font-bold text-stone-700 shrink-0">
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span className="truncate block font-semibold text-stone-900">
                          {flt.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                              flt.type === 'range'
                                ? 'bg-[#EBF3FB] text-[#2F73B8]'
                                : 'bg-[#F7EFE6] text-[#8c6b45]'
                            }`}
                          >
                            {flt.type}
                          </span>
                          <span className="text-[10.5px] font-mono text-stone-400 truncate">
                            {activeCatsCount} cats
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Up & Down Order Reorder Arrows + Chevron Indicator */}
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => handleMoveFilterOrder(e, idx, 'up')}
                          title="Move order up"
                          className="p-0.5 text-stone-400 hover:text-[#8c6b45] hover:bg-stone-200/60 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-stone-300 transition cursor-pointer"
                        >
                          <HiOutlineChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === filters.length - 1}
                          onClick={(e) => handleMoveFilterOrder(e, idx, 'down')}
                          title="Move order down"
                          className="p-0.5 text-stone-400 hover:text-[#8c6b45] hover:bg-stone-200/60 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-stone-300 transition cursor-pointer"
                        >
                          <HiOutlineChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <HiOutlineChevronRight
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#8c6b45]' : 'text-stone-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right Workspace: Category Name List for Selected Filter (9 of 12) ── */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/90 overflow-hidden">
            {/* Card Header: Category Availability + Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:px-6 border-b border-stone-150 bg-[#FCFBF9]">
              <div className="flex items-center gap-3.5">
                {/* Filter Icon in Rounded Beige Container */}
                <div className="h-10 w-10 rounded-xl bg-[#F6F1EA] border border-[#EBDDCB] flex items-center justify-center text-[#8c6b45] shrink-0">
                  <HiOutlineFilter className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-stone-900 tracking-tight">
                    Category Availability & Settings
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Configure filter settings for <span className="font-semibold text-stone-700 font-serif">"{selectedFilter?.title || 'Filter'}"</span> across categories.
                  </p>
                </div>
              </div>

              {/* Right Status Indicator: e.g. 5 of 5 Categories Enabled */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-stone-800">
                  {enabledCategoryCount} of {categoriesForSelectedFilter.length} Categories Enabled
                </span>
              </div>
            </div>

            {/* ── Category Rows List (Right Side) ── */}
            {loading ? (
              <div className="py-16 text-center text-xs text-stone-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#8c6b45] border-t-transparent rounded-full animate-spin mx-auto" />
                <span>Loading category configurations…</span>
              </div>
            ) : categoriesForSelectedFilter.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400">
                No categories available.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {categoriesForSelectedFilter.map((cat, index) => {
                  const isFirst = index === 0;
                  const isLast = index === categoriesForSelectedFilter.length - 1;

                  return (
                    <div
                      key={cat.categoryId}
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 sm:px-6 transition-all bg-white hover:bg-[#FAF9F6]/60"
                    >
                      {/* Left: Order Pill + Category Details */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        {/* Order Badge (1, 2, 3...) */}
                        <span className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-stone-200/80 flex items-center justify-center text-xs font-mono font-bold text-stone-700 shrink-0">
                          {index + 1}
                        </span>

                        {/* Category Name & Slug */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {editTitleId === cat.categoryId ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={tempTitle}
                                  onChange={(e) => setTempTitle(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(cat.categoryId)}
                                  className="h-7 px-2 text-xs font-bold rounded border border-[#8c6b45] outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTitle(cat.categoryId)}
                                  className="p-1 rounded bg-[#8c6b45] text-white hover:bg-[#785936]"
                                >
                                  <HiOutlineCheck className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditTitleId(null)}
                                  className="p-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
                                >
                                  <HiOutlineX className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-[13.5px] text-stone-900 tracking-tight">
                                {cat.customTitle || cat.categoryName}
                              </span>
                            )}

                            {/* Category Slug Monospace Badge */}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200/70">
                              Slug: {cat.categorySlug}
                            </span>
                          </div>

                          <p className="text-xs text-stone-400 mt-0.5">
                            Filter Key: <span className="font-mono">{selectedFilter?.key}</span> • Filter Type: <span className="font-mono">{selectedFilter?.type}</span>
                          </p>
                        </div>
                      </div>

                      {/* Middle & Right: Default Value Dropdown + Switch + 3-Dots */}
                      <div className="flex items-center gap-4 sm:shrink-0 self-end sm:self-center">
                        {/* Default Value Dropdown Box */}
                        <div className="flex flex-col items-start gap-1" data-dropdown-container>
                          <span className="text-[11px] text-stone-400 font-normal">
                            Default Value
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenDefaultValueId(openDefaultValueId === cat.categoryId ? null : cat.categoryId)}
                              className="h-9 w-44 sm:w-56 px-3 rounded-lg border border-stone-200 bg-white hover:border-stone-300 flex items-center justify-between text-xs text-stone-700 shadow-2xs transition cursor-pointer"
                            >
                              <span className="truncate">
                                {cat.defaultValue || selectedFilter?.defaultValue || selectedFilter?.title}
                              </span>
                              <HiOutlineChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1.5" />
                            </button>

                            {/* Dropdown Options */}
                            {openDefaultValueId === cat.categoryId && (
                              <div className="absolute left-0 mt-1 w-56 rounded-xl border border-stone-200 bg-white shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultValue(cat.categoryId, selectedFilter?.title)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-[#F9F7F4] flex items-center justify-between cursor-pointer"
                                >
                                  <span>{selectedFilter?.title} (Default)</span>
                                  {(!cat.defaultValue || cat.defaultValue === selectedFilter?.title) && (
                                    <HiOutlineCheck className="w-3.5 h-3.5 text-[#8c6b45]" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultValue(cat.categoryId, 'All')}
                                  className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-[#F9F7F4] flex items-center justify-between cursor-pointer"
                                >
                                  <span>All</span>
                                  {cat.defaultValue === 'All' && (
                                    <HiOutlineCheck className="w-3.5 h-3.5 text-[#8c6b45]" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={cat.enabled}
                          onClick={() => handleToggleCategory(cat.categoryId)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            cat.enabled ? 'bg-[#8c6b45]' : 'bg-stone-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              cat.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Three-dots Action Menu (⋮) */}
                        <div className="relative" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() => setOpenActionId(openActionId === cat.categoryId ? null : cat.categoryId)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            aria-label="Category Options"
                          >
                            <HiDotsVertical className="w-4 h-4" />
                          </button>

                          {openActionId === cat.categoryId && (
                            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-stone-200 bg-white shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditTitleId(cat.categoryId);
                                  setTempTitle(cat.customTitle || cat.categoryName);
                                  setOpenActionId(null);
                                }}
                                className="w-full text-left px-3.5 py-1.5 text-stone-700 hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                              >
                                <HiOutlinePencilAlt className="w-3.5 h-3.5 text-stone-400" />
                                <span>Rename Title</span>
                              </button>
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveOrder(index, 'up')}
                                className="w-full text-left px-3.5 py-1.5 text-stone-700 hover:bg-[#FAF8F5] disabled:opacity-30 flex items-center gap-2 cursor-pointer"
                              >
                                <HiOutlineChevronUp className="w-3.5 h-3.5 text-stone-400" />
                                <span>Move Up</span>
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveOrder(index, 'down')}
                                className="w-full text-left px-3.5 py-1.5 text-stone-700 hover:bg-[#FAF8F5] disabled:opacity-30 flex items-center gap-2 cursor-pointer"
                              >
                                <HiOutlineChevronDown className="w-3.5 h-3.5 text-stone-400" />
                                <span>Move Down</span>
                              </button>
                              <div className="my-1 border-t border-stone-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleCategory(cat.categoryId);
                                  setOpenActionId(null);
                                }}
                                className="w-full text-left px-3.5 py-1.5 text-stone-600 hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                              >
                                <span>{cat.enabled ? 'Disable for Category' : 'Enable for Category'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Add Filter Modal (Click Outside or Esc to close) ── */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Master Storefront Filters
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Available filters in the dedicated filters table:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filters.map((f) => (
                <div
                  key={f.filterId}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-[#8c6b45] transition bg-stone-50/50"
                >
                  <div>
                    <span className="font-semibold text-xs text-stone-900">
                      {f.title}
                    </span>
                    <p className="text-[11px] text-stone-400">
                      {f.type} • Key: {f.key}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
