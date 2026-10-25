import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { navSections } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { getMediaUrl } from '../../utils/imageUrl';
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
    currentTheme,
    sidebarOpen,
    setSidebarOpen,
    sidebarPosition,
    toggleSidebarPosition,
    isMobileViewport,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useTheme();

  const isOpen = propIsOpen !== undefined ? propIsOpen : sidebarOpen;
  const mobileOpen = propMobileOpen !== undefined ? propMobileOpen : mobileSidebarOpen;
  const onMobileClose = propOnMobileClose || (() => setMobileSidebarOpen(false));
  const isRight = sidebarPosition === 'right';
  const isVisible = isMobileViewport ? mobileOpen : isOpen;

  // Open all main groups by default matching target admin design
  const [openSubmenus, setOpenSubmenus] = useState({
    analytics: true,
    catalog: true,
    'sales-orders': true,
    marketing: true,
    'website-content': true,
    'system-settings': true,
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
          location.pathname === '/categories' ||
          location.pathname === '/catalog/navigation-menus')) ||
      (childPath === '/pricing-hub/metal-rates' &&
        (location.pathname.startsWith('/pricing-hub') ||
          location.pathname === '/metal-rates' ||
          location.pathname === '/goldprice' ||
          location.pathname === '/diamondprice' ||
          location.pathname === '/diamond-price' ||
          location.pathname === '/diamond-rates' ||
          location.pathname === '/currencies')) ||
      (childPath === '/metal-purity' &&
        (location.pathname.startsWith('/product-config') ||
          location.pathname === '/metal-purity' ||
          location.pathname === '/metal-color' ||
          location.pathname === '/sizes' ||
          location.pathname === '/vto-masters')) ||
      (childPath === '/diamond-types' &&
        (location.pathname.startsWith('/diamond-config') ||
          location.pathname === '/diamond-types' ||
          location.pathname === '/diamond-shapes' ||
          location.pathname === '/diamond-color' ||
          location.pathname === '/diamond-clarity' ||
          location.pathname === '/diamond-size' ||
          location.pathname === '/diamonds' ||
          location.pathname.startsWith('/diamonds/'))) ||
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
    // Automatically ensure the section of the current active path is opened
    let activeGroupId = null;
    navSections.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((c) => checkIsChildActive(c.path));
        if (isChildActive) {
          activeGroupId = item.id;
        }
      }
    });

    if (activeGroupId) {
      setOpenSubmenus((prev) => ({
        ...prev,
        [activeGroupId]: true,
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
              NEIRAH JEWELS
            </span>
            <span className="text-[7.5px] tracking-[0.24em] text-[#A67C52] uppercase font-semibold mt-0.5">
              FINE JEWELLERY
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

      {/* ─── Navigation Scrollable Area (Exact Grouped Hierarchy) ─ */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-stone-200">
        {navSections.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;

          // ─── Case 1: Standalone Menu Item (e.g., Dashboard) ─────
          if (!hasChildren) {
            const isDashboardActive =
              location.pathname === item.path ||
              (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard'));

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  isDashboardActive
                    ? 'bg-[#F5EFE8] text-[#1C1917] font-semibold'
                    : 'text-[#3E3832] hover:text-[#1C1917] hover:bg-[#FAF6F1]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isDashboardActive ? 'text-[#9A724A]' : 'text-[#87786B]'
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </NavLink>
            );
          }

          // ─── Case 2: Accordion Group Header (e.g., ANALYTICS, CATALOG) ─
          const isGroupOpen = !!openSubmenus[item.id];

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSubmenu(item.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold tracking-[0.08em] text-[#3D3730] hover:bg-[#FAF6F1] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 text-[#9A724A] shrink-0" />
                  <span className="uppercase text-[#3D3730] font-bold tracking-wider truncate">
                    {item.title}
                  </span>
                </div>
                <span className="text-stone-400 group-hover:text-stone-600 transition-colors shrink-0 ml-1">
                  {isGroupOpen ? (
                    <HiOutlineChevronUp className="w-3.5 h-3.5 stroke-2" />
                  ) : (
                    <HiOutlineChevronDown className="w-3.5 h-3.5 stroke-2" />
                  )}
                </span>
              </button>

              {/* Accordion Children Items */}
              {isGroupOpen && (
                <div className="space-y-0.5 pl-3 pr-1 animate-fadeIn">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon || Icon;
                    const isChildActive = checkIsChildActive(child.path);

                    return (
                      <NavLink
                        key={child.id || child.path}
                        to={child.path}
                        onClick={onMobileClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] transition-colors cursor-pointer ${
                          isChildActive
                            ? 'bg-[#F5EFE8] text-[#1C1917] font-semibold'
                            : 'text-[#504840] hover:text-[#1C1917] hover:bg-[#FAF6F1] font-normal'
                        }`}
                      >
                        <ChildIcon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isChildActive ? 'text-[#9A724A]' : 'text-[#87786B]'
                          }`}
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
      </nav>

      {/* ─── Bottom User Profile Footer (Matches Screenshot) ──── */}
      <div className="p-3 border-t border-[#EDE8E1]/80 flex-shrink-0 bg-[#FDFCFB]">
        <div
          onClick={() => {
            navigate('/profile');
            onMobileClose?.();
          }}
          className="flex items-center justify-between p-2 rounded-xl border border-[#EDE8E1] bg-white hover:bg-[#FAF6F1] transition-colors cursor-pointer group"
          title="View Profile & Theme Options"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: '#F5EFE8',
                color: '#9A724A',
              }}
            >
              {user?.firstName?.[0] || 'S'}
            </div>
            {isVisible && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold text-stone-900 truncate group-hover:text-black">
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
      </div>
    </aside>
  );
};

export default Sidebar;
