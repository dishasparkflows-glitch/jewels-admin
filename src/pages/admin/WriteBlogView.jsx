import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI, blogCategoriesAPI } from '../../api/services';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import RichTextEditor from '../../components/common/RichTextEditor';
import Dropdown from '../../components/common/Dropdown';

// Helper to format file size
const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to format Date for input
const formatDateForInput = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Helper to format Date for luxury display (e.g. 20 Oct 2026)
const formatDisplayDate = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

// Default starter template matching exact screenshot
const DEFAULT_CONTENT = `<h2>Preserving Your Heirloom's Radiance</h2>
<p>Fine jewellery is crafted to be cherished forever. Daily exposure to cosmetics, oils, and environmental factors can temporarily dull its pristine sparkle. Here are essential rituals recommended by our master jewellers.</p>
<h3>Gentle Cleaning Ritual</h3>
<ol>
  <li>Prepare a bowl of lukewarm water with a few drops of mild soap.</li>
  <li>Soak your jewellery for 10 to 15 minutes to loosen daily residues.</li>
  <li>Use a soft-bristled brush to gently clean around facet settings and prongs.</li>
  <li>Rinse under tepid water and pat dry with a lint-free polishing cloth.</li>
</ol>
<blockquote style="display:flex; gap:12px; align-items:flex-start; padding:16px 20px; background:#faf5ee; border-left:4px solid #8b6f4e; border-radius:12px; margin:20px 0; color:#785327;">
  <span style="font-size:18px;">💡</span>
  <span>Store each piece in its individual velvet Neirah box to prevent delicate metals from coming into contact with one another.</span>
</blockquote>`;

export default function WriteBlogView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Primary Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    blogCategory: '',
    description: DEFAULT_CONTENT,
    shortDescription: '',
    image: {
      url: '',
      key: '',
      alt: '',
      name: '',
      size: '',
    },
    readTime: '1 min read',
    status: 'active',
    publishDate: formatDateForInput(new Date()),
    author: 'Neirah Atelier',
    tags: ['care tips', 'gold jewellery', 'diamond'],
    metaTitle: '',
    metaDescription: '',
    allowComments: true,
    showInHomepage: true,
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await blogCategoriesAPI.getAll({ limit: 100 });
        const items = res.data?.data || [];
        setCategories(items);
        if (!isEditing && items.length > 0) {
          setFormData((prev) => ({
            ...prev,
            blogCategory: prev.blogCategory || items[0]._id,
          }));
        }
      } catch (err) {
        console.error('Failed to load blog categories:', err);
      }
    };
    fetchCategories();
  }, [isEditing]);

  // Fetch existing blog if in edit mode
  useEffect(() => {
    if (!id) return;
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await blogsAPI.getById(id);
        const blog = res.data?.data;
        if (blog) {
          const imgObj =
            typeof blog.image === 'string'
              ? { url: blog.image, key: '', alt: '', name: 'featured-image.jpg', size: '' }
              : blog.image || { url: '', key: '', alt: '', name: '', size: '' };

          setFormData({
            title: blog.title || '',
            slug: blog.slug || '',
            blogCategory: blog.blogCategory?._id || blog.blogCategory || '',
            description: blog.description || '',
            shortDescription: blog.shortDescription || '',
            image: imgObj,
            readTime: blog.readTime || '1 min read',
            status: blog.status || 'active',
            publishDate: formatDateForInput(blog.publishDate || blog.createdAt || new Date()),
            author: blog.author || 'Neirah Atelier',
            tags: Array.isArray(blog.tags)
              ? blog.tags
              : blog.tags
              ? blog.tags.split(',').map((t) => t.trim()).filter(Boolean)
              : [],
            metaTitle: blog.metaTitle || blog.title || '',
            metaDescription: blog.metaDescription || blog.shortDescription || '',
            allowComments: blog.allowComments !== undefined ? blog.allowComments : true,
            showInHomepage: blog.showInHomepage !== undefined ? blog.showInHomepage : true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch blog for editing:', err);
        toast.error('Could not load blog article');
        navigate('/blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, navigate]);

  // Handle title change & auto-generate slug using hyphens
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: isEditingSlug ? prev.slug : autoSlug,
      metaTitle: prev.metaTitle && prev.metaTitle !== `${prev.title} | Neirah Jewellers`
        ? prev.metaTitle
        : (title ? `${title} | Neirah Jewellers` : ''),
    }));
  };

  const handleRegenerateSlug = () => {
    const newSlug = (formData.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setIsEditingSlug(false);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    toast.success('URL slug regenerated from title');
  };

  // Add tag
  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || tagInput).trim().replace(/^,+|,+$/g, '');
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, clean],
      }));
    }
    setTagInput('');
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Image Upload handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5 MB');
      return;
    }

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
            name: file.name,
            size: formatFileSize(file.size),
          },
        }));
        toast.success('Featured image updated!');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Submit (Draft or Published)
  const handleSubmit = async (targetStatus) => {
    if (!formData.title.trim()) {
      toast.error('Please enter an article title');
      return;
    }

    if (!formData.blogCategory) {
      toast.error('Please select a blog category');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter article content');
      return;
    }

    const payload = {
      ...formData,
      status: targetStatus,
      tags: formData.tags,
      slug:
        formData.slug ||
        formData.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
    };

    try {
      setSubmitting(true);
      if (isEditing) {
        await blogsAPI.update(id, payload);
        toast.success(
          targetStatus === 'active'
            ? 'Article published successfully!'
            : 'Article draft updated!'
        );
      } else {
        await blogsAPI.create(payload);
        toast.success(
          targetStatus === 'active'
            ? 'Article published to store!'
            : 'Article saved as draft!'
        );
      }
      navigate('/blogs');
    } catch (err) {
      console.error('Failed to save article:', err);
      toast.error(err.response?.data?.message || 'Failed to save article');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-stone-500">Loading editorial studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/70">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 flex items-center justify-center text-stone-600 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Back to Blog Articles"
          >
            <HiOutlineArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              {isEditing ? 'Edit Blog Article' : 'Write Blog Article'}
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Share stories, guides and latest updates with your customers
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Save as Draft */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('inactive')}
            className="h-10 px-4 sm:px-4.5 rounded-xl bg-white border border-stone-200/90 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs sm:text-[13px] font-medium transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            <svg
              className="w-4 h-4 text-stone-500 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Save as Draft</span>
          </button>

          {/* Publish Article */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('active')}
            className="h-10 px-4.5 sm:px-5 rounded-xl bg-[#96744f] hover:bg-[#856543] active:bg-[#785b3a] active:scale-[0.98] text-white text-xs sm:text-[13px] font-medium transition-all shadow-xs hover:shadow-md flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 text-white shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
              <line x1="22" y1="2" x2="11" y2="13" />
            </svg>
            <span>{submitting ? 'Publishing...' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* ─── 2-Column Responsive Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═════════ LEFT 8 COLS: Title, Slug, Rich Editor, Excerpt, SEO ═════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
            {/* Row 1: Article Title & Blog Category */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Title */}
              <div className="md:col-span-7 lg:col-span-8">
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="How to Care for Your 18K Gold and Diamond Jewellery at Home"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 hover:border-stone-300 focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-300 placeholder:font-normal outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Category */}
              <div className="md:col-span-5 lg:col-span-4">
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Blog Category <span className="text-rose-500">*</span>
                </label>
                <Dropdown
                  value={formData.blogCategory}
                  onChange={(val) => setFormData((prev) => ({ ...prev, blogCategory: val }))}
                  options={categories.map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                  placeholder="Select Category"
                  buttonClassName="w-full h-11 px-3.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-stone-800 bg-white shadow-2xs hover:border-[#8b6f4e]"
                  menuClassName="z-[70]"
                />
              </div>
            </div>

            {/* Row 2: URL Slug (auto-generated from title) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  URL Slug <span className="text-stone-400 font-normal">(auto-generated from title)</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSlug}
                  className="text-[11px] font-semibold text-[#8b6f4e] hover:text-[#785327] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  title="Generate URL slug from current article title"
                >
                  <HiOutlineSparkles className="w-3.5 h-3.5" />
                  Regenerate from Title
                </button>
              </div>
              <div className="flex items-center">
                <span className="h-10 px-3.5 bg-stone-50 border border-r-0 border-stone-200 rounded-l-xl text-xs text-stone-500 font-mono flex items-center select-none">
                  /blog/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  readOnly={!isEditingSlug}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                  }))}
                  onBlur={() => setFormData((prev) => ({
                    ...prev,
                    slug: (prev.slug || '').replace(/^-+|-+$/g, ''),
                  }))}
                  placeholder="article-title-url"
                  className={`flex-1 h-10 px-3 font-mono text-xs text-stone-800 border border-stone-200 outline-none transition-colors ${
                    isEditingSlug ? 'bg-white focus:border-[#8b6f4e]' : 'bg-stone-50/50 cursor-default'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setIsEditingSlug(!isEditingSlug)}
                  title={isEditingSlug ? 'Lock slug' : 'Edit slug manually'}
                  className="h-10 px-3 bg-white border border-l-0 border-stone-200 rounded-r-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <HiOutlinePencil className={`w-4 h-4 ${isEditingSlug ? 'text-[#8b6f4e]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Row 3: Article Content (Rich Editor) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Article Content <span className="text-rose-500">*</span>
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => {
                  setFormData((prev) => ({ ...prev, description: html }));
                }}
                minHeight="380px"
                placeholder="Preserving Your Heirloom's Radiance..."
                onApplyReadTime={(calculatedTime) =>
                  setFormData((prev) => ({ ...prev, readTime: calculatedTime }))
                }
              />
            </div>

            {/* Row 4: Short Excerpt / Meta Summary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Short Excerpt / Meta Summary <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-stone-400">
                  {formData.shortDescription?.length || 0}/160
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={160}
                placeholder="Master jeweller secrets for keeping your 18K gold and diamond creations radiant, clean, and immaculately preserved."
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                    metaDescription: prev.metaDescription || e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 hover:border-stone-300 focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 text-xs sm:text-sm text-stone-800 outline-none transition-all resize-y shadow-2xs leading-relaxed"
              />
            </div>
          </div>

          {/* ─── SEO Settings Card ─── */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">
              SEO Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">Meta Title</label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {formData.metaTitle?.length || 0}/60
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="How to Care for 18K Gold and Diamond Jewellery | Neirah Jewellers"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  className="w-full h-10 px-3.5 rounded-xl border border-stone-200 hover:border-stone-300 focus:border-[#8b6f4e] text-xs sm:text-sm text-stone-800 outline-none transition-colors shadow-2xs"
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">Meta Description</label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {formData.metaDescription?.length || 0}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={160}
                  placeholder="Learn expert tips on cleaning, storing and maintaining your 18K gold and diamond jewellery at home from Neirah Jewellers."
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 hover:border-stone-300 focus:border-[#8b6f4e] text-xs sm:text-sm text-stone-800 outline-none transition-colors shadow-2xs resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═════════ RIGHT 4 COLS: Featured Image, Information, Options ═════════ */}
        <div className="lg:col-span-4 space-y-6">
          {/* ─── 1. Featured Image Card ─── */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 tracking-wide">
                Featured Image
              </h3>
              {formData.image?.url && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      image: { url: '', key: '', alt: '', name: '', size: '' },
                    }))
                  }
                  className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Image Preview Box */}
            {formData.image?.url ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-stone-200 aspect-[16/10] bg-stone-100 group shadow-2xs">
                  <img
                    src={formData.image.url}
                    alt={formData.image.alt || 'Featured Preview'}
                    className="w-full h-full object-cover"
                  />

                  {/* Top Overlay Controls */}
                  <div className="absolute top-2.5 left-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          image: { url: '', key: '', alt: '', name: '', size: '' },
                        }))
                      }
                      className="w-6 h-6 rounded-full bg-stone-900/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      title="Delete Image"
                    >
                      <HiOutlineX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-stone-800 text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <HiOutlinePencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* File Meta Row */}
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 px-0.5">
                  <span className="truncate max-w-[200px]" title={formData.image.name || 'featured-image.jpg'}>
                    {formData.image.name || 'featured-image.jpg'}
                  </span>
                  <span className="shrink-0 text-stone-400">
                    {formData.image.size || '420 KB'}
                  </span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-stone-200 hover:border-[#8b6f4e] p-6 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-stone-50 group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-[#8b6f4e] group-hover:scale-105 transition-all shadow-2xs">
                  <HiOutlinePhotograph className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">Upload Featured Image</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">PNG, JPG, WebP up to 5MB</p>
                </div>
              </div>
            )}

            {/* Change Image Button */}
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-[#faf8f5] hover:bg-[#f3ede3] border border-stone-200/90 rounded-xl text-xs font-bold text-[#8b6f4e] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5">
                <HiOutlineUpload className="w-4 h-4" />
                <span>{uploadingImage ? 'Uploading...' : formData.image?.url ? 'Change Image' : 'Select Image'}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-normal">
                JPG, PNG, WebP (Max 5 MB)
              </span>
            </button>
          </div>

          {/* ─── 2. Article Information Card ─── */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-900 tracking-wide">
              Article Information
            </h3>

            {/* Read Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">Read Time</label>
                <button
                  type="button"
                  onClick={() => {
                    const clean = (formData.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    const words = clean ? clean.split(/\s+/).length : 0;
                    const mins = Math.max(1, Math.ceil(words / 200));
                    setFormData((prev) => ({ ...prev, readTime: `${mins} min read` }));
                    toast.success(`Calculated: ${mins} min read`);
                  }}
                  className="text-[10px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer"
                >
                  Auto-calculate
                </button>
              </div>
              <Dropdown
                value={formData.readTime}
                onChange={(val) => setFormData((prev) => ({ ...prev, readTime: val }))}
                prefixIcon={<HiOutlineClock className="w-4 h-4 text-stone-400" />}
                options={[
                  { value: '1 min read', label: '1 min read' },
                  { value: '2 min read', label: '2 min read' },
                  { value: '3 min read', label: '3 min read' },
                  { value: '4 min read', label: '4 min read' },
                  { value: '5 min read', label: '5 min read' },
                  { value: '7 min read', label: '7 min read' },
                  { value: '10 min read', label: '10 min read' },
                ]}
                buttonClassName="w-full h-10 px-3.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 bg-white shadow-2xs hover:border-[#8b6f4e]"
                menuClassName="z-[60]"
              />
            </div>

            {/* Publication Status */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Publication Status
              </label>
              <Dropdown
                value={formData.status}
                onChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                showStatusDot
                options={[
                  { value: 'active', label: 'Active (Published to Store)', dotColor: 'bg-emerald-500' },
                  { value: 'inactive', label: 'Draft / Hidden', dotColor: 'bg-stone-400' },
                ]}
                buttonClassName="w-full h-10 px-3.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 bg-white shadow-2xs hover:border-[#8b6f4e]"
                menuClassName="z-[60]"
              />
            </div>

            {/* Publish Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Publish Date
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-stone-400 pointer-events-none">
                  <HiOutlineCalendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, publishDate: e.target.value }))}
                  className="w-full h-10 pl-10 pr-9 rounded-xl border border-stone-200 hover:border-stone-300 focus:border-[#8b6f4e] text-xs font-medium text-stone-800 outline-none bg-white shadow-2xs cursor-pointer"
                />
                {formData.publishDate && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, publishDate: '' }))}
                    className="absolute right-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                    title="Clear date"
                  >
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Author
              </label>
              <input
                type="text"
                placeholder="Neirah Atelier"
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                className="w-full h-10 px-3.5 rounded-xl border border-stone-200 hover:border-stone-300 focus:border-[#8b6f4e] text-xs font-medium text-stone-800 outline-none bg-white shadow-2xs"
              />
            </div>

            {/* Tags (comma-separated interactive pills) */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tags <span className="text-stone-400 font-normal">(comma-separated)</span>
              </label>
              <div className="min-h-11 p-2 rounded-xl border border-stone-200 hover:border-stone-300 focus-within:border-[#8b6f4e] bg-white shadow-2xs flex flex-wrap items-center gap-1.5 transition-colors">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#faf5ee] border border-[#e8ddce] text-[11px] font-semibold text-[#8b6f4e]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <HiOutlineX className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={formData.tags.length === 0 ? 'Add a tag...' : 'Add tag...'}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
                      handleRemoveTag(formData.tags[formData.tags.length - 1]);
                    }
                  }}
                  onBlur={() => handleAddTag()}
                  className="flex-1 min-w-[90px] h-7 px-1 text-xs text-stone-800 placeholder:text-stone-400 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
