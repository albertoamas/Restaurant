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
    if (error.response?.status === 401 && !isLoginEndpoint) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default client;
