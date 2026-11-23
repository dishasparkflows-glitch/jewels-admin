import PropTypes from 'prop-types';

/**
 * Universal ToggleSwitch component for luxury admin portal
 * Standardizes the 28+ duplicate raw switch implementations across tables and forms.
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label = '',
  showStatusText = false,
  activeText = 'Active',
  inactiveText = 'Inactive',
  activeColor = 'var(--theme-primary, #8b6f4e)',
  inactiveColor = '#d6d3d1', // stone-300
  ariaLabel = 'Toggle switch',
  stopPropagation = false,
  className = '',
}) {
  const isChecked = Boolean(checked);

  const handleClick = (e) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (disabled || !onChange) return;
    onChange(!isChecked);
  };

  // Sizing tokens for track and thumb
  const sizeMap = {
    xs: { track: 'h-4 w-7 p-0.5', thumb: 'h-3 w-3', translate: 'translate-x-3' },
    sm: { track: 'h-5 w-9 p-0.5', thumb: 'h-4 w-4', translate: 'translate-x-4' },
    md: { track: 'h-6 w-11 p-0.5', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    lg: { track: 'h-7 w-13 p-0.5', thumb: 'h-6 w-6', translate: 'translate-x-6' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex shrink-0 items-center gap-2 select-none ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-stone-600">{label}</span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleClick}
        style={{
          backgroundColor: isChecked ? activeColor : inactiveColor,
        }}
        className={`relative inline-flex ${currentSize.track} shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#8b6f4e)] shadow-2xs`}
      >
        <span
          className={`inline-block ${currentSize.thumb} transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            isChecked ? currentSize.translate : 'translate-x-0'
          }`}
        />
      </button>

      {showStatusText && (
        <span
          className={`text-xs font-bold transition-colors ${
            isChecked ? 'text-emerald-700' : 'text-stone-400'
          }`}
        >
          {isChecked ? activeText : inactiveText}
        </span>
      )}
    </div>
  );
}

ToggleSwitch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  label: PropTypes.string,
  showStatusText: PropTypes.bool,
  activeText: PropTypes.string,
  inactiveText: PropTypes.string,
  activeColor: PropTypes.string,
  inactiveColor: PropTypes.string,
  ariaLabel: PropTypes.string,
  stopPropagation: PropTypes.bool,
  className: PropTypes.string,
};
