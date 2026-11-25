import { createContext, useContext, useState, useEffect } from 'react';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  generateThemeFromHex,
  hexToRgb,
  buildDynamicThemeCss,
} from '../utils/themeUtils';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const STORAGE_KEY = 'neirah_admin_portal_theme';
const SIDEBAR_POS_KEY = 'neirah_admin_sidebar_position';
const SIDEBAR_OPEN_KEY = 'neirah_admin_sidebar_open';

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'default') return DEFAULT_THEME;
        if (parsed.isCustom && parsed.primary) {
          return generateThemeFromHex(parsed.primary, parsed.name || 'Custom Theme');
        }
        const preset = THEME_PRESETS.find((p) => p.id === parsed.id);
        if (preset) return preset;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_THEME;
  });

  // Sidebar Position: 'left' | 'right'
  const [sidebarPosition, setSidebarPositionState] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_POS_KEY);
      if (saved === 'right' || saved === 'left') return saved;
    } catch {}
    return 'left';
  });

  // Sidebar Open (On/Off): boolean
  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const handleChange = () => {
      setIsMobileViewport(query.matches);
      setMobileSidebarOpen(false);
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const setSidebarPosition = (pos) => {
    setSidebarPositionState((previous) => {
      const requested = typeof pos === 'function' ? pos(previous) : pos;
      return requested === 'right' ? 'right' : 'left';
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_POS_KEY, sidebarPosition);
    } catch {}
  }, [sidebarPosition]);

  const toggleSidebarPosition = () => {
    setSidebarPosition((previous) => previous === 'left' ? 'right' : 'left');
  };

  const setSidebarOpen = (valueOrFn) => {
    setSidebarOpenState((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : Boolean(valueOrFn);
      try {
        localStorage.setItem(SIDEBAR_OPEN_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  // Apply theme to CSS variables and dynamic overrides
  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(currentTheme.primary);

    // Set CSS custom properties on :root
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-primary-hover', currentTheme.hover);
    root.style.setProperty('--theme-primary-dark', currentTheme.dark);
    root.style.setProperty('--theme-primary-light', currentTheme.light);
    root.style.setProperty('--theme-primary-soft', currentTheme.soft);
    root.style.setProperty('--theme-primary-row-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
    root.style.setProperty('--theme-primary-border', currentTheme.border);
    root.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty(
      '--theme-sidebar-border',
      currentTheme.accent || currentTheme.primary
    );

    // Dynamic style tag
    let styleEl = document.getElementById('portal-dynamic-theme-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'portal-dynamic-theme-style';
      document.head.appendChild(styleEl);
    }

    if (currentTheme.isDefault) {
      styleEl.textContent = `
        :root {
          --theme-primary: ${DEFAULT_THEME.primary};
          --theme-primary-hover: ${DEFAULT_THEME.hover};
          --theme-primary-dark: ${DEFAULT_THEME.dark};
          --theme-primary-light: ${DEFAULT_THEME.light};
          --theme-primary-soft: ${DEFAULT_THEME.soft};
          --theme-primary-border: ${DEFAULT_THEME.border};
          --theme-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
          --theme-sidebar-border: ${DEFAULT_THEME.accent};
        }

        /* ─── Global Checkboxes & Radios ─── */
        input[type="checkbox"],
        input[type="radio"] {
          accent-color: var(--theme-primary) !important;
        }

        /* ─── Global On/Off Toggle Switches (User Selected Theme Color) ─── */
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

        /* ─── SIDEBAR ACTIVE & HOVER (Default Bronze) ─── */
        #admin-sidebar .sidebar-item-active,
        #admin-sidebar a.sidebar-item-active,
        #admin-sidebar button.sidebar-item-active {
          background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22) !important;
          color: ${DEFAULT_THEME.dark} !important;
          border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38) !important;
          font-weight: 700 !important;
        }

        #admin-sidebar .sidebar-item-active svg {
          color: ${DEFAULT_THEME.primary} !important;
        }

        #admin-sidebar .sidebar-item-inactive:hover {
          background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.07) !important;
          color: ${DEFAULT_THEME.primary} !important;
        }

        #admin-sidebar .sidebar-item-inactive:hover svg {
          color: ${DEFAULT_THEME.primary} !important;
        }

        table tbody tr:has(td:not([colspan])):hover {
          background-color: var(--theme-primary-row-hover, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)) !important;
        }
      `;
    } else {
      styleEl.textContent = buildDynamicThemeCss(currentTheme, rgb);
    }

    try {
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: currentTheme }));
    } catch {}
  }, [currentTheme]);

  const selectTheme = (themeId) => {
    if (themeId === 'default' || !themeId) {
      setCurrentTheme(DEFAULT_THEME);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THEME));
      return DEFAULT_THEME;
    }

    const preset = THEME_PRESETS.find((p) => p.id === themeId);
    if (preset) {
      setCurrentTheme(preset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
      return preset;
    }

    return currentTheme;
  };

  const selectCustomColor = (hex, name = 'Custom Tone') => {
    if (!hex) return;
    if (hex.toLowerCase() === DEFAULT_THEME.primary.toLowerCase()) {
      return selectTheme('default');
    }
    const customTheme = generateThemeFromHex(hex, name);
    setCurrentTheme(customTheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTheme));
    return customTheme;
  };

  const resetToDefault = () => {
    setCurrentTheme(DEFAULT_THEME);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THEME));
    return DEFAULT_THEME;
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        presets: THEME_PRESETS,
        defaultTheme: DEFAULT_THEME,
        selectTheme,
        selectCustomColor,
        resetToDefault,
        isDefault: currentTheme.isDefault,
        sidebarPosition,
        setSidebarPosition,
        toggleSidebarPosition,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        isMobileViewport,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
