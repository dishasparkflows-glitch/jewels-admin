import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Global luxury Tooltip Provider for the entire Admin Panel.
 *
 * Automatically captures any element with `data-tooltip` or native `title` attribute,
 * suppresses the browser's plain system tooltip, and displays a unified,
 * high-performance luxury tooltip with pixel-perfect caret arrow and smooth transitions.
 */
export default function GlobalTooltip() {
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    text: '',
    top: 0,
    left: 0,
    position: 'top', // 'top' | 'bottom'
  });

  const activeElementRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      // Find closest element with data-tooltip or native title
      const target = e.target?.closest?.('[data-tooltip], [title], [data-original-title]');
      if (!target) return;

      // Extract text content
      let text = target.getAttribute('data-tooltip') || target.getAttribute('title') || target.getAttribute('data-original-title');
      if (!text || !text.trim()) return;
      text = text.trim();

      // Suppress native browser tooltip by converting title to data-original-title
      if (target.hasAttribute('title')) {
        target.setAttribute('data-original-title', text);
        target.removeAttribute('title');
      }

      activeElementRef.current = target;
      clearTimeout(hideTimerRef.current);
      clearTimeout(showTimerRef.current);

      // Preferred position or auto-detect
      const preferredPos = target.getAttribute('data-tooltip-position') || 'top';

      showTimerRef.current = setTimeout(() => {
        if (!activeElementRef.current) return;
        const rect = activeElementRef.current.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        // Auto-flip if too close to viewport edge
        let finalPos = preferredPos;
        if (preferredPos === 'top' && rect.top < 45) {
          finalPos = 'bottom';
        } else if (preferredPos === 'bottom' && rect.bottom > window.innerHeight - 45) {
          finalPos = 'top';
        }

        const top = finalPos === 'top' ? rect.top - 8 : rect.bottom + 8;
        const left = Math.max(16, Math.min(window.innerWidth - 16, rect.left + rect.width / 2));

        setTooltipState({
          visible: true,
          text,
          top,
          left,
          position: finalPos,
        });
      }, 70);
    };

    const handleMouseOut = (e) => {
      const target = e.target?.closest?.('[data-tooltip], [data-original-title]');
      if (target && target === activeElementRef.current) {
        clearTimeout(showTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          activeElementRef.current = null;
          setTooltipState((prev) => ({ ...prev, visible: false }));
        }, 50);
      }
    };

    const handleDismiss = () => {
      clearTimeout(showTimerRef.current);
      activeElementRef.current = null;
      setTooltipState((prev) => ({ ...prev, visible: false }));
    };

    // Attach listeners with passive / capture options
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    window.addEventListener('scroll', handleDismiss, { passive: true, capture: true });
    window.addEventListener('resize', handleDismiss, { passive: true });
    document.addEventListener('click', handleDismiss, true);

    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss, true);
      document.removeEventListener('click', handleDismiss, true);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  const { visible, text, top, left, position } = tooltipState;

  const isTop = position === 'top';
  const transform = isTop ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
  const arrowClass = isTop
    ? '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r'
    : '-top-1 left-1/2 -translate-x-1/2 border-t border-l';

  return createPortal(
    <div
      role="tooltip"
      aria-hidden={!visible}
      className={`fixed z-[99999] pointer-events-none transition-all duration-150 ease-out ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform,
      }}
    >
      <div className="relative bg-stone-900 text-white text-[11px] font-medium tracking-wide px-2.5 py-1.5 rounded-lg shadow-xl border border-stone-800/90 whitespace-nowrap flex items-center gap-1.5 select-none">
        {text}
        <span
          className={`absolute w-2 h-2 bg-stone-900 border-stone-800/90 rotate-45 ${arrowClass}`}
        />
      </div>
    </div>,
    document.body
  );
}
