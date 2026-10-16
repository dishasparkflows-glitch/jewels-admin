import api from '../../api/axios';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineCalendar,
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineUser,
  HiOutlineColorSwatch,
  HiOutlineLogout,
  HiOutlineCheck,
  HiOutlineSparkles,
} from 'react-icons/hi';

const Header = ({ onMobileToggle }) => {
  const { user, logout } = useAuth();
  const { currentTheme, presets, selectTheme, isDefault } = useTheme();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/notifications/unread-count', { signal: controller.signal })
      .then((response) => setUnreadCount(response.data?.data?.count ?? null))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format today's date matching screenshot: e.g. "15 OCT 2026 - TODAY"
  const todayFormatted = (() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year} - TODAY`;
  })();

  const handleNavigateProfile = (tab = 'theme') => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#fbfaf8]/95 backdrop-blur-md border-b border-[#eee8df] px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <HiOutlineMenu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Matches User Screenshot) */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#d6cfc2] hover:border-[#bdae99] focus-within:border-[#8b6f4e] focus-within:ring-2 focus-within:ring-[#8b6f4e]/20 transition-all shadow-2xs w-full max-w-md">
          <HiOutlineSearch className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full bg-transparent border-none outline-none text-xs text-stone-900 placeholder:text-stone-400 font-medium"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-stone-400 bg-stone-100 rounded border border-stone-200 shrink-0">
            Ctrl + K
          </kbd>
        </div>
      </div>

      {/* Right: Date badge, notifications, Super Admin profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Date pill badge from screenshot */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d6cfc2] text-xs font-semibold text-stone-700 shadow-2xs cursor-pointer hover:bg-stone-50 transition-colors">
          <HiOutlineCalendar className="w-3.5 h-3.5 text-[#8b6f4e]" />
          <span>{todayFormatted}</span>
          <HiOutlineChevronDown className="w-3 h-3 text-stone-400 ml-0.5" />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-stone-500 hover:text-stone-800 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-[#eee8df] cursor-pointer"
          aria-label="Notifications"
        >
          <HiOutlineBell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-[15px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount}
          </span>}
        </button>

        {/* Super Admin User info with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-2 sm:border-l sm:border-[#eee8df] cursor-pointer focus:outline-none group text-left"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 transition-transform group-hover:scale-105 border"
              style={{
                backgroundColor: currentTheme.light,
                borderColor: currentTheme.border,
                color: currentTheme.primary,
              }}
            >
              {user?.firstName?.[0] || 'S'}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-stone-900 leading-tight group-hover:text-black">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
              </p>
              <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 leading-tight block">
                {user?.role ? user.role.toUpperCase() : 'SUPER_ADMIN'}
              </span>
            </div>

            <HiOutlineChevronDown
              className={`w-3 h-3 text-stone-400 hidden sm:block ml-0.5 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-stone-700' : ''
              }`}
            />
          </button>

          {/* Interactive Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2.5 z-50 animate-scaleUp">
              {/* Header profile info */}
              <div className="px-4 py-2 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs border"
                    style={{
                      backgroundColor: currentTheme.light,
                      borderColor: currentTheme.border,
                      color: currentTheme.primary,
                    }}
                  >
                    {user?.firstName?.[0] || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">
                      {user?.email || 'admin@jewels.com'}
                    </p>
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: currentTheme.soft,
                        color: currentTheme.primary,
                        border: `1px solid ${currentTheme.border}`,
                      }}
                    >
                      {user?.role ? user.role.toUpperCase() : 'SUPER ADMIN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Theme Color Selector in Dropdown */}
              <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <HiOutlineColorSwatch className="w-3.5 h-3.5 text-stone-600" />
                    Theme Color
                  </span>
                  <span className="text-[10px] font-semibold text-stone-700">
                    {isDefault ? 'Default' : currentTheme.name}
                  </span>
                </div>

                {/* Quick Swatches Row */}
                <div className="flex items-center justify-between gap-1.5">
                  {presets.slice(0, 6).map((preset) => {
                    const active = currentTheme.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectTheme(preset.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer relative shadow-2xs border ${
                          active
                            ? 'scale-110 ring-2 ring-stone-900/40'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: preset.primary,
                          borderColor: preset.border,
                        }}
                        title={`${preset.name}${preset.isDefault ? ' (Default)' : ''}`}
                      >
                        {active && <HiOutlineCheck className="w-3.5 h-3.5 text-white stroke-2" />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleNavigateProfile('theme')}
                    className="text-[10px] font-bold text-stone-600 hover:text-stone-900 px-1 py-0.5 rounded hover:bg-stone-200/60 transition-colors"
                    title="View All Theme Options"
                  >
                    More
                  </button>
                </div>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleNavigateProfile('profile')}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <HiOutlineUser className="w-4 h-4 text-stone-400" />
                  <span>User Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateProfile('theme')}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <HiOutlineSparkles className="w-4 h-4 text-stone-400" />
                    <span>Theme Customizer</span>
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentTheme.primary }}
                  />
                </button>
              </div>

              {/* Logout */}
              <div className="pt-1 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <HiOutlineLogout className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
