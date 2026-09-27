import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navSections } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineLogout,
  HiOutlineSparkles,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Keep accordion groups open by default or based on active route
  const [openSubmenus, setOpenSubmenus] = useState({
    'diamond-config': true,
    'product-config': true,
    'pricing-hub': true,
    'catalog': true,
  });

  useEffect(() => {
    // Automatically ensure the section of the current path is opened
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (c) => location.pathname === c.path || location.pathname.startsWith(c.path)
          );
          if (isChildActive) {
            setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen bg-white border-r-4 border-[#9c7849] transition-all duration-300 flex flex-col justify-between shadow-xs
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* ─── Top Brand Header ───────────────────────────────── */}
      <div className="h-20 flex items-center px-5 border-b border-stone-100 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e] shadow-sm flex-shrink-0">
            <HiOutlineSparkles className="w-4 h-4 text-[#8b6f4e]" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-[12px] font-bold tracking-[0.16em] text-stone-900 uppercase font-sans">
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
              const isSubOpen = openSubmenus[item.id];
              const isGroupActive =
                hasChildren &&
                item.children.some(
                  (child) =>
                    location.pathname === child.path ||
                    location.pathname.startsWith(child.path)
                );
              const isActive =
                !hasChildren &&
                (location.pathname === item.path ||
                  (item.id === 'cod-sequence' && (location.pathname === '/cod-sequence' || location.pathname === '/cod-sequences')) ||
                  (item.id === 'celebrate-gifts' && (location.pathname === '/celebrate-gifts' || location.pathname === '/marketing/gifts')) ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));

              if (hasChildren) {
                return (
                  <div key={item.id} className="space-y-0.5">
                    {/* Accordion Group Header (Matches User Screenshot) */}
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
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
                        <span className="text-stone-400 text-xs flex items-center">
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
                      <div className="ml-6 pl-4 border-l border-stone-200/90 py-1 space-y-0.5">
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
                            (child.path === '/vto-masters' && (location.pathname === '/product-config/vto-masters' || location.pathname === '/vto-masters'));

                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={onMobileClose}
                              className={({ isActive: childActive }) => {
                                const active = childActive || matchesAlternateRoute;
                                return `flex items-center gap-3 py-2 px-2.5 rounded-xl text-[13px] font-medium transition-colors ${
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#8b6f4e] text-white shadow-sm font-semibold'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'
                      }`}
                    />
                    {isOpen && <span>{item.title}</span>}
                  </div>

                  {isActive && isOpen && (
                    <HiOutlineChevronRight className="w-3.5 h-3.5 text-white/90" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile Footer ─────────────────────── */}
      <div className="p-3 border-t border-stone-100 flex-shrink-0 bg-[#fdfcfb]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#f4ece0] border border-[#e8d9c2] flex items-center justify-center font-bold text-xs text-[#8b6f4e] flex-shrink-0">
              {user?.firstName?.[0] || 'S'}
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
                </span>
                <span className="text-[10px] text-stone-400 truncate">
                  {user?.email || 'admin@neirah.com'}
                </span>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
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
