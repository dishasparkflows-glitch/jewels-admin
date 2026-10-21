import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import api from '../../../api/axios';

export default function MoveProductModal({
  isOpen,
  onClose,
  sourceGroup,
  productIds = [],
  onSuccess,
}) {
  const [targetGroupId, setTargetGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTargetGroupId('');
      return;
    }

    const fetchOtherGroups = async () => {
      try {
        setLoading(true);
        const res = await api.get('/product-groups?status=active&limit=100');
        const items = res.data?.data?.items || res.data?.data || [];
        const others = items.filter((g) => String(g._id) !== String(sourceGroup?._id));
        setGroups(others);
        if (others[0]) setTargetGroupId(others[0]._id);
      } catch (err) {
        console.error('Failed to load target groups:', err);
        toast.error('Could not load target groups');
      } finally {
        setLoading(false);
      }
    };

    fetchOtherGroups();
  }, [isOpen, sourceGroup]);

  const handleMove = async () => {
    if (!targetGroupId) {
      toast.error('Please select a target group');
      return;
    }

    try {
      setMoving(true);
      const res = await api.post(`/product-groups/${sourceGroup._id}/move-products`, {
        targetGroupId,
        productIds,
      });
      toast.success(res.data?.message || 'Products moved successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to move products';
      toast.error(msg);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move Products to Another Group"
      subtitle={`Move ${productIds.length} product(s) from "${sourceGroup?.groupName}"`}
      maxWidth="max-w-md"
      zIndex="z-[70]"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Target Common Group <span className="text-rose-500">*</span>
          </label>
          {loading ? (
            <p className="text-xs text-stone-400">Loading active groups...</p>
          ) : groups.length === 0 ? (
            <p className="text-xs text-stone-400">No other active groups found.</p>
          ) : (
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-[#8b6f4e]"
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.groupName} ({g.groupCode}) · {g.productCount || 0} items
                </option>
              ))}
            </select>
          )}
        </div>

        <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
          Note: Moving products changes their group membership immediately without deleting the products or altering their SKUs, tags, or ERP stock.
        </p>

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
            onClick={handleMove}
            disabled={moving || !targetGroupId || groups.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {moving ? 'Moving...' : 'Move Products'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
