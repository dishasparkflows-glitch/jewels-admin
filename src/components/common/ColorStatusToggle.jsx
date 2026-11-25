/* eslint-disable react/prop-types */
import ToggleSwitch from './ToggleSwitch';

export default function ColorStatusToggle({ status = 'active', onChange, disabled = false, name }) {
  const enabled = status !== 'inactive';
  return (
    <ToggleSwitch
      label="Status"
      checked={enabled}
      onChange={(nextChecked) => onChange?.(nextChecked ? 'active' : 'inactive')}
      disabled={disabled}
      ariaLabel={`${name || 'Color'} status toggle`}
      showStatusText={false}
      size="md"
    />
  );
}
