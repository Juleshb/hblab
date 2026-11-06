import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { api } from './api';
import { noteIncomingAction } from './callSession';
import { useAuth } from './auth';
import { subscribeLive } from './live';
import { currentToken } from './session';

let openConversationId = null;
const recentAlerts = new Map();

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

function alertKey(data) {
  if (!data) return '';
  return String(data.conversationId || data.entityId || data.callId || '');
}

function justAlerted(key) {
  const at = recentAlerts.get(key);
  return Boolean(key && at && Date.now() - at < 4000);
}

function markAlerted(key) {
  if (!key) return;
  recentAlerts.set(key, Date.now());
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
      const data = notification.request.content.data || {};
      const key = alertKey(data);
      if (data?.type === 'call') {
        const quiet = AppState.currentState === 'active';
        return {
          shouldShowBanner: !quiet,
          shouldShowList: true,
          shouldPlaySound: !quiet,
          shouldSetBadge: false,
          priority: Notifications.AndroidNotificationPriority.MAX,
        };
      }
      const conversationId = data?.conversationId;
      const hidden = conversationId && String(conversationId) === openConversationId;
      if (data.source === 'live') markAlerted(key);
      else if (justAlerted(key)) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
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
  if (!shouldAlert(event)) return;
  const path = event.type === 'message'
    ? `/thread/${event.conversationId}`
    : noticePath(event);
  const data = {
    source: 'live',
    path,
    conversationId: event.conversationId || null,
    entityType: event.entityType || null,
    entityId: event.entityId || null,
  };
  markAlerted(alertKey(data));
  await Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: event.body || '',
      sound: 'default',
      data,
    },
    trigger: Platform.OS === 'android' ? { channelId: 'default' } : null,
  });
}

async function registerPushToken() {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) return;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!token?.data) return;
  await api.post('/hbms/devices', { token: token.data, platform: Platform.OS });
}

export function enableAlerts(openPath) {
  let cancelled = false;
  const received = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === 'call') {
      const action = response.actionIdentifier === 'decline' ? 'decline' : 'accept';
      noteIncomingAction(String(data.callId || ''), action);
      return;
    }
    const path = noticePath(data);
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
      await Notifications.setNotificationChannelAsync('calls', {
        name: 'Calls',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 450, 250, 450, 250, 800],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        enableVibrate: true,
      });
    }
    await Notifications.setNotificationCategoryAsync('incoming-call', [
      {
        identifier: 'accept',
        buttonTitle: 'Accept',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'decline',
        buttonTitle: 'Decline',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);
    const permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
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
      return undefined;
    }
    const stop = enableAlerts((path) => router.push(path));
    const resume = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerPushToken().catch(() => {});
    });
    return () => {
      resume.remove();
      stop();
    };
  }, [token, router]);
  return null;
}
