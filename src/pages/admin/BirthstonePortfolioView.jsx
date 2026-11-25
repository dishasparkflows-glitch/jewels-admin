import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineCalendar,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl, deleteUploadedFile } from '../../utils/uploadWithPresignedUrl';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Dropdown from '../../components/common/Dropdown';
import MobileGridList from '../../components/common/MobileGridList';
import ToggleSwitch from '../../components/common/ToggleSwitch';

const MONTHS = [
  { short: 'JAN', full: 'January', num: 1, defaultStone: 'GARNET', color: '#d97706', quarter: 'Q1' },
  { short: 'FEB', full: 'February', num: 2, defaultStone: 'AMETHYST', color: '#9333ea', quarter: 'Q1' },
  { short: 'MAR', full: 'March', num: 3, defaultStone: 'AQUAMARINE', color: '#06b6d4', quarter: 'Q1' },
  { short: 'APR', full: 'April', num: 4, defaultStone: 'DIAMOND', color: '#38bdf8', quarter: 'Q2' },
  { short: 'MAY', full: 'May', num: 5, defaultStone: 'EMERALD', color: '#10b981', quarter: 'Q2' },
  { short: 'JUN', full: 'June', num: 6, defaultStone: 'PEARL', color: '#94a3b8', quarter: 'Q2' },
  { short: 'JUL', full: 'July', num: 7, defaultStone: 'RUBY', color: '#e11d48', quarter: 'Q3' },
  { short: 'AUG', full: 'August', num: 8, defaultStone: 'PERIDOT', color: '#84cc16', quarter: 'Q3' },
  { short: 'SEP', full: 'September', num: 9, defaultStone: 'SAPPHIRE', color: '#2563eb', quarter: 'Q3' },
  { short: 'OCT', full: 'October', num: 10, defaultStone: 'OPAL', color: '#f472b6', quarter: 'Q4' },
  { short: 'NOV', full: 'November', num: 11, defaultStone: 'CITRINE', color: '#eab308', quarter: 'Q4' },
  { short: 'DEC', full: 'December', num: 12, defaultStone: 'BLUE TOPAZ', color: '#0ea5e9', quarter: 'Q4' },
];

const GEM_GRADIENTS = {
  GARNET: 'radial-gradient(circle at 35% 26%, #fde047 0%, #fb923c 25%, #ea580c 55%, #9a3412 82%, #431407 100%)',
  AMETHYST: 'radial-gradient(circle at 35% 26%, #f5d0fe 0%, #c084fc 30%, #9333ea 60%, #581c87 85%, #2e1065 100%)',
  AQUAMARINE: 'radial-gradient(circle at 35% 26%, #cffafe 0%, #38bdf8 30%, #06b6d4 60%, #0e7490 85%, #164e63 100%)',
  DIAMOND: 'radial-gradient(circle at 35% 26%, #ffffff 0%, #f0f9ff 30%, #bae6fd 60%, #38bdf8 85%, #0369a1 100%)',
  EMERALD: 'radial-gradient(circle at 35% 26%, #dcfce7 0%, #4ade80 30%, #16a34a 60%, #166534 85%, #052e16 100%)',
  PEARL: 'radial-gradient(circle at 35% 26%, #ffffff 0%, #f8fafc 40%, #e2e8f0 70%, #94a3b8 90%, #475569 100%)',
  RUBY: 'radial-gradient(circle at 35% 26%, #ffe4e6 0%, #fb7185 28%, #e11d48 60%, #9f1239 85%, #4c0519 100%)',
  PERIDOT: 'radial-gradient(circle at 35% 26%, #ecfccb 0%, #a3e635 30%, #65a30d 65%, #3f6212 85%, #1a2e05 100%)',
  SAPPHIRE: 'radial-gradient(circle at 35% 26%, #dbeafe 0%, #60a5fa 30%, #2563eb 60%, #1e40af 85%, #172554 100%)',
  OPAL: 'radial-gradient(circle at 35% 26%, #fef3c7 0%, #f472b6 35%, #c084fc 70%, #7c3aed 90%, #4c1d95 100%)',
  CITRINE: 'radial-gradient(circle at 35% 26%, #fef9c3 0%, #facc15 30%, #ca8a04 60%, #854d0e 85%, #422006 100%)',
  'BLUE TOPAZ': 'radial-gradient(circle at 35% 26%, #e0f2fe 0%, #38bdf8 30%, #0284c7 60%, #0369a1 85%, #082f49 100%)',
};

export default function BirthstonePortfolioView() {
  const confirm = useConfirm();
  const [birthstonesMap, setBirthstonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(null);
  const [, setEditingMonth] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formMonth, setFormMonth] = useState('January');
  const [formStoneName, setFormStoneName] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');

  // Storefront Display Setting
  const [showOnStorefront, setShowOnStorefront] = useState(true);
  const [togglingStorefront, setTogglingStorefront] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch settings for birthstones storefront visibility
  const fetchStorefrontSetting = async () => {
    try {
      const res = await api.get('/settings');
      const s = res.data?.data || res.data;
      if (s) {
        const isVisible = s.birthstones?.showOnStorefront !== false;
        setShowOnStorefront(isVisible);
      }
    } catch (err) {
      console.warn('Failed to fetch storefront setting:', err);
    }
  };

  const handleToggleStorefront = async () => {
    const nextVal = !showOnStorefront;
    setTogglingStorefront(true);
    try {
      await api.put('/settings', { birthstones: { showOnStorefront: nextVal } });
      setShowOnStorefront(nextVal);
      toast.success(
        nextVal
          ? 'Birthstones section is now visible on storefront'
          : 'Birthstones section is now hidden from storefront'
      );
    } catch (err) {
      console.error('Failed to update storefront visibility:', err);
      toast.error('Failed to update storefront display setting');
    } finally {
      setTogglingStorefront(false);
    }
  };

  // Fetch all birthstones from API
  const fetchBirthstones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/birthstones?limit=50');
      const items = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);

      const map = {};
      items.forEach((item) => {
        if (item.month) {
          map[item.month.toLowerCase()] = item;
        }
      });
      setBirthstonesMap(map);
    } catch (err) {
      console.error('Failed to load birthstones:', err);
      toast.error('Failed to load birthstone data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthstones();
    fetchStorefrontSetting();
  }, []);

  // Combine 12 months with API records
  const allMonthsData = useMemo(() => {
    return MONTHS.filter((m) => birthstonesMap[m.full.toLowerCase()]).map((m) => {
      const existing = birthstonesMap[m.full.toLowerCase()];
      const isCustomImage = Boolean(existing?.image?.url);
      const stoneName = existing?.stoneName ? existing.stoneName.toUpperCase() : m.defaultStone;
      const status = existing?.status || 'active';
      const imageUrl = existing?.image?.url || '';
      const order = existing?.order !== undefined && existing?.order !== null ? Number(existing.order) : m.num;

      return {
        _id: existing?._id || `month-${m.num}`,
        num: m.num,
        order,
        code: `#MTH-${String(m.num).padStart(2, '0')}`,
        short: m.short,
        month: m.full,
        quarter: m.quarter,
        defaultStone: m.defaultStone,
        stoneName,
        status,
        isActive: status === 'active',
        imageUrl,
        isCustomImage,
        color: m.color,
        gradient: GEM_GRADIENTS[stoneName] || GEM_GRADIENTS[m.defaultStone] || GEM_GRADIENTS.GARNET,
        dbRecord: existing || null,
      };
    }).sort((a, b) => (a.order ?? a.num) - (b.order ?? b.num));
  }, [birthstonesMap]);

  // Filtered list (search query only - no active/inactive filter)
  const filteredMonths = useMemo(() => {
    if (!search.trim()) return allMonthsData;
    const q = search.toLowerCase();
    return allMonthsData.filter(
      (m) =>
        m.month.toLowerCase().includes(q) ||
        m.stoneName.toLowerCase().includes(q) ||
        m.defaultStone.toLowerCase().includes(q) ||
        m.short.toLowerCase().includes(q)
    );
  }, [allMonthsData, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredMonths, 10);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((item) => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Configure Modal
  const handleOpenConfigure = (monthItem = null) => {
    const targetMonth = monthItem || { month: 'January', stoneName: '', order: 1, isActive: true, imageUrl: '' };
    setEditingMonth(targetMonth);
    setFormMonth(targetMonth.month);
    setFormStoneName(targetMonth.stoneName);
    setFormOrder(targetMonth.order ?? targetMonth.num ?? 1);
    setFormIsActive(targetMonth.isActive);
    setFormImageUrl(targetMonth.imageUrl || '');
    setIsModalOpen(true);
  };

  // When changing month inside modal form
  const handleMonthChangeInForm = (monthName) => {
    setFormMonth(monthName);
    const target = allMonthsData.find((m) => m.month.toLowerCase() === monthName.toLowerCase());
    if (target) {
      setFormStoneName(target.stoneName);
      setFormOrder(target.order ?? target.num ?? 1);
      setFormIsActive(target.isActive);
      setFormImageUrl(target.imageUrl || '');
    } else {
      const monthObj = MONTHS.find((m) => m.full.toLowerCase() === monthName.toLowerCase());
      setFormOrder(monthObj?.num ?? 1);
    }
  };

  // Upload image handler, deleting old image on replace
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const prevUrl = formImageUrl;
      const { fileUrl } = await uploadWithPresignedUrl(file, 'birthstones');
      if (fileUrl) {
        if (prevUrl) {
          try {
            await deleteUploadedFile(prevUrl);
          } catch {
            // Best-effort cleanup of previous file
          }
        }
        setFormImageUrl(fileUrl);
        toast.success('Gemstone portrait uploaded successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Save changes
  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const existing = birthstonesMap[formMonth.toLowerCase()];
      const payload = {
        month: formMonth,
        stoneName: formStoneName.trim().toUpperCase(),
        order: Number(formOrder) || 1,
        status: formIsActive ? 'active' : 'inactive',
        image: { url: formImageUrl },
      };

      if (existing?._id) {
        await api.put(`/birthstones/${existing._id}`, payload);
      } else {
        await api.post('/birthstones', payload);
      }

      toast.success(`${formMonth} configuration saved successfully`);
      setIsModalOpen(false);
      fetchBirthstones();
    } catch (err) {
      console.error('Error saving birthstone:', err);
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    const monthKey = item.month.toLowerCase();
    const prevEntry = birthstonesMap[monthKey];

    // Optimistic UI update
    setBirthstonesMap((prev) => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        month: item.month,
        stoneName: item.stoneName,
        order: item.order,
        status: nextStatus,
        image: { url: item.imageUrl || '' },
      },
    }));

    try {
      const payload = {
        month: item.month,
        stoneName: item.stoneName,
        order: item.order,
        status: nextStatus,
        image: { url: item.imageUrl || '' },
      };

      if (item.dbRecord?._id) {
        await api.put(`/birthstones/${item.dbRecord._id}`, payload);
      } else {
        await api.post('/birthstones', payload);
      }

      toast.success(`${item.month} set to ${nextStatus}`);
      fetchBirthstones();
    } catch {
      // Revert on error
      setBirthstonesMap((prev) => ({
        ...prev,
        [monthKey]: prevEntry,
      }));
      toast.error('Failed to update status');
    }
  };

  // Delete Birthstone with common confirmation modal
  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: 'Delete Birthstone',
      message: `Are you sure you want to delete the "${item.month}" birthstone configuration?\nThis action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      if (item.dbRecord?._id) {
        await api.delete(`/birthstones/${item.dbRecord._id}`);
        toast.success(`${item.month} birthstone deleted successfully`);
        fetchBirthstones();
      } else {
        toast.error('No custom birthstone record found to delete');
      }
    } catch (err) {
      console.error('Delete birthstone failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete birthstone');
    }
  };

  // Export handlers
  const handleExport = (format) => {
    const dataToExport = filteredMonths.map((m) => ({
      Order: m.order,
      Code: m.code,
      Month: m.month,
      Quarter: m.quarter,
      StoneName: m.stoneName,
      DefaultStone: m.defaultStone,
      Status: m.status,
      HasCustomImage: m.isCustomImage ? 'Yes' : 'No',
      ImageUrl: m.imageUrl || 'N/A',
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birthstones_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported birthstones as JSON');
    } else {
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const rows = dataToExport.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birthstones_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported birthstones as CSV');
    }
  };

  // Metric stat cards
  const customCount = allMonthsData.filter((m) => m.isCustomImage).length;
  const activeCount = allMonthsData.filter((m) => m.isActive).length;

  const statCardsData = [
    {
      label: 'Total Months',
      value: 12,
      icon: HiOutlineCalendar,
      color: 'bronze',
    },
    {
      label: 'Configured Stones',
      value: allMonthsData.length,
      icon: IoDiamondOutline,
      color: 'green',
    },
    {
      label: 'Custom Portraits',
      value: customCount,
      icon: HiOutlinePhotograph,
      color: 'peach',
    },
    {
      label: 'Active Portfolios',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Module Header (Breadcrumbs, Serif Title, Actions) ─── */}
      <ModuleHeader
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Marketing' },
          { label: 'Birthstones' },
        ]}
        title="Birthstones"
        subtitle="Manage seasonal birthstone portrayals, assigned gemstones, and portfolio media."
        onExport={handleExport}
        onAdd={() => handleOpenConfigure()}
        addLabel="Configure Birthstone"
        extraActions={
          <div className="flex items-center gap-3 bg-white border border-stone-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-stone-800 leading-tight">
                Storefront Display
              </span>
              <span className="text-[10.5px] text-stone-500 font-medium">
                {showOnStorefront ? 'Visible on Homepage' : 'Hidden from Homepage'}
              </span>
            </div>
            <button
              type="button"
              disabled={togglingStorefront}
              onClick={handleToggleStorefront}
              style={showOnStorefront ? { backgroundColor: 'var(--theme-primary, #8b6f4e)' } : undefined}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                showOnStorefront ? 'bg-[var(--theme-primary,#8b6f4e)]' : 'bg-stone-300'
              }`}
              title={showOnStorefront ? 'Click to hide from storefront' : 'Click to display on storefront'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  showOnStorefront ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        }
      />

      {/* ─── 4 Stat Cards ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        searchPlaceholder="Search by month or gemstone name..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* ─── Table Container (Mobile Grid + Desktop Table) ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText="Loading birthstone collection..."
          isEmpty={paginatedItems.length === 0}
          emptyText={`No birthstones found matching "${search}".`}
          items={paginatedItems}
          showSelectAll
          allSelected={
            paginatedItems.length > 0 &&
            paginatedItems.every((item) => selectedIds.includes(item._id))
          }
          onSelectAll={handleSelectAll}
          renderCard={(item, idx) => {
            const isSelected = selectedIds.includes(item._id);
            const srNo = (currentPage - 1) * pageSize + idx + 1;

            return (
              <div
                key={item._id}
                onClick={() => handleOpenConfigure(item)}
                className={`rounded-xl border p-3.5 bg-white shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                  isSelected ? 'border-[#8b6f4e]/60 bg-[#faf6f0]' : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer shrink-0"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectItem(item._id)}
                    />
                    <div className="w-9 h-9 rounded-lg border border-stone-200/90 bg-[#faf8f5] flex items-center justify-center p-0.5 shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.month} className="w-full h-full object-contain" />
                      ) : (
                        <IoDiamondOutline className="w-4 h-4 text-stone-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-xs truncate">{item.month}</p>
                      <p className="text-[10px] text-stone-400 truncate">#{srNo} · Order {item.order}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <RowActions
                      onEdit={() => handleOpenConfigure(item)}
                      onDelete={() => handleDelete(item._id, item.month)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px]" onClick={(e) => e.stopPropagation()}>
                  <span className="font-semibold text-stone-700 truncate">{item.stone || '—'}</span>
                  <ToggleSwitch
                    checked={item.status === 'active'}
                    onChange={() => handleToggleStatus(item)}
                    size="sm"
                  />
                </div>
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8 text-center">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((item) => selectedIds.includes(item._id))
                    }
                  />
                </th>
                <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-3 text-center w-14 whitespace-nowrap">ORDER</th>
                <th className="py-3 px-3 whitespace-nowrap">MONTH</th>
                <th className="py-3 px-3 whitespace-nowrap">GEM PORTRAIT</th>
                <th className="py-3 px-3 whitespace-nowrap">ASSIGNED GEMSTONE</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">STATUS</th>
                <th className="py-3 pr-4 pl-2 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading birthstone collection...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    No birthstones found matching &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isSelected = selectedIds.includes(item._id);

                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleOpenConfigure(item)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${isSelected ? 'bg-[#faf6f0]' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectItem(item._id)}
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Display Order */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50">
                          {item.order}
                        </span>
                      </td>

                      {/* Month */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-stone-900 text-xs">
                          {item.month}
                        </span>
                      </td>

                      {/* Gem Portrait Preview */}
                      <td className="py-2.5 px-3">
                        <div
                          onClick={() => handleOpenConfigure(item)}
                          className="w-7 h-7 rounded-md border border-stone-200/90 bg-[#faf8f5] flex items-center justify-center p-0.5 cursor-pointer hover:border-[#8b6f4e] transition-colors shadow-2xs group relative"
                          title="Click to edit birthstone"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.stoneName}
                              className="w-full h-full object-contain rounded transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div
                              className="w-5 h-5 rounded-full shadow-inner transition-transform group-hover:scale-110"
                              style={{
                                background: item.gradient,
                                boxShadow:
                                  '0 2px 5px -1px rgba(0, 0, 0, 0.25), inset -2px -2px 4px rgba(0, 0, 0, 0.35), inset 1px 1px 3px rgba(255, 255, 255, 0.5)',
                              }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Assigned Gemstone */}
                      <td className="py-2.5 px-3">
                        <div className="leading-tight">
                          <div className="font-bold text-stone-900 tracking-wide text-xs uppercase flex items-center gap-1 leading-none">
                            <span>{item.stoneName}</span>
                            {item.stoneName !== item.defaultStone && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase font-bold">
                                Customized
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-1 leading-none">
                            Default: {item.defaultStone}
                          </div>
                        </div>
                      </td>



                      {/* Status Toggle Switch */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            checked={item.isActive}
                            onChange={() => handleToggleStatus(item)}
                            size="sm"
                            stopPropagation={true}
                            ariaLabel={`Set status ${item.isActive ? 'Inactive' : 'Active'}`}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          record={item.dbRecord || item}
                          detailsEndpoint="/birthstones"
                          detailsTitle={`${item.month} Birthstone Details`}
                          onPreview={() => handleOpenConfigure(item)}
                          onEdit={() => handleOpenConfigure(item)}
                          onDelete={() => handleDelete(item)}
                          deleteTitle={`Delete ${item.month}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Luxury Standard Pagination ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="birthstones"
        />
      </div>

      {/* ─── Modal: Configure / Edit Birthstone ─── */}
      {isModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp cursor-default max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]/80 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e] shrink-0">
                  <IoDiamondOutline className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg truncate">
                    Configure {formMonth} Birthstone
                  </h3>
                  <p className="text-xs text-stone-400">
                    Assign gem representation and seasonal imagery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* Row 1: Select Month & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                    CALENDAR MONTH <span className="text-rose-500">*</span>
                  </label>
                  <Dropdown
                    value={formMonth}
                    onChange={handleMonthChangeInForm}
                    options={MONTHS.map((m) => ({
                      value: m.full,
                      label: `${m.full} (${m.defaultStone})`,
                    }))}
                    buttonClassName="h-11 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                    DISPLAY ORDER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full h-11 px-4 text-xs font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/30 focus:border-[#8b6f4e] transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Assigned Gemstone Name & Storefront Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                    ASSIGNED GEMSTONE NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formStoneName}
                    onChange={(e) => setFormStoneName(e.target.value.toUpperCase())}
                    placeholder="e.g. GARNET, SAPPHIRE"
                    className="w-full h-11 px-4 text-xs font-bold tracking-wider uppercase text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/30 focus:border-[#8b6f4e] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                    STOREFRONT VISIBILITY
                  </label>
                  <div className="h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700">
                      {formIsActive ? 'Visible in Collections' : 'Hidden from Store'}
                    </span>
                    <ToggleSwitch
                      checked={formIsActive}
                      onChange={(nextVal) => setFormIsActive(nextVal)}
                      size="sm"
                      ariaLabel={`Set ${formIsActive ? 'Hidden' : 'Visible'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Gem Portrait Upload / Preview */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
                  GEM PORTRAIT IMAGE
                </label>

                <div className="flex items-center gap-4">
                  {/* Portrait Thumbnail */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center p-2 relative overflow-hidden group cursor-pointer hover:border-[#8b6f4e] transition-colors"
                  >
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt={formStoneName}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full shadow-inner"
                        style={{
                          background:
                            GEM_GRADIENTS[formStoneName.toUpperCase()] ||
                            GEM_GRADIENTS.GARNET,
                          boxShadow:
                            '0 4px 10px -2px rgba(0, 0, 0, 0.25), inset -3px -3px 6px rgba(0, 0, 0, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.5)',
                        }}
                      />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold tracking-wider uppercase">
                      Upload
                    </div>
                  </div>

                  {/* Actions / Inputs */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      data-upload-trigger="true"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <HiOutlineUpload className="w-4 h-4" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Custom Image'}</span>
                    </button>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          const prev = formImageUrl;
                          setFormImageUrl('');
                          if (prev) {
                            try {
                              await deleteUploadedFile(prev);
                            } catch {
                              // Best-effort cleanup
                            }
                          }
                        }}
                        className="block text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset to 3D Sphere
                      </button>
                    )}
                  </div>
                </div>
              </div>


              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#8b6f4e] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── Modal: View Birthstone Portrait Preview ─── */}
      {viewingMonth && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setViewingMonth(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-[#faf8f5]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-base">
                  {viewingMonth.month} Portfolio
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingMonth(null)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5">
              {/* Gem Render */}
              <div className="w-36 h-36 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center p-3 relative shadow-inner">
                {viewingMonth.imageUrl ? (
                  <img
                    src={viewingMonth.imageUrl}
                    alt={viewingMonth.stoneName}
                    className="w-28 h-28 object-contain rounded-xl"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full shadow-2xl"
                    style={{
                      background: viewingMonth.gradient,
                      boxShadow:
                        '0 12px 24px -4px rgba(0, 0, 0, 0.2), inset -7px -7px 14px rgba(0, 0, 0, 0.38), inset 3px 3px 7px rgba(255, 255, 255, 0.45)',
                    }}
                  />
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#8b6f4e] uppercase">
                  ASSIGNED GEMSTONE
                </span>
                <h4 className="text-2xl font-bold text-stone-900 mt-1">
                  {viewingMonth.stoneName}
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Traditional Birthstone for {viewingMonth.month}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400">Display Order:</span>
                <span className="font-bold text-stone-800">
                  #{viewingMonth.order}
                </span>
              </div>

              <div className="w-full pt-2 flex items-center justify-between text-xs">
                <span className="text-stone-400">Visibility:</span>
                <span
                  className={`font-bold uppercase tracking-wider ${viewingMonth.isActive ? 'text-emerald-600' : 'text-stone-400'
                    }`}
                >
                  {viewingMonth.status}
                </span>
              </div>

              <div className="w-full flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingMonth;
                    setViewingMonth(null);
                    handleOpenConfigure(target);
                  }}
                  className="flex-1 py-2.5 bg-[#8b6f4e] hover:bg-[#7b5b33] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors"
                >
                  Configure Stone
                </button>
                <button
                  type="button"
                  onClick={() => setViewingMonth(null)}
                  className="px-4 py-2.5 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}
