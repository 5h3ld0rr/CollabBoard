import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { getCachedUser, saveCachedUser, clearCachedUser } from '../db';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: authApi.LoginInput) => Promise<void>;
  register: (data: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync auth state on mount using HTTP-only cookie + PouchDB cache
  useEffect(() => {
    // One-time cleanup of any legacy web storage keys
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch {
      // Ignore if storage is inaccessible
    }

    async function initAuth() {
      // 1. Instantly load cached user from PouchDB if available
      try {
        const cachedUser = await getCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
          setToken('cookie-session');
        }
      } catch {
        // Fallback to network
      }

      // 2. Validate current session against backend via HTTP-only cookie
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        setToken('cookie-session');
        await saveCachedUser(currentUser);
      } catch {
        setUser(null);
        setToken(null);
        await clearCachedUser();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Central listener for 401 token expiration from client.ts
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      clearCachedUser();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (credentials: authApi.LoginInput) => {
    const result = await authApi.login(credentials);
    setUser(result.user);
    setToken(result.token || 'cookie-session');
    await saveCachedUser(result.user);
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
      await clearCachedUser();
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      const base: User = prev || {
        id: 'usr-1',
        name: 'Alex Chen',
        email: 'alex.chen@collabboard.io',
        initials: 'AC',
        color: 'from-indigo-600 to-violet-600',
      };

      const newName = updatedData.name !== undefined ? updatedData.name : base.name;
      const computedInitials =
        updatedData.initials ||
        (newName
          ? newName
              .split(' ')
              .filter(Boolean)
              .map((part) => part[0]?.toUpperCase())
              .slice(0, 2)
              .join('')
          : base.initials) ||
        'AC';

      const nextUser: User = {
        ...base,
        ...updatedData,
        name: newName,
        initials: computedInitials,
      };

      saveCachedUser(nextUser);
      return nextUser;
    });
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
