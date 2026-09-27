/**
 * Global Horizontal Scroll Utility
 * Enables mouse wheel scrolling to move horizontally on all scrollable containers (tables, carousels, tabs)
 * Also enables click-and-drag horizontal scrolling for desktop mice.
 */

export function initHorizontalScroll() {
  if (typeof window === 'undefined') return;

  // ─── 1. Find Closest Horizontally Scrollable Element ───
  function findHorizontalScrollable(target) {
    let el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      // Check if element has horizontal overflow
      const hasHorizontalOverflow = el.scrollWidth > el.clientWidth + 2;

      if (hasHorizontalOverflow) {
        const style = window.getComputedStyle(el);
        const ox = style.overflowX;
        if (ox === 'auto' || ox === 'scroll') {
          return el;
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  // ─── 2. Mouse Wheel Handler ───
  window.addEventListener(
    'wheel',
    (e) => {
      // If user is already scrolling horizontally via trackpad or Shift key, let native physics handle it
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;

      const scrollable = findHorizontalScrollable(e.target);
      if (!scrollable) return;

      // Check if container has room to scroll in direction
      const maxScrollLeft = scrollable.scrollWidth - scrollable.clientWidth;
      if (maxScrollLeft <= 0) return;

      const currentScroll = scrollable.scrollLeft;
      const isAtLeft = currentScroll <= 1;
      const isAtRight = Math.ceil(currentScroll) >= maxScrollLeft - 1;

      // Scroll right on wheel down
      if (e.deltaY > 0 && !isAtRight) {
        scrollable.scrollLeft += e.deltaY;
        e.preventDefault();
      }
      // Scroll left on wheel up
      else if (e.deltaY < 0 && !isAtLeft) {
        scrollable.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // ─── 3. Click-and-Drag Horizontal Scroll for Mice ───
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let activeElement = null;

  window.addEventListener('mousedown', (e) => {
    // Only handle primary left click
    if (e.button !== 0) return;

    // Ignore interactive elements
    const tag = e.target.tagName.toLowerCase();
    if (['button', 'input', 'select', 'textarea', 'a', 'label', 'svg', 'path'].includes(tag)) {
      return;
    }
    if (e.target.closest('button, input, select, textarea, a, [role="button"]')) {
      return;
    }

    const scrollable = findHorizontalScrollable(e.target);
    if (!scrollable) return;

    isDown = true;
    activeElement = scrollable;
    startX = e.pageX - scrollable.offsetLeft;
    scrollLeft = scrollable.scrollLeft;
    scrollable.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown || !activeElement) return;
    e.preventDefault();
    const x = e.pageX - activeElement.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed factor
    activeElement.scrollLeft = scrollLeft - walk;
  });

  const stopDrag = () => {
    if (activeElement) {
      activeElement.style.removeProperty('user-select');
    }
    isDown = false;
    activeElement = null;
  };

  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mouseleave', stopDrag);
}
