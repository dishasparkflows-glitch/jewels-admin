/**
 * Standardized Luxury Status Badge
 * Replaces ad-hoc inline Tailwind strings across the admin portal.
 */
const STATUS_STYLES = {
  // Success / Active
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_stock: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Warning / In-Progress / Draft
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  low_stock: 'bg-amber-50 text-amber-700 border-amber-200',
  dispatched: 'bg-sky-50 text-sky-700 border-sky-200',

  // Danger / Inactive / Cancelled
  inactive: 'bg-red-50 text-red-700 border-red-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  out_of_stock: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  returned: 'bg-rose-50 text-rose-700 border-rose-200',

  // Neutral
  neutral: 'bg-stone-100 text-stone-600 border-stone-200',
};

const DEFAULT_LABELS = {
  in_stock: 'In Stock',
  out_of_stock: 'Out of Stock',
  low_stock: 'Low Stock',
};

export default function StatusBadge({
  status = 'active',
  label,
  size = 'sm',
  withDot = false,
  className = '',
}) {
  const normKey = String(status || 'neutral')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  const colorClasses = STATUS_STYLES[normKey] || STATUS_STYLES.neutral;
  const isPositive = ['active', 'approved', 'in_stock', 'published', 'delivered', 'completed'].includes(normKey);

  const displayLabel =
    label ||
    DEFAULT_LABELS[normKey] ||
    String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.2 text-[9px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-2xs select-none ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span>{displayLabel}</span>
    </span>
  );
}
