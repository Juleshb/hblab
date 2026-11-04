import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../api';
import { startCall } from '../callSession';
import { Avatar, ErrorText, Notice } from '../components/ui';
import { apiError, formatChatTime } from '../format';
import { KeyboardScroll } from '../keyboard';
import { useLive } from '../live';
import { ConnectLoader, readCache, useOffline, writeCache } from '../offline';
import { colors } from '../theme';

export default function CallsScreen() {
  const router = useRouter();
  const { online } = useOffline();
  const [calls, setCalls] = useState(() => readCache('calls') || []);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const saved = readCache('calls');
    if (Array.isArray(saved)) setCalls((current) => (current.length ? current : saved));
    try {
      const response = await api.get('/hbms/calls');
      const rows = response.data.data || [];
      setCalls(rows);
      setError('');
      await writeCache('calls', rows);
    } catch (err) {
      if (!Array.isArray(saved)) setError(apiError(err, 'Could not load calls'));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useLive(useCallback((event) => {
    if (event.type === 'calls' || event.type === 'call') load();
  }, [load]));

  return (
    <KeyboardScroll
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      )}
    >
      <ErrorText>{error}</ErrorText>
      {calls.map((item) => (
        <View key={item.id} style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/thread/${item.conversationId}`)} style={styles.open}>
            <Avatar name={item.name} employeeId={item.employeeId} photoKey={item.photoKey} />
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons
                  name={item.video ? 'videocam' : 'call'}
                  size={14}
                  color={item.missed ? colors.danger : colors.accent}
                />
                <Ionicons
                  name={item.direction === 'outgoing' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={item.missed ? colors.danger : colors.accent}
                />
                <Text style={[styles.meta, item.missed && styles.missed]} numberOfLines={1}>{item.detail}</Text>
              </View>
            </View>
            <Text style={styles.time}>{formatChatTime(item.startedAt)}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.video ? `Video call ${item.name}` : `Audio call ${item.name}`}
            hitSlop={8}
            onPress={() => startCall({
              conversationId: item.conversationId,
              name: item.name,
              employeeId: item.employeeId,
              photoKey: item.photoKey,
            }, { video: Boolean(item.video) })}
            style={styles.call}
          >
            <Ionicons name={item.video ? 'videocam' : 'call'} size={20} color={colors.accent} />
          </Pressable>
        </View>
      ))}
      {!error && calls.length === 0 ? (
        online ? <Notice>Your audio and video calls show up here.</Notice> : <ConnectLoader />
      ) : null}
    </KeyboardScroll>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: 13, color: colors.muted },
  missed: { color: colors.danger, fontWeight: '700' },
  time: { fontSize: 12, color: colors.faint },
  call: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
