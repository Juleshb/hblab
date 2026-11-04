import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { isOfflineError, noteOffline, noteOnline } from './offline';
import { currentToken, unauthorized } from './session';

function packagerHost() {
  const raw = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = String(raw).split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

export function apiOrigin() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return String(configured).replace(/\/$/, '');
  const host = packagerHost();
  // A phone on the same Wi-Fi must call this computer, not its own localhost.
  // The Android emulator is the exception: it reaches the computer through 10.0.2.2.
  if (Platform.OS === 'android' && !Device.isDevice) return 'http://10.0.2.2:3000';
  if (host) return `http://${host}:3000`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const pageHost = window.location.hostname;
    if (pageHost && pageHost !== 'localhost' && pageHost !== '127.0.0.1') return `http://${pageHost}:3000`;
  }
  return 'http://localhost:3000';
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
