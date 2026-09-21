/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { getCachedUser, saveCachedUser, clearCachedUser } from '../db';
import { getInitials } from '../utils';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: authApi.LoginInput) => Promise<void>;
  register: (data: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync auth state on mount using HTTP-only cookie + PouchDB cache
  useEffect(() => {
    // One-time cleanup of legacy web storage keys (preserving active token)
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    async function initAuth() {
      // 1. Instantly load cached user from PouchDB if available
      const cachedUserObj = await getCachedUser();
      if (cachedUserObj) {
        const userWithInitials: User = {
          ...cachedUserObj,
          initials: cachedUserObj.initials || getInitials(cachedUserObj.name),
          color: cachedUserObj.color || 'from-indigo-600 to-violet-600',
        };
        setUser(userWithInitials);
        const storedToken = localStorage.getItem('token');
        setToken(storedToken || 'cookie-session');
      }

      // 2. Validate current session against backend via HTTP-only cookie / Bearer token
      try {
        const currentUser = await authApi.getMe();
        const userWithInitials: User = {
          ...cachedUserObj,
          ...currentUser,
          initials: currentUser.initials || cachedUserObj?.initials || getInitials(currentUser.name),
          color: currentUser.color || cachedUserObj?.color || 'from-indigo-600 to-violet-600',
        };
        setUser(userWithInitials);
        const storedToken = localStorage.getItem('token');
        setToken(storedToken || 'cookie-session');
        await saveCachedUser(userWithInitials);
      } catch (err: any) {
        const isAuthError =
          err?.status === 401 ||
          err?.status === 404 ||
          err?.code === 'NOT_FOUND' ||
          err?.code === 'NO_TOKEN' ||
          err?.code === 'TOKEN_EXPIRED' ||
          err?.code === 'BAD_TOKEN' ||
          err?.message?.includes('expired') ||
          err?.message?.includes('Unauthorized');

        if (isAuthError || !(await getCachedUser())) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          await clearCachedUser();
        }
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Central listener for 401 token expiration from client.ts or socketClient.ts
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      clearCachedUser();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (credentials: authApi.LoginInput) => {
    const result = await authApi.login(credentials);
    const cachedUserObj = await getCachedUser();
    const userWithInitials: User = {
      ...cachedUserObj,
      ...result.user,
      initials: result.user.initials || cachedUserObj?.initials || getInitials(result.user.name),
      color: result.user.color || cachedUserObj?.color || 'from-indigo-600 to-violet-600',
    };
    setUser(userWithInitials);
    const tokenVal = result.token || 'cookie-session';
    setToken(tokenVal);
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    await saveCachedUser(userWithInitials);
  };

  const register = async (data: authApi.RegisterInput) => {
    await authApi.register(data);
    // Do not log in automatically - redirect to login page for manual login
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      await clearCachedUser();
    }
  };

  const updateUser = async (updatedData: Partial<User>): Promise<User> => {
    let backendUser: User | null = null;
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;

    if (isOnline) {
      try {
        backendUser = await authApi.updateProfile({
          name: updatedData.name,
          email: updatedData.email,
          color: updatedData.color,
          avatar: updatedData.avatar,
          subscriptionPlan: updatedData.subscriptionPlan,
          billingCycle: updatedData.billingCycle,
        });
      } catch (err) {
        console.warn('[AuthContext] Failed to update user profile in DB:', err);
        throw err;
      }
    }

    const base: User = user || {
      id: 'usr-1',
      name: 'User',
      email: 'user@collabboard.io',
      initials: 'U',
      color: 'from-indigo-600 to-violet-600',
    };

    const source = backendUser || updatedData;
    const newName = source.name !== undefined ? source.name : base.name;
    const computedInitials =
      source.initials ||
      (newName ? getInitials(newName) : base.initials) ||
      'U';

    const nextUser: User = {
      ...base,
      ...source,
      name: newName,
      initials: computedInitials,
    };

    setUser(nextUser);
    await saveCachedUser(nextUser);
    return nextUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
