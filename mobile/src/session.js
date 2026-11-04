import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hbms-token';
const WELCOME_KEY = 'hbms-welcome-seen';

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

export async function loadWelcomeSeen() {
  const web = webStore();
  const value = web ? web.getItem(WELCOME_KEY) : await AsyncStorage.getItem(WELCOME_KEY);
  return value === '1';
}

export async function markWelcomeSeen() {
  const web = webStore();
  if (web) {
    web.setItem(WELCOME_KEY, '1');
    return;
  }
  await AsyncStorage.setItem(WELCOME_KEY, '1');
}

export function unauthorized() {
  if (onUnauthorized) onUnauthorized();
}
