import { api } from './api';

const cache = new Map();
const inflight = new Map();
const listeners = new Set();

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
  notify();
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

export function loadPhoto(employeeId, photoKey) {
  if (!employeeId || !photoKey) return;
  const key = `${employeeId}:${photoKey}`;
  if (cache.has(key) || inflight.has(key)) return;
  const job = api.get(`/hbms/employees/${employeeId}/photo`, { responseType: 'arraybuffer' })
    .then((response) => {
      const type = response.headers?.['content-type'] || 'image/jpeg';
      cache.set(key, `data:${String(type).split(';')[0]};base64,${toBase64(bytesFrom(response.data))}`);
      notify();
    })
    .catch(() => {})
    .finally(() => inflight.delete(key));
  inflight.set(key, job);
}
