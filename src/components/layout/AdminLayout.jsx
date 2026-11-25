import { useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineX } from 'react-icons/hi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../common/ErrorBoundary';
import CuteTopProgressBar from '../common/CuteTopProgressBar';
import GlobalTooltip from '../common/GlobalTooltip';
import { preloadCoreRoutes } from '../../utils/routeLoaders';

/**
 * Zero-height Suspense fallback so lazy route boundaries never inject a blank
 * spacer jump while CuteTopProgressBar handles visual feedback.
 */
const MinimalSuspenseFallback = () => (
  <div className="min-h-0 w-full" aria-hidden="true" />
);

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { previewOwner, stopOwnerPreview, allowedModules } = useAuth();
  const {
    sidebarOpen,
    sidebarPosition,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useTheme();

  // Warm up core sidebar chunks once initial admin mount settles
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => preloadCoreRoutes(), { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(preloadCoreRoutes, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Reset body and html overflow on route change and auto-close mobile sidebar
  useEffect(() => {
    setMobileSidebarOpen(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [location.pathname, setMobileSidebarOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const desktopLayoutClass =
    sidebarPosition === 'right'
      ? sidebarOpen
        ? 'lg:mr-64 lg:w-[calc(100%-16rem)] w-full'
        : 'w-full'
      : sidebarOpen
      ? 'lg:ml-64 lg:w-[calc(100%-16rem)] w-full'
      : 'w-full';

  return (
    <div id="admin-root-layout" className="min-h-screen bg-[#f8fafc] text-stone-900 relative admin-page-bg" style={{ backgroundColor: "#f8fafc" }}>
      {/* Unified Luxury Tooltip Provider for entire Admin Panel */}
      <GlobalTooltip />

      {/* Sleek Golden Shimmer Progress Bar across the top on menu transitions */}
      <CuteTopProgressBar />

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-[2px] lg:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div
        className={`admin-main-shell min-h-screen flex flex-col min-w-0 transition-[margin,width] duration-200 ${desktopLayoutClass}`}
      >
        <Header />

        {previewOwner && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <HiOutlineShieldCheck className="w-4 h-4 text-[#8b6f4e] shrink-0" />
              <span>
                Previewing Client Access: <strong className="font-bold">{previewOwner.name}</strong> ({Array.isArray(allowedModules) ? allowedModules.length : 0} modules enabled)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopOwnerPreview();
                navigate('/owners');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
              <span>Exit Client Preview</span>
            </button>
          </div>
        )}

        <main className="flex-1 min-w-0 w-full px-3 sm:px-5 py-2.5 sm:py-3.5 max-w-[1600px] mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<MinimalSuspenseFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
