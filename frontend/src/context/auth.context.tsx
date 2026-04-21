import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useSettingsStore } from '../store/settings.store';
import type { UserRole, SaasPlan, PlanLimits } from '@pos/shared';

interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
  orderNumberResetPeriod?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  branchId: string | null;
  modules?: TenantModules;
  plan?: SaasPlan;
  planLimits?: PlanLimits;
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
  refreshUser: () => Promise<void>;
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

  const {
    setOrdersEnabled,
    setCashEnabled,
    setTeamEnabled,
    setBranchesEnabled,
    setKitchenEnabled,
    setRafflesEnabled,
    setOrderNumberResetPeriod,
    setTenantLogo,
    setBusinessAddress,
    setBusinessPhone,
    setReceiptSlogan,
    setPlan,
    setPlanLimits,
  } = useSettingsStore();

  /** Apply server-controlled module flags to the settings store */
  const applyModules = useCallback((modules?: TenantModules) => {
    if (!modules) return;
    setOrdersEnabled(modules.ordersEnabled);
    setCashEnabled(modules.cashEnabled);
    setTeamEnabled(modules.teamEnabled);
    setBranchesEnabled(modules.branchesEnabled);
    setKitchenEnabled(modules.kitchenEnabled);
    setRafflesEnabled(modules.rafflesEnabled ?? false);
    if (modules.orderNumberResetPeriod) {
      setOrderNumberResetPeriod(modules.orderNumberResetPeriod as import('@pos/shared').OrderNumberResetPeriod);
    }
  }, [setOrdersEnabled, setCashEnabled, setTeamEnabled, setBranchesEnabled, setKitchenEnabled, setRafflesEnabled, setOrderNumberResetPeriod]);

  const applyUser = useCallback((u: AuthUser) => {
    setUser(u);
    if (u.branchId) {
      setCurrentBranchId(u.branchId);
    } else {
      const stored = localStorage.getItem('pos_branch');
      setCurrentBranchId(stored);
    }
    applyModules(u.modules);
    const ext = u as AuthUser & {
      tenantLogo?: string | null;
      tenantAddress?: string | null;
      tenantPhone?: string | null;
      tenantSlogan?: string | null;
    };
    setTenantLogo(ext.tenantLogo ?? null);
    setBusinessAddress(ext.tenantAddress ?? '');
    setBusinessPhone(ext.tenantPhone ?? '');
    setReceiptSlogan(ext.tenantSlogan ?? '');
    if (u.plan)       setPlan(u.plan);
    if (u.planLimits) setPlanLimits(u.planLimits);
  }, [applyModules, setTenantLogo, setBusinessAddress, setBusinessPhone, setReceiptSlogan, setPlan, setPlanLimits]);

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
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_branch');
    setToken(null);
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
