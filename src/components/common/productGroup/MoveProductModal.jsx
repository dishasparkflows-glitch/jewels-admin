import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineSwitchHorizontal,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineCollection,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import Modal from '../Modal';
import Dropdown from '../Dropdown';
import api from '../../../api/axios';

const getProductImage = (p) => {
  if (!p) return null;
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

const money = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function MoveProductModal({
  isOpen,
  onClose,
  sourceGroup,
  productIds = [],
  products = [],
  onSuccess,
}) {
  const [mode, setMode] = useState('existing'); // 'existing' | 'create'
  const [targetGroupId, setTargetGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  // Normalize target products list
  const targetProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return [];
  }, [products]);

  // Compute auto-generated group name: itemname + barcode
  useEffect(() => {
    if (!isOpen) return;

    if (targetProducts.length > 0) {
      const p = targetProducts[0];
      const itemName = (
        p.basicInfo?.title ||
        p.title ||
        p.ornate?.customGroupName ||
        p.ornate?.itemCode ||
        'Product'
      ).trim();
      const barcode = (
        p.ornate?.barcode ||
        p.barcode ||
        p.ornate?.tagNo ||
        p.basicInfo?.sku ||
        ''
      ).trim();

      const autoName = itemName && barcode ? `${itemName} - ${barcode}` : (itemName || barcode || 'New Common Group');
      setNewGroupName(autoName);
    } else {
      setNewGroupName(`${sourceGroup?.groupName || 'New Group'} - Copy`);
    }
  }, [isOpen, targetProducts, sourceGroup]);

  // Fetch active groups for the common Dropdown
  useEffect(() => {
    if (!isOpen) {
      setTargetGroupId('');
      setMode('existing');
      return;
    }

    const fetchOtherGroups = async () => {
      try {
        setLoading(true);
        // Using summary endpoint for speed and consistency
        const res = await api.get('/product-groups/summary?status=active&limit=200');
        const items = res.data?.data?.items || res.data?.data || [];
        const others = items.filter((g) => String(g._id) !== String(sourceGroup?._id));
        setGroups(others);
        if (others.length > 0) {
          setTargetGroupId(others[0]._id);
        }
      } catch (err) {
        console.error('Failed to load target groups:', err);
        // Fallback to standard endpoint
        try {
          const resFallback = await api.get('/product-groups?status=active&limit=100');
          const items = resFallback.data?.data?.items || resFallback.data?.data || [];
          const others = items.filter((g) => String(g._id) !== String(sourceGroup?._id));
          setGroups(others);
          if (others.length > 0) {
            setTargetGroupId(others[0]._id);
          }
        } catch (fallbackErr) {
          toast.error('Could not load target groups');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOtherGroups();
  }, [isOpen, sourceGroup]);

  // Build dropdown options using our common luxury Dropdown format
  const dropdownOptions = useMemo(() => {
    const list = groups.map((g) => ({
      value: g._id,
      label: g.groupName,
      sublabel: `${g.groupCode || ''} · ${g.productCount || 0} product${g.productCount === 1 ? '' : 's'}`,
    }));

    list.push({
      value: '__create_new__',
      label: '+ Create Another Group...',
      sublabel: 'Set up a new common group with auto-generated name',
    });

    return list;
  }, [groups]);

  const handleDropdownChange = (val) => {
    if (val === '__create_new__') {
      setMode('create');
    } else {
      setTargetGroupId(val);
    }
  };

  const handleMove = async () => {
    if (mode === 'create') {
      if (!newGroupName.trim()) {
        toast.error('Please enter a group name');
        return;
      }
    } else {
      if (!targetGroupId) {
        toast.error('Please select a target group');
        return;
      }
    }

    try {
      setMoving(true);
      const payload = {
        productIds,
        ...(mode === 'create'
          ? { newGroupName: newGroupName.trim() }
          : { targetGroupId }),
      };

      const res = await api.post(`/product-groups/${sourceGroup._id}/move-products`, payload);
      toast.success(
        res.data?.message ||
          (mode === 'create'
            ? 'Group created and products moved successfully'
            : 'Products moved successfully')
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to move products:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to move products';
      toast.error(msg);
    } finally {
      setMoving(false);
    }
  };

  const firstProduct = targetProducts[0];
  const firstProductImg = getProductImage(firstProduct);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Another Group' : 'Move to Another Group'}
      subtitle={`Transfer ${productIds.length} product${productIds.length === 1 ? '' : 's'} from "${sourceGroup?.groupName || 'Current Group'}"`}
      maxWidth="max-w-lg"
      zIndex="z-[75]"
    >
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'existing'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
            <span>Move to Existing Group</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-[#8b6f4e] shadow-2xs border border-[#8b6f4e]/30'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>Create Another Group</span>
          </button>
        </div>

        {/* Selected Product Preview Card */}
        {targetProducts.length > 0 && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
              {firstProductImg ? (
                <img src={firstProductImg} alt="" className="w-full h-full object-contain" />
              ) : (
                <IoDiamondOutline className="w-5 h-5 text-stone-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {firstProduct?.basicInfo?.title || 'Ornate Product'}
                </p>
                {targetProducts.length > 1 && (
                  <span className="text-[10px] font-semibold text-[#8b6f4e] bg-[#8b6f4e]/10 px-2 py-0.5 rounded-full shrink-0">
                    +{targetProducts.length - 1} more
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-stone-500 font-mono mt-0.5">
                {firstProduct?.ornate?.tagNo && (
                  <span>Tag: <strong className="text-stone-700">{firstProduct.ornate.tagNo}</strong></span>
                )}
                {(firstProduct?.ornate?.barcode || firstProduct?.barcode) && (
                  <span>Barcode: <strong className="text-[#8b6f4e]">{firstProduct.ornate?.barcode || firstProduct.barcode}</strong></span>
                )}
                {firstProduct?.specifications?.metalWeight && (
                  <span>{firstProduct.specifications.metalWeight}g</span>
                )}
                <span className="text-stone-800 font-semibold font-sans">
                  {money(firstProduct?.pricing?.salePrice || firstProduct?.pricing?.mrp)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Body depending on mode */}
        {mode === 'existing' ? (
          <div>
            <Dropdown
              value={targetGroupId}
              onChange={handleDropdownChange}
              options={dropdownOptions}
              label="Target Common Group"
              required
              disabled={loading || groups.length === 0}
              placeholder={loading ? 'Loading active groups...' : 'Select a common group'}
              portal={true}
              size="md"
              className="w-full"
            />
            {groups.length === 0 && !loading && (
              <p className="text-xs text-stone-400 mt-1.5">
                No other active groups found. You can switch to "Create Another Group" to start a new one.
              </p>
            )}
            <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100 mt-3">
              Note: Moving products changes their group membership immediately without altering their SKUs, tags, or ERP stock.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  New Group Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-[#8b6f4e] bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <HiOutlineSparkles className="w-3 h-3" />
                  itemname + barcode
                </span>
              </div>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. 92.5 CHAIN - 1000000855647"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e] transition-all"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                A unique sequential group code (e.g. CG-000007) will be assigned automatically.
              </p>
            </div>

            <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              Note: Creating another group will immediately establish a new common group and transfer the selected product(s) into it.
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={
              moving ||
              (mode === 'existing' && (!targetGroupId || groups.length === 0)) ||
              (mode === 'create' && !newGroupName.trim())
            }
            className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {mode === 'create' ? (
              <>
                <HiOutlinePlus className="w-3.5 h-3.5" />
                <span>{moving ? 'Creating & Moving...' : 'Create Group & Move'}</span>
              </>
            ) : (
              <>
                <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                <span>{moving ? 'Moving...' : 'Move Products'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
