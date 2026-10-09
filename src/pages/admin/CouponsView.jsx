import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineTicket,
  HiOutlineCalendar,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CouponsView() {
  const confirm = useConfirm();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields matching screenshot modal
  const [couponCode, setCouponCode] = useState('');
  const [headline, setHeadline] = useState('');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [totalUsageLimit, setTotalUsageLimit] = useState('');
  const [limitPerUser, setLimitPerUser] = useState('1');

  // Fetch all coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons?limit=100');
      const items = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setCoupons(items);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Filter coupons by search query
  const filteredCoupons = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter(
      (c) =>
        (c.coupon?.code && c.coupon.code.toLowerCase().includes(q)) ||
        (c.coupon?.description && c.coupon.description.toLowerCase().includes(q))
    );
  }, [coupons, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredCoupons, 10);

  // Format Date to YYYY-MM-DD for <input type="date">
  const toInputDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Open modal to add coupon
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCouponCode('');
    setHeadline('');
    setDiscountType('Percentage');
    setDiscountValue('');
    setMinOrderAmount('');
    setStartDate('');
    setExpiryDate('');
    setTotalUsageLimit('');
    setLimitPerUser('1');
    setIsModalOpen(true);
  };

  // Open modal to edit coupon
  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setCouponCode(c.coupon?.code || '');
    setHeadline(c.coupon?.description || '');
    setDiscountType(c.discount?.type || 'Percentage');
    setDiscountValue(
      c.discount?.value !== undefined && c.discount?.value !== null
        ? String(c.discount.value)
        : ''
    );
    setMinOrderAmount(
      c.discount?.minimumOrderAmount !== undefined && c.discount?.minimumOrderAmount !== null
        ? String(c.discount.minimumOrderAmount)
        : ''
    );
    setStartDate(toInputDate(c.validity?.startDate));
    setExpiryDate(toInputDate(c.validity?.endDate));
    setTotalUsageLimit(
      c.usage?.usageLimit !== undefined && c.usage?.usageLimit !== null
        ? String(c.usage.usageLimit)
        : ''
    );
    setLimitPerUser(
      c.usage?.perUserLimit !== undefined && c.usage?.perUserLimit !== null
        ? String(c.usage.perUserLimit)
        : '1'
    );
    setIsModalOpen(true);
  };

  // Toggle coupon status (active/inactive)
  const handleToggleStatus = async (c) => {
    try {
      const nextStatus = c.status === 'active' ? 'inactive' : 'active';
      await api.put(`/coupons/${c._id}`, { status: nextStatus });
      toast.success(`Coupon ${c.coupon?.code || 'coupon'} set to ${nextStatus}`);
      setCoupons((prev) =>
        prev.map((item) => (item._id === c._id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  // Delete coupon
  const handleDelete = async (id, code) => {
    const isConfirmed = await confirm({
      title: 'Delete Coupon',
      message: `Are you sure you want to delete coupon "${code}"? This action cannot be undone.`,
      confirmText: 'Delete Coupon',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted successfully');
      setCoupons((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (discountValue === '' || isNaN(Number(discountValue)) || Number(discountValue) < 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        coupon: {
          code: couponCode.trim().toUpperCase(),
          description: headline.trim(),
        },
        discount: {
          type: discountType,
          value: Number(discountValue),
          minimumOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        },
        validity: {
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        },
        usage: {
          usageLimit: totalUsageLimit ? Number(totalUsageLimit) : null,
          usedCount: editingCoupon?.usage?.usedCount || 0,
          perUserLimit: limitPerUser ? Number(limitPerUser) : 1,
        },
      };

      if (editingCoupon?._id) {
        await api.put(`/coupons/${editingCoupon._id}`, payload);
        toast.success(`Coupon ${payload.coupon.code} updated successfully`);
      } else {
        await api.post('/coupons', payload);
        toast.success(`Coupon ${payload.coupon.code} created successfully`);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      console.error('Error saving coupon:', err);
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header (Matches Screenshot - NO SYNC BUTTON) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Coupons
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage promotional discount codes and order promotions.
          </p>
        </div>

        {/* Add Coupon Button (No Sync Button) */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* ─── Coupons Table Card ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <HiOutlineSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coupons..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
            />
          </div>

          <div className="text-xs font-semibold text-stone-400">
            {filteredCoupons.length} {filteredCoupons.length === 1 ? 'Coupon' : 'Coupons'}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-[#faf8f5]/60 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-4 whitespace-nowrap">Coupon Code</th>
                <th className="py-4 px-4 whitespace-nowrap">Headline / Desc</th>
                <th className="py-4 px-4 whitespace-nowrap">Discount</th>
                <th className="py-4 px-4 whitespace-nowrap">Min Order</th>
                <th className="py-4 px-4 whitespace-nowrap">Validity</th>
                <th className="py-4 px-4 whitespace-nowrap">Usage</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">
                    Loading promotional coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">
                    No promotional coupons found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c) => {
                  const isActive = c.status === 'active';
                  const isPercentage = c.discount?.type === 'Percentage';
                  const discountVal = c.discount?.value ?? 0;
                  const formattedDiscount = isPercentage
                    ? `${discountVal}% OFF`
                    : `₹${Number(discountVal).toLocaleString('en-IN')} OFF`;

                  const formattedStartDate = c.validity?.startDate
                    ? new Date(c.validity.startDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Anytime';

                  const formattedExpiryDate = c.validity?.endDate
                    ? new Date(c.validity.endDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'No Expiry';

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Coupon Code */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold tracking-wider text-stone-900">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                            <HiOutlineTicket className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono">{c.coupon?.code}</span>
                        </div>
                      </td>

                      {/* Headline / Desc */}
                      <td className="py-4 px-4 text-stone-600 max-w-xs truncate">
                        {c.coupon?.description || '—'}
                      </td>

                      {/* Discount - Sleek Luxury Pill with zero wrapping */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2] shadow-2xs">
                          {formattedDiscount}
                        </span>
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-stone-800">
                        {c.discount?.minimumOrderAmount > 0
                          ? `₹${Number(c.discount.minimumOrderAmount).toLocaleString('en-IN')}`
                          : '₹0'}
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-4 text-stone-500 whitespace-nowrap">
                        <div className="text-[11px] whitespace-nowrap">
                          <span>{formattedStartDate}</span>
                          <span className="text-stone-300 mx-1">→</span>
                          <span className="font-medium text-stone-700">{formattedExpiryDate}</span>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4 whitespace-nowrap text-stone-600">
                        <span className="font-medium">{c.usage?.usedCount || 0}</span>
                        <span className="text-stone-400">
                          {' / '}
                          {c.usage?.usageLimit ? c.usage.usageLimit : '∞'}
                        </span>
                      </td>

                      {/* Status Toggle Switch - Crisp White Knob with smooth translation */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`w-11 h-6 rounded-full transition-colors relative inline-block cursor-pointer focus:outline-none ${
                            isActive ? 'bg-[#8f6d43]' : 'bg-stone-300'
                          }`}
                          title={`Toggle Status (Currently ${isActive ? 'Active' : 'Inactive'})`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 absolute top-0.5 left-0.5 ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Coupon"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id, c.coupon?.code)}
                            title="Delete Coupon"
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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

        {/* Luxury Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ─── Add / Edit Coupon Modal (Matches Screenshot Exactly) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-lg tracking-tight">
                {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Coupon Code & Headline/Desc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    COUPON CODE
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="w-full h-11 px-3.5 text-xs font-semibold tracking-wider uppercase rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    HEADLINE / DESC
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Special festive discount"
                    className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Discount Type & Discount Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    DISCOUNT TYPE
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all cursor-pointer"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    DISCOUNT VALUE
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="e.g. 10 or 500"
                    className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Minimum Order Amount */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  MIN ORDER AMOUNT (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Row 4: Start Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    START DATE
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    EXPIRY DATE
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 5: Total Usage Limit & Limit Per User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    TOTAL USAGE LIMIT
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalUsageLimit}
                    onChange={(e) => setTotalUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    LIMIT PER USER
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={limitPerUser}
                    onChange={(e) => setLimitPerUser(e.target.value)}
                    placeholder="1"
                    className="w-full h-11 px-3.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer Actions (Matches Screenshot) */}
              <div className="pt-4 flex items-center justify-between gap-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 h-11 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 h-11 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
