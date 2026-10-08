import React, { useEffect } from 'react';
import {
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi';

/**
 * Common Luxury Confirmation Popup Component
 *
 * @param {boolean} isOpen - Whether confirmation popup is visible
 * @param {string} [title='Are you sure?'] - Dialog heading
 * @param {string} [message='Please confirm this action.'] - Descriptive message
 * @param {string} [confirmText='Confirm'] - Label for confirm action button
 * @param {string} [cancelText='Cancel'] - Label for cancel button
 * @param {'danger' | 'warning' | 'info' | 'success'} [type='danger'] - Visual style theme
 * @param {Function} onConfirm - Callback when user clicks Confirm
 * @param {Function} onCancel - Callback when user clicks Cancel
 * @param {boolean} [loading=false] - Whether confirmation action is in flight
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  // ESC to cancel, body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel, loading]);

  if (!isOpen) return null;

  // Icon and accent configuration based on type
  const typeConfig = {
    danger: {
      badgeBg: 'bg-rose-50 border-rose-100 text-rose-600',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50',
      icon: <HiOutlineTrash className="w-6 h-6 stroke-[2]" />,
    },
    warning: {
      badgeBg: 'bg-amber-50 border-amber-100 text-[#8f6d43]',
      confirmBtn: 'bg-[#8f6d43] hover:bg-[#7b5b33] text-white shadow-[#8f6d43]/20',
      icon: <HiOutlineExclamation className="w-6 h-6 stroke-[2]" />,
    },
    info: {
      badgeBg: 'bg-stone-100 border-stone-200 text-stone-700',
      confirmBtn: 'bg-stone-900 hover:bg-stone-800 text-white shadow-stone-300/50',
      icon: <HiOutlineInformationCircle className="w-6 h-6 stroke-[2]" />,
    },
    success: {
      badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50',
      icon: <HiOutlineCheckCircle className="w-6 h-6 stroke-[2]" />,
    },
  }[type] || {
    badgeBg: 'bg-rose-50 border-rose-100 text-rose-600',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50',
    icon: <HiOutlineTrash className="w-6 h-6 stroke-[2]" />,
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      onClick={!loading ? onCancel : undefined}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-6 sm:p-7 space-y-5 transition-all transform duration-200 animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with Icon and Close Button */}
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs ${typeConfig.badgeBg}`}
          >
            {typeConfig.icon}
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            title="Cancel"
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-30"
          >
            <HiOutlineX className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-lg text-stone-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 font-sans leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold tracking-wider uppercase text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer disabled:opacity-40"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 ${typeConfig.confirmBtn}`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
