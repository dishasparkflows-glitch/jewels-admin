import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI, blogCategoriesAPI } from '../../api/services';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import RowActions from '../../components/common/RowActions';
import { getFrontBaseUrl } from '../../utils/productPreview';
import MobileGridList from '../../components/common/MobileGridList';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import RichTextEditor from '../../components/common/RichTextEditor';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../../components/common/Dropdown';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { getUploadTriggerProps } from '../../utils/filePickerAutoOpen';

export default function BlogsView() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const fileInputRef = useRef(null);

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [serverTotal, setServerTotal] = useState(null);
  const [serverFacets, setServerFacets] = useState(null);

  // Form & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Live Preview Modal State
  const [previewBlog, setPreviewBlog] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    blogCategory: '',
    description: '',
    shortDescription: '',
    image: { url: '', key: '', alt: '' },
    readTime: '3 min read',
    status: 'active',
    author: 'Admin',
    tags: '',
  });

  // Load category lookup once on mount
  useEffect(() => {
    blogCategoriesAPI
      .getLookup()
      .then((res) => {
        const catItems = res.data?.data || [];
        setCategories(catItems);
      })
      .catch((err) => {
        console.error('Failed to load blog categories:', err);
      });
  }, []);

  // Pagination hook with server-side total
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    totalItems,
  } = usePagination(blogs, null, serverTotal);

  // Fetch blogs with admin selected page, limit, and active filters
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter === 'published' ? 'active' : 'inactive';
      }

      const res = await blogsAPI.getAll(params);
      const items = res.data?.data?.items || res.data?.data || [];
      const pagination = res.data?.pagination || res.data?.data?.pagination;
      const facets = res.data?.facets || res.data?.data?.facets;

      setBlogs(Array.isArray(items) ? items : []);
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
      console.error('Failed to load blog data:', err);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = serverFacets?.total ?? (serverTotal || blogs.length);
    const published = serverFacets?.published ?? blogs.filter((b) => b.status === 'active' || b.status === 'published').length;
    const draft = serverFacets?.draft ?? blogs.filter((b) => b.status === 'inactive' || b.status === 'draft').length;
    return [
      { label: 'Total Articles', value: total, color: 'text-stone-900' },
      { label: 'Published', value: published, color: 'text-emerald-700' },
      { label: 'Drafts', value: draft, color: 'text-amber-700' },
      { label: 'Categories Available', value: categories.length, color: 'text-[#8b6f4e]' },
    ];
  }, [serverFacets, serverTotal, blogs, categories]);

  // Auto-calculate read time helper
  const calculateReadTimeFromText = (htmlText) => {
    const clean = (htmlText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean ? clean.split(/\s+/).length : 0;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
  };

  // Title change with auto-slug using hyphens
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: autoSlug,
    }));
  };

  // Featured image upload via Presigned URL
  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const loadingToast = toast.loading('Uploading featured image...');
      const uploaded = await uploadWithPresignedUrl(file, 'blog');
      toast.dismiss(loadingToast);

      if (uploaded?.url) {
        setFormData((prev) => ({
          ...prev,
          image: {
            url: uploaded.url,
            key: uploaded.key || '',
            alt: file.name.replace(/\.[^/.]+$/, ''),
          },
        }));
        toast.success('Featured image uploaded!');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Blog
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a blog title');
      return;
    }

    if (!formData.blogCategory) {
      toast.error('Please select a blog category');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please write some content in the rich editor');
      return;
    }

    // Process tags
    const processedTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      blogCategory: formData.blogCategory,
      basicInfo: {
        title: formData.title.trim(),
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, ''),
        description: formData.description,
        shortDescription: formData.shortDescription || '',
        readTime: formData.readTime || '3 min read',
        author: formData.author || 'Admin',
      },
      image: {
        url: formData.image?.url || '',
        key: formData.image?.key || '',
        alt: formData.image?.alt || '',
      },
      status: formData.status || 'active',
      tags: processedTags,
    };

    try {
      setSubmitting(true);
      await blogsAPI.create(payload);
      toast.success('Blog article published successfully');
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error('Failed to save blog:', err);
      toast.error(err.response?.data?.message || 'Failed to save blog article');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (blog) => {
    const isCurrentlyPublished = blog.status === 'active' || blog.status === 'published';
    const newStatus = isCurrentlyPublished ? 'inactive' : 'active';
    try {
      await blogsAPI.update(blog._id, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Article published' : 'Article set to draft');
      setBlogs((prev) =>
        prev.map((b) => (b._id === blog._id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  // Selection handlers for bulk operations
  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((b) => selectedIds.has(b._id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((b) => next.delete(b._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((b) => next.add(b._id));
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
      title: 'Delete Selected Blog Articles',
      message: `Are you sure you want to delete ${count} selected blog article${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await blogsAPI.bulkDelete(idsToDelete);
      setBlogs((prev) => prev.filter((b) => !selectedIds.has(b._id)));
      setSelectedIds(new Set());
      toast.success(`${count} blog article${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete selected blog articles:', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected blog articles');
    }
  };

  // Delete Blog
  const handleDelete = async (blog) => {
    const blogTitle = blog.basicInfo?.title || blog.title || 'this article';
    const isConfirmed = await confirm({
      title: 'Delete Blog Post',
      message: `Are you sure you want to delete "${blogTitle}"? This article will be unlinked and moved to trash.`,
      confirmText: 'Delete Post',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await blogsAPI.delete(blog._id);
      toast.success('Blog post deleted successfully');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(blog._id);
        return next;
      });
      fetchBlogs();
    } catch (err) {
      console.error('Failed to delete blog:', err);
      toast.error('Failed to delete blog post');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ─── Module Header ─── */}
      <ModuleHeader
        title="Luxury Journal & Blogs"
        subtitle="Publish editorial articles, diamond buying guides, styling tips, and brand stories"
        onAdd={() => navigate('/blogs/write')}
        addLabel="+ Write Blog Article"
      />

      {/* ─── Stat Cards ─── */}
      <StatCards stats={stats} />

      {/* ─── Filters & Search Bar ─── */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search articles by title, keywords, content, or author..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="w-44">
            <Dropdown
              size="sm"
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: c._id, label: c.name })),
              ]}
              buttonClassName="w-full h-9 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-stone-50 shadow-2xs hover:border-[#8b6f4e]"
              menuClassName="z-50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
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
                setStatusFilter('published');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('draft');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'draft'
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Draft
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

      {/* ─── Table View (Mobile Grid + Desktop Table) ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText="Loading luxury journal articles..."
          isEmpty={paginatedItems.length === 0}
          emptyText="No blog posts found."
          items={paginatedItems}
          showSelectAll
          allSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          renderCard={(blog, idx) => {
            const isSelected = selectedIds.has(blog._id);
            const imageUrl = blog.image?.url || (typeof blog.image === 'string' ? blog.image : '');
            const categoryName = blog.blogCategory?.name || 'Uncategorized';
            const dateStr = blog.meta?.createdAt
              ? new Date(blog.meta.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '-';
            const blogTitle = blog.basicInfo?.title || blog.title || '';
            const blogReadTime = blog.basicInfo?.readTime || blog.readTime || '3 min read';
            const srNo = (currentPage - 1) * pageSize + idx + 1;

            return (
              <div
                key={blog._id}
                onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                className={`rounded-xl border p-3.5 bg-white shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                  isSelected ? 'border-[#8b6f4e]/60 bg-amber-50/40' : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleSelect(blog._id)}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e] shrink-0"
                    />
                    {imageUrl ? (
                      <img src={imageUrl} alt={blogTitle} className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                        <HiOutlineDocumentText className="w-4 h-4 text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 text-xs line-clamp-2">{blogTitle}</p>
                      <p className="text-[10px] font-medium text-stone-400 mt-0.5">#{srNo} · {categoryName}</p>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <RowActions
                      record={blog}
                      onOpenWebsite={() => {
                        const targetSlug = blog?.basicInfo?.slug || blog?.slug || blog?._id;
                        if (targetSlug) {
                          window.open(`${getFrontBaseUrl()}/blog/${encodeURIComponent(targetSlug)}`, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      websiteTitle="View on Storefront"
                      onEdit={() => navigate(`/blogs/edit/${blog._id}`)}
                      onDelete={() => handleDelete(blog._id, blogTitle)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  <span>{blogReadTime}</span>
                  <span>{dateStr}</span>
                </div>
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
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
                <th className="py-3 px-4 whitespace-nowrap">Article</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">Read Time</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Views</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-stone-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                      <span>Loading luxury journal articles...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-stone-500">
                    <HiOutlineDocumentText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No blog posts found</p>
                    {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
                      <p className="text-xs text-stone-400 mt-1">Try clearing active filters</p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((blog, idx) => {
                  const isSelected = selectedIds.has(blog._id);
                  const imageUrl = blog.image?.url || (typeof blog.image === 'string' ? blog.image : '');
                  const categoryName = blog.blogCategory?.name || 'Uncategorized';
                  const dateStr = blog.meta?.createdAt
                    ? new Date(blog.meta.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  const blogTitle = blog.basicInfo?.title || blog.title || '';
                  const blogSlug = blog.basicInfo?.slug || blog.slug || '';
                  const blogReadTime = blog.basicInfo?.readTime || blog.readTime || '3 min read';

                  return (
                    <tr
                      key={blog._id}
                      onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                      className={`hover:bg-stone-50/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(blog._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-3.5 px-3 text-center align-middle text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Image & Title */}
                      <td className="py-3.5 px-4 font-semibold text-stone-900 max-w-sm">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={blogTitle}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: 'var(--theme-primary-soft, #faf5ee)',
                                borderColor: 'var(--theme-primary-border, #e8d9c2)',
                                color: 'var(--theme-primary, #8b6f4e)',
                              }}
                            >
                              <HiOutlinePhotograph className="w-5 h-5 text-stone-400" />
                            </div>
                          )}
                          <div
                            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                            className="min-w-0 cursor-pointer group/title"
                          >
                            <p className="font-bold text-stone-900 group-hover/title:text-[var(--theme-primary,#8b6f4e)] transition-colors truncate leading-snug">
                              {blogTitle}
                            </p>
                            <p className="text-[11px] text-stone-400 font-mono truncate">
                              /{blogSlug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border"
                          style={{
                            backgroundColor: 'var(--theme-primary-soft, #faf5ee)',
                            color: 'var(--theme-primary, #8b6f4e)',
                            borderColor: 'var(--theme-primary-border, #e8d9c2)',
                          }}
                        >
                          <HiOutlineTag className="w-3 h-3" />
                          <span>{categoryName}</span>
                        </span>
                      </td>

                      {/* Read Time */}
                      <td className="py-3.5 px-4 text-xs font-medium text-stone-600">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100/80 text-stone-700">
                          <HiOutlineClock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{blogReadTime}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(blog)}
                          title="Click to toggle status (Published / Draft)"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            blog.status === 'active' || blog.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          <span>
                            {blog.status === 'active' || blog.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </button>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-stone-600">
                        {blog.views ?? 0}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-stone-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          record={blog}
                          onOpenWebsite={() => {
                            const targetSlug = blog?.basicInfo?.slug || blog?.slug || blog?._id;
                            if (targetSlug) {
                              window.open(`${getFrontBaseUrl()}/blog/${encodeURIComponent(targetSlug)}`, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          websiteTitle="View on Storefront"
                          onPreview={() => setPreviewBlog(blog)}
                          previewTitle="Preview Article"
                          onEdit={() => navigate(`/blogs/edit/${blog._id}`)}
                          onDelete={() => handleDelete(blog)}
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

      {/* ─── Add / Edit Full Luxury Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Write New Luxury Journal Article"
        subtitle="Curate editorial stories, jewelry care recommendations, and diamond guides"
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── Left 2 Columns: Main Content & Rich Editor ─── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Anatomy of a Perfect Diamond: Cut, Fire & Brilliance"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] placeholder:font-normal"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  URL Slug <span className="text-stone-400 font-normal">(auto-generated from title)</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl text-xs text-stone-500 font-mono shrink-0">
                    /blog/
                  </span>
                  <input
                    type="text"
                    placeholder="anatomy-of-a-perfect-diamond"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono border border-stone-200 rounded-r-xl focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>

              {/* Rich Editor for Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Article Content (Rich Editor) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Supports headings, images, quotes, lists & styles
                  </span>
                </div>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  placeholder="Craft your captivating jewellery article with rich formatting, heading hierarchy, and embedded imagery..."
                  onApplyReadTime={(calculatedTime) =>
                    setFormData((prev) => ({ ...prev, readTime: calculatedTime }))
                  }
                />
              </div>

              {/* Short Excerpt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Short Excerpt / Meta Summary
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const plain = (formData.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                      const excerpt = plain.length > 160 ? plain.substring(0, 157) + '...' : plain;
                      setFormData((prev) => ({ ...prev, shortDescription: excerpt }));
                      toast.success('Generated excerpt from content!');
                    }}
                    className="text-[11px] text-[#8b6f4e] hover:underline font-semibold cursor-pointer"
                  >
                    Auto-generate from content
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Brief preview snippet displayed on blog cards and search engines..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] resize-y"
                />
              </div>
            </div>

            {/* ─── Right 1 Column: Metadata, Category, Image, Read Time ─── */}
            <div className="space-y-4">
              {/* Category */}
              <div className="p-4 bg-[#faf8f5] rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800">
                    Blog Category <span className="text-rose-500">*</span>
                  </label>
                  {categories.length === 0 && (
                    <span className="text-[10px] text-amber-600 font-semibold">No categories yet</span>
                  )}
                </div>

                <Dropdown
                  value={formData.blogCategory}
                  onChange={(val) => setFormData((prev) => ({ ...prev, blogCategory: val }))}
                  options={categories.map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                  placeholder="-- Select Category --"
                  buttonClassName="w-full h-10 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] font-medium text-stone-800 bg-white shadow-2xs hover:border-[#8b6f4e] focus:border-[#8b6f4e]"
                  menuClassName="z-[70]"
                />

                <p className="text-[10px] text-stone-500">
                  Select the best matching topic for this story
                </p>
              </div>

              {/* Featured Image */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-800">
                  Featured Image <span className="text-stone-400 font-normal">(Hero banner)</span>
                </label>

                {formData.image?.url ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 group">
                    <img
                      src={formData.image.url}
                      alt="Featured Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        data-upload-trigger="true"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-100 cursor-pointer shadow-xs"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            image: { url: '', key: '', alt: '' },
                          }))
                        }
                        className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer shadow-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getUploadTriggerProps(() => fileInputRef.current?.click())}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 rounded-xl p-5 text-center bg-stone-50/60 hover:bg-stone-50 hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 transition-colors cursor-pointer space-y-1.5"
                  >
                    <HiOutlinePhotograph className="w-8 h-8 text-[#8b6f4e] mx-auto" />
                    <p className="text-xs font-semibold text-stone-800">
                      {uploadingImage ? 'Uploading image...' : 'Upload Featured Image'}
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFeaturedImageUpload}
                />

                {/* Direct Image URL input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste direct image URL..."
                    value={formData.image?.url || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        image: { ...prev.image, url: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>

              {/* Read Time & Status */}
              <div className="p-4 bg-[#faf8f5] rounded-2xl border border-stone-200/80 space-y-3">
                {/* Read Time */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      Read Time
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const calculated = calculateReadTimeFromText(formData.description);
                        setFormData((prev) => ({ ...prev, readTime: calculated }));
                        toast.success(`Calculated: ${calculated}`);
                      }}
                      className="text-[10px] font-semibold text-[#8b6f4e] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <HiOutlineSparkles className="w-3 h-3" />
                      Auto-calculate
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 4 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Publication Status
                  </label>
                  <div className="h-10 px-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800">
                      {formData.status === 'active' ? 'Published' : 'Draft'}
                    </span>
                    <ToggleSwitch
                      checked={formData.status === 'active'}
                      onChange={(checked) =>
                        setFormData((prev) => ({ ...prev, status: checked ? 'active' : 'inactive' }))
                      }
                      size="sm"
                      ariaLabel="Publication Status"
                    />
                  </div>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Author Credit
                  </label>
                  <input
                    type="text"
                    placeholder="Admin"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Tags <span className="text-stone-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="diamonds, gold, care, solitaire"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
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
              className="px-6 py-2.5 text-xs font-semibold bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Article...</span>
                </>
              ) : (
                <span>Publish Article</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Interactive Live Preview Modal ─── */}
      {previewBlog && (
        <Modal
          isOpen={!!previewBlog}
          onClose={() => setPreviewBlog(null)}
          title="Article Live Preview"
          subtitle="Preview how your customers will see this article on the website"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 pt-2 font-sans">
            {/* Header info */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d9c2]">
                {previewBlog.blogCategory?.name || 'Luxury Journal'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                {previewBlog.basicInfo?.title || previewBlog.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-stone-500 font-medium pt-1">
                <span>By {previewBlog.basicInfo?.author || previewBlog.author || 'Admin'}</span>
                <span>•</span>
                <span>{previewBlog.basicInfo?.readTime || previewBlog.readTime || '3 min read'}</span>
                <span>•</span>
                <span>
                  {previewBlog.meta?.createdAt
                    ? new Date(previewBlog.meta.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            {(previewBlog.image?.url || typeof previewBlog.image === 'string') && (
              <div className="rounded-2xl overflow-hidden shadow-md max-h-[420px]">
                <img
                  src={previewBlog.image?.url || previewBlog.image}
                  alt={previewBlog.basicInfo?.title || previewBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Short Excerpt */}
            {(previewBlog.basicInfo?.shortDescription || previewBlog.shortDescription) && (
              <p className="text-base text-stone-600 font-medium italic border-l-4 border-[#8b6f4e] pl-4 py-1 bg-stone-50 rounded-r-lg">
                {previewBlog.basicInfo?.shortDescription || previewBlog.shortDescription}
              </p>
            )}

            {/* Rich Content Render */}
            <div
              className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-sm sm:text-base border-t border-stone-100 pt-6"
              dangerouslySetInnerHTML={{ __html: previewBlog.basicInfo?.description || previewBlog.description || '<p>No content</p>' }}
            />

            {/* Tags */}
            {previewBlog.tags && previewBlog.tags.length > 0 && (
              <div className="pt-4 border-t border-stone-100 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-stone-500">Tags:</span>
                {(Array.isArray(previewBlog.tags)
                  ? previewBlog.tags
                  : previewBlog.tags.split(',')
                ).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    #{typeof tag === 'string' ? tag.trim() : tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
