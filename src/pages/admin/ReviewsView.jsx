import React, { useState, useEffect } from 'react';
import {
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi';
import { IoStar } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function ReviewsView() {
  const confirm = useConfirm();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    rating: 5,
    status: 'approved',
    comment: '',
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews?limit=50');
      const data = res.data?.data?.items || res.data?.data || [];
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      toast.error('Failed to load customer reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.comment) {
      toast.error('Please enter client name and feedback comment');
      return;
    }

    try {
      if (editingReview) {
        await api.put(`/reviews/${editingReview._id}`, formData);
        toast.success('Review updated successfully');
      } else {
        await api.post('/reviews', formData);
        toast.success('Review added successfully');
      }
      setShowAddModal(false);
      setEditingReview(null);
      setFormData({ clientName: '', rating: 5, status: 'approved', comment: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (rev) => {
    setEditingReview(rev);
    setFormData({
      clientName: rev.clientName,
      rating: rev.rating || 5,
      status: rev.status || 'approved',
      comment: rev.comment,
    });
    setShowAddModal(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'rejected' : 'approved';
    try {
      await api.put(`/reviews/${id}`, { status: nextStatus });
      toast.success(`Review status changed to ${nextStatus}`);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status toggle failed');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Customer Review',
      message: 'Are you sure you want to delete this customer review? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const displayedReviews = reviews.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (r.clientName || '').toLowerCase();
    const comment = (r.comment || '').toLowerCase();
    return name.includes(q) || comment.includes(q);
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(displayedReviews, 10);

  const formatDate = (dateStr) => {
    if (!dateStr) return '24 SEPT 2026';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header (Matches Screenshot 5) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Customer Reviews
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Listen to your clientele's feedback
          </p>
        </div>
        <button
          onClick={() => {
            setEditingReview(null);
            setFormData({ clientName: '', rating: 5, status: 'approved', comment: '' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD REVIEW</span>
        </button>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm p-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search feedback content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
          />
        </div>
      </div>

      {/* ─── Reviews Table (Matches Screenshot 5) ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">CLIENT & DATE</th>
                <th className="py-4 px-6">RATING</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6">COMMENT</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading clientele reviews...
                  </td>
                </tr>
              ) : displayedReviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-stone-400">
                    No customer reviews found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((rev) => (
                  <tr key={rev._id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Client & Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center border border-stone-200">
                          <HiOutlineUser className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{rev.clientName}</p>
                          <p className="text-[11px] text-stone-400 font-medium tracking-wide">
                            {formatDate(rev.reviewDate || rev.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-800">{rev.rating || 5}/5</p>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <IoStar
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (rev.rating || 5) ? 'text-amber-400' : 'text-stone-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {rev.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <HiOutlineCheckCircle className="w-3 h-3" />
                          <span>APPROVED</span>
                        </span>
                      ) : rev.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          <HiOutlineBan className="w-3 h-3" />
                          <span>REJECTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Comment */}
                    <td className="py-4 px-6">
                      <p className="text-stone-600 text-xs italic max-w-md line-clamp-2 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(rev._id, rev.status)}
                          title={rev.status === 'approved' ? 'Mark as Rejected' : 'Mark as Approved'}
                          className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        >
                          <HiOutlineBan className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(rev)}
                          title="Edit Review"
                          className="p-1.5 text-sky-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rev._id)}
                          title="Delete Review"
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

      {/* ─── Add/Edit Modal ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingReview ? 'Edit Review' : 'Add Customer Review'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Disha Radadiya"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Rating (1-5)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43]"
                  >
                    <option value={5}>5 - Excellent ★★★★★</option>
                    <option value={4}>4 - Very Good ★★★★</option>
                    <option value={3}>3 - Good ★★★</option>
                    <option value={2}>2 - Fair ★★</option>
                    <option value={1}>1 - Poor ★</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43]"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Client Feedback Comment
                </label>
                <textarea
                  rows={4}
                  placeholder="Share feedback on jewellery craftsmanship, delivery, or service..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {editingReview ? 'Update Review' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
