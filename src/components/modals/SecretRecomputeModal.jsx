import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineReply,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { productsAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';

const PHASE_LABELS = {
  idle: 'Ready',
  backup: 'Creating Safety Snapshot...',
  loading_masters: 'Loading Pricing Masters...',
  processing: 'Recomputing Products...',
  done: 'Completed',
  failed: 'Failed',
};

export default function SecretRecomputeModal({ isOpen, onClose, onComplete }) {
  const confirm = useConfirm();

  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [databaseName, setDatabaseName] = useState('');
  const [hasLatestBackup, setHasLatestBackup] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [resetting, setResetting] = useState(false);

  const wasRunningRef = useRef(false);

  const fetchStatus = useCallback(async ({ silent = true } = {}) => {
    try {
      const res = await productsAPI.getRecomputeStatus();
      const payload = res.data?.data || {};
      const nextStatus = payload.status || null;

      setDatabaseName(payload.database || '');
      setHasLatestBackup(Boolean(payload.hasLatestBackup));
      setStatus(nextStatus);

      if (wasRunningRef.current && nextStatus && !nextStatus.isRunning && nextStatus.done) {
        wasRunningRef.current = false;
        if (nextStatus.phase === 'failed') {
          toast.error(nextStatus.error || 'Catalogue recompute failed');
        } else {
          toast.success(
            `Recomputed ${nextStatus.updatedCount || 0} products (${nextStatus.skippedCount || 0} skipped)`
          );
          onComplete?.();
        }
      } else if (nextStatus?.isRunning) {
        wasRunningRef.current = true;
      }
    } catch (err) {
      if (!silent) {
        toast.error(err.response?.data?.message || 'Failed to read recompute status');
      }
    }
  }, [onComplete]);

  // Initial load on open
  useEffect(() => {
    if (!isOpen) {
      wasRunningRef.current = false;
      return;
    }
    fetchStatus({ silent: true });
  }, [isOpen, fetchStatus]);

  // Poll every 1000ms while background job is running
  useEffect(() => {
    if (!isOpen || !status?.isRunning) return;
    const timer = setInterval(() => {
      fetchStatus({ silent: true });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, status?.isRunning, fetchStatus]);

  const handleStart = async () => {
    if (!passkey.trim()) {
      toast.error('Please enter the secret passkey');
      return;
    }

    try {
      setSubmitting(true);
      wasRunningRef.current = true;
      const res = await productsAPI.startRecomputeAll(passkey.trim());
      const payload = res.data?.data || {};
      setDatabaseName(payload.database || databaseName);
      setStatus(payload.status || null);
      toast.success('Catalogue recompute & snapshot started');
    } catch (err) {
      wasRunningRef.current = false;
      toast.error(err.response?.data?.message || 'Failed to start catalogue recompute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const res = await productsAPI.resetRecomputeStatus();
      const payload = res.data?.data || {};
      setStatus(payload.status || null);
      toast.success('Recompute status reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset status');
    } finally {
      setResetting(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!passkey.trim()) {
      toast.error('Enter the secret passkey to restore backup');
      return;
    }

    const ok = await confirm({
      title: 'Restore Last Backup Snapshot?',
      message:
        'This will overwrite the current products collection with products_backup_latest created before the last recompute.',
      confirmText: 'Restore Backup',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      setRestoring(true);
      const res = await productsAPI.restoreRecomputeBackup(passkey.trim());
      const payload = res.data?.data || {};
      toast.success(
        res.data?.message || `Restored ${payload.restoredCount || 0} products from backup`
      );
      await fetchStatus({ silent: true });
      onComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Backup restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const isRunning = Boolean(status?.isRunning);
  const total = status?.total || 0;
  const processed = status?.processed || 0;
  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const phaseText = PHASE_LABELS[status?.phase || 'idle'] || status?.phase || 'Ready';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Catalogue Recompute & Publish Engine"
      subtitle="Snapshot active products, refresh master diamond & metal rates, and recalculate all variant prices."
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRunning || restoring}
              onClick={handleRestoreBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              title="Rollback products collection from products_backup_latest"
            >
              <HiOutlineReply className="w-3.5 h-3.5" />
              <span>{restoring ? 'Restoring...' : 'Restore Last Backup'}</span>
            </button>

            <button
              type="button"
              disabled={isRunning || resetting}
              onClick={handleReset}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resetting ? 'Resetting...' : 'Reset Status'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isRunning || submitting}
              onClick={handleStart}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:brightness-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <HiOutlineRefresh className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Recomputing...' : 'Start Recompute & Publish All'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Database & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex items-center gap-2 text-xs text-stone-700">
            <HiOutlineDatabase
              className="w-4 h-4 shrink-0"
              style={{ color: 'var(--theme-primary, #8b6f4e)' }}
            />
            <span className="font-semibold">Database:</span>
            <code className="px-2 py-0.5 rounded-md bg-white border border-stone-200 font-mono text-[11px] font-bold text-stone-900">
              {databaseName || '—'}
            </code>
          </div>

          <div className="flex items-center gap-2">
            {hasLatestBackup && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <HiOutlineShieldCheck className="w-3 h-3" />
                Backup Ready
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isRunning
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : status?.phase === 'failed'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : status?.done
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-stone-600 border-stone-200'
              }`}
            >
              {status?.phase === 'done' && <HiOutlineCheckCircle className="w-3.5 h-3.5" />}
              {status?.phase === 'failed' && <HiOutlineExclamationCircle className="w-3.5 h-3.5" />}
              <span>{phaseText}</span>
            </span>
          </div>
        </div>

        {/* Passkey Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-700">
            Secret Passkey <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <HiOutlineLockClosed className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type={showPasskey ? 'text' : 'password'}
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter secret passkey to run recompute or rollback..."
              className="w-full pl-9 pr-10 py-2 text-xs font-mono text-stone-900 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15"
            />
            <button
              type="button"
              onClick={() => setShowPasskey((v) => !v)}
              className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              title={showPasskey ? 'Hide passkey' : 'Show passkey'}
            >
              {showPasskey ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-stone-500">
            Automatically snapshots <code className="font-mono text-stone-700">products</code> into{' '}
            <code className="font-mono text-stone-700">products_backup_&lt;timestamp&gt;</code> &amp;{' '}
            <code className="font-mono text-stone-700">products_backup_latest</code> before updating rates.
          </p>
        </div>

        {/* Progress Bar & Metrics */}
        {status && (isRunning || status.done || status.total > 0) && (
          <div className="p-4 rounded-2xl border border-stone-300 bg-stone-50/70 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">
                Progress: {processed} / {total}
              </span>
              <span className="font-mono font-bold text-stone-900">{percent}%</span>
            </div>

            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${percent}%`,
                  backgroundColor:
                    status.phase === 'failed'
                      ? '#dc2626'
                      : 'var(--theme-primary, #8b6f4e)',
                }}
                className="h-full transition-all duration-300 rounded-full"
              />
            </div>

            {(status.currentSku || status.currentTitle) && isRunning && (
              <div className="text-[11px] text-stone-600 truncate">
                Processing:{' '}
                <strong className="text-stone-900 font-mono">{status.currentSku || '—'}</strong>{' '}
                {status.currentTitle ? `— ${status.currentTitle}` : ''}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-center">
                <div className="text-[10px] font-bold uppercase text-stone-400">Total</div>
                <div className="text-sm font-bold text-stone-900 mt-0.5">{total}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-center">
                <div className="text-[10px] font-bold uppercase text-emerald-600">Updated</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">
                  {status.updatedCount || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-center">
                <div className="text-[10px] font-bold uppercase text-amber-600">Skipped</div>
                <div className="text-sm font-bold text-amber-700 mt-0.5">
                  {status.skippedCount || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-rose-200 text-center">
                <div className="text-[10px] font-bold uppercase text-rose-600">Errors</div>
                <div className="text-sm font-bold text-rose-700 mt-0.5">
                  {status.errorCount || 0}
                </div>
              </div>
            </div>

            {status.backupInfo && (
              <div className="text-[11px] text-stone-600 bg-white px-3 py-2 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Snapshot:{' '}
                  <code className="font-mono font-semibold text-stone-800">
                    {status.backupInfo.collection}
                  </code>
                </span>
                <span className="font-semibold text-stone-700">
                  {status.backupInfo.count} docs backed up
                </span>
              </div>
            )}

            {status.error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {status.error}
              </div>
            )}

            {Array.isArray(status.errors) && status.errors.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-rose-200 bg-white divide-y divide-rose-100">
                {status.errors.map((errItem, i) => (
                  <div key={`${errItem.id}-${i}`} className="px-3 py-2 text-[11px]">
                    <span className="font-mono font-bold text-stone-800">
                      {errItem.sku || errItem.id}
                    </span>{' '}
                    <span className="text-stone-500">({errItem.title}):</span>{' '}
                    <span className="text-rose-600">{errItem.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
