import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineArrowLeft } from 'react-icons/hi';
import Modal from '../Modal';
import Dropdown from '../Dropdown';
import api from '../../../api/axios';

const money = (val) => {
  if (val == null || val === '') return '₹ 0';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

const SYNC_FIELDS = [
  { id: 'gender', label: 'Gender', desc: 'Target audience / gender classification' },
  { id: 'description', label: 'Description', desc: 'Product marketing description' },
  { id: 'seo', label: 'SEO', desc: 'Meta title, description, & keywords' },
  { id: 'categoryIds', label: 'Category IDs', desc: 'Catalog navigation category links' },
  { id: 'colorImages', label: 'Color & Studio Images', desc: 'Complete gallery & VTO assets' },
  { id: 'visibility', label: 'Visibility', desc: 'Web and mobile app visibility' },
  { id: 'productSpecifications', label: 'Product Specifications', desc: 'Custom specification attributes' },
  { id: 'descriptionSections', label: 'Description Sections', desc: 'Feature & detail highlight sections' },
];

const ALL_SYNC_FIELD_IDS = SYNC_FIELDS.map((f) => f.id);

export default function SyncPreviewModal({
  isOpen,
  onClose,
  group,
  selectedProductIds = [],
  onSuccess,
}) {
  const [sourceId, setSourceId] = useState('');
  const [fields] = useState(ALL_SYNC_FIELD_IDS);
  const [scope, setScope] = useState('all'); // 'all' | 'selected'
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const products = group?.products || group?.productIds || [];

  const productOptions = useMemo(() => {
    return products.map((p) => {
      const productName = (p.basicInfo?.title || p.title || p.name || 'Unnamed Product').trim();
      const barcode = (
        p.ornate?.barcode ||
        p.barcode ||
        p.barcodeNo ||
        p.basicInfo?.barcode ||
        p.ornate?.tagNo ||
        p.basicInfo?.sku ||
        ''
      ).trim();

      const label = barcode ? `${productName} - ${barcode}` : productName;

      const tag = p.ornate?.tagNo ? `Tag: ${p.ornate.tagNo}` : '';
      const price = p.pricing?.salePrice ? money(p.pricing.salePrice) : '';
      const sublabelParts = [tag, price].filter(Boolean);
      const sublabel = sublabelParts.length > 0 ? sublabelParts.join(' · ') : undefined;

      return {
        value: String(p._id),
        label,
        sublabel,
        raw: p,
      };
    });
  }, [products]);

  useEffect(() => {
    if (!isOpen) {
      setPreviewData(null);
      return;
    }
    // Default source to group representative or first product
    const defaultSource = group?.representative?._id || products[0]?._id || '';
    setSourceId(defaultSource);
    setScope(selectedProductIds.length > 0 ? 'selected' : 'all');
  }, [isOpen, group, selectedProductIds]);

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

      toast.success('Group synchronization completed successfully!');
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to sync group';
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const displayVal = (val, field) => {
    if (val == null || val === '') return '—';
    if (field === 'salePrice') return money(val);
    if (field === 'colorImages' || field === 'images') {
      const count = Array.isArray(val)
        ? val.reduce((acc, ci) => acc + (ci.images?.length || 0), 0)
        : 0;
      return `${count} image(s)`;
    }
    if (field === 'gender') {
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
    if (field === 'categoryIds') {
      return Array.isArray(val) ? `${val.length} category ID(s)` : String(val);
    }
    if (field === 'visibility') {
      return `Web: ${val?.web ? 'Yes' : 'No'} | App: ${val?.app ? 'Yes' : 'No'}`;
    }
    if (field === 'productSpecifications' || field === 'descriptionSections') {
      return Array.isArray(val) ? `${val.length} section(s)` : String(val);
    }
    if (field === 'seo') {
      return val?.metaTitle || val?.metaDescription ? `${val.metaTitle || 'Configured'}` : 'Configured';
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
        previewData
          ? 'Review proposed field changes across target products before executing.'
          : 'Synchronize selected field values across products in this group.'
      }
      maxWidth="max-w-3xl"
      zIndex="z-[1050]"
    >
      {!previewData ? (
        <div className="space-y-4">
          {/* Source Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Source / Master Product <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              value={sourceId}
              onChange={(val) => setSourceId(val)}
              options={productOptions}
              placeholder="Select source / master product"
              portal={true}
              size="field"
              className="w-full"
            />
            <p className="text-[11px] text-stone-400 mt-1.5">
              Values from this product will be copied to other group members.
            </p>
          </div>

          {/* Synchronized Fields (Non-selectable, Fixed List) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Fields to Synchronize
            </label>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#8b6f4e]/10 text-[#8b6f4e]">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                </span>
                <p className="text-xs font-bold text-stone-800">
                  The following fields are automatically copied from the master product:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SYNC_FIELDS.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white border border-stone-200/90 shadow-2xs"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-800 truncate">{f.label}</p>
                      <p className="text-[10px] font-mono text-stone-400 truncate">{f.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
