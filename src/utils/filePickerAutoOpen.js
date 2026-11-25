/**
 * Global File / Image Picker Auto-Open Utility
 * Automatically triggers the file picker dialog when the user navigates
 * to an image/file upload input, label, dropzone, or upload button using the Tab key.
 */

export function getUploadTriggerProps(onActivate, { disabled = false, fileInputId } = {}) {
  return {
    tabIndex: disabled ? -1 : 0,
    role: 'button',
    'data-upload-trigger': disabled ? undefined : 'true',
    ...(fileInputId ? { 'data-file-input-id': fileInputId } : {}),
    onKeyDown: (e) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (typeof onActivate === 'function') {
          onActivate(e);
        } else if (fileInputId) {
          document.getElementById(fileInputId)?.click();
        } else {
          e.currentTarget.querySelector('input[type="file"]')?.click();
        }
      }
    },
  };
}

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

  // Track Tab keydown and clear any lingering pointer lock immediately
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Tab') {
        lastTabTime = Date.now();
        isPointerInteracting = false;
        if (pointerTimeout) {
          clearTimeout(pointerTimeout);
          pointerTimeout = null;
        }
      }
    },
    true
  );

  const openFileInput = (fileInput) => {
    if (!fileInput || fileInput.disabled) return false;
    try {
      if (typeof fileInput.showPicker === 'function') {
        fileInput.showPicker();
      } else {
        fileInput.click();
      }
    } catch {
      fileInput.click();
    }
    return true;
  };

  const isUploadTrigger = (el) => {
    if (!el || el === document.body || el === document.documentElement) return false;

    // 1. Explicit data attribute on the focused element itself
    if (el.dataset?.uploadTrigger === 'true' || el.hasAttribute('data-upload-trigger')) {
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

    // 4. Focusable buttons / triggers with explicit file/image upload labels
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      const text = (
        el.innerText ||
        el.textContent ||
        el.getAttribute('title') ||
        el.getAttribute('aria-label') ||
        ''
      )
        .trim()
        .replace(/\s+/g, ' ');

      if (
        /^(upload(\s+(file|image|media|icon|excel|stone\s+image|custom\s+image|featured\s+image|banner\s+image|theme\s+image|new\s+image|image\s*\/\s*icon|images\s*\/\s*videos))?|choose\s+(icon|image|media|file|local\s+file|custom\s+image)|browse(\s+files)?|replace\s+image|change\s+image)$/i.test(
          text
        )
      ) {
        return true;
      }
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
      openFileInput(target);
      return;
    }

    // 2. Explicit target file input ID
    if (target.dataset?.fileInputId) {
      const byId = document.getElementById(target.dataset.fileInputId);
      if (openFileInput(byId)) return;
    }

    // 3. Label linked via htmlFor or nested file input
    if (target.tagName === 'LABEL') {
      const byFor = target.htmlFor ? document.getElementById(target.htmlFor) : null;
      const nested = target.querySelector('input[type="file"]');
      const labelInput = (byFor && byFor.type === 'file' ? byFor : null) || nested;
      if (openFileInput(labelInput)) return;
    }

    // 4. Clickable button/trigger with React onClick handler
    if (typeof target.click === 'function') {
      target.click();
      return;
    }

    // 5. Fallback: associated input[type="file"] in nearby parent container
    let container = target.parentElement;
    for (let i = 0; i < 4 && container && container !== document.body; i++) {
      const fileInput = container.querySelector('input[type="file"]');
      if (openFileInput(fileInput)) return;
      container = container.parentElement;
    }
  };

  // Focusin event: fires when focus shifts to an element
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
