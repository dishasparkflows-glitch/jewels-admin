import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  icon,
  onConfirm,
  onCancel,
  loading = false,
}) {
  // ESC to cancel, body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const otherModals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
      if (otherModals.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onCancel, loading]);

  if (!isOpen) return null;

  // Icon and accent configuration based on type
  const typeConfig = {
    danger: {
      badgeBg: 'bg-red-50 border-red-200 text-red-700',
      confirmBtn: 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white shadow-sm shadow-red-900/20',
      icon: <HiOutlineTrash className="w-6 h-6 stroke-[2]" />,
    },
    warning: {
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200/50',
      icon: <HiOutlineExclamation className="w-6 h-6 stroke-[2]" />,
    },
    info: {
      badgeBg: 'bg-sky-50 border-sky-200 text-sky-600',
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200/50',
      icon: <HiOutlineInformationCircle className="w-6 h-6 stroke-[2]" />,
    },
    success: {
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50',
      icon: <HiOutlineCheckCircle className="w-6 h-6 stroke-[2]" />,
    },
  }[type] || {
    badgeBg: 'bg-red-50 border-red-200 text-red-700',
    confirmBtn: 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white shadow-sm shadow-red-900/20',
    icon: <HiOutlineTrash className="w-6 h-6 stroke-[2]" />,
  };

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      onClick={!loading ? onCancel : undefined}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 transition-all transform duration-200 animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with Icon and Close Button */}
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shadow-xs ${typeConfig.badgeBg}`}
          >
            {icon || typeConfig.icon}
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
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 font-sans leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 font-sans">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold tracking-wider uppercase text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer disabled:opacity-40 text-center"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer hover:brightness-95 disabled:opacity-50 flex items-center justify-center gap-2 ${typeConfig.confirmBtn}`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
