import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { colors } from './theme';

const KEY = 'hbms-offline';
const listeners = new Set();

let ready = false;
let online = true;
let cache = {};
let outbox = [];
let flushing = false;
let revision = 0;
let retryTimer = null;
let catchUpTimer = null;
const syncListeners = new Set();

function webStore() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage;
  return null;
}

function emit() {
  revision += 1;
  listeners.forEach((listener) => listener());
}

async function persist() {
  const payload = JSON.stringify({ cache, outbox });
  const web = webStore();
  if (web) {
    web.setItem(KEY, payload);
    return;
  }
  await AsyncStorage.setItem(KEY, payload);
}

export function isOfflineError(error) {
  if (error?.response) return false;
  const message = String(error?.message || '');
  const code = String(error?.code || '');
  return code === 'ERR_NETWORK'
    || code === 'ECONNABORTED'
    || message === 'Network Error'
    || message === 'Network request failed'
    || /network|timeout|failed to fetch|internet/i.test(message);
}

export async function prepareOffline() {
  if (ready) return;
  try {
    const web = webStore();
    const raw = web ? web.getItem(KEY) : await AsyncStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) : null;
    cache = saved?.cache && typeof saved.cache === 'object' ? saved.cache : {};
    outbox = Array.isArray(saved?.outbox) ? saved.outbox : [];
  } catch {
    cache = {};
    outbox = [];
  }
  ready = true;
  emit();
}

export function readCache(key) {
  return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
}

export async function writeCache(key, value) {
  cache = { ...cache, [key]: value };
  emit();
  await persist();
}

export async function clearOffline() {
  cache = {};
  outbox = [];
  emit();
  const web = webStore();
  if (web) {
    web.removeItem(KEY);
    return;
  }
  await AsyncStorage.removeItem(KEY);
}

export function pendingMessages(conversationId) {
  return outbox.filter((item) => String(item.conversationId) === String(conversationId));
}

export function decorateConversations(rows) {
  return (rows || []).map((row) => {
    const waiting = pendingMessages(row.id);
    if (!waiting.length) return row;
    const last = waiting[waiting.length - 1];
    return {
      ...row,
      lastBody: last.audio ? 'Voice message' : last.body,
      lastAt: last.createdAt,
      pending: true,
    };
  });
}

export function mergePending(thread, conversationId) {
  if (!thread) return thread;
  const waiting = pendingMessages(conversationId);
  if (!waiting.length) return thread;
  const known = new Set((thread.messages || []).map((message) => message.id));
  const extras = waiting.filter((item) => !known.has(item.localId)).map((item) => ({
    id: item.localId,
    body: item.body || '',
    audio: item.audio ? { url: item.audio.uri, duration: item.audio.duration || 0 } : null,
    mine: true,
    pending: true,
    forwarded: Boolean(item.forwarded),
    createdAt: item.createdAt,
    reactions: [],
    author: 'You',
    receipt: null,
  }));
  return { ...thread, messages: [...(thread.messages || []), ...extras] };
}

export async function queueMessage(item) {
  outbox = [...outbox, item];
  emit();
  await persist();
}

export function networkOnline() {
  return online;
}

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (online) return;
    syncListeners.forEach((listener) => listener([]));
    flushOutbox(true);
  }, 3000);
}

function requestCatchUp() {
  clearTimeout(catchUpTimer);
  catchUpTimer = setTimeout(() => {
    catchUpTimer = null;
    try {
      require('./live').reconnectLive();
    } catch {
      /* the live socket connects again on the next signed-in session */
    }
    syncListeners.forEach((listener) => listener([]));
    if (!flushing) flushOutbox();
  }, 200);
}

export function noteOffline() {
  const changed = online;
  online = false;
  if (changed) emit();
  scheduleRetry();
}

export function noteOnline() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  const was = online;
  online = true;
  if (!was) {
    emit();
    requestCatchUp();
    return;
  }
  if (!flushing) flushOutbox();
}

export function subscribeOffline(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOffline() {
  const [, setTick] = useState(revision);
  useEffect(() => subscribeOffline(() => setTick(revision)), []);
  return { online, pending: outbox.length, revision };
}

export function OfflineBanner() {
  const { online: connected, pending } = useOffline();
  if (connected && !pending) return null;
  return (
    <View style={styles.banner}>
      <ActivityIndicator size="small" color={colors.muted} />
      <Text style={styles.bannerText}>{connected ? 'Sending' : 'Connecting'}</Text>
    </View>
  );
}

export function ConnectLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.bannerText}>Connecting</Text>
    </View>
  );
}

async function flushOutbox(force = false) {
  if (flushing || (!online && !force) || !outbox.length) return;
  flushing = true;
  const { api } = require('./api');
  const sent = [];
  try {
    for (const item of [...outbox]) {
      try {
        if (item.audio) {
          let form;
          try {
            form = await require('./components/voice').voiceForm(item.audio, item);
          } catch {
            outbox = outbox.filter((row) => row.localId !== item.localId);
            emit();
            await persist();
            continue;
          }
          await api.post(`/hbms/conversations/${item.conversationId}/voice`, form);
        } else {
          await api.post(`/hbms/conversations/${item.conversationId}/messages`, {
            body: item.body,
            replyToId: item.replyToId || undefined,
            asDepartment: Boolean(item.asDepartment),
            forwarded: Boolean(item.forwarded),
          });
        }
        sent.push(String(item.conversationId));
        outbox = outbox.filter((row) => row.localId !== item.localId);
        emit();
        await persist();
      } catch (error) {
        if (isOfflineError(error)) {
          online = false;
          emit();
          break;
        }
        outbox = outbox.filter((row) => row.localId !== item.localId);
        emit();
        await persist();
      }
    }
  } finally {
    flushing = false;
  }
  if (sent.length) {
    const ids = [...new Set(sent)];
    syncListeners.forEach((listener) => listener(ids));
  }
  if (online && outbox.length) flushOutbox();
}

export function onSynced(listener) {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

export function startOffline() {
  let stopped = false;
  prepareOffline().then(() => {
    if (!stopped) flushOutbox();
  });
  const unsubscribe = NetInfo.addEventListener((state) => {
    const connected = state.isConnected !== false && state.isInternetReachable !== false;
    if (connected) noteOnline();
    else noteOffline();
  });
  const app = AppState.addEventListener('change', (next) => {
    if (next === 'active') requestCatchUp();
  });
  return () => {
    stopped = true;
    unsubscribe();
    app.remove();
  };
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: colors.chip,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: { color: colors.muted, fontSize: 14 },
  loader: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
});
