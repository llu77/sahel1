"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id?: number;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'manager';
  branch?: 'laban' | 'tuwaiq' | 'both' | 'headquarters';
  permissions?: {
    canViewRevenues: boolean;
    canEditRevenues: boolean;
    canViewExpenses: boolean;
    canEditExpenses: boolean;
    canViewBonus: boolean;
    canEditBonus: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canManageRequests: boolean;
    canCreateRequests: boolean;
    canApproveRequests: boolean;
    canManageProducts: boolean;
  };
  title?: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('sahl-auth-user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem('sahl-auth-user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
    if (!loading && user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('sahl-auth-user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    router.push('/');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sahl-auth-user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User };