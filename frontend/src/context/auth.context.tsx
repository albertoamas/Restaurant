import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useSettingsStore, type ServerConfig } from '../store/settings.store';
import { getToken, setToken, clearToken } from '../utils/token-storage';
import type { UserRole, SaasPlan, PlanLimits, OrderNumberResetPeriod } from '@pos/shared';

interface TenantModules {
  ordersEnabled:           boolean;
  cashEnabled:             boolean;
  teamEnabled:             boolean;
  branchesEnabled:         boolean;
  kitchenEnabled:          boolean;
  rafflesEnabled:          boolean;
  orderNumberResetPeriod?: string;
}

interface AuthUser {
  id:          string;
  name:        string;
  email:       string;
  role:        UserRole;
  tenantId:    string;
  tenantName:  string;
  branchId:    string | null;
  modules?:    TenantModules;
  plan?:       SaasPlan;
  planLimits?: PlanLimits;
}

/** Extended shape returned by GET /auth/me (includes branding fields). */
type AuthUserFull = AuthUser & {
  tenantLogo?:    string | null;
  tenantAddress?: string | null;
  tenantPhone?:   string | null;
  tenantSlogan?:  string | null;
};

interface AuthContextType {
  user:             AuthUser | null;
  token:            string | null;
  isAuthenticated:  boolean;
  isLoading:        boolean;
  currentBranchId:  string | null;
  setCurrentBranch: (id: string) => void;
  login:            (email: string, password: string, remember: boolean) => Promise<void>;
  logout:           () => void;
  refreshUser:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [token, setTokenState]    = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(
    () => localStorage.getItem('pos_branch'),
  );
  const navigate = useNavigate();
  const { applyServerConfig } = useSettingsStore();

  /** Applies user data + server-controlled store values after login / getMe. */
  const applyUser = useCallback((raw: AuthUser) => {
    const u = raw as AuthUserFull;
    setUser(u);

    if (u.branchId) {
      setCurrentBranchId(u.branchId);
    } else {
      setCurrentBranchId(localStorage.getItem('pos_branch'));
    }

    const config: ServerConfig = {
      ordersEnabled:          u.modules?.ordersEnabled          ?? true,
      cashEnabled:            u.modules?.cashEnabled            ?? true,
      teamEnabled:            u.modules?.teamEnabled            ?? true,
      branchesEnabled:        u.modules?.branchesEnabled        ?? true,
      kitchenEnabled:         u.modules?.kitchenEnabled         ?? false,
      rafflesEnabled:         u.modules?.rafflesEnabled         ?? false,
      orderNumberResetPeriod: u.modules?.orderNumberResetPeriod as OrderNumberResetPeriod | undefined,
      tenantLogo:             u.tenantLogo    ?? null,
      businessAddress:        u.tenantAddress ?? '',
      businessPhone:          u.tenantPhone   ?? '',
      receiptSlogan:          u.tenantSlogan  ?? '',
      plan:                   u.plan,
      planLimits:             u.planLimits,
    };
    applyServerConfig(config);
  }, [applyServerConfig]);

  useEffect(() => {
    const stored = getToken();
    if (!stored) { setIsLoading(false); return; }
    authApi
      .getMe()
      .then(applyUser)
      .catch(() => {
        clearToken();
        setTokenState(null);
      })
      .finally(() => setIsLoading(false));
  }, [applyUser]);

  const setCurrentBranch = useCallback((id: string) => {
    localStorage.setItem('pos_branch', id);
    setCurrentBranchId(id);
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await authApi.login({ email, password });
    setToken(res.accessToken, remember);
    setTokenState(res.accessToken);
    applyUser(res.user as AuthUser);
    navigate('/pos');
  }, [navigate, applyUser]);

  const refreshingRef = useRef(false);
  const refreshUser = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const u = await authApi.getMe();
      applyUser(u as AuthUser);
    } catch {
      // Silently ignore — token may have expired; don't force logout on background refresh
    } finally {
      refreshingRef.current = false;
    }
  }, [applyUser]);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('pos_branch');
    setTokenState(null);
    setUser(null);
    setCurrentBranchId(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      currentBranchId,
      setCurrentBranch,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
