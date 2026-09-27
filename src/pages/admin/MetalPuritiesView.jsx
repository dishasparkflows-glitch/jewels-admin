import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function MetalPuritiesView() {
  const [purities, setPurities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    if (!window.confirm(`Are you sure you want to delete metal purity "${name}"?`)) return;
    try {
      await api.delete(`/metal-purities/${id}`);
      toast.success(`Metal purity "${name}" deleted`);
      setPurities((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Top Header (Matches Screenshot 1 - Zero Sync Button) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Metal Purity
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage gold purities (14K, 18K, etc.) and their density factors.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD PURITY</span>
        </button>
      </div>

      {/* ─── Metal Purity Table Card ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 space-y-4">
        {/* Table Search (Full width inside card matching Screenshot 1) */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <HiOutlineSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search purity..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/20 focus:border-[#8f6d43] transition-all"
          />
        </div>

        {/* Table (Columns match Screenshot 1: NAME, KARAT, STATUS, ACTIONS) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6 whitespace-nowrap">NAME</th>
                <th className="py-4 px-6 whitespace-nowrap">KARAT</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">STATUS</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400">
                    Loading purities...
                  </td>
                </tr>
              ) : filteredPurities.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400">
                    No metal purities found.
                  </td>
                </tr>
              ) : (
                filteredPurities.map((p) => {
                  const isActive = p.status === 'active';
                  const karatDisplay = p.karat ? `${p.karat}K` : p.name;

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-5 px-6 whitespace-nowrap font-bold text-stone-900 text-xs tracking-wide">
                        {p.name}
                      </td>

                      {/* Karat */}
                      <td className="py-5 px-6 whitespace-nowrap font-bold text-stone-900 text-xs tracking-wide">
                        {karatDisplay}
                      </td>

                      {/* Status Toggle Switch (Matches Screenshot 1) */}
                      <td className="py-5 px-6 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`w-11 h-6 rounded-full transition-colors relative inline-block cursor-pointer focus:outline-none ${
                            isActive ? 'bg-[#8f6d43]' : 'bg-stone-300'
                          }`}
                          title={`Status: ${isActive ? 'Active' : 'Inactive'}`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 absolute top-0.5 left-0.5 ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingPurity(p)}
                            title="View Purity Details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Purity"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            title="Delete Purity"
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

            <div className="pt-2">
              <button
                onClick={() => setViewingPurity(null)}
                className="w-full h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
