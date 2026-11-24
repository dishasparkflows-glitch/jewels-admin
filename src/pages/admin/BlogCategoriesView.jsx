import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineTag,
  HiOutlineRefresh,
  HiOutlineTrash,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogCategoriesAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import RowActions from '../../components/common/RowActions';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import ToggleSwitch from '../../components/common/ToggleSwitch';

export default function BlogCategoriesView() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [serverTotal, setServerTotal] = useState(null);
  const [serverFacets, setServerFacets] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'active',
    order: 0,
  });

  // Pagination hook with serverTotal
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    totalItems,
  } = usePagination(categories, null, serverTotal);

  // Fetch categories with server pagination and filters
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await blogCategoriesAPI.getAll(params);
      const items = res.data?.data?.items || res.data?.data || [];
      const pagination = res.data?.pagination || res.data?.data?.pagination;
      const facets = res.data?.facets || res.data?.data?.facets;

      setCategories(Array.isArray(items) ? items : []);
      if (pagination?.totalDocs !== undefined) {
        setServerTotal(pagination.totalDocs);
      } else if (pagination?.total !== undefined) {
        setServerTotal(pagination.total);
      } else {
        setServerTotal(Array.isArray(items) ? items.length : 0);
      }
      if (facets) {
        setServerFacets(facets);
      }
    } catch (err) {
      console.error('Failed to load blog categories:', err);
      toast.error('Failed to load blog categories');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = serverFacets?.total ?? (serverTotal || categories.length);
    const active = serverFacets?.active ?? categories.filter((c) => c.status === 'active').length;
    const inactive = serverFacets?.inactive ?? categories.filter((c) => c.status === 'inactive').length;
    return [
      { label: 'Total Categories', value: total, color: 'text-stone-900' },
      { label: 'Active Topics', value: active, color: 'text-emerald-700' },
      { label: 'Inactive', value: inactive, color: 'text-amber-700' },
    ];
  }, [serverFacets, serverTotal, categories]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      status: 'active',
      order: 0,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      status: category.status || 'active',
      order: category.order || 0,
    });
    setIsModalOpen(true);
  };

  // Auto-generate slug on name change using hyphens
  const handleNameChange = (e) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '');

    setFormData((prev) => ({
      ...prev,
      name,
      slug: generatedSlug,
    }));
  };

  // Handle Save (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await blogCategoriesAPI.update(editingCategory._id, formData);
        toast.success('Category updated successfully');
      } else {
        await blogCategoriesAPI.create(formData);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error(err.response?.data?.message || 'Failed to save blog category');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (category) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    try {
      await blogCategoriesAPI.update(category._id, { status: newStatus });
      toast.success(`Category set to ${newStatus}`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
    }
  };

  // Selection handlers for bulk operations
  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((c) => selectedIds.has(c._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((c) => next.delete(c._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((c) => next.add(c._id));
        return next;
      });
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const isConfirmed = await confirm({
      title: 'Delete Selected Categories',
      message: `Are you sure you want to delete ${count} selected blog categor${count > 1 ? 'ies' : 'y'}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await blogCategoriesAPI.bulkDelete(idsToDelete);
      setSelectedIds(new Set());
      toast.success(`${count} blog categor${count > 1 ? 'ies' : 'y'} deleted successfully`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete selected blog categories:', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected blog categories');
    }
  };

  // Handle Delete
  const handleDelete = async (category) => {
    const isConfirmed = await confirm({
      title: 'Delete Blog Category',
      message: `Are you sure you want to delete category "${category.name}"? Articles linked to this category should be reassigned.`,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await blogCategoriesAPI.delete(category._id);
      toast.success('Blog category deleted successfully');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(category._id);
        return next;
      });
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ─── Module Header ─── */}
      <ModuleHeader
        breadcrumbs={['Marketing', 'Blog Categories']}
        title="Blog Categories"
        subtitle="Manage and organize article categories, jewelry guides, and editorial topics"
        onAdd={handleOpenAdd}
        addLabel="+ Add Blog Category"
        extraActions={
          <button
            type="button"
            onClick={fetchCategories}
            title="Refresh List"
            className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* ─── Stat Cards ─── */}
      <StatCards stats={stats} />

      {/* ─── Search & Status Filter Bar ─── */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search categories by name, slug, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('inactive');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Bulk Delete Button */}
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs whitespace-nowrap ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50 cursor-pointer'
                : 'bg-white text-stone-300 border-stone-200/90 cursor-not-allowed opacity-60'
            }`}
          >
            <HiOutlineTrash className="w-3.5 h-3.5 shrink-0 text-[#ef4444]" />
            <span>Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
          </button>
        </div>
      </div>

      {/* ─── Table View ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                    title="Select all on this page"
                  />
                </th>
                <th className="py-3 px-3 text-center w-14 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-4 whitespace-nowrap">Category Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Slug</th>
                <th className="py-3 px-4 whitespace-nowrap">Description</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Sort Order</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                      <span>Loading blog categories...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-500">
                    <HiOutlineTag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No blog categories found</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {search ? 'Try adjusting your search criteria' : 'Click "Add Blog Category" to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((category, idx) => {
                  const isSelected = selectedIds.has(category._id);
                  return (
                    <tr
                      key={category._id}
                      onClick={() => handleOpenEdit(category)}
                      className={`hover:bg-stone-50/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(category._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-3.5 px-3 text-center align-middle text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#faf6f0] border border-[#e8ddce] flex items-center justify-center text-[#8b6f4e] font-bold text-xs">
                          {category.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <span>{category.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-500">
                      /{category.slug}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                      {category.description || <span className="text-stone-300 italic">No description</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(category)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                          category.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            category.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'
                          }`}
                        />
                        <span className="capitalize">{category.status}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-mono text-stone-600">
                      {category.order ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        onEdit={() => handleOpenEdit(category)}
                        onDelete={() => handleDelete(category)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        {!loading && totalItems > 0 && (
          <div className="p-3 border-t border-stone-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Blog Category' : 'Add New Blog Category'}
        subtitle="Categories group related blog posts for clean site navigation"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diamond Guides, High Jewellery, Care & Cleaning"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              URL Slug <span className="text-stone-400 font-normal">(auto-generated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. diamond-guides"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Brief Description
            </label>
            <textarea
              rows={3}
              placeholder="Short summary of this blog topic (useful for SEO & category page headers)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
              <div className="h-10 px-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      formData.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    {formData.status === 'active' ? 'Active (Visible)' : 'Inactive (Hidden)'}
                  </span>
                </div>
                <ToggleSwitch
                  checked={formData.status === 'active'}
                  onChange={(checked) =>
                    setFormData((prev) => ({ ...prev, status: checked ? 'active' : 'inactive' }))
                  }
                  size="sm"
                  ariaLabel="Category Status"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Display Order</label>
              <input
                type="number"
                min={0}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
