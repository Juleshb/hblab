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
let heardAt = 0;

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
  next.onopen = () => {
    heardAt = Date.now();
    if (next.readyState === 1) next.send(JSON.stringify({ type: 'ping' }));
  };
  next.onmessage = (message) => {
    heardAt = Date.now();
    try {
      const event = JSON.parse(message.data);
      if (event?.type === 'ping' || event?.type === 'pong') return;
      if (event?.type === 'call') emit(event);
      else schedule(event);
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

export function reconnectLive() {
  if (!active) return;
  clearTimeout(retry);
  const previous = socket;
  socket = null;
  if (previous) {
    previous.onclose = null;
    previous.onerror = null;
    previous.close();
  }
  connect();
}

export function startLive() {
  active = true;
  reconnectLive();
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

export function sendLive(event) {
  if (!socket || socket.readyState !== 1) return false;
  socket.send(JSON.stringify(event));
  return true;
}

export function liveOpen() {
  return socket?.readyState === 1;
}

export function subscribeLive(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLive(listener) {
  useEffect(() => subscribeLive(listener), [listener]);
}

setInterval(() => {
  if (!active) return;
  if (!socket || socket.readyState !== 1) {
    connect();
    return;
  }
  if (Date.now() - heardAt > 25000) {
    reconnectLive();
    return;
  }
  try {
    socket.send(JSON.stringify({ type: 'ping' }));
  } catch {
    reconnectLive();
  }
}, 12000);

AppState.addEventListener('change', (state) => {
  if (state === 'active' && active) reconnectLive();
});
