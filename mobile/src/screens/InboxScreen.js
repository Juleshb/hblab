import { useCallback, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../api';
import { setInboxBadge } from '../badges';
import { Chip, ErrorText, ListRow, Notice, ScreenIntro } from '../components/ui';
import { apiError, formatChatTime, groupNotices, noticeGroup, updateCountLabel } from '../format';
import { useLive } from '../live';
import { colors, frame } from '../theme';

const FILTERS = ['All', 'Tasks', 'Meetings', 'News'];

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/hbms/notifications');
      const rows = response.data.data || [];
      setNotices(rows);
      setInboxBadge(groupNotices(rows).reduce((sum, group) => sum + group.unread, 0));
    } catch (err) {
      setError(apiError(err, 'Could not load notifications'));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useLive(useCallback((event) => {
    if (event.type === 'inbox') load();
  }, [load]));

  const visible = useMemo(() => {
    const groups = groupNotices(notices);
    if (filter === 'All') return groups;
    return groups.filter((group) => noticeGroup(group.kind) === filter);
  }, [notices, filter]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView
      contentContainerStyle={[styles.content, Platform.OS === 'ios' && { paddingBottom: insets.bottom + 108 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.accent} />}
    >
      <ScreenIntro title="Updates" kicker="Tasks, meetings, and news" />
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Chip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      {visible.map((group) => (
        <ListRow
          key={group.key}
          title={group.title}
          meta={`${noticeGroup(group.kind)} · ${updateCountLabel(group.items.length)}`}
          trailing={formatChatTime(group.createdAt)}
          unread={group.unread}
          count={group.items.length}
          onPress={() => router.push(`/updates/${encodeURIComponent(group.key)}`)}
        />
      ))}
      {!error && visible.length === 0 ? <Notice>No updates in this view.</Notice> : null}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...frame, padding: 16, paddingBottom: 32 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
});
