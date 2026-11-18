import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Dropdown from '../common/Dropdown';
import { galleryAPI } from '../../api/services';

export default function GalleryEditModal({
  item,
  onClose,
  modalThemeOptions = [],
  placementTypeOptions = [],
  onSuccess,
}) {
  const [editThemeId, setEditThemeId] = useState('');
  const [editPlacement, setEditPlacement] = useState('herobanner');
  const [editPlatform, setEditPlatform] = useState('web');
  const [editStatus, setEditStatus] = useState('active');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (item) {
      setEditThemeId(item.themeId || '');
      setEditPlacement(item.placement || 'herobanner');
      setEditPlatform(item.platform || 'web');
      setEditStatus(item.status || 'active');
    }
  }, [item]);

  if (!item) return null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!item) return;

    try {
      setIsUpdating(true);
      await galleryAPI.update(item.id, {
        themeId: editThemeId || null,
        placement: editPlacement,
        platform: editPlatform,
        status: editStatus,
      });

      toast.success('Media updated successfully');
      onClose();
      await onSuccess?.();
    } catch (err) {
      console.error('Failed to update media item:', err);
      toast.error(err.response?.data?.message || 'Failed to update media item');
    } finally {
      setIsUpdating(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={() => {
        if (!isUpdating) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[88vh] my-auto flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8b6c3a]/15 text-[#8b6c3a]">
              <HiOutlinePencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Edit Media Item</h3>
              <p className="text-xs text-stone-500">Update placement, theme assignment, and platform.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isUpdating) onClose();
            }}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Media Preview Banner */}
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
            <img
              src={item.url}
              alt={item.name}
              className="h-14 w-20 rounded-xl object-cover border border-stone-200 bg-white shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Image Asset</span>
              <p className="text-xs font-bold text-stone-900 truncate">{item.typeLabel || item.placement}</p>
              <span className="text-[10px] text-stone-500 truncate block">{item.url}</span>
            </div>
          </div>

          {/* Theme Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">Assigned Website Theme</label>
            <Dropdown
              size="field"
              showStatusDot={true}
              value={editThemeId}
              onChange={(val) => setEditThemeId(val || '')}
              options={modalThemeOptions}
              placeholder="Select theme…"
              portal={true}
              menuClassName="z-[10000]"
            />
          </div>

          {/* Placement Type Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">Image Placement Type</label>
            <Dropdown
              size="field"
              value={editPlacement}
              onChange={(val) => setEditPlacement(val || 'herobanner')}
              options={placementTypeOptions}
              placeholder="Select placement type…"
              portal={true}
              menuClassName="z-[10000]"
            />
          </div>

          {/* Target Platform Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">Target Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'web', label: 'Web', icon: HiOutlineDesktopComputer },
                { id: 'app', label: 'App', icon: HiOutlineDeviceMobile },
                { id: 'common', label: 'Common', icon: IoSparklesOutline },
              ].map((plat) => {
                const isSelected = editPlatform === plat.id;
                const Icon = plat.icon;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setEditPlatform(plat.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'border-[#8b6c3a] bg-[#8b6c3a]/10 text-[#8b6c3a] shadow-xs'
                        : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{plat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800">Media Status</label>
              <span className="text-[11px] text-stone-500">Enable or disable this media item</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={editStatus === 'active'}
                onClick={() => setEditStatus((prev) => (prev === 'active' ? 'inactive' : 'active'))}
                style={editStatus === 'active' ? { backgroundColor: 'var(--theme-primary, #855836)' } : undefined}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  editStatus === 'active' ? 'bg-[var(--theme-primary,#855836)]' : 'bg-stone-300'
                }`}
                title={`Click to set ${editStatus === 'active' ? 'Inactive' : 'Active'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    editStatus === 'active' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  editStatus === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 text-stone-500 border border-stone-200'
                }`}
              >
                {editStatus === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              style={{ backgroundColor: 'var(--theme-primary, #8b6c3a)' }}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:brightness-95 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
