import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('payshield_token');
    const storedUser = localStorage.getItem('payshield_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('payshield_token');
        localStorage.removeItem('payshield_user');
      }
    }
  }, []);

  const login = (data: AuthResponse) => {
    const userObj: User = {
      userId: data.userId,
      email: data.email,
      role: data.role as 'CUSTOMER' | 'ADMIN',
      fullName: data.fullName,
    };
    localStorage.setItem('payshield_token', data.token);
    localStorage.setItem('payshield_user', JSON.stringify(userObj));
    setToken(data.token);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('payshield_token');
    localStorage.removeItem('payshield_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

