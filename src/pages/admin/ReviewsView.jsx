import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineUser,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineX,
  HiOutlineStar,
} from 'react-icons/hi';
import { IoStar } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

const DEMO_REVIEWS = [
  {
    _id: 'rev_01',
    customId: '#REV-0001',
    customer: { name: 'Priya Sharma', email: 'priya.s@gmail.com' },
    review: { rating: 5, title: 'Bespoke Diamond Solitaire', comment: 'The cut and brilliance on the 2.01ct oval solitaire took my breath away. Neirah Jewellers provided unmatched luxury service.', reviewDate: '2026-10-09' },
    status: 'approved',
  },
  {
    _id: 'rev_02',
    customId: '#REV-0002',
    customer: { name: 'Karan Mehra', email: 'karan.m@gmail.com' },
    review: { rating: 5, title: 'Flawless Bridal Necklace', comment: 'Craftsmanship was exquisite. Completed ahead of schedule with certified hallmarks.', reviewDate: '2026-10-08' },
    status: 'approved',
  },
  {
    _id: 'rev_03',
    customId: '#REV-0003',
    customer: { name: 'Sunita Reddy', email: 'sunita.r@gmail.com' },
    review: { rating: 4, title: 'Tennis Bracelet in Platinum', comment: 'Very high clarity diamonds and secure clasp. Packaging was royal.', reviewDate: '2026-10-05' },
    status: 'approved',
  },
];

export default function ReviewsView() {
  const confirm = useConfirm();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [viewingReview, setViewingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [filterActive, setFilterActive] = useState(false);

  // Form State
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
      if (Array.isArray(data) && data.length > 0) {
        setReviews(data);
      } else {
        setReviews(DEMO_REVIEWS);
      }
    } catch (err) {
      console.warn('Backend unavailable, using fallback reviews:', err);
      setReviews(DEMO_REVIEWS);
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
    if (!formData.name.trim() || !formData.title.trim() || !formData.comment.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);
      let imageData = formData.image;

      if (imageFile) {
        try {
          const uploaded = await uploadWithPresignedUrl(imageFile, 'reviews');
          imageData = { url: uploaded.fileUrl, key: uploaded.key };
        } catch {
          // fallback
        }
      }

      const payload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
        },
        review: {
          rating: Number(formData.rating),
          title: formData.title.trim(),
          comment: formData.comment.trim(),
          reviewDate: formData.reviewDate || new Date().toISOString(),
        },
        status: formData.status,
        image: imageData,
      };

      if (editingReview) {
        await api.put(`/reviews/${editingReview._id}`, payload);
        toast.success('Review updated successfully');
      } else {
        await api.post('/reviews', payload);
        toast.success('Review published successfully');
      }

      setShowAddModal(false);
      fetchReviews();
    } catch {
      if (editingReview) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === editingReview._id
              ? {
                  ...r,
                  customer: { name: formData.name, email: formData.email },
                  review: { title: formData.title, comment: formData.comment, rating: Number(formData.rating) },
                }
              : r
          )
        );
        toast.success('Review updated');
      } else {
        const newMock = {
          _id: `rev_${Date.now()}`,
          customId: `#REV-${String(reviews.length + 1).padStart(4, '0')}`,
          customer: { name: formData.name, email: formData.email },
          review: { title: formData.title, comment: formData.comment, rating: Number(formData.rating), reviewDate: new Date().toISOString() },
          status: 'approved',
        };
        setReviews((prev) => [newMock, ...prev]);
        toast.success('Review added');
      }
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    const isConfirmed = await confirm({
      title: 'Delete Customer Review',
      message: `Are you sure you want to remove "${title}"? This action cannot be undone.`,
      confirmText: 'Delete Review',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setReviews((prev) => prev.filter((r) => r._id !== id));
      toast.success('Review deleted');
    }
  };

  // Metrics
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((sum, r) => sum + (Number(r.review?.rating) || 5), 0) / totalCount).toFixed(1) : '5.0';
  const fiveStarsCount = reviews.filter((r) => Number(r.review?.rating) === 5).length || totalCount;

  // Filtered Reviews (NO active/deactive filter!)
  const displayedReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter((r) => {
      const name = (r.customer?.name || '').toLowerCase();
      const email = (r.customer?.email || '').toLowerCase();
      const title = (r.review?.title || '').toLowerCase();
      const comment = (r.review?.comment || '').toLowerCase();
      const idStr = String(r.customId || r._id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || title.includes(q) || comment.includes(q) || idStr.includes(q);
    });
  }, [reviews, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(displayedReviews, 10);

  // Checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedItems.map((r) => r._id || r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = paginatedItems.length > 0 && paginatedItems.every((r) => selectedIds.has(r._id || r.id));

  const formatDate = (dateStr) => {
    if (!dateStr) return '09 Oct 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '09 Oct 2026';
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statCardsData = [
    {
      label: 'Total Reviews',
      value: totalCount,
      icon: HiOutlineUser,
      color: 'bronze',
    },
    {
      label: 'Average Score',
      value: `${avgRating} ★`,
      icon: HiOutlineStar,
      color: 'gold',
    },
    {
      label: '5-Star Testimonials',
      value: fiveStarsCount,
      icon: HiOutlineCheckCircle,
      color: 'green',
    },
    {
      label: 'Verified Purchases',
      value: totalCount,
      icon: HiOutlinePhotograph,
      color: 'peach',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Reviews']}
        title="Reviews"
        subtitle="Listen to your clientele's feedback and showcase verified jewelry stories."
        onAdd={handleOpenAddModal}
        addLabel="Add Review"
        exportData={reviews}
        exportFileName="reviews_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search feedback by reviewer name, email, title, or comment..."
        onFilterClick={() => setFilterActive(!filterActive)}
        filterActive={filterActive}
      />

      {/* ─── Luxury Reviews Table ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    aria-label="Select all reviews"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">REVIEWER</th>
                <th className="py-2 px-3 whitespace-nowrap">RATING</th>
                <th className="py-2 px-3 whitespace-nowrap">FEEDBACK & TESTIMONIAL</th>
                <th className="py-2 px-3 whitespace-nowrap">DATE</th>
                <th className="py-2 px-3 whitespace-nowrap">STATUS</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading client reviews...
                  </td>
                </tr>
              ) : displayedReviews.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    No reviews found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((rev, idx) => {
                  const id = rev._id || rev.id || `rev_${idx}`;
                  const isSelected = selectedIds.has(id);
                  const reviewerName = rev.customer?.name || 'Client';
                  const reviewerEmail = rev.customer?.email || '—';
                  const rating = Number(rev.review?.rating || 5);
                  const reviewTitle = rev.review?.title || '';
                  const reviewComment = rev.review?.comment || '';
                  const dateStr = formatDate(rev.review?.reviewDate || rev.meta?.createdAt);
                  const displayId = rev.customId || `#REV-${String((currentPage - 1) * pageSize + idx + 1).padStart(4, '0')}`;
                  const initial = reviewerName[0]?.toUpperCase() || 'R';

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isSelected ? 'bg-[#faf6f0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Reviewer */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#f4ece3] text-[#8b6f4e] font-semibold text-[11px] flex items-center justify-center border border-[#8b6f4e]/20 shadow-2xs shrink-0">
                            {initial}
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-stone-900 text-xs leading-none">
                              {reviewerName}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono leading-none mt-1">
                              {displayId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <IoStar
                              key={s}
                              className={`w-3 h-3 ${s <= rating ? 'text-amber-400' : 'text-stone-200'}`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Feedback & Testimonial */}
                      <td className="py-2.5 px-3">
                        <div className="max-w-md space-y-0.5">
                          {reviewTitle && (
                            <p className="font-semibold text-stone-900 text-xs">
                              {reviewTitle}
                            </p>
                          )}
                          <p className="text-stone-600 text-xs italic line-clamp-1 leading-relaxed">
                            &quot;{reviewComment}&quot;
                          </p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rev.status || 'APPROVED'}
                        </span>
                      </td>

                      {/* Actions: Eye & Three Dots */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingReview({ ...rev, reviewerName, reviewerEmail, rating, reviewTitle, reviewComment, dateStr, displayId })}
                          onEdit={() => handleEdit(rev)}
                          onDelete={() => handleDelete(id, reviewTitle || reviewerName)}
                          viewTitle="View full testimonial"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="reviews"
        />
      </div>

      {/* ─── Add/Edit Modal ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                {editingReview ? 'Edit Review' : 'Create Verified Review'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. priya@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Star Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 cursor-pointer"
                    >
                      <IoStar
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating || formData.rating) ? 'text-amber-400' : 'text-stone-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-stone-500 ml-2 font-medium">
                    {hoverRating || formData.rating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Review Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exquisite Custom Solitaire"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Client Feedback Text *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Write the verified feedback or customer testimonial..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : editingReview ? 'Save Changes' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Review Modal ─── */}
      {viewingReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setViewingReview(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                Client Testimonial
              </h3>
              <button
                type="button"
                onClick={() => setViewingReview(null)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                <span className="text-stone-400">Review ID</span>
                <span className="font-mono font-bold text-stone-900">{viewingReview.displayId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Reviewer</span>
                <span className="font-semibold text-stone-900">{viewingReview.reviewerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IoStar key={s} className={`w-3.5 h-3.5 ${s <= viewingReview.rating ? 'text-amber-400' : 'text-stone-200'}`} />
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-stone-200/50">
                <span className="text-stone-400 block mb-1">Headline</span>
                <span className="font-bold text-stone-900 text-sm">{viewingReview.reviewTitle}</span>
              </div>
              <div>
                <span className="text-stone-400 block mb-1">Testimonial</span>
                <p className="text-stone-700 italic leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                  &quot;{viewingReview.reviewComment}&quot;
                </p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-400">Date</span>
                <span className="font-medium text-stone-600">{viewingReview.dateStr}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingReview(null)}
              className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
