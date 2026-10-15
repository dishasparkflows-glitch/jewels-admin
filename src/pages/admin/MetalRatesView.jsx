import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineX,
} from 'react-icons/hi';
import { TbCoins } from 'react-icons/tb';
import { IoSparklesOutline, IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import Pagination from '../../components/common/Pagination';
import RowActions from '../../components/common/RowActions';
import usePagination from '../../hooks/usePagination';

export default function MetalRatesView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Base Rates State matching GoldPrice Model
  const [base24KRate, setBase24KRate] = useState(15700);
  const [platinumRate, setPlatinumRate] = useState(3500);
  const [silverRate, setSilverRate] = useState(95);
  const [updatedAt, setUpdatedAt] = useState(null);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Form state for modal
  const [form24K, setForm24K] = useState('15700');
  const [formPlatinum, setFormPlatinum] = useState('3500');
  const [formSilver, setFormSilver] = useState('95');

  // Fetch current metal rates from backend
  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goldprice');
      const data = res.data?.data;
      if (data) {
        const g24 = Number(data.base24KRate) || 0;
        const pt = Number(data.platinumRate) || 0;
        const ag = Number(data.silverRate) || 0;
        setBase24KRate(g24);
        setPlatinumRate(pt);
        setSilverRate(ag);
        setForm24K(String(g24));
        setFormPlatinum(String(pt));
        setFormSilver(String(ag));
        setUpdatedAt(data.updatedAt || null);
      }
    } catch (err) {
      console.error('Failed to load metal rates:', err);
      toast.error('Failed to fetch metal rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Format currency helper
  const formatINR = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
    });
  };

  // Build 8 standardized metal rate records matching screenshot styling
  const metalRecords = useMemo(() => {
    const b24 = Number(base24KRate) || 0;
    const pt = Number(platinumRate) || 0;
    const ag = Number(silverRate) || 0;

    return [
      {
        id: '24k-gold',
        name: '24K Gold (Base)',
        category: 'Gold',
        karat: 24,
        purity: '99.9%',
        ratePerGram: b24,
        formula: 'Base reference (24/24)',
        status: 'active',
        isBase: true,
      },
      {
        id: '22k-gold',
        name: '22K Gold',
        category: 'Gold',
        karat: 22,
        purity: '91.6%',
        ratePerGram: (22 / 24) * b24,
        formula: `22/24 × ₹${formatINR(b24)}`,
        status: 'active',
        isBase: false,
      },
      {
        id: '18k-gold',
        name: '18KT Gold',
        category: 'Gold',
        karat: 18,
        purity: '75.0%',
        ratePerGram: (18 / 24) * b24,
        formula: `18/24 × ₹${formatINR(b24)}`,
        status: 'active',
        isBase: false,
      },
      {
        id: '14k-gold',
        name: '14KT Gold',
        category: 'Gold',
        karat: 14,
        purity: '58.3%',
        ratePerGram: (14 / 24) * b24,
        formula: `14/24 × ₹${formatINR(b24)}`,
        status: 'active',
        isBase: false,
      },
      {
        id: '10k-gold',
        name: '10KT Gold',
        category: 'Gold',
        karat: 10,
        purity: '41.7%',
        ratePerGram: (10 / 24) * b24,
        formula: `10/24 × ₹${formatINR(b24)}`,
        status: 'active',
        isBase: false,
      },
      {
        id: '9k-gold',
        name: '9KT Gold',
        category: 'Gold',
        karat: 9,
        purity: '37.5%',
        ratePerGram: (9 / 24) * b24,
        formula: `9/24 × ₹${formatINR(b24)}`,
        status: 'active',
        isBase: false,
      },
      {
        id: 'platinum-950',
        name: 'Platinum Rate',
        category: 'Platinum',
        karat: null,
        purity: '95.0%',
        ratePerGram: pt,
        formula: 'Fixed metal base rate',
        status: 'active',
        isBase: true,
      },
      {
        id: 'silver-925',
        name: 'Silver Rate',
        category: 'Silver',
        karat: null,
        purity: '92.5%',
        ratePerGram: ag,
        formula: 'Fixed metal base rate',
        status: 'active',
        isBase: true,
      },
    ];
  }, [base24KRate, platinumRate, silverRate]);

  // Filtered metal records for search
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return metalRecords;
    const q = search.toLowerCase();
    return metalRecords.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        String(m.ratePerGram).includes(q)
    );
  }, [metalRecords, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredRecords, 10);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Edit Modal
  const openEditModal = () => {
    setForm24K(String(base24KRate));
    setFormPlatinum(String(platinumRate));
    setFormSilver(String(silverRate));
    setIsEditModalOpen(true);
  };

  // Save changes
  const handleSaveRates = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const payload = {
        base24KRate: Number(form24K) || 0,
        platinumRate: Number(formPlatinum) || 0,
        silverRate: Number(formSilver) || 0,
      };

      const res = await api.put('/goldprice', payload);
      const updated = res.data?.data;
      if (updated) {
        setBase24KRate(Number(updated.base24KRate) || 0);
        setPlatinumRate(Number(updated.platinumRate) || 0);
        setSilverRate(Number(updated.silverRate) || 0);
        setUpdatedAt(updated.updatedAt || new Date().toISOString());
      } else {
        setBase24KRate(payload.base24KRate);
        setPlatinumRate(payload.platinumRate);
        setSilverRate(payload.silverRate);
      }

      setIsEditModalOpen(false);
      toast.success('Metal rates updated and synchronized successfully!');
    } catch (err) {
      console.error('Failed to update metal rates:', err);
      toast.error(err.response?.data?.message || 'Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  // Sync ERP rates
  const handleSyncERP = async () => {
    try {
      setSaving(true);
      await api.post('/ornate/sync-metal-rates');
      toast.success('ERP metal rates synchronized successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'ERP sync completed');
    } finally {
      setSaving(false);
    }
  };

  // Stat cards matching Diamond rates exact proportions
  const statCardsData = [
    {
      label: '24K Gold Base',
      value: `₹${formatINR(base24KRate)}`,
      icon: TbCoins,
      color: 'gold',
    },
    {
      label: 'Platinum Rate',
      value: `₹${formatINR(platinumRate)}`,
      icon: IoSparklesOutline,
      color: 'blue',
    },
    {
      label: 'Silver Rate',
      value: `₹${formatINR(silverRate)}`,
      icon: TbCoins,
      color: 'peach',
    },
    {
      label: 'Formula Engine',
      value: 'Live',
      icon: HiOutlineCheck,
      color: 'green',
    },
  ];

  // Modal live calculations
  const temp24 = Number(form24K) || 0;
  const temp18KT = (18 / 24) * temp24;
  const temp14KT = (14 / 24) * temp24;
  const temp10KT = (10 / 24) * temp24;
  const temp9KT = (9 / 24) * temp24;

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row (Matches Diamond rates exactly) ─── */}
      <ModuleHeader
        breadcrumbs={['Pricing Hub', 'Metal Rates']}
        title="Metal rates"
        subtitle="Formula-based pricing and real-time metal rates for all jewelry variants."
        onAdd={openEditModal}
        addLabel="+ Update Metal rates"
        extraActions={
          <button
            type="button"
            onClick={handleSyncERP}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Synchronize ERP metal rates"
          >
            <HiOutlineRefresh className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            <span>Sync All</span>
          </button>
        }
      />

      {/* ─── 4 Stat Cards Row (Exact Match to Diamond rates) ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (Compact Neirah Style) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search metal rates, karats or formulas..."
      />

      {/* ─── Table Container (Exact Match to Diamond rates) ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#faf8f5]/80 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-2.5 pl-3 pr-1 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((m) => selectedIds.includes(m.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-2 w-12 text-center">SR NO</th>
                <th className="py-2.5 px-3">ITEM / RECORD</th>
                <th className="py-2.5 px-3">SPECIFICATIONS</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
                <th className="py-2.5 pr-3 pl-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-stone-300 border-t-[#8b6f4e] rounded-full animate-spin" />
                      <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">
                        LOADING METAL RATES...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400 text-xs">
                    No matching metal rates found
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const srNo = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setViewingRecord(item)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-2.5 pl-3 pr-1 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {srNo}
                      </td>

                      {/* Item / Record */}
                      <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.isBase && (
                            <span className="text-[9px] font-bold tracking-widest uppercase bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d9c2] px-1.5 py-0.5 rounded">
                              Base
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Specifications */}
                      <td className="py-2.5 px-3 text-stone-600 font-mono text-[11px] whitespace-nowrap">
                        <span>
                          {item.purity} • ₹{formatINR(item.ratePerGram)}/g ({item.formula})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          active
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-2.5 pr-3 pl-2 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          onPreview={() => setViewingRecord(item)}
                          onEdit={openEditModal}
                          previewTitle="View Rate Details"
                          editTitle="Edit Rates"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Compact Pagination (Exact Match to Diamond rates) ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="records"
        />
      </div>

      {/* ─── Modal: Update Metal Rates (Compact Luxury Modal) ─── */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                  <TbCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base leading-tight">
                    Update Metal Rates
                  </h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Synchronize real-time base rates and derived karat pricing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRates} className="p-5 space-y-4">
              {/* 24K Gold Base */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  24K Gold Base Rate (per gram in ₹) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-stone-400 font-medium text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={form24K}
                    onChange={(e) => setForm24K(e.target.value)}
                    placeholder="15700"
                    className="w-full pl-7 pr-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Platinum & Silver Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Platinum Rate (₹/g) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-stone-400 font-medium text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formPlatinum}
                      onChange={(e) => setFormPlatinum(e.target.value)}
                      placeholder="3500"
                      className="w-full pl-7 pr-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Silver Rate (₹/g) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-stone-400 font-medium text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formSilver}
                      onChange={(e) => setFormSilver(e.target.value)}
                      placeholder="95"
                      className="w-full pl-7 pr-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Formula Calculation Preview in Modal */}
              <div className="p-3 bg-[#faf7f2]/90 border border-[#ebdccb]/70 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-stone-500 uppercase block">
                  Calculated Formula Preview
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-bold block">18KT</span>
                    <span className="font-bold text-stone-900 text-xs">₹{formatINR(temp18KT)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-bold block">14KT</span>
                    <span className="font-bold text-stone-900 text-xs">₹{formatINR(temp14KT)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-bold block">10KT</span>
                    <span className="font-bold text-stone-900 text-xs">₹{formatINR(temp10KT)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-bold block">9KT</span>
                    <span className="font-bold text-stone-900 text-xs">₹{formatINR(temp9KT)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Sync Rates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: View Rate Details ─── */}
      {viewingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setViewingRecord(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]">
              <span className="font-bold text-stone-900 text-sm">
                {viewingRecord.name} Details
              </span>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Metal:</span>
                <span className="font-semibold text-stone-800">{viewingRecord.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Purity:</span>
                <span className="font-semibold text-stone-800">{viewingRecord.purity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Rate per gram:</span>
                <span className="font-bold text-[#8b6f4e] text-sm">
                  ₹{formatINR(viewingRecord.ratePerGram)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Formula:</span>
                <span className="font-mono text-stone-700">{viewingRecord.formula}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-400 font-medium">Status:</span>
                <span className="text-emerald-700 font-semibold uppercase">{viewingRecord.status}</span>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setViewingRecord(null);
                    openEditModal();
                  }}
                  className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors"
                >
                  Edit Rates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
