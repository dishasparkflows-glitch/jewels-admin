import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlinePencil,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import { FaInstagram } from 'react-icons/fa';
import { IoGridOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Dropdown from '../../components/common/Dropdown';

export default function InstagramPostsView() {
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [url, setUrl] = useState('');
  const [position, setPosition] = useState('grid-1');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/instagram-posts?limit=100');
      const data = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setPosts(data);
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

  // Filtered posts (Search query only - NO active/inactive filter)
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        (p.url && p.url.toLowerCase().includes(q)) ||
        (p.position && String(p.position).toLowerCase().includes(q))
    );
  }, [posts, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredPosts, 10);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open modal for new post
  const handleOpenAddModal = () => {
    setEditingPost(null);
    setUrl('');
    setPosition(`grid-${(posts.length % 6) + 1}`);
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setUrl(post.url || '');
    setPosition(post.position || 'grid-1');
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
        url: url.trim(),
        position: position || 'grid-1',
        isActive,
      };

      if (editingPost) {
        await api.put(`/instagram-posts/${editingPost._id}`, payload);
        toast.success('Instagram post updated successfully');
      } else {
        await api.post('/instagram-posts', payload);
        toast.success('Instagram post added successfully');
      }

      setIsModalOpen(false);
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

  // Toggle active status
  const handleToggleStatus = async (post) => {
    try {
      const nextActive = !post.isActive;
      await api.put(`/instagram-posts/${post._id}`, { isActive: nextActive });
      toast.success(`Post ${nextActive ? 'activated' : 'deactivated'}`);
      fetchPosts();
    } catch (err) {
      toast.error('Failed to update status');
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
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Export handlers
  const handleExport = (format) => {
    const dataToExport = filteredPosts.map((p, idx) => ({
      Index: idx + 1,
      ID: p._id,
      URL: p.url,
      Position: p.position || 'grid-1',
      Type: p.url.includes('/reel/') ? 'Reel' : 'Post',
      Status: p.isActive !== false ? 'Active' : 'Inactive',
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      });
      const exportUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = exportUrl;
      a.download = `instagram_posts_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(exportUrl);
      toast.success('Exported Instagram posts as JSON');
    } else {
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const rows = dataToExport.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const exportUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = exportUrl;
      a.download = `instagram_posts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(exportUrl);
      toast.success('Exported Instagram posts as CSV');
    }
  };

  // Stat cards
  const activeCount = posts.filter((p) => p.isActive !== false).length;
  const reelCount = posts.filter((p) => p.url && p.url.includes('/reel/')).length;
  const photoCount = posts.length - reelCount;

  const statCardsData = [
    {
      label: 'Total Posts',
      value: posts.length,
      icon: FaInstagram,
      color: 'bronze',
    },
    {
      label: 'Active Feed Items',
      value: activeCount,
      icon: HiOutlinePhotograph,
      color: 'green',
    },
    {
      label: 'Reels Linked',
      value: reelCount,
      icon: IoGridOutline,
      color: 'peach',
    },
    {
      label: 'Photos Linked',
      value: photoCount > 0 ? photoCount : 0,
      icon: HiOutlineExternalLink,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Module Header (Breadcrumbs, Title, Export, Add) ─── */}
      <ModuleHeader
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Marketing' },
          { label: 'Instagram Posts' },
        ]}
        title="Instagram Posts"
        subtitle="Configure storefront social feed, live Instagram media links, and grid placements."
        onExport={handleExport}
        onAdd={handleOpenAddModal}
        addLabel="Add Post"
      />

      {/* ─── 4 Stat Cards ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        searchPlaceholder="Search posts by URL or grid position..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* ─── Table Container (Luxury Neirah Style) ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 bg-[#faf8f5]/60 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-2 pl-4 pr-1 w-8 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                    onChange={handleSelectAll}
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((p) => selectedIds.includes(p._id))
                    }
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3">INSTAGRAM POST / REEL</th>
                <th className="py-2 px-3">GRID POSITION</th>
                <th className="py-2 px-3">CONTENT TYPE</th>
                <th className="py-2 px-3">STATUS</th>
                <th className="py-2 pr-4 pl-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading Instagram feed...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    No Instagram posts found matching &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((post, idx) => {
                  const isSelected = selectedIds.includes(post._id);
                  const isReel = post.url?.includes('/reel/');

                  return (
                    <tr
                      key={post._id}
                      onClick={() => setViewingPost(post)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectItem(post._id)}
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* URL & Link */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <FaInstagram className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 max-w-md leading-tight">
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-stone-900 hover:text-[#8b6f4e] text-xs flex items-center gap-1 truncate transition-colors leading-none"
                            >
                              <span className="truncate">{post.url}</span>
                              <HiOutlineExternalLink className="w-3 h-3 shrink-0 text-stone-400" />
                            </a>
                            <div className="text-[10px] text-stone-400 font-mono leading-none mt-1">
                              ID: #{post._id?.slice(-6)?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                          {post.position || 'GRID-1'}
                        </span>
                      </td>

                      {/* Content Type */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-stone-100 text-stone-700 border border-stone-200">
                          {isReel ? 'Instagram Reel' : 'Photo Post'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(post)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                            post.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/60'
                              : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              post.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                          <span>{post.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 text-right">
                        <RowActions
                          onPreview={() => setViewingPost(post)}
                          onEdit={() => handleOpenEditModal(post)}
                          onDelete={() => handleDelete(post._id)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Luxury Standard Pagination ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="posts"
        />
      </div>

      {/* ─── Modal: Add / Edit Instagram Post ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center">
                  <FaInstagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-lg">
                    {editingPost ? 'Edit Instagram Post' : 'Add Instagram Post'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Embed an Instagram post or reel onto your homepage feed
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
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Instagram URL */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                  INSTAGRAM URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/p/... or https://www.instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/30 focus:border-[#8b6f4e] transition-all"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Supports public post URLs (/p/...) and reel URLs (/reel/...).
                </p>
              </div>

              {/* Grid Position */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                  GRID POSITION
                </label>
                <Dropdown
                  value={position}
                  onChange={(val) => setPosition(val)}
                  options={[
                    { value: 'grid-1', label: 'Position 1 (Grid-1)' },
                    { value: 'grid-2', label: 'Position 2 (Grid-2)' },
                    { value: 'grid-3', label: 'Position 3 (Grid-3)' },
                    { value: 'grid-4', label: 'Position 4 (Grid-4)' },
                    { value: 'grid-5', label: 'Position 5 (Grid-5)' },
                    { value: 'grid-6', label: 'Position 6 (Grid-6)' },
                  ]}
                  buttonClassName="h-11 rounded-lg text-xs font-semibold"
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
                    isActive ? 'bg-[#8b6f4e]' : 'bg-stone-300'
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
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
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
                  className="px-6 py-2.5 rounded-lg bg-[#8b6f4e] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingPost ? 'Update Post' : 'Add Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Preview Instagram Post ─── */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]">
              <div className="flex items-center gap-2">
                <FaInstagram className="w-5 h-5 text-rose-500" />
                <span className="font-serif font-bold text-stone-900 text-base">
                  Instagram Post Details
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

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                  POST URL
                </div>
                <div className="text-xs font-mono text-stone-800 break-all select-all">
                  {viewingPost.url}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-stone-100 bg-stone-50">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">
                    POSITION
                  </span>
                  <span className="font-bold text-stone-900 uppercase">
                    {viewingPost.position || 'GRID-1'}
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

              <div className="pt-2 flex gap-3">
                <a
                  href={viewingPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-[#8b6f4e] hover:bg-[#7b5b33] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-1.5"
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
