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

/**
 * Generates a monochromatic tonal palette for charts & donuts from the active theme.
 */
export function getThemeChartPalette(theme = DEFAULT_THEME) {
  const baseHex = theme?.primary || DEFAULT_THEME.primary;
  const rgb = hexToRgb(baseHex);
  return [
    rgbToHex(blendWithBlack(rgb, 0.26)),
    baseHex,
    theme?.accent || rgbToHex(blendWithWhite(rgb, 0.22)),
    rgbToHex(blendWithWhite(rgb, 0.44)),
    rgbToHex(blendWithWhite(rgb, 0.64)),
    rgbToHex(blendWithWhite(rgb, 0.78)),
    rgbToHex(blendWithBlack(rgb, 0.42)),
    rgbToHex(blendWithWhite(rgb, 0.32)),
  ];
}

const PRIMARY_HEXES = [
  '#8b6f4e', '#8f6d43', '#8b6c3a', '#8a6d4b', '#8A6D4B', '#8c6d46',
  '#8c6536', '#8c6b45', '#85583f', '#855836', '#96744f', '#8b6f47',
  '#8d5b4c', '#9c7a4b', '#9c7849', '#a58054', '#a67c52', '#A67C52',
  '#c19b65', '#C19B65', '#9a724a', '#9A724A', '#9a6435', '#92704e',
  '#78532f', '#785b3a', '#785e40', '#785327', '#735839', '#704f2d',
  '#685034', '#b8946c', '#cbb393', '#a07c52', '#b38e63', '#7a6042',
];

const HOVER_HEXES = [
  '#785e40', '#785e41', '#785e42', '#7a5f3f', '#8f6d43', '#765a2d',
  '#765b3d', '#634b25', '#644d32', '#785b3a', '#785d3b', '#724a34',
  '#6f4828', '#7a5c36', '#7b5b33', '#7b5e39', '#7b5f3e', '#785936',
  '#78532f', '#785327', '#856543', '#8b6f4e', '#8b6c3a', '#8d5b4c',
  '#85583f', '#855836', '#8a6d4b', '#8c6d46', '#8c6b45', '#9a724a',
  '#9A724A', '#a0815e', '#725a3d', '#725a3f', '#735839', '#73583c',
  '#735a3d', '#6d4a27', '#bfa78a', '#685034',
];

const SOFT_LIGHT_BG_HEXES = [
  '#f8ede2', '#f4ece0', '#f4ece3', '#f6eee2', '#f6eee3', '#f6efe6',
  '#f5e6d3', '#f5eadc', '#f5efe6', '#f5efe8', '#F5EFE8', '#f7efe6',
  '#F7EFE6', '#f1e7da', '#f0e6d8', '#dfcfbb',
];

const SOFT_BG_HEXES = [
  '#faf5ee', '#faf5ed', '#faf5ef', '#faf6f0', '#faf6f1', '#faf7f2',
  '#FAF7F2', '#FAF9F6', '#faf9f7', '#faf3e8', '#faf3ea', '#faf4ed',
  '#FAF4ED', '#F6F1EA', '#FAF6F1', '#fbf4eb', '#fbf5ed', '#fbf6f0',
  '#fbf7f0', '#fbf7f2', '#fbf8f4', '#fbfaf8', '#fcf3e8', '#fcf5e5',
  '#fcf6ee', '#fcf9f4', '#fcfaf7', '#fdf3e7', '#fdf7e7', '#fdfbf7',
  '#fdfcfb', '#fef6ee', '#fef9ee', '#fffdfa', '#fffdfb', '#f7f3ed',
  '#faedd8', '#f7ecd9',
];

const SOFT_BORDER_HEXES = [
  '#cbb393', '#d8c8b2', '#d9c4a8', '#dfcfbd', '#e4d7c8', '#e5d7c3',
  '#e8d7be', '#e8d8c0', '#e8d9c2', '#e8dccb', '#e8ddce', '#e8ded1',
  '#e8ded3', '#E8DFC9', '#e8dfd3', '#e9dfd3', '#eadbcc', '#ebdcc8',
  '#ebdcc9', '#ebdccb', '#ebdccf', '#EBDDCB', '#ecd9c2', '#ecd9c6',
  '#ecdcc3', '#ecdccb', '#eedfcb', '#f2e2cf', '#f2e7db', '#f5e3cc',
  '#f5e3ce', '#f5ece1', '#e5ddd5',
];

const bracket = (val) => '[' + val + ']';

const tokenSel = (prefix, hexes, suffix = '', exclude = '') =>
  hexes.map((h) => `[class~="${prefix}-${bracket(h)}"]${exclude}${suffix}`).join(',\n        ');

const OPACITY_STEPS = [2, 5, 8, 10, 15, 20, 25, 30, 35, 40, 50, 60];

export function buildDynamicThemeCss(theme, rgb) {
  const layoutGuard = ':not(#admin-root-layout):not(body):not(html):not(main)';
  const sidebarAndLayoutGuard = `:not(#admin-sidebar)${layoutGuard}`;
  const opacityHexes = ['#8b6f4e', '#8b6c3a', '#8f6d43', '#8c6d46', '#85583f', '#855836', '#8d5b4c', '#a58054', '#92704e', '#8a6d4b', '#8c6536'];

  const opacityRules = OPACITY_STEPS.map((pct) => {
    const alpha = pct === 2 ? '0.03' : (pct / 100).toFixed(2);
    const bgSels = opacityHexes.flatMap((h) => [
      `[class~="bg-${bracket(h)}/${pct}"]${layoutGuard}`,
      `[class~="hover:bg-${bracket(h)}/${pct}"]:hover`,
    ]);
    if (pct === 2) bgSels.push(`[class~="bg-[#8b6f4e]/[0.02]"]${layoutGuard}`);
    const borderSels = opacityHexes.flatMap((h) => [
      `[class~="border-${bracket(h)}/${pct}"]`,
      `[class~="hover:border-${bracket(h)}/${pct}"]:hover`,
    ]);
    const ringSels = opacityHexes.flatMap((h) => [
      `[class~="ring-${bracket(h)}/${pct}"]`,
      `[class~="focus:ring-${bracket(h)}/${pct}"]:focus`,
    ]);
    return `
        ${bgSels.join(',\n        ')} {
          background-color: rgba(var(--theme-primary-rgb), ${alpha}) !important;
        }
        ${borderSels.join(',\n        ')} {
          border-color: rgba(var(--theme-primary-rgb), ${alpha}) !important;
        }
        ${ringSels.join(',\n        ')} {
          --tw-ring-color: rgba(var(--theme-primary-rgb), ${alpha}) !important;
        }`;
  }).join('\n');

  const softTranslucentBgSels = ['40', '50', '60', '70', '80', '90']
    .flatMap((pct) => [
      `[class~="bg-[#faf6f0]/${pct}"]${layoutGuard}`,
      `[class~="bg-[#faf5ee]/${pct}"]${layoutGuard}`,
      `[class~="bg-[#faf7f2]/${pct}"]${layoutGuard}`,
      `[class~="bg-[#FAF9F6]/${pct}"]${layoutGuard}`,
      `[class~="bg-[#FAF4ED]/${pct}"]${layoutGuard}`,
      `[class~="bg-[#f5e6d3]/${pct}"]${layoutGuard}`,
      `[class~="hover:bg-[#faf6f0]/${pct}"]:hover`,
      `[class~="hover:bg-[#faf7f2]/${pct}"]:hover`,
      `[class~="hover:bg-[#FAF9F6]/${pct}"]:hover`,
    ])
    .join(',\n        ');

  const softTranslucentBorderSels = ['50', '60', '70', '80']
    .flatMap((pct) => [
      `[class~="border-[#d9c4a8]/${pct}"]`,
      `[class~="border-[#ebdcc8]/${pct}"]`,
      `[class~="border-[#ebdccb]/${pct}"]`,
      `[class~="border-[#ebdccf]/${pct}"]`,
      `[class~="border-[#f5e3cc]/${pct}"]`,
    ])
    .join(',\n        ');

  const gradientFromSolid = ['#8b6c3a', '#8b6f4e', '#a07c52', '#b38e63', '#765a2d']
    .map((h) => `[class~="from-${bracket(h)}"]`)
    .join(',\n        ');
  const gradientToSolid = ['#765a2d', '#634b25', '#785e40', '#7a6042', '#8b6f4e']
    .map((h) => `[class~="to-${bracket(h)}"]`)
    .join(',\n        ');
  const gradientSoft = [
    '[class~="from-[#faf3e8]"]',
    '[class~="from-[#fbf9f6]"]',
    '[class~="via-[#f7ecd9]"]',
    '[class~="to-[#f7f3ed]"]',
    '[class~="to-[#faedd8]"]',
  ].join(',\n        ');

  return `
        :root {
          --theme-primary: ${theme.primary};
          --theme-primary-hover: ${theme.hover};
          --theme-primary-dark: ${theme.dark};
          --theme-primary-light: ${theme.light};
          --theme-primary-soft: ${theme.soft};
          --theme-primary-border: ${theme.border};
          --theme-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
          --theme-sidebar-border: ${theme.accent || theme.primary};
        }

        /* ─── Global Checkboxes & Radios ─── */
        input[type="checkbox"],
        input[type="radio"] {
          accent-color: var(--theme-primary) !important;
        }

        ${tokenSel('accent', PRIMARY_HEXES)} {
          accent-color: var(--theme-primary) !important;
        }

        /* ─── 1. Primary Solid Backgrounds ─── */
        ${tokenSel('bg', PRIMARY_HEXES, '', layoutGuard)} {
          background-color: var(--theme-primary) !important;
        }

        /* ─── 2. Hover Solid Backgrounds ─── */
        ${tokenSel('hover:bg', HOVER_HEXES, ':hover')} {
          background-color: var(--theme-primary-hover) !important;
        }

        /* ─── 3. Primary Texts & Icons ─── */
        ${tokenSel('text', PRIMARY_HEXES)} {
          color: var(--theme-primary) !important;
        }

        /* ─── 4. Hover Texts & Group-Hover Texts ─── */
        ${tokenSel('hover:text', HOVER_HEXES, ':hover')},
        .group:hover [class*="group-hover:text-[#8b6f4e]"],
        .group:hover [class*="group-hover:text-[#8f6d43]"],
        .group:hover [class*="group-hover:text-[#8b6c3a]"],
        .group:hover [class*="group-hover:text-[#9A724A]"],
        .group:hover [class*="group-hover:text-[#8a6d4b]"],
        .group:hover [class*="group-hover:text-[#8c6d46]"],
        .group:hover [class*="group-hover:text-[#85583f]"],
        .group:hover [class*="group-hover:text-\\[var\\(--theme-primary"] {
          color: var(--theme-primary-hover, var(--theme-primary)) !important;
        }

        .group:hover [class*="group-hover:bg-[#8f6d43]"],
        .group:hover [class*="group-hover:bg-[#8b6f4e]"],
        .group:hover [class*="group-hover:bg-\\[var\\(--theme-primary"] {
          background-color: var(--theme-primary) !important;
          border-color: var(--theme-primary) !important;
        }

        /* ─── 5. Primary Borders & Hover Borders ─── */
        ${tokenSel('border', PRIMARY_HEXES)} {
          border-color: var(--theme-primary) !important;
        }

        ${tokenSel('hover:border', [...PRIMARY_HEXES, ...HOVER_HEXES], ':hover')},
        .group:hover [class*="group-hover:border-[#8b6f4e]"],
        .group:hover [class*="group-hover:border-[#8f6d43]"],
        .group:hover [class*="group-hover:border-[#8b6c3a]"] {
          border-color: var(--theme-primary) !important;
        }

        /* ─── 6. SIDEBAR ACTIVE & HOVER ─── */
        #admin-sidebar .sidebar-item-active,
        #admin-sidebar a.sidebar-item-active,
        #admin-sidebar button.sidebar-item-active {
          background-color: rgba(var(--theme-primary-rgb), 0.22) !important;
          color: var(--theme-primary-dark, var(--theme-primary)) !important;
          border-color: rgba(var(--theme-primary-rgb), 0.38) !important;
          font-weight: 700 !important;
        }

        #admin-sidebar .sidebar-item-active svg {
          color: var(--theme-primary) !important;
        }

        #admin-sidebar .sidebar-item-inactive:hover {
          background-color: rgba(var(--theme-primary-rgb), 0.08) !important;
          color: var(--theme-primary) !important;
        }

        #admin-sidebar .sidebar-item-inactive:hover svg {
          color: var(--theme-primary) !important;
        }

        #admin-sidebar a.hover\\:bg-\\[\\#FAF6F1\\]:hover:not(.sidebar-item-active),
        #admin-sidebar button.hover\\:bg-\\[\\#FAF6F1\\]:hover:not(.sidebar-item-active),
        #admin-sidebar [class*="hover:bg-[#FAF6F1]"]:hover:not(.sidebar-item-active) {
          background-color: rgba(var(--theme-primary-rgb), 0.08) !important;
          color: var(--theme-primary) !important;
        }

        #admin-sidebar [class*="bg-[#F5EFE8]"],
        #admin-sidebar [class*="bg-[#f5efe8]"] {
          background-color: rgba(var(--theme-primary-rgb), 0.22) !important;
          color: var(--theme-primary-dark, var(--theme-primary)) !important;
        }

        /* ─── 7. SOFT TINTED BACKGROUNDS & HOVERS ─── */
        ${tokenSel('bg', SOFT_LIGHT_BG_HEXES, '', sidebarAndLayoutGuard)},
        ${tokenSel('hover:bg', [...SOFT_LIGHT_BG_HEXES, ...SOFT_BG_HEXES], ':hover')} {
          background-color: var(--theme-primary-light) !important;
        }

        ${tokenSel('bg', SOFT_BG_HEXES, '', sidebarAndLayoutGuard)},
        ${softTranslucentBgSels} {
          background-color: var(--theme-primary-soft) !important;
        }

        /* ─── 8. SOFT TINTED BORDERS ─── */
        ${tokenSel('border', SOFT_BORDER_HEXES)},
        ${softTranslucentBorderSels} {
          border-color: var(--theme-primary-border) !important;
        }

        /* ─── Dropdown Options ─── */
        [role="combobox"] ~ div [role="option"]:hover,
        [role="listbox"] [role="option"]:hover,
        [role="listbox"] button:hover {
          background-color: rgba(var(--theme-primary-rgb), 0.08) !important;
          color: var(--theme-primary) !important;
        }

        [role="listbox"] [role="option"][aria-selected="true"],
        [role="listbox"] button[aria-selected="true"] {
          background-color: rgba(var(--theme-primary-rgb), 0.12) !important;
          color: var(--theme-primary) !important;
        }

        [role="listbox"] span[class*="bg-[#9c7a4b]"],
        [role="listbox"] span[class*="bg-[#8b6f4e]"],
        [role="listbox"] span.bg-\\[\\#9c7a4b\\],
        [role="listbox"] [aria-selected="true"] span.absolute {
          background-color: var(--theme-primary) !important;
        }

        /* ─── FORMS & MODALS PROTECTION (Neutral Light Containers Stay Crisp White) ─── */
        .fixed.inset-0:not(#admin-sidebar) [class*="bg-[#faf8f5]"],
        .fixed.inset-0:not(#admin-sidebar) [class*="bg-[#FAF8F5]"],
        .fixed.inset-0:not(#admin-sidebar) [class*="bg-[#fcfbf9]"],
        .fixed.inset-0:not(#admin-sidebar) [class*="bg-[#f8f2eb]"],
        .fixed.inset-0:not(#admin-sidebar) .modal-header,
        [role="dialog"] [class*="bg-[#faf8f5]"],
        [role="dialog"] [class*="bg-[#FAF8F5]"],
        [role="dialog"] [class*="bg-[#fcfbf9]"],
        [role="dialog"] [class*="bg-[#f8f2eb]"],
        form [class*="bg-[#faf8f5]"],
        form [class*="bg-[#fcfbf9]"],
        dialog [class*="bg-[#faf8f5]"],
        dialog [class*="bg-[#fcfbf9]"] {
          background-color: #ffffff !important;
        }

        /* ─── 9. OPACITY-BASED UTILITY CLASSES ─── */
        ${opacityRules}

        /* ─── 10. RINGS & FOCUS BORDERS ─── */
        ${tokenSel('ring', PRIMARY_HEXES)} {
          --tw-ring-color: var(--theme-primary) !important;
        }

        ${tokenSel('focus:ring', PRIMARY_HEXES, ':focus')} {
          --tw-ring-color: rgba(var(--theme-primary-rgb), 0.25) !important;
        }

        ${tokenSel('focus:border', PRIMARY_HEXES, ':focus')},
        select:focus {
          border-color: var(--theme-primary) !important;
        }

        /* ─── 10b. SWITCHES ─── */
        button[role="switch"][aria-checked="true"],
        [role="switch"][aria-checked="true"],
        button[role="switch"].bg-emerald-500,
        button[role="switch"].bg-emerald-600,
        button[role="switch"].bg-green-500,
        button[role="switch"].bg-green-600,
        button[role="switch"][class*="bg-emerald-"],
        button[role="switch"][class*="bg-green-"],
        .toggle-switch-active,
        button:has(> span[class*="translate-x-3"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        button:has(> span[class*="translate-x-3.5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        button:has(> span[class*="translate-x-4"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        button:has(> span[class*="translate-x-4.5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        button:has(> span[class*="translate-x-5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        button:has(> span[class*="translate-x-6"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> span[class*="translate-x-3"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> span[class*="translate-x-3.5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> span[class*="translate-x-4"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> span[class*="translate-x-4.5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> span[class*="translate-x-5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> span[class*="translate-x-6"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> div[class*="translate-x-4"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> div[class*="translate-x-5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        div:has(> div[class*="translate-x-6"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        span:has(> span[class*="translate-x-4"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        span:has(> span[class*="translate-x-5"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        span:has(> span[class*="translate-x-6"]):not(.bg-stone-300):not(.bg-stone-200):not(.bg-stone-400),
        .peer:checked ~ div[class*="peer-checked:bg-"],
        .peer:checked + div[class*="peer-checked:bg-"],
        .peer:checked ~ [class*="peer-checked:bg-[#8b6f4e]"],
        .peer:checked ~ [class*="peer-checked:bg-[#8f6d43]"],
        .peer:checked ~ [class*="peer-checked:bg-[#8b6c3a]"],
        .peer:checked ~ [class*="peer-checked:bg-[#8c6d46]"],
        .peer:checked ~ [class*="peer-checked:bg-[#85583f]"],
        .peer:checked ~ [class*="peer-checked:bg-[#855836]"],
        [class*="peer-checked:bg-[#8b6f4e]"]:checked,
        [class*="peer-checked:bg-[#8c6d46]"]:checked,
        [class*="peer-checked:bg-[#85583f]"]:checked {
          background-color: var(--theme-primary) !important;
        }

        /* ─── 11. GRADIENT BUTTONS & BANNERS ─── */
        ${gradientFromSolid} {
          --tw-gradient-from: var(--theme-primary) !important;
          --tw-gradient-to: var(--theme-primary-hover) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        ${gradientToSolid} {
          --tw-gradient-to: var(--theme-primary-dark) !important;
        }
        ${gradientSoft} {
          --tw-gradient-from: var(--theme-primary-soft) !important;
          --tw-gradient-to: var(--theme-primary-light) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--theme-primary-soft), var(--tw-gradient-to) !important;
        }

        /* ─── 12. SELECTION, PAGE BG & SCROLLBAR ─── */
        ::selection {
          background-color: var(--theme-primary) !important;
          color: #ffffff !important;
        }

        html,
        body,
        #root,
        #admin-root-layout,
        .admin-page-bg,
        #admin-root-layout > div:not(.mobile-sidebar-backdrop):not(.fixed) {
          background-color: #f8fafc !important;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--theme-primary) !important;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--theme-primary-dark) !important;
        }
        .sidebar-scrollbar {
          scrollbar-color: var(--theme-primary) #f1f5f9 !important;
        }
      `;
}
