import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineRefresh,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheck,
} from 'react-icons/hi';
import { TbCurrencyDollar, TbCoins } from 'react-icons/tb';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CurrenciesView() {
  const confirm = useConfirm();
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields matching user's Currency schema
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('');
  const [formInrRate, setFormInrRate] = useState('1');
  const [formUseLiveRate, setFormUseLiveRate] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsBase, setFormIsBase] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState('0');

  // Fetch currencies from API
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/currencies');
      const items = res.data?.data?.items || res.data?.data || [];
      setCurrencies(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load currencies:', err);
      toast.error('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Sync all live exchange rates
  const handleSyncAllLiveRates = async () => {
    try {
      setSyncingAll(true);
      const res = await api.post('/currencies/sync-rates');
      toast.success(res.data?.message || 'Live exchange rates synchronized successfully');
      fetchCurrencies();
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error(err.response?.data?.message || 'Failed to sync live rates');
    } finally {
      setSyncingAll(false);
    }
  };

  // Sync single currency rate
  const handleSyncSingleRate = async (item) => {
    try {
      setSyncingId(item._id);
      const res = await api.post(`/currencies/${item._id}/sync`);
      toast.success(`Live rate updated for ${item.currencyInfo?.code}`);
      fetchCurrencies();
    } catch (err) {
      console.error('Single sync failed:', err);
      toast.error(err.response?.data?.message || 'Failed to sync currency rate');
    } finally {
      setSyncingId(null);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setFormCode('');
    setFormName('');
    setFormSymbol('');
    setFormCountryCode('');
    setFormInrRate('1');
    setFormUseLiveRate(true);
    setFormIsActive(true);
    setFormIsBase(false);
    setFormSortOrder(String(currencies.length + 1));
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormCode(item.currencyInfo?.code || '');
    setFormName(item.currencyInfo?.name || '');
    setFormSymbol(item.currencyInfo?.symbol || '');
    setFormCountryCode(item.currencyInfo?.countryCode || '');
    setFormInrRate(String(item.exchangeRate?.inrRate || '1'));
    setFormUseLiveRate(Boolean(item.settings?.useLiveRate));
    setFormIsActive(item.settings?.isActive !== undefined ? Boolean(item.settings.isActive) : true);
    setFormIsBase(Boolean(item.settings?.isBaseCurrency));
    setFormSortOrder(String(item.settings?.sortOrder || '0'));
    setIsModalOpen(true);
  };

  // Save Currency
  const handleSaveCurrency = async (e) => {
    e.preventDefault();
    if (!formCode.trim()) {
      toast.error('Please enter a currency code');
      return;
    }
    if (!formName.trim()) {
      toast.error('Please enter a currency name');
      return;
    }
    if (!formSymbol.trim()) {
      toast.error('Please enter a currency symbol');
      return;
    }

    try {
      setSaving(true);
      const inrVal = Number(formInrRate) || 1;
      const rateVal = inrVal > 0 ? Number((1 / inrVal).toFixed(6)) : 1;

      const payload = {
        currencyInfo: {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          symbol: formSymbol.trim(),
          countryCode: formCountryCode.trim().toUpperCase(),
        },
        exchangeRate: {
          baseCurrency: 'INR',
          inrRate: formIsBase ? 1 : inrVal,
          rate: formIsBase ? 1 : rateVal,
        },
        settings: {
          isBaseCurrency: formIsBase,
          useLiveRate: formIsBase ? false : formUseLiveRate,
          isActive: formIsActive,
          sortOrder: Number(formSortOrder) || 0,
        },
      };

      if (editingItem?._id) {
        await api.put(`/currencies/${editingItem._id}`, payload);
        toast.success(`Currency ${payload.currencyInfo.code} updated successfully`);
      } else {
        await api.post('/currencies', payload);
        toast.success(`Currency ${payload.currencyInfo.code} created successfully`);
      }

      setIsModalOpen(false);
      fetchCurrencies();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(err.response?.data?.message || 'Failed to save currency');
    } finally {
      setSaving(false);
    }
  };

  // Delete Currency
  const handleDeleteCurrency = async (item) => {
    if (item.settings?.isBaseCurrency) {
      toast.error('Base currency cannot be deleted');
      return;
    }

    const isConfirmed = await confirm({
      title: `Delete Currency ${item.currencyInfo?.code}`,
      message: `Are you sure you want to remove ${item.currencyInfo?.name} (${item.currencyInfo?.code})? This will deactivate currency conversion for this currency on storefront.`,
      confirmText: 'Delete Currency',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/currencies/${item._id}`);
      toast.success(`${item.currencyInfo?.code} deleted successfully`);
      setCurrencies((prev) => prev.filter((c) => c._id !== item._id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete currency');
    }
  };

  // Filtered currencies
  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return currencies;
    const q = search.toLowerCase();
    return currencies.filter((item) => {
      const code = item.currencyInfo?.code?.toLowerCase() || '';
      const name = item.currencyInfo?.name?.toLowerCase() || '';
      const symbol = item.currencyInfo?.symbol?.toLowerCase() || '';
      return code.includes(q) || name.includes(q) || symbol.includes(q);
    });
  }, [currencies, search]);

  // Format Date helpers matching Screenshot
  const formatTime = (dateStr) => {
    if (!dateStr) return '11:30';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '11 Oct';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* ─── Header Row (Exact match to Screenshot) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#faf5ee] border border-[#ebdccb] flex items-center justify-center text-[#8f6d43] shadow-2xs shrink-0">
            <TbCoins className="w-5 h-5 text-[#8f6d43]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 leading-tight">
              CURRENCY MANAGEMENT
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mt-0.5">
              LIVE EXCHANGE RATES & MULTI-CURRENCY DISPLAY ON STOREFRONT
            </p>
          </div>
        </div>

        {/* Action Buttons (Matches Screenshot: Sync Live Rates & + ADD CURRENCY) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncAllLiveRates}
            disabled={syncingAll || loading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200/90 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Synchronize live exchange rates from forex feed"
          >
            <HiOutlineRefresh className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>{syncingAll ? 'Syncing...' : 'Sync Live Rates'}</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] active:bg-[#685034] text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>ADD CURRENCY</span>
          </button>
        </div>
      </div>

      {/* ─── Search & Count Row (Exact match to Screenshot) ─── */}
      <div className="flex items-center justify-between gap-3">
        {/* Search input with pill styling */}
        <div className="relative flex-1 max-w-sm">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, symbol..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-full bg-stone-50/70 border border-stone-200 text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Currency Count Counter */}
        <div className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
          {filteredCurrencies.length} CURRENCIES CONFIGURED
        </div>
      </div>

      {/* ─── Currency Table Container (Exact Match to Screenshot) ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-white text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                <th className="py-3.5 pl-4 pr-2 w-12 text-center">SR. NO.</th>
                <th className="py-3.5 px-4">CURRENCY</th>
                <th className="py-3.5 px-4 text-center">SYMBOL</th>
                <th className="py-3.5 px-4">VALUE IN INR (1 UNIT)</th>
                <th className="py-3.5 px-4">RATE VS INR (1 INR)</th>
                <th className="py-3.5 px-4 text-center">RATE TYPE</th>
                <th className="py-3.5 px-4 text-center">LAST UPDATED</th>
                <th className="py-3.5 pr-4 pl-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/90 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-stone-300 border-t-[#8b6f4e] rounded-full animate-spin" />
                      <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">
                        LOADING CURRENCIES...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCurrencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 text-xs">
                    No matching currencies found
                  </td>
                </tr>
              ) : (
                filteredCurrencies.map((item, idx) => {
                  const isBase = item.settings?.isBaseCurrency;
                  const useLive = item.settings?.useLiveRate;
                  const inrRate = item.exchangeRate?.inrRate || 1;
                  const rateVsInr = item.exchangeRate?.rate || (inrRate > 0 ? 1 / inrRate : 1);
                  const isSyncingThis = syncingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-[#faf8f5]/60 transition-colors group"
                    >
                      {/* Sr No */}
                      <td className="py-3.5 pl-4 pr-2 text-center text-xs font-semibold text-stone-400 whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {/* Currency (Code + Name) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-xs">
                            {item.currencyInfo?.code}
                          </span>
                          {isBase && (
                            <span className="text-[9px] font-bold tracking-wider uppercase bg-[#faf5ee] text-[#8b6f4e] border border-[#ebdccb] px-1.5 py-0.5 rounded">
                              BASE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {item.currencyInfo?.name}
                        </div>
                      </td>

                      {/* Symbol */}
                      <td className="py-3.5 px-4 text-center font-bold text-stone-800 text-xs whitespace-nowrap">
                        {item.currencyInfo?.symbol}
                      </td>

                      {/* Value in INR (1 unit) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-900 text-xs font-mono">
                          ₹ {Number(inrRate).toFixed(isBase ? 2 : 4)}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                          per 1 {item.currencyInfo?.code}
                        </div>
                      </td>

                      {/* Rate vs INR (1 INR) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-900 text-xs font-mono">
                          {Number(rateVsInr).toFixed(4)} {item.currencyInfo?.symbol}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                          per ₹ 1.00
                        </div>
                      </td>

                      {/* Rate Type */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isBase ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef9ee] text-[#b45309] border border-[#fde68a]">
                            ✦ Base Currency
                          </span>
                        ) : useLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                            Live Sync
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            Manual
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="text-xs font-mono text-stone-700 leading-tight">
                          {formatTime(item.exchangeRate?.lastFetchedAt || item.updatedAt)}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                          {formatDate(item.exchangeRate?.lastFetchedAt || item.updatedAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Live sync single rate */}
                          {!isBase && useLive && (
                            <button
                              type="button"
                              onClick={() => handleSyncSingleRate(item)}
                              disabled={isSyncingThis}
                              className="p-1 rounded-md text-stone-400 hover:text-[#8b6f4e] hover:bg-stone-50 transition-colors cursor-pointer"
                              title="Sync live rate"
                            >
                              <HiOutlineRefresh className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-[#8b6f4e]' : ''}`} />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                            title="Edit currency"
                          >
                            <HiOutlinePencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button (forbidden for base) */}
                          {!isBase && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCurrency(item)}
                              className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete currency"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Add / Edit Currency ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                  <TbCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base leading-tight">
                    {editingItem ? `Edit ${editingItem.currencyInfo?.code}` : 'Add Currency'}
                  </h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Configure exchange rates and storefront display properties.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCurrency} className="p-5 space-y-3.5">
              {/* Code & Symbol */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Currency Code <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. USD"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Symbol <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value)}
                    placeholder="e.g. $"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Name & Country Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Currency Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. US Dollar"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Country Code
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formCountryCode}
                    onChange={(e) => setFormCountryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. US"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Value in INR */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Value in INR (1 {formCode || 'UNIT'} in ₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-stone-400 font-medium text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={formIsBase}
                    value={formIsBase ? '1' : formInrRate}
                    onChange={(e) => setFormInrRate(e.target.value)}
                    placeholder="84.5"
                    className="w-full pl-7 pr-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs disabled:opacity-60"
                  />
                </div>
                {!formIsBase && Number(formInrRate) > 0 && (
                  <p className="text-[10px] text-stone-400 mt-1 font-mono">
                    1 INR = {(1 / Number(formInrRate)).toFixed(6)} {formCode || 'UNIT'}
                  </p>
                )}
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-stone-100 space-y-2.5">
                {/* Live rate toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Use Live Forex Rate</span>
                    <span className="text-[10px] text-stone-400">Syncs automatically via exchange rate feed</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={formIsBase}
                    checked={formUseLiveRate && !formIsBase}
                    onChange={(e) => setFormUseLiveRate(e.target.checked)}
                    className="w-4 h-4 rounded text-[#8b6f4e] border-stone-300 focus:ring-0 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Base Currency toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Base Currency</span>
                    <span className="text-[10px] text-stone-400">Sets this currency as the store anchor (INR)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsBase}
                    onChange={(e) => {
                      setFormIsBase(e.target.checked);
                      if (e.target.checked) {
                        setFormInrRate('1');
                        setFormUseLiveRate(false);
                      }
                    }}
                    className="w-4 h-4 rounded text-[#8b6f4e] border-stone-300 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Active Status</span>
                    <span className="text-[10px] text-stone-400">Visible on customer storefront currency selector</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#8b6f4e] border-stone-300 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
