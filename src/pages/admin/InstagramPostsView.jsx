import React, { useState, useEffect } from 'react';
import {
  HiOutlineLink,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlinePencil,
  HiOutlineCheck,
} from 'react-icons/hi';
import { FaInstagram } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function InstagramPostsView() {
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(posts, 10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [url, setUrl] = useState('');
  const [position, setPosition] = useState('grid-1');
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/instagram-posts?limit=50');
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

  // Open modal for new post
  const handleOpenAddModal = () => {
    setEditingPost(null);
    setUrl('');
    setPosition(`grid-${(posts.length % 6) + 1}`);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setUrl(post.url || '');
    setPosition(post.position || 'grid-1');
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
        isActive: true,
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Top Page Header (Matches Screenshot Background) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Instagram Master
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Configure and manage featured Instagram posts on your storefront.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD POST</span>
        </button>
      </div>

      {/* ─── Posts Table ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">INSTAGRAM POST / REEL</th>
                <th className="py-4 px-6">POSITION</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading Instagram posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400">
                    No Instagram posts configured. Click <b>+ ADD POST</b> to link your first reel or post.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((post) => (
                  <tr key={post._id} className="hover:bg-stone-50/60 transition-colors">
                    {/* URL & Link */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <FaInstagram className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-stone-900 hover:text-[#8f6d43] text-xs flex items-center gap-1.5 truncate max-w-md transition-colors"
                          >
                            <span className="truncate">{post.url}</span>
                            <HiOutlineExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                          </a>
                          <span className="text-[10px] text-stone-400">
                            {post.url.includes('/reel/') ? 'Instagram Reel' : 'Instagram Photo Post'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-stone-700 border border-stone-200">
                        {post.position || 'grid-1'}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
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
                        <span>{post.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(post)}
                          title="Edit Post"
                          className="p-1.5 text-sky-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          title="Delete Post"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Luxury Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ─── Modal (Matches User Screenshot Exactly) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-lg tracking-tight">
                  {editingPost ? 'Edit Instagram Post' : 'Add Instagram Post'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mt-0.5">
                  POST CONFIGURATION
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  INSTAGRAM URL *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-stone-400 pointer-events-none">
                    <HiOutlineLink className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    required
                    placeholder="https://www.instagram.com/p/... or https://www.instagram.com/reel/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-lg border border-stone-200/90 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{submitting ? 'SAVING...' : editingPost ? 'UPDATE POST' : 'ADD POST'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
