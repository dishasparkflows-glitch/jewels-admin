import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { navSections } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { getMediaUrl } from '../../utils/imageUrl';
import { hexToRgb } from '../../utils/themeUtils';
import {
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChevronLeft,
  HiOutlineLogout,
  HiOutlineSwitchHorizontal,
  HiOutlineX,
} from 'react-icons/hi';

const Sidebar = ({ isOpen: propIsOpen, mobileOpen: propMobileOpen, onMobileClose: propOnMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarPosition,
    toggleSidebarPosition,
    isMobileViewport,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    currentTheme,
  } = useTheme();

  const isOpen = propIsOpen !== undefined ? propIsOpen : sidebarOpen;
  const mobileOpen = propMobileOpen !== undefined ? propMobileOpen : mobileSidebarOpen;
  const onMobileClose = propOnMobileClose || (() => setMobileSidebarOpen(false));
  const isRight = sidebarPosition === 'right';
  const isVisible = isMobileViewport ? mobileOpen : isOpen;

  const themeRgb = hexToRgb(currentTheme?.primary || '#8b6f4e');
  const activeBg = `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.22)`;
  const activeBorder = `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.38)`;
  const activeGlow = `0 0 10px rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.55)`;
  const activeShadow = `0 1px 3px rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.14)`;
  const activeParentBg = `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.10)`;

  // Only open catalog submenu by default; other submenus remain closed
  const [openSubmenus, setOpenSubmenus] = useState({
    catalog: true,
  });

  const [brandLogo, setBrandLogo] = useState({ desktop: '', mobile: '' });

  useEffect(() => {
    api
      .get('/settings')
      .then(({ data }) => {
        const settings = data?.data || {};
        setBrandLogo({
          desktop: getMediaUrl(settings.logoImage?.url),
          mobile: getMediaUrl(settings.mobileLogoImage?.url),
        });
      })
      .catch(() => {});
  }, []);

  const checkIsChildActive = (childPath) => {
    return (
      location.pathname === childPath ||
      (childPath !== '/' && location.pathname.startsWith(childPath)) ||
      (childPath === '/catalog/jewelry-products' &&
        (location.pathname === '/catalog/jewelry-products' ||
          location.pathname.startsWith('/catalog/jewelry-products') ||
          location.pathname === '/catalog/add-jewelry-product' ||
          location.pathname === '/add-jewelry-product')) ||
      (childPath === '/catalog/silver-products' &&
        (location.pathname === '/catalog/silver-products' ||
          location.pathname.startsWith('/catalog/silver-products'))) ||
      ((childPath === '/catalog/ornate-products' || childPath === '/collections') &&
        (location.pathname === '/catalog/ornate-products' ||
          location.pathname.startsWith('/catalog/ornate-products') ||
          location.pathname === '/ornate-products' ||
          location.pathname.startsWith('/ornate-products') ||
          location.pathname === '/collections' ||
          location.pathname.startsWith('/collections'))) ||
      (childPath === '/catalog/categories' &&
        (location.pathname === '/catalog/categories' ||
          location.pathname.startsWith('/catalog/categories') ||
          location.pathname === '/categories')) ||
      ((childPath === '/gallery' || childPath === '/media-gallery' || childPath === '/catalog/gallery') &&
        (location.pathname === '/gallery' ||
          location.pathname.startsWith('/gallery') ||
          location.pathname === '/media-gallery' ||
          location.pathname === '/catalog/gallery')) ||
      (childPath === '/catalog/navigation-menus' &&
        (location.pathname === '/catalog/navigation-menus' ||
          location.pathname === '/navigation-menus')) ||
      (childPath === '/pricing-hub/metal-rates' &&
        (location.pathname === '/pricing-hub/metal-rates' ||
          location.pathname === '/metal-rates' ||
          location.pathname === '/goldprice')) ||
      (childPath === '/pricing-hub/diamond-rates' &&
        (location.pathname === '/pricing-hub/diamond-rates' ||
          location.pathname === '/diamondprice' ||
          location.pathname === '/diamond-price' ||
          location.pathname === '/diamond-rates')) ||
      (childPath === '/currencies' &&
        (location.pathname === '/pricing-hub/currencies' || location.pathname === '/currencies')) ||
      (childPath === '/metal-purity' &&
        (location.pathname === '/product-config/metal-purity' || location.pathname === '/metal-purity')) ||
      (childPath === '/metal-color' &&
        (location.pathname === '/product-config/metal-color' || location.pathname === '/metal-color')) ||
      (childPath === '/sizes' &&
        (location.pathname === '/product-config/sizes' || location.pathname === '/sizes')) ||
      (childPath === '/vto-masters' &&
        (location.pathname === '/product-config/vto-masters' || location.pathname === '/vto-masters')) ||
      (childPath === '/diamond-types' &&
        (location.pathname === '/diamond-config/types' || location.pathname === '/diamond-types')) ||
      (childPath === '/diamond-shapes' &&
        (location.pathname === '/diamond-config/shapes' || location.pathname === '/diamond-shapes')) ||
      (childPath === '/diamond-color' &&
        (location.pathname === '/diamond-config/color' || location.pathname === '/diamond-color')) ||
      (childPath === '/diamond-clarity' &&
        (location.pathname === '/diamond-config/clarity' || location.pathname === '/diamond-clarity')) ||
      (childPath === '/diamond-size' &&
        (location.pathname === '/diamond-config/size' || location.pathname === '/diamond-size')) ||
      (childPath === '/cod-sequences' &&
        (location.pathname === '/cod-sequences' || location.pathname === '/cod-sequence')) ||
      (childPath === '/celebrate-gifts' &&
        (location.pathname === '/celebrate-gifts' ||
          location.pathname === '/marketing/gifts' ||
          location.pathname === '/marketing/celebrate-gifts')) ||
      (childPath === '/coupons' &&
        (location.pathname === '/coupons' || location.pathname === '/marketing/coupons' || location.pathname === '/offers')) ||
      (childPath === '/marketing/before-after' &&
        (location.pathname === '/marketing/before-after' ||
          location.pathname === '/before-after' ||
          location.pathname === '/custjewellerybeforeafter' ||
          location.pathname === '/cust-jewellery-before-after')) ||
      (childPath === '/top-announcements' &&
        (location.pathname === '/top-announcements' ||
          location.pathname === '/top-announcement' ||
          location.pathname === '/marketing/top-announcement' ||
          location.pathname === '/marketing/announcements')) ||
      (childPath === '/banners' &&
        (location.pathname === '/banners' ||
          location.pathname.startsWith('/banners/') ||
          location.pathname === '/marketing/banners' ||
          location.pathname === '/website-sections')) ||
      (childPath === '/gallery' &&
        (location.pathname === '/gallery' ||
          location.pathname === '/media-gallery' ||
          location.pathname === '/website/gallery' ||
          location.pathname === '/marketing/gallery')) ||
      (childPath === '/static-pages' &&
        (location.pathname === '/static-pages' ||
          location.pathname.startsWith('/static-pages/'))) ||
      (childPath === '/website/themes' &&
        (location.pathname === '/website/themes' ||
          location.pathname.startsWith('/website/themes') ||
          location.pathname === '/themes')) ||
      (childPath === '/home-sections' &&
        (location.pathname === '/home-sections' || location.pathname === '/marketing/home-sections')) ||
      (childPath === '/blogs' &&
        (location.pathname === '/blogs' || location.pathname.startsWith('/blogs/'))) ||
      (childPath === '/blog-categories' &&
        (location.pathname === '/blog-categories' || location.pathname.startsWith('/blog-categories/'))) ||
      (childPath === '/footer-settings' &&
        (location.pathname === '/footer-settings' || location.pathname === '/marketing/footer')) ||
      (childPath === '/system/whatsapp' &&
        (location.pathname === '/system/whatsapp' ||
          location.pathname === '/whatsapp' ||
          location.pathname === '/whatsapp-management')) ||
      (childPath === '/profile' &&
        (location.pathname === '/profile' ||
          location.pathname === '/theme' ||
          location.pathname === '/settings/profile' ||
          location.pathname === '/user-profile'))
    );
  };

  useEffect(() => {
    // Automatically ensure the submenu containing the active path is opened
    let activeParentId = null;
    navSections.forEach((section) => {
      section.items?.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some((c) => checkIsChildActive(c.path));
          if (isChildActive) {
            activeParentId = item.id;
          }
        }
      });
    });

    if (activeParentId) {
      setOpenSubmenus((prev) => ({
        ...prev,
        [activeParentId]: true,
      }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <aside
      id="admin-sidebar"
      className={`fixed top-0 z-50 h-screen bg-[#FDFCFB] flex flex-col justify-between shadow-2xl lg:shadow-xs w-72 max-w-[85vw] lg:w-64 transition-transform duration-300 ease-in-out ${
        isRight
          ? `right-0 border-l border-[#EDE8E1] ${
              isMobileViewport
                ? mobileOpen
                  ? 'translate-x-0'
                  : 'translate-x-full pointer-events-none'
                : isOpen
                ? 'translate-x-0'
                : 'translate-x-full pointer-events-none lg:hidden'
            }`
          : `left-0 border-r border-[#EDE8E1] ${
              isMobileViewport
                ? mobileOpen
                  ? 'translate-x-0'
                  : '-translate-x-full pointer-events-none'
                : isOpen
                ? 'translate-x-0'
                : '-translate-x-full pointer-events-none lg:hidden'
            }`
      }`}
    >
      {/* ─── Top Brand Header (Matches Screenshot) ────────────── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#EDE8E1]/80 flex-shrink-0 bg-[#FDFCFB]">
        <NavLink
          to="/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          title="Go to Dashboard"
        >
          {brandLogo.desktop ? (
            <picture className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {brandLogo.mobile && <source media="(max-width: 640px)" srcSet={brandLogo.mobile} />}
              <img src={brandLogo.desktop} alt="Website logo" className="max-w-full max-h-full object-contain" />
            </picture>
          ) : (
            /* Fine Jewellery Lotus Icon */
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[#C19B65] group-hover:scale-105 transition-transform">
              <svg
                className="w-7 h-7"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M24 10C24 10 27 18 27 24C27 28 25.5 32 24 34C22.5 32 21 28 21 24C21 18 24 10 24 10Z" />
                <path d="M24 20C28 17 35 18 37 25C38 28.5 36 32 32 34C29 32.5 26 31 24 30" />
                <path d="M24 20C20 17 13 18 11 25C10 28.5 12 32 16 34C19 32.5 22 31 24 30" />
                <path d="M24 26C31 25 39 28 41 33C38 36 32 36.5 28 36" />
                <path d="M24 26C17 25 9 28 7 33C10 36 16 36.5 20 36" />
                <path d="M19 38C22 39.5 26 39.5 29 38" />
              </svg>
            </div>
          )}

          <div className="flex flex-col min-w-0 text-left">
            <span className="font-serif text-[13px] font-bold tracking-[0.16em] text-[#1F1D1A] group-hover:text-[#8a6d4b] uppercase truncate leading-tight transition-colors">
              NEIRAH
            </span>
            <span className="text-[7.5px] tracking-[0.24em] text-[#A67C52] uppercase font-semibold mt-0.5">
              LUXURY PORTAL
            </span>
          </div>
        </NavLink>

        {/* ─── Controls: Move to Right / Hide Sidebar ─── */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={toggleSidebarPosition}
            title={isRight ? 'Move sidebar to Left side' : 'Move sidebar to Right side'}
            className="w-6 h-6 rounded-md border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <HiOutlineSwitchHorizontal className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isMobileViewport) onMobileClose();
              else setSidebarOpen(false);
            }}
            title="Hide Sidebar"
            className="w-6 h-6 rounded-md border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isRight ? (
              <HiOutlineChevronRight className="w-3.5 h-3.5 hidden lg:block" />
            ) : (
              <HiOutlineChevronLeft className="w-3.5 h-3.5 hidden lg:block" />
            )}
            <HiOutlineX className="w-3.5 h-3.5 lg:hidden" />
          </button>
        </div>
      </div>

      {/* ─── Navigation Scrollable Area (Exact Portal Hierarchy) ─ */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 scrollbar-thin scrollbar-thumb-stone-200">
        {navSections.map((section) => (
          <div key={section.id} className="space-y-0.5">
            {section.title && isVisible && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-[#A67C52] uppercase">
                {section.title}
              </p>
            )}

            {section.items?.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;

              // ─── Case 1: Standalone Menu Item ──────────────────
              if (!hasChildren) {
                const isActive =
                  checkIsChildActive(item.path) ||
                  (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard'));

                return (
                  <NavLink
                    key={item.id || item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 cursor-pointer overflow-hidden ${
                      isActive
                        ? 'sidebar-item-active font-bold'
                        : 'sidebar-item-inactive text-[#443D37] hover:text-[#1C1917] font-medium'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: activeBg,
                            color: currentTheme?.dark || currentTheme?.primary || '#644d32',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: activeBorder,
                            boxShadow: activeShadow,
                          }
                        : {}
                    }
                  >
                    {/* Active accent vertical line on the side of the button */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-[4.5px] rounded-r-md transition-all duration-200"
                        style={{
                          backgroundColor: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)',
                          boxShadow: activeGlow,
                        }}
                      />
                    )}
                    <Icon
                      className="w-4 h-4 shrink-0 transition-colors"
                      style={
                        isActive
                          ? { color: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)' }
                          : { color: '#786e64' }
                      }
                    />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                );
              }

              // ─── Case 2: Submenu Group (Diamond Config, Product Config, etc.) ─
              const isSubOpen = !!openSubmenus[item.id];
              const isAnyChildActive = item.children.some((c) => checkIsChildActive(c.path));

              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-colors cursor-pointer group relative overflow-hidden ${
                      isSubOpen || isAnyChildActive
                        ? 'font-bold'
                        : 'sidebar-item-inactive text-[#443D37] hover:text-[#1C1917] font-medium'
                    }`}
                    style={
                      isSubOpen || isAnyChildActive
                        ? {
                            backgroundColor: activeParentBg,
                            color: currentTheme?.primary || '#8b6f4e',
                          }
                        : {}
                    }
                  >
                    {/* Collapsed parent with active child gets the indicator line */}
                    {isAnyChildActive && !isSubOpen && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-[4.5px] rounded-r-md transition-all duration-200"
                        style={{
                          backgroundColor: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)',
                          boxShadow: activeGlow,
                        }}
                      />
                    )}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className="w-4 h-4 shrink-0 transition-colors"
                        style={
                          isSubOpen || isAnyChildActive
                            ? { color: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)' }
                            : { color: '#786e64' }
                        }
                      />
                      <span className="truncate text-left">{item.title}</span>
                    </div>
                    <span
                      className="transition-colors shrink-0 ml-1"
                      style={{
                        color: isSubOpen || isAnyChildActive ? (currentTheme?.primary || '#8b6f4e') : '#a89d91',
                      }}
                    >
                      {isSubOpen ? (
                        <HiOutlineChevronUp className="w-3.5 h-3.5 stroke-2" />
                      ) : (
                        <HiOutlineChevronRight className="w-3.5 h-3.5 stroke-2" />
                      )}
                    </span>
                  </button>

                  {/* Submenu Children Items with guideline line */}
                  {isSubOpen && (
                    <div className="ml-5 pl-3 border-l border-[#EDE8E1] py-1 space-y-0.5 animate-fadeIn">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon || Icon;
                        const isChildActive = checkIsChildActive(child.path);

                        return (
                          <NavLink
                            key={child.id || child.path}
                            to={child.path}
                            onClick={onMobileClose}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] transition-all duration-150 cursor-pointer overflow-hidden ${
                              isChildActive
                                ? 'sidebar-item-active font-bold'
                                : 'sidebar-item-inactive text-[#504840] hover:text-[#1C1917] font-normal'
                            }`}
                            style={
                              isChildActive
                                ? {
                                    backgroundColor: activeBg,
                                    color: currentTheme?.dark || currentTheme?.primary || '#644d32',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: activeBorder,
                                    boxShadow: activeShadow,
                                  }
                                : {}
                            }
                          >
                            {/* Active accent vertical line on the side of the button */}
                            {isChildActive && (
                              <span
                                className="absolute left-0 top-1 bottom-1 w-[4.5px] rounded-r-md transition-all duration-200"
                                style={{
                                  backgroundColor: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)',
                                  boxShadow: activeGlow,
                                }}
                              />
                            )}
                            <ChildIcon
                              className="w-4 h-4 shrink-0 transition-colors"
                              style={
                                isChildActive
                                  ? { color: currentTheme?.primary || 'var(--theme-primary, #8b6f4e)' }
                                  : { color: '#87786B' }
                              }
                            />
                            <span className="truncate flex-1 text-left">{child.title}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile Footer (Matches Screenshot) ──── */}
      <div className="p-3 border-t border-[#EDE8E1]/80 flex-shrink-0 bg-[#FDFCFB]">
        {(() => {
          const isProfileActive =
            location.pathname === '/profile' ||
            location.pathname === '/theme' ||
            location.pathname === '/settings/profile' ||
            location.pathname === '/user-profile';

          return (
            <div
              onClick={() => {
                navigate('/profile');
                onMobileClose?.();
              }}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer group ${
                isProfileActive
                  ? 'sidebar-item-active'
                  : 'border-[#EDE8E1] bg-white hover:bg-[#FAF6F1]'
              }`}
              style={
                isProfileActive
                  ? {
                      backgroundColor: activeBg,
                      borderColor: activeBorder,
                      boxShadow: activeShadow,
                    }
                  : {}
              }
              title="View Profile & Theme Options"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105"
                  style={
                    isProfileActive
                      ? {
                          backgroundColor: currentTheme?.primary || '#8b6f4e',
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: `rgba(${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}, 0.12)`,
                          color: currentTheme?.primary || '#8b6f4e',
                        }
                  }
                >
                  {user?.firstName?.[0] || 'S'}
                </div>
                {isVisible && (
                  <div className="flex flex-col min-w-0 text-left">
                    <span
                      className="text-xs font-bold truncate transition-colors"
                      style={
                        isProfileActive
                          ? { color: currentTheme?.primary || '#8b6f4e' }
                          : { color: '#1C1917' }
                      }
                    >
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
                    </span>
                    <span className="text-[10px] text-stone-400 truncate">
                      {user?.email || 'superadmin@jewels.com'}
                    </span>
                  </div>
                )}
              </div>

              {isVisible && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
                  title="Sign Out"
                  className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                >
                  <HiOutlineLogout className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </aside>
  );
};

export default Sidebar;
