import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext(null);

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
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export default ConfirmContext;
