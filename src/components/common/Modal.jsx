import React, { useEffect } from 'react';
import { HiOutlineX } from 'react-icons/hi';

/**
 * Common Luxury Modal Dialog Component
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Handler called when modal requests closing
 * @param {React.ReactNode} title - Modal title
 * @param {string} [subtitle] - Optional subtitle
 * @param {React.ReactNode} children - Modal body contents
 * @param {React.ReactNode} [footer] - Optional footer content
 * @param {string} [maxWidth='max-w-lg'] - Tailored max-width class
 * @param {boolean} [showClose=true] - Show top-right X button
 * @param {boolean} [closeOnOverlayClick=true] - Click outside to close
 * @param {string} [className=''] - Extra classes for modal card
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  showClose = true,
  closeOnOverlayClick = true,
  className = '',
}) {
  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-6 sm:p-8 space-y-6 transition-all transform duration-200 animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between pb-3 border-b border-stone-100/90 shrink-0">
            <div>
              {title && (
                <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-xs text-stone-500 font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {showClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shrink-0 ml-4"
              >
                <HiOutlineX className="w-4 h-4 stroke-[2]" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 -mr-1 font-sans">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="pt-4 border-t border-stone-100 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
