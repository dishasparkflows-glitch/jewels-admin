/**
 * Global File / Image Picker Auto-Open Utility
 * Automatically triggers the file picker dialog when:
 * 1. The user navigates to an image/file upload input or upload button using the Tab key.
 */

export function initFilePickerAutoOpen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let isPointerInteracting = false;
  let pointerTimeout = null;
  let lastTabTime = 0;
  let lastTriggerTime = 0;

  // Track pointer down so mouse clicks don't double-trigger
  const handlePointerDown = () => {
    isPointerInteracting = true;
    if (pointerTimeout) clearTimeout(pointerTimeout);
    pointerTimeout = setTimeout(() => {
      isPointerInteracting = false;
    }, 400);
  };

  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('mousedown', handlePointerDown, true);
  document.addEventListener('touchstart', handlePointerDown, true);

  // Track Tab keydown
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Tab') {
        lastTabTime = Date.now();
      }
    },
    true
  );

  const isUploadTrigger = (el) => {
    if (!el || el === document.body || el === document.documentElement) return false;

    // 1. Explicit data attribute
    if (
      el.dataset?.uploadTrigger === 'true' ||
      el.hasAttribute('data-upload-trigger') ||
      el.closest('[data-upload-trigger]')
    ) {
      return true;
    }

    // 2. Direct file input
    if (el.tagName === 'INPUT' && (el.type === 'file' || el.getAttribute('type') === 'file')) {
      return true;
    }

    // 3. Label for file input
    if (el.tagName === 'LABEL') {
      if (el.htmlFor) {
        const target = document.getElementById(el.htmlFor);
        if (target && target.type === 'file') return true;
      }
      if (el.querySelector('input[type="file"]')) return true;
    }

    // 4. Buttons, links, or dropzones with upload text
    const text = (
      el.innerText ||
      el.textContent ||
      el.getAttribute('title') ||
      el.getAttribute('aria-label') ||
      ''
    ).trim();

    if (
      /^(upload|upload\s+image|upload\s+media|upload\s+stone\s+image|choose\s+image|choose\s+media|choose\s+file|browse)$/i.test(
        text
      )
    ) {
      return true;
    }

    return false;
  };

  const triggerUpload = (target) => {
    if (!target) return;
    const now = Date.now();
    if (now - lastTriggerTime < 800) return;
    lastTriggerTime = now;

    // 1. Direct file input
    if (target.tagName === 'INPUT' && target.type === 'file') {
      try {
        if (typeof target.showPicker === 'function') {
          target.showPicker();
        } else {
          target.click();
        }
      } catch {
        target.click();
      }
      return;
    }

    // 2. Look for associated input[type="file"] in nearby parent / container
    let container = target.parentElement;
    for (let i = 0; i < 4 && container && container !== document.body; i++) {
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput && !fileInput.disabled) {
        try {
          if (typeof fileInput.showPicker === 'function') {
            fileInput.showPicker();
          } else {
            fileInput.click();
          }
        } catch {
          fileInput.click();
        }
        return;
      }
      container = container.parentElement;
    }

    // 3. If target itself is a clickable upload button
    if (typeof target.click === 'function') {
      target.click();
    }
  };

  // Focusin event: fires immediately when focus shifts to an element
  document.addEventListener(
    'focusin',
    (e) => {
      if (isPointerInteracting) return;
      const now = Date.now();
      const isFromTab = now - lastTabTime < 600;
      if (!isFromTab) return;

      const target = e.target;
      if (isUploadTrigger(target)) {
        triggerUpload(target);
      }
    },
    true
  );
}

export default initFilePickerAutoOpen;
