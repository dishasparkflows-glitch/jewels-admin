import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, ownersAPI } from '../api/services';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

function readPreviewOwner() {
  try {
    const raw = sessionStorage.getItem('previewOwner');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [previewOwner, setPreviewOwner] = useState(() => readPreviewOwner());
  const [envOwnerAccess, setEnvOwnerAccess] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);

      // If Vite is configured for a specific owner deployment, fetch its allowed modules
      const envOwnerId = import.meta.env.VITE_OWNER_ID;
      if (envOwnerId) {
        try {
          const accessRes = await ownersAPI.getAccess({ ownerId: envOwnerId });
          if (accessRes.data?.data?.restricted) {
            setEnvOwnerAccess(accessRes.data.data);
          }
        } catch {
          // Ignore access fetch failure
        }
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('previewOwner');
    sessionStorage.removeItem('previewOwnerId');
    setToken(null);
    setUser(null);
    setPreviewOwner(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const startOwnerPreview = useCallback((owner) => {
    if (!owner?._id) return;
    const summary = {
      _id: owner._id,
      name: owner.name,
      allowedModules: Array.isArray(owner.allowedModules) ? owner.allowedModules : [],
    };
    sessionStorage.setItem('previewOwner', JSON.stringify(summary));
    sessionStorage.setItem('previewOwnerId', owner._id);
    setPreviewOwner(summary);
  }, []);

  const stopOwnerPreview = useCallback(() => {
    sessionStorage.removeItem('previewOwner');
    sessionStorage.removeItem('previewOwnerId');
    setPreviewOwner(null);
  }, []);

  // Determine effective allowedModules: null means unrestricted full admin access
  const allowedModules = useMemo(() => {
    if (previewOwner) {
      return Array.isArray(previewOwner.allowedModules) ? previewOwner.allowedModules : [];
    }
    if (user?.ownerAccess?.restricted) {
      return Array.isArray(user.ownerAccess.allowedModules) ? user.ownerAccess.allowedModules : [];
    }
    if (Array.isArray(user?.allowedModules)) {
      return user.allowedModules;
    }
    if (envOwnerAccess?.restricted) {
      return Array.isArray(envOwnerAccess.allowedModules) ? envOwnerAccess.allowedModules : [];
    }
    return null;
  }, [previewOwner, user, envOwnerAccess]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser: fetchUser,
        allowedModules,
        previewOwner,
        startOwnerPreview,
        stopOwnerPreview,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
