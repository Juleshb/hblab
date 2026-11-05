import axios from 'axios';
import { isOfflineError, noteOffline, noteOnline } from './offline';
import { currentToken, unauthorized } from './session';

export function apiOrigin() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return String(configured).replace(/\/$/, '');
  return 'https://api.hblab.rw';
}

export const api = axios.create({
  baseURL: `${apiOrigin()}/api`,
});

api.interceptors.request.use((config) => {
  const token = currentToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    noteOnline();
    return response;
  },
  (error) => {
    if (isOfflineError(error)) noteOffline();
    const path = error?.config?.url || '';
    if (error?.response?.status === 401 && !path.includes('/auth/login')) unauthorized();
    return Promise.reject(error);
  },
);
