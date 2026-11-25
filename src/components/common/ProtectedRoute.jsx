import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { isPathAllowed, getFirstAllowedPath } from '../../utils/moduleAccess';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading, allowedModules, dbModules, previewOwner, stopOwnerPreview } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-surface-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isPathAllowed(location.pathname, allowedModules, dbModules)) {
    const fallbackPath = getFirstAllowedPath(allowedModules, dbModules);
    if (fallbackPath && location.pathname === '/') {
      return <Navigate to={fallbackPath} replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-lg p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-[#8b6f4e] flex items-center justify-center">
            <HiOutlineLockClosed className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Module Access Restricted</h2>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              This module is not enabled for {previewOwner?.name || 'this client account'}. Only selected modules can be accessed.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {fallbackPath && (
              <button
                type="button"
                onClick={() => navigate(fallbackPath, { replace: true })}
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 transition-all cursor-pointer"
              >
                Open Allowed Module
              </button>
            )}
            {previewOwner && (
              <button
                type="button"
                onClick={() => {
                  stopOwnerPreview();
                  navigate('/owners', { replace: true });
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Exit Client Preview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
