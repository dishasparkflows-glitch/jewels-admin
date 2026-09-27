import React, { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function CodSequencesView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    uptoAmount: '',
    chargeType: 'Percentage',
    chargeValue: '15',
  });
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cod-sequences?limit=50');
      const data = res.data?.data?.items || res.data?.data || [];
      setItems(data);
    } catch (err) {
      console.error('Error fetching COD sequences:', err);
      toast.error('Failed to load COD sequences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
        setEditingItem(null);
      } else {
        await api.post('/cod-sequences', payload);
        toast.success('COD sequence tier added successfully');
      }

      setFormData({ uptoAmount: '', chargeType: 'Percentage', chargeValue: '15' });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      uptoAmount: item.uptoAmount,
      chargeType: item.chargeType || 'Percentage',
      chargeValue: item.chargeValue,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this COD sequence tier?')) return;
    try {
      await api.delete(`/cod-sequences/${id}`);
      toast.success('COD sequence deleted successfully');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header (Matches Screenshot 1) ─── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
          COD Sequences
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Configure Cash on Delivery advance payment tiers, Customers pay this advance online to confirm their COD order, and pay the remaining balance on delivery.
        </p>
      </div>

      {/* ─── Form Card (Matches Screenshot 1) ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
              UPTO AMOUNT (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 36000"
              value={formData.uptoAmount}
              onChange={(e) => setFormData({ ...formData, uptoAmount: e.target.value })}
              className="w-full h-11 px-4 text-sm bg-stone-50/60 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
              ADVANCE TYPE
            </label>
            <div className="relative">
              <select
                value={formData.chargeType}
                onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                className="w-full h-11 px-4 text-sm bg-stone-50/60 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all appearance-none cursor-pointer text-stone-800"
              >
                <option value="Fixed">Fixed (₹)</option>
                <option value="Percentage">Percentage (%)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-2">
              ADVANCE VALUE
            </label>
            <input
              type="number"
              step="0.01"
              placeholder={formData.chargeType === 'Percentage' ? 'e.g. 15 (%)' : 'e.g. 500 (₹ advance)'}
              value={formData.chargeValue}
              onChange={(e) => setFormData({ ...formData, chargeValue: e.target.value })}
              className="w-full h-11 px-4 text-sm bg-stone-50/60 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 bg-[#8f6d43] hover:bg-[#7b5b33] text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Tier' : 'Add'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({ uptoAmount: '', chargeType: 'Percentage', chargeValue: '15' });
                }}
                className="h-11 px-4 border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ─── Data Table (Matches Screenshot 1) ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">UPTO AMOUNT</th>
                <th className="py-4 px-6">ADVANCE TYPE</th>
                <th className="py-4 px-6">ADVANCE REQUIRED</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading COD sequence tiers...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400">
                    No COD sequence tiers configured yet.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row._id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-stone-800">
                      ₹ {Number(row.uptoAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-stone-600">
                      {row.chargeType === 'Percentage' ? 'Percentage' : 'Fixed'}
                    </td>
                    <td className="py-4 px-6 text-stone-700 font-medium">
                      {row.chargeType === 'Percentage'
                        ? `${Number(row.chargeValue).toFixed(2)} %`
                        : `₹ ${Number(row.chargeValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          title="Edit Tier"
                          className="p-1.5 text-sky-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row._id)}
                          title="Delete Tier"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
