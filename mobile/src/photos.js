import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const STORE = 'hbms-photos';
const cache = new Map();
const saved = new Map();
const inflight = new Map();
const listeners = new Set();
let persistTimer = null;

function webStore() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage;
  return null;
}

async function readStored() {
  const web = webStore();
  const raw = web ? web.getItem(STORE) : await AsyncStorage.getItem(STORE);
  return raw ? JSON.parse(raw) : null;
}

async function writeStored() {
  const payload = JSON.stringify(Object.fromEntries(saved));
  const web = webStore();
  if (web) {
    web.setItem(STORE, payload);
    return;
  }
  await AsyncStorage.setItem(STORE, payload);
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    writeStored().catch(() => {});
  }, 300);
}

export async function preparePhotos() {
  try {
    const parsed = await readStored();
    if (!parsed || typeof parsed !== 'object') return;
    Object.entries(parsed).forEach(([key, uri]) => {
      if (typeof uri !== 'string' || !uri) return;
      saved.set(key, uri);
      cache.set(key, uri);
    });
    notify();
  } catch {
    /* a missing photo store just means pictures load from the network */
  }
}

export async function clearPhotos() {
  cache.clear();
  saved.clear();
  clearTimeout(persistTimer);
  notify();
  const web = webStore();
  if (web) {
    web.removeItem(STORE);
    return;
  }
  await AsyncStorage.removeItem(STORE);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribePhotos(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function photoUri(employeeId, photoKey) {
  if (!employeeId || !photoKey) return null;
  return cache.get(`${employeeId}:${photoKey}`) || null;
}

export function forgetPhoto(employeeId) {
  if (!employeeId) return;
  const prefix = `${employeeId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of saved.keys()) {
    if (key.startsWith(prefix)) saved.delete(key);
  }
  notify();
  schedulePersist();
}

function keepPhoto(key, uri) {
  cache.set(key, uri);
  saved.delete(key);
  saved.set(key, uri);
  while (saved.size > 40) {
    const oldest = saved.keys().next().value;
    saved.delete(oldest);
    cache.delete(oldest);
  }
  notify();
  schedulePersist();
}

function bytesFrom(data) {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (typeof data === 'string') {
    const bytes = new Uint8Array(data.length);
    for (let index = 0; index < data.length; index += 1) bytes[index] = data.charCodeAt(index) & 0xff;
    return bytes;
  }
  return new Uint8Array();
}

function toBase64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += chars[(triple >> 18) & 63];
    out += chars[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[triple & 63] : '=';
  }
  return out;
}

export function fetchPhoto(employeeId, photoKey) {
  if (!employeeId || !photoKey) return Promise.resolve(null);
  const key = `${employeeId}:${photoKey}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  const existing = inflight.get(key);
  if (existing) return existing;
  const job = api.get(`/hbms/employees/${employeeId}/photo`, { responseType: 'arraybuffer' })
    .then((response) => {
      const type = response.headers?.['content-type'] || 'image/jpeg';
      const uri = `data:${String(type).split(';')[0]};base64,${toBase64(bytesFrom(response.data))}`;
      keepPhoto(key, uri);
      return uri;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

export function loadPhoto(employeeId, photoKey) {
  fetchPhoto(employeeId, photoKey);
}
