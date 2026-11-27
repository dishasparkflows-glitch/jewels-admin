import { createPortal } from "react-dom";
import { useState, useRef } from 'react';
import {
  HiOutlineUser,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineEye,
} from 'react-icons/hi';
import { IoStar } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { clearRequestCache } from '../../utils/requestCache';
import Pagination from '../../components/common/Pagination';
import useAdminList from '../../hooks/useAdminList';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useImagePreview } from '../../contexts/ImagePreviewContext';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import MobileGridList from '../../components/common/MobileGridList';
import Dropdown from '../../components/common/Dropdown';
import { openProductPreview } from '../../utils/productPreview';
import { getUploadTriggerProps } from '../../utils/filePickerAutoOpen';
import { formatDate as formatDisplayDate } from '../../utils/formatters';

const REVIEW_STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
];

export default function ReviewsView() {
  const confirm = useConfirm();
  const { openImagePreview } = useImagePreview();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [viewingReview, setViewingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [filterActive, setFilterActive] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const {
    items: reviews,
    setItems: setReviews,
    displayedItems: displayedReviews,
    loading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    serverTotal,
    totalItems,
    paginatedItems,
    selectedIds,
    toggleSelect: handleSelectRow,
    toggleSelectAll,
    isAllSelected,
    clearSelection,
    removeFromSelection,
    invalidateAndRefetch: fetchReviews,
  } = useAdminList({
    cacheKey: 'reviews',
    errorMessage: 'Could not load reviews',
    fetcher: ({ page, limit, signal }) =>
      api.get(`/reviews?page=${page}&limit=${limit}`, { signal }),
    filterItems: (list, q) => {
      if (!q.trim()) return list;
      const lower = q.toLowerCase();
      return list.filter((r) => {
        const name = (r.customer?.name || '').toLowerCase();
        const email = (r.customer?.email || '').toLowerCase();
        const title = (r.review?.title || '').toLowerCase();
        const comment = (r.review?.comment || '').toLowerCase();
        const idStr = String(r.customId || r._id || '').toLowerCase();
        const statusStr = (r.status || '').toLowerCase();
        return (
          name.includes(lower) ||
          email.includes(lower) ||
          title.includes(lower) ||
          comment.includes(lower) ||
          idStr.includes(lower) ||
          statusStr.includes(lower)
        );
      });
    },
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    rating: 5,
    status: 'approved',
    comment: '',
    reviewDate: '',
    productId: '',
    image: { url: '', key: '' },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

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
      productId: '',
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
      productId: rev.productId?._id || rev.productId || '',
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
        productId: formData.productId ? formData.productId : null,
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
      clearRequestCache('reviews');
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== id));
      removeFromSelection(id);
    } catch {
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== id));
      removeFromSelection(id);
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
      await api.post('/reviews/bulk-delete', { ids: idsToDelete });
      clearRequestCache('reviews');
      setReviews((prev) => prev.filter((r) => !selectedIds.has(r._id || r.id)));
      clearSelection();
      toast.success(`${count} review${count > 1 ? 's' : ''} deleted successfully`);
    } catch {
      toast.error('Failed to delete reviews');
    }
  };

  const handleUpdateStatus = async (review, newStatus, e) => {
    if (e) e.stopPropagation();
    const id = review._id || review.id;
    if (!id) return;
    if ((review.status || 'approved').toLowerCase() === newStatus.toLowerCase()) {
      return;
    }

    const previousStatus = review.status || 'approved';

    // Optimistically update local reviews list
    setReviews((prev) =>
      prev.map((r) => ((r._id || r.id) === id ? { ...r, status: newStatus } : r))
    );
    setUpdatingStatusId(id);

    try {
      await api.put(`/reviews/${id}`, { status: newStatus });
      clearRequestCache('reviews');
      toast.success(
        newStatus === 'approved'
          ? 'Review approved successfully'
          : newStatus === 'rejected'
          ? 'Review marked as rejected'
          : `Review status updated to ${newStatus}`
      );
    } catch (err) {
      console.error('Failed to update review status:', err);
      toast.error(err.response?.data?.message || 'Failed to update review status');
      // Rollback on failure
      setReviews((prev) =>
        prev.map((r) => ((r._id || r.id) === id ? { ...r, status: previousStatus } : r))
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleToggleStatus = (review, e) => {
    if (e) e.stopPropagation();
    const current = (review.status || 'approved').toLowerCase();
    const nextStatus = current === 'approved' ? 'rejected' : 'approved';
    handleUpdateStatus(review, nextStatus, e);
  };

  // Metrics
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((sum, r) => sum + (Number(r.review?.rating) || 0), 0) / totalCount).toFixed(1) : '—';
  const fiveStarsCount = reviews.filter((r) => Number(r.review?.rating) === 5).length || totalCount;

  // Filtered Reviews (NO active/deactive filter!)
  // Checkbox selection
  const handleSelectAll = () => toggleSelectAll(paginatedItems);
  const allSelected = isAllSelected(paginatedItems);

  const formatDate = (dateStr) => formatDisplayDate(dateStr, '—');

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
        title="Reviews"
        subtitle="Listen to your clientele's feedback and showcase verified jewelry stories."
        onAdd={handleOpenAddModal}
        addLabel="Add Review"
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
            className={`flex items-center gap-2 h-[42px] px-3.5 sm:px-4 rounded-xl text-xs sm:text-[13px] font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={
              selectedIds.size > 0
                ? `Delete ${selectedIds.size} selected review${selectedIds.size > 1 ? 's' : ''}`
                : 'Select reviews to delete'
            }
          >
            <HiOutlineTrash className="w-4 h-4 stroke-[2] text-[#d93025]" />
            <span>{selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Luxury Reviews Table (Mobile Grid + Desktop Table) ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText="Loading client reviews..."
          isEmpty={displayedReviews.length === 0}
          emptyText={`No reviews found matching "${search}".`}
          items={paginatedItems}
          showSelectAll
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
          renderCard={(rev, idx) => {
            const id = rev._id || rev.id || `rev_${idx}`;
            const isSelected = selectedIds.has(id);
            const reviewerName = rev.customer?.name || 'Client';
            const rating = Number(rev.review?.rating || 5);
            const reviewTitle = rev.review?.title || '';
            const reviewComment = rev.review?.comment || '';
            const dateStr = formatDate(rev.review?.reviewDate || rev.meta?.createdAt);
            const srNo = (currentPage - 1) * pageSize + idx + 1;
            const status = rev.status || 'pending';

            return (
              <div
                key={id}
                onClick={() => handleEdit(rev)}
                className={`rounded-xl border p-3.5 bg-white shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                  isSelected ? 'border-[#8b6f4e]/60 bg-[#faf6f0]/50' : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectRow(id)}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-xs truncate">{reviewerName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-medium text-stone-400">#{srNo}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <IoStar
                              key={s}
                              className={`w-3 h-3 ${s <= rating ? 'text-amber-400' : 'text-stone-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <RowActions
                      record={rev}
                      onEdit={() => handleEdit(rev)}
                      onDelete={() => handleDelete(id, reviewerName)}
                      editTitle="Edit review"
                      deleteTitle="Delete review"
                    />
                  </div>
                </div>

                {(reviewTitle || reviewComment) && (
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {reviewTitle ? <span className="font-semibold text-stone-800">{reviewTitle}: </span> : null}
                    {reviewComment}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : status === 'rejected'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {status}
                  </span>
                  <span className="text-stone-400 font-medium">{dateStr}</span>
                </div>
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    aria-label="Select all reviews"
                  />
                </th>
                <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-3 whitespace-nowrap">REVIEWER</th>
                <th className="py-3 px-3 whitespace-nowrap">RATING</th>
                <th className="py-3 px-3 whitespace-nowrap">DATE</th>
                <th className="py-3 px-3 whitespace-nowrap">PRODUCT</th>
                <th className="py-3 px-3 whitespace-nowrap">FEEDBACK & TESTIMONIAL</th>
                <th className="py-3 px-3 whitespace-nowrap">STATUS</th>
                <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading client reviews...
                  </td>
                </tr>
              ) : displayedReviews.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-stone-400">
                    No reviews found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((rev, idx) => {
                  const id = rev._id || rev.id || `rev_${idx}`;
                  const isSelected = selectedIds.has(id);
                  const reviewerName = rev.customer?.name || 'Client';
                  const rating = Number(rev.review?.rating || 5);
                  const reviewTitle = rev.review?.title || '';
                  const reviewComment = rev.review?.comment || '';
                  const dateStr = formatDate(rev.review?.reviewDate || rev.meta?.createdAt);

                  return (
                    <tr
                      key={id}
                      onClick={() => handleEdit(rev)}
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
                        <p className="font-bold text-stone-900 text-xs sm:text-[13px]">
                          {reviewerName}
                        </p>
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

                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {dateStr}
                      </td>

                      {/* Product */}
                      <td className="py-2.5 px-3">
                        {rev.productId ? (
                          (() => {
                            const prodImg =
                              rev.productId.media?.images?.[0]?.url ||
                              rev.productId.ornate?.ornateImages?.[0]?.url ||
                              rev.productId.thumbnail ||
                              rev.productId.firstPhoto;

                            return (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProductPreview(rev.productId);
                                }}
                                className="flex items-center gap-2 max-w-[220px] group/prod cursor-pointer"
                                title="Open product on storefront"
                              >
                                {prodImg && (
                                  <div className="w-8 h-8 rounded-md bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center group-hover/prod:border-[#8b6f4e] transition-colors">
                                    <img
                                      src={prodImg}
                                      alt={rev.productId.basicInfo?.title || rev.productId.title || 'Product'}
                                      className="w-full h-full object-cover group-hover/prod:scale-105 transition-transform"
                                      onError={(e) => {
                                        if (e.currentTarget?.parentElement) {
                                          e.currentTarget.parentElement.style.display = 'none';
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p
                                    className="font-semibold text-stone-900 text-xs truncate group-hover/prod:text-[#8b6f4e] group-hover/prod:underline transition-colors"
                                    title={rev.productId.basicInfo?.title || rev.productId.title}
                                  >
                                    {rev.productId.basicInfo?.title || rev.productId.title || 'Product'}
                                  </p>
                                  <span className="text-[10px] text-stone-600 block truncate">
                                    SKU: {rev.productId.basicInfo?.sku || rev.productId.sku || '—'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            General / Storewide
                          </span>
                        )}
                      </td>

                      {/* Feedback & Testimonial */}
                      <td className="py-2.5 px-3">
                        <div className="max-w-xl lg:max-w-2xl">
                          <p
                            className="font-semibold text-stone-900 text-xs sm:text-[13px] leading-snug"
                            title={reviewComment || reviewTitle}
                          >
                            {reviewTitle || reviewComment || '—'}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td
                        className="py-2.5 px-3 whitespace-nowrap"
                        onClick={(e) => handleToggleStatus(rev, e)}
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border cursor-pointer transition-all hover:scale-105 select-none ${
                            (rev.status || 'approved').toLowerCase() === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : (rev.status || '').toLowerCase() === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to toggle status (Approved / Rejected)"
                        >
                          {rev.status || 'APPROVED'}
                        </span>
                      </td>

                      {/* Actions: Status Dropdown, Edit, Delete */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          record={rev}
                          beforeActions={(() => {
                            const normStatus = (rev.status || 'approved').toLowerCase();
                            const isUpdating = updatingStatusId === id;
                            return (
                              <>
                                {normStatus !== 'approved' && (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={(e) => handleUpdateStatus(rev, 'approved', e)}
                                    title="Approve Review"
                                    aria-label="Approve Review"
                                    className="w-7 h-7 rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                  >
                                    {isUpdating ? (
                                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <HiOutlineCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                    )}
                                  </button>
                                )}
                                {normStatus !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={(e) => handleUpdateStatus(rev, 'rejected', e)}
                                    title="Reject Review"
                                    aria-label="Reject Review"
                                    className="w-7 h-7 rounded-lg border border-rose-200/80 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                  >
                                    {isUpdating ? (
                                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <HiOutlineX className="w-3.5 h-3.5 stroke-[2.5]" />
                                    )}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                          onView={() => handleEdit(rev)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Star Rating <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex items-center h-[42px] px-3 rounded-xl border border-[#d6cfc2]/70 bg-stone-50/40">
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
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    Review Status <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Dropdown
                    size="field"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={REVIEW_STATUS_OPTIONS}
                    portal={true}
                  />
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
                    <div
                      onClick={() =>
                        openImagePreview(imagePreview, {
                          title: formData.name ? `${formData.name} — Review Photo` : 'Review Image Preview',
                        })
                      }
                      className="relative group w-14 h-14 rounded-lg overflow-hidden bg-white border border-stone-200 shrink-0 shadow-2xs cursor-pointer"
                      title="Click to preview image"
                    >
                      <img
                        src={imagePreview}
                        alt="Review Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                        <HiOutlineEye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openImagePreview(imagePreview, {
                            title: formData.name ? `${formData.name} — Review Photo` : 'Review Image Preview',
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 hover:text-stone-900 shadow-2xs transition-colors cursor-pointer"
                      >
                        <HiOutlineEye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                        className="text-xs font-semibold hover:underline cursor-pointer px-1.5 py-1"
                      >
                        Change Photo
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <HiOutlineTrash className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div
                    {...getUploadTriggerProps(() => fileInputRef.current?.click())}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#d6cfc2] hover:border-[#8b6f4e] focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/25 rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-stone-50/40 hover:bg-[#faf7f2] flex flex-col items-center justify-center gap-1 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200 group-hover:border-[#8b6f4e]/40 flex items-center justify-center text-stone-400 group-hover:text-[#8b6f4e] transition-colors shadow-2xs">
                      <HiOutlinePhotograph className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-stone-700 group-hover:text-[#8b6f4e]">
                      Click to upload photo
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
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Reviewer</span>
                <div className="flex items-center gap-2 min-w-0">
                  {viewingReview.image?.url && (
                    <img
                      src={viewingReview.image.url}
                      alt={viewingReview.reviewerName}
                      className="w-6 h-6 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                  )}
                  <span className="font-bold text-stone-900 text-xs sm:text-[13px] truncate">{viewingReview.reviewerName}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IoStar key={s} className={`w-3.5 h-3.5 ${s <= viewingReview.rating ? 'text-amber-400' : 'text-stone-200'}`} />
                  ))}
                  <span className="font-bold text-stone-800 text-xs ml-1">{viewingReview.rating}/5</span>
                </div>
              </div>
              {viewingReview.productId && (
                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-stone-200/50">
                  <span className="text-xs font-bold text-stone-500">Product</span>
                  <button
                    type="button"
                    onClick={() => openProductPreview(viewingReview.productId)}
                    className="font-semibold text-stone-900 hover:text-[#8b6f4e] hover:underline text-xs truncate max-w-[200px] sm:max-w-[240px] text-right cursor-pointer"
                    title="Open product on storefront"
                  >
                    {viewingReview.productId.basicInfo?.title || viewingReview.productId.title || 'Product'}
                  </button>
                </div>
              )}
              <div className="pt-2.5 border-t border-stone-200/50">
                <span className="text-xs font-bold text-stone-500 block mb-1">Headline</span>
                <span className="font-bold text-stone-900 text-sm">{viewingReview.reviewTitle}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block mb-1">Testimonial</span>
                <p className="text-stone-800 text-xs sm:text-[13px] font-normal leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs whitespace-pre-line">
                  {viewingReview.reviewComment}
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
