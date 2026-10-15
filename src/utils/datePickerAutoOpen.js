/**
 * Global DatePicker Auto-Open Utility
 * Automatically triggers showPicker() on HTML5 date inputs when:
 * 1. The user navigates to the input using the Tab key
 * 2. The input receives focus
 * 3. The input is clicked anywhere within its boundary
 */

export function initDatePickerAutoOpen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const tryOpenPicker = (element) => {
    if (!element || element.tagName !== 'INPUT') return;
    const type = element.getAttribute('type') || element.type;
    if (type === 'date' || type === 'datetime-local' || type === 'time') {
      try {
        if (typeof element.showPicker === 'function') {
          element.showPicker();
        }
      } catch (err) {
        // Ignored if browser restricts or picker is already open
      }
    }
  };

  // 1. Focusin event (fires when tabbing into the input or focusing programmatically)
  document.addEventListener('focusin', (e) => {
    tryOpenPicker(e.target);
  });

  // 2. Click event (fires when clicking anywhere on the date box)
  document.addEventListener('click', (e) => {
    tryOpenPicker(e.target);
  });

  // 3. Tab keydown backup (triggers immediately after focus shifts)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      setTimeout(() => {
        tryOpenPicker(document.activeElement);
      }, 20);
    }
  });
}

export default initDatePickerAutoOpen;
