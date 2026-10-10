import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlinePencil,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';

import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useConfirm } from '../../contexts/ConfirmContext';
import Dropdown from '../../components/common/Dropdown';

// Helper to extract clean embed URL from Instagram URL
const getEmbedUrl = (rawUrl) => {
  if (!rawUrl) return '';
  try {
    let clean = rawUrl.trim();
    if (clean.startsWith('http://')) {
      clean = 'https://' + clean.slice(7);
    }
    // Remove query parameters and trailing slashes
    clean = clean.split('?')[0].replace(/\/+$/, '');
    return `${clean}/embed`;
  } catch {
    return '';
  }
};

// Helper to extract Instagram shortcode (e.g. DePpb0fM5TJ from /p/DePpb0fM5TJ/)
const getPostShortcode = (rawUrl) => {
  if (!rawUrl) return '';
  const match = rawUrl.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : '';
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active', dotColor: 'bg-emerald-500' },
  { value: 'inactive', label: 'Inactive', dotColor: 'bg-stone-400' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

export default function InstagramPostsView() {
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [originalPosts, setOriginalPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Reorder state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/instagram-posts?limit=100');
      const data = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setPosts(data);
      setOriginalPosts(data);
      setHasUnsavedOrder(false);
    } catch (err) {
      console.error('Failed to load Instagram posts:', err);
      toast.error('Failed to load Instagram posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Filtered posts based on Search and Status
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.url && p.url.toLowerCase().includes(q)) ||
          (p._id && p._id.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const wantActive = statusFilter === 'active';
      result = result.filter((p) => (p.isActive !== false) === wantActive);
    }

    return result;
  }, [posts, search, statusFilter]);

  // Paginated items
  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedPosts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, safeCurrentPage, pageSize]);

  // Counts for stat cards
  const totalPostsCount = posts.length;
  const activeCount = posts.filter((p) => p.isActive !== false).length;

  // Selection handlers
  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open modal for new post
  const handleOpenAddModal = () => {
    setEditingPost(null);
    setTitle('');
    setUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setTitle(post.title || '');
    setUrl(post.url || '');
    setIsActive(post.isActive !== false);
    setIsModalOpen(true);
  };

  // Submit modal form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter an Instagram post or reel URL');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        url: url.trim(),
        isActive,
      };

      if (editingPost) {
        await api.put(`/instagram-posts/${editingPost._id}`, payload);
        toast.success('Instagram post updated successfully');
      } else {
        payload.order = posts.length + 1;
        await api.post('/instagram-posts', payload);
        toast.success('Instagram post added successfully');
      }

      setIsModalOpen(false);
      setTitle('');
      setUrl('');
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete post
  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Instagram Post',
      message: 'Are you sure you want to delete this Instagram post? This action cannot be undone.',
      confirmText: 'Delete Post',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/instagram-posts/${id}`);
      toast.success('Instagram post deleted successfully');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;

    const isConfirmed = await confirm({
      title: 'Delete Selected Instagram Posts',
      message: `Are you sure you want to delete ${count} selected post${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      try {
        await api.post('/instagram-posts/bulk-delete', { ids: selectedIds });
      } catch (bulkErr) {
        await Promise.allSettled(
          selectedIds.map((id) => api.delete(`/instagram-posts/${id}`))
        );
      }
      toast.success(`${count} post${count > 1 ? 's' : ''} deleted successfully`);
      setSelectedIds([]);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Drag and Drop reordering logic
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = () => {
    // Keep it responsive
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...posts];
    const [movedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    // Update order numbers
    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setPosts(reordered);
    setHasUnsavedOrder(true);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const itemsToUpdate = posts.map((p, idx) => ({
        _id: p._id,
        id: p._id,
        order: idx + 1,
      }));

      try {
        await api.put('/instagram-posts/reorder', { items: itemsToUpdate });
      } catch (reorderErr) {
        // Fallback: update individual items
        await Promise.all(
          itemsToUpdate.map((item) =>
            api.put(`/instagram-posts/${item._id}`, {
              order: item.order,
            })
          )
        );
      }

      toast.success('Instagram posts order saved successfully');
      setOriginalPosts(posts);
      setHasUnsavedOrder(false);
      fetchPosts();
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('Failed to save posts order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setPosts(originalPosts);
    setHasUnsavedOrder(false);
    toast.info('Reordering cancelled');
  };

  // Helper for title with clean fallback based on title or URL
  const getPostTitle = (post, idx) => {
    if (post?.title && post.title.trim()) return post.title.trim();
    const shortcode = getPostShortcode(post?.url);
    if (shortcode) return `Post (${shortcode})`;
    const order = post?.order || idx + 1;
    return `Instagram Post #${order}`;
  };

  // Helper to format post creation date (matching design e.g. 5 Oct 2025)
  const formatPostDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage, '...', totalPages];
  }, [totalPages, safeCurrentPage]);

  return (
    <div className="space-y-4 pb-8">
      {/* ─── 1. Header (Camera Icon, Title, Subtitle, + Add Post Button) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Rounded square camera icon */}
          <div className="w-12 h-12 rounded-xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-stone-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight leading-none">
              Instagram Posts
            </h1>
            <p className="text-xs text-stone-500 font-normal mt-1.5">
              Manage posts and arrange how they appear on your website.
            </p>
          </div>
        </div>

        {/* + Add Post Button */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlineTrash className="w-4 h-4" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#8c6d46] hover:bg-[#785d3b] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-2" />
            <span>Add Post</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Total Posts */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-[#faf4ed] border border-[#f2e7db] flex items-center justify-center shrink-0">
            <HiOutlinePhotograph className="w-5 h-5 text-[#8c6d46]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-stone-900 leading-none">
                {totalPostsCount}
              </span>
              <span className="text-xs font-semibold text-stone-800">Posts</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Total Instagram posts</p>
          </div>
        </div>

        {/* Card 2: Active Posts */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-full bg-[#ecf8ee] border border-[#d6f0d9] flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-[#10b981]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-stone-900 leading-none">
                {activeCount}
              </span>
              <span className="text-xs font-semibold text-stone-800">Active</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Currently active posts</p>
          </div>
        </div>
      </div>

      {/* ─── 3. Search & Filter Bar ─── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by URL or title..."
            className="w-full h-10 pl-9 pr-4 text-xs bg-white border border-stone-200/90 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6d46] focus:border-[#8c6d46] shadow-2xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-3 flex-wrap">


          {/* Status Filter */}
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-0.5 ml-0.5">
              Status
            </span>
            <Dropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={STATUS_OPTIONS}
              showStatusDot
              size="sm"
              className="w-36 sm:w-40"
              buttonClassName="!h-9 rounded-lg border-stone-200/90 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. Posts Grid (5 cards per row on large screen) ─── */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 bg-white rounded-xl border border-stone-200/90 shadow-2xs">
          <div className="animate-spin w-6 h-6 border-2 border-[#8c6d46] border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs font-medium">Loading Instagram feed...</p>
        </div>
      ) : paginatedPosts.length === 0 ? (
        <div className="py-20 text-center text-stone-400 bg-white rounded-xl border border-stone-200/90 shadow-2xs">
          <p className="text-sm font-medium text-stone-600">No Instagram posts found</p>
          <p className="text-xs text-stone-400 mt-1">
            Try adjusting your search query or add a new Instagram post.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedPosts.map((post, idx) => {
            const overallIdx = (safeCurrentPage - 1) * pageSize + idx;
            const isSelected = selectedIds.includes(post._id);
            const isDropTarget = dragOverIdx === overallIdx;
            const isDraggingThis = draggedIdx === overallIdx;

            const embedUrl = getEmbedUrl(post.url);
            const postTitle = getPostTitle(post, overallIdx);
            const displayOrder = post.order || overallIdx + 1;
            const formattedOrder = String(displayOrder).padStart(2, '0');

            return (
              <div
                key={post._id || idx}
                draggable
                onDragStart={(e) => handleDragStart(e, overallIdx)}
                onDragOver={(e) => handleDragOver(e, overallIdx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, overallIdx)}
                className={`bg-white rounded-2xl border p-3 sm:p-3.5 shadow-2xs flex flex-col gap-2.5 group relative transition-all duration-200 ${
                  isDraggingThis
                    ? 'opacity-40 scale-95 border-dashed border-[#8c6d46]'
                    : isDropTarget
                    ? 'border-[#8c6d46] ring-2 ring-[#8c6d46]/30 scale-[1.02]'
                    : isSelected
                    ? 'border-[#8c6d46] ring-2 ring-[#8c6d46]/30 shadow-xs'
                    : 'border-stone-200/90 hover:border-[#8c6d46]/40 hover:shadow-xs'
                }`}
              >
                {/* 1. Card Top Bar: Selection Checkbox on Left, Order & Status Badges on Right */}
                <div className="flex items-center justify-between gap-2 px-0.5">
                  {/* Left: Selection Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(post._id)}
                      className="w-4 h-4 rounded border-stone-300 text-[#8c6d46] focus:ring-[#8c6d46] cursor-pointer"
                    />
                  </div>

                  {/* Right: Order Badge & Status Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg border border-stone-200/90 bg-stone-50 text-[11px] font-mono font-bold text-stone-700 shadow-2xs">
                      {formattedOrder}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold shadow-2xs ${
                        post.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-stone-100 text-stone-500 border-stone-200/80'
                      }`}
                    >
                      {post.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* 2. Card Middle: Clean Instagram Live Embed (Clipped header to remove View profile button) */}
                <div
                  className="w-full h-[360px] rounded-xl overflow-hidden bg-black border border-stone-200/60 flex items-center justify-center cursor-pointer relative"
                  onClick={() => setViewingPost(post)}
                >
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={postTitle}
                      loading="lazy"
                      className="w-full h-[calc(100%+64px)] -mt-[62px] border-0 pointer-events-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-2xs mb-2">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                      <span className="text-xs text-stone-500 font-mono truncate max-w-full">
                        {post.url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Post Title / Caption (if present) */}
                {post.title ? (
                  <p
                    className="text-xs font-semibold text-stone-800 truncate px-0.5 leading-snug cursor-pointer hover:text-[#8c6d46] transition-colors"
                    title={post.title}
                    onClick={() => setViewingPost(post)}
                  >
                    {post.title}
                  </p>
                ) : null}

                {/* 3. Card Bottom Bar: Drag Handle + Date on Left, Actions on Right */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
                  {/* Left: Drag Handle & Date */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors shrink-0"
                      title="Drag to reorder"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M9 5a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM9 13a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-stone-400 truncate">
                      {formatPostDate(post.meta?.createdAt)}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(post);
                      }}
                      className="w-7 h-7 rounded-lg border border-stone-200/90 text-stone-500 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Edit Post"
                    >
                      <HiOutlinePencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post._id);
                      }}
                      className="w-7 h-7 rounded-lg border border-stone-200/90 text-rose-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Delete Post"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 5. Pagination Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-stone-500 select-none">
        {/* Left: Showing Range */}
        <div className="text-xs text-stone-500 font-normal">
          Showing{' '}
          <span className="font-semibold text-stone-700">
            {totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
          </span>
          –
          <span className="font-semibold text-stone-700">
            {Math.min(safeCurrentPage * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-semibold text-stone-700">{totalItems}</span> posts
        </div>

        {/* Right: Rows per page + Page numbers */}
        <div className="flex items-center gap-3">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>Rows per page</span>
            <Dropdown
              value={pageSize}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={PAGE_SIZE_OPTIONS}
              size="sm"
              openUpward
              className="w-20"
              buttonClassName="!h-7 !px-2.5 text-xs font-semibold rounded-md border-stone-200/90"
            />
          </div>

          {/* Page numbers navigation */}
          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-md border border-stone-200/90 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Previous"
            >
              <HiOutlineChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Numbers */}
            {pageNumbers.map((num, i) => {
              if (num === '...') {
                return (
                  <span key={`ell-${i}`} className="px-1 text-stone-400 font-mono">
                    ...
                  </span>
                );
              }
              const isActive = num === safeCurrentPage;
              return (
                <button
                  key={`page-${num}`}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#8c6d46] text-white shadow-2xs'
                      : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/90'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            {/* Next */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages || totalItems === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded-md border border-stone-200/90 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Next"
            >
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 6. Bottom Notice & Reorder Action Bar (appears automatically on drag) ─── */}
      {hasUnsavedOrder && (
        <div className="bg-[#faf6f0] border border-[#ebdcc9] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          {/* Left: Drag instruction with icon */}
          <div className="flex items-center gap-2.5 text-stone-700 text-xs font-medium">
            <svg className="w-4 h-4 text-stone-400 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M9 5a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM9 13a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <span>
              Order changed. Click Save Order to apply changes to your website.
            </span>
          </div>

          {/* Right: Cancel & Save Order buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCancelOrder}
              className="px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={savingOrder}
              className="px-5 py-2 rounded-lg bg-[#8c6d46] hover:bg-[#785d3b] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingOrder ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        </div>
      )}

      {/* ─── 7. Modal: Add / Edit Instagram Post ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#faf4ed] border border-[#f2e7db] flex items-center justify-center text-[#8c6d46]">
                  <HiOutlinePhotograph className="w-5 h-5 text-[#8c6d46]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-lg">
                    {editingPost ? 'Edit Instagram Post' : 'Add Instagram Post'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Arrange how this post appears across your storefront
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                  POST TITLE / HEADING
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solitaire Ring Elegance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c6d46]/30 focus:border-[#8c6d46] transition-all"
                />
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-1.5">
                  INSTAGRAM URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/p/... or https://www.instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c6d46]/30 focus:border-[#8c6d46] transition-all"
                />
              </div>


              {/* Status Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <div>
                  <span className="block text-xs font-semibold text-stone-900">
                    Storefront Visibility
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Show this post in customer social feeds
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                    isActive ? 'bg-[#8c6d46]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                      isActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#8c6d46] hover:bg-[#785d3b] text-white text-xs font-bold tracking-wider uppercase transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingPost ? 'Update Post' : 'Add Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 8. Modal: Preview Instagram Post ─── */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#faf4ed] flex items-center justify-center text-[#8c6d46]">
                  <HiOutlinePhotograph className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-stone-900 text-base">
                  {viewingPost.title || 'Instagram Post'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPost(null)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Post Embed Preview */}
              <div className="relative w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200/80 min-h-[360px] flex items-center justify-center">
                {getEmbedUrl(viewingPost.url) ? (
                  <iframe
                    src={getEmbedUrl(viewingPost.url)}
                    title={getPostTitle(viewingPost, 0)}
                    className="w-full h-[400px] border-0"
                  />
                ) : (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white mx-auto mb-2 shadow-xs">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <p className="text-xs text-stone-500 font-mono">{viewingPost.url}</p>
                  </div>
                )}
              </div>

              {/* URL */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                  INSTAGRAM URL
                </div>
                <div className="text-xs font-mono text-stone-800 break-all select-all">
                  {viewingPost.url}
                </div>
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-stone-100 bg-stone-50">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">
                    DISPLAY ORDER
                  </span>
                  <span className="font-bold font-mono text-stone-900">
                    #{String(viewingPost.order ?? 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-stone-100 bg-stone-50">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">
                    STATUS
                  </span>
                  <span
                    className={`font-bold uppercase ${
                      viewingPost.isActive !== false ? 'text-emerald-600' : 'text-stone-400'
                    }`}
                  >
                    {viewingPost.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <a
                  href={viewingPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-[#8c6d46] hover:bg-[#785d3b] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Open On Instagram</span>
                  <HiOutlineExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingPost(null)}
                  className="px-4 py-2.5 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
