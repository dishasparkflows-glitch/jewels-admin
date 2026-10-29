import api from '../../api/axios';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import DatePicker from '../common/DatePicker';
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
  HiOutlineSwitchHorizontal,
  HiOutlineViewList,
} from 'react-icons/hi';

const Header = ({ onMobileToggle }) => {
  const { user, logout } = useAuth();
  const {
    currentTheme,
    presets,
    selectTheme,
    isDefault,
    sidebarOpen,
    toggleSidebar,
    sidebarPosition,
    toggleSidebarPosition,
    setSidebarPosition,
    isMobileViewport,
    mobileSidebarOpen,
    toggleMobileSidebar,
  } = useTheme();
  const navigate = useNavigate();
  const sidebarVisible = isMobileViewport ? mobileSidebarOpen : sidebarOpen;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedHeaderDate, setSelectedHeaderDate] = useState(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const headerDateFormatted = (() => {
    const d = selectedHeaderDate ? new Date(selectedHeaderDate) : new Date();
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    return `${day} ${month} ${year}${isToday ? ' - TODAY' : ''}`;
  })();
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
    <header className="sticky top-0 z-30 bg-[#fbfaf8]/95 backdrop-blur-md border-b border-[#eee8df] px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        {/* Sidebar Toggle (On / Off) */}
        <button
          type="button"
          onClick={() => {
            if (isMobileViewport) {
              if (onMobileToggle) onMobileToggle();
              else toggleMobileSidebar();
            } else {
              toggleSidebar();
            }
          }}
          className={`p-2 rounded-xl border text-stone-600 hover:text-stone-900 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            !sidebarVisible
              ? 'shadow-2xs'
              : 'border-stone-200/90 hover:border-stone-300 bg-white hover:bg-stone-50'
          }`}
          style={!sidebarVisible ? {
            backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.12)',
            borderColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.3)',
            color: 'var(--theme-primary, #8b6f4e)',
          } : undefined}
          title={sidebarVisible ? 'Hide sidebar (Turn OFF)' : 'Show sidebar (Turn ON)'}
          aria-label="Toggle Sidebar"
          aria-controls="admin-sidebar"
          aria-expanded={sidebarVisible}
        >
          <HiOutlineMenu className="w-4 h-4" />
          {!sidebarVisible && (
            <span className="hidden sm:inline text-xs font-semibold" style={{ color: "var(--theme-primary, #8b6f4e)" }}>
              Menu
            </span>
          )}
        </button>

        {/* Sidebar Position Switcher: Left <-> Right */}
        <button
          type="button"
          onClick={toggleSidebarPosition}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200/90 hover:border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
          title={`Sidebar is on ${sidebarPosition}. Click to move to ${sidebarPosition === 'left' ? 'Right' : 'Left'} side.`}
        >
          <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" style={{ color: "var(--theme-primary, #8b6f4e)" }} />
          <span>{sidebarPosition === 'left' ? 'Sidebar: Left' : 'Sidebar: Right'}</span>
        </button>

        {/* Desktop Global Search Bar */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#d6cfc2] hover:border-[#bdae99] focus-within:border-[var(--theme-primary,#8b6f4e)] focus-within:ring-2 focus-within:ring-[rgba(var(--theme-primary-rgb,139,111,78),0.2)] transition-all shadow-2xs w-full max-w-md">
          <HiOutlineSearch className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, orders, customers..."
            className="w-full bg-transparent border-none outline-none text-xs text-stone-900 placeholder:text-stone-400 font-medium"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-stone-400 bg-stone-100 rounded border border-stone-200 shrink-0">
            Ctrl + K
          </kbd>
        </div>

        {/* Mobile Search Toggle Icon */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="sm:hidden p-2 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          aria-label="Toggle mobile search"
        >
          <HiOutlineSearch className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Date badge, notifications, Super Admin profile */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Date pill badge */}
        <div>
          <DatePicker
            value={selectedHeaderDate}
            onChange={(val) => setSelectedHeaderDate(val)}
            direction="down"
            popupClassName="right-0 left-auto"
          >
            {/* Desktop full date pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d6cfc2] hover:border-[#bdae99] text-xs font-semibold text-stone-700 shadow-2xs cursor-pointer hover:bg-stone-50 transition-colors">
              <HiOutlineCalendar className="w-3.5 h-3.5" style={{ color: "var(--theme-primary, #8b6f4e)" }} />
              <span>{headerDateFormatted}</span>
              <HiOutlineChevronDown className="w-3 h-3 text-stone-400 ml-0.5" />
            </div>
            {/* Mobile / Tablet compact calendar icon */}
            <div className="md:hidden p-2 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 shadow-2xs cursor-pointer transition-colors" title={headerDateFormatted}>
              <HiOutlineCalendar className="w-4 h-4" style={{ color: "var(--theme-primary, #8b6f4e)" }} />
            </div>
          </DatePicker>
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
            className="flex items-center gap-2 pl-1.5 sm:pl-2 sm:border-l sm:border-[#eee8df] cursor-pointer focus:outline-none group text-left"
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
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2.5 z-50 animate-scaleUp">

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

              {/* Sidebar Configuration in Dropdown */}
              <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Sidebar Position
                  </span>
                  <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-[11px] font-semibold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSidebarPosition('left')}
                      style={sidebarPosition === 'left' ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' } : undefined}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        sidebarPosition === 'left'
                          ? 'shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarPosition('right')}
                      style={sidebarPosition === 'right' ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', color: '#ffffff' } : undefined}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        sidebarPosition === 'right'
                          ? 'shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Sidebar State
                  </span>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer border transition-colors ${
                      sidebarOpen
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {sidebarOpen ? 'On (Visible)' : 'Off (Hidden)'}
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

      {/* Expandable Mobile Search Row */}
      {mobileSearchOpen && (
        <div className="absolute top-14 left-0 right-0 p-2.5 bg-white border-b border-[#eee8df] shadow-md sm:hidden flex items-center gap-2 animate-fadeIn z-30">
          <HiOutlineSearch className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, orders, customers..."
            className="flex-1 text-xs text-stone-900 placeholder:text-stone-400 bg-transparent outline-none py-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="px-2 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
