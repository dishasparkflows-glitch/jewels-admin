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
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

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

  const percentageCount = coupons.filter((c) => c.discount?.type === 'Percentage').length;
  const fixedCount = coupons.filter((c) => c.discount?.type === 'Fixed').length;
  const activeCount = coupons.filter((c) => c.status === 'active').length || coupons.length;

  const statCardsData = [
    {
      label: 'Total Coupons',
      value: coupons.length,
      icon: HiOutlineTicket,
      color: 'bronze',
    },
    {
      label: 'Percentage Promos',
      value: percentageCount,
      icon: HiOutlinePlus,
      color: 'green',
    },
    {
      label: 'Flat Discount Promos',
      value: fixedCount,
      icon: HiOutlineTicket,
      color: 'peach',
    },
    {
      label: 'Active Campaigns',
      value: activeCount,
      icon: HiOutlineTicket,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Coupons']}
        title="Coupons"
        subtitle="Manage promotional discount codes, validity rules and order promotions."
        onAdd={handleOpenAdd}
        addLabel="Add Coupon"
        exportData={coupons}
        exportFileName="coupons_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search coupons by code or description..."
      />

      {/* ─── Coupons Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">COUPON CODE</th>
                <th className="py-2 px-3 whitespace-nowrap">HEADLINE / DESC</th>
                <th className="py-2 px-3 whitespace-nowrap">DISCOUNT</th>
                <th className="py-2 px-3 whitespace-nowrap">MIN ORDER</th>
                <th className="py-2 px-3 whitespace-nowrap">VALIDITY</th>
                <th className="py-2 px-3 whitespace-nowrap">USAGE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-stone-400">
                    Loading promotional coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-stone-400">
                    No promotional coupons found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c, idx) => {
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
                      <td className="py-2.5 pl-4 pr-1">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      {/* Coupon Code */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold tracking-wider text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                            <HiOutlineTicket className="w-3 h-3" />
                          </span>
                          <span className="font-mono text-xs">{c.coupon?.code}</span>
                        </div>
                      </td>

                      {/* Headline / Desc */}
                      <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate text-xs">
                        {c.coupon?.description || '—'}
                      </td>

                      {/* Discount - Sleek Luxury Pill with zero wrapping */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2] shadow-2xs">
                          {formattedDiscount}
                        </span>
                      </td>

                      {/* Min Order */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-stone-800 text-xs">
                        {c.discount?.minimumOrderAmount > 0
                          ? `₹${Number(c.discount.minimumOrderAmount).toLocaleString('en-IN')}`
                          : '₹0'}
                      </td>

                      {/* Validity */}
                      <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                        <div className="text-[10px] whitespace-nowrap">
                          <span>{formattedStartDate}</span>
                          <span className="text-stone-300 mx-1">→</span>
                          <span className="font-medium text-stone-700">{formattedExpiryDate}</span>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-600 text-xs">
                        <span className="font-medium">{c.usage?.usedCount || 0}</span>
                        <span className="text-stone-400">
                          {' / '}
                          {c.usage?.usageLimit ? c.usage.usageLimit : '∞'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 text-right whitespace-nowrap">
                        <RowActions
                          onView={() => handleOpenEdit(c)}
                          onEdit={() => handleOpenEdit(c)}
                          onDelete={() => handleDelete(c._id, c.coupon?.code)}
                          viewTitle="View/Edit Coupon"
                        />
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
                  <Dropdown
                    value={discountType}
                    onChange={(val) => setDiscountType(val)}
                    options={[
                      { value: 'Percentage', label: 'Percentage %' },
                      { value: 'Fixed', label: 'Fixed Amount (₹)' },
                    ]}
                    buttonClassName="h-11 rounded-lg text-xs font-semibold"
                  />
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
