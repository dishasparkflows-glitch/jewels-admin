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
  HiOutlineLogout,
  HiOutlineSparkles,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  
  // Default submenus to collapsed so sidebar stays compact and small, auto-opening only active route
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [brandLogo, setBrandLogo] = useState({ desktop: '', mobile: '' });

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const settings = data?.data || {};
      setBrandLogo({ desktop: getMediaUrl(settings.logoImage?.url), mobile: getMediaUrl(settings.mobileLogoImage?.url) });
    }).catch(() => {});
  }, []);

  const checkIsChildActive = (childPath) => {
    return (
      location.pathname === childPath ||
      location.pathname.startsWith(childPath) ||
      (childPath === '/diamond-types' && (location.pathname === '/diamond-config/types' || location.pathname === '/diamond-types')) ||
      (childPath === '/diamond-shapes' && (location.pathname === '/diamond-config/shapes' || location.pathname === '/diamond-shapes')) ||
      (childPath === '/diamond-color' && (location.pathname === '/diamond-config/color' || location.pathname === '/diamond-color')) ||
      (childPath === '/diamond-clarity' && (location.pathname === '/diamond-config/clarity' || location.pathname === '/diamond-clarity')) ||
      (childPath === '/diamond-size' && (location.pathname === '/diamond-config/size' || location.pathname === '/diamond-size')) ||
      (childPath === '/metal-purity' && (location.pathname === '/product-config/metal-purity' || location.pathname === '/metal-purity')) ||
      (childPath === '/metal-color' && (location.pathname === '/product-config/metal-color' || location.pathname === '/metal-color')) ||
      (childPath === '/sizes' && (location.pathname === '/product-config/sizes' || location.pathname === '/sizes')) ||
      (childPath === '/pricing-hub/metal-rates' && (location.pathname === '/pricing-hub/metal-rates' || location.pathname === '/metal-rates' || location.pathname === '/goldprice')) ||
      (childPath === '/pricing-hub/diamond-rates' && (location.pathname === '/pricing-hub/diamond-rates' || location.pathname === '/pricing-hub/diamond-price' || location.pathname === '/diamondprice' || location.pathname === '/diamond-price' || location.pathname === '/diamond-rates')) ||
      (childPath === '/vto-masters' && (location.pathname === '/product-config/vto-masters' || location.pathname === '/vto-masters'))
    );
  };

  useEffect(() => {
    // Automatically ensure the section of the current active path is opened
    let activeParentId = null;
    navSections.forEach((section) => {
      section.items.forEach((item) => {
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

  const handleParentClick = (item) => {
    if (item.children && item.children.length > 0) {
      toggleSubmenu(item.id);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-[#eee8df] transition-all duration-300 flex flex-col justify-between shadow-xs
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* ─── Top Brand Header ───────────────────────────────── */}
      <div className="h-14 flex items-center px-5 border-b border-stone-100 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          {brandLogo.desktop ? (
            <picture className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              {brandLogo.mobile && <source media="(max-width: 640px)" srcSet={brandLogo.mobile} />}
              <img src={brandLogo.desktop} alt="Website logo" className="max-w-full max-h-full object-contain" />
            </picture>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e] shadow-xs flex-shrink-0 font-bold text-xl">N</div>
          )}
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-[13px] font-bold tracking-[0.18em] text-stone-900 uppercase font-sans">
                NEIRAH JEWELLERS
              </span>
              <span className="text-[9px] tracking-[0.25em] text-[#8b6f4e] uppercase font-semibold -mt-0.5">
                LUXURY PORTAL
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Navigation Scrollable Area ─────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-stone-200">
        {navSections.map((section) => (
          <div key={section.id} className="space-y-1">
            {section.title && isOpen && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                {section.title}
              </p>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isSubOpen = !!openSubmenus[item.id];
              const isGroupActive =
                hasChildren &&
                item.children.some((child) => checkIsChildActive(child.path));
              const isActive =
                !hasChildren &&
                (location.pathname === item.path ||
                  (item.id === 'banners' && (location.pathname === '/banners' || location.pathname === '/marketing/banners' || location.pathname === '/website-sections' || location.pathname === '/marketing/website-sections')) ||
                  (item.id === 'cod-sequence' && (location.pathname === '/cod-sequence' || location.pathname === '/cod-sequences')) ||
                  (item.id === 'celebrate-gifts' && (location.pathname === '/celebrate-gifts' || location.pathname === '/marketing/gifts')) ||
                  (item.id === 'before-after' && (location.pathname === '/before-after' || location.pathname === '/marketing/before-after' || location.pathname === '/custjewellerybeforeafter' || location.pathname === '/cust-jewellery-before-after')) ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));

              if (hasChildren) {
                return (
                  <div key={item.id} className="space-y-0.5">
                    {/* Accordion Group Header (Matches User Screenshot) */}
                    <button
                      type="button"
                      onClick={() => handleParentClick(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' && !isSubOpen) toggleSubmenu(item.id);
                        if (e.key === 'ArrowLeft' && isSubOpen) toggleSubmenu(item.id);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 cursor-pointer ${
                        isSubOpen || isGroupActive
                          ? 'bg-[#faf8f5] text-[#8f6d43] font-semibold'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[#8f6d43] flex-shrink-0" />
                        {isOpen && (
                          <span className="tracking-tight text-stone-800 font-semibold text-[13px]">
                            {item.title}
                          </span>
                        )}
                      </div>
                      {isOpen && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Toggle ${item.title} undermenu`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubmenu(item.id);
                          }}
                          className="text-stone-400 hover:text-stone-700 text-xs flex items-center p-1 rounded-md transition-colors cursor-pointer"
                        >
                          {isSubOpen ? (
                            <HiOutlineChevronUp className="w-4 h-4 text-stone-400 stroke-2" />
                          ) : (
                            <HiOutlineChevronDown className="w-4 h-4 text-stone-400 stroke-2" />
                          )}
                        </span>
                      )}
                    </button>

                    {/* Submenu links with left guideline line */}
                    {isOpen && isSubOpen && (
                      <div className="ml-6 pl-4 border-l border-stone-200/90 py-1 space-y-0.5 animate-fadeIn">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon || Icon;
                          const matchesAlternateRoute =
                            (child.path === '/diamond-types' && location.pathname === '/diamond-config/types') ||
                            (child.path === '/diamond-shapes' && location.pathname === '/diamond-config/shapes') ||
                            (child.path === '/diamond-color' && location.pathname === '/diamond-config/color') ||
                            (child.path === '/diamond-clarity' && location.pathname === '/diamond-config/clarity') ||
                            (child.path === '/diamond-size' && location.pathname === '/diamond-config/size') ||
                            (child.path === '/metal-purity' && location.pathname === '/product-config/metal-purity') ||
                            (child.path === '/metal-color' && location.pathname === '/product-config/metal-color') ||
                            (child.path === '/sizes' && location.pathname === '/product-config/sizes') ||
                            (child.path === '/pricing-hub/metal-rates' && (location.pathname === '/pricing-hub/metal-rates' || location.pathname === '/metal-rates' || location.pathname === '/goldprice')) ||
                            (child.path === '/vto-masters' && (location.pathname === '/product-config/vto-masters' || location.pathname === '/vto-masters'));

                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={onMobileClose}
                              className={({ isActive: childActive }) => {
                                const active = childActive || matchesAlternateRoute;
                                return `flex items-center gap-3 py-2 px-2.5 rounded-xl text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 ${
                                  active
                                    ? 'bg-[#8f6d43] text-white font-semibold shadow-xs'
                                    : 'text-[#556170] hover:text-stone-900 hover:bg-stone-50/80'
                                }`;
                              }}
                            >
                              {({ isActive: childActive }) => {
                                const active = childActive || matchesAlternateRoute;
                                return (
                                  <>
                                    <ChildIcon
                                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                        active ? 'text-white' : 'text-[#7b8794]'
                                      }`}
                                    />
                                    <span className="truncate flex-1">{child.title}</span>
                                    {active && (
                                      <HiOutlineChevronRight className="w-3.5 h-3.5 text-white/90 flex-shrink-0 ml-auto" />
                                    )}
                                  </>
                                );
                              }}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onMobileClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 ${
                    isActive
                      ? 'bg-[#f8f2eb] text-[#8b6f4e] border-l-4 border-[#8b6f4e] font-semibold shadow-2xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#8b6f4e]' : 'text-stone-400 group-hover:text-stone-600'
                      }`}
                    />
                    {isOpen && <span>{item.title}</span>}
                  </div>

                  {isActive && isOpen && (
                    <HiOutlineChevronRight className="w-3.5 h-3.5 text-[#8b6f4e]" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile Footer ─────────────────────── */}
      <div className="p-3 border-t border-stone-100 flex-shrink-0 bg-white">
        <div
          onClick={() => {
            navigate('/profile');
            onMobileClose?.();
          }}
          className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 transition-colors cursor-pointer group"
          title="View Profile & Theme Options"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105 border"
              style={{
                backgroundColor: currentTheme.light,
                borderColor: currentTheme.border,
                color: currentTheme.primary,
              }}
            >
              {user?.firstName?.[0] || 'S'}
            </div>
            {isOpen && (
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

          {isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sign Out"
              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
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
