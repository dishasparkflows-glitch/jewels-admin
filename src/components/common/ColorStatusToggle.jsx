export default function ColorStatusToggle({ status = 'active', onChange, disabled = false, name }) {
  const enabled = status !== 'inactive';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${name || 'Color'} status`}
      disabled={disabled}
      onClick={() => onChange(enabled ? 'inactive' : 'active')}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-xs font-semibold text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f47] disabled:opacity-40"
    >
      <span>Status</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-[#8b6f47]' : 'bg-stone-300'}`}>
        <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
      <span className="w-6 text-left">{enabled ? 'On' : 'Off'}</span>
    </button>
  );
}
