/**
 * Authentication Context for managing user state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, getAuthToken, verifyToken, getAuthUser, setAuthData, logout as oauthLogout } from './oauth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      const storedUser = getAuthUser();

      if (storedToken && storedUser) {
        // Verify token validity
        const verifiedUser = await verifyToken(storedToken);
        if (verifiedUser) {
          setToken(storedToken);
          setUser(verifiedUser);
        } else {
          // Token invalid, clear storage
          oauthLogout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleSetUser = (newUser: AuthUser | null) => {
    if (newUser) {
      setAuthData(newUser);
      setToken(newUser.token);
    } else {
      oauthLogout();
      setToken(null);
    }
    setUser(newUser);
  };

  const handleLogout = () => {
    oauthLogout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setUser: handleSetUser, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
