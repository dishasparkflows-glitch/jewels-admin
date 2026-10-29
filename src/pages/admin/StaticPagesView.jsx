import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { staticPagesAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import RichTextEditor from '../../components/common/RichTextEditor';

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
  const [selectedId, setSelectedId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState(EMPTY_PAGE);

  // Fetch all pages
  const fetchPages = async (selectSlugOrId = null) => {
    try {
      setLoading(true);
      const res = await staticPagesAPI.getAll();
      const list = res.data?.data || res.data || [];
      setPages(list);

      if (list.length > 0) {
        let target = null;
        if (selectSlugOrId) {
          target = list.find((p) => p._id === selectSlugOrId || p.slug === selectSlugOrId);
        }
        if (!target) {
          target = list.find((p) => p.slug === 'our-story') || list[0];
        }
        if (target && !isCreatingNew) {
          setSelectedId(target._id);
          setFormData({
            title: target.title || '',
            slug: target.slug || '',
            status: target.status === 'draft' ? 'draft' : 'published',
            seoTitle: target.seoTitle || '',
            metaDescription: target.metaDescription || '',
            content: target.content || '',
          });
        }
      }
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
    if (!search.trim()) return pages;
    const q = search.toLowerCase().trim();
    return pages.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.seoTitle || '').toLowerCase().includes(q)
    );
  }, [pages, search]);

  // Handle selecting a page to edit
  const handleSelectPage = (page) => {
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
  };

  // Handle switching to Create Page mode
  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setFormData({
      title: '',
      slug: '',
      status: 'published',
      seoTitle: '',
      metaDescription: '',
      content: '',
    });
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
        const res = await staticPagesAPI.create(payload);
        const created = res.data?.data || res.data;
        toast.success('Static page created successfully!');
        setIsCreatingNew(false);
        await fetchPages(created?._id);
      } else {
        const res = await staticPagesAPI.update(selectedId, payload);
        const updated = res.data?.data || res.data;
        toast.success('Static page updated successfully!');
        await fetchPages(updated?._id || selectedId);
      }
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
      if (selectedId === pageId) {
        setSelectedId(null);
        setFormData(EMPTY_PAGE);
      }
      await fetchPages();
    } catch (err) {
      console.error('Failed to delete page:', err);
      toast.error(err.response?.data?.message || 'Failed to delete page');
    }
  };

  const storefrontUrl = `http://localhost:5174/${(formData.slug || '').replace(/^\/+/, '')}`;

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb ────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <span>Website Content</span>
        <HiOutlineChevronRight className="w-3 h-3 text-stone-400" />
        <span>Static Pages</span>
        <HiOutlineChevronRight className="w-3 h-3 text-stone-400" />
        <span className="text-stone-900 font-semibold truncate max-w-[200px]">
          {isCreatingNew ? 'Create New Page' : formData.title || 'Our Story'}
        </span>
      </nav>

      {/* ─── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
            Static Pages
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage the content displayed across your storefront
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c4a3e] hover:bg-[#115e59] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Create Page</span>
        </button>
      </div>

      {/* ─── Main Two-Column Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Left Side: Page List Table (lg:col-span-5 xl:col-span-5) ─── */}
        <div className="lg:col-span-5 xl:col-span-5 rounded-2xl border border-stone-200/90 bg-white shadow-sm overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-stone-100">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="w-full pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0c4a3e] focus:border-[#0c4a3e] transition-all"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-3 bg-stone-50/70 border-b border-stone-100 text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span className="col-span-5">PAGE</span>
            <span className="col-span-3">LAST UPDATED</span>
            <span className="col-span-2 text-center">STATUS</span>
            <span className="col-span-2 text-right">ACTIONS</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-stone-100 max-h-[680px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-stone-400">Loading static pages...</div>
            ) : filteredPages.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">No static pages found.</div>
            ) : (
              filteredPages.map((page) => {
                const isSelected = !isCreatingNew && selectedId === page._id;
                const { date, time } = formatDateParts(page.updatedAt || page.createdAt);
                const isPub = page.status === 'published' || page.status === 'active';

                return (
                  <div
                    key={page._id}
                    onClick={() => handleSelectPage(page)}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#f4f8f5] border-l-4 border-l-[#0c4a3e]'
                        : 'hover:bg-stone-50/80'
                    }`}
                  >
                    {/* Col 1: Page icon, title & slug */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-[#eef7ee] text-[#2d6a4f] flex items-center justify-center shrink-0">
                        <HiOutlineDocumentText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <h4 className="text-xs sm:text-[13px] font-semibold text-stone-900 truncate">
                          {page.title}
                        </h4>
                        <p className="text-[11px] text-stone-400 truncate">/{page.slug}</p>
                      </div>
                    </div>

                    {/* Col 2: Last Updated */}
                    <div className="col-span-3 min-w-0 pr-2">
                      <div className="text-[11px] font-medium text-stone-800 truncate">{date}</div>
                      <div className="text-[10px] text-stone-400 truncate">{time}</div>
                    </div>

                    {/* Col 3: Status Pill */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          isPub
                            ? 'bg-[#e7f5ec] text-[#137333]'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPub ? 'bg-[#137333]' : 'bg-stone-400'
                          }`}
                        />
                        {isPub ? 'Active' : 'Draft'}
                      </span>
                    </div>

                    {/* Col 4: Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPage(page);
                        }}
                        title="Edit Page"
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                      >
                        <HiOutlinePencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(page._id, page.title, e)}
                        title="Delete Page"
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right Side: Page Editor (lg:col-span-7 xl:col-span-7) ───── */}
        <div className="lg:col-span-7 xl:col-span-7 rounded-2xl border border-stone-200/90 bg-white shadow-sm p-6 sm:p-7 space-y-6">
          {/* Header of Edit Panel */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">
              {isCreatingNew ? 'Create New Page' : 'Edit Page'}
            </h2>
            {!isCreatingNew && formData.slug && (
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <HiOutlineEye className="w-3.5 h-3.5 text-stone-600" />
                <span>View on Storefront</span>
              </a>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
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
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c4a3e]/20 focus:border-[#0c4a3e] transition-all"
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
                    className="w-full pl-7 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c4a3e]/20 focus:border-[#0c4a3e] font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Status Toggle */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-stone-700 mb-2">Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      status: formData.status === 'published' ? 'draft' : 'published',
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.status === 'published' ? 'bg-[#0c4a3e]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status === 'published' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-stone-700">
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
                  className="w-full px-3.5 py-2.5 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c4a3e]/20 focus:border-[#0c4a3e] transition-all"
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
                  className="w-full px-3.5 py-2 text-xs text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c4a3e]/20 focus:border-[#0c4a3e] transition-all resize-none"
                />
              </div>
            </div>

            {/* Row 4: Page Content (Rich Text) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Page Content <span className="text-red-500">*</span>
              </label>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <RichTextEditor
                  value={formData.content}
                  onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
                  placeholder="Compose your rich static page content..."
                  minHeight="380px"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('published')}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-[#0c4a3e] hover:bg-[#115e59] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>{isCreatingNew ? 'Publish Page' : 'Update & Publish'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
