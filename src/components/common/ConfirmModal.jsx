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
 * @param {string} [title='Delete Record'] - Dialog heading
 * @param {string} [message='Please confirm this action.'] - Descriptive message
 * @param {string} [confirmText='Delete'] - Label for confirm action button
 * @param {string} [cancelText='Cancel'] - Label for cancel button
 * @param {'danger' | 'warning' | 'info' | 'success'} [type='danger'] - Visual style theme
 * @param {Function} onConfirm - Callback when user clicks Confirm
 * @param {Function} onCancel - Callback when user clicks Cancel
 * @param {boolean} [loading=false] - Whether confirmation action is in flight
 */
export default function ConfirmModal({
  isOpen,
  title = 'Delete Record',
  message = 'Are you sure you want to delete this record?\nThis action cannot be undone.',
  confirmText = 'Delete',
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

  // Icon and button configuration based on type
  const typeConfig = {
    danger: {
      badgeBg: 'bg-[#fcf1ee] text-[#ba1c1b]',
      confirmBtn: 'bg-[#ba1c1b] hover:bg-[#a11817] text-white shadow-xs',
      icon: <HiOutlineTrash className="w-7 h-7 text-[#ba1c1b] stroke-[2]" />,
    },
    warning: {
      badgeBg: 'bg-amber-50 text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
      icon: <HiOutlineExclamation className="w-7 h-7 text-amber-600 stroke-[2]" />,
    },
    info: {
      badgeBg: 'bg-sky-50 text-sky-600',
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs',
      icon: <HiOutlineInformationCircle className="w-7 h-7 text-sky-600 stroke-[2]" />,
    },
    success: {
      badgeBg: 'bg-emerald-50 text-emerald-600',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
      icon: <HiOutlineCheckCircle className="w-7 h-7 text-emerald-600 stroke-[2]" />,
    },
  }[type] || {
    badgeBg: 'bg-[#fcf1ee] text-[#ba1c1b]',
    confirmBtn: 'bg-[#ba1c1b] hover:bg-[#a11817] text-white shadow-xs',
    icon: <HiOutlineTrash className="w-7 h-7 text-[#ba1c1b] stroke-[2]" />,
  };

  const renderMessage = () => {
    if (typeof message === 'string') {
      if (message.includes('\n')) {
        const lines = message.split('\n');
        return lines.map((line, idx) => (
          <React.Fragment key={idx}>
            {line}
            {idx < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      }
      if (message.includes('?')) {
        const parts = message.split('?');
        const first = parts[0] ? `${parts[0].trim()}?` : '';
        const second = parts.slice(1).join('?').trim();
        return (
          <>
            {first}
            {second && (
              <>
                <br />
                {second}
              </>
            )}
          </>
        );
      }
    }
    return message;
  };

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      onClick={!loading ? onCancel : undefined}
    >
      <div
        className="relative w-full max-w-[390px] bg-white rounded-2xl sm:rounded-3xl border border-stone-100 shadow-2xl p-6 sm:p-7 text-center transition-all transform duration-200 animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          title="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer disabled:opacity-30"
        >
          <HiOutlineX className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Centered circular icon badge */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${typeConfig.badgeBg}`}
        >
          {icon || typeConfig.icon}
        </div>

        {/* Title: Normal clean font */}
        <h3 className="font-sans font-bold text-lg sm:text-xl text-stone-900 tracking-tight leading-snug">
          {title}
        </h3>

        {/* Description: Centered 2-line prompt */}
        <div className="text-sm text-stone-600 font-sans leading-relaxed mt-2 max-w-[300px] mx-auto">
          {renderMessage()}
        </div>

        {/* Action Buttons: Side-by-side equal width */}
        <div className="grid grid-cols-2 gap-3.5 w-full mt-6 sm:mt-7 font-sans">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 px-4 text-sm font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 text-center"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 px-4 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${typeConfig.confirmBtn}`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
