import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../common/ErrorBoundary';

const AdminLayout = () => {
  const location = useLocation();
  const {
    sidebarOpen,
    sidebarPosition,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useTheme();

  // Reset body and html overflow on route change to ensure page scroll is never stuck
  useEffect(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [location.pathname]);

  const desktopMarginClass =
    sidebarPosition === 'right'
      ? sidebarOpen
        ? 'lg:mr-64 lg:ml-0'
        : 'lg:mr-0 lg:ml-0'
      : sidebarOpen
      ? 'lg:ml-64 lg:mr-0'
      : 'lg:ml-0 lg:mr-0';

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 selection:bg-[#8b6f4e] selection:text-white">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div
        className={`min-h-screen flex flex-col ${desktopMarginClass}`}
      >
        <Header />

        <main className="flex-1 px-3 sm:px-5 py-2 max-w-[1600px] w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
