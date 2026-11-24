import { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineGlobeAlt,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { staticPagesAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import Modal from '../../components/common/Modal';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import RichTextEditor from '../../components/common/RichTextEditor';
import { EditActionButton, DeleteActionButton } from '../../components/common/RowActions';
import { VITE_FRONT_URL } from '../../config/env';

// Helper to format date display (e.g. "24 Oct 2026", "10:45 AM")
const formatDateParts = (dateString) => {
  if (!dateString) return { date: '—', time: '—' };
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: '—', time: '—' };
    const date = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { date, time };
  } catch {
    return { date: '—', time: '—' };
  }
};

const EMPTY_PAGE = {
  title: '',
  slug: '',
  status: 'published',
  seoTitle: '',
  metaDescription: '',
  content: '',
};

export default function StaticPagesView() {
  const confirm = useConfirm();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selection State for Checkboxes & Bulk Actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState(EMPTY_PAGE);

  // Fetch all pages
  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await staticPagesAPI.getAll();
      const list = res.data?.data || res.data || [];
      setPages(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load static pages:', err);
      toast.error('Failed to load static pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // Filtered pages for table
  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.seoTitle || '').toLowerCase().includes(q) ||
        (p.metaDescription || '').toLowerCase().includes(q);

      const isPub = p.status === 'published' || p.status === 'active';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && isPub) ||
        (statusFilter === 'draft' && !isPub);

      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  // Pagination hook (10 items per page)
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    totalItems,
  } = usePagination(filteredPages, 10);

  // Selection handlers for checkboxes & bulk operations
  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((p) => selectedIds.has(p._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((p) => next.delete(p._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((p) => next.add(p._id));
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
      title: 'Delete Selected Pages',
      message: `Are you sure you want to delete ${count} selected static page${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await staticPagesAPI.bulkDelete(Array.from(selectedIds));
      toast.success(`${count} static page${count > 1 ? 's' : ''} deleted successfully`);
      setSelectedIds(new Set());
      await fetchPages();
    } catch (err) {
      console.error('Failed to bulk delete pages:', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected pages');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setFormData(EMPTY_PAGE);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (page) => {
    setIsCreatingNew(false);
    setSelectedId(page._id);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      status: page.status === 'draft' ? 'draft' : 'published',
      seoTitle: page.seoTitle || '',
      metaDescription: page.metaDescription || '',
      content: page.content || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCreatingNew(false);
  };

  // Auto-generate slug from title if not manually changed in create mode
  const handleTitleChange = (val) => {
    const updated = { ...formData, title: val };
    if (isCreatingNew || !formData.slug) {
      updated.slug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    setFormData(updated);
  };

  // Quick Toggle Status from Table Row
  const handleToggleStatus = async (page, e) => {
    e?.stopPropagation();
    const isPub = page.status === 'published' || page.status === 'active';
    const nextStatus = isPub ? 'draft' : 'published';
    try {
      await staticPagesAPI.update(page._id, { status: nextStatus });
      setPages((prev) =>
        prev.map((p) => (p._id === page._id ? { ...p, status: nextStatus } : p))
      );
      toast.success(nextStatus === 'published' ? 'Page published' : 'Page set to draft');
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Save / Update Handler
  const handleSave = async (overrideStatus = null) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a page title');
      return;
    }
    const cleanSlug = (formData.slug || formData.title)
      .toLowerCase()
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      toast.error('Please enter a valid URL slug');
      return;
    }

    const payload = {
      ...formData,
      slug: cleanSlug,
      status: overrideStatus || formData.status,
    };

    setSaving(true);
    try {
      if (isCreatingNew) {
        await staticPagesAPI.create(payload);
        toast.success('Static page created successfully!');
      } else {
        await staticPagesAPI.update(selectedId, payload);
        toast.success('Static page updated successfully!');
      }
      setIsModalOpen(false);
      await fetchPages();
    } catch (err) {
      console.error('Failed to save static page:', err);
      const msg = err.response?.data?.message || 'Failed to save static page';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleDelete = async (pageId, pageTitle, e) => {
    e?.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Static Page',
      message: `Are you sure you want to delete the static page "${pageTitle}"? This cannot be undone.`,
      confirmText: 'Delete Page',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await staticPagesAPI.delete(pageId);
      toast.success('Page deleted successfully');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(pageId);
        return next;
      });
      await fetchPages();
    } catch (err) {
      console.error('Failed to delete page:', err);
      toast.error(err.response?.data?.message || 'Failed to delete page');
    }
  };

  const storefrontUrl = `${VITE_FRONT_URL}/${(formData.slug || '').replace(/^\/+/, '')}`;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ─── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
            Static Pages
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage the content, legal policies, and story pages displayed across your storefront
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 shadow-sm hover:brightness-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Create Page</span>
        </button>
      </div>

      {/* ─── Search & Filters Toolbar ────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search pages by title, slug, or content..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e] focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-100/80 border border-stone-200/80 rounded-xl p-1 text-xs">
            {['all', 'published', 'draft'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {s === 'all' ? 'All' : s === 'published' ? 'Active' : 'Draft'}
              </button>
            ))}
          </div>

          {/* Bulk Delete Button */}
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs whitespace-nowrap ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50 cursor-pointer'
                : 'bg-white text-stone-300 border-stone-200/90 cursor-not-allowed opacity-60'
            }`}
          >
            <HiOutlineTrash className="w-3.5 h-3.5 shrink-0 text-[#ef4444]" />
            <span>Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
          </button>

          {/* Count pill */}
          <span className="text-xs font-semibold text-stone-500 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 shrink-0">
            {filteredPages.length} {filteredPages.length === 1 ? 'Page' : 'Pages'}
          </span>
        </div>
      </div>

      {/* ─── Full-Width Records Table / List ─────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                    title="Select all on this page"
                  />
                </th>
                <th className="py-3.5 px-3 text-center w-14 whitespace-nowrap">SR NO</th>
                <th className="py-3.5 px-4">Page Title &amp; Slug</th>
                <th className="py-3.5 px-4 hidden md:table-cell">SEO Title &amp; Meta Preview</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">Last Updated</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading static pages...
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-stone-400">
                    No static pages found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((page, idx) => {
                  const isSelected = selectedIds.has(page._id);
                  const { date, time } = formatDateParts(page.updatedAt || page.createdAt);
                  const isPub = page.status === 'published' || page.status === 'active';
                  const pageUrl = `${VITE_FRONT_URL}/${(page.slug || '').replace(/^\/+/, '')}`;

                  return (
                    <tr
                      key={page._id}
                      onClick={() => handleOpenEdit(page)}
                      className={`hover:bg-[#faf6f0]/70 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/90' : ''
                      }`}
                    >
                      {/* Col 0: Checkbox */}
                      <td className="py-3.5 pl-4 pr-1 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(page._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                        />
                      </td>

                      {/* Col 0.5: SR NO */}
                      <td className="py-3.5 px-3 text-center text-xs text-stone-500 font-mono font-medium whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Col 1: Page Title & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/70 text-stone-600 group-hover:bg-[#faf6f0] group-hover:border-[#8b6f4e]/30 group-hover:text-[#8b6f4e] flex items-center justify-center shrink-0 transition-all">
                            <HiOutlineDocumentText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors block text-xs sm:text-sm truncate">
                              {page.title}
                            </span>
                            <span className="font-mono text-[11px] text-stone-400 block mt-0.5">
                              /{page.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: SEO Details */}
                      <td className="py-3.5 px-4 hidden md:table-cell max-w-xs">
                        <p className="font-medium text-stone-800 text-xs truncate" title={page.seoTitle}>
                          {page.seoTitle || <span className="text-stone-300 italic">No SEO title</span>}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5" title={page.metaDescription}>
                          {page.metaDescription || <span className="text-stone-300 italic">No meta description</span>}
                        </p>
                      </td>

                      {/* Col 3: Status Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(page, e)}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            isPub
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          <span>{isPub ? 'Active' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Col 4: Last Updated */}
                      <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                        <span className="text-xs font-semibold text-stone-700 block">{date}</span>
                        <span className="text-[10px] text-stone-400 block font-mono mt-0.5">{time}</span>
                      </td>

                      {/* Col 5: Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {page.slug && (
                            <a
                              href={pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="View on Storefront"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </a>
                          )}
                          <EditActionButton
                            onClick={() => handleOpenEdit(page)}
                            title="Edit Page"
                          />
                          <DeleteActionButton
                            onClick={(e) => handleDelete(page._id, page.title, e)}
                            title="Delete Page"
                          />
                        </div>
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
              itemLabel="pages"
            />
          </div>
        )}
      </div>

      {/* ─── Edit / Create Modal ─────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-4xl"
        title={isCreatingNew ? 'Create New Static Page' : `Edit Page: ${formData.title || 'Untitled'}`}
        subtitle={
          isCreatingNew
            ? 'Publish a new content, policy, or story page across your storefront.'
            : `URL Path: /${formData.slug || ''}`
        }
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('published')}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : isCreatingNew ? 'Publish Page' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4 pt-1">
          {/* Header Action: View on Storefront (if existing page) */}
          {!isCreatingNew && formData.slug && (
            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-2 text-xs text-stone-600 font-mono">
                <HiOutlineGlobeAlt className="w-4 h-4 text-[#8b6f4e]" />
                <span className="font-semibold text-stone-800">Storefront URL:</span>
                <span>/{formData.slug}</span>
              </div>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b6f4e] hover:text-[#785e40] transition-colors"
              >
                <HiOutlineEye className="w-3.5 h-3.5" />
                <span>Open in Store</span>
              </a>
            </div>
          )}

          {/* Row 1: Title & URL Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Our Story"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-stone-400 font-mono font-medium">/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="our-story"
                  className="w-full pl-7 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e] font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <div>
              <label className="block text-xs font-bold text-stone-800">Publishing Status</label>
              <p className="text-[11px] text-stone-500">
                {formData.status === 'published'
                  ? 'Visible on storefront navigation and accessible publicly'
                  : 'Hidden from storefront as a draft'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ToggleSwitch
                checked={formData.status === 'published'}
                onChange={() =>
                  setFormData({
                    ...formData,
                    status: formData.status === 'published' ? 'draft' : 'published',
                  })
                }
                size="md"
                ariaLabel="Toggle Page Status"
              />
              <span className="text-xs font-bold text-stone-700 min-w-[60px]">
                {formData.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Row 3: SEO Title & Meta Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">SEO Title</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="e.g. Our Story | Neirah - Handcrafted Luxury Jewellery"
                className="w-full px-3.5 py-2.5 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700">Meta Description</label>
                <span className="text-[10px] text-stone-400">
                  {formData.metaDescription.length}/160
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={160}
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Discover the story behind Neirah..."
                className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20 focus:border-[#8b6f4e] transition-all resize-none"
              />
            </div>
          </div>

          {/* Row 4: Page Content (Rich Text) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Page Content <span className="text-red-500">*</span>
            </label>
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
              <RichTextEditor
                value={formData.content}
                onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
                placeholder="Compose your rich static page content..."
                minHeight="350px"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
