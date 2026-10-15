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
  hover: '#785e40',
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
    id: 'sapphire',
    name: 'Royal Sapphire',
    label: 'Royal Sapphire',
    isDefault: false,
    description: 'Precious deep ocean navy blue',
    primary: '#1d4ed8',
    hover: '#1e40af',
    dark: '#172554',
    light: '#dbeafe',
    soft: '#eff6ff',
    border: '#bfdbfe',
    accent: '#3b82f6',
  },
  {
    id: 'ruby',
    name: 'Pigeon Ruby',
    label: 'Pigeon Ruby',
    isDefault: false,
    description: 'Vibrant crimson & Burmese ruby red',
    primary: '#be123c',
    hover: '#9f1239',
    dark: '#4c0519',
    light: '#ffe4e6',
    soft: '#fff1f2',
    border: '#fecdd3',
    accent: '#e11d48',
  },
  {
    id: 'rosegold',
    name: '18K Rose Gold',
    label: '18K Rose Gold',
    isDefault: false,
    description: 'Warm lustrous metallic copper glow',
    primary: '#b45309',
    hover: '#92400e',
    dark: '#451a03',
    light: '#fef3c7',
    soft: '#fffbeb',
    border: '#fde68a',
    accent: '#d97706',
  },
  {
    id: 'amethyst',
    name: 'Imperial Amethyst',
    label: 'Imperial Amethyst',
    isDefault: false,
    description: 'Majestic royal lavender & violet',
    primary: '#7e22ce',
    hover: '#6b21a8',
    dark: '#3b0764',
    light: '#f3e8ff',
    soft: '#faf5ff',
    border: '#e9d5ff',
    accent: '#a855f7',
  },
  {
    id: 'midnight',
    name: 'Midnight Onyx',
    label: 'Midnight Onyx',
    isDefault: false,
    description: 'Sleek modern minimalist charcoal noir',
    primary: '#18181b',
    hover: '#27272a',
    dark: '#09090b',
    light: '#f4f4f5',
    soft: '#fafafa',
    border: '#e4e4e7',
    accent: '#3f3f46',
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
    light: '#f1f5f9',
    soft: '#f8fafc',
    border: '#cbd5e1',
    accent: '#64748b',
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
  const lightRgb = blendWithWhite(rgb, 0.82);
  const softRgb = blendWithWhite(rgb, 0.94);
  const borderRgb = blendWithWhite(rgb, 0.72);
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
