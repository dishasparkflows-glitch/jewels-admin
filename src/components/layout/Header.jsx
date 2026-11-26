import api from '../../api/axios';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationsAPI } from '../../api/services';
import { isPathAllowed } from '../../utils/moduleAccess';
import { formatRelativeTime } from '../../utils/formatters';
import AdminMenuSearch from './AdminMenuSearch';
import {
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineChevronDown,
  HiOutlineUser,
  HiOutlineColorSwatch,
  HiOutlineLogout,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineSwitchHorizontal,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineUserAdd,
  HiOutlineTrash,
  HiOutlineArrowRight,
} from 'react-icons/hi';

const Header = ({ onMobileToggle }) => {
  const { user, logout, allowedModules, dbModules } = useAuth();
  const {
    currentTheme,
    presets,
    selectTheme,
    isDefault,
    isDarkMode,
    toggleColorMode,
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
  const [notifOpen, setNotifOpen] = useState(false);
  const notifDropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifOpenRef = useRef(false);

  useEffect(() => {
    notifOpenRef.current = notifOpen;
  }, [notifOpen]);

  const canOpenNotificationsPage = isPathAllowed('/notifications', allowedModules, dbModules);

  const fetchUnreadCount = useCallback(async (signal) => {
    try {
      const response = await api.get('/notifications/unread-count', signal ? { signal } : undefined);
      setUnreadCount(Number(response.data?.data?.count ?? 0));
    } catch {
      // ignore transient poll failures
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await notificationsAPI.getAll({ page: 1, limit: 8 });
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifications(rows);
      if (typeof res.data?.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // keep existing items on transient failure
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUnreadCount(controller.signal);
    const interval = setInterval(() => fetchUnreadCount(), 30000);
    const handleSync = () => {
      fetchUnreadCount();
      if (notifOpenRef.current) fetchRecentNotifications();
    };
    window.addEventListener('notifications:updated', handleSync);
    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener('notifications:updated', handleSync);
    };
  }, [fetchUnreadCount, fetchRecentNotifications]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    setDropdownOpen(false);
    if (nextOpen) {
      fetchRecentNotifications();
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif) return;
    if (!notif.isRead) {
      try {
        await notificationsAPI.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* ignore */
      }
    }
    if (notif.metadata?.link) {
      setNotifOpen(false);
      navigate(notif.metadata.link);
    }
  };

  const handleMarkAllNotificationsRead = async (e) => {
    e?.stopPropagation?.();
    if (markingAllRead) return;
    if (unreadCount === 0 && !notifications.some((n) => !n.isRead)) return;

    try {
      setMarkingAllRead(true);
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark notifications as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = async (notifId, wasUnread, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(notifId);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {
      /* ignore */
    }
  };

  const handleNavigateProfile = (activeTab = 'theme') => {
    setDropdownOpen(false);
    navigate('/profile', { state: { activeTab } });
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
      {/* Left: Mobile hamburger & Sidebar toggles */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
      </div>

      {/* Menu Quick Search & Redirect */}
      <AdminMenuSearch />

      {/* Spacer (visible on tablet+ only) */}
      <div className="hidden sm:block sm:flex-1" />

      {/* Right: Dark/Light theme toggle, notifications, Super Admin profile */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleColorMode}
          className="relative p-2 text-stone-500 hover:text-stone-800 dark:text-stone-300 dark:hover:text-white hover:bg-white dark:hover:bg-stone-800 rounded-xl transition-colors border border-transparent hover:border-[#eee8df] dark:hover:border-stone-700 cursor-pointer"
          title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkMode ? (
            <HiOutlineSun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          ) : (
            <HiOutlineMoon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`relative p-2 text-stone-500 hover:text-stone-800 hover:bg-white rounded-xl transition-colors border cursor-pointer ${
              notifOpen ? 'bg-white border-[#eee8df] text-stone-900' : 'border-transparent hover:border-[#eee8df]'
            }`}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="true"
          >
            <HiOutlineBell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-stone-200/90 overflow-hidden z-50 animate-scaleUp">
              <div className="px-4 py-3 border-b border-stone-100 bg-[#faf8f5] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {(unreadCount > 0 || notifications.some((n) => !n.isRead)) && (
                  <button
                    type="button"
                    disabled={markingAllRead}
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[11px] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                    style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                  >
                    {markingAllRead ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {notifLoading && notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 px-4 text-center space-y-1.5">
                    <HiOutlineBell className="w-6 h-6 mx-auto text-stone-300" />
                    <p className="text-xs font-semibold text-stone-700">No notifications yet</p>
                    <p className="text-[11px] text-stone-400">
                      New customer signups and system alerts will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 flex items-start gap-2.5 transition-colors cursor-pointer group ${
                        !notif.isRead ? 'bg-[#faf6f0]/75 hover:bg-[#faf4ea]' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 mt-0.5">
                        {notif.metadata?.event === 'user_registered' ? (
                          <HiOutlineUserAdd className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <HiOutlineBell className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary, #8b6f4e)' }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-snug ${!notif.isRead ? 'font-bold text-stone-900' : 'font-semibold text-stone-700'}`}>
                            {notif.title}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(notif._id, !notif.isRead, e)}
                            title="Delete notification"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                          >
                            <HiOutlineTrash className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-stone-400">
                            {formatRelativeTime(notif.sendAt)}
                          </span>
                          {!notif.isRead && (
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--theme-primary, #8b6f4e)' }}>
                              Unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canOpenNotificationsPage && (
                <div className="px-4 py-2.5 border-t border-stone-100 bg-[#faf8f5]">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/notifications');
                    }}
                    className="w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-white border border-stone-200/80 cursor-pointer"
                    style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                  >
                    <span>View All Notifications</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
              {user?.profile?.firstName?.[0] || 'S'}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-stone-900 leading-tight group-hover:text-black">
                {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : 'Super Admin'}
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
                    {user?.profile?.firstName?.[0] || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : 'Super Admin'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">
                      {user?.auth?.email || 'admin@jewels.com'}
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
    </header>
  );
};

export default Header;
