import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  generateThemeFromHex,
  hexToRgb,
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
    const rgb = hexToRgb(currentTheme.primary);

    // Set CSS custom properties on :root
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-primary-hover', currentTheme.hover);
    root.style.setProperty('--theme-primary-dark', currentTheme.dark);
    root.style.setProperty('--theme-primary-light', currentTheme.light);
    root.style.setProperty('--theme-primary-soft', currentTheme.soft);
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

        /* ─── SIDEBAR ACTIVE & HOVER (Default Bronze) ─── */
        #admin-sidebar .sidebar-item-active,
        #admin-sidebar a.sidebar-item-active,
        #admin-sidebar button.sidebar-item-active {
          background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14) !important;
          color: ${DEFAULT_THEME.primary} !important;
          border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.32) !important;
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
      `;
    } else {
      styleEl.textContent = `
        :root {
          --theme-primary: ${currentTheme.primary};
          --theme-primary-hover: ${currentTheme.hover};
          --theme-primary-dark: ${currentTheme.dark};
          --theme-primary-light: ${currentTheme.light};
          --theme-primary-soft: ${currentTheme.soft};
          --theme-primary-border: ${currentTheme.border};
          --theme-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
          --theme-sidebar-border: ${currentTheme.accent || currentTheme.primary};
        }

        /* ─── Global Checkboxes & Radios ─── */
        input[type="checkbox"],
        input[type="radio"] {
          accent-color: var(--theme-primary) !important;
        }

        /* ─── 1. Primary Solid Backgrounds (Tabs, Buttons, Badges, Add Actions) ─── */
        [class~="bg-[#8b6f4e]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#8f6d43]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#8b6c3a]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#8a6d4b]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#8c6d46]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#85583f]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#855836]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#96744f]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#8b6f47]"]:not(#admin-root-layout):not(body):not(html):not(main),
        [class~="bg-[#8d5b4c]"]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#8b6f4e\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#8f6d43\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#8b6c3a\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#8a6d4b\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#8c6d46\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#85583f\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#855836\\]:not(#admin-root-layout):not(body):not(html):not(main),
        .bg-\\[\\#96744f\\]:not(#admin-root-layout):not(body):not(html):not(main) {
          background-color: var(--theme-primary) !important;
        }

        /* ─── 2. Hover Backgrounds for Solid Buttons ─── */
        [class*="hover:bg-[#785e40]"]:hover,
        [class*="hover:bg-[#7a5f3f]"]:hover,
        [class*="hover:bg-[#8f6d43]"]:hover,
        [class*="hover:bg-[#765a2d]"]:hover,
        [class*="hover:bg-[#634b25]"]:hover,
        [class*="hover:bg-[#644d32]"]:hover,
        [class*="hover:bg-[#785b3a]"]:hover,
        [class*="hover:bg-[#785d3b]"]:hover,
        [class*="hover:bg-[#724a34]"]:hover,
        [class*="hover:bg-[#6f4828]"]:hover,
        [class*="hover:bg-[#7a5c36]"]:hover,
        [class*="hover:bg-[#7b5b33]"]:hover,
        [class*="hover:bg-[#7b5e39]"]:hover,
        [class*="hover:bg-[#7b5f3e]"]:hover,
        [class*="hover:bg-[#785e42]"]:hover,
        [class*="hover:bg-[#78532f]"]:hover,
        [class*="hover:bg-[#785327]"]:hover,
        [class*="hover:bg-[#856543]"]:hover,
        .hover\\:bg-\\[\\#785e40\\]:hover,
        .hover\\:bg-\\[\\#7a5f3f\\]:hover,
        .hover\\:bg-\\[\\#8f6d43\\]:hover,
        .hover\\:bg-\\[\\#765a2d\\]:hover,
        .hover\\:bg-\\[\\#634b25\\]:hover,
        .hover\\:bg-\\[\\#644d32\\]:hover,
        .hover\\:bg-\\[\\#785b3a\\]:hover,
        .hover\\:bg-\\[\\#785d3b\\]:hover,
        .hover\\:bg-\\[\\#724a34\\]:hover,
        .hover\\:bg-\\[\\#7a5c36\\]:hover,
        .hover\\:bg-\\[\\#7b5b33\\]:hover,
        .hover\\:bg-\\[\\#7b5e39\\]:hover,
        .hover\\:bg-\\[\\#7b5f3e\\]:hover,
        .hover\\:bg-\\[\\#785e42\\]:hover,
        .hover\\:bg-\\[\\#78532f\\]:hover,
        .hover\\:bg-\\[\\#856543\\]:hover {
          background-color: var(--theme-primary-hover) !important;
        }

        /* ─── 3. Primary Texts & Icons ─── */
        [class*="text-[#8b6f4e]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#8f6d43]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#8b6c3a]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#8a6d4b]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#8A6D4B]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#8c6d46]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#85583f]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#855836]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#96744f]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#9a724a]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#9A724A]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#a67c52]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#A67C52]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#c19b65]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#C19B65]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#9c7849]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#9a6435]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#704f2d]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#735839]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        [class*="text-[#785327]"]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#8b6f4e\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#8f6d43\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#8b6c3a\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#8a6d4b\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#8c6d46\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#85583f\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#855836\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]),
        .text-\\[\\#9a724a\\]:not([class*="hover:text-"]):not([class*="group-hover:text-"]) {
          color: var(--theme-primary) !important;
        }

        /* ─── 4. Hover Texts ─── */
        [class*="hover:text-[#8b6f4e]"]:hover,
        [class*="hover:text-[#8f6d43]"]:hover,
        [class*="hover:text-[#8b6c3a]"]:hover,
        [class*="hover:text-[#785e40]"]:hover,
        [class*="hover:text-[#8a6d4b]"]:hover,
        [class*="hover:text-[#9a724a]"]:hover,
        [class*="hover:text-[#a0815e]"]:hover,
        [class*="hover:text-[#8c6d46]"]:hover,
        [class*="hover:text-[#85583f]"]:hover,
        [class*="hover:text-[#855836]"]:hover,
        .hover\\:text-\\[\\#8b6f4e\\]:hover,
        .hover\\:text-\\[\\#8f6d43\\]:hover,
        .hover\\:text-\\[\\#8b6c3a\\]:hover,
        .hover\\:text-\\[\\#785e40\\]:hover,
        .hover\\:text-\\[\\#8c6d46\\]:hover,
        .hover\\:text-\\[\\#85583f\\]:hover,
        .hover\\:text-\\[\\#855836\\]:hover,
        .group:hover [class*="group-hover:text-[#8b6f4e]"],
        .group:hover [class*="group-hover:text-[#8b6c3a]"],
        .group:hover [class*="group-hover:text-[#9A724A]"],
        .group:hover [class*="group-hover:text-[#8a6d4b]"],
        .group:hover [class*="group-hover:text-[#8c6d46]"],
        .group:hover [class*="group-hover:text-[#85583f]"] {
          color: var(--theme-primary-hover) !important;
        }

        /* ─── 5. Borders & Hover Borders ─── */
        [class*="border-[#8b6f4e]"],
        [class*="border-[#8f6d43]"],
        [class*="border-[#8b6c3a]"],
        [class*="border-[#8c6d46]"],
        [class*="border-[#85583f]"],
        [class*="border-[#855836]"],
        [class*="border-[#9c7849]"],
        [class*="border-[#9a724a]"],
        [class*="border-[#a67c52]"],
        .border-\\[\\#8b6f4e\\],
        .border-\\[\\#8f6d43\\],
        .border-\\[\\#8b6c3a\\],
        .border-\\[\\#8c6d46\\],
        .border-\\[\\#85583f\\],
        .border-\\[\\#855836\\] {
          border-color: var(--theme-primary) !important;
        }

        [class*="hover:border-[#8b6f4e]"]:hover,
        [class*="hover:border-[#8f6d43]"]:hover,
        [class*="hover:border-[#8b6c3a]"]:hover,
        [class*="hover:border-[#8c6d46]"]:hover,
        [class*="hover:border-[#85583f]"]:hover,
        [class*="hover:border-[#855836]"]:hover,
        .hover\\:border-\\[\\#8b6f4e\\]:hover,
        .hover\\:border-\\[\\#8f6d43\\]:hover,
        .hover\\:border-\\[\\#8b6c3a\\]:hover,
        .hover\\:border-\\[\\#8c6d46\\]:hover,
        .hover\\:border-\\[\\#85583f\\]:hover,
        .hover\\:border-\\[\\#855836\\]:hover,
        .group:hover [class*="group-hover:border-[#8b6f4e]"],
        .group:hover [class*="group-hover:border-[#8b6c3a]"] {
          border-color: var(--theme-primary) !important;
        }

        [class*="border-[#e8d9c2]"],
        [class*="border-[#ecd9c2]"],
        [class*="border-[#e8ddce]"],
        [class*="border-[#e8ded1]"],
        [class*="border-[#ede8e1]"],
        [class*="border-[#EDE8E1]"],
        [class*="border-[#ebdcc8]"],
        [class*="border-[#ebdcc9]"],
        [class*="border-[#ebdccb]"],
        [class*="border-[#d8c8b2]"],
        [class*="border-[#f2e7db]"],
        .border-\\[\\#e8d9c2\\],
        .border-\\[\\#ecd9c2\\],
        .border-\\[\\#e8ddce\\],
        .border-\\[\\#e8ded1\\],
        .border-\\[\\#ede8e1\\] {
          border-color: var(--theme-primary-border) !important;
        }

        /* ─── 6. SIDEBAR ACTIVE & HOVER (High Contrast, Luxury Theme-Matched) ─── */
        #admin-sidebar .sidebar-item-active,
        #admin-sidebar a.sidebar-item-active,
        #admin-sidebar button.sidebar-item-active {
          background-color: rgba(var(--theme-primary-rgb), 0.14) !important;
          color: var(--theme-primary) !important;
          border-color: rgba(var(--theme-primary-rgb), 0.32) !important;
          font-weight: 700 !important;
        }

        #admin-sidebar .sidebar-item-active svg {
          color: var(--theme-primary) !important;
        }

        #admin-sidebar .sidebar-item-inactive:hover {
          background-color: rgba(var(--theme-primary-rgb), 0.07) !important;
          color: var(--theme-primary) !important;
        }

        #admin-sidebar .sidebar-item-inactive:hover svg {
          color: var(--theme-primary) !important;
        }

        #admin-sidebar a.hover\\:bg-\\[\\#FAF6F1\\]:hover:not(.sidebar-item-active),
        #admin-sidebar button.hover\\:bg-\\[\\#FAF6F1\\]:hover:not(.sidebar-item-active),
        #admin-sidebar [class*="hover:bg-[#FAF6F1]"]:hover:not(.sidebar-item-active) {
          background-color: rgba(var(--theme-primary-rgb), 0.07) !important;
          color: var(--theme-primary) !important;
        }

        #admin-sidebar [class*="bg-[#F5EFE8]"],
        #admin-sidebar [class*="bg-[#f5efe8]"] {
          background-color: rgba(var(--theme-primary-rgb), 0.14) !important;
          color: var(--theme-primary) !important;
        }

        /* ─── 7. DROPDOWNS: HOVER, SELECTED, LISTBOX OPTIONS ─── */
        [class*="bg-[#f4eee4]"],
        [class*="bg-[#faf6f0]"],
        .bg-\\[\\#f4eee4\\],
        .bg-\\[\\#faf6f0\\] {
          background-color: rgba(var(--theme-primary-rgb), 0.12) !important;
          color: var(--theme-primary) !important;
        }

        [class*="hover:bg-[#fbf9f6]"]:hover,
        [class*="hover:text-[#8f6d43]"]:hover,
        .hover\\:bg-\\[\\#fbf9f6\\]:hover {
          background-color: rgba(var(--theme-primary-rgb), 0.07) !important;
          color: var(--theme-primary) !important;
        }

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

        [class*="ring-[#8f6d43]"],
        .ring-\\[\\#8f6d43\\] {
          --tw-ring-color: rgba(var(--theme-primary-rgb), 0.3) !important;
        }

        /* ─── 8. SUBTLE BACKGROUNDS & HOVERS ANYWHERE ─── */
        [class*="bg-[#f8f2eb]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#faf5ee]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#faf8f5]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#FAF8F5]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#fbf4eb]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#faf3e8]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#faf4ed]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        [class*="bg-[#faf6f1]"]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        .bg-\\[\\#f8f2eb\\]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        .bg-\\[\\#faf5ee\\]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        .bg-\\[\\#faf8f5\\]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        .bg-\\[\\#FAF8F5\\]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        .bg-\\[\\#fbf4eb\\]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]),
        .bg-\\[\\#faf3e8\\]:not(.bg-white):not([class*="bg-white"]):not([class*="hover:"]) {
          background-color: var(--theme-primary-soft) !important;
        }

        [class*="hover:bg-[#FAF8F5]"]:hover,
        [class*="hover:bg-[#faf8f5]"]:hover,
        [class*="hover:bg-[#faf5ee]"]:hover,
        [class*="hover:bg-[#f8f2eb]"]:hover,
        [class*="hover:bg-[#fbf4eb]"]:hover,
        [class*="hover:bg-[#faf3e8]"]:hover,
        [class*="hover:bg-[#f4eee4]"]:hover {
          background-color: var(--theme-primary-soft) !important;
        }

        [class*="bg-[#f4ece0]"],
        .bg-\\[\\#f4ece0\\] {
          background-color: var(--theme-primary-light) !important;
        }

        /* ─── 9. OPACITY-BASED UTILITY CLASSES ─── */
        [class*="bg-[#8b6f4e]/10"],
        [class*="bg-[#8b6c3a]/10"],
        [class*="bg-[#8f6d43]/10"],
        [class*="bg-[#8c6d46]/10"],
        [class*="bg-[#85583f]/10"],
        [class*="bg-[#855836]/10"],
        .bg-\\[\\#8b6f4e\\]\\/10,
        .bg-\\[\\#8b6c3a\\]\\/10 {
          background-color: rgba(var(--theme-primary-rgb), 0.10) !important;
        }
        [class*="bg-[#85583f]/5"] {
          background-color: rgba(var(--theme-primary-rgb), 0.06) !important;
        }
        [class*="bg-[#8b6f4e]/15"],
        [class*="bg-[#8b6c3a]/15"],
        [class*="bg-[#8c6d46]/15"],
        [class*="bg-[#85583f]/15"],
        .bg-\\[\\#8b6c3a\\]\\/15 {
          background-color: rgba(var(--theme-primary-rgb), 0.15) !important;
        }
        [class*="bg-[#8b6f4e]/20"],
        [class*="bg-[#8b6c3a]/20"],
        [class*="bg-[#8c6d46]/20"],
        [class*="bg-[#85583f]/20"],
        .bg-\\[\\#8b6f4e\\]\\/20,
        .bg-\\[\\#8b6c3a\\]\\/20 {
          background-color: rgba(var(--theme-primary-rgb), 0.20) !important;
        }
        [class*="bg-[#8b6c3a]/30"],
        [class*="bg-[#8b6f4e]/30"],
        [class*="bg-[#85583f]/30"],
        .bg-\\[\\#8b6c3a\\]\\/30 {
          background-color: rgba(var(--theme-primary-rgb), 0.30) !important;
        }

        [class*="border-[#8b6f4e]/20"],
        [class*="border-[#8b6c3a]/20"],
        [class*="border-[#8f6d43]/20"],
        [class*="border-[#85583f]/20"],
        .border-\\[\\#8b6f4e\\]\\/20,
        .border-\\[\\#8b6c3a\\]\\/20 {
          border-color: rgba(var(--theme-primary-rgb), 0.20) !important;
        }
        [class*="border-[#8b6f4e]/30"],
        [class*="border-[#8b6c3a]/30"],
        [class*="border-[#85583f]/30"],
        .border-\\[\\#8b6f4e\\]\\/30,
        .border-\\[\\#8b6c3a\\]\\/30 {
          border-color: rgba(var(--theme-primary-rgb), 0.30) !important;
        }

        /* ─── 10. RINGS & FOCUS RINGS ─── */
        [class*="ring-[#8b6f4e]"],
        [class*="ring-[#8b6c3a]"],
        [class*="ring-[#8f6d43]"],
        [class*="ring-[#8c6d46]"],
        [class*="ring-[#85583f]"],
        .ring-\\[\\#8b6f4e\\],
        .ring-\\[\\#8b6c3a\\],
        .ring-\\[\\#8f6d43\\],
        [class*="focus:ring-[#8b6f4e]"]:focus,
        [class*="focus:ring-[#8b6c3a]"]:focus,
        [class*="focus:ring-[#8f6d43]"]:focus,
        [class*="focus:ring-[#8c6d46]"]:focus,
        [class*="focus:ring-[#85583f]"]:focus,
        .focus\\:ring-\\[\\#8b6f4e\\]:focus,
        .focus\\:ring-\\[\\#8b6c3a\\]:focus,
        .focus\\:ring-\\[\\#8f6d43\\]:focus,
        [class*="focus:border-[#8b6f4e]"]:focus,
        [class*="focus:border-[#8b6c3a]"]:focus,
        [class*="focus:border-[#8c6d46]"]:focus,
        [class*="focus:border-[#85583f]"]:focus,
        select:focus {
          --tw-ring-color: rgba(var(--theme-primary-rgb), 0.25) !important;
          border-color: var(--theme-primary) !important;
        }

        /* ─── 10b. SWITCHES & CHECKBOXES (Peer Checked) ─── */
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

        /* ─── 11. CHECKBOXES & RADIOS ─── */
        input[type="checkbox"]:checked,
        input[type="radio"]:checked,
        [class*="accent-[#8b6f4e]"],
        [class*="accent-[#8b6c3a]"],
        .accent-\\[\\#8b6f4e\\],
        .accent-\\[\\#8b6c3a\\] {
          accent-color: var(--theme-primary) !important;
        }

        /* ─── 12. GRADIENT BUTTONS ─── */
        [class*="from-[#8b6c3a]"],
        [class*="from-[#8b6f4e]"],
        .from-\\[\\#8b6c3a\\],
        .from-\\[\\#8b6f4e\\] {
          --tw-gradient-from: var(--theme-primary) !important;
          --tw-gradient-to: var(--theme-primary-hover) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        [class*="to-[#765a2d]"],
        [class*="to-[#634b25]"],
        [class*="to-[#785e40]"],
        .to-\\[\\#765a2d\\],
        .to-\\[\\#634b25\\],
        .to-\\[\\#785e40\\] {
          --tw-gradient-to: var(--theme-primary-dark) !important;
        }

        /* ─── 13. SELECTION ─── */
        ::selection {
          background-color: var(--theme-primary) !important;
          color: #ffffff !important;
        }

        /* ─── 14. ROOT & PAGE BACKGROUND SAFEGUARD (Preserve clean luxury default background) ─── */
        html,
        body,
        #root,
        #admin-root-layout,
        .admin-page-bg,
        #admin-root-layout > div {
          background-color: #fbfaf8 !important;
        }
      `;
    }

    try {
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: currentTheme }));
    } catch (e) {}
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
