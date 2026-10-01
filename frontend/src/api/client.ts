import axios from 'axios';
import { getToken, clearToken } from '../utils/token-storage';

const client = axios.create({
  baseURL: '',
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    // `/admin/*` se autentica con `x-admin-key`, no con el JWT: su 401 es "clave incorrecta",
    // no una sesión vencida. Cerrar la sesión ahí sacaba al dueño al probar la clave en Configuración.
    const isAdminEndpoint = error.config?.url?.includes('/api/v1/admin/');
    if (error.response?.status === 401 && !isLoginEndpoint && !isAdminEndpoint) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default client;
