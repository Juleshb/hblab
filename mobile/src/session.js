import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hbms-token';

let memory = null;
let onUnauthorized = null;

function webStore() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function currentToken() {
  return memory;
}

export async function loadToken() {
  const web = webStore();
  memory = web ? web.getItem(KEY) : await AsyncStorage.getItem(KEY);
  return memory;
}

export async function saveToken(token) {
  memory = token || null;
  const web = webStore();
  if (web) {
    if (token) web.setItem(KEY, token);
    else web.removeItem(KEY);
    return;
  }
  if (token) await AsyncStorage.setItem(KEY, token);
  else await AsyncStorage.removeItem(KEY);
}

export function unauthorized() {
  if (onUnauthorized) onUnauthorized();
}
