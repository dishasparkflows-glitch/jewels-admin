import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineArrowLeft } from 'react-icons/hi';
import Modal from '../Modal';
import api from '../../../api/axios';

const money = (val) => {
  if (val == null || val === '') return '₹ 0';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

export default function SyncPreviewModal({
  isOpen,
  onClose,
  group,
  selectedProductIds = [],
  onSuccess,
}) {
  const [sourceId, setSourceId] = useState('');
  const [fields, setFields] = useState(['description']);
  const [scope, setScope] = useState('all'); // 'all' | 'selected'
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const products = group?.products || [];

  useEffect(() => {
    if (!isOpen) {
      setPreviewData(null);
      setFields(['description']);
      return;
    }
    // Default source to group representative or first product
    const defaultSource = group?.representative?._id || products[0]?._id || '';
    setSourceId(defaultSource);
    setScope(selectedProductIds.length > 0 ? 'selected' : 'all');
  }, [isOpen, group, selectedProductIds]);

  const toggleField = (field) => {
    setFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handlePreview = async () => {
    if (!sourceId) {
      toast.error('Please select a source product');
      return;
    }
    if (!fields.length) {
      toast.error('Please select at least one field to sync');
      return;
    }

    try {
      setLoading(true);
      const targets =
        scope === 'selected' && selectedProductIds.length > 0
          ? selectedProductIds.filter((id) => String(id) !== String(sourceId))
          : products
              .filter((p) => String(p._id) !== String(sourceId))
              .map((p) => p._id);

      const res = await api.post(`/product-groups/${group._id}/sync/preview`, {
        sourceProductId: sourceId,
        targetProductIds: targets,
        fields,
      });

      setPreviewData(res.data?.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not generate sync preview';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    try {
      setSyncing(true);
      const targets =
        scope === 'selected' && selectedProductIds.length > 0
          ? selectedProductIds.filter((id) => String(id) !== String(sourceId))
          : products
              .filter((p) => String(p._id) !== String(sourceId))
              .map((p) => p._id);

      const res = await api.post(`/product-groups/${group._id}/sync`, {
        sourceProductId: sourceId,
        targetProductIds: targets,
        fields,
      });

      toast.success(
        res.data?.data?.isFirstSync
          ? 'Group initial sync completed successfully!'
          : 'Group synchronization completed successfully!'
      );
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to sync group';
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const isFirstSync = !group?.sync?.firstSyncedAt;

  const displayVal = (val, field) => {
    if (field === 'salePrice') return money(val);
    if (field === 'images') {
      const count = Array.isArray(val)
        ? val.reduce((acc, ci) => acc + (ci.images?.length || 0), 0)
        : 0;
      return `${count} image(s)`;
    }
    if (Array.isArray(val)) return `[${val.length} items]`;
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return String(val ?? '—');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={previewData ? 'Review Proposed Field Synchronization' : `Sync Products in Group — ${group?.groupName}`}
      subtitle={
        isFirstSync
          ? 'Notice: This will be recorded as the First-Time Synchronization for this group.'
          : `Sync version ${(group?.sync?.syncVersion || 0) + 1}`
      }
      maxWidth="max-w-3xl"
      zIndex="z-[70]"
    >
      {!previewData ? (
        <div className="space-y-4">
          {/* Source Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Source / Master Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
            >
              {products.map((p) => {
                const title = p.basicInfo?.title || p.name || 'Unnamed';
                const tag = p.ornate?.tagNo ? `[${p.ornate.tagNo}] ` : '';
                const price = p.pricing?.salePrice ? ` · ${money(p.pricing.salePrice)}` : '';
                return (
                  <option key={p._id} value={p._id}>
                    {tag}
                    {title}
                    {price}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              Values from this product will be copied to other group members.
            </p>
          </div>

          {/* Fields to sync allowlist */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select Fields to Synchronize <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'description', label: 'Product Description', desc: 'Copy description text' },
                { id: 'title', label: 'Product Title', desc: 'Copy title name' },
                { id: 'salePrice', label: 'Sale Price', desc: 'Synchronize retail pricing' },
                { id: 'images', label: 'Color & Studio Images', desc: 'Copy gallery image assets' },
              ].map((f) => (
                <label
                  key={f.id}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    fields.includes(f.id)
                      ? 'border-[#8b6f4e] bg-[#8b6f4e]/5'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={fields.includes(f.id)}
                    onChange={() => toggleField(f.id)}
                    className="mt-0.5 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-semibold text-stone-800">{f.label}</p>
                    <p className="text-[10px] text-stone-500">{f.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 mt-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
              🔒 <strong>Protected Fields:</strong> SKU, tag number, barcode, metal weight, stock quantity, and sold status are strictly protected and will never be overwritten.
            </p>
          </div>

          {/* Target Scope */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Products Scope</label>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="syncScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="text-[#8b6f4e] focus:ring-[#8b6f4e]"
                />
                <span>All other group members ({products.length - 1} products)</span>
              </label>

              {selectedProductIds.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="syncScope"
                    checked={scope === 'selected'}
                    onChange={() => setScope('selected')}
                    className="text-[#8b6f4e] focus:ring-[#8b6f4e]"
                  />
                  <span>Selected products only ({selectedProductIds.length})</span>
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading || !fields.length || !sourceId}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlineRefresh className="w-3.5 h-3.5" />
              <span>{loading ? 'Analyzing...' : 'Preview Changes'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Proposed Changes Diff Table */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs bg-[#8b6f4e]/10 text-[#8b6f4e] p-3 rounded-xl">
            <span>
              <strong>{previewData.targetCount}</strong> products will be synchronized from{' '}
              <strong>{previewData.sourceProduct?.tag || previewData.sourceProduct?.title}</strong>.
            </span>
            <button
              type="button"
              onClick={() => setPreviewData(null)}
              className="inline-flex items-center gap-1 underline font-semibold text-xs"
            >
              <HiOutlineArrowLeft className="w-3 h-3" />
              Change settings
            </button>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden max-h-72 overflow-x-auto overflow-y-auto text-xs">
            <table className="w-full text-left divide-y divide-stone-100 min-w-[360px]">
              <thead className="bg-stone-50 font-semibold text-stone-600 sticky top-0">
                <tr>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">Field</th>
                  <th className="p-2.5">Current Value</th>
                  <th className="p-2.5">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {previewData.preview?.flatMap((item) =>
                  item.changes.map((ch) => (
                    <tr key={`${item.id}-${ch.field}`} className="hover:bg-stone-50/50">
                      <td className="p-2.5 font-medium text-stone-800">
                        {item.tag !== '—' ? `[${item.tag}] ` : ''}
                        {item.title}
                      </td>
                      <td className="p-2.5 font-semibold text-[#8b6f4e]">{ch.label}</td>
                      <td className="p-2.5 text-stone-500 max-w-[160px] truncate">
                        {displayVal(ch.before, ch.field)}
                      </td>
                      <td className="p-2.5 font-medium text-emerald-700 max-w-[160px] truncate">
                        {displayVal(ch.after, ch.field)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Confirmation Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setPreviewData(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Back to Options
            </button>
            <button
              type="button"
              onClick={handleConfirmSync}
              disabled={syncing}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
              <span>{syncing ? 'Applying Changes...' : 'Confirm and Execute Sync'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
