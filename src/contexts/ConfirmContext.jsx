import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

// Fallback confirm implementation in case context is accessed outside provider or during Vite HMR re-evaluations
const fallbackConfirm = async (options) => {
  if (typeof window !== 'undefined' && window.confirm) {
    return window.confirm(options?.message || options?.title || 'Are you sure?');
  }
  return true;
};

// Preserve singleton instance across Vite HMR and dynamic import lazy chunks
const globalKey = '__JEWELS_CONFIRM_CONTEXT__';
if (!globalThis[globalKey]) {
  globalThis[globalKey] = createContext(fallbackConfirm);
}
const ConfirmContext = globalThis[globalKey];

/**
 * Global Confirm Provider
 * Enables programmatic invocation of luxury confirm popups:
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure?',
 *     confirmText: 'Delete',
 *     type: 'danger'
 *   });
 */
export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: options?.title || 'Are you sure?',
        message: options?.message || 'This action cannot be undone. Please confirm to proceed.',
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        type: options?.type || 'danger',
        ...options,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setConfig(null);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setConfig(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {config && (
        <ConfirmModal
          isOpen={true}
          title={config.title}
          message={config.message}
          confirmText={config.confirmText}
          cancelText={config.cancelText}
          type={config.type}
          icon={config.icon}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  return context || fallbackConfirm;
}

export default ConfirmContext;
