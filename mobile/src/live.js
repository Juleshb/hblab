import { useEffect } from 'react';
import { AppState } from 'react-native';
import { apiOrigin } from './api';
import { forgetPhoto } from './photos';
import { currentToken } from './session';

const listeners = new Set();
let socket = null;
let retry = null;
let active = false;
let queue = [];
let flushTimer = null;

function emit(event) {
  if (event?.type === 'profile' && event.employeeId) forgetPhoto(event.employeeId);
  listeners.forEach((listener) => listener(event));
}

function schedule(event) {
  queue.push(event);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    const batch = queue;
    queue = [];
    batch.forEach(emit);
  }, 120);
}

function connect() {
  const token = currentToken();
  if (!active || !token) return;
  if (socket && (socket.readyState === 0 || socket.readyState === 1)) return;
  const origin = apiOrigin().replace(/^http/, 'ws');
  const next = new WebSocket(`${origin}/api/hbms/live?token=${encodeURIComponent(token)}`);
  socket = next;
  next.onmessage = (message) => {
    try {
      schedule(JSON.parse(message.data));
    } catch {
      /* ignore a malformed live event */
    }
  };
  next.onclose = () => {
    if (socket === next) socket = null;
    if (active) retry = setTimeout(connect, 2000);
  };
  next.onerror = () => next.close();
}

export function startLive() {
  active = true;
  clearTimeout(retry);
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
  connect();
}

export function stopLive() {
  active = false;
  clearTimeout(retry);
  clearTimeout(flushTimer);
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

export function subscribeLive(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLive(listener) {
  useEffect(() => subscribeLive(listener), [listener]);
}

AppState.addEventListener('change', (state) => {
  if (state === 'active' && active) connect();
});
