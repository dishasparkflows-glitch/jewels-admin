import { useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../common/ErrorBoundary';
import CuteLoader from '../common/CuteLoader';
import CuteTopProgressBar from '../common/CuteTopProgressBar';

const AdminLayout = () => {
  const location = useLocation();
  const {
    sidebarOpen,
    sidebarPosition,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useTheme();

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
      {/* Sleek Golden Shimmer Progress Bar across the top on menu transitions */}
      <CuteTopProgressBar />

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div
        className={`min-h-screen flex flex-col min-w-0 transition-[margin,width] duration-200 ${desktopLayoutClass}`}
      >
        <Header />

        <main className="flex-1 min-w-0 w-full px-3 sm:px-5 py-2.5 sm:py-3.5 max-w-[1600px] mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<CuteLoader text="Loading view..." />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
