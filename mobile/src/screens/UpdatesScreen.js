import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { ErrorText, Notice } from '../components/ui';
import { apiError, formatWhen, groupNotices, openNoticePath, sourceName, updateCountLabel } from '../format';
import { useLive } from '../live';
import { onSynced, readCache, writeCache } from '../offline';
import { colors, type } from '../theme';

const KIND_LABEL = {
  TASK_ASSIGNED: 'Assigned',
  TASK_UPDATED: 'Updated',
  DEADLINE: 'Deadline',
  MEETING: 'Meeting',
  ANNOUNCEMENT: 'News',
};

export default function UpdatesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const key = decodeURIComponent(String(id || ''));
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const saved = readCache('notifications');
    if (Array.isArray(saved)) {
      setGroup(groupNotices(saved).find((item) => item.key === key) || null);
    }
    try {
      const response = await api.get('/hbms/notifications');
      const rows = response.data.data || [];
      const found = groupNotices(rows).find((item) => item.key === key) || null;
      setGroup(found);
      await writeCache('notifications', rows);
      const unread = (found?.items || []).filter((item) => !item.readAt);
      unread.forEach((item) => {
        api.post(`/hbms/notifications/${item.id}/read`).catch(() => {});
      });
    } catch (err) {
      if (!Array.isArray(saved)) setError(apiError(err, 'Could not load these updates'));
    } finally {
      setLoaded(true);
    }
  }, [key]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => onSynced(() => load()), [load]);

  useLive(useCallback((event) => {
    if (event.type === 'inbox') load();
  }, [load]));

  const latest = group?.latest;
  const path = latest ? openNoticePath(latest) : null;
  const destination = path?.startsWith('/task/')
    ? 'Open task'
    : path?.startsWith('/meeting/')
      ? 'Open meeting'
      : path?.startsWith('/announcement/')
        ? 'Open announcement'
        : '';

  function openSource() {
    if (!path || !latest) return;
    if (String(latest.entityType || '').toLowerCase().includes('announcement')) {
      router.push({ pathname: '/announcement/[id]', params: { id: latest.entityId, title: sourceName(latest), body: latest.body || '' } });
      return;
    }
    router.push(path);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: group?.title || 'Updates' }} />
      <Text style={type.kicker}>{group ? updateCountLabel(group.items.length) : 'Updates'}</Text>
      <Text style={type.title}>{group?.title || 'Updates'}</Text>
      <ErrorText>{error}</ErrorText>
      {!loaded && !error ? <Notice>Loading updates…</Notice> : null}
      {loaded && !group && !error ? <Notice>These updates are no longer available.</Notice> : null}
      {group && destination ? (
        <Pressable accessibilityRole="button" onPress={openSource} style={styles.open}>
          <Text style={styles.openText}>{destination}</Text>
        </Pressable>
      ) : null}
      {(group?.items || []).map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.kind}>{KIND_LABEL[item.kind] || 'Update'}</Text>
            <Text style={styles.time}>{formatWhen(item.createdAt)}</Text>
          </View>
          <Text style={styles.body}>{item.body || sourceName(item)}</Text>
        </View>
      ))}
      {group && group.items.length === 0 ? <Notice>No updates for this item.</Notice> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  open: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  openText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  card: {
    marginTop: 12,
    backgroundColor: colors.chip,
    borderRadius: 16,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kind: { color: colors.accentDark, fontSize: 13, fontWeight: '700' },
  time: { color: colors.muted, fontSize: 12 },
  body: { marginTop: 6, color: colors.text, fontSize: 15, lineHeight: 21 },
});
