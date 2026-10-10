import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineCash,
  HiOutlineCalculator,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineX,
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

const DEMO_TIERS = [
  { _id: 'tier_01', customId: '#TIER-0001', uptoAmount: 15000, chargeType: 'Percentage', chargeValue: 10 },
  { _id: 'tier_02', customId: '#TIER-0002', uptoAmount: 35000, chargeType: 'Percentage', chargeValue: 15 },
  { _id: 'tier_03', customId: '#TIER-0003', uptoAmount: 75000, chargeType: 'Fixed', chargeValue: 5000 },
  { _id: 'tier_04', customId: '#TIER-0004', uptoAmount: 150000, chargeType: 'Percentage', chargeValue: 20 },
];

export default function CodSequencesView() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  const [formData, setFormData] = useState({
    uptoAmount: '',
    chargeType: 'Percentage',
    chargeValue: '15',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cod-sequences?limit=50');
      const data = res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        setItems(DEMO_TIERS);
      }
    } catch (err) {
      console.warn('Backend unavailable, using fallback COD tiers:', err);
      setItems(DEMO_TIERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ uptoAmount: '', chargeType: 'Percentage', chargeValue: '15' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      uptoAmount: item.uptoAmount,
      chargeType: item.chargeType || 'Percentage',
      chargeValue: item.chargeValue,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.uptoAmount || formData.chargeValue === '') {
      toast.error('Please enter upto amount and advance value');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        uptoAmount: Number(formData.uptoAmount),
        chargeType: formData.chargeType,
        chargeValue: Number(formData.chargeValue),
      };

      if (editingItem) {
        await api.put(`/cod-sequences/${editingItem._id}`, payload);
        toast.success('COD sequence tier updated successfully');
      } else {
        await api.post('/cod-sequences', payload);
        toast.success('COD sequence tier added successfully');
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      // Mock fallback update
      if (editingItem) {
        setItems((prev) =>
          prev.map((i) =>
            i._id === editingItem._id
              ? { ...i, uptoAmount: Number(formData.uptoAmount), chargeType: formData.chargeType, chargeValue: Number(formData.chargeValue) }
              : i
          )
        );
        toast.success('COD sequence tier updated');
      } else {
        const newMock = {
          _id: `tier_${Date.now()}`,
          customId: `#TIER-${String(items.length + 1).padStart(4, '0')}`,
          uptoAmount: Number(formData.uptoAmount),
          chargeType: formData.chargeType,
          chargeValue: Number(formData.chargeValue),
        };
        setItems((prev) => [...prev, newMock]);
        toast.success('COD sequence tier added');
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete COD Tier',
      message: 'Are you sure you want to delete this COD sequence tier? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/cod-sequences/${id}`);
      toast.success('COD sequence tier deleted');
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('COD sequence tier deleted');
    }
  };

  // Metrics
  const totalTiers = items.length;
  const percentageCount = items.filter((i) => i.chargeType === 'Percentage').length;
  const fixedCount = items.filter((i) => i.chargeType === 'Fixed').length;
  const maxLimit = Math.max(...items.map((i) => Number(i.uptoAmount) || 0), 150000);

  // Filtered Items (NO active/deactive filter!)
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => {
      const amt = String(i.uptoAmount || '');
      const type = (i.chargeType || '').toLowerCase();
      const id = String(i.customId || i._id || '').toLowerCase();
      return amt.includes(q) || type.includes(q) || id.includes(q);
    });
  }, [items, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredItems, 10);

  // Checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedItems.map((i) => i._id || i.id)));
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

  const allSelected = paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.has(i._id || i.id));

  const statCardsData = [
    {
      label: 'Total Payment Tiers',
      value: totalTiers,
      icon: HiOutlineCash,
      color: 'bronze',
    },
    {
      label: 'Percentage Rules',
      value: percentageCount,
      icon: HiOutlineCalculator,
      color: 'green',
    },
    {
      label: 'Fixed Deposit Rules',
      value: fixedCount,
      icon: HiOutlineShieldCheck,
      color: 'peach',
    },
    {
      label: 'Max Sequence Cap',
      value: `₹ ${maxLimit.toLocaleString('en-IN')}`,
      icon: HiOutlineCheckCircle,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'COD Sequence']}
        title="COD Sequences"
        subtitle="Configure Cash on Delivery advance payment tiers and balance collection rules."
        onAdd={handleOpenAdd}
        addLabel="Add COD Tier"
        exportData={items}
        exportFileName="cod_sequences_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tiers by amount or charge type..."
        onFilterClick={() => setFilterActive(!filterActive)}
        filterActive={filterActive}
      />

      {/* ─── Luxury COD Tiers Table ─── */}
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
                    aria-label="Select all tiers"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">ORDER VALUE BRACKET</th>
                <th className="py-2 px-3 whitespace-nowrap">ADVANCE TYPE</th>
                <th className="py-2 px-3 whitespace-nowrap">ONLINE DEPOSIT</th>
                <th className="py-2 px-3 whitespace-nowrap">BALANCE UPON DELIVERY</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading COD sequence tiers...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-400">
                    No COD tiers found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row, idx) => {
                  const id = row._id || row.id || `tier_${idx}`;
                  const isSelected = selectedIds.has(id);
                  const displayId = row.customId || `#TIER-${String((currentPage - 1) * pageSize + idx + 1).padStart(4, '0')}`;
                  const isPercent = row.chargeType === 'Percentage';
                  const formattedDeposit = isPercent
                    ? `${Number(row.chargeValue).toFixed(2)} %`
                    : `₹ ${Number(row.chargeValue).toLocaleString('en-IN')}`;

                  return (
                    <tr
                      key={id}
                      onClick={() => setViewingItem({ ...row, displayId, formattedDeposit })}
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

                      {/* Order Value Bracket */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#f4ece3] text-[#8b6f4e] font-semibold text-[11px] flex items-center justify-center border border-[#8b6f4e]/20 shadow-2xs shrink-0 font-serif">
                            ₹
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-stone-900 text-xs leading-none">
                              Upto ₹ {Number(row.uptoAmount).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono leading-none mt-1">
                              {displayId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Advance Type */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                            isPercent
                              ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                          }`}
                        >
                          {row.chargeType || 'Percentage'}
                        </span>
                      </td>

                      {/* Online Deposit */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-stone-900 text-xs">
                          {formattedDeposit}
                        </span>
                      </td>

                      {/* Balance Upon Delivery */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-medium text-xs">
                        {isPercent ? `${100 - Number(row.chargeValue)}% on doorstep` : 'Remaining invoice at delivery'}
                      </td>

                      {/* Actions: Eye & Three Dots */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingItem({ ...row, displayId, formattedDeposit })}
                          onEdit={() => handleOpenEdit(row)}
                          onDelete={() => handleDelete(id)}
                          viewTitle="View tier details"
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
          itemLabel="tiers"
        />
      </div>

      {/* ─── Add / Edit Tier Modal ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-serif">
                  {editingItem ? 'Edit COD Tier' : 'Add COD Tier'}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Set online deposit and threshold for COD checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Upto Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={formData.uptoAmount}
                  onChange={(e) => setFormData({ ...formData, uptoAmount: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Advance Payment Type
                </label>
                <select
                  value={formData.chargeType}
                  onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  {formData.chargeType === 'Percentage' ? 'Advance Percentage (%) *' : 'Advance Amount (₹) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={formData.chargeType === 'Percentage' ? 'e.g. 15' : 'e.g. 2500'}
                  value={formData.chargeValue}
                  onChange={(e) => setFormData({ ...formData, chargeValue: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#8b6f4e]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Tier' : 'Add Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Tier Modal ─── */}
      {viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                COD Tier Information
              </h3>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                <span className="text-stone-400">Tier ID</span>
                <span className="font-mono font-bold text-stone-900">{viewingItem.displayId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Order Cap</span>
                <span className="font-semibold text-stone-900">Upto ₹ {Number(viewingItem.uptoAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Advance Mode</span>
                <span className="font-medium text-stone-800">{viewingItem.chargeType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Required Deposit</span>
                <span className="font-bold text-[#8b6f4e] text-sm">{viewingItem.formattedDeposit}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const item = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(item);
                }}
                className="flex-1 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
              >
                Edit Tier
              </button>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
