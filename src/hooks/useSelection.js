import { useState, useCallback } from 'react';

const defaultGetId = (item) => item?._id || item?.id;

/**
 * Reusable row multi-selection state hook for admin tables & grids.
 *
 * @param {Function} [getId] - Extracts unique id from an item (defaults to item._id || item.id)
 */
export default function useSelection(getId = defaultGetId) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (items = [], customGetId = getId) => {
      const ids = items.map(customGetId).filter(Boolean);
      setSelectedIds((prev) => {
        const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
        if (allSelected) {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        }
        return new Set([...prev, ...ids]);
      });
    },
    [getId]
  );

  const isAllSelected = useCallback(
    (items = [], customGetId = getId) =>
      items.length > 0 && items.every((item) => selectedIds.has(customGetId(item))),
    [selectedIds, getId]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const removeFromSelection = useCallback((idsToRemove) => {
    const list = Array.isArray(idsToRemove) ? idsToRemove : [idsToRemove];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      list.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    selectedCount: selectedIds.size,
    toggleSelect,
    toggleSelectAll,
    isAllSelected,
    clearSelection,
    removeFromSelection,
  };
}
