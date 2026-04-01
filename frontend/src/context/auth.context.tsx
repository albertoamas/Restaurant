import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import type { UserRole } from '@pos/shared';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  branchId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentBranchId: string | null;
  setCurrentBranch: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pos_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(
    () => localStorage.getItem('pos_branch'),
  );
  const navigate = useNavigate();

  const applyUser = useCallback((u: AuthUser) => {
    setUser(u);
    if (u.branchId) {
      setCurrentBranchId(u.branchId);
    } else {
      const stored = localStorage.getItem('pos_branch');
      setCurrentBranchId(stored);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('pos_token');
    if (!stored) {
      setIsLoading(false);
      return;
    }
    authApi
      .getMe()
      .then(applyUser)
      .catch(() => {
        localStorage.removeItem('pos_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [applyUser]);

  const setCurrentBranch = useCallback((id: string) => {
    localStorage.setItem('pos_branch', id);
    setCurrentBranchId(id);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('pos_token', res.accessToken);
    setToken(res.accessToken);
    applyUser(res.user as AuthUser);
    navigate('/pos');
  }, [navigate, applyUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_branch');
    setToken(null);
    setUser(null);
    setCurrentBranchId(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, currentBranchId, setCurrentBranch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
