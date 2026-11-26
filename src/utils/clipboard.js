import toast from 'react-hot-toast';

/**
 * Copy text to the system clipboard with optional toast notification.
 *
 * @param {string} text - Text to copy
 * @param {Object} [options]
 * @param {string} [options.successMessage] - Toast message shown on success
 * @param {string} [options.errorMessage='Could not copy to clipboard'] - Toast message shown on failure
 * @returns {Promise<boolean>} Whether copy succeeded
 */
export async function copyToClipboard(text, options = {}) {
  const { successMessage, errorMessage = 'Could not copy to clipboard' } = options;
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(String(text));
    if (successMessage) {
      toast.success(successMessage);
    }
    return true;
  } catch {
    if (errorMessage) {
      toast.error(errorMessage);
    }
    return false;
  }
}
