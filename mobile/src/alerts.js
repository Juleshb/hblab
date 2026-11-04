import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { api } from './api';
import { useAuth } from './auth';
import { subscribeLive } from './live';
import { currentToken } from './session';

let openConversationId = null;
let pushReady = false;

export function setOpenConversation(id) {
  openConversationId = id ? String(id) : null;
}

function signedInUserId() {
  const token = currentToken();
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const base = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded));
    return json.userId || null;
  } catch {
    return null;
  }
}

function noticePath(data) {
  if (!data) return null;
  if (data.path) return String(data.path);
  if (data.conversationId) return `/thread/${data.conversationId}`;
  const type = String(data.entityType || '').toLowerCase();
  if (!data.entityId) return null;
  if (type.includes('task')) return `/task/${data.entityId}`;
  if (type.includes('meeting')) return `/meeting/${data.entityId}`;
  if (type.includes('announcement')) return `/announcement/${data.entityId}`;
  return null;
}

function shouldAlert(event) {
  if (!event?.title) return false;
  if (event.kind === 'CONVERSATION') return false;
  const me = signedInUserId();
  if (event.authorUserId && me && Number(event.authorUserId) === Number(me)) return false;
  if (event.conversationId && String(event.conversationId) === openConversationId) return false;
  return event.type === 'message' || event.type === 'inbox';
}

try {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const conversationId = notification.request.content.data?.conversationId;
      const hidden = conversationId && String(conversationId) === openConversationId;
      return {
        shouldShowBanner: !hidden,
        shouldShowList: !hidden,
        shouldPlaySound: !hidden,
        shouldSetBadge: false,
      };
    },
  });
} catch {
  /* notifications are unavailable on this platform */
}

async function present(event) {
  if (!shouldAlert(event) || pushReady) return;
  const path = event.type === 'message'
    ? `/thread/${event.conversationId}`
    : noticePath(event);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: event.body || '',
      sound: 'default',
      data: {
        path,
        conversationId: event.conversationId || null,
      },
    },
    trigger: null,
  });
}

async function registerPushToken() {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  if (!token?.data) return;
  await api.post('/hbms/devices', { token: token.data, platform: Platform.OS });
  pushReady = true;
}

export function enableAlerts(openPath) {
  let cancelled = false;
  const received = Notifications.addNotificationResponseReceivedListener((response) => {
    const path = noticePath(response.notification.request.content.data);
    if (path) openPath(path);
  });
  const live = subscribeLive((event) => {
    present(event).catch(() => {});
  });
  (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    const permission = await Notifications.requestPermissionsAsync();
    if (cancelled || permission.status !== 'granted') return;
    await registerPushToken().catch(() => {});
  })().catch(() => {});
  return () => {
    cancelled = true;
    received.remove();
    live();
  };
}

export function Alerts() {
  const router = useRouter();
  const { token } = useAuth();
  useEffect(() => {
    if (!token) {
      pushReady = false;
      return undefined;
    }
    return enableAlerts((path) => router.push(path));
  }, [token, router]);
  return null;
}
