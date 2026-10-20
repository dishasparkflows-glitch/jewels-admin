import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  generateThemeFromHex,
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
    } catch (e) {
      // Fallback
    }
    return DEFAULT_THEME;
  });

  // Sidebar Position: 'left' | 'right'
  const [sidebarPosition, setSidebarPositionState] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_POS_KEY);
      if (saved === 'right' || saved === 'left') return saved;
    } catch (e) {}
    return 'left';
  });

  // Sidebar Open (On/Off): boolean
  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {}
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
    } catch (e) {}
  }, [sidebarPosition]);

  const toggleSidebarPosition = () => {
    setSidebarPosition((previous) => previous === 'left' ? 'right' : 'left');
  };

  const setSidebarOpen = (valueOrFn) => {
    setSidebarOpenState((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : Boolean(valueOrFn);
      try {
        localStorage.setItem(SIDEBAR_OPEN_KEY, String(next));
      } catch (e) {}
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

    // Set CSS custom properties on :root
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-primary-hover', currentTheme.hover);
    root.style.setProperty('--theme-primary-dark', currentTheme.dark);
    root.style.setProperty('--theme-primary-light', currentTheme.light);
    root.style.setProperty('--theme-primary-soft', currentTheme.soft);
    root.style.setProperty('--theme-primary-border', currentTheme.border);
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
      // When default theme is selected, remove overrides so original #8b6f4e classes operate natively
      styleEl.textContent = `
        :root {
          --theme-primary: ${DEFAULT_THEME.primary};
          --theme-primary-hover: ${DEFAULT_THEME.hover};
          --theme-primary-dark: ${DEFAULT_THEME.dark};
          --theme-primary-light: ${DEFAULT_THEME.light};
          --theme-primary-soft: ${DEFAULT_THEME.soft};
          --theme-primary-border: ${DEFAULT_THEME.border};
          --theme-sidebar-border: ${DEFAULT_THEME.accent};
        }
      `;
    } else {
      // Apply comprehensive overrides to theme the entire admin portal effortlessly
      styleEl.textContent = `
        :root {
          --theme-primary: ${currentTheme.primary};
          --theme-primary-hover: ${currentTheme.hover};
          --theme-primary-dark: ${currentTheme.dark};
          --theme-primary-light: ${currentTheme.light};
          --theme-primary-soft: ${currentTheme.soft};
          --theme-primary-border: ${currentTheme.border};
          --theme-sidebar-border: ${currentTheme.accent || currentTheme.primary};
        }

        /* Dynamic Theme Backgrounds */
        .bg-\\[\\#8b6f4e\\],
        .bg-\\[\\#8f6d43\\] {
          background-color: var(--theme-primary) !important;
        }

        .hover\\:bg-\\[\\#785e40\\]:hover,
        .hover\\:bg-\\[\\#7a5f3f\\]:hover,
        .hover\\:bg-\\[\\#8f6d43\\]:hover {
          background-color: var(--theme-primary-hover) !important;
        }

        /* Dynamic Theme Text */
        .text-\\[\\#8b6f4e\\],
        .text-\\[\\#8f6d43\\] {
          color: var(--theme-primary) !important;
        }

        .hover\\:text-\\[\\#8b6f4e\\]:hover,
        .hover\\:text-\\[\\#8f6d43\\]:hover {
          color: var(--theme-primary-hover) !important;
        }

        /* Dynamic Theme Borders */
        .border-\\[\\#8b6f4e\\],
        .border-\\[\\#8f6d43\\] {
          border-color: var(--theme-primary) !important;
        }

        .border-\\[\\#9c7849\\] {
          border-color: var(--theme-sidebar-border) !important;
        }

        .border-\\[\\#e8d9c2\\],
        .border-\\[\\#ecd9c2\\] {
          border-color: var(--theme-primary-border) !important;
        }

        /* Dynamic Subtle Backgrounds & Badges */
        .bg-\\[\\#f8f2eb\\],
        .bg-\\[\\#faf5ee\\],
        .bg-\\[\\#faf8f5\\],
        .bg-\\[\\#fbf4eb\\] {
          background-color: var(--theme-primary-soft) !important;
        }

        .bg-\\[\\#f4ece0\\] {
          background-color: var(--theme-primary-light) !important;
        }

        .badge-paid {
          background-color: var(--theme-primary-soft) !important;
          color: var(--theme-primary) !important;
          border-color: var(--theme-primary-border) !important;
        }

        /* Selection & Rings */
        .selection\\:bg-\\[\\#8b6f4e\\]::selection,
        ::selection {
          background-color: var(--theme-primary) !important;
          color: #ffffff !important;
        }

        .focus\\:ring-\\[\\#8f6d43\\]\\/30:focus {
          --tw-ring-color: var(--theme-primary-border) !important;
        }
      `;
    }
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
