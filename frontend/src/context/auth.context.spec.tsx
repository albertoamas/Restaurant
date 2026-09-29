import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import { AuthProvider, useAuth } from './auth.context';

const mocks = vi.hoisted(() => ({
  getMe:      vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../api/auth.api', () => ({ authApi: { getMe: mocks.getMe, login: vi.fn() } }));
vi.mock('../utils/token-storage', () => ({
  getToken:   () => 'token-guardado',
  setToken:   vi.fn(),
  clearToken: mocks.clearToken,
}));

const USER = { id: 'u1', name: 'Cajero', email: 'c@demo.com', role: 'CASHIER', tenantId: 't1', tenantName: 'Demo', branchId: 'b1' };

function httpError(status: number) {
  return new AxiosError('fail', 'ERR', undefined, undefined, {
    status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
  });
}

const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK');

function Probe() {
  const { isLoading, isAuthenticated } = useAuth();
  return <div>{isLoading ? 'cargando' : isAuthenticated ? 'autenticado' : 'anonimo'}</div>;
}

// Mismos future flags que BrowserRouter en main.tsx.
const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

const renderAuth = () => render(
  <MemoryRouter future={ROUTER_FUTURE}><AuthProvider><Probe /></AuthProvider></MemoryRouter>,
);

describe('AuthProvider — validación de la sesión guardada', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.getMe.mockReset();
    mocks.clearToken.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('con la sesión válida queda autenticado', async () => {
    mocks.getMe.mockResolvedValue(USER);
    renderAuth();
    await act(async () => {});
    expect(screen.getByText('autenticado')).toBeInTheDocument();
  });

  it('si el servidor rechaza el token (401) cierra la sesión', async () => {
    mocks.getMe.mockRejectedValue(httpError(401));
    renderAuth();
    await act(async () => {});
    expect(mocks.clearToken).toHaveBeenCalled();
    expect(screen.getByText('anonimo')).toBeInTheDocument();
  });

  it('sin red NO cierra la sesión: sigue cargando y reintenta hasta recuperarla', async () => {
    mocks.getMe.mockRejectedValueOnce(networkError()).mockResolvedValue(USER);
    renderAuth();
    await act(async () => {});

    expect(mocks.clearToken).not.toHaveBeenCalled();
    expect(screen.getByText('cargando')).toBeInTheDocument();

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(screen.getByText('autenticado')).toBeInTheDocument();
  });

  it('con el backend caído (502) tampoco cierra la sesión', async () => {
    mocks.getMe.mockRejectedValue(httpError(502));
    renderAuth();
    await act(async () => {});
    expect(mocks.clearToken).not.toHaveBeenCalled();
  });

  it('al volver la conexión reintenta sin esperar el temporizador', async () => {
    mocks.getMe.mockRejectedValueOnce(networkError()).mockResolvedValue(USER);
    renderAuth();
    await act(async () => {});

    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(screen.getByText('autenticado')).toBeInTheDocument();
  });
});
