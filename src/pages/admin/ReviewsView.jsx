import { createPortal } from "react-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineUser,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineX,
  HiOutlineStar,
  HiOutlineTrash,
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
import { useAdminPageSize } from '../../utils/adminPagination';

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

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
  const fileInputRef = useRef(null);

  const fetchReviews = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews?page=${page}&limit=${limit}`);
      const data = res.data?.data?.items || res.data?.data || [];
      setReviews(Array.isArray(data) ? data : []);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.warn('Could not load reviews:', err);
      setReviews([]);
      toast.error('Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage, pageSize);
  }, [currentPage, pageSize]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    setHoverRating(0);
    setShowAddModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (e) => {
    if (e) e.stopPropagation();
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image: { url: '', key: '' } }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          imageData = { url: uploaded.fileUrl || uploaded.url, key: uploaded.key || '' };
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          toast.error('Failed to upload image. Please try again.');
          setSubmitting(false);
          return;
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
      fetchReviews(currentPage, pageSize);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save review');
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
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Review deleted');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.error('Please select reviews to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Reviews',
      message: `Are you sure you want to delete ${count} selected review${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await Promise.allSettled(
        idsToDelete.map((id) => api.delete(`/reviews/${id}`))
      );
      setReviews((prev) => prev.filter((r) => !selectedIds.has(r._id || r.id)));
      setSelectedIds(new Set());
      toast.success(`${count} review${count > 1 ? 's' : ''} deleted successfully`);
    } catch {
      setReviews((prev) => prev.filter((r) => !selectedIds.has(r._id || r.id)));
      setSelectedIds(new Set());
      toast.success(`${count} review${count > 1 ? 's' : ''} deleted`);
    }
  };

  // Metrics
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((sum, r) => sum + (Number(r.review?.rating) || 0), 0) / totalCount).toFixed(1) : '—';
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
    totalItems,
    paginatedItems,
  } = usePagination(displayedReviews, pageSize, serverTotal);

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
        extraActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={
              selectedIds.size > 0
                ? `Delete ${selectedIds.size} selected review${selectedIds.size > 1 ? 's' : ''}`
                : 'Select reviews to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Luxury Reviews Table ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#fbfaf8] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-2.5 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    aria-label="Select all reviews"
                  />
                </th>
                <th className="py-2.5 px-2 text-center w-12 whitespace-nowrap text-[11px] font-bold text-stone-700 uppercase tracking-wider">SR NO</th>
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
                      onClick={() => setViewingReview({ ...rev, reviewerName, reviewerEmail, rating, reviewTitle, reviewComment, dateStr, displayId })}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
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
                          <div className="w-7 h-7 rounded-full bg-[#f4ece3] text-[#8b6f4e] font-semibold text-[11px] flex items-center justify-center border border-[#8b6f4e]/20 shadow-2xs shrink-0 overflow-hidden">
                            {rev.image?.url ? (
                              <img src={rev.image.url} alt={reviewerName} className="w-full h-full object-cover" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-xs sm:text-[13px]">
                              {reviewerName}
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
                            <p className="font-bold text-stone-900 text-xs sm:text-[13px]">
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
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="reviews"
        />
      </div>

      {/* ─── Add/Edit Modal ─── */}
      {showAddModal && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Client Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. priya@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                  Star Rating <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#d6cfc2]/70 bg-stone-50/40">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <IoStar
                          className={`w-5 h-5 transition-colors ${
                            star <= (hoverRating || formData.rating) ? 'text-amber-400' : 'text-stone-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-800 ml-1">
                    {hoverRating || formData.rating} of 5 Stars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                  Review Headline <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exquisite Custom Solitaire"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                  Client Feedback Text <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Write the verified feedback or customer testimonial..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400 resize-y"
                />
              </div>

              {/* Review Image / Client Photo Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <HiOutlinePhotograph className="w-3.5 h-3.5 text-[#8b6f4e]" />
                    Review Image / Client Photo
                  </label>
                  <span className="text-[11px] font-normal text-stone-400">Optional</span>
                </div>

                {imagePreview ? (
                  <div className="relative flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-stone-200 shrink-0 shadow-2xs">
                      <img
                        src={imagePreview}
                        alt="Review Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 truncate">
                        {imageFile?.name || 'Attached Photo'}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Attached to review'}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-[#8b6f4e] hover:underline mt-0.5 cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#d6cfc2] hover:border-[#8b6f4e] rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-stone-50/40 hover:bg-[#faf7f2] flex flex-col items-center justify-center gap-1 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200 group-hover:border-[#8b6f4e]/40 flex items-center justify-center text-stone-400 group-hover:text-[#8b6f4e] transition-colors shadow-2xs">
                      <HiOutlinePhotograph className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-stone-700 group-hover:text-[#8b6f4e]">
                      Click to upload photo
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Supports JPG, PNG, WEBP up to 10MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Publishing...' : editingReview ? 'Save Changes' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── View Review Modal ─── */}
      {viewingReview && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setViewingReview(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
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

            <div className="space-y-3.5 text-xs bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/60">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-stone-500">Reviewer</span>
                <div className="flex items-center gap-2">
                  {viewingReview.image?.url && (
                    <img
                      src={viewingReview.image.url}
                      alt={viewingReview.reviewerName}
                      className="w-6 h-6 rounded-full object-cover border border-stone-200"
                    />
                  )}
                  <span className="font-bold text-stone-900 text-xs sm:text-[13px]">{viewingReview.reviewerName}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-stone-500">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IoStar key={s} className={`w-3.5 h-3.5 ${s <= viewingReview.rating ? 'text-amber-400' : 'text-stone-200'}`} />
                  ))}
                  <span className="font-bold text-stone-800 text-xs ml-1">{viewingReview.rating}/5</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-stone-200/50">
                <span className="text-xs font-bold text-stone-500 block mb-1">Headline</span>
                <span className="font-bold text-stone-900 text-sm">{viewingReview.reviewTitle}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block mb-1">Testimonial</span>
                <p className="text-stone-800 text-xs sm:text-[13px] italic leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
                  &quot;{viewingReview.reviewComment}&quot;
                </p>
              </div>
              {viewingReview.image?.url && (
                <div className="pt-2 border-t border-stone-200/50">
                  <span className="text-xs font-bold text-stone-500 block mb-1.5">Attached Photo</span>
                  <div className="rounded-xl overflow-hidden border border-stone-200 max-h-48 bg-white flex items-center justify-center">
                    <img
                      src={viewingReview.image.url}
                      alt={viewingReview.reviewTitle || 'Review attachment'}
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold text-stone-500">Date</span>
                <span className="font-semibold text-stone-700">{viewingReview.dateStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const rev = viewingReview;
                  setViewingReview(null);
                  handleEdit(rev);
                }}
                className="flex-1 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
              >
                Edit Review
              </button>
              <button
                type="button"
                onClick={() => setViewingReview(null)}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}
