import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import Modal from '../Modal';
import api from '../../../api/axios';

const money = (val) => {
  if (val == null || val === '') return '₹ 0';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

const getProductImage = (p) => {
  if (p.images && p.images[0]) {
    const img = p.images[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.ornate?.ornateImages && p.ornate.ornateImages[0]) {
    const img = p.ornate.ornateImages[0];
    return typeof img === 'string' ? img : img.url;
  }
  if (p.colorImages && p.colorImages[0]?.images?.[0]) {
    const img = p.colorImages[0].images[0];
    return typeof img === 'string' ? img : img.url;
  }
  return null;
};

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
  initialSelectedIds = [],
}) {
  const [groupName, setGroupName] = useState('');
  const [slug, setSlug] = useState('');
  const [search, setSearch] = useState('');
  const [ungroupedProducts, setUngroupedProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch ungrouped products on modal open
  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setSlug('');
      setSearch('');
      setSelectedIds(new Set());
      return;
    }

    if (initialSelectedIds && initialSelectedIds.length > 0) {
      setSelectedIds(new Set(initialSelectedIds));
    }

    const fetchUngrouped = async () => {
      try {
        setLoadingProducts(true);
        const res = await api.get('/product-groups/ungrouped-products?limit=100');
        const items = res.data?.data || [];
        setUngroupedProducts(Array.isArray(items) ? items : items.items || []);
      } catch (err) {
        console.error('Failed to load ungrouped products:', err);
        toast.error('Could not load ungrouped products');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchUngrouped();
  }, [isOpen, initialSelectedIds]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredProducts = ungroupedProducts.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const title = p.basicInfo?.title || p.name || '';
    const sku = p.basicInfo?.sku || '';
    const tag = p.ornate?.tagNo || '';
    const barcode = p.ornate?.barcode || '';
    return (
      title.toLowerCase().includes(term) ||
      sku.toLowerCase().includes(term) ||
      tag.toLowerCase().includes(term) ||
      barcode.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        groupName: groupName.trim(),
        productIds: Array.from(selectedIds),
      };
      if (slug.trim()) payload.slug = slug.trim();

      const res = await api.post('/product-groups', payload);
      toast.success('Common group created successfully');
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create group';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Common Product Group"
      subtitle="Group similar Ornate products into a single catalogue card with variant options"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Name & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. 92.5 PENDENT"
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:bg-white bg-stone-50/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Custom Slug <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Auto-generated if empty"
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:bg-white bg-stone-50/50"
            />
          </div>
        </div>

        {/* Product Selection Section */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-stone-800">Assign Member Products</h4>
              <p className="text-[11px] text-stone-500">
                Select eligible Ornate products to include in this group
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-[#8b6f4e]/10 text-[#8b6f4e] rounded-md">
              {selectedIds.size} selected
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ungrouped products by title, SKU, tag, barcode..."
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-stone-200 rounded-lg bg-stone-50/60 focus:outline-none focus:border-[#8b6f4e]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product List */}
          <div className="border border-stone-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-stone-100 bg-stone-50/30">
            {loadingProducts ? (
              <div className="p-6 text-center text-xs text-stone-400">Loading ungrouped products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                {ungroupedProducts.length === 0
                  ? 'No ungrouped products found. All products are already assigned.'
                  : 'No products match your search.'}
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedIds.has(p._id);
                const img = getProductImage(p);
                const price = p.pricing?.salePrice || p.pricing?.mrp || 0;
                return (
                  <label
                    key={p._id}
                    className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-stone-50 transition-colors ${
                      isSelected ? 'bg-[#8b6f4e]/5' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(p._id)}
                      className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-4 h-4 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <IoDiamondOutline className="w-4 h-4 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 truncate">
                        {p.basicInfo?.title || p.name || 'Ornate Product'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                        <span>Tag: {p.ornate?.tagNo || '—'}</span>
                        <span>•</span>
                        <span>Barcode: {p.ornate?.barcode || p.barcode || '—'}</span>
                        <span>•</span>
                        <span>SKU: {p.basicInfo?.sku || '—'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-stone-800 shrink-0">
                      {money(price)}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !groupName.trim()}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Creating Group...' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
