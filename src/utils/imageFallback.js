/**
 * Universal Image Fallback Utility for Neirah Admin Portal
 * Automatically provides a theme-matched "No Img" placeholder whenever
 * an image is missing, empty, or fails to load anywhere in the admin panel.
 */

export function getNoImageSvg(customPrimary, customRgb) {
  let primary = customPrimary;
  let rgb = customRgb;

  if (typeof document !== 'undefined') {
    try {
      const style = getComputedStyle(document.documentElement);
      if (!primary) primary = style.getPropertyValue('--theme-primary').trim();
      if (!rgb) rgb = style.getPropertyValue('--theme-primary-rgb').trim();
    } catch (e) {
      // Fallback
    }
  }

  primary = primary || '#8b6f4e';
  rgb = rgb || '139, 111, 78';

  const stroke = encodeURIComponent(primary);
  const fill = encodeURIComponent(`rgba(${rgb}, 0.08)`);

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect x="3" y="3" width="94" height="94" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="50" y="53" font-family="'Plus Jakarta Sans', Inter, -apple-system, sans-serif" font-size="18" font-weight="600" fill="%238c827a" text-anchor="middle" dominant-baseline="middle">No Img</text></svg>`;
}

/**
 * Initializes the global window error listener in the CAPTURE phase.
 * Native image load errors do not bubble up, so capturing on window ensures
 * EVERY broken or 404 image tag across all admin views is gracefully replaced.
 */
export function initImageFallback() {
  if (typeof window === 'undefined') return;

  const handleImgError = (event) => {
    const target = event.target;
    if (target && target.tagName === 'IMG') {
      if (target.dataset.noImgHandled) return;
      target.dataset.noImgHandled = 'true';
      target.src = getNoImageSvg();
      target.classList.add('no-img-fallback');
    }
  };

  window.addEventListener('error', handleImgError, true);

  // Update any existing active fallbacks when theme changes
  window.addEventListener('themeChanged', () => {
    try {
      const fallbackImages = document.querySelectorAll('img.no-img-fallback');
      const newSvg = getNoImageSvg();
      fallbackImages.forEach((img) => {
        img.src = newSvg;
      });
    } catch (e) {}
  });
}
