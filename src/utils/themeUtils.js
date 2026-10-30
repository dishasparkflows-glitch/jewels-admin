/**
 * Theme Presets and Dynamic Color Generator
 * Preserves exact #8b6f4e luxury bronze as the 'default' theme.
 */

export const DEFAULT_THEME = {
  id: 'default',
  name: 'Luxury Bronze',
  label: 'Default (Luxury Bronze)',
  isDefault: true,
  description: 'Our signature royal bronze jewellery theme',
  primary: '#8b6f4e',
  hover: '#755c3e',
  dark: '#644d32',
  light: '#f4ece0',
  soft: '#faf5ee',
  border: '#e8d9c2',
  accent: '#9c7849',
};

export const THEME_PRESETS = [
  DEFAULT_THEME,
  {
    id: 'emerald',
    name: 'Royal Emerald',
    label: 'Royal Emerald',
    isDefault: false,
    description: 'Deep Colombian gemstone green',
    primary: '#0f766e',
    hover: '#0d655f',
    dark: '#042f2e',
    light: '#ccfbf1',
    soft: '#f0fdfa',
    border: '#99f6e4',
    accent: '#14b8a6',
  },
  {
    id: 'champagne',
    name: 'Champagne Gold',
    label: 'Champagne Gold',
    isDefault: false,
    description: 'Delicate light golden shimmer',
    primary: '#a16207',
    hover: '#854d0e',
    dark: '#422006',
    light: '#fef9c3',
    soft: '#fefce8',
    border: '#fef08a',
    accent: '#ca8a04',
  },
  {
    id: 'slate',
    name: 'Platinum Slate',
    label: 'Platinum Slate',
    isDefault: false,
    description: 'Brushed steel & titanium slate',
    primary: '#475569',
    hover: '#334155',
    dark: '#0f172a',
    light: '#e2e8f0',
    soft: '#f1f5f9',
    border: '#cbd5e1',
    accent: '#64748b',
  },
  {
    id: 'dark-cherry',
    name: 'Dark Cherry',
    label: 'Dark Cherry',
    isDefault: false,
    description: 'Rich cherry red with restrained rose highlights',
    primary: '#7f1d3a',
    hover: '#64162d',
    dark: '#3f0d1f',
    light: '#f2dde4',
    soft: '#faf2f5',
    border: '#d7a8b7',
    accent: '#a13a59',
  },
  {
    id: 'deep-emerald',
    name: 'Deep Emerald',
    label: 'Deep Emerald',
    isDefault: false,
    description: 'Dark gemstone green with soft jade accents',
    primary: '#145a43',
    hover: '#104a37',
    dark: '#082f25',
    light: '#dcebe4',
    soft: '#f2f7f3',
    border: '#a8c9b6',
    accent: '#39775f',
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    label: 'Midnight Sapphire',
    isDefault: false,
    description: 'Deep sapphire blue with quiet silver-blue accents',
    primary: '#1e3a5f',
    hover: '#172f4d',
    dark: '#0b1b31',
    light: '#dfe7f1',
    soft: '#f4f6f9',
    border: '#a8b8ce',
    accent: '#3a5b84',
  },
  {
    id: 'dark-amethyst',
    name: 'Dark Amethyst',
    label: 'Dark Amethyst',
    isDefault: false,
    description: 'Deep royal purple with muted orchid highlights',
    primary: '#56306d',
    hover: '#452558',
    dark: '#2b173b',
    light: '#e9dff0',
    soft: '#f7f3f9',
    border: '#c6aed5',
    accent: '#785095',
  },
];

// Helper to convert hex to RGB
export function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(
    cleanHex.length === 3
      ? cleanHex.split('').map((c) => c + c).join('')
      : cleanHex,
    16
  );
  if (isNaN(bigint)) return { r: 139, g: 111, b: 78 };
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// Helper to blend color with white (tint)
function blendWithWhite(rgb, ratio) {
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * ratio),
    g: Math.round(rgb.g + (255 - rgb.g) * ratio),
    b: Math.round(rgb.b + (255 - rgb.b) * ratio),
  };
}

// Helper to blend color with black (shade)
function blendWithBlack(rgb, ratio) {
  return {
    r: Math.round(rgb.r * (1 - ratio)),
    g: Math.round(rgb.g * (1 - ratio)),
    b: Math.round(rgb.b * (1 - ratio)),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => {
    const clamped = Math.max(0, Math.min(255, n));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate dynamic palette from any custom hex
export function generateThemeFromHex(customHex, name = 'Custom Tone') {
  if (!customHex || !customHex.startsWith('#')) {
    return DEFAULT_THEME;
  }

  // Check if it matches default bronze
  if (customHex.toLowerCase() === DEFAULT_THEME.primary.toLowerCase()) {
    return DEFAULT_THEME;
  }

  // Check if it matches existing preset
  const matchedPreset = THEME_PRESETS.find(
    (p) => p.primary.toLowerCase() === customHex.toLowerCase()
  );
  if (matchedPreset) return matchedPreset;

  const rgb = hexToRgb(customHex);
  const hoverRgb = blendWithBlack(rgb, 0.14);
  const darkRgb = blendWithBlack(rgb, 0.35);
  const lightRgb = blendWithWhite(rgb, 0.78);
  const softRgb = blendWithWhite(rgb, 0.90);
  const borderRgb = blendWithWhite(rgb, 0.68);
  const accentRgb = blendWithWhite(rgb, 0.15);

  return {
    id: `custom-${customHex.replace('#', '')}`,
    name,
    label: name,
    isDefault: false,
    isCustom: true,
    description: `Custom shade (${customHex})`,
    primary: customHex,
    hover: rgbToHex(hoverRgb),
    dark: rgbToHex(darkRgb),
    light: rgbToHex(lightRgb),
    soft: rgbToHex(softRgb),
    border: rgbToHex(borderRgb),
    accent: rgbToHex(accentRgb),
  };
}
