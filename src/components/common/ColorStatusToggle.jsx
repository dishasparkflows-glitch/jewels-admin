/* eslint-disable react/prop-types */
export default function ColorStatusToggle({ status = 'active', onChange, disabled = false, name }) {
  const enabled = status !== 'inactive';
  return (
    <div className="inline-flex shrink-0 items-center gap-2 select-none">
      <span className="text-xs font-semibold text-stone-600">
        Status
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${name || 'Color'} status toggle`}
        disabled={disabled}
        onClick={() => onChange(enabled ? 'inactive' : 'active')}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors p-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f4e] shadow-2xs ${
          enabled ? 'bg-[#8b6f4e]' : 'bg-stone-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className={`text-xs font-bold w-12 text-left ${enabled ? 'text-emerald-700' : 'text-stone-400'}`}>
        {enabled ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}
