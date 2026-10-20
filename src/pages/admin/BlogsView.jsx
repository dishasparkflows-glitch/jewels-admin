import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineSparkles,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI, blogCategoriesAPI } from '../../api/services';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import RowActions from '../../components/common/RowActions';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import RichTextEditor from '../../components/common/RichTextEditor';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../../components/common/Dropdown';

export default function BlogsView() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const fileInputRef = useRef(null);

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
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
    author: 'Neirah Editorial',
    tags: '',
  });

  // Fetch blogs & categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [blogsRes, catsRes] = await Promise.all([
        blogsAPI.getAll({ limit: 100 }),
        blogCategoriesAPI.getLookup(),
      ]);

      const blogItems = blogsRes.data?.data || [];
      const catItems = catsRes.data?.data || [];

      setBlogs(blogItems);
      setCategories(catItems);
    } catch (err) {
      console.error('Failed to load blog data:', err);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        !search ||
        blog.title?.toLowerCase().includes(search.toLowerCase()) ||
        blog.slug?.toLowerCase().includes(search.toLowerCase()) ||
        blog.shortDescription?.toLowerCase().includes(search.toLowerCase()) ||
        blog.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        (blog.blogCategory?._id || blog.blogCategory) === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' || blog.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [blogs, search, categoryFilter, statusFilter]);

  // Pagination hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    totalItems,
  } = usePagination(filteredBlogs, 10);

  // Stats calculation
  const stats = useMemo(() => {
    const total = blogs.length;
    const active = blogs.filter((b) => b.status === 'active').length;
    const inactive = blogs.filter((b) => b.status === 'inactive').length;
    return [
      { label: 'Total Articles', value: total, color: 'text-stone-900' },
      { label: 'Published / Active', value: active, color: 'text-emerald-700' },
      { label: 'Drafts / Inactive', value: inactive, color: 'text-amber-700' },
      { label: 'Categories Available', value: categories.length, color: 'text-[#8b6f4e]' },
    ];
  }, [blogs, categories]);

  // Auto-calculate read time helper
  const calculateReadTimeFromText = (htmlText) => {
    const clean = (htmlText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean ? clean.split(/\s+/).length : 0;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      blogCategory: categories[0]?._id || '',
      description: '<p>Welcome to our new journal entry. Explore timeless diamonds, craftmanship, and luxury fine jewellery insights...</p>',
      shortDescription: '',
      image: { url: '', key: '', alt: '' },
      readTime: '3 min read',
      status: 'active',
      author: 'Neirah Editorial',
      tags: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      slug: blog.slug || '',
      blogCategory: blog.blogCategory?._id || blog.blogCategory || '',
      description: blog.description || '',
      shortDescription: blog.shortDescription || '',
      image: typeof blog.image === 'string' ? { url: blog.image, key: '', alt: '' } : blog.image || { url: '', key: '', alt: '' },
      readTime: blog.readTime || '3 min read',
      status: blog.status || 'active',
      author: blog.author || 'Neirah Editorial',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags || '',
    });
    setIsModalOpen(true);
  };

  // Title change with auto-slug
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingBlog ? prev.slug : autoSlug,
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
      ...formData,
      tags: processedTags,
    };

    try {
      setSubmitting(true);
      if (editingBlog) {
        await blogsAPI.update(editingBlog._id, payload);
        toast.success('Blog article updated successfully');
      } else {
        await blogsAPI.create(payload);
        toast.success('Blog article published successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save blog:', err);
      toast.error(err.response?.data?.message || 'Failed to save blog article');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (blog) => {
    const newStatus = blog.status === 'active' ? 'inactive' : 'active';
    try {
      await blogsAPI.update(blog._id, { status: newStatus });
      toast.success(`Article set to ${newStatus}`);
      setBlogs((prev) =>
        prev.map((b) => (b._id === blog._id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  // Delete Blog
  const handleDelete = async (blog) => {
    const isConfirmed = await confirm({
      title: 'Delete Blog Post',
      message: `Are you sure you want to delete "${blog.title}"? This article will be unlinked and moved to trash.`,
      confirmText: 'Delete Post',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await blogsAPI.delete(blog._id);
      toast.success('Blog post deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Failed to delete blog:', err);
      toast.error('Failed to delete blog post');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ─── Module Header ─── */}
      <ModuleHeader
        breadcrumbs={['Marketing', 'Blogs']}
        title="Luxury Journal & Blogs"
        subtitle="Publish editorial articles, diamond buying guides, styling tips, and brand stories"
        onAdd={() => navigate('/blogs/write')}
        addLabel="+ Write Blog Article"
        extraActions={
          <button
            type="button"
            onClick={fetchData}
            title="Refresh List"
            className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
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
                setStatusFilter('active');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* ─── Table View ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-[#fcfaf7] border-b border-stone-200/80 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Read Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Views</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                      <span>Loading luxury journal articles...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-500">
                    <HiOutlineDocumentText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No blog posts found</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {search || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try clearing active filters'
                        : 'Click "+ Write Blog Post" to publish your first luxury story'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((blog) => {
                  const imageUrl = blog.image?.url || (typeof blog.image === 'string' ? blog.image : '');
                  const categoryName = blog.blogCategory?.name || 'Uncategorized';
                  const dateStr = blog.meta?.createdAt
                    ? new Date(blog.meta.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <tr key={blog._id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Image & Title */}
                      <td className="py-3.5 px-4 font-semibold text-stone-900 max-w-sm">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={blog.title}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e] shrink-0">
                              <HiOutlinePhotograph className="w-5 h-5 text-stone-400" />
                            </div>
                          )}
                          <div
                            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                            className="min-w-0 cursor-pointer group/title"
                          >
                            <p className="font-bold text-stone-900 group-hover/title:text-[#8b6f4e] transition-colors truncate leading-snug">
                              {blog.title}
                            </p>
                            <p className="text-[11px] text-stone-400 font-mono truncate">
                              /{blog.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d9c2]">
                          <HiOutlineTag className="w-3 h-3" />
                          <span>{categoryName}</span>
                        </span>
                      </td>

                      {/* Read Time */}
                      <td className="py-3.5 px-4 text-xs font-medium text-stone-600">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100/80 text-stone-700">
                          <HiOutlineClock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{blog.readTime || '3 min read'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(blog)}
                          title="Toggle Status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            blog.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              blog.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                          <span className="capitalize">{blog.status}</span>
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
                      <td className="py-3.5 px-4 text-right">
                        <RowActions
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
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* ─── Add / Edit Full Luxury Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlog ? 'Edit Luxury Journal Article' : 'Write New Luxury Journal Article'}
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
                  <span className="px-3 py-2 bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl text-xs text-stone-500 font-mono">
                    /blog/
                  </span>
                  <input
                    type="text"
                    placeholder="anatomy-of-a-perfect-diamond"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs font-mono border border-stone-200 rounded-r-xl focus:outline-none focus:border-[#8b6f4e]"
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
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 rounded-xl p-5 text-center bg-stone-50/60 hover:bg-stone-50 hover:border-[#8b6f4e] transition-colors cursor-pointer space-y-1.5"
                  >
                    <HiOutlinePhotograph className="w-8 h-8 text-[#8b6f4e] mx-auto" />
                    <p className="text-xs font-semibold text-stone-800">
                      {uploadingImage ? 'Uploading image...' : 'Upload Featured Image'}
                    </p>
                    <p className="text-[10px] text-stone-400">PNG, JPG, WEBP up to 10MB</p>
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
                  <Dropdown
                    value={formData.status}
                    onChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                    options={[
                      { value: 'active', label: 'Active (Published to Store)', dotColor: 'bg-emerald-500' },
                      { value: 'inactive', label: 'Inactive (Draft / Hidden)', dotColor: 'bg-stone-400' },
                    ]}
                    showStatusDot
                    buttonClassName="w-full h-10 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-[13px] font-semibold text-stone-800 bg-white shadow-2xs hover:border-[#8b6f4e] focus:border-[#8b6f4e]"
                    menuClassName="z-[70]"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Author Credit
                  </label>
                  <input
                    type="text"
                    placeholder="Neirah Editorial"
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
                <span>{editingBlog ? 'Update Article' : 'Publish Article'}</span>
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
                {previewBlog.title}
              </h1>

              <div className="flex items-center justify-center gap-4 text-xs text-stone-500 font-medium pt-1">
                <span>By {previewBlog.author || 'Neirah Editorial'}</span>
                <span>•</span>
                <span>{previewBlog.readTime || '3 min read'}</span>
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
                  alt={previewBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Short Excerpt */}
            {previewBlog.shortDescription && (
              <p className="text-base text-stone-600 font-medium italic border-l-4 border-[#8b6f4e] pl-4 py-1 bg-stone-50 rounded-r-lg">
                {previewBlog.shortDescription}
              </p>
            )}

            {/* Rich Content Render */}
            <div
              className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-sm sm:text-base border-t border-stone-100 pt-6"
              dangerouslySetInnerHTML={{ __html: previewBlog.description || '<p>No content</p>' }}
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
