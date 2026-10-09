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
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

export default function ReviewsView() {
  const confirm = useConfirm();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Form State matching customer and review schema
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    rating: 5,
    status: 'approved',
    comment: '',
    reviewDate: '',
    image: { url: '', key: '' },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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

  const handleOpenAddModal = () => {
    setEditingReview(null);
    setFormData({
      name: '',
      email: '',
      title: '',
      rating: 5,
      status: 'approved',
      comment: '',
      reviewDate: new Date().toISOString().split('T')[0],
      image: { url: '', key: '' },
    });
    setImageFile(null);
    setImagePreview('');
    setHoverRating(0);
    setShowAddModal(true);
  };

  const handleEdit = (rev) => {
    setEditingReview(rev);
    const dateVal = rev.review?.reviewDate || rev.meta?.createdAt;
    setFormData({
      name: rev.customer?.name || '',
      email: rev.customer?.email || '',
      title: rev.review?.title || '',
      rating: rev.review?.rating || 5,
      status: rev.status || 'approved',
      comment: rev.review?.comment || '',
      reviewDate: dateVal ? new Date(dateVal).toISOString().split('T')[0] : '',
      image: rev.image || { url: '', key: '' },
    });
    setImageFile(null);
    setImagePreview(rev.image?.url || '');
    setHoverRating(0);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter review title');
      return;
    }
    if (!formData.comment.trim()) {
      toast.error('Please enter review comment');
      return;
    }

    try {
      setSubmitting(true);
      let imageData = formData.image;

      if (imageFile) {
        try {
          const uploaded = await uploadWithPresignedUrl(imageFile, 'reviews');
          imageData = { url: uploaded.fileUrl, key: uploaded.key };
        } catch (uploadErr) {
          console.warn('Presigned upload failed, falling back to single upload:', uploadErr);
          const fd = new FormData();
          fd.append('file', imageFile);
          const upRes = await api.post('/upload/single?folder=reviews', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageData = {
            url: upRes.data?.data?.url || upRes.data?.url || '',
            key: upRes.data?.data?.key || upRes.data?.key || '',
          };
        }
      }

      const payload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
        },
        review: {
          title: formData.title.trim(),
          rating: Number(formData.rating),
          comment: formData.comment.trim(),
          reviewDate: formData.reviewDate ? new Date(formData.reviewDate) : new Date(),
        },
        image: imageData,
        status: formData.status,
      };

      if (editingReview) {
        await api.put(`/reviews/${editingReview._id}`, payload);
        toast.success('Review updated successfully');
      } else {
        await api.post('/reviews', payload);
        toast.success('Review added successfully');
      }

      setShowAddModal(false);
      setEditingReview(null);
      setImageFile(null);
      setImagePreview('');
      fetchReviews();
    } catch (err) {
      console.error('Error saving review:', err);
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
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
    const name = (r.customer?.name || '').toLowerCase();
    const email = (r.customer?.email || '').toLowerCase();
    const title = (r.review?.title || '').toLowerCase();
    const comment = (r.review?.comment || '').toLowerCase();
    return (
      name.includes(q) ||
      email.includes(q) ||
      title.includes(q) ||
      comment.includes(q)
    );
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
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Listen to your clientele's feedback and showcase verified stories.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
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
            placeholder="Search feedback by reviewer name, email, title, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
          />
        </div>
      </div>

      {/* ─── Reviews Table ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">REVIEWER</th>
                <th className="py-4 px-6">SCORE</th>
                <th className="py-4 px-6">REVIEW & TITLE</th>
                <th className="py-4 px-6">STATUS</th>
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
                paginatedItems.map((rev) => {
                  const reviewerName = rev.customer?.name || 'Anonymous';
                  const reviewerEmail = rev.customer?.email || '';
                  const reviewTitle = rev.review?.title || '';
                  const reviewRating = rev.review?.rating || 5;
                  const reviewComment = rev.review?.comment || '';
                  const reviewDate = rev.review?.reviewDate || rev.meta?.createdAt;

                  return (
                    <tr key={rev._id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Client & Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {rev.image?.url ? (
                            <img
                              src={rev.image.url}
                              alt={reviewerName}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center border border-stone-200 shrink-0">
                              <HiOutlineUser className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-stone-900 text-xs">{reviewerName}</p>
                            {reviewerEmail && (
                              <p className="text-[10px] text-stone-400 font-medium">
                                {reviewerEmail}
                              </p>
                            )}
                            <p className="text-[10px] text-stone-400 font-medium tracking-wide">
                              {formatDate(reviewDate)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Score / Rating */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-0.5 text-[#96724a]">
                            {[...Array(5)].map((_, i) => (
                              <IoStar
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < reviewRating ? 'text-[#96724a]' : 'text-stone-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] font-bold text-stone-400">{reviewRating}/5 STARS</p>
                        </div>
                      </td>

                      {/* Review Title & Comment */}
                      <td className="py-4 px-6">
                        <div className="max-w-md space-y-0.5">
                          {reviewTitle && (
                            <p className="font-semibold text-stone-900 text-xs">
                              {reviewTitle}
                            </p>
                          )}
                          <p className="text-stone-600 text-xs italic line-clamp-2 leading-relaxed">
                            "{reviewComment}"
                          </p>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ─── WRITE / EDIT A REVIEW Modal ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-[28px] max-w-xl w-full p-8 sm:p-10 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: WRITE A REVIEW + Circle Close Button */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="font-bold text-stone-900 text-base sm:text-lg tracking-wider uppercase font-sans">
                {editingReview ? 'EDIT REVIEW' : 'WRITE A REVIEW'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full border border-stone-200 text-stone-400 hover:text-stone-700 hover:border-stone-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-red-500 font-medium">
              * Indicates a required field
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SCORE: 5 Gold Stars */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800 tracking-wider uppercase">
                  SCORE:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110 cursor-pointer p-0.5"
                    >
                      <IoStar
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating || formData.rating)
                            ? 'text-[#96724a]'
                            : 'text-stone-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800 tracking-wider uppercase">
                    <span className="text-red-500">*</span> CUSTOMER NAME:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Krushnakant Jayswal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800 tracking-wider uppercase">
                    CUSTOMER EMAIL:
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. krushnakant@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-4 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>
              </div>

              {/* * TITLE: */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800 tracking-wider uppercase">
                  <span className="text-red-500">*</span> TITLE:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exquisite Diamond Solitaire"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-12 px-4 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* * REVIEW COMMENT: */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800 tracking-wider uppercase">
                  <span className="text-red-500">*</span> REVIEW:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your review here..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full p-4 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all resize-y"
                />
              </div>

              {/* UPLOAD IMAGE (OPTIONAL): */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800 tracking-wider uppercase">
                  UPLOAD IMAGE (OPTIONAL):
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 group shrink-0">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData({ ...formData, image: { url: '', key: '' } });
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center transition-opacity cursor-pointer"
                        title="Remove image"
                      >
                        <HiOutlineX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 hover:border-stone-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white shrink-0">
                      <HiOutlinePlus className="w-5 h-5 text-stone-400 stroke-2 mb-1" />
                      <span className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
                        UPLOAD
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-stone-400 font-normal leading-relaxed max-w-xs">
                    A square image is recommended for best display.
                  </p>
                </div>
              </div>

              {/* Admin Moderation Status */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    MODERATION STATUS:
                  </span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Footer Button: SUBMIT REVIEW */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 bg-[#c2aa91] hover:bg-[#b2977d] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{submitting ? 'SUBMITTING...' : editingReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
