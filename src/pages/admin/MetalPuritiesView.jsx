import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineCube,
  HiOutlineSparkles,
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

export default function MetalPuritiesView() {
  const confirm = useConfirm();
  const [purities, setPurities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurity, setEditingPurity] = useState(null);
  const [viewingPurity, setViewingPurity] = useState(null);
  const [metalType, setMetalType] = useState('Gold');
  const [karatValue, setKaratValue] = useState('');
  const [purityName, setPurityName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all Metal Purities from API
  const fetchPurities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/metal-purities?limit=100');
      const items =
        res.data?.data?.items ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setPurities(items);
    } catch (err) {
      console.error('Failed to load metal purities:', err);
      toast.error('Failed to load metal purities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurities();
  }, []);

  // Search filtering
  const filteredPurities = useMemo(() => {
    if (!search.trim()) return purities;
    const q = search.toLowerCase();
    return purities.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.karat !== undefined && String(p.karat).includes(q)) ||
        (p.metalType && p.metalType.toLowerCase().includes(q))
    );
  }, [purities, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredPurities, 10);

  // Quick stat cards
  const activeCount = useMemo(() => purities.filter(p => p.status === 'active').length, [purities]);
  const primaryStandard = useMemo(() => {
    const p18 = purities.find(p => String(p.karat) === '18' || p.name?.includes('18'));
    return p18 ? '18 KT Gold' : (purities[0]?.name || 'Standard');
  }, [purities]);

  const statCardsData = [
    {
      label: 'Metal Purities',
      value: purities.length,
      icon: HiOutlineCube,
      color: 'bronze',
    },
    {
      label: 'Active Standards',
      value: activeCount,
      icon: HiOutlineSparkles,
      color: 'green',
    },
    {
      label: 'Flagship Grade',
      value: primaryStandard,
      icon: HiOutlineSparkles,
      color: 'peach',
    },
    {
      label: 'Supported Metals',
      value: new Set(purities.map(p => p.metalType || 'Gold')).size || 1,
      icon: HiOutlineCube,
      color: 'gold',
    },
  ];

  // Open modal to add new purity
  const handleOpenAdd = () => {
    setEditingPurity(null);
    setMetalType('Gold');
    setKaratValue('');
    setPurityName('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing purity
  const handleOpenEdit = (p) => {
    setEditingPurity(p);
    setMetalType(p.metalType || 'Gold');
    setKaratValue(p.karat !== undefined ? String(p.karat) : '');
    setPurityName(p.name || '');
    setIsModalOpen(true);
  };

  // Auto-fill purity name when karat value changes if user hasn't explicitly set another name
  const handleKaratChange = (val) => {
    setKaratValue(val);
    if (!editingPurity && (!purityName || purityName.endsWith('KT') || purityName.endsWith('K'))) {
      if (val) {
        setPurityName(`${val}KT`);
      }
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (purityItem) => {
    try {
      const nextStatus = purityItem.status === 'active' ? 'inactive' : 'active';
      await api.put(`/metal-purities/${purityItem._id}`, { status: nextStatus });
      toast.success(`${purityItem.name} status set to ${nextStatus}`);
      setPurities((prev) =>
        prev.map((item) =>
          item._id === purityItem._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Metal Purity
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Metal Purity',
      message: `Are you sure you want to delete metal purity "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Purity',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/metal-purities/${id}`);
      toast.success(`Metal purity "${name}" deleted`);
      setPurities((prev) => prev.filter((item) => item._id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) {
      toast.error('Please select metal purities to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Metal Purities',
      message: `Are you sure you want to delete ${count} selected purity${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await Promise.allSettled(
        selectedIds.map((id) => api.delete(`/metal-purities/${id}`))
      );
      setPurities((prev) => prev.filter((p) => !selectedIds.includes(p._id)));
      setSelectedIds([]);
      toast.success(`${count} purity${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete some metal purities');
    }
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purityName.trim()) {
      toast.error('Please enter a purity name');
      return;
    }

    try {
      setSubmitting(true);
      const karatNum = karatValue ? Number(karatValue) : 0;
      const payload = {
        name: purityName.trim(),
        metalType,
        karat: karatNum,
        status: 'active',
      };

      if (editingPurity?._id) {
        await api.put(`/metal-purities/${editingPurity._id}`, payload);
        toast.success(`Purity "${payload.name}" updated successfully`);
      } else {
        await api.post('/metal-purities', payload);
        toast.success(`Purity "${payload.name}" created successfully`);
      }

      setIsModalOpen(false);
      fetchPurities();
    } catch (err) {
      console.error('Error saving metal purity:', err);
      toast.error(err.response?.data?.message || 'Failed to save metal purity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Product Config', 'Metal Purity']}
        title="Metal Purity"
        subtitle="Manage gold purities (14K, 18K, 22K), density factors and alloy specifications."
        onAdd={handleOpenAdd}
        addLabel="Add Purity"
        exportData={purities}
        exportFileName="metal_purities_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search metal purities..."
        extraActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={
              selectedIds.length > 0
                ? `Delete ${selectedIds.length} selected purity${selectedIds.length > 1 ? 's' : ''}`
                : 'Select metal purities to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
          </button>
        }
      />

      {/* ─── Metal Purity Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((p) => selectedIds.includes(p._id))
                    }
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">NAME</th>
                <th className="py-2 px-3 whitespace-nowrap">KARAT</th>
                <th className="py-2 px-3 whitespace-nowrap">METAL TYPE</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    Loading purities...
                  </td>
                </tr>
              ) : filteredPurities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    No metal purities found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((p, idx) => {
                  const karatDisplay = p.karat ? `${p.karat}K` : p.name;

                  return (
                    <tr
                      key={p._id}
                      onClick={() => setViewingPurity(p)}
                      className="hover:bg-[#faf7f2] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p._id)}
                          onChange={() => handleSelectItem(p._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-900 text-xs tracking-wide">
                        {p.name}
                      </td>

                      {/* Karat */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-800 text-xs tracking-wide">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#faf5ee] text-[#8f6d43] border border-[#e8d9c2]">
                          {karatDisplay}
                        </span>
                      </td>

                      {/* Metal Type */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-600 font-medium text-xs">
                        {p.metalType || 'Gold'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setViewingPurity(p)}
                          onEdit={() => handleOpenEdit(p)}
                          onDelete={() => handleDelete(p._id, p.name)}
                          viewTitle="View Details"
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

      {/* ─── Add / Edit Modal (Matches Screenshot 2 Exactly) ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-stone-200/90 space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-lg tracking-tight">
                  {editingPurity ? 'Edit Purity' : 'Add Purity'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Modal Form (Matches Screenshot 2) */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Metal Type Display Box */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  METAL TYPE
                </label>
                <div className="w-full h-11 px-4 rounded-xl border border-[#8f6d43]/60 bg-white flex items-center justify-center text-xs font-bold tracking-widest text-[#8f6d43] uppercase select-none">
                  GOLD
                </div>
              </div>

              {/* Karat Value */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  KARAT VALUE
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={karatValue}
                  onChange={(e) => handleKaratChange(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Purity Name */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  PURITY NAME
                </label>
                <input
                  type="text"
                  required
                  value={purityName}
                  onChange={(e) => setPurityName(e.target.value)}
                  placeholder="e.g. 18KT"
                  className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Modal Footer Actions (Matches Screenshot 2) */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 h-11 bg-[#f7f7f9] hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 h-11 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Purity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Purity Details Modal ─── */}
      {viewingPurity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setViewingPurity(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Metal Purity Info</h3>
              <button
                onClick={() => setViewingPurity(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Purity Name:</span>
                <span className="font-bold text-stone-800">{viewingPurity.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Metal Category:</span>
                <span className="font-bold text-stone-800">{viewingPurity.metalType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Karat:</span>
                <span className="font-bold text-[#8f6d43]">{viewingPurity.karat}K</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">Status:</span>
                <span className="font-semibold text-stone-800 uppercase">{viewingPurity.status}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const current = viewingPurity;
                  setViewingPurity(null);
                  handleOpenEdit(current);
                }}
                className="flex-1 h-10 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Edit Purity
              </button>
              <button
                onClick={() => setViewingPurity(null)}
                className="px-4 h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
